module Core
  module Gateways
    # GameGatewayモジュール
    # Gateway（ゲートウェイ）は、アプリケーション外部（APIなど）へのインターフェースを定義します。
    # ここでは、外部のBoardGameGeek API（BGG）へのアクセスを抽象化しています。
    # Repositoryと同様に、Core層はこの「機能」だけを知っており、HTTPライブラリ（Faradayなど）の詳細は知りません。
    module GameGateway
      # キーワード（タイトルなど）でゲームを検索するメソッドのインターフェース
      # @param query [String] 検索クエリ
      # @return [Array<Core::Entities::Game>] 見つかったゲームの配列
      def search(query)
        raise NotImplementedError
      end

      # 外部ID（BGG ID）でゲームの詳細情報を取得するメソッド
      # @param id [String] BGG ID
      # @return [Core::Entities::Game, nil] ゲームが見つかった場合はEntity、なければnil
      def find_by_id(id)
        raise NotImplementedError
      end
    end
  end
end
