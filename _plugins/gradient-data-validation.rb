# frozen_string_literal: true

# Original finite teaching fixture, not a measurement or a real model benchmark.
module GradientDataValidation
  def self.validate!(site)
    data = site.data["gradient_samples"]
    if data.nil?
      fail! if site.pages.any? { |page| page.data["gradient"] == true }
      return
    end
    fail! unless data.is_a?(Hash) && data.keys.sort == %w[description id samples schema_version source_kind units] &&
      data["schema_version"].is_a?(Integer) && data["schema_version"] == 1 && data["id"] == "brook-gradient-transect-v1" &&
      data["source_kind"] == "original_synthetic" && data["units"] == "abstract" &&
      data["description"].is_a?(String) && !data["description"].strip.empty? && data["description"].length <= 400 &&
      data["samples"].is_a?(Array) && data["samples"].length == 12
    seen, counts, training = [], Hash.new(0), []
    data["samples"].each do |row|
      fail! unless row.is_a?(Hash) && row.keys.sort == %w[id split x y] && row["id"].is_a?(String) &&
        row["id"].match?(/\A[tv]-\d{2}\z/) && %w[train validation].include?(row["split"]) &&
        row["id"][0] == (row["split"] == "train" ? "t" : "v") &&
        [row["x"], row["y"]].all? { |v| v.is_a?(Numeric) && v.finite? } && row["x"].abs <= 5 && row["y"].abs <= 15
      seen << row["id"]; counts[row["split"]] += 1
      training << row["x"] if row["split"] == "train"
    end
    fail! unless seen.uniq.length == 12 && counts == { "train" => 8, "validation" => 4 }
    mean = training.sum.to_f / training.length
    fail! unless training.sum { |x| (x - mean)**2 } > 1e-8
  end

  def self.fail!
    raise Jekyll::Errors::FatalException, "gradient fixture: require the original bounded12 synthetic points,8/4 split and nonconstant training feature."
  end
end

Jekyll::Hooks.register :site, :post_read, priority: :low do |site|
  GradientDataValidation.validate!(site)
end
