module Core
  # UseCasesモジュール
  # ユーザーが行う操作（ユースケース）を1つのクラスとして定義します。
  # 「検索する」「登録する」などの動詞がそのままクラス名になります。
  # このクラスがRepositoryやGatewayを調整し、ビジネスロジックを実行します。
  module UseCases
    class SearchGamesUseCase
      # @param game_repository [Core::Repositories::GameRepository] データベースへの操作
      # @param game_gateway [Core::Gateways::GameGateway] BGG APIへのアクセス
      #
      # Dependency Injection（依存性注入）のパターンを採用しています。
      # このUseCaseは、具体的なRepository（ActiveRecordなど）やGateway（Faradayなど）の実装を知らず、
      # コンストラクタで渡される抽象的なインターフェース（Repository/Gateway）に依存します。
      # これにより、テスト時にモック（Mock）に差し替えたり、実装を簡単に変更したりできます。
      def initialize(game_repository:, game_gateway:)
        @game_repository = game_repository
        @game_gateway = game_gateway
      end

      # ユースケースの実行メソッド（execute）
      # ここに検索ロジックを記述します。
      # 1. 検索ソース（source）がローカルかBGGかで処理を分岐
      # 2. 指定されたリポジトリまたはゲートウェイからデータを取得
      # @param query [String] 検索クエリ
      # @param source [Symbol] :local（ローカルDB検索）または :bgg（BGG API検索）を指定
      # @return [Array<Core::Entities::Game>] 見つかったゲームの配列
      def execute(query:, source: :local)
        if source == :bgg
          # Gatewayを使って外部APIから検索
          @game_gateway.search(query)
        else
          # Repositoryを使ってローカルデータベースから検索
          @game_repository.search(query)
        end
      end
    end
  end
end
