# ボードゲーム管理アプリ (bg-manager)

このプロジェクトは、個人またはグループで所有するボードゲームを管理するためのWebアプリケーションです。
AngularとFirebaseを主軸技術として開発されており、直感的なUIでボードゲームの追加、一覧表示、編集、削除といった基本的な操作を行えます。

## 主な機能

- **ボードゲームの登録:**
  - ゲームのタイトル、所有者、プレイ人数（最小・最大）、プレイ時間（最小・最大）などの詳細情報を登録できます。
- **ボードゲーム一覧表示:**
  - 登録されたボードゲームを一覧で確認できます。
  - 各ゲームの詳細情報（所有者、プレイ人数、プレイ時間など）も表示されます。
- **ゲーム情報の編集と削除:**
  - 登録済みのゲーム情報をいつでも更新できます。
  - 不要になったゲーム情報を削除する機能も備わっています。
- **ユーザー管理:**
  - ユーザーのニックネーム編集機能があります。

## 使用技術

本プロジェクトで利用している主要な技術スタックは以下の通りです。

- **フロントエンド:**
  - [Angular](https://angular.io/): Googleが開発したTypeScriptベースのWebアプリケーションフレームワーク。
  - [Angular Material](https://material.angular.io/): 高品質なUIコンポーネントライブラリ。
- **バックエンド & データベース:**
  - [Firebase](https://firebase.google.com/):
    - **Authentication:** ユーザー認証機能を提供。
    - **Firestore:** NoSQLデータベースとして、ボードゲームのデータやユーザー情報を格納。
    - **Hosting:** アプリケーションのデプロイ先として利用。
- **開発ツール:**
  - [Node.js](https://nodejs.org/): JavaScriptの実行環境。
  - [TypeScript](https://www.typescriptlang.org/): JavaScriptに静的型付けを追加した言語。
  - [Angular CLI](https://angular.io/cli): Angularプロジェクトの管理を効率化するコマンドラインインターフェース。

## ディレクトリ構成

プロジェクトの主要なディレクトリとファイル構成です。

```
bg-manager/
├── src/
│   ├── app/
│   │   ├── page/
│   │   │   └── list/               # ボードゲーム一覧ページ関連
│   │   ├── data/
│   │   │   └── boardgame.model.ts  # ボードゲームのデータモデル
│   │   └── services/
│   │       ├── auth.service.ts     # 認証関連サービス
│   │       └── boardgame.service.ts # ボードゲームデータ操作サービス
│   ├── environments/               # 環境変数設定ファイル
│   ├── index.html                  # アプリケーションの起点となるHTML
│   ├── main.ts                     # Angularアプリケーションの起動ファイル
│   └── styles.scss                 # グローバルなスタイルシート
├── firebase.json                   # Firebaseの各種設定
├── angular.json                    # Angularプロジェクトの設定ファイル
└── package.json                    # プロジェクトの依存関係とスクリプト定義
```

## セットアップと実行方法

1.  **リポジトリのクローン:**
    ```bash
    git clone https://github.com/your-username/bg-manager.git
    cd bg-manager
    ```

2.  **依存関係のインストール:**
    ```bash
    npm install
    ```

3.  **開発サーバーの起動:**
    ```bash
    ng serve
    ```
    ブラウザで `http://localhost:4200/` にアクセスすると、アプリケーションが表示されます。

## ビルドとデプロイ

- **ビルド:**
  プロジェクトをビルドするには、以下のコマンドを実行します。
  ```bash
  ng build
  ```
  ビルド成果物は `dist/bg-manager/` ディレクトリに出力されます。

- **デプロイ:**
  このプロジェクトはFirebase Hostingにデプロイされるように設定されています。
  `.github/workflows/firebase-hosting.yml` に、mainブランチへのプッシュをトリガーとして自動でデプロイが実行されるGitHub Actionsのワークフローが定義されています。

## 画面・ダイアログごとの操作とデータフロー

### 1. ボードゲーム一覧画面 (`ListComponent`)

この画面はアプリケーションのメイン画面です。

| ユーザー操作 | イベント/トリガー | データ・状態の変更 |
| :--- | :--- | :--- |
| **画面初期表示** | `ngOnInit` | `BoardgameService.getBoardGames()` を呼び出し、Firestoreから全ボードゲームとユーザーのプレイ状況を取得してテーブルに表示。 |
| **フィルター入力** | `(keyup)` イベント | `applyFilter()` が実行され、`MatTableDataSource` の `filter` プロパティが更新されることで、表示されるゲームがリアルタイムに絞り込まれる。 |
| **列名クリック** | `(click)` イベント | `MatSort` がテーブルのデータをソートして再描画する。 |
| **「追加」ボタンクリック** | `(click)` イベント | `openAddBoardGameDialog()` を呼び出し、「ボードゲームを追加」ダイアログを開く。 |
| **「編集」ボタンクリック** | `(click)` イベント | `openEditUserDataDialog()` を呼び出し、「評価・プレイ状況を編集」ダイアログを開く。 |
| **ゲーム名クリック** | `(click)` イベント | `openGoogleImageSearch()` が実行され、Google画像検索の新しいタブが開く。 |

### 2. ボードゲームを追加ダイアログ (`AddBoardgameDialogComponent`)

新しいボードゲームを登録するためのダイアログです。

| ユーザー操作 | イベント/トリガー | データ・状態の変更 |
| :--- | :--- | :--- |
| **各項目入力** | `[(ngModel)]` | コンポーネント内の `data` オブジェクトが更新される。 |
| **「保存」ボタンクリック** | ダイアログが閉じる | `dialog.afterClosed()` が解決され、入力された `data` を返す。`ListComponent` はそのデータを受け取り、`BoardgameService.addBoardGame()` を使ってFirestoreの `boardGames` コレクションに新しいドキュメントを追加する。 |
| **「キャンセル」ボタンクリック** | `(click)` イベント | `onNoClick()` がダイアログを閉じ、何も変更は行われない。 |

### 3. 評価・プレイ状況を編集ダイアログ (`EditUserDataDialogComponent`)

既存のボードゲームに対する個人の評価やプレイ状況、および（管理者権限がある場合は）ゲーム自体の情報を編集します。

| ユーザー操作 | イベント/トリガー | データ・状態の変更 |
| :--- | :--- | :--- |
| **各項目編集** | `[(ngModel)]` | コンポーネント内の `data` オブジェクトが更新される。 |
| **評価の星クリック** | `(click)` イベント | `setRating()` が `data.evaluation` の値を更新する。 |
| **「保存」ボタンクリック** | ダイアログが閉じる | `dialog.afterClosed()` が解決され、編集された `data` を返す。`ListComponent` は **オプティミスティックUI** を採用しており、まずローカルの表示を即時更新し、その後バックグラウンドで `BoardgameService` の `updateUserBoardGame()` と `updateBoardGame()` (管理者のみ) を呼び出してFirestoreのデータを更新する。 |
| **「キャンセル」ボタンクリック** | `(click)` イベント | `onNoClick()` がダイアログを閉じ、何も変更は行われない。 |

### 4. ニックネームを編集ダイアログ (`EditNicknameDialogComponent`)

ユーザー自身のニックネームを変更するためのダイアログです。（※現在の実装では、このダイアログを呼び出す機能はUI上にまだありませんが、コンポーネントとしては存在します）

| ユーザー操作 | イベント/トリガー | データ・状態の変更 |
| :--- | :--- | :--- |
| **ニックネーム入力** | `[(ngModel)]` | コンポーネント内の `data.nickname` が更新される。 |
| **「保存」ボタンクリック** | ダイアログが閉じる | `dialog.afterClosed()` が解決され、入力されたニックネームを返す。呼び出し元のコンポーネントが `AuthService` などを通じてFirestoreの `users` コレクションにある該当ユーザーの `nickname` フィールドを更新することが想定される。 |
