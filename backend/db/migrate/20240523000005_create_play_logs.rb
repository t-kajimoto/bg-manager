class CreatePlayLogs < ActiveRecord::Migration[7.2]
  def change
    create_table :play_logs, id: :uuid do |t|
      t.references :profile, type: :uuid, null: false, foreign_key: true
      t.references :game, type: :uuid, null: false, foreign_key: true
      t.date :played_on, null: false
      t.text :memo
      t.string :image_path
      t.string :visibility, default: 'public'

      t.timestamps
    end
  end
end
