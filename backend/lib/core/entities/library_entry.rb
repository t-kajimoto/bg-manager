module Core
  module Entities
    class LibraryEntry
      attr_reader :id, :user_id, :game_id, :status, :rating, :comment, :visibility

      def initialize(id: nil, user_id:, game_id:, status:, rating: nil, comment: nil, visibility: 'public')
        @id = id
        @user_id = user_id
        @game_id = game_id
        @status = status
        @rating = rating
        @comment = comment
        @visibility = visibility
      end
    end
  end
end
