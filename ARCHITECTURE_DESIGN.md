# アーキテクチャ設計書 (Architecture Design Document)

## 1. 概要
本プロジェクト（Board Game Manager）の拡張性、可読性、保守性を向上させるため、**Feature-Sliced Design (FSD)** の概念を取り入れた、Next.js (App Router) に最適化されたモダンなアーキテクチャを採用します。

## 2. システム構成 (Supabase移行後)

本アプリケーションは、フロントエンドにNext.js、バックエンド/データベースにSupabaseを採用した構成となります。

```mermaid
graph TD
    subgraph Client ["クライアント層 (Browser)"]
        UI[Next.js App Router<br/>(React Components)]
        Zustand[クライアント状態管理<br/>(Local State / Context)]
    end

    subgraph AppServer ["アプリケーション層 (Vercel)"]
        ServerActions[Server Actions<br/>(Backend Logic)]
        AuthMiddleware[Middleware<br/>(認証チェック)]
    end

    subgraph Backend ["データ層 (Supabase)"]
        Postgres[(PostgreSQL<br/>Database)]
        Auth[GoTrue<br/>(Authentication)]
        Storage[Storage<br/>(画像保存)]
        Realtime[Realtime<br/>(WebSocket)]
    end

    subgraph External ["外部サービス"]
        BGG[BoardGameGeek API]
    end

    %% Data Flow
    UI -->|操作・データ取得| ServerActions
    UI -->|画像アップロード| Storage
    UI -->|認証| Auth

    ServerActions -->|クエリ・更新| Postgres
    ServerActions -->|検索| BGG

    Postgres -->|RLS (Row Level Security)| Auth
```

### 2.1 各レイヤーの責務

1.  **Client Layer (Browser)**
    *   **UI描画**: React Server Components (RSC) と Client Components を適切に使い分けます。
    *   **インタラクション**: ユーザー入力のハンドリング、ダイアログ表示など。
    *   **データ取得**: 初期表示はRSC、動的な更新はServer ActionsまたはSupabase Client (`@supabase/ssr`) を利用。

2.  **Application Layer (Next.js Server Actions)**
    *   **APIエンドポイントの代替**: 従来のREST APIの代わりに、Server Actions関数を直接呼び出します。
    *   **ビジネスロジック**: 外部API (BGG) へのリクエスト、データの加工、バリデーションを実行します。
    *   **セキュリティ**: Supabase Authのセッション検証を行い、不正なアクセスをブロックします。

3.  **Data Layer (Supabase)**
    *   **データ永続化**: PostgreSQLによるリレーショナルデータの管理。
    *   **セキュリティ (RLS)**: データベースレベルで「誰がどのデータを読めるか」を厳密に制御します（公開/フレンド限定/非公開）。
    *   **アセット管理**: ユーザーアイコンやプレイ記録の写真をStorageバケットに保存します。

## 3. アーキテクチャの基本方針 (ディレクトリ構造・設計原則)

### 3.1 ディレクトリ構造
Feature-Sliced Design (FSD) に基づき、機能ごとにディレクトリを分割します。

```text
src/
├── app/                 # Next.js App Router (ルーティング定義、Layout)
│   ├── layout.tsx
│   ├── page.tsx         # ページはFeaturesを組み合わせるだけの薄い層にする
│   └── ...
├── features/            # 機能（ドメイン）ごとのモジュール
│   ├── boardgames/      # ボードゲーム管理機能
│   ├── auth/            # 認証機能
│   ├── gacha/           # ガチャ機能
│   └── playlogs/        # [New] 戦績・プレイ記録機能
├── components/          # 汎用UIコンポーネント (ドメイン知識を持たない)
├── lib/                 # 外部ライブラリの設定 (Supabase Client等)
├── hooks/               # アプリケーション全体で使う汎用フック
└── types/               # アプリケーション全体で使う共通の型定義
```

### 3.2 コンポーネント設計原則

*   **Container / Presentational Pattern**:
    *   ロジック（データ取得、状態管理）とUI（表示）を分離します。
*   **Server vs Client Components**:
    *   データフェッチを伴うリスト表示などは可能な限り Server Component (RSC) で実装し、パフォーマンスを最適化します。
    *   インタラクティブな部分（ボタン、フォーム、ダイアログ）は Client Component (`use client`) として切り出します。

## 4. コーディング規約・指針

*   **命名規則**: PascalCase (Component), camelCase (Hook/Function), UPPER_SNAKE_CASE (Constant)
*   **Testing**: 実装ファイルの隣にテストを配置 (`Colocation`)。Server Actionsの単体テストも実施します。

## 5. 今後の拡張性について

Supabase (PostgreSQL) を採用することで、将来的に以下のような機能拡張が容易になります。
*   **高度な分析**: SQLを用いた複雑な集計（例：月間プレイ回数ランキング、勝率分析）。
*   **全文検索**: pg_search 等を用いた高速なゲーム検索。
*   **リアルタイム通知**: フレンドからの申請や「いいね」をリアルタイムで通知。
