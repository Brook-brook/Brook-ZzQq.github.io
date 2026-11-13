# frozen_string_literal: true

# Real Jekyll read/generate/render/cleanup/write fixtures. This runner uses Ruby's
# standard library only; Minitest is not a dependency of the existing build.
require "fileutils"
require "tmpdir"
require "yaml"
require "json"
require "jekyll"
require_relative "../_plugins/atlas-note-publication"
require_relative "../_plugins/learning-path-validation"
require_relative "../_plugins/observatory-validation"
require_relative "../_plugins/site-search-index"
require_relative "../_plugins/evaluation-data-validation"
require_relative "../_plugins/spatial-data-validation"
require_relative "../_plugins/practice-prompt-validation"
require_relative "../_plugins/knowledge-connections"
require_relative "../_plugins/retrieval-data-validation"

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
      "date" => "2026-11-04", "category" => "Synthetic fixtures", "summary" => "Synthetic public summary"
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

    check("optional learning focus is bounded public text, not a coerced value") do
      ["Read the request status", 42, "", "x" * 401].each do |focus|
        with_fixture do |source, destination|
          note(source, "legacy")
          FileUtils.mkdir_p(File.join(source, "_data"))
          path = [{ "id" => "route", "title" => "Fixture", "summary" => "Learning",
                    "steps" => [{ "id" => "first", "title" => "Read", "note" => "legacy",
                                  "question" => "Explain?", "focus" => focus }] }]
          File.write(File.join(source, "_data", "learning_paths.yml"), YAML.dump(path))
          if focus == "Read the request status"
            site = build(source, destination)
            assert(site.data["learning_paths"][0]["steps"][0]["focus"] == focus, "valid focus retained")
          else
            begin
              build(source, destination)
              assert(false, "invalid focus must fail before rendering")
            rescue Jekyll::Errors::FatalException => error
              assert(error.message.include?("learning_paths.yml"), "identify invalid focus")
            end
          end
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

    check("automatic bibliography validates real bundled metadata before any no-JS rendering") do
      with_fixture do |source, destination|
        FileUtils.mkdir_p(File.join(source, "_data"))
        %w[observatory_feeds observatory_stream].each do |name|
          FileUtils.cp(File.expand_path("../_data/#{name}.json", __dir__), File.join(source, "_data", "#{name}.json"))
        end
        site = build(source, destination)
        assert(site.data["observatory_stream"]["latest"].length > 0, "real metadata snapshot should build")
      end
    end

    check("automatic bibliography rejects off-source, unsafe, duplicate and fake-reviewed records before output") do
      %w[host unsafe duplicate review date].each do |mode|
        with_fixture do |source, destination|
          FileUtils.mkdir_p(File.join(source, "_data"))
          FileUtils.cp(File.expand_path("../_data/observatory_feeds.json", __dir__), File.join(source, "_data", "observatory_feeds.json"))
          data = JSON.parse(File.read(File.expand_path("../_data/observatory_stream.json", __dir__)))
          row = data["latest"][0]
          row["url"] = "https://off-source.test/paper" if mode == "host"
          row["url"] = "javascript:alert(1)" if mode == "unsafe"
          data["latest"] << row if mode == "duplicate"
          row["review_status"] = "source_checked" if mode == "review"
          row["first_seen_at"] = "2026-02-30T00:00:00Z" if mode == "date"
          File.write(File.join(source, "_data", "observatory_stream.json"), JSON.dump(data))
          begin
            build(source, destination)
            assert(false, "invalid automatic metadata #{mode} must fail")
          rescue Jekyll::Errors::FatalException => error
            assert(error.message.include?("observatory_stream.json"), "identify automatic snapshot validation failure")
          end
        end
      end
    end

    check("reading guides link published method notes with three accurate topic slots") do
      with_fixture do |source, destination|
        %w[reading-ai-evidence reading-world-evidence].each { |slug| note(source, slug) }
        FileUtils.mkdir_p(File.join(source, "_data"))
        FileUtils.cp(File.expand_path("../_data/reading_guides.yml", __dir__), File.join(source, "_data", "reading_guides.yml"))
        site = build(source, destination)
        assert(site.data["reading_guides"].length == 3, "real reading guides should build")
      end
    end

    check("reading guides reject missing/duplicate topics, oversized outlines and unpublished methods") do
      %w[missing duplicate oversize unpublished].each do |mode|
        with_fixture do |source, destination|
          note(source, "reading-ai-evidence", mode == "unpublished" ? { "published" => false } : {})
          note(source, "reading-world-evidence")
          data = YAML.safe_load(File.read(File.expand_path("../_data/reading_guides.yml", __dir__)))
          data[0].delete("id") if mode == "missing"
          data[0]["id"] = "politics" if mode == "duplicate"
          data[0]["outline"] = "【研读提纲｜" + "字" * 1200 if mode == "oversize"
          FileUtils.mkdir_p(File.join(source, "_data"))
          File.write(File.join(source, "_data", "reading_guides.yml"), YAML.dump(data))
          begin
            build(source, destination)
            assert(false, "invalid guide #{mode} must fail before rendering")
          rescue Jekyll::Errors::FatalException => error
            assert(error.message.include?("reading_guides.yml"), "identify invalid guide #{mode}")
          end
        end
      end
    end

    check("public search excludes drafts and unchecked research, including --unpublished") do
      with_fixture do |source, destination|
        FileUtils.mkdir_p(File.join(source, "_data"))
        File.write(File.join(source, "_data", "site_search.yml"), "entries: []\n")
        File.write(File.join(source, "search.json"), "---\nlayout: null\n---\n{{ site.data.search_index | jsonify }}")
        note(source, "tutorial")
        note(source, "checked", source_checked)
        note(source, "pending", { "kind" => "research", "review_status" => "needs_review" })
        note(source, "draft", { "draft" => true })
        note(source, "unpublished", { "published" => false })
        site = build(source, destination, unpublished: true)
        records = JSON.parse(File.read(File.join(destination, "search.json"))).fetch("entries")
        assert(records.length == 2, "only public tutorial and checked research enter search")
        assert(records.all? { |r| r["url"].start_with?("/Brook-ZzQq.github.io/knowledge/") }, "search links retain baseurl")
        assert(records.none? { |r| r.values.join.include?("Content marker:") }, "search stores metadata, not bodies")
        absent_everywhere(site, destination, %w[pending draft unpublished])
        note(source, "checked", source_checked({ "review_status" => "needs_review" }))
        build(source, destination, unpublished: true)
        records = JSON.parse(File.read(File.join(destination, "search.json"))).fetch("entries")
        assert(records.length == 1 && records[0]["title"] == "Fixture tutorial", "demotion removes stale search records on rebuild")
      end
    end

    check("search fails closed on unsafe or duplicate configured public entries") do
      ["//evil.test/x", "/../outside", "/valid"].each do |url|
        with_fixture do |source, destination|
          FileUtils.mkdir_p(File.join(source, "_data"))
          entry = { "kind" => "page", "title" => "Fixture", "summary" => "Public entry", "url" => url }
          entries = url == "/valid" ? [entry, entry] : [entry]
          File.write(File.join(source, "_data", "site_search.yml"), YAML.dump({ "entries" => entries }))
          begin
            build(source, destination)
            assert(false, "unsafe or duplicate search entries must fail")
          rescue Jekyll::Errors::FatalException => error
            assert(error.message.include?("site search"), "identify search configuration failure")
          end
        end
      end
    end

    check("evaluation teaching fixture builds with its declared labels and original scores") do
      with_fixture do |source, destination|
        FileUtils.mkdir_p(File.join(source, "_data"))
        FileUtils.cp(File.expand_path("../_data/evaluation_samples.json", __dir__), File.join(source, "_data", "evaluation_samples.json"))
        site = build(source, destination)
        assert(site.data["evaluation_samples"]["samples"].length == 20, "public synthetic fixture is available after validation")
      end
    end

    check("evaluation rejects unsafe/duplicate samples, impossible scores and misleading cohort labels") do
      %w[schema duplicate score ratio title].each do |mode|
        with_fixture do |source, destination|
          data = JSON.parse(File.read(File.expand_path("../_data/evaluation_samples.json", __dir__)))
          data["schema_version"] = 2 if mode == "schema"
          data["samples"][1]["id"] = data["samples"][0]["id"] if mode == "duplicate"
          data["samples"][0]["score"] = 101 if mode == "score"
          data["samples"][0]["labels"]["rare"] = 0 if mode == "ratio"
          data["scenarios"]["rare"] = "" if mode == "title"
          FileUtils.mkdir_p(File.join(source, "_data"))
          File.write(File.join(source, "_data", "evaluation_samples.json"), JSON.generate(data))
          begin
            build(source, destination)
            assert(false, "invalid evaluation data must fail")
          rescue Jekyll::Errors::FatalException => error
            assert(error.message.include?("evaluation_samples.json"), "identify invalid teaching fixture")
            assert(!File.exist?(File.join(destination, "index.html")), "invalid data fails before writing")
          end
        end
      end
    end

    check("spatial synthetic source builds with exactly four bounded blocks") do
      with_fixture do |source, destination|
        FileUtils.mkdir_p(File.join(source, "_data"))
        FileUtils.cp(File.expand_path("../_data/spatial_samples.json", __dir__), File.join(source, "_data", "spatial_samples.json"))
        site = build(source, destination)
        assert(site.data["spatial_samples"]["points"].length == 80, "validated original points are available")
      end
    end

    check("spatial source rejects malformed coordinates, blocks, labels and identity before writing") do
      %w[schema id coordinate block label unit].each do |mode|
        with_fixture do |source, destination|
          data = JSON.parse(File.read(File.expand_path("../_data/spatial_samples.json", __dir__)))
          data["schema_version"] = 2 if mode == "schema"
          data["points"][1]["id"] = data["points"][0]["id"] if mode == "id"
          data["points"][0]["x"] = 801 if mode == "coordinate"
          data["points"][0]["block"] = 3 if mode == "block"
          data["points"][0]["labels"]["zones"] = 2 if mode == "label"
          data["unit"] = "EPSG:4326" if mode == "unit"
          FileUtils.mkdir_p(File.join(source, "_data"))
          File.write(File.join(source, "_data", "spatial_samples.json"), JSON.generate(data))
          begin
            build(source, destination)
            assert(false, "invalid spatial source must fail")
          rescue Jekyll::Errors::FatalException => error
            assert(error.message.include?("spatial_samples.json"), "identify invalid spatial source")
            assert(!File.exist?(File.join(destination, "index.html")), "invalid spatial data fails before output")
          end
        end
      end
    end

    check("practice references require exactly the public permanent step IDs") do
      with_fixture do |source, destination|
        note(source, "legacy")
        FileUtils.mkdir_p(File.join(source, "_data"))
        path = [{ "id" => "route", "title" => "Fixture", "summary" => "Learning",
                  "steps" => [{ "id" => "first", "title" => "Read", "note" => "legacy", "question" => "Explain?" }] }]
        prompt = { "first" => { "hint" => "Original hint", "explanation" => "Original reference", "counterexample" => "A limitation" } }
        File.write(File.join(source, "_data", "learning_paths.yml"), YAML.dump(path))
        File.write(File.join(source, "_data", "practice_prompts.yml"), YAML.dump(prompt))
        site = build(source, destination)
        assert(site.data["practice_prompts"].keys == ["first"], "reference maps to a public question")
      end
    end

    check("practice rejects unknown/missing IDs, empty/oversized references and extra generated fields") do
      %w[unknown missing empty oversized extra].each do |mode|
        with_fixture do |source, destination|
          note(source, "legacy")
          FileUtils.mkdir_p(File.join(source, "_data"))
          path = [{ "id" => "route", "title" => "Fixture", "summary" => "Learning",
                    "steps" => [{ "id" => "first", "title" => "Read", "note" => "legacy", "question" => "Explain?" }] }]
          prompt = { "first" => { "hint" => "Original hint", "explanation" => "Original reference", "counterexample" => "A limitation" } }
          prompt["unknown"] = prompt["first"].dup if mode == "unknown"
          prompt.delete("first") if mode == "missing"
          prompt["first"]["hint"] = "" if mode == "empty"
          prompt["first"]["explanation"] = "x" * 2001 if mode == "oversized"
          prompt["first"]["grade"] = 100 if mode == "extra"
          File.write(File.join(source, "_data", "learning_paths.yml"), YAML.dump(path))
          File.write(File.join(source, "_data", "practice_prompts.yml"), YAML.dump(prompt))
          begin
            build(source, destination)
            assert(false, "invalid reference must fail")
          rescue Jekyll::Errors::FatalException => error
            assert(error.message.include?("practice_prompts.yml"), "identify invalid public reference")
            assert(!File.exist?(File.join(destination, "index.html")), "invalid references fail before writing")
          end
        end
      end
    end

    check("practice references run after publication and route validation") do
      with_fixture do |source, destination|
        note(source, "pending", "kind" => "research", "review_status" => "needs_review")
        FileUtils.mkdir_p(File.join(source, "_data"))
        path = [{ "id" => "route", "title" => "Fixture", "summary" => "Learning",
                  "steps" => [{ "id" => "first", "title" => "Read", "note" => "pending", "question" => "Explain?" }] }]
        prompt = { "first" => { "hint" => "Original hint", "explanation" => "Reference", "counterexample" => "Limit" } }
        File.write(File.join(source, "_data", "learning_paths.yml"), YAML.dump(path))
        File.write(File.join(source, "_data", "practice_prompts.yml"), YAML.dump(prompt))
        begin
          build(source, destination, unpublished: true)
          assert(false, "references must not bypass publication checks")
        rescue Jekyll::Errors::FatalException => error
          assert(error.message.include?("learning_paths.yml"), "public route validation runs first")
          assert(!File.exist?(page_path(destination, "pending")), "unverified research remains unwritten")
        end
      end
    end

    check("knowledge connections derive bounded metadata after public-note pruning") do
      with_fixture do |source, destination|
        note(source, "first")
        note(source, "second", "lab_url" => "/playground/#geo")
        note(source, "hidden", "published" => false)
        note(source, "draft", "draft" => true)
        note(source, "pending", "kind" => "research", "review_status" => "needs_review")
        FileUtils.mkdir_p(File.join(source, "_data"))
        config = { "schema_version" => 1, "ai_assisted" => true, "links" => [
          { "id" => "first-second", "from" => "first", "to" => "second", "kind" => "prepare", "reason" => "Original bounded suggestion" }
        ] }
        File.write(File.join(source, "_data", "knowledge_connections.yml"), YAML.dump(config))
        site = build(source, destination, unpublished: true)
        model = site.data["knowledge_model"]
        assert(model["notes"].map { |n| n["id"] } == %w[first second], "only public endpoints enter metadata")
        assert(model["notes"][0]["url"] == "/Brook-ZzQq.github.io/knowledge/first/", "project prefix is retained")
        assert(model["notes"][1]["lab_url"] == "/Brook-ZzQq.github.io/playground/#geo", "actual optional lab is retained")
        assert(model["notes"][0]["lab_url"].nil?, "reading-only note never gets a fake lab")
        assert(!JSON.generate(model).include?("Content marker"), "public bodies are not indexed")
        assert(!JSON.generate(model).include?("hidden"), "private title never enters graph metadata")
      end
    end

    check("knowledge edges cannot bypass publication, including --unpublished") do
      %w[hidden pending missing].each do |target|
        with_fixture do |source, destination|
          note(source, "first")
          note(source, "hidden", "published" => false)
          note(source, "pending", "kind" => "research", "review_status" => "needs_review")
          FileUtils.mkdir_p(File.join(source, "_data"))
          config = { "schema_version" => 1, "ai_assisted" => true, "links" => [
            { "id" => "bad-endpoint", "from" => "first", "to" => target, "kind" => "extend", "reason" => "No publication bypass" }
          ] }
          File.write(File.join(source, "_data", "knowledge_connections.yml"), YAML.dump(config))
          begin
            build(source, destination, unpublished: true)
            assert(false, "private or missing endpoint must fail")
          rescue Jekyll::Errors::FatalException => error
            assert(error.message.include?("knowledge_connections.yml"), "identify graph configuration")
            assert(!File.exist?(File.join(destination, "index.html")), "fail before public output")
          end
        end
      end
    end

    check("knowledge malformed editorial fields fail before output") do
      %w[schema disclosure duplicate pair self kind reason extra unsafe_lab].each do |mode|
        with_fixture do |source, destination|
          note(source, "first", "lab_url" => mode == "unsafe_lab" ? "javascript:alert(1)" : nil)
          note(source, "second")
          link = { "id" => "first-second", "from" => "first", "to" => "second", "kind" => "prepare", "reason" => "Original reason" }
          config = { "schema_version" => 1, "ai_assisted" => true, "links" => [link] }
          config["schema_version"] = 2 if mode == "schema"
          config["ai_assisted"] = "yes" if mode == "disclosure"
          config["links"] << link.dup if mode == "duplicate"
          config["links"] << link.merge("id" => "reverse", "from" => "second", "to" => "first") if mode == "pair"
          link["to"] = "first" if mode == "self"
          link["kind"] = "mastery" if mode == "kind"
          link["reason"] = "x" * 401 if mode == "reason"
          link["confidence"] = 1 if mode == "extra"
          FileUtils.mkdir_p(File.join(source, "_data"))
          File.write(File.join(source, "_data", "knowledge_connections.yml"), YAML.dump(config))
          begin
            build(source, destination)
            assert(false, "invalid graph must fail")
          rescue Jekyll::Errors::FatalException => error
            assert(error.message.include?("knowledge_connections.yml"), "identify malformed graph")
            assert(!File.exist?(File.join(destination, "index.html")), "invalid graph is unwritten")
          end
        end
      end
    end

    check("knowledge demotion removes old metadata and output on a valid rebuild") do
      with_fixture do |source, destination|
        note(source, "first")
        note(source, "second")
        FileUtils.mkdir_p(File.join(source, "_data"))
        file = File.join(source, "_data", "knowledge_connections.yml")
        File.write(file, YAML.dump({ "schema_version" => 1, "ai_assisted" => true, "links" => [
          { "id" => "link", "from" => "first", "to" => "second", "kind" => "extend", "reason" => "A suggestion" }
        ] }))
        build(source, destination)
        assert(File.exist?(page_path(destination, "second")), "public note initially exists")
        note(source, "second", "published" => false)
        File.write(file, YAML.dump({ "schema_version" => 1, "ai_assisted" => true, "links" => [] }))
        site = build(source, destination, unpublished: true)
        assert(site.data["knowledge_model"]["notes"].map { |n| n["id"] } == ["first"], "metadata removes demoted note")
        assert(!File.exist?(page_path(destination, "second")), "normal Jekyll cleanup removes old direct output")
      end
    end

    check("retrieval fixture renders complete versioned source and original annotations") do
      with_fixture do |source, destination|
        FileUtils.mkdir_p(File.join(source, "_data"))
        fixture = File.read(File.expand_path("../_data/retrieval_samples.json", __dir__))
        File.write(File.join(source, "_data", "retrieval_samples.json"), fixture)
        File.write(File.join(source, "retrieval.html"), "---\n---\n{% for f in site.data.retrieval_samples.fragments %}<p>{{ f.text | escape }}</p>{% endfor %}")
        site = build(source, destination)
        data = site.data["retrieval_samples"]
        assert(data["documents"].length == 4 && data["fragments"].length == 8, "original fixture identity")
        assert(data["tasks"].last["relevant_ids"].nil?, "free search has no inferred annotations")
        output = File.read(File.join(destination, "retrieval.html"))
        assert(output.include?("只适用于正式空间"), "whole scope statement survives rendering")
        assert(data["tasks"][0]["relevant_ids"] == %w[b-retention-trial c-retention-full], "explicit version/task reference is preserved")
      end
    end

    check("retrieval invalid IDs, references, bounds and fields fail before public output") do
      %w[duplicate reference version extra oversize terms].each do |mode|
        with_fixture do |source, destination|
          FileUtils.mkdir_p(File.join(source, "_data"))
          data = JSON.parse(File.read(File.expand_path("../_data/retrieval_samples.json", __dir__)))
          data["fragments"] << data["fragments"][0].dup if mode == "duplicate"
          data["tasks"][0]["relevant_ids"] << "unknown" if mode == "reference"
          data["documents"][0]["version"] = "latest" if mode == "version"
          data["fragments"][0]["private_url"] = "https://unused.test" if mode == "extra"
          data["fragments"][0]["text"] = "x" * 1501 if mode == "oversize"
          data["tasks"][0]["query"] = "a b c d e f g" if mode == "terms"
          File.write(File.join(source, "_data", "retrieval_samples.json"), JSON.generate(data))
          begin
            build(source, destination)
            assert(false, "invalid retrieval fixture must fail")
          rescue Jekyll::Errors::FatalException => error
            assert(error.message.include?("retrieval_samples.json"), "identify the actual invalid fixture")
            assert(!File.exist?(File.join(destination, "index.html")), "bad source fails before public writing")
          end
        end
      end
    end

    puts "#{@failures.empty? ? 'PASS' : 'FAIL'} study publication: #{@cases} cases, #{@assertions} assertions, #{@failures.length} failures"
    exit(@failures.empty? ? 0 : 1)
  end
end

StudyPublicationChecks.new.run
