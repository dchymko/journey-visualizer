class CreateSubscribers < ActiveRecord::Migration[7.1]
  def change
    create_table :subscribers do |t|
      t.references :account, null: false, foreign_key: { on_delete: :cascade }
      t.string :kit_subscriber_id, null: false
      t.string :email
      t.string :first_name
      t.string :state

      t.timestamps
    end

    add_index :subscribers, [:account_id, :kit_subscriber_id], unique: true
    add_index :subscribers, :kit_subscriber_id
    add_index :subscribers, :state
  end
end
