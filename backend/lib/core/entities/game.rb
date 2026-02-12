module Core
  module Entities
    class Game
      attr_reader :id, :title, :image_url, :min_players, :max_players, :bgg_id

      def initialize(id: nil, title:, image_url: nil, min_players: nil, max_players: nil, bgg_id: nil)
        @id = id
        @title = title
        @image_url = image_url
        @min_players = min_players
        @max_players = max_players
        @bgg_id = bgg_id
      end

      def to_h
        {
          id: id,
          title: title,
          image_url: image_url,
          min_players: min_players,
          max_players: max_players,
          bgg_id: bgg_id
        }
      end
    end
  end
end
