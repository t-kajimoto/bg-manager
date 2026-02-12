require_relative "../test_helper"

# RegisterGameUseCaseのテストクラス
class RegisterGameUseCaseTest < Minitest::Test
  def setup
    # 依存関係のモック作成
    @game_repository = Minitest::Mock.new
    @game_gateway = Minitest::Mock.new

    # UseCaseの初期化
    @use_case = Core::UseCases::RegisterGameUseCase.new(
      game_repository: @game_repository,
      game_gateway: @game_gateway
    )

    # テストデータ準備
    @mock_game_details = Core::Entities::Game.new(id: nil, title: "Catan", bgg_id: "13")
    @mock_saved_game = Core::Entities::Game.new(id: "1", title: "Catan", bgg_id: "13")
  end

  # テストケース1: すでにDBに存在する場合
  def test_returns_existing_game
    # find_by_bgg_id が "13" という引数で呼ばれたら、@mock_saved_game を返すと期待
    @game_repository.expect :find_by_bgg_id, @mock_saved_game, ["13"]

    result = @use_case.execute(bgg_id: "13")

    # 既存のゲームを返しているか検証
    assert_equal @mock_saved_game, result

    # モックの呼び出し確認
    @game_repository.verify
  end

  # テストケース2: DBになく、外部APIから取得して保存する場合
  def test_fetches_and_saves_if_not_exists
    # DBには見つからない（nilを返す）
    @game_repository.expect :find_by_bgg_id, nil, ["13"]

    # Gatewayで外部APIから詳細情報を取得する（詳細情報を返す）
    @game_gateway.expect :find_by_id, @mock_game_details, ["13"]

    # Repositoryに保存処理が行われる（保存されたゲームを返す）
    @game_repository.expect :save, @mock_saved_game, [@mock_game_details]

    result = @use_case.execute(bgg_id: "13")

    # 最終的に保存されたゲームが返されるか検証
    assert_equal @mock_saved_game, result

    # すべてのモック呼び出しが正しく行われたか確認
    @game_repository.verify
    @game_gateway.verify
  end

  # テストケース3: DBにもBGGにも存在しない場合（例外発生）
  def test_raises_if_not_found_on_bgg
    # DBにない
    @game_repository.expect :find_by_bgg_id, nil, ["999"]

    # Gatewayでも見つからない
    @game_gateway.expect :find_by_id, nil, ["999"]

    # assert_raises: 指定したブロック内で例外（RuntimeError）が発生することを検証します。
    assert_raises(RuntimeError) { @use_case.execute(bgg_id: "999") }

    @game_repository.verify
    @game_gateway.verify
  end
end
