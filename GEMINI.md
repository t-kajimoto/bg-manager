# 必ず守るべきこと
- 日本語で話してください
- コーディングの先生としてお手本となるべき効率的で正確なコードを書く
- 堅苦しすぎずにフレンドリーな対応をする
- 変数やメソッドには必ずコメントを付ける
- 必ずdocumentフォルダの設計書の修正が必要か確認した後に修正を行う
- documentフォルダの設計書の修正が必要な場合は必ず修正を行う
- コードを修正する前にdocumentフォルダの設計書を確認したうえで修正を行う
- 修正後は必ずビルドをしてエラーがないか確認する
- 画面のレイアウトは極力Material 3 Expressiveに準拠したモダンなレイアウトにする
- スクリーンショットはGitのリポジトリに含めないでください
- スクリーンショットを私が要求した時はチャットに記載するようにしてください

## 設計書について
- 図が必要な時はMermaidを使用する
- 初めてこのプロジェクトに参加した人も仕様が理解しやすいような内容にする

## このプロジェクトについて
- Firebaseを使用している
- Firestore Databaseを使用している
- FirebaseのApp Hostingにデプロイしている
- FirebaseのAuthenticationのGoogle認証をログインに使用している
- 私の家にあるボードゲームをリスト化して管理、評価することを目的としているアプリケーションです
- アプリケーション名は「HARIDICE」です

---

# エージェント向け情報: `bg-manager-next`

このドキュメントは、このNext.jsプロジェクトで作業するAIエージェント向けに、過去に遭遇した環境問題や、プロジェクト固有の注意点に関するコンテキストを提供します。

---

## 1. Jestテスト環境のセットアップに関する注意点

`npm test`を実行する際に、いくつかの環境固有の問題が発生する可能性があります。以下に、遭遇した問題とその解決策を記録します。

### 問題1: `fetch is not defined` / `TextEncoder is not defined` 等のエラー

-   **原因**: Jestのテスト環境(jsdom)は、ブラウザAPIの一部（`fetch`, `TextEncoder`, `ReadableStream`など）を標準でサポートしていません。Firebase SDKのようなライブラリはこれらのAPIに依存しているため、テスト実行時に参照エラーが発生します。
-   **解決策**: `jest.setup.js`ファイルで、不足しているAPIのポリフィル（代替実装）をグローバルスコープに設定します。`node-fetch@2`（CommonJS互換のため）とNode.js標準の`util`モジュールを使用するのが最も安定していました。

    ```javascript
    // jest.setup.js の例
    const util = require('util');
    global.TextEncoder = util.TextEncoder;
    global.TextDecoder = util.TextDecoder;

    const fetch = require('node-fetch');
    global.fetch = fetch;
    // ... (Request, Response, Headersも同様に設定)
    ```

### 問題2: テスト実行時にFirebaseの`db`オブジェクトが`null`になる

-   **原因**: テスト環境では、`src/lib/firebase/config.ts`でのFirebase初期化が正しく行われません。そのため、`db`や`auth`オブジェクトが`null`となり、これをインポートしたフック（例: `useBoardgames`）がテストで失敗します。
-   **解決策**: Jestの手動モック機能を使用します。`src/lib/firebase/__mocks__/config.ts`というファイルを作成し、`db`と`auth`をダミーオブジェクトとしてエクスポートします。

    ```typescript
    // src/lib/firebase/__mocks__/config.ts の例
    export const db = {};
    export const auth = {};
    ```
    そして、テストファイルの先頭で `jest.mock('@/lib/firebase/config');` を呼び出すことで、Jestが自動的にこのモックを読み込むようになります。

### 問題3: 不可解なテスト失敗や`Cannot find module`エラー

-   **原因**: `npm install`の繰り返しや、予期せぬプロセス終了により、`node_modules`ディレクトリの状態が不安定になることがあります。
-   **解決策**: 最も確実な方法は、一度クリーンな状態に戻すことです。
    1.  `rm -rf node_modules package-lock.json` で依存関係を完全に削除します。
    2.  `npm install` を再実行します。
    3.  (最終手段) `npm cache clean --force` でnpmのキャッシュ自体をクリアすることも有効な場合があります。

---

## 2. 開発サーバー(`npm run dev`)の起動問題 (過去の情報)

**注記:** 以前のタスクでは`npm run dev`の起動に深刻な問題がありましたが、今回のタスクでは`npm cache clean`と依存関係の再インストールにより、最終的に`npm run start`（ビルド後の本番サーバー）の起動には成功しています。`npm run dev`の問題は、依然として環境の不安定さに起因する可能性があります。

もし開発サーバーの起動に失敗し続ける場合は、以下の代替アプローチを検討してください。

-   **代替アプローチ**: `npm run build`で静的ファイルを生成し、`npm run start`で本番サーバーを起動して動作確認を行う。

**(以下は、過去のデバッグ履歴の日本語訳です)**

### 過去のデバッグ履歴

-   **`npm run dev`の失敗**: 当初、コマンドがエラーログなしに即時終了。Firebase認証情報不足やTurbopackの問題を疑ったが解決せず。
-   **ファイルシステムの不安定性**: 作成したはずのファイルが消える現象が観測された。
-   **`npm start`の失敗**: `next: not found`エラーが発生。環境の`PATH`設定の問題が疑われた。
-   **Docker環境の試行**: Dockerデーモンへの接続権限エラーや、Docker Hubからのイメージ取得レート制限により断念。
-   **クリーン再インストール**: `create-next-app`からの完全な再構築を試みたが、同じエラーが再現された。

これらの履歴は、このサンドボックス環境が時折、予測不能な動作をする可能性があることを示唆しています。問題に直面した際は、上記の解決策（特に依存関係のクリーンインストール）から試すことを推奨します。
