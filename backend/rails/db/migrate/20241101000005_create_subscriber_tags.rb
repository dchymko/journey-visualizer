class CreateSubscriberTags < ActiveRecord::Migration[7.1]
  def change
    create_table :subscriber_tags do |t|
      t.references :subscriber, null: false, foreign_key: { on_delete: :cascade }
      t.references :tag, null: false, foreign_key: { on_delete: :cascade }
      t.datetime :tagged_at, default: -> { 'CURRENT_TIMESTAMP' }

      t.timestamps
    end

    add_index :subscriber_tags, [:subscriber_id, :tag_id], unique: true
  end
end
