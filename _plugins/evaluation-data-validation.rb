# frozen_string_literal: true

# The no-JS teaching example and client dataset share one explicit fixture.
module EvaluationDataValidation
  SCENARIOS = { "rare" => 2, "balanced" => 10, "none" => 0 }.freeze

  def self.validate!(site)
    data = site.data["evaluation_samples"]
    return if data.nil?

    fail! unless data.is_a?(Hash) && data["schema_version"] == 1 &&
      data["dataset_id"] == "atlas-synthetic-evaluation-v1" &&
      data["samples"].is_a?(Array) && data["samples"].length == 20 && data["scenarios"].is_a?(Hash)
    ids = []
    data["samples"].each do |sample|
      fail! unless sample.is_a?(Hash) && sample["id"].is_a?(String) &&
        sample["id"].match?(/\A[a-zA-Z0-9-]{1,40}\z/) && sample["score"].is_a?(Numeric) &&
        sample["score"].finite? && sample["score"].between?(0, 100) && sample["labels"].is_a?(Hash)
      ids << sample["id"]
      SCENARIOS.each_key { |key| fail! unless [0, 1].include?(sample["labels"][key]) }
    end
    fail! unless ids.uniq.length == ids.length
    SCENARIOS.each do |key, positives|
      title = data["scenarios"][key]
      fail! unless title.is_a?(String) && !title.strip.empty? && title.length <= 80 &&
        data["samples"].sum { |sample| sample["labels"][key] } == positives
    end
  end

  def self.fail!
    raise Jekyll::Errors::FatalException,
      "_data/evaluation_samples.json: require the bounded synthetic v1 fixture, unique samples, valid scores and declared class counts."
  end
end

Jekyll::Hooks.register :site, :post_read, priority: :low do |site|
  EvaluationDataValidation.validate!(site)
end
