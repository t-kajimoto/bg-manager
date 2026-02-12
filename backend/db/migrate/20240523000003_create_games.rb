# Railsのマイグレーションクラス
# データベースのスキーマ変更（テーブル作成、カラム追加など）をRubyコードで記述します。
# これにより、SQLを直接書かずに、DBの種類（PostgreSQL, MySQL, SQLiteなど）に依存しない形でスキーマを管理できます。
class CreateGames < ActiveRecord::Migration[7.1]
  # changeメソッド
  # ここに記述された内容が、`rails db:migrate` 実行時に適用されます。
  # 逆に `rails db:rollback` した際には、自動的に逆の操作（テーブル削除など）が行われます。
  def change
    # create_table: 新しいテーブルを作成します。
    # :games -> テーブル名（複数形が慣習）
    # id: :uuid -> プライマリキー（ID）の型を指定。ここではSupabaseに合わせてUUIDを使用します。
    create_table :games, id: :uuid do |t|
      # t.string -> 文字列型（VARCHAR）のカラム
      # null: false -> 必須項目（NOT NULL制約）
      t.string :title, null: false

      # オプション指定なしの場合はNULL許可（nullable）となります。
      t.string :image_url

      # t.integer -> 整数型（INTEGER）
      t.integer :min_players
      t.integer :max_players

      # 外部サービスのID（BGG ID）
      t.string :bgg_id

      # t.timestamps -> created_at（作成日時）とupdated_at（更新日時）カラムを自動追加
      # Railsが自動的に値を設定してくれる便利な機能です。
      t.timestamps
    end

    # add_index: インデックスを作成します。
    # 検索速度を向上させたり、ユニーク制約（重複禁止）をDBレベルで保証したりします。
    # :games -> テーブル名, :bgg_id -> カラム名
    # unique: true -> ユニークインデックス（同じBGG IDは2つ登録できない）
    add_index :games, :bgg_id, unique: true

    # タイトルで検索することが多いため、通常のインデックスを追加（ユニークではない）
    add_index :games, :title
  end
end
