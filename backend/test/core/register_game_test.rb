require_relative "../test_helper"

class RegisterGameUseCaseTest < Minitest::Test
  def setup
    @game_repository = Minitest::Mock.new
    @game_gateway = Minitest::Mock.new
    @use_case = Core::UseCases::RegisterGameUseCase.new(
      game_repository: @game_repository,
      game_gateway: @game_gateway
    )

    @mock_game_details = Core::Entities::Game.new(id: nil, title: "Catan", bgg_id: "13")
    @mock_saved_game = Core::Entities::Game.new(id: "1", title: "Catan", bgg_id: "13")
  end

  def test_returns_existing_game
    @game_repository.expect :find_by_bgg_id, @mock_saved_game, ["13"]

    result = @use_case.execute(bgg_id: "13")

    assert_equal @mock_saved_game, result
    @game_repository.verify
  end

  def test_fetches_and_saves_if_not_exists
    @game_repository.expect :find_by_bgg_id, nil, ["13"]
    @game_gateway.expect :find_by_id, @mock_game_details, ["13"]
    @game_repository.expect :save, @mock_saved_game, [@mock_game_details]

    result = @use_case.execute(bgg_id: "13")

    assert_equal @mock_saved_game, result
    @game_repository.verify
    @game_gateway.verify
  end

  def test_raises_if_not_found_on_bgg
    @game_repository.expect :find_by_bgg_id, nil, ["999"]
    @game_gateway.expect :find_by_id, nil, ["999"]

    assert_raises(RuntimeError) { @use_case.execute(bgg_id: "999") }

    @game_repository.verify
    @game_gateway.verify
  end
end
