# Friendshipsテーブル作成マイグレーション
class CreateFriendships < ActiveRecord::Migration[7.1]
  def change
    # create_table: 新しいテーブルを作成
    # id: :uuid -> UUIDを主キーとして使用
    create_table :friendships, id: :uuid do |t|
      # t.references: 他のテーブルとの関連
      # :profile -> profilesテーブルへの参照（profile_idカラム）
      # type: :uuid -> UUID型の参照
      t.references :profile, type: :uuid, null: false, foreign_key: true

      # :friend -> 同じくprofilesテーブルへの参照ですが、カラム名は 'friend_id' になります。
      # to_table: :profiles -> 参照先のテーブル名を明示的に指定（friend_id -> profiles.id）
      # これにより、同じテーブル（profiles）同士のリレーション（自己参照）を表現できます。
      t.references :friend, type: :uuid, null: false, foreign_key: { to_table: :profiles }

      # status: 'pending'（申請中）, 'accepted'（承認済み）
      # default: 'pending' -> 初期状態は申請中
      t.string :status, default: 'pending', null: false

      # timestamps: created_at, updated_at
      t.timestamps
    end

    # 複合ユニークインデックスを追加
    # [:profile_id, :friend_id] -> 同じペアでのフレンド申請が重複しないように制限します。
    # つまり、AさんがBさんに2回フレンド申請を送ることを防ぎます。
    add_index :friendships, [:profile_id, :friend_id], unique: true
  end
end
