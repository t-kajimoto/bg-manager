module Core
  module UseCases
    class SearchGamesUseCase
      # @param game_repository [Core::Repositories::GameRepository]
      # @param game_gateway [Core::Gateways::GameGateway]
      def initialize(game_repository:, game_gateway:)
        @game_repository = game_repository
        @game_gateway = game_gateway
      end

      def execute(query:, source: :local)
        if source == :bgg
          @game_gateway.search(query)
        else
          @game_repository.search(query)
        end
      end
    end
  end
end
