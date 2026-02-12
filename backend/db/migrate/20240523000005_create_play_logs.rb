# PlayLogsテーブル作成マイグレーション
class CreatePlayLogs < ActiveRecord::Migration[7.1]
  def change
    # create_table: 新しいテーブルを作成
    # id: :uuid -> UUIDを主キーとして使用
    create_table :play_logs, id: :uuid do |t|
      # t.references: 他のテーブルとの関連
      # :profile -> profilesテーブルへの参照（profile_idカラム）
      # type: :uuid -> UUID型の参照
      t.references :profile, type: :uuid, null: false, foreign_key: true

      # :game -> gamesテーブルへの参照（game_idカラム）
      t.references :game, type: :uuid, null: false, foreign_key: true

      # t.date: 日付型（年月日のみ、時間は含まない）
      # played_on -> プレイ日
      t.date :played_on, null: false

      # t.text: テキスト型（長い文章が可能）
      # memo -> プレイのメモ
      t.text :memo

      # t.string: 文字列型
      # image_path -> ストレージ上の画像パス
      t.string :image_path

      # visibility: 公開範囲（デフォルトは 'public'）
      t.string :visibility, default: 'public'

      # timestamps: created_at, updated_at
      t.timestamps
    end
  end
end
