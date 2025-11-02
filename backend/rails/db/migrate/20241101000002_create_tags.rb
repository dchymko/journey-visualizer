class CreateTags < ActiveRecord::Migration[7.1]
  def change
    create_table :tags do |t|
      t.references :account, null: false, foreign_key: { on_delete: :cascade }
      t.string :kit_tag_id, null: false
      t.string :name, null: false
      t.integer :subscriber_count, default: 0

      t.timestamps
    end

    add_index :tags, [:account_id, :kit_tag_id], unique: true
    add_index :tags, :kit_tag_id
  end
end
