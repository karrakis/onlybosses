require 'net/http'
require 'json'
require 'base64'

class ImageGeneratorService
  class GenerationError < StandardError; end
  
  def initialize(boss)
    @boss = boss
    @api_key = ENV['PIXELLAB_API_KEY']
    raise GenerationError, "PIXELLAB_API_KEY not set" unless @api_key
  end
  
  def generate
    @boss.update(image_generation_status: 'generating')
    
    prompt = build_prompt(@boss.boss_keywords.pluck(:name))
    image_data = call_api(prompt)
    
    attach_image(image_data)
    
    @boss.update(image_generation_status: 'completed')
    @boss
  rescue => e
    @boss.update(image_generation_status: 'failed')
    Rails.logger.error "Image generation failed for boss #{@boss.id}: #{e.message}"
    raise GenerationError, e.message
  end
  
  private
  
  def build_prompt(keywords)
    "Fantasy game boss: #{keywords.join(', ')}, detailed dark fantasy art, video game character, menacing"
  end
  
  def call_api(prompt)
    uri = URI(PIXELLAB_API_URL)
    
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    
    request = Net::HTTP::Post.new(uri.path)
    request['Authorization'] = "Bearer #{@api_key}"
    request['Content-Type'] = 'application/json'
    request.body = {
      description: prompt,
      image_size: { width: 512, height: 512 }
    }.to_json
    
    response = http.request(request)
    
    unless response.is_a?(Net::HTTPSuccess)
      raise GenerationError, "API request failed: #{response.code} #{response.message}"
    end
    
    data = JSON.parse(response.body)
    
    unless data['image'] && data['image']['base64']
      raise GenerationError, "No image data in response"
    end
    
    Base64.decode64(data['image']['base64'])
  end
  
  def attach_image(image_data)
    io = StringIO.new(image_data)
    @boss.image.attach(
      io: io,
      filename: "boss_#{@boss.id}.png",
      content_type: 'image/png'
    )
  end
end
