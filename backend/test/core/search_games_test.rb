require_relative "../test_helper"

class SearchGamesUseCaseTest < Minitest::Test
  def setup
    @game_repository = Minitest::Mock.new
    @game_gateway = Minitest::Mock.new
    @use_case = Core::UseCases::SearchGamesUseCase.new(
      game_repository: @game_repository,
      game_gateway: @game_gateway
    )
    @mock_game = Core::Entities::Game.new(id: "1", title: "Catan", bgg_id: "13")
  end

  def test_execute_local_search
    @game_repository.expect :search, [@mock_game], ["Catan"]

    results = @use_case.execute(query: "Catan", source: :local)

    assert_equal [@mock_game], results
    @game_repository.verify
  end

  def test_execute_bgg_search
    @game_gateway.expect :search, [@mock_game], ["Catan"]

    results = @use_case.execute(query: "Catan", source: :bgg)

    assert_equal [@mock_game], results
    @game_gateway.verify
  end
end
