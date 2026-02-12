# Supabase移行 & バックエンドアーキテクチャ設計書

本書は、HARIDICEアプリケーションのバックエンドをFirebase (Firestore) からSupabase (PostgreSQL) へ移行するための設計および実装計画をまとめたものです。

## 1. 目的

-   **拡張性のあるバックエンド**: クライアント主導のNoSQLアーキテクチャから、複雑なクエリやリレーションをサポートする構造化されたリレーショナルデータベース (RDB) へ移行します。
-   **ソーシャル機能**: フレンドシステムやゲームライブラリの公開機能など、Firestoreでは効率的な実装が難しい機能を実現します。
-   **詳細な記録機能**: ゲームごとの評価とは別に、日々のプレイ記録（戦績）を写真付きで残せるようにします。
-   **セキュリティ**: 行レベルセキュリティ (RLS) ポリシーを実装し、データの公開範囲（非公開/フレンドのみ/全体公開）を厳密に管理します。

## 2. データベーススキーマ設計 (PostgreSQL)

### 2.1. ER図の概要

```mermaid
erDiagram
    profiles ||--o{ library_entries : "所持・評価"
    profiles ||--o{ play_logs : "プレイ記録"
    profiles ||--o{ friendships : "申請"
    profiles ||--o{ friendships : "承認"
    games ||--o{ library_entries : "参照"
    games ||--o{ play_logs : "参照"

    profiles {
        uuid id PK "auth.users.idを参照"
        string username
        string avatar_url
        string default_visibility "play_logsなどのデフォルト公開設定"
        timestamp created_at
    }

    games {
        uuid id PK
        string title
        string image_url
        int min_players
        int max_players
        string bgg_id "外部ID (BoardGameGeek)"
        timestamp created_at
    }

    library_entries {
        uuid id PK
        uuid user_id FK
        uuid game_id FK
        string status "owned(所持) / wanted(欲しい) / played(プレイ済)"
        int rating "1-10 (そのゲームに対する総合評価)"
        text comment "ゲーム全体へのコメント"
        string visibility "private / friends / public"
        timestamp updated_at
        unique(user_id, game_id) "1ユーザー1ゲームにつき1エントリー"
    }

    play_logs {
        uuid id PK
        uuid user_id FK
        uuid game_id FK
        date played_on "プレイ日"
        text memo "戦績や感想（フリーフォーマット）"
        string image_path "Storage内の画像パス (1枚まで)"
        string visibility "private / friends / public"
        timestamp created_at
    }

    friendships {
        uuid user_id FK
        uuid friend_id FK
        string status "pending(申請中) / accepted(承認済)"
        timestamp created_at
    }
```

### 2.2. テーブル定義とRLSポリシー

#### `profiles` (ユーザープロフィール)
-   **RLS**:
    -   `SELECT`: 公開（ユーザー名やアバターは誰でも参照可能）。
    -   `UPDATE`: 本人のみ更新可能。

#### `games` (ゲームマスタ)
-   **RLS**:
    -   `SELECT`: 公開。
    -   `INSERT`: 認証済みユーザー（存在しないゲームは誰でも登録可能）。
    -   `UPDATE`: 管理者または信頼されたユーザーのみ。

#### `library_entries` (所持リスト・評価)
-   **役割**: 「このゲームを持ってる」「星5つ」といった、ゲームそのものへのステータス管理。
-   **RLS**:
    -   `SELECT`: `visibility` 設定に基づく（publicなら全員、friendsならフレンドのみ）。
    -   `INSERT/UPDATE/DELETE`: 本人のみ。

#### `play_logs` (プレイ記録・戦績)
-   **役割**: 「〇月×日に遊んで勝った！」といった、個別のプレイ体験の記録。
-   **機能**: フリーフォーマットのメモ、写真添付(1枚)。
-   **RLS**:
    -   `SELECT`: `visibility` 設定に基づく。
    -   `INSERT/UPDATE/DELETE`: 本人のみ。

#### `friendships` (フレンド関係)
-   **RLS**:
    -   `SELECT`: 当事者のみ。
    -   `INSERT`: 申請者のみ。
    -   `UPDATE`: 受信者（承認時）または申請者（キャンセル時）。

## 3. API設計 (Server Actions)

Next.js Server Actions をAPI層として利用し、Supabaseと直接やり取りします。

### 3.1. ゲーム管理
-   `searchGames(query: string)`: ローカルDBまたは外部API (BGG) からゲームを検索。
-   `registerGame(gameData: Game)`: 新しいゲームをマスタに登録。

### 3.2. ライブラリ・評価管理
-   `upsertLibraryEntry(gameId: string, status: string, rating?: number, comment?: string)`: 所持状況や評価を更新。
-   `getLibrary(userId: string)`: 指定ユーザーのライブラリを取得（RLSに従う）。

### 3.3. プレイ記録管理
-   `addPlayLog(data: PlayLogInput)`: プレイ記録を作成（画像アップロード含む）。
-   `getPlayLogs(userId: string, gameId?: string)`: プレイ記録の一覧を取得。
-   `updatePlayLog(logId: string, data: Partial<PlayLogInput>)`: 記録の修正。
-   `deletePlayLog(logId: string)`: 記録の削除。

### 3.4. ソーシャル機能
-   `sendFriendRequest(targetUserId: string)`: フレンド申請。
-   `acceptFriendRequest(requestId: string)`: 申請承認。
-   `getFriends()`: フレンド一覧取得。

## 4. 実装戦略

1.  **Supabaseセットアップ**:
    -   プロジェクト作成、テーブル・RLS作成。
    -   Storageバケット作成（プレイ記録画像用: `play-log-images`）。
    -   Auth設定（Googleログイン）。

2.  **フロントエンド統合**:
    -   `@supabase/ssr` 導入。
    -   `AuthContext` を Supabase Auth に置き換え。
    -   既存の `useBoardgames` フックを Server Actions 経由に改修。

3.  **データ移行**:
    -   Firestoreからデータをエクスポートし、Supabaseへインポートするスクリプトを作成・実行。
