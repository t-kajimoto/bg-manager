module Core
  module Entities
    # LibraryEntryエンティティ
    # ユーザーが所有するボードゲームや、その評価（Rating）、ステータス（持っている/欲しいなど）を表現します。
    # 複数のテーブル（LibraryEntryとGame）を結合したデータを表現することもできますが、
    # ここではシンプルにデータ構造を定義しています。
    class LibraryEntry
      # 各種属性を読み取り専用で公開
      attr_reader :id, :user_id, :game_id, :status, :rating, :comment, :visibility

      # オブジェクト生成時の引数を定義
      # status: 'owned', 'wanted', 'played' などの文字列を想定
      # rating: 1〜10の整数
      # visibility: 'public', 'friends', 'private' などの公開範囲
      def initialize(id: nil, user_id:, game_id:, status:, rating: nil, comment: nil, visibility: 'public')
        @id = id              # エントリ自体のID
        @user_id = user_id    # 誰のエントリか
        @game_id = game_id    # どのゲームか
        @status = status      # 所有状況
        @rating = rating      # 評価
        @comment = comment    # コメント
        @visibility = visibility # 公開設定
      end
    end
  end
end
