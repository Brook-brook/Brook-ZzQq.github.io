# frozen_string_literal: true

# Questions derive from already-validated public learning routes; reference text
# is bounded plain text, never generated from a learner's private answer.
module PracticePromptValidation
  def self.validate!(site)
    prompts = site.data["practice_prompts"]
    return if prompts.nil?

    paths = site.data["learning_paths"]
    fail! unless prompts.is_a?(Hash) && paths.is_a?(Array)
    ids = paths.flat_map { |path| path.fetch("steps").map { |step| step["id"] } }
    fail! unless prompts.keys.sort == ids.sort && ids.length <= 1000
    prompts.each_value do |prompt|
      fail! unless prompt.is_a?(Hash) && (prompt.keys - %w[hint explanation counterexample code]).empty? &&
        %w[hint explanation counterexample].all? { |key| text?(prompt[key], 2000) } &&
        (!prompt.key?("code") || text?(prompt["code"], 4000))
    end
  end

  def self.text?(value, maximum)
    value.is_a?(String) && !value.strip.empty? && value.length <= maximum
  end

  def self.fail!
    raise Jekyll::Errors::FatalException,
      "_data/practice_prompts.yml: require exactly the public learning-step IDs and bounded original hints, explanations and counterexamples."
  end
end

# Run after public-note/route validation, including when building --unpublished.
Jekyll::Hooks.register :site, :post_read, priority: 0 do |site|
  PracticePromptValidation.validate!(site)
end
