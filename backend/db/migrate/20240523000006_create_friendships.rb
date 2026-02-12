class CreateFriendships < ActiveRecord::Migration[7.2]
  def change
    create_table :friendships, id: :uuid do |t|
      t.references :profile, type: :uuid, null: false, foreign_key: true
      t.references :friend, type: :uuid, null: false, foreign_key: { to_table: :profiles }
      t.string :status, default: 'pending', null: false # pending, accepted

      t.timestamps
    end

    add_index :friendships, [:profile_id, :friend_id], unique: true
  end
end
