
# ボードゲーム管理アプリ

このプロジェクトは、Angularで構築されたボードゲーム管理アプリをNext.jsとReactで再構築したものです。

## 機能一覧

- ボードゲームの一覧表示
- ボードゲームの追加・編集・削除 (管理者のみ)
- ユーザーによる評価・コメントの更新

## 技術スタック

- **フレームワーク**: [Next.js](https://nextjs.org) (App Router)
- **UIライブラリ**: [MUI (Material-UI)](https://mui.com)
- **バックエンド (BaaS)**: [Firebase](https://firebase.google.com)
- **状態管理**: React Context, `useState`
- **フォーム**: [React Hook Form](https://react-hook-form.com)
- **テスト**: [Jest](https://jestjs.io), [React Testing Library](https://testing-library.com)

---

## 開発環境のセットアップ

### 1. 必要なツール

- [Node.js](https://nodejs.org) (v18以降を推奨)
- [npm](https://www.npmjs.com) (Node.jsに同梱)

### 2. 依存関係のインストール

プロジェクトのルートディレクトリで以下のコマンドを実行し、必要なライブラリをインストールします。

```bash
npm install
```

### 3. Firebaseの設定

本アプリケーションをローカルで動作させるには、Firebaseプロジェクトとの接続設定が必要です。

1.  プロジェクトのルートに `.env.local` という名前のファイルを作成します。
2.  Firebaseプロジェクトのコンソールから「ウェブアプリ」の設定情報を取得します。
3.  取得した設定情報を、`.env.local` ファイルに以下の形式で貼り付けます。

    ```
    NEXT_PUBLIC_FIREBASE_API_KEY=YourApiKey
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YourAuthDomain
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=YourProjectId
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=YourStorageBucket
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YourMessagingSenderId
    NEXT_PUBLIC_FIREBASE_APP_ID=YourAppId
    ```

    **注意**: この `.env.local` ファイルは `.gitignore` に含まれており、Gitリポジトリにはコミットされません。

---

## 起動とテスト

### 開発サーバーの起動

以下のコマンドで開発サーバーを起動します。

```bash
npm run dev
```

#### Docker を使った開発サーバーの起動

ローカルに Node.js をインストールせずにホットリロード開発したい場合は、`web-dev` コンテナを利用できます。

```bash
docker compose --profile dev up web-dev
```

- Windows でもファイル変更を正しく検知できるよう `WATCHPACK_POLLING`/`CHOKIDAR_USEPOLLING` を有効化しています。
- `node_modules` は named volume (`node_modules_dev`) に保存されるため、ホストOSの依存環境と混ざりません。
- 停止する際は `Ctrl+C` を押すか、別ターミナルで `docker compose --profile dev down` を実行してください。

ブラウザで [http://localhost:3000](http://localhost:3000) を開くと、アプリケーションが表示されます。
ソースコードを編集すると、ページは自動的に更新されます。

### テストの実行

以下のコマンドで、Jestを使用してユニットテストを実行します。

```bash
npm test
```

### 本番ビルドの作成

以下のコマンドで、本番環境用の最適化されたビルドを作成します。
ビルド成果物は `.next` ディレクトリに生成されます。

```bash
npm run build
```
