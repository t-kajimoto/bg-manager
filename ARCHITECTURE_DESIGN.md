# アーキテクチャ設計書 (Architecture Design Document)

## 1. 概要
本プロジェクト（Board Game Manager）の拡張性、可読性、保守性を向上させるため、**Feature-Sliced Design (FSD)** の概念を取り入れた、Next.js (App Router) に最適化されたモダンなアーキテクチャを採用します。

## 2. アーキテクチャの基本方針

### 2.1 関心の分離 (Separation of Concerns)
現在の「機能単位」ではなく「技術単位（components, hooks）」の分割から、**「ドメイン（機能）単位」**の分割へ移行します。これにより、特定の機能（例：ボードゲーム管理、ガチャ）に関連するコード（UI, ロジック, 型）が一箇所に集約され、開発時の認知負荷を下げます。

### 2.2 ディレクトリ構造
以下のような階層構造を推奨します。

```text
src/
├── app/                 # Next.js App Router (ルーティング定義、Layout)
│   ├── layout.tsx
│   ├── page.tsx         # ページはFeaturesを組み合わせるだけの薄い層にする
│   └── ...
├── features/            # 機能（ドメイン）ごとのモジュール
│   ├── boardgames/      # ボードゲーム管理機能
│   │   ├── components/  # ドメイン固有のUI (Card, Dialog)
│   │   ├── hooks/       # ドメイン固有のロジック (useBoardgames)
│   │   ├── types/       # ドメイン固有の型定義
│   │   └── utils/       # ドメイン固有のヘルパー関数
│   ├── auth/            # 認証機能
│   └── gacha/           # ガチャ機能
├── components/          # 汎用UIコンポーネント (ドメイン知識を持たない)
│   ├── ui/              # Atomic Elements (Button, Input, Card, Modal)
│   └── layouts/         # 共通レイアウト (Header, Footer)
├── lib/                 # 外部ライブラリの設定・ラッパー (Firebase, Utils)
├── hooks/               # アプリケーション全体で使う汎用フック
└── types/               # アプリケーション全体で使う共通の型定義
```

### 2.3 コンポーネント設計原則

*   **Container / Presentational Pattern**:
    *   ロジック（データ取得、状態管理）とUI（表示）を分離します。
    *   `features` 内のメインコンポーネントが Container となり、`hooks` からデータを取得して、純粋な UI コンポーネントに props を渡します。
*   **Server vs Client Components**:
    *   Next.js の利点を活かすため、可能な限り Server Component を利用しますが、本アプリは Firestore のリアルタイム性 (`onSnapshot`) を重視するため、リスト表示部分は Client Component (`use client`) が主役となります。
    *   ただし、静的な部分や初期データ取得（将来的なSSR化）を見据え、境界を意識して設計します。

## 3. 具体的な改善案 (Refactoring Steps)

### Step 1: Feature ディレクトリの作成と移動
現在の `src/components` と `src/hooks` に散らばっているファイルを、機能ごとに `src/features` へ移動します。

**構成例:**

*   `src/features/boardgames`
    *   `components/BoardGameList.tsx` (現在の page.tsx のリスト表示部分)
    *   `components/BoardGameCard.tsx`
    *   `components/AddBoardGameDialog.tsx`
    *   `components/EditBoardGameDialog.tsx`
    *   `hooks/useBoardgames.ts`
    *   `hooks/useBoardgameManager.ts`
*   `src/features/gacha`
    *   `components/GachaDialog.tsx`
    *   `components/GachaResultDialog.tsx`

### Step 2: 汎用 UI コンポーネントの抽出
ドメイン知識を持たない UI 部品を `src/components/ui` に定義します。
例: `ConfirmationDialog` は `boardgames` 固有ではないため、`src/components/ui` に配置し、props でメッセージを受け取る形にします。

### Step 3: Page コンポーネントの責務縮小
現在 `src/app/page.tsx` が多くの状態（Dialogの開閉、フィルタリングなど）を持ちすぎています。これらをカスタムフックや各 Feature コンポーネントに委譲します。

**理想的な page.tsx:**
```tsx
export default function HomePage() {
  return (
    <main>
      <Header />
      <Container>
        <BoardGameFeature /> {/* ここにリストや検索ロジックをカプセル化 */}
      </Container>
    </main>
  );
}
```

## 4. コーディング規約・指針

*   **命名規則**:
    *   コンポーネント: PascalCase (例: `BoardGameCard.tsx`)
    *   フック: camelCase (例: `useBoardGames.ts`)
    *   定数: UPPER_SNAKE_CASE
*   **Exports**:
    *   Feature 外部に公開するものは `index.ts` (Barrel file) を通じて公開することを推奨しますが、循環参照を避けるため慎重に行います。
*   **Testing**:
    *   テストファイルは実装ファイルの隣に置く (`Colocation`)。
    *   ロジック（Hooks）の単体テストと、重要なユーザーフロー（E2E/Integration）を優先する。

## 5. 今後の拡張性について

この構成にすることで、例えば「プレイ履歴機能」を追加する場合、既存のコードを触らずに `src/features/history` を作成するだけで済み、他の機能への影響を最小限に抑えられます。また、新規参画者がコードを読む際も、「どこに何が書かれているか」が直感的に分かるようになります。
