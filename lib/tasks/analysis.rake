namespace :analysis do
  desc "Run the keyword balance analysis and print to stdout"
  task run: :environment do
    script = Rails.root.join('analysis', 'analyze.py')
    exec "python3 #{script}"
  end

  desc "Run the analysis with the gradient-boosted tree feature importances"
  task tree: :environment do
    script = Rails.root.join('analysis', 'analyze.py')
    exec "python3 #{script} --tree"
  end

  desc "Run the analysis for a specific minimum depth (e.g. rake analysis:depth DEPTH=3)"
  task depth: :environment do
    script = Rails.root.join('analysis', 'analyze.py')
    depth  = ENV.fetch('DEPTH', '1')
    exec "python3 #{script} --depth #{depth}"
  end
end
