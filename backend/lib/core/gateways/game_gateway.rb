module Core
  module Gateways
    module GameGateway
      # @param query [String]
      # @return [Array<Core::Entities::Game>]
      def search(query)
        raise NotImplementedError
      end

      # @param id [String]
      # @return [Core::Entities::Game, nil]
      def find_by_id(id)
        raise NotImplementedError
      end
    end
  end
end
