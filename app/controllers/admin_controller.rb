require 'open3'

class AdminController < ApplicationController
  def index
    @sections = []
    @error    = nil

    script    = Rails.root.join('analysis', 'analyze.py')
    min_depth  = (params[:depth]     || 1).to_i.clamp(1, 50)
    min_support = (params[:support]  || 15).to_i.clamp(1, 999)
    delta_thr   = (params[:threshold] || 0.15).to_f.clamp(0.0, 1.0)
    use_tree   = params[:tree] == '1'

    args = ["python3", script.to_s,
            "--depth", min_depth.to_s,
            "--support", min_support.to_s,
            "--threshold", delta_thr.to_s]
    args << "--tree" if use_tree

    stdout, stderr, status = Open3.capture3(*args)

    if status.success?
      @sections = parse_sections(stdout)
    else
      @error = stderr.presence || "Analysis script exited with status #{status.exitstatus}"
    end

    @min_depth   = min_depth
    @min_support = min_support
    @delta_thr   = delta_thr
    @use_tree    = use_tree
    @run_count   = Run.count
    @snapshot_count = DepthSnapshot.count
  end

  private

  # Split the script's stdout into titled sections on the ─── marker lines.
  def parse_sections(output)
    sections = []
    current  = nil

    output.each_line do |line|
      line = line.chomp
      if line =~ /\A─{3}\s+(.+?)\s+─+\z/
        sections << current if current
        current = { title: $1, lines: [] }
      elsif current
        current[:lines] << line
      end
    end

    sections << current if current
    sections
  end
end
