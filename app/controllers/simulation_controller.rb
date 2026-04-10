class SimulationController < ApplicationController
  include ActionController::Live
  skip_before_action :verify_authenticity_token

  # GET /simulate_runs?count=N
  # Streams SSE events: { run:, total:, depth: } per completed run, then { done: true }.
  def run
    count = params[:count].to_i.clamp(1, 500)

    # Preload all keywords once — simulation uses this registry to avoid per-fight DB queries
    keyword_registry = BossKeyword.all.index_by(&:name)

    response.headers['Content-Type']      = 'text/event-stream'
    response.headers['Cache-Control']     = 'no-cache'
    response.headers['X-Accel-Buffering'] = 'no'
    # Rack::ETag middleware buffers the entire response to compute a hash unless
    # Last-Modified or ETag is already present — set it to bypass that buffering.
    response.headers['Last-Modified']     = Time.current.httpdate

    count.times do |i|
      depth = RunSimulatorService.simulate_run(keyword_registry)
      response.stream.write("data: #{JSON.generate({ run: i + 1, total: count, depth: depth })}\n\n")
    end

    response.stream.write("data: #{JSON.generate({ done: true, total: count })}\n\n")
  rescue IOError, ActionController::Live::ClientDisconnected
    # Client disconnected before simulation finished — stop cleanly
  ensure
    response.stream.close
  end
end
