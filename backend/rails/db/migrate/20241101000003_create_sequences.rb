class CreateSequences < ActiveRecord::Migration[7.1]
  def change
    create_table :sequences do |t|
      t.references :account, null: false, foreign_key: { on_delete: :cascade }
      t.string :kit_sequence_id, null: false
      t.string :name, null: false
      t.integer :subscriber_count, default: 0

      t.timestamps
    end

    add_index :sequences, [:account_id, :kit_sequence_id], unique: true
    add_index :sequences, :kit_sequence_id
  end
end
