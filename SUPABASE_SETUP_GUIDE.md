# Supabaseセットアップガイド

Supabaseへのデータベース移行およびデプロイを行うために必要な情報と、その取得方法についてまとめました。

## 1. 必要な情報一覧

Supabaseを利用するには、主に以下の4つの情報が必要です。これらをSupabaseのダッシュボードから取得してください。

| 項目名 | 概要 | 取得場所 (ダッシュボード) | 機密性 (重要) | 利用箇所 |
| :--- | :--- | :--- | :--- | :--- |
| **1. Project URL** | APIのエンドポイントURL | Settings > API | 公開可 (Public) | フロントエンド (`.env.local`) |
| **2. Anon Key** | 公開用APIキー (クライアント側) | Settings > API | 公開可 (Public) | フロントエンド (`.env.local`) |
| **3. Service Role Key** | 管理者用APIキー (サーバー側) | Settings > API | **極秘 (Secret)** | バックエンド/デプロイ環境変数 |
| **4. Database Password** | データベース接続パスワード | Project作成時に設定 | **極秘 (Secret)** | バックエンド/デプロイ環境変数 |
| **5. Connection String** | データベース接続文字列 | Settings > Database | **極秘 (Secret)** | バックエンド (`database.yml` 等) |

---

## 2. 各情報の取得方法詳細

### A. Project URL と API Keys (Anon / Service Role)

1.  Supabaseダッシュボードで対象のプロジェクトを開きます。
2.  左サイドバーの **Settings (歯車アイコン)** をクリックします。
3.  **API** を選択します。
4.  **Project URL** をコピーします。
5.  **Project API keys** セクションにある `anon` `public` のキーをコピーします (**Anon Key**)。
6.  同セクションの `service_role` `secret` のキーをコピーします (**Service Role Key**)。
    *   ⚠️ `service_role` キーは管理者権限を持つため、絶対にフロントエンドのコードに含めたり、GitHubにコミットしたりしないでください。

### B. Database Password (データベースパスワード)

*   **取得方法**: プロジェクト作成時に入力したパスワードです。
*   **忘れた場合**: Settings > Database > Reset Database Password から再設定できます。

### C. Connection String (接続文字列)

Ruby on Rails や Prisma 等のバックエンドから接続するために必要です。

1.  Settings > Database を開きます。
2.  **Connection string** セクションを探します。
3.  **URI** タブを選択します。
4.  内容をコピーします。
    *   形式: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
    *   `[YOUR-PASSWORD]` の部分を、先ほど確認した **Database Password** に置き換えて使用します。
5.  **注意点**:
    *   **Session Mode (Port 5432)**: 常駐サーバー (VPS, EC2, コンテナ) からの接続に適しています。
    *   **Transaction Mode (Port 6543)**: Serverless Functions (Vercel, AWS Lambda) からの接続に適しています。Railsの場合は通常5432で問題ありませんが、デプロイ先によっては6543が推奨される場合があります。

---

## 3. 環境変数への設定例 (ローカル開発)

取得した情報は、リポジトリにコミットせず、環境変数として管理します。

### フロントエンド (`.env.local`)
Next.jsで使用する場合の設定例です。

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### バックエンド (`backend/.env` またはデプロイ設定)
Rails等で使用する場合の設定例です。

```env
# 接続文字列 (パスワードを含む完全なURL)
DATABASE_URL=postgresql://postgres:mypassword@db.abcdefg.supabase.co:5432/postgres

# 管理者操作が必要な場合
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 4. 確認事項 (アーキテクチャについて)

現在のリポジトリには `backend/` (Ruby on Rails) ディレクトリと、`MIGRATION_PLAN.md` (Next.js Server Actionsへの移行計画) の両方が存在します。

*   **Railsを利用する場合**: `DATABASE_URL` (Connection String) が必須です。
*   **Next.js Server Actionsのみで完結する場合**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` が主に必要となります。

どちらの構成を主とするかによって、設定する場所が異なります。まずは上記の情報をSupabaseダッシュボードから取得し、お手元に控えてください。
