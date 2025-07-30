
# アプリケーション総合設計書 (HARIDICE)

## 1. 概要

### 1.1. アプリケーションの目的

本アプリケーション「HARIDICE」は、個人またはサークルなどのコミュニティが所有するボードゲームをカタログ化し、管理することを目的としたWebアプリケーションです。
ユーザーはボードゲームの一覧を閲覧・検索できるほか、各ゲームに対する自身の評価やプレイ状況を記録することができます。また、特定の管理者ユーザーはボードゲームの情報を新規登録・編集することが可能です。

### 1.2. ターゲットユーザー

-   **一般ユーザー**: ボードゲームをプレイする人。どのゲームで遊ぶか探したり、自分のプレイ記録を付けたりする。
-   **管理者ユーザー**: ボードゲームを所有・管理する人。在庫の管理や情報のメンテナンスを行う。

### 1.3. 主要技術スタック

-   **フロントエンド**: Angular (v17+), TypeScript, SCSS
-   **UIライブラリ**: Angular Material
-   **バックエンド / BaaS**: Firebase (Google Cloud)
    -   **データベース**: Cloud Firestore
    -   **認証**: Firebase Authentication (Googleログイン)
    -   **ホスティング**: Firebase Hosting

---

## 2. システムアーキテクチャ

本システムは、サーバーレスアーキテクチャを採用しています。フロントエンドのAngularアプリケーションが、バックエンドサービスとしてFirebaseと直接通信します。

```
+---------------------+      +------------------------------------+
|      ユーザー       |      |             Firebase (BaaS)        |
| (Webブラウザ)       |      |                                    |
+---------------------+      |  +-------------------------------+ |
      ^   |                |  |      Firebase Authentication  | |
      |   |                |  | (Googleログイン)              | |
      v   |                |  +-------------------------------+ |
+---------------------+      |                                    |
|   Angular (SPA)     |      |  +-------------------------------+ |
| (HARIDICE フロントエンド) |----->|        Cloud Firestore        | |
|                     |      |  | (データベース)                | |
| - AppComponent      |      |  +-------------------------------+ |
| - ListComponent     |      |                                    |
| - Dialogs...        |      |  +-------------------------------+ |
| - AuthService       |      |        Firebase Hosting       | |
| - BoardgameService  |      |  | (静的ファイル配信)            | |
+---------------------+      |  +-------------------------------+ |
      ^                      +------------------------------------+
      |
      |
(デプロイ)
      |
+---------------------+ 
|      開発者         |
+---------------------+ 
```

-   **Firebase Hosting**: ビルドされたAngularの静的ファイル（HTML, CSS, JS）を配信します。
-   **Firebase Authentication**: Googleアカウントを利用したユーザー認証を担当します。認証が成功すると、ユーザー情報（UIDなど）をフロントエンドに提供します。
-   **Cloud Firestore**: アプリケーションのすべてのデータを格納するNoSQLデータベースです。フロントエンドはFirebase SDKを通じて直接Firestoreのデータを読み書きします。
-   **Angularアプリケーション**: ユーザーのUIとビジネスロジックのすべてを含みます。Firebase SDKを介して認証やデータベース操作を行います。

---

## 3. データベース設計 (Cloud Firestore)

Firestoreは3つの主要なトップレベルコレクションで構成されます。

### 3.1. `boardGames` コレクション

ボードゲームのマスターデータを格納します。

-   **パス**: `/boardGames/{boardGameId}`
-   **データモデル**: `IBoardGameData` インターフェースに対応
-   **フィールド**:
    -   `name` (string): ゲーム名
    -   `min` (number): 最小プレイ人数
    -   `max` (number): 最大プレイ人数
    -   `time` (number): 平均プレイ時間（分）
    -   `tags` (array of string): タグ
    -   `ownerName` (string): 所有者名

### 3.2. `userBoardGames` コレクション

「どのユーザー」が「どのゲーム」に対してどのような評価やプレイ状況か、という中間テーブル的な役割を果たします。

-   **パス**: `/userBoardGames/{userGameId}` (ドキュメントIDは `userId_boardGameId`)
-   **データモデル**: `IBoardGameUserFirestore` インターフェースに対応
-   **フィールド**:
    -   `userId` (string): ユーザーのUID
    -   `boardGameId` (string): ボードゲームのID
    -   `played` (boolean): プレイ済みか
    -   `evaluation` (number): 評価（1-5）
    -   `comment` (string): コメント

### 3.3. `users` コレクション

アプリケーションのユーザー情報を格納します。

