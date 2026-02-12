module Core
  # UseCasesモジュール
  # ユーザーが行う操作（ユースケース）を1つのクラスとして定義します。
  # 「検索する」「登録する」などの動詞がそのままクラス名になります。
  # このクラスがRepositoryやGatewayを調整し、ビジネスロジックを実行します。
  module UseCases
    class RegisterGameUseCase
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
      # ここに具体的な手順（フロー）を記述します。
      # 1. すでにDBに保存されているか確認
      # 2. なければBGG APIから詳細を取得
      # 3. 取得したデータをDBに保存
      # @param bgg_id [String] 登録したいゲームのBGG ID
      # @return [Core::Entities::Game] 登録された（または既に存在した）ゲームエンティティ
      def execute(bgg_id:)
        # ステップ1: ローカルDBを検索
        # @game_repository が実際にはActiveRecordGameRepositoryかもしれないが、find_by_bgg_idメソッドを持っていることだけ知っている。
        existing_game = @game_repository.find_by_bgg_id(bgg_id)
        # 既にあれば、それを返して終了（ガード節）
        return existing_game if existing_game

        # ステップ2: 外部API（BGG）から情報を取得
        game_details = @game_gateway.find_by_id(bgg_id)
        # 見つからない場合はエラー（例外）を発生させる
        raise "Game not found on BGG" unless game_details

        # ステップ3: 取得した情報をローカルDBに保存
        # saveメソッドが保存後のエンティティを返すことを期待している
        @game_repository.save(game_details)
      end
    end
  end
end
