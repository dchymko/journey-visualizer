class CreateJourneyFlows < ActiveRecord::Migration[7.1]
  def change
    create_table :journey_flows do |t|
      t.references :account, null: false, foreign_key: { on_delete: :cascade }
      t.string :source_type, null: false
      t.string :source_id, null: false
      t.string :source_name, null: false
      t.string :target_type, null: false
      t.string :target_id
      t.string :target_name
      t.integer :subscriber_count, default: 0
      t.decimal :percentage, precision: 5, scale: 2
      t.datetime :analyzed_at, default: -> { 'CURRENT_TIMESTAMP' }

      t.timestamps
    end

    add_index :journey_flows, [:account_id, :source_type, :source_id, :target_type, :target_id],
              unique: true, name: 'index_journey_flows_on_unique_flow'
    add_index :journey_flows, [:source_type, :source_id]
    add_index :journey_flows, [:target_type, :target_id]
  end
end
