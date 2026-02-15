class ComponentsController < ApplicationController
  def index
    @available_keywords = BossKeyword.pluck(:name).sort
  end
end
