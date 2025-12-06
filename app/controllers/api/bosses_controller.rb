module Api
  class BossesController < ApplicationController
    skip_before_action :verify_authenticity_token
    
    # POST /api/bosses/generate
    # Body: { keyword_names: ["skeleton", "octopus", "spear"] }
    def generate
      keyword_names = params[:keyword_names]
      
      if keyword_names.blank? || !keyword_names.is_a?(Array)
        return render json: { error: 'keyword_names array required' }, status: :bad_request
      end
      
      boss = BossFactory.find_or_create(keyword_names)
      
      render json: boss_json(boss), status: :ok
    rescue ArgumentError => e
      render json: { error: e.message }, status: :bad_request
    end
    
    # GET /api/bosses/:id
    def show
      boss = Boss.find(params[:id])
      render json: boss_json(boss), status: :ok
    rescue ActiveRecord::RecordNotFound
      render json: { error: 'Boss not found' }, status: :not_found
    end
    
    # GET /api/bosses
    def index
      bosses = Boss.includes(:boss_keywords).order(created_at: :desc).limit(50)
      render json: bosses.map { |b| boss_json(b) }, status: :ok
    end
    
    # GET /api/boss_keywords
    def keywords
      keywords = BossKeyword.order(:name)
      render json: keywords.map { |k| keyword_json(k) }, status: :ok
    end
    
    private
    
    def boss_json(boss)
      {
        id: boss.id,
        name: boss.name,
        keywords: boss.boss_keywords.order('boss_keyword_associations.position').pluck(:name),
        stats: boss.computed_stats,
        image_status: boss.image_generation_status,
        image_url: boss.image.attached? ? url_for(boss.image) : nil,
        created_at: boss.created_at
      }
    end
    
    def keyword_json(keyword)
      {
        id: keyword.id,
        name: keyword.name,
        category: keyword.category,
        properties: keyword.properties,
        rarity: keyword.rarity
      }
    end
  end
end
