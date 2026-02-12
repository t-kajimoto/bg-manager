# テストヘルパーを読み込む（共通の設定や依存関係）
require_relative "../test_helper"

# Minitest::Testクラスを継承してテストケースを定義します。
# SearchGamesUseCase のビジネスロジックが正しいか検証します。
class SearchGamesUseCaseTest < Minitest::Test
  # setupメソッド: 各テストメソッド（test_で始まるメソッド）の実行前に必ず呼ばれます。
  # 共通の初期化処理（インスタンス生成など）をここに書きます。
  def setup
    # Minitest::Mock.new: モックオブジェクトを作成します。
    # RepositoryやGatewayの実物は使わず、「偽物」を使ってテストします。
    # これにより、DB接続や外部API通信なしでテストが可能になります（高速かつ安定的）。
    @game_repository = Minitest::Mock.new
    @game_gateway = Minitest::Mock.new

    # テスト対象のUseCaseを初期化
    # 依存性注入（DI）により、実物の代わりにモックを渡しています。
    @use_case = Core::UseCases::SearchGamesUseCase.new(
      game_repository: @game_repository,
      game_gateway: @game_gateway
    )

    # テストデータ（期待される結果）の準備
    @mock_game = Core::Entities::Game.new(id: "1", title: "Catan", bgg_id: "13")
  end

  # test_ で始まるメソッドがテストとして実行されます。
  # ローカル検索（source: :local）の場合のテスト
  def test_execute_local_search
    # expectメソッド: モックに対する期待値を設定します。
    # :search -> searchメソッドが呼ばれることを期待
    # [@mock_game] -> そのメソッドが返す値（戻り値）を設定
    # ["Catan"] -> そのメソッドに渡されるべき引数のリスト
    @game_repository.expect :search, [@mock_game], ["Catan"]

    # 実際にUseCaseを実行
    results = @use_case.execute(query: "Catan", source: :local)

    # assert_equal: 結果が期待通りか検証します（左: 期待値, 右: 実測値）
    assert_equal [@mock_game], results

    # verify: 設定した期待通りにモックのメソッドが呼ばれたか確認します。
    # もし search メソッドが呼ばれていなければ、ここでテスト失敗になります。
    @game_repository.verify
  end

  # BGG検索（source: :bgg）の場合のテスト
  def test_execute_bgg_search
    # Gatewayのsearchメソッドが呼ばれることを期待
    @game_gateway.expect :search, [@mock_game], ["Catan"]

    # UseCaseを実行（source: :bgg を指定）
    results = @use_case.execute(query: "Catan", source: :bgg)

    # 結果の検証
    assert_equal [@mock_game], results

    # Gatewayのメソッドが呼ばれたか確認
    @game_gateway.verify
  end
end
