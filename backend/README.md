# HARIDICE Backend (Ruby on Rails + Clean Architecture)

このディレクトリには、HARIDICEアプリケーションのバックエンドAPIが含まれています。
Ruby on Railsフレームワークを使用していますが、将来的な変更やテストのしやすさを考慮し、**クリーンアーキテクチャ（Clean Architecture）** の設計思想を取り入れています。

## 📚 このコードで学べること

RubyやRailsの基本に加え、以下の設計パターンを学ぶことができます。

1.  **Clean Architecture**: ビジネスロジック（Core）とフレームワーク（Rails/Infrastructure）の分離
2.  **Dependency Injection (DI)**: 依存性の注入によるテスト容易性の向上
3.  **Repository Pattern**: データの保存場所（DBなど）を抽象化する方法
4.  **Gateway Pattern**: 外部API（BGG API）との通信を抽象化する方法
5.  **Minitest & Mock**: 外部依存なしで高速に実行できるユニットテスト

## 📂 ディレクトリ構成と役割

```
backend/
├── app/
│   └── models/       # 【Infrastructure層】RailsのActiveRecordモデル（DB操作）
│       └── game.rb   # gamesテーブルに対応するクラス
├── config/           # Railsの設定ファイル（DB接続設定など）
├── db/
│   └── migrate/      # データベースのスキーマ定義（テーブル作成など）
├── lib/
│   ├── core/         # 【Core層】ビジネスロジック（Railsに依存しない純粋なRuby）
│   │   ├── entities/     # データ構造（Game, Userなど）
│   │   ├── use_cases/    # アプリケーションの機能（検索、登録など）
│   │   ├── repositories/ # データ保存のインターフェース（約束事）
│   │   └── gateways/     # 外部通信のインターフェース（約束事）
│   └── infrastructure/ # 【Infrastructure層】Core層のインターフェースの実装
│       ├── repositories/ # ActiveRecordを使った保存処理の実装
│       └── gateways/     # Faradayなどを使った外部API通信の実装
└── test/             # テストコード
    └── core/         # Core層（ビジネスロジック）のユニットテスト
```

## 🏗️ アーキテクチャの解説

このプロジェクトは、大きく **Core層** と **Infrastructure層** に分かれています。

### 1. Core層 (`lib/core/`)
アプリケーションの「核」となる部分です。ここには **Railsの機能（ActiveRecordなど）は一切書きません**。純粋なRubyのクラスだけで構成します。
これにより、DBをPostgreSQLからMySQLに変えたり、WebフレームワークをRailsからSinatraに変えたりしても、この層のコードは変更する必要がありません。

*   **Entities**: `Game` や `User` のような、ビジネス上の概念を表現するデータクラスです。
*   **Use Cases**: `SearchGames` や `RegisterGame` のような、「ユーザーがやりたいこと」を表現するクラスです。
*   **Interfaces (Repositories/Gateways)**: Core層が必要とする機能（保存する、検索するなど）の「契約」だけを定義します。中身の実装は書きません。

### 2. Infrastructure層 (`lib/infrastructure/`, `app/models/`)
Core層で定義されたインターフェースを、具体的な技術（Rails, PostgreSQL, 外部APIなど）を使って実装する層です。

*   **Repository Impl**: `ActiveRecordGameRepository` は、Railsのモデルを使って実際にDBを操作します。
*   **Gateway Impl**: `BggGateway` は、HTTPクライアントを使って実際にBGG APIと通信します。
*   **Rails Models**: `app/models/game.rb` は、Railsの仕組みでDBとやり取りするためのクラスです。

## 🚀 学習ガイド：コードを読む順番

以下の順番でコードを読んでいくと、全体の仕組みが理解しやすいです。

1.  **データ構造を知る**: `lib/core/entities/game.rb`
    *   まずは、どのようなデータを扱うのかを確認します。
2.  **やりたいことを知る**: `lib/core/use_cases/register_game_use_case.rb`
    *   「ゲームを登録する」という処理の流れ（フロー）を読みます。
    *   ここで `game_repository` や `game_gateway` がどのように使われているかに注目してください。
3.  **契約を知る**: `lib/core/repositories/game_repository.rb`
    *   Use Caseが使っているメソッドが、どのようなルール（引数や戻り値）で定義されているかを確認します。
4.  **実装を知る**: `lib/infrastructure/repositories/game_repository.rb`
    *   そのルールが、実際にはどのように実装されているか（ActiveRecordをどう使っているか）を確認します。
5.  **テストを見る**: `test/core/register_game_use_case_test.rb`
    *   Use Caseが正しく動くことを、どのように検証しているかを確認します（特にMockの使い方）。

## 🧪 テストの実行方法

現在の環境では、Railsの完全なセットアップ（DB接続など）は行っていませんが、**Core層のビジネスロジックのテスト** は実行可能です。
これは、モック（Mock）を使ってDBやAPIへの依存を排除しているためです。

```bash
# Core層のテストを実行
ruby backend/test/core/search_games_test.rb
ruby backend/test/core/register_game_test.rb
```

### ⚠️ トラブルシューティング

もし `bundle install` 実行時に `psych` などのgemインストールでエラーが発生する場合は、以下のシステムライブラリが必要な場合があります。

```bash
# Ubuntu/Debianの場合
sudo apt-get install libyaml-dev
```

## 📝 コメントについて

ソースコード内には、Rubyの文法やClean Architectureの概念について、詳細な日本語コメントを追加しています。
コードを読みながら、コメントも合わせて確認してください。
