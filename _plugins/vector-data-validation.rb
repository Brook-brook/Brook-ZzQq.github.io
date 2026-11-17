# frozen_string_literal: true

require_relative "retrieval-data-validation"

module VectorDataValidation
  FIELDS = %w[corpus_id description feature_policy id schema_version source_kind vocabulary].freeze

  def self.validate!(site)
    data = site.data["vector_terms"]
    if data.nil?
      fail! if site.pages.any? { |page| page.data["vectors"] == true }
      return
    end
    RetrievalDataValidation.validate!(site)
    corpus = site.data["retrieval_samples"]
    fail! unless corpus.is_a?(Hash) && data.is_a?(Hash) && data.keys.sort == FIELDS &&
      data["schema_version"].is_a?(Integer) && data["schema_version"] == 1 &&
      data["id"] == "brook-lexical-vectors-v1" && data["source_kind"] == "original_feature_registry" &&
      data["feature_policy"] == "nfkc-lower-nonoverlap-substrings-v1" &&
      data["corpus_id"] == "brook-retrieval-teaching-v1" && data["corpus_id"] == corpus["corpus_id"] &&
      corpus["fragments"].length == 8 && corpus["documents"].length == 4 &&
      data["description"].is_a?(String) && !data["description"].strip.empty? && data["description"].length <= 500 &&
      data["vocabulary"].is_a?(Array) && data["vocabulary"].length == 14
    words = data["vocabulary"]
    fail! unless words.all? { |word| word.is_a?(String) && word.length.between?(1, 24) &&
      !word.match?(/[\p{Space}\uFEFF]/) && word == word.unicode_normalize(:nfkc).downcase } && words.uniq.length == words.length
  end

  def self.fail!
    raise Jekyll::Errors::FatalException,
      "vector registry: require the explicit14 normalized lexical terms, original8-fragment corpus and bounded exact fields; not semantic embeddings."
  end
end

Jekyll::Hooks.register :site, :post_read, priority: :low do |site|
  VectorDataValidation.validate!(site)
end
