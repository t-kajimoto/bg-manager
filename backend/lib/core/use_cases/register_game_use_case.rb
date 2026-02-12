module Core
  module UseCases
    class RegisterGameUseCase
      # @param game_repository [Core::Repositories::GameRepository]
      # @param game_gateway [Core::Gateways::GameGateway]
      def initialize(game_repository:, game_gateway:)
        @game_repository = game_repository
        @game_gateway = game_gateway
      end

      def execute(bgg_id:)
        existing_game = @game_repository.find_by_bgg_id(bgg_id)
        return existing_game if existing_game

        game_details = @game_gateway.find_by_id(bgg_id)
        raise "Game not found on BGG" unless game_details

        @game_repository.save(game_details)
      end
    end
  end
end
