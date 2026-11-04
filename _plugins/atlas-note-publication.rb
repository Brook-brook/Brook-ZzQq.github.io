# frozen_string_literal: true

require "date"
require "uri"

# Prune before generators, rendering and direct document output. Source checking
# is not owner publication approval.
module AtlasNotePublication
  def self.https_url?(value)
    uri = URI.parse(value.to_s)
    uri.is_a?(URI::HTTPS) && uri.host && !uri.userinfo
  rescue URI::InvalidURIError
    false
  end

  def self.validate!(document)
    data = document.data
    missing = %w[source_repo source_commit analyzed_at reviewed_at sources].select do |key|
      data[key].nil? || data[key].to_s.strip.empty?
    end
    valid_sources = data["sources"].is_a?(Array) && !data["sources"].empty? &&
      data["sources"].all? do |source|
        source.is_a?(Hash) && !source["title"].to_s.strip.empty? &&
          https_url?(source["url"])
      end
    valid_dates = begin
      analyzed = Date.iso8601(data["analyzed_at"].to_s)
      checked = Date.iso8601(data["reviewed_at"].to_s)
      checked >= analyzed
    rescue Date::Error
      false
    end
    valid = missing.empty? && valid_sources && valid_dates &&
      https_url?(data["source_repo"]) &&
      data["source_commit"].to_s.match?(/\A(?:[0-9a-f]{40}|[0-9a-f]{64})\z/) &&
      [true, false].include?(data["ai_assisted"])
    return if valid

    raise Jekyll::Errors::FatalException,
      "#{document.relative_path}: source_checked research requires a valid HTTPS repository, " \
      "full commit, analyzed_at/reviewed_at dates, titled HTTPS sources, and explicit ai_assisted."
  end

  def self.apply(site)
    collection = site.collections["atlas_notes"]
    return unless collection

    collection.docs.reject! do |document|
      document.data["published"] == false ||
        document.data["draft"] == true ||
        (document.data["kind"] == "research" &&
          document.data["review_status"] != "source_checked")
    end
    collection.docs.each do |document|
      unless [nil, "tutorial", "research"].include?(document.data["kind"])
        raise Jekyll::Errors::FatalException,
          "#{document.relative_path}: note kind must be tutorial or research."
      end
      %w[published draft].each do |key|
        next if [nil, true, false].include?(document.data[key])

        raise Jekyll::Errors::FatalException,
          "#{document.relative_path}: #{key} must be an unquoted YAML boolean."
      end
      validate!(document) if document.data["kind"] == "research"
    end
  end
end

Jekyll::Hooks.register :site, :post_read do |site|
  AtlasNotePublication.apply(site)
end
