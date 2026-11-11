# frozen_string_literal: true

# Validate against the already-pruned public collection, so a learning route
# cannot accidentally expose or link an unpublished research note.
module LearningPathValidation
  def self.validate!(site)
    paths = site.data["learning_paths"]
    return if paths.nil?

    fail! unless paths.is_a?(Array) && !paths.empty?
    notes = site.collections.fetch("atlas_notes").docs.map { |doc| doc.data["slug"] }
    ids = []
    paths.each do |path|
      fail! unless path.is_a?(Hash) && present?(path["title"]) &&
        present?(path["summary"]) && path["steps"].is_a?(Array) && !path["steps"].empty?
      ids << path["id"]
      path["steps"].each do |step|
        fail! unless step.is_a?(Hash) && present?(step["title"]) &&
          present?(step["question"]) && notes.include?(step["note"])
        if step["lab"]
          fail! unless step["lab"].is_a?(String) && step["lab"].start_with?("/") &&
            !step["lab"].start_with?("//") && present?(step["lab_label"])
        end
        ids << step["id"]
      end
    end
    fail! unless ids.all? { |id| id.is_a?(String) && id.match?(/\A[a-z][a-z0-9-]*\z/) } && ids.uniq.length == ids.length
  end

  def self.present?(value)
    value.is_a?(String) && !value.strip.empty?
  end

  def self.fail!
    raise Jekyll::Errors::FatalException,
      "_data/learning_paths.yml: routes require unique stable IDs, public notes, questions and valid internal lab links."
  end
end

Jekyll::Hooks.register :site, :post_read, priority: :low do |site|
  LearningPathValidation.validate!(site)
end
