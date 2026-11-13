# frozen_string_literal: true

require "json"

# Editorial connections consume only the already-pruned public collection. This
# is metadata, not a body index, learner state, inferred prerequisites or grading.
module KnowledgeConnections
  KINDS = %w[prepare extend compare].freeze

  def self.validate!(site)
    config = site.data["knowledge_connections"]
    return if config.nil?

    fail! unless exact?(config, %w[schema_version ai_assisted links]) && config["schema_version"] == 1 &&
      [true, false].include?(config["ai_assisted"]) &&
      config["links"].is_a?(Array) && config["links"].length <= 256
    docs = site.collections.fetch("atlas_notes").docs
    fail! unless docs.length.between?(1, 200)
    slugs = docs.map { |doc| doc.data["slug"] || doc.basename_without_ext }
    fail! unless slugs.all? { |slug| id?(slug) } && slugs.uniq.length == slugs.length
    ids = []
    pairs = []
    config["links"].each do |link|
      fail! unless exact?(link, %w[id from to kind reason]) && id?(link["id"]) &&
        slugs.include?(link["from"]) && slugs.include?(link["to"]) && link["from"] != link["to"] &&
        KINDS.include?(link["kind"]) && text?(link["reason"], 400)
      ids << link["id"]
      pairs << [link["from"], link["to"]].sort
    end
    fail! unless ids.uniq.length == ids.length && pairs.uniq.length == pairs.length

    prefix = site.config["baseurl"].to_s.sub(%r{/\z}, "")
    paths = Array(site.data["learning_paths"])
    notes = docs.map do |doc|
      data = doc.data
      slug = data["slug"] || doc.basename_without_ext
      fail! unless text?(data["title"], 240) && text?(data["summary"], 600) &&
        text?(data["category"], 80) && internal?(doc.url) &&
        (data["lab_url"].nil? || internal?(data["lab_url"]))
      practices = paths.flat_map do |path|
        path.fetch("steps").filter_map do |step|
          next unless step["note"] == slug

          { "id" => step["id"], "title" => step["title"], "path_title" => path["title"],
            "url" => "#{prefix}/study/practice/##{step['id']}" }
        end
      end
      { "id" => slug, "title" => data["title"], "summary" => data["summary"],
        "category" => data["category"], "url" => prefix + doc.url,
        "lab_url" => data["lab_url"] ? prefix + data["lab_url"] : nil,
        "practice" => practices }
    end
    model = { "schema_version" => 1, "ai_assisted" => config["ai_assisted"], "notes" => notes.sort_by { |note| note["id"] },
              "links" => config["links"] }
    fail! if JSON.generate(model).bytesize > 512 * 1024
    site.data["knowledge_model"] = model
  end

  def self.exact?(value, keys)
    value.is_a?(Hash) && value.keys.sort == keys.sort
  end

  def self.id?(value)
    value.is_a?(String) && value.match?(/\A[a-z][a-z0-9-]{0,79}\z/)
  end

  def self.text?(value, maximum)
    value.is_a?(String) && !value.strip.empty? && value.length <= maximum
  end

  def self.internal?(value)
    value.is_a?(String) && value.match?(%r{\A/(?!/)[a-z0-9/-]+(?:\#[a-z][a-z0-9-]*)?\z}) &&
      !value.include?("//") && !value.include?("..")
  end

  def self.fail!
    raise Jekyll::Errors::FatalException,
      "knowledge_connections.yml: require bounded editorial links with unique IDs/pairs, public endpoints and reasons; only public metadata may enter the model."
  end
end

# Publication runs at normal priority (20), route validation at low (10).
Jekyll::Hooks.register :site, :post_read, priority: 0 do |site|
  KnowledgeConnections.validate!(site)
end
