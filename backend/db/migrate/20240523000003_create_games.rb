class CreateGames < ActiveRecord::Migration[7.2]
  def change
    create_table :games, id: :uuid do |t|
      t.string :title, null: false
      t.string :image_url
      t.integer :min_players
      t.integer :max_players
      t.string :bgg_id
      t.timestamps
    end

    add_index :games, :bgg_id, unique: true
    add_index :games, :title
  end
end
