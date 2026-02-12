module Core
  # Coreモジュールは、アプリケーションの中心的なビジネスロジックを保持する名前空間です。
  # 外部のフレームワーク（RailsやDBなど）に依存しない純粋なRubyコードです。
  module Entities
    # Entity（エンティティ）は、ビジネスにとって重要な概念（データとその振る舞い）を表現します。
    # データベースのテーブル構造とは必ずしも一致せず、ビジネスルールに従って設計されます。
    class Game
      # attr_reader: インスタンス変数（@idなど）を読み取るためのメソッドを自動定義します。
      # game.id のように外部からアクセス可能になります。
      attr_reader :id, :title, :image_url, :min_players, :max_players, :bgg_id

      # initialize: クラスのインスタンス（オブジェクト）が生成されるときに呼ばれる初期化メソッドです。
      # キーワード引数（id:, title:など）を使うことで、引数の順序を気にする必要がなくなり、可読性が向上します。
      def initialize(id: nil, title:, image_url: nil, min_players: nil, max_players: nil, bgg_id: nil)
        @id = id                  # 内部ID（DBのプライマリキーなど）
        @title = title            # ゲームのタイトル
        @image_url = image_url    # 画像URL
        @min_players = min_players # 最小プレイ人数
        @max_players = max_players # 最大プレイ人数
        @bgg_id = bgg_id          # BoardGameGeek（外部サービス）のID
      end

      # オブジェクトの状態をハッシュ（連想配列）形式で返します。
      # JSONレスポンスへの変換などで便利です。
      def to_h
        {
          id: id,
          title: title,
          image_url: image_url,
          min_players: min_players,
          max_players: max_players,
          bgg_id: bgg_id
        }
      end
    end
  end
end
