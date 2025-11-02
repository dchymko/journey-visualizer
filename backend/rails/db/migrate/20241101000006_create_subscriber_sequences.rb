class CreateSubscriberSequences < ActiveRecord::Migration[7.1]
  def change
    create_table :subscriber_sequences do |t|
      t.references :subscriber, null: false, foreign_key: { on_delete: :cascade }
      t.references :sequence, null: false, foreign_key: { on_delete: :cascade }
      t.datetime :enrolled_at
      t.datetime :completed_at
      t.string :state

      t.timestamps
    end

    add_index :subscriber_sequences, [:subscriber_id, :sequence_id], unique: true
    add_index :subscriber_sequences, :state
  end
end