-   **パス**: `/users/{userId}` (ドキュメントIDはFirebase AuthenticationのUID)
-   **データモデル**: `IUser` インターフェースに対応
-   **フィールド**:
    -   `uid` (string): ユーザーUID
    -   `email` (string): メールアドレス
    -   `displayName` (string): Googleアカウントの表示名
    -   `photoURL` (string): プロフィール写真URL
    -   `nickname` (string): アプリ内で設定したニックネーム

---

## 4. セキュリティ設計 (Firestore Security Rules)

Firestoreのアクセス制御は、`firestore.rules` ファイルに定義されたルールによってサーバーサイドで強制されます。これにより、クライアントサイドのコードがいかなるものであっても、不正なデータアクセスを防ぎます。

-   **基本方針**: デフォルトで拒否。明示的に許可された操作のみ実行可能。
-   **認証**: ほとんどの操作は `request.auth != null` を条件とし、ログインユーザーのみに許可されます。
-   **権限分離**:
    -   `boardGames`:
        -   `read`: 認証ユーザーなら誰でも可能。
        -   `write` (create, update, delete): `request.auth.uid` が指定された**管理者UID**と一致する場合のみ可能。
    -   `userBoardGames`:
        -   `read`: 認証ユーザーなら誰でも可能（平均評価の計算のため）。
        -   `write`: 書き込もうとしているデータの `userId` フィールド (`request.resource.data.userId`) が、操作者のUID (`request.auth.uid`) と一致する場合のみ可能。これにより、ユーザーは自身のデータしか変更できません。
    -   `users`:
        -   `read`, `write`: アクセスしようとしているドキュメントのID (`userId`) が、操作者のUID (`request.auth.uid`) と一致する場合のみ可能。これにより、ユーザーは自身のプロフィールしか変更できません。

---

## 5. フロントエンド設計

### 5.1. 主要コンポーネントと責務

-   **`AppComponent`**: アプリケーションのルートコンポーネント。
    -   責務: 全ページ共通のツールバー（ヘッダー）、ログイン/ログアウト処理、ニックネーム編集の起点を提供。`<router-outlet>` を持ち、ページのコンテナとして機能します。
-   **`ListComponent`**: メインページ。
    -   責務: ボードゲーム一覧の表示、ソート、フィルタリング。各種ダイアログ（追加・編集）を呼び出し、データの更新を `BoardgameService` に依頼します。
    -   詳細: [ボードゲーム一覧ページ 設計書](./list-page-design.md)
-   **Dialog Components** (`AddBoardgameDialogComponent`, `EditUserDataDialogComponent`, etc.)
    -   責務: 特定のタスク（データの入力や編集）に特化したUIを提供します。`MatDialog` によってモーダル表示され、終了時に結果を呼び出し元に返します。
    -   詳細: 各ダイアログの個別設計書を参照。

### 5.2. サービスと責務

-   **`AuthService`**: 認証に関するロジックをすべてカプセル化します。
    -   責務: Firebase Authenticationとの連携、Googleログイン/ログアウト処理、現在のユーザーの認証状態 (`Observable<User>`)、UID (`Observable<string>`)、管理者フラグ (`Observable<boolean>`) をアプリケーション全体に提供します。Firestoreの `users` コレクションへのユーザー情報保存・更新も担当します。
-   **`BoardgameService`**: Firestoreデータベースとの通信に関するロジックをすべてカプセル化します。
    -   責務: `boardGames` と `userBoardGames` コレクションに対するCRUD（作成、読み取り、更新、削除）操作をすべて担当します。複雑なデータ結合処理（ゲーム情報＋ユーザー評価＋平均評価など）をRxJSオペレータを用いて行い、コンポーネントが扱いやすい形式 (`Observable<IBoardGame[]>`) に加工して提供します。

---

## 6. ビルドとデプロイ

-   **設定ファイル**: `firebase.json`
    -   `firestore.rules`: デプロイ対象のセキュリティルールファイルを指定します。
    -   `hosting.public`: デプロイする静的ファイルが含まれるディレクトリ（`dist/bg-manager/browser`）を指定します。
    -   `hosting.rewrites`: すべてのURLリクエストを `/index.html` にリダイレクトし、Angularのクライアントサイドルーティングを機能させます。
-   **デプロイコマンド**:
    -   `npm run build`: Angular CLIを使ってアプリケーションをビルドし、`dist/` ディレクトリに成果物を生成します。
    -   `firebase deploy`: `firebase.json` の設定に基づき、HostingのファイルとFirestoreのルールをデプロイします。
        -   `--only firestore`: Firestoreルールのみをデプロイします。
        -   `--only hosting`: Hostingファイルのみをデプロイします。

