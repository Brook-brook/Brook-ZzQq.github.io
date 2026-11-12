# frozen_string_literal: true

require "date"
require "uri"

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
end

Jekyll::Hooks.register :site, :post_read do |site|
  ObservatoryValidation.validate!(site)
end
