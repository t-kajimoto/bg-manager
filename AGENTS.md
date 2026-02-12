# AGENTS.md

このファイルは、このリポジトリで作業するすべてのエージェント（および人間）への指示書です。
コードを変更する際は、必ずこのファイルの内容に従ってください。

## PR作成前の必須チェック

PRを作成する前に、以下の3つのチェックを必ず行い、すべてパスすることを確認してください。

1.  **Lint**: `npm run lint`
2.  **ユニットテスト**: `npm test`
3.  **E2Eテスト**: `npm run test:e2e`
4.  **バックエンドテスト**: `cd backend && bundle exec ruby -Ilib:test -e 'Dir.glob("test/core/**/*_test.rb").each { |file| require "./" + file }'`

## 詳細

### Lint (`npm run lint`)
*   ESLintを使用した静的解析です。
*   コードの品質と整合性を保つため、エラーや警告がない状態にしてください。

### ユニットテスト (`npm test`)
*   Jestを使用したユニットテストおよび統合テストです。
*   `e2e/` ディレクトリは除外されています。

### E2Eテスト (`npm run test:e2e`)
*   Playwrightを使用したエンドツーエンドテストです。
*   `npm test` には含まれていないため、明示的に実行する必要があります。

### バックエンドテスト
*   Rails/Minitestを使用したバックエンドのユニットテストです。
*   `backend/` ディレクトリで実行します。
*   コマンド: `bundle exec ruby -Ilib:test -e 'Dir.glob("test/core/**/*_test.rb").each { |file| require "./" + file }'`
