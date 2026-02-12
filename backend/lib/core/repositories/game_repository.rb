module Core
  # Repositoriesモジュール
  # データの永続化（保存・取得）に関わる「抽象的なインターフェース（約束事）」を定義します。
  # 実際にどのように保存されるか（ActiveRecord, CSV, Supabase APIなど）はここには書きません。
  # これにより、Core層がデータベースの実装詳細に依存することを防ぎます（依存性逆転の原則）。
  module Repositories
    module GameRepository
      # IDでゲームを検索するメソッドのインターフェース
      # 実装クラスでは、見つかった場合は Core::Entities::Game を返し、なければ nil を返すことが期待されます。
      # @param id [String]
      # @return [Core::Entities::Game, nil]
      def find_by_id(id)
        # NotImplementedError: このメソッドが具象クラスでオーバーライド（実装）されていない場合に発生します。
        # RubyにはJavaのInterfaceのような構文がないため、このように表現します。
        raise NotImplementedError
      end

      # クエリ文字列でゲームを検索するメソッド
      # @param query [String]
      # @return [Array<Core::Entities::Game>] ゲームの配列を返す
      def search(query)
        raise NotImplementedError
      end

      # ゲームエンティティを保存するメソッド
      # @param game [Core::Entities::Game]
      # @return [Core::Entities::Game] 保存後のエンティティ（IDが付与されたものなど）
      def save(game)
        raise NotImplementedError
      end

      # BoardGameGeekのID（外部ID）でゲームを検索するメソッド
      # @param bgg_id [String]
      # @return [Core::Entities::Game, nil]
      def find_by_bgg_id(bgg_id)
        raise NotImplementedError
      end
    end
  end
end
