# frozen_string_literal: true

require "digest"
require "json"
require "uri"

class AtlasSearchIndex < Jekyll::Generator
  safe false
  priority :low

  def generate(site)
    config = site.data["site_search"]
    return if config.nil?

    fail! unless config.is_a?(Hash) && config["entries"].is_a?(Array)
    prefix = site.config["baseurl"].to_s.sub(%r{/\z}, "")
    records = []
    add = lambda do |kind, title, summary, url, keywords, detail, featured = false|
      fail! unless %w[note path lab project page].include?(kind) &&
        [title, summary, detail].all? { |text| text.is_a?(String) && !text.strip.empty? } &&
        url.is_a?(String) && url.start_with?("/") && !url.start_with?("//") &&
        !url.include?("\\") && !url.match?(/[[:cntrl:][:space:]]|%2f|%5c|%2e/i) && [true, false].include?(featured)
      begin
        parsed = URI.parse(url)
        fail! if parsed.host || parsed.scheme || parsed.path.split("/").include?("..")
      rescue URI::InvalidURIError
        fail!
      end
      href = prefix + url
      records << { "id" => "#{kind}-#{Digest::SHA256.hexdigest(href)[0, 16]}", "kind" => kind,
        "title" => title.strip, "summary" => summary.strip.gsub(/\s+/, " "), "url" => href,
        "keywords" => Array(keywords).join(" ").gsub(/\s+/, " "), "detail" => detail, "featured" => featured }
    end
    site.collections.fetch("atlas_notes").docs.each do |note|
      data = note.data
      add.call("note", data["title"], data["summary"], note.url,
        [data["category"], *Array(data["tags"]), note.basename_without_ext],
        "#{data["kind"] == "research" ? "项目研究" : "实验室教程"} · #{data["category"]}")
    end
    Array(site.data["learning_paths"]).each do |path|
      add.call("path", path["title"], path["summary"], "/study/paths/##{path["id"]}",
        [path["prerequisite"], path["challenge"], *path["steps"].map { |step| step["title"] }],
        "学习路线 · #{path["steps"].length} 个自查问题")
    end
    Array(site.data["projects"]).each do |project|
      add.call("project", project["title"], project["summary"], "/projects/#project-#{project["id"]}",
        [project["type"], *Array(project["stack"])], "项目 · #{project["status_label"]}")
    end
    config["entries"].each do |entry|
      fail! unless entry.is_a?(Hash)
      add.call(entry["kind"], entry["title"], entry["summary"], entry["url"], entry["keywords"],
        entry["kind"] == "lab" ? "交互实验" : "内容入口", entry.fetch("featured", false))
    end
    fail! unless records.length <= 1000 && records.map { |r| r["id"] }.uniq.length == records.length &&
      records.all? { |r| r["title"].length <= 240 && r["summary"].length <= 600 && r["keywords"].length <= 2000 && r["detail"].length <= 240 && r["url"].length <= 2048 }
    records = records.each_with_index.sort_by { |record, index| [record["featured"] ? 0 : 1, index] }.map(&:first)
    site.data["search_index"] = { "schema_version" => 1, "entries" => records }
    fail! if JSON.generate(site.data["search_index"]).bytesize > 512 * 1024
  end

  def fail!
    raise Jekyll::Errors::FatalException, "site search: require bounded public metadata, unique entries and internal URLs."
  end
end
