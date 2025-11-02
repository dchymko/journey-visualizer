class CreateAnalysisRuns < ActiveRecord::Migration[7.1]
  def change
    create_table :analysis_runs do |t|
      t.references :account, null: false, foreign_key: { on_delete: :cascade }
      t.integer :total_subscribers
      t.integer :total_tags
      t.integer :total_sequences
      t.integer :total_flows
      t.string :status
      t.text :error_message
      t.datetime :started_at, default: -> { 'CURRENT_TIMESTAMP' }
      t.datetime :completed_at

      t.timestamps
    end

    add_index :analysis_runs, :status
  end
end
