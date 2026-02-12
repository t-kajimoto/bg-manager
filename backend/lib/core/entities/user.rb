module Core
  module Entities
    # Userエンティティ
    # ユーザープロフィールを表現します。DBの profiles テーブルと対応しますが、
    # Core層ではあくまで「ユーザー情報」として抽象化します。
    class User
      # 外部から読み取り専用（Read Only）として定義するアクセサ
      attr_reader :id, :username, :avatar_url, :default_visibility

      # 初期化メソッド
      # id: 必須（UUIDを想定）
      # username: 必須（表示名）
      # default_visibility: デフォルト引数（省略時は 'public'）
      def initialize(id:, username:, avatar_url: nil, default_visibility: 'public')
        @id = id
        @username = username
        @avatar_url = avatar_url
        @default_visibility = default_visibility
      end
    end
  end
end
