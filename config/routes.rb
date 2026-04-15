Rails.application.routes.draw do
  root 'components#index'
  get  'admin',                  to: 'admin#index'
  get  'admin/synergy_chart',    to: 'admin#index'
  get  'admin/keyword_chart',    to: 'admin#index'
  get  'admin/analysis_data',    to: 'admin#analysis_data'
  get  'admin/analysis_stream',  to: 'admin#analysis_stream'
  get  'admin/combo_data',       to: 'admin#combo_data'
  get  'admin/keyword_data',     to: 'admin#keyword_data'
  
  post 'take_action', to: 'game#take_action'
  get 'get_player', to: 'game#get_player'
  get 'get_game_state', to: 'game#get_game_state'
  post 'reset_player', to: 'game#reset_player'
  post 'add_keyword', to: 'game#add_keyword'
  post 'skip_keyword', to: 'game#skip_keyword'
  post 'swap_race', to: 'game#swap_race'
  post 'swap_weapons', to: 'game#swap_weapons'
  post 'remove_keyword', to: 'game#remove_keyword'
  post 'record_snapshot', to: 'game#record_snapshot'
  post 'set_boss', to: 'game#set_boss'
  get  'simulate_runs', to: 'simulation#run'
  
  namespace :api do
    resources :bosses, only: [:show, :index] do
      collection do
        post :generate
        get :keywords
      end
    end
  end
  
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Defines the root path route ("/")
  # root "articles#index"
end
