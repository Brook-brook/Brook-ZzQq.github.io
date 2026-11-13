# frozen_string_literal: true

module SpatialDataValidation
  PATTERNS = %w[zones diagonal].freeze

  def self.validate!(site)
    data = site.data["spatial_samples"]
    return if data.nil?

    fail! unless data.is_a?(Hash) && data["schema_version"] == 1 &&
      data["dataset_id"] == "atlas-spatial-grid-v1" && data["unit"] == "synthetic-m" &&
      data["generation_seed"] == 2026 && data["extent"] == [0, 0, 800, 800] &&
      data["patterns"].is_a?(Hash) && data["points"].is_a?(Array) && data["points"].length == 80
    PATTERNS.each do |key|
      title = data["patterns"][key]
      fail! unless title.is_a?(String) && !title.strip.empty? && title.length <= 80
    end
    ids, coordinates, counts = [], [], [0, 0, 0, 0]
    data["points"].each do |point|
      fail! unless point.is_a?(Hash) && point["id"].is_a?(String) && point["id"].match?(/\A[a-zA-Z0-9-]{1,40}\z/) &&
        %w[x y].all? { |axis| point[axis].is_a?(Numeric) && point[axis].finite? && point[axis].between?(0, 800) } &&
        point["block"].is_a?(Integer) && point["block"] == (point["x"] >= 400 ? 1 : 0) + (point["y"] >= 400 ? 2 : 0) &&
        point["labels"].is_a?(Hash) && PATTERNS.all? { |key| [0, 1].include?(point["labels"][key]) }
      ids << point["id"]
      coordinates << [point["x"], point["y"]]
      counts[point["block"]] += 1
    end
    fail! unless ids.uniq.length == 80 && coordinates.uniq.length == 80 && counts == [20, 20, 20, 20]
  end

  def self.fail!
    raise Jekyll::Errors::FatalException,
      "_data/spatial_samples.json: require the original bounded v1 synthetic planar fixture, unique IDs/coordinates, valid labels and four 20-point blocks."
  end
end

Jekyll::Hooks.register :site, :post_read, priority: :low do |site|
  SpatialDataValidation.validate!(site)
end
