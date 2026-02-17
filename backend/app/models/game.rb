# Gameモデル
# RailsのActive Recordパターンに従い、データベースのgamesテーブルに対応するクラスです。
# ApplicationRecordを継承することで、SQLを書かずにDB操作（CRUD）が可能になります。
#
# このクラスはInfrastructure層に属し、データの永続化に関するルール（バリデーションやリレーション）を担当します。
# Core層の純粋なEntityとは異なり、Railsフレームワークに強く依存しています。
class Game < ApplicationRecord
  # バリデーション（検証）: データ保存前に満たすべき条件
  # presence: true -> nullや空文字を許さない（必須項目）
  validates :title, presence: true

  # uniqueness: true -> 重複を許さない
  # allow_nil: true -> nullの場合は重複チェックを行わない
  # BGG IDは外部キーですが、持っていない（ローカルのみの）ゲームもあり得るのでnil許可
  validates :bgg_id, uniqueness: true, allow_nil: true

  # リレーション（関連）: 他のテーブルとの関係性
  # has_many :library_entries -> 1つのGameは複数のLibraryEntryを持つ（1対多）
  # これにより、game.library_entries というメソッドで関連レコードを取得できるようになります。
  has_many :library_entries

  # 1つのGameは複数のPlayLogを持つ
  has_many :play_logs
end
