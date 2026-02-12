module Core
  module Repositories
    module GameRepository
      # @param id [String]
      # @return [Core::Entities::Game, nil]
      def find_by_id(id)
        raise NotImplementedError
      end

      # @param query [String]
      # @return [Array<Core::Entities::Game>]
      def search(query)
        raise NotImplementedError
      end

      # @param game [Core::Entities::Game]
      # @return [Core::Entities::Game]
      def save(game)
        raise NotImplementedError
      end

      # @param bgg_id [String]
      # @return [Core::Entities::Game, nil]
      def find_by_bgg_id(bgg_id)
        raise NotImplementedError
      end
    end
  end
end
