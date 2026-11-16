# frozen_string_literal: true

require "uri"

# A public learning index, never course enrollment, grades or coverage certification.
module AIFoundationsValidation
  def self.present?(value, limit)
    value.is_a?(String) && !value.strip.empty? && value.length <= limit
  end

  def self.validate!(site)
    data = site.data["ai_foundations"]
    if data.nil?
      fail! if site.pages.any? { |page| page.data["ai_foundations"] == true }
      return
    end
    fail! unless data.is_a?(Hash) && data.keys.sort == %w[groups schema_version summary title] && data["schema_version"].is_a?(Integer) && data["schema_version"] == 1 &&
      present?(data["title"], 100) && present?(data["summary"], 400) && data["groups"].is_a?(Array) && data["groups"].length == 4
    published = site.collections.fetch("atlas_notes").docs.map { |doc| doc.data["slug"] }
    pages = site.pages.map(&:url)
    ids, total = [], 0
    data["groups"].each do |group|
      fail! unless group.is_a?(Hash) && group.keys.sort == %w[id title topics] && present?(group["title"], 100) && group["topics"].is_a?(Array) && !group["topics"].empty?
      ids << group["id"]
      group["topics"].each do |topic|
        fail! unless topic.is_a?(Hash) && (topic.keys - %w[id title state scope question notes lab lab_label]).empty? &&
          %w[id title state scope question notes].all? { |key| topic.key?(key) } &&
          present?(topic["title"], 100) && present?(topic["scope"], 400) &&
          present?(topic["question"], 400) && %w[entry practice planned].include?(topic["state"]) &&
          topic["notes"].is_a?(Array) && topic["notes"].length <= 3 && topic["notes"].uniq == topic["notes"] &&
          topic["notes"].all? { |slug| published.include?(slug) }
        if topic["state"] == "planned"
          fail! unless topic["notes"].empty? && !topic.key?("lab") && !topic.key?("lab_label")
        else
          fail! if topic["notes"].empty?
        end
        fail! if topic["state"] == "practice" && !topic["lab"]
        fail! if topic.key?("lab_label") != topic.key?("lab")
        if topic["lab"]
          url = topic["lab"]
          fail! unless present?(url, 400) && url.start_with?("/") && !url.start_with?("//") &&
            !url.match?(/[[:cntrl:][:space:]]|\\|%2f|%5c|%2e/i) && present?(topic["lab_label"], 80)
          begin
            parsed = URI.parse(url)
            fail! if parsed.host || parsed.scheme || parsed.query || parsed.fragment || parsed.path.split("/").include?("..") || !pages.include?(parsed.path)
          rescue URI::InvalidURIError
            fail!
          end
        end
        ids << topic["id"]; total += 1
      end
    end
    fail! unless total == 13 && ids.uniq == ids && ids.all? { |id| id.is_a?(String) && id.match?(/\A[a-z][a-z0-9-]*\z/) }
  end

  def self.fail!
    raise Jekyll::Errors::FatalException, "AI foundations: require13 honest topic entries, published notes and real safe labs; planned topics have no fake resource."
  end
end

Jekyll::Hooks.register :site, :post_read, priority: :low do |site|
  AIFoundationsValidation.validate!(site)
end
