module Core
  module Entities
    class User
      attr_reader :id, :username, :avatar_url, :default_visibility

      def initialize(id:, username:, avatar_url: nil, default_visibility: 'public')
        @id = id
        @username = username
        @avatar_url = avatar_url
        @default_visibility = default_visibility
      end
    end
  end
end
