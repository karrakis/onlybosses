class ApplicationController < ActionController::Base
  before_action :load_available_keywords

  private

  def load_available_keywords
    @available_keywords = BossKeyword.order(:name).pluck(:name)
  end
end
