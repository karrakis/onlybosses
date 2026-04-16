class SimulationBatchJob < ApplicationJob
  queue_as :default

  # Update progress and check for cancellation every this many completed runs.
  PROGRESS_INTERVAL = 100

  def perform(batch_id)
    batch = SimulationBatch.find(batch_id)
    return if batch.status == 'cancelled'

    batch.update!(status: 'running')

    # Preload keyword registry once — avoids per-fight DB queries
    keyword_registry = BossKeyword.all.index_by(&:name)

    completed = 0

    batch.total.times do
      RunSimulatorService.simulate_run(keyword_registry)
      completed += 1

      if (completed % PROGRESS_INTERVAL).zero?
        batch.update_columns(completed: completed)
        # Check for cancellation request
        break if SimulationBatch.where(id: batch_id, status: 'cancelled').exists?
      end
    end

    # Write final count regardless of whether we hit an interval boundary
    final_status = SimulationBatch.where(id: batch_id, status: 'cancelled').exists? ? 'cancelled' : 'done'
    batch.update!(status: final_status, completed: completed)
  end
end
