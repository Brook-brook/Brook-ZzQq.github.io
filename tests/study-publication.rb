# frozen_string_literal: true

# Real Jekyll read/generate/render/cleanup/write fixtures. This runner uses Ruby's
# standard library only; Minitest is not a dependency of the existing build.
require "fileutils"
require "tmpdir"
require "yaml"
require "jekyll"
require_relative "../_plugins/atlas-note-publication"
require_relative "../_plugins/learning-path-validation"
require_relative "../_plugins/observatory-validation"

# A generator runs after :site/:post_read, just as an index/sitemap generator
# would. Its written output must never receive filtered research documents.
class StudyPublicationFixtureSitemap < Jekyll::Generator
  safe true
  priority :lowest

  def generate(site)
    return unless site.config["study_publication_fixture"]

    page = Jekyll::PageWithoutAFile.new(site, site.source, "", "fixture-sitemap.txt")
    page.data["layout"] = nil
    page.content = site.collections.fetch("atlas_notes").docs.map(&:url).join("\n")
    site.pages << page
  end
end

class StudyPublicationChecks
  def initialize
    @assertions = 0
    @cases = 0
    @failures = []
  end

  def check(name)
    @cases += 1
    yield
    puts "PASS #{name}"
  rescue StandardError => error
    @failures << name
    warn "FAIL #{name}: #{error.class}: #{error.message}"
    warn error.backtrace.first(5).join("\n")
  end

  def assert(condition, message)
    @assertions += 1
    raise message unless condition
  end

  def source_checked(overrides = {})
    {
      "kind" => "research", "review_status" => "source_checked",
      "source_repo" => "https://github.com/example/research-fixture",
      "source_commit" => "a" * 40, "analyzed_at" => "2026-11-03",
      "reviewed_at" => "2026-11-04", "ai_assisted" => true,
      "sources" => [{ "title" => "Synthetic source fixture",
                      "url" => "https://example.test/source" }]
    }.merge(overrides)
  end

  def with_fixture
    Dir.mktmpdir("atlas-study-publication-") do |root|
      source = File.join(root, "source")
      destination = File.join(root, "output")
      FileUtils.mkdir_p(File.join(source, "_atlas_notes"))
      FileUtils.mkdir_p(File.join(source, "_layouts"))
      File.write(File.join(source, "_layouts", "note.html"),
                 "<!doctype html><title>{{ page.title }}</title><h1>{{ page.title }}</h1>{{ content }}")
      File.write(File.join(source, "index.html"), <<~LIQUID)
        ---
        ---
        <!doctype html><title>Publication fixture</title>
        {% for note in site.atlas_notes %}<a href="{{ note.url | relative_url }}">{{ note.title }}</a>{% endfor %}
        {% assign preview = site.atlas_notes | where: 'slug', 'pending' | first %}
        {% if preview %}<aside id="pending-preview">{{ preview.title }}</aside>{% endif %}
        {% assign checked = site.atlas_notes | where: 'slug', 'checked' | first %}
        {% if checked %}<aside id="checked-preview">{{ checked.title }}</aside>{% endif %}
      LIQUID
      yield source, destination
    end
  end

  def note(source, slug, extra = {})
    data = {
      "layout" => "note", "title" => "Fixture #{slug}", "slug" => slug,
      "date" => "2026-11-04", "category" => "Synthetic fixtures"
    }.merge(extra)
    yaml = YAML.dump(data).sub(/\A---\s*\n/, "")
    File.write(File.join(source, "_atlas_notes", "#{slug}.md"),
               "---\n#{yaml}---\n\nContent marker: #{slug}.\n")
  end

  def build(source, destination, unpublished: false)
    config = Jekyll.configuration(
      "config" => [], "source" => source, "destination" => destination,
      "plugins" => [], "plugins_dir" => [], "theme" => nil,
      "collections" => { "atlas_notes" => { "output" => true,
                                              "permalink" => "/knowledge/:name/" } },
      "baseurl" => "/Brook-ZzQq.github.io", "url" => "https://example.test",
      "unpublished" => unpublished, "quiet" => true, "incremental" => false,
      "study_publication_fixture" => true
    )
    Jekyll::Site.new(config).tap(&:process)
  end

  def page_path(destination, slug)
    File.join(destination, "knowledge", slug, "index.html")
  end

  def absent_everywhere(site, destination, slugs)
    published = site.collections.fetch("atlas_notes").docs.map { |doc| doc.data["slug"] }
    index = File.read(File.join(destination, "index.html"))
    sitemap = File.read(File.join(destination, "fixture-sitemap.txt"))
    slugs.each do |slug|
      assert(!published.include?(slug), "#{slug} leaked into the collection")
      assert(!index.include?("Fixture #{slug}"), "#{slug} leaked into the index")
      assert(!sitemap.include?("/knowledge/#{slug}/"), "#{slug} leaked into a generator")
      assert(!File.exist?(page_path(destination, slug)), "#{slug} has a direct output route")
    end
  end

  def expect_invalid(extra)
    with_fixture do |source, destination|
      note(source, "invalid", source_checked(extra))
      error = begin
        build(source, destination)
        nil
      rescue Jekyll::Errors::FatalException => caught
        caught
      end
      assert(!error.nil?, "invalid publication metadata should fail the build")
      assert(error.message.include?("_atlas_notes/invalid.md"), "failure must identify the source note")
      assert(!File.exist?(page_path(destination, "invalid")), "failed build wrote the invalid note")
    end
  end

  def run
    check("legacy tutorial and checked research render through real Jekyll") do
      with_fixture do |source, destination|
        note(source, "legacy", "lab_url" => "/playground/python/")
        note(source, "checked", source_checked("ai_assisted" => false))
        site = build(source, destination)
        assert(site.collections.fetch("atlas_notes").docs.length == 2, "both valid notes must survive")
        %w[legacy checked].each do |slug|
          assert(File.read(page_path(destination, slug)).include?("Content marker: #{slug}"), "#{slug} was not rendered")
          assert(File.read(File.join(destination, "fixture-sitemap.txt")).include?("/knowledge/#{slug}/"), "#{slug} missing from generator")
        end
        index = File.read(File.join(destination, "index.html"))
        assert(index.include?("/Brook-ZzQq.github.io/knowledge/legacy/"), "project baseurl not applied")
        assert(index.include?('id="checked-preview"'), "valid notebook lookup failed")
      end
    end

    check("research without source checking stays absent, including --unpublished") do
      [false, true].each do |unpublished|
        with_fixture do |source, destination|
          note(source, "legacy")
          note(source, "pending", "kind" => "research", "review_status" => "needs_review")
          note(source, "no-status", "kind" => "research")
          note(source, "wrong-status", source_checked("review_status" => "reviewed"))
          site = build(source, destination, unpublished: unpublished)
          absent_everywhere(site, destination, %w[pending no-status wrong-status])
          assert(!File.read(File.join(destination, "index.html")).include?("pending-preview"), "notebook contains a hidden research preview")
          assert(File.exist?(page_path(destination, "legacy")), "legacy tutorial regressed")
        end
      end
    end

    check("explicit unpublished and draft notes stay absent under --unpublished") do
      with_fixture do |source, destination|
        note(source, "private", source_checked("published" => false))
        note(source, "draft", source_checked("draft" => true))
        note(source, "legacy-private", "published" => false)
        site = build(source, destination, unpublished: true)
        absent_everywhere(site, destination, %w[private draft legacy-private])
      end
    end

    check("checked research with missing commit fails before output") do
      expect_invalid("source_commit" => nil)
    end

    check("credential-bearing source URLs cannot be marked checked") do
      expect_invalid("sources" => [{ "title" => "Invalid fixture", "url" => "https://name:password@example.test/source" }])
    end

    check("source-check dates must follow analysis dates") do
      expect_invalid("reviewed_at" => "2026-11-02")
    end

    check("AI assistance must be explicit boolean metadata") do
      expect_invalid("ai_assisted" => "false")
    end

    check("a misspelled research kind cannot bypass source checking") do
      expect_invalid("kind" => "RESEARCH", "review_status" => "needs_review",
                     "source_commit" => nil)
    end

    check("quoted published and draft flags cannot accidentally publish notes") do
      %w[published draft].each do |key|
        expect_invalid(key => "false")
      end
    end

    check("demoting research removes stale output on the same destination") do
      with_fixture do |source, destination|
        note(source, "checked", source_checked)
        build(source, destination)
        assert(File.exist?(page_path(destination, "checked")), "first build should write checked research")
        note(source, "checked", source_checked("review_status" => "needs_review"))
        site = build(source, destination)
        absent_everywhere(site, destination, ["checked"])
        assert(!File.read(File.join(destination, "index.html")).include?("checked-preview"), "stale notebook preview remains")
      end
    end

    check("learning routes reference public notes and require unique stable IDs") do
      with_fixture do |source, destination|
        note(source, "legacy")
        FileUtils.mkdir_p(File.join(source, "_data"))
        path = [{ "id" => "route", "title" => "Real fixture route", "summary" => "Learning",
                  "steps" => [{ "id" => "first", "title" => "Read", "note" => "legacy", "question" => "Explain?" }] }]
        data_file = File.join(source, "_data", "learning_paths.yml")
        File.write(data_file, YAML.dump(path))
        site = build(source, destination)
        assert(site.collections.fetch("atlas_notes").docs.length == 1, "valid route should preserve notes")
        path[0]["steps"][0]["id"] = "route"
        File.write(data_file, YAML.dump(path))
        begin
          build(source, destination)
          assert(false, "duplicate route/step IDs must fail")
        rescue Jekyll::Errors::FatalException => error
          assert(error.message.include?("learning_paths.yml"), "identify invalid route data")
        end
      end
    end

    check("learning routes cannot link research removed by publication checks") do
      with_fixture do |source, destination|
        note(source, "pending", "kind" => "research", "review_status" => "needs_review")
        FileUtils.mkdir_p(File.join(source, "_data"))
        path = [{ "id" => "route", "title" => "Fixture", "summary" => "Learning",
                  "steps" => [{ "id" => "first", "title" => "Read", "note" => "pending", "question" => "Explain?" }] }]
        File.write(File.join(source, "_data", "learning_paths.yml"), YAML.dump(path))
        begin
          build(source, destination, unpublished: true)
          assert(false, "route to unpublished research must fail")
        rescue Jekyll::Errors::FatalException
          assert(!File.exist?(page_path(destination, "pending")), "hidden research must remain absent")
        end
      end
    end

    check("observatory validates its source catalog and fails unsafe links before output") do
      with_fixture do |source, destination|
        data = YAML.safe_load(File.read(File.expand_path("../_data/observatory.yml", __dir__)))
        FileUtils.mkdir_p(File.join(source, "_data"))
        data_file = File.join(source, "_data", "observatory.yml")
        File.write(data_file, YAML.dump(data))
        site = build(source, destination)
        assert(site.data["observatory"]["sources"].length == 18, "real source catalog should build")
        data["sources"][0]["url"] = "https://name:password@example.test/source"
        File.write(data_file, YAML.dump(data))
        begin
          build(source, destination)
          assert(false, "credential-bearing catalog links must fail")
        rescue Jekyll::Errors::FatalException => error
          assert(error.message.include?("observatory.yml"), "identify invalid source catalog")
        end
      end
    end

    check("observatory rejects broken reading references and invalid verification dates") do
      ["reference", "date", "duplicate"].each do |mode|
        with_fixture do |source, destination|
          data = YAML.safe_load(File.read(File.expand_path("../_data/observatory.yml", __dir__)))
          data["briefings"][0]["source_id"] = "missing" if mode == "reference"
          data["checked_on"] = "2026-02-30" if mode == "date"
          data["briefings"][0]["id"] = data["sources"][0]["id"] if mode == "duplicate"
          FileUtils.mkdir_p(File.join(source, "_data"))
          File.write(File.join(source, "_data", "observatory.yml"), YAML.dump(data))
          begin
            build(source, destination)
            assert(false, "invalid catalog #{mode} must fail")
          rescue Jekyll::Errors::FatalException => error
            assert(error.message.include?("observatory.yml"), "catalog #{mode} should report validation failure")
          end
        end
      end
    end

    puts "#{@failures.empty? ? 'PASS' : 'FAIL'} study publication: #{@cases} cases, #{@assertions} assertions, #{@failures.length} failures"
    exit(@failures.empty? ? 0 : 1)
  end
end

StudyPublicationChecks.new.run
