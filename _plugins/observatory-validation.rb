# frozen_string_literal: true

require "date"
require "uri"
require "time"

module ObservatoryValidation
  def self.present?(value, max = 1200)
    value.is_a?(String) && !value.strip.empty? && value.length <= max
  end

  def self.https?(value)
    return false unless present?(value, 2048)
    url = URI.parse(value)
    url.is_a?(URI::HTTPS) && url.host && !url.userinfo
  rescue URI::InvalidURIError
    false
  end

  def self.validate!(site)
    data = site.data["observatory"]
    return if data.nil?

    fail! unless data.is_a?(Hash) && data["checked_on"].is_a?(String) &&
      data["checked_on"].match?(/\A\d{4}-\d{2}-\d{2}\z/)
    begin
      Date.iso8601(data["checked_on"])
    rescue Date::Error
      fail!
    end
    fail! unless data["topics"].is_a?(Array) && data["kinds"].is_a?(Array)
    topics = data["topics"].map { |item| item.is_a?(Hash) && item["id"] }
    kinds = data["kinds"].map { |item| item.is_a?(Hash) && item["id"] }
    fail! unless (topics + kinds).all? { |id| id.is_a?(String) } &&
      topics.sort == %w[ai economy politics] && kinds.sort == %w[analysis primary reporting] &&
      (data["topics"] + data["kinds"]).all? { |item| present?(item["title"]) }
    sources = data["sources"]
    briefings = data["briefings"]
    fail! unless sources.is_a?(Array) && !sources.empty? && briefings.is_a?(Array) && !briefings.empty?
    ids = []
    sources.each do |source|
      fail! unless source.is_a?(Hash) &&
        %w[title publisher language summary focus caveat question].all? { |key| present?(source[key]) } &&
        present?(source["title"], 240) && topics.include?(source["topic"]) && kinds.include?(source["kind"]) && https?(source["url"])
      ids << source["id"]
    end
    briefings.each do |reading|
      fail! unless reading.is_a?(Hash) && %w[title version summary caveat question].all? { |key| present?(reading[key]) } &&
        present?(reading["title"], 240) && present?(reading["version"], 240) && https?(reading["url"])
      source = sources.find { |item| item["id"] == reading["source_id"] }
      fail! unless source && reading["topic"] == source["topic"]
      ids << reading["id"]
    end
    fail! unless ids.uniq.length == ids.length && ids.all? { |id| id.is_a?(String) && id.match?(/\A[a-z][a-z0-9-]{0,99}\z/) }
    fail! unless data["starters"].is_a?(Hash)
    %w[ai world].each do |name|
      values = data["starters"][name]
      fail! unless values.is_a?(Array) && !values.empty? && values.uniq == values &&
        values.all? { |id| sources.any? { |item| item["id"] == id } }
    end
  end

  def self.fail!
    raise Jekyll::Errors::FatalException,
      "_data/observatory.yml: require a valid check date, unique IDs, known topics/types, HTTPS sources and consistent reading/starter references."
  end

  # Validate links before Liquid renders the no-JS bibliography, not only in JS.
  def self.validate_stream!(site)
    stream = site.data["observatory_stream"]
    manifest = site.data["observatory_feeds"]
    return if stream.nil? && manifest.nil?

    fail_stream! unless manifest.is_a?(Hash) && manifest["schema_version"] == 1 &&
      manifest["sources"].is_a?(Array) && manifest["sources"].length.between?(1, 12) &&
      stream.is_a?(Hash) && stream["schema_version"] == 1 && timestamp?(stream["attempted_at"]) &&
      stream["sources"].is_a?(Array) && stream["sources"].length == manifest["sources"].length &&
      stream["latest"].is_a?(Array) && stream["latest"].length <= 120 &&
      stream["total"].is_a?(Integer) && stream["total"] >= stream["latest"].length
    trusted = {}
    manifest["sources"].each do |source|
      fail_stream! unless source.is_a?(Hash) && present?(source["id"], 100) && !trusted.key?(source["id"]) &&
        https?(source["url"]) && https?(source["home"]) && %w[ai economy politics].include?(source["topic"]) &&
        source["article_hosts"].is_a?(Array) && !source["article_hosts"].empty? &&
        %w[title publisher caveat].all? { |key| present?(source[key]) }
      trusted[source["id"]] = source
    end
    ids = []
    stream["sources"].each do |source|
      fail_stream! unless source.is_a?(Hash) && (expected = trusted[source["id"]]) &&
        source["feed_url"] == expected["url"] && source["home"] == expected["home"] &&
        source["publisher"] == expected["publisher"] && source["article_hosts"] == expected["article_hosts"] &&
        %w[ok not_modified error deferred].include?(source["status"])
      ids << source["id"]
    end
    fail_stream! unless ids.uniq == ids
    ids = []
    stream["latest"].each do |record|
      fail_stream! unless record.is_a?(Hash) && (source = trusted[record["source_id"]]) &&
        record["id"].is_a?(String) && record["id"].match?(/\An-[a-f0-9]{64}\z/) &&
        present?(record["title"], 240) && https?(record["url"]) &&
        source["article_hosts"].include?(URI.parse(record["url"]).host) &&
        record["publisher"] == source["publisher"] && record["topic"] == source["topic"] &&
        record["review_status"] == "needs_review" && present?(record["caveat"]) &&
        timestamp?(record["first_seen_at"]) && timestamp?(record["changed_at"]) &&
        (record["published_at"].nil? || timestamp?(record["published_at"]))
      ids << record["id"]
    end
    fail_stream! unless ids.uniq == ids
  end

  def self.timestamp?(value)
    return false unless value.is_a?(String) && value.match?(/\A\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})\z/)
    Date.iso8601(value[0, 10])
    Time.iso8601(value)
    true
  rescue ArgumentError
    false
  end

  def self.fail_stream!
    raise Jekyll::Errors::FatalException,
      "_data/observatory_stream.json: require bounded needs_review metadata, valid timestamps, unique IDs and HTTPS links matching observatory_feeds.json."
  end
end

Jekyll::Hooks.register :site, :post_read do |site|
  ObservatoryValidation.validate!(site)
  ObservatoryValidation.validate_stream!(site)
end
