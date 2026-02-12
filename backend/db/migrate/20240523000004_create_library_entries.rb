class CreateLibraryEntries < ActiveRecord::Migration[7.2]
  def change
    create_table :library_entries, id: :uuid do |t|
      t.references :profile, type: :uuid, null: false, foreign_key: true
      t.references :game, type: :uuid, null: false, foreign_key: true
      t.string :status, null: false # owned, wanted, played
      t.integer :rating # 1-10
      t.text :comment
      t.string :visibility, default: 'public'

      t.timestamps
    end

    add_index :library_entries, [:profile_id, :game_id], unique: true
  end
end
