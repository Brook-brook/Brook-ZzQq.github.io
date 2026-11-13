# frozen_string_literal: true

module RetrievalDataValidation
  def self.validate!(site)
    data = site.data["retrieval_samples"]
    return if data.nil?

    fail! unless exact?(data, %w[schema_version corpus_id title disclosure documents fragments tasks]) &&
      data["schema_version"] == 1 && id?(data["corpus_id"]) &&
      text?(data["title"], 200) && text?(data["disclosure"], 1000)
    { "documents" => 20, "fragments" => 100, "tasks" => 10 }.each do |key, max|
      list = data[key]
      fail! unless list.is_a?(Array) && list.length.between?(1, max) &&
        list.all? { |item| item.is_a?(Hash) && id?(item["id"]) } &&
        list.map { |item| item["id"] }.uniq.length == list.length
    end
    data["documents"].each do |doc|
      fail! unless exact?(doc, %w[id title version]) && text?(doc["title"], 120) &&
        doc["version"].is_a?(String) && doc["version"].match?(/\Av[1-9]\d{0,2}\z/)
    end
    docs = data["documents"].map { |doc| doc["id"] }
    data["fragments"].each do |fragment|
      fail! unless exact?(fragment, %w[id document_id section text]) &&
        docs.include?(fragment["document_id"]) && text?(fragment["section"], 120) &&
        text?(fragment["text"], 1500)
    end
    ids = data["fragments"].map { |fragment| fragment["id"] }
    data["tasks"].each do |task|
      fail! unless exact?(task, %w[id title question query relevant_ids annotation_reason]) &&
        text?(task["title"], 120) && text?(task["question"], 300) && text?(task["annotation_reason"], 1000) &&
        task["query"].is_a?(String) && task["query"].length <= 200
      terms = task["query"].unicode_normalize(:nfkc).downcase.split.uniq
      fail! unless terms.length <= 6 && terms.all? { |term| term.length <= 40 }
      relevant = task["relevant_ids"]
      fail! unless relevant.nil? || relevant.is_a?(Array) &&
        relevant.uniq.length == relevant.length && relevant.all? { |id| ids.include?(id) }
    end
  end

  def self.exact?(value, keys)
    value.is_a?(Hash) && value.keys.sort == keys.sort
  end

  def self.id?(value)
    value.is_a?(String) && value.match?(/\A[a-z][a-z0-9-]{0,59}\z/)
  end

  def self.text?(value, max)
    value.is_a?(String) && !value.strip.empty? && value.length <= max
  end

  def self.fail!
    raise Jekyll::Errors::FatalException,
      "_data/retrieval_samples.json: require bounded original teaching documents/fragments, unique IDs, explicit versions, known relevance references and exact fields."
  end
end

Jekyll::Hooks.register :site, :post_read, priority: :low do |site|
  RetrievalDataValidation.validate!(site)
end
