class GenerateBossImageJob < ApplicationJob
  queue_as :default

  def perform(boss_id)
    boss = Boss.find(boss_id)
    ImageGeneratorService.new(boss).generate
  rescue ImageGeneratorService::GenerationError => e
    Rails.logger.error "Failed to generate image for boss #{boss_id}: #{e.message}"
    # Could add retry logic or notification here
  end
end
