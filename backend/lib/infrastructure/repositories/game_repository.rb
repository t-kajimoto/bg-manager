module Infrastructure
  module Repositories
    class GameRepository
      # Note: This requires the Rails environment to be loaded and the Game model to exist.

      def find_by_id(id)
        ar_game = ::Game.find_by(id: id)
        to_entity(ar_game) if ar_game
      end

      def find_by_bgg_id(bgg_id)
        ar_game = ::Game.find_by(bgg_id: bgg_id)
        to_entity(ar_game) if ar_game
      end

      def search(query)
        ::Game.where("title ILIKE ?", "%#{query}%").map { |ar| to_entity(ar) }
      end

      def save(game_entity)
        ar_game = ::Game.find_or_initialize_by(bgg_id: game_entity.bgg_id)
        # Update attributes from entity
        ar_game.title = game_entity.title
        ar_game.image_url = game_entity.image_url
        ar_game.min_players = game_entity.min_players
        ar_game.max_players = game_entity.max_players

        ar_game.save!
        to_entity(ar_game)
      end

      private

      def to_entity(ar_game)
        Core::Entities::Game.new(
          id: ar_game.id,
          title: ar_game.title,
          image_url: ar_game.image_url,
          min_players: ar_game.min_players,
          max_players: ar_game.max_players,
          bgg_id: ar_game.bgg_id
        )
      end
    end
  end
end
