Rails.application.routes.draw do
  root 'components#index'
  
  post 'take_action', to: 'game#take_action'
  
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
