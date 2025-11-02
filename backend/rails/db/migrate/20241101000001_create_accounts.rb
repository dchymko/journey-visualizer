class CreateAccounts < ActiveRecord::Migration[7.1]
  def change
    create_table :accounts do |t|
      t.string :kit_account_id, null: false
      t.string :email
      t.string :name
      t.text :access_token, null: false
      t.text :refresh_token
      t.datetime :token_expires_at
      t.datetime :last_sync_at

      t.timestamps
    end

    add_index :accounts, :kit_account_id, unique: true
  end
end
