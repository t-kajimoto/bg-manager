module Infrastructure
  module Repositories
    # GameRepositoryの実装クラス
    # Core::Repositories::GameRepository インターフェースを満たす具象クラスです。
    # この層（Infrastructure）で初めて、データベースの実装詳細（ActiveRecordなど）を知っています。
    # ここでの責務は、Core層のエンティティとDBのデータを相互に変換することです（Data Mapperパターン）。
    class GameRepository
      # find_by_idメソッドの実装
      # @param id [String]
      # @return [Core::Entities::Game, nil]
      def find_by_id(id)
        # ActiveRecordの ::Game モデル（DB操作クラス）を使ってDBから検索
        # ::Game のように :: をつけるのは、トップレベルの Gameクラス（ActiveRecordモデル）を参照するためです。
        ar_game = ::Game.find_by(id: id)
        # 見つかれば Entity に変換して返す
        to_entity(ar_game) if ar_game
      end

      # find_by_bgg_idメソッドの実装
      # @param bgg_id [String]
      # @return [Core::Entities::Game, nil]
      def find_by_bgg_id(bgg_id)
        ar_game = ::Game.find_by(bgg_id: bgg_id)
        to_entity(ar_game) if ar_game
      end

      # searchメソッドの実装
      # @param query [String]
      # @return [Array<Core::Entities::Game>]
      def search(query)
        # ILIKE は大文字小文字を区別しない検索（PostgreSQL特有のSQL標準拡張）
        # map を使って、取得したActiveRecordオブジェクトの配列を、Core::Entities::Game の配列に変換します。
        ::Game.where("title ILIKE ?", "%#{query}%").map { |ar| to_entity(ar) }
      end

      # saveメソッドの実装
      # @param game_entity [Core::Entities::Game]
      # @return [Core::Entities::Game]
      def save(game_entity)
        # find_or_initialize_by: 指定条件で見つかればそのオブジェクトを、なければ新しいオブジェクト（メモリ上のみ）を返します。
        ar_game = ::Game.find_or_initialize_by(bgg_id: game_entity.bgg_id)

        # Entityの値をActiveRecordモデルにコピー
        ar_game.title = game_entity.title
        ar_game.image_url = game_entity.image_url
        ar_game.min_players = game_entity.min_players
        ar_game.max_players = game_entity.max_players

        # DBに保存（save! は失敗時に例外を発生させる）
        ar_game.save!

        # 保存された最新の状態（自動生成されたIDなどを含む）をEntityに変換して返す
        to_entity(ar_game)
      end

      private

      # ヘルパーメソッド: ActiveRecordモデル -> Core Entity への変換
      # この変換を行うことで、Core層のビジネスロジックがDBスキーマの変更（カラム名変更など）から守られます。
      def to_entity(ar_game)
        Core::Entities::Game.new(
          id: ar_game.id,
          title: ar_game.title,
          image_url: ar_game.image_url,
          min_players: ar_game.min_players,
          max_players: ar_game.max_players,
          bgg_id: ar_game.bgg_id
        )
      end
    end
  end
end
