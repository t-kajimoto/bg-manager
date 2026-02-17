# LibraryEntriesテーブル作成マイグレーション
class CreateLibraryEntries < ActiveRecord::Migration[7.1]
  def change
    # create_table: 新しいテーブルを作成
    # id: :uuid -> UUIDを主キーとして使用（Supabase標準）
    create_table :library_entries, id: :uuid do |t|
      # t.references: 他のテーブルとの関連（外部キー）を定義します。
      # :profile -> profilesテーブルへの参照（profile_idカラムが生成される）
      # type: :uuid -> 関連先のID型に合わせてUUIDを指定
      # null: false -> 必須項目（NOT NULL制約）
      # foreign_key: true -> データベースレベルでの外部キー制約を追加（データの整合性を保証）
      t.references :profile, type: :uuid, null: false, foreign_key: true

      # :game -> gamesテーブルへの参照（game_idカラムが生成される）
      t.references :game, type: :uuid, null: false, foreign_key: true

      # status: 文字列型（'owned', 'wanted', 'played' など）
      t.string :status, null: false

      # rating: 整数型（1-10の評価値）
      t.integer :rating

      # comment: テキスト型（長い文章を格納できるTEXT型）
      t.text :comment

      # visibility: 公開範囲（デフォルトは 'public'）
      t.string :visibility, default: 'public'

      # timestamps: created_at, updated_at を追加
      t.timestamps
    end

    # 複合ユニークインデックスを追加
    # [:profile_id, :game_id] -> ユーザーとゲームの組み合わせに対してユニーク制約を設定
    # つまり、「同じユーザーが同じゲームに対して2つのLibraryEntryを持つこと」を防ぎます。
    add_index :library_entries, [:profile_id, :game_id], unique: true
  end
end
