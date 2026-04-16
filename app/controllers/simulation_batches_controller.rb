class SimulationBatchesController < ApplicationController
  skip_before_action :verify_authenticity_token

  # POST /simulation_batches
  def create
    count = params[:count].to_i.clamp(1, 100_000)
    batch = SimulationBatch.create!(total: count, status: 'pending', completed: 0)
    SimulationBatchJob.perform_later(batch.id)
    render json: batch_json(batch)
  end

  # GET /simulation_batches/:id
  def show
    batch = SimulationBatch.find(params[:id])
    render json: batch_json(batch)
  end

  # GET /simulation_batches/latest
  def latest
    batch = SimulationBatch.active.order(created_at: :desc).first
    if batch
      render json: batch_json(batch)
    else
      render json: { id: nil }
    end
  end

  # PATCH /simulation_batches/:id/cancel
  def cancel
    batch = SimulationBatch.find(params[:id])
    unless batch.status.in?(%w[done cancelled])
      batch.update!(status: 'cancelled')
    end
    render json: batch_json(batch)
  end

  private

  def batch_json(batch)
    {
      id:          batch.id,
      status:      batch.status,
      total:       batch.total,
      completed:   batch.completed,
      created_at:  batch.created_at
    }
  end
end
