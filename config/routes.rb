Rails.application.routes.draw do
  root 'components#index'
  
  post 'take_action', to: 'game#take_action'
  get 'get_player', to: 'game#get_player'
  get 'get_game_state', to: 'game#get_game_state'
  post 'reset_player', to: 'game#reset_player'
  post 'add_keyword', to: 'game#add_keyword'
  post 'remove_keyword', to: 'game#remove_keyword'
  post 'set_boss', to: 'game#set_boss'
  
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
