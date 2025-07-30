
# ゲーム詳細・評価編集ダイアログ 設計書 (`edit-user-data-dialog.md`)

## 1. 概要

このダイアログは、アプリケーションの中核的な機能の一つであり、単一のボードゲームに関する詳細情報の表示と編集を行います。
ユーザーの権限（一般ユーザーか管理者か）に応じて、編集可能な範囲が動的に変わります。
`ListComponent` の各行にある編集ボタン (`edit_note`) によって呼び出されます。

## 2. ファイル構成

-   **Component**: `src/app/page/list/edit-user-data-dialog/edit-user-data-dialog.component.ts`
-   **Template**: `src/app/page/list/edit-user-data-dialog/edit-user-data-dialog.component.html`
-   **Style**: `src/app/page/list/edit-user-data-dialog/edit-user-data-dialog.component.scss`

## 3. UI要素とレイアウト

ダイアログは複数のセクションに分かれています。

-   **ダイアログタイトル (`mat-dialog-title`)**: `{{ data.name }}` のように、編集対象のゲーム名が動的に表示されます。

-   **ユーザー評価セクション (`mat-dialog-content`)**: ログインユーザーが自身のプレイ状況を編集するエリアです。
    -   **評価 (`h2` と星アイコン)**: 「あなたの評価」というタイトルと共に、星アイコン（`mat-icon`）が5つ並びます。
        -   `(click)="setRating(i + 1)"`: 星をクリックすると `setRating` メソッドが呼ばれ、評価が更新されます。
        -   `[class.filled]`: 評価の値に応じて星のスタイル（塗りつぶし）が変わります。
    -   **ひとことコメント (`mat-form-field`)**: 評価に対するコメントを入力するテキストエリアです。
        -   `[(ngModel)]="data.comment"`
    -   **プレイ済みチェックボックス (`mat-checkbox`)**: このゲームをプレイしたことがあるかを示します。
        -   `[(ngModel)]="data.played"`

-   **管理者編集セクション (`*ngIf="initialData.isAdmin"`)**: 管理者のみに表示されるエリアです。
    -   `mat-divider`: ユーザーセクションと管理者セクションを視覚的に区切ります。
    -   **基本情報フォーム**: `AddBoardgameDialog` と同様の入力フォーム（名前、人数、時間、タグ）が表示され、ゲームのマスターデータを直接編集できます。
        -   各入力は `data` オブジェクトの各プロパティ（`name`, `min`, `max`, `time`, `tags`）にバインドされています。

-   **みんなの評価セクション (`mat-expansion-panel`)**: アコーディオン形式で、他の全ユーザーの評価を一覧表示します。
    -   **パネルヘッダー (`mat-expansion-panel-header`)**: 「みんなの評価」というタイトルを表示します。
    -   **評価テーブル (`table[mat-table]`)**: パネル内に配置されたテーブルです。
        -   `dataSource="allEvaluationsDataSource"`
        -   **表示列 (`displayedEvaluationColumns`)**: `photo`, `name`, `evaluation`, `comment`
            -   `photo`: ユーザーのプロフィール写真 (`img`)
            -   `name`: ユーザーのニックネーム
            -   `evaluation`: ユーザーの評価（星アイコン）
            -   `comment`: ユーザーのコメント

-   **アクションボタン (`mat-dialog-actions`)**:
    -   **キャンセルボタン**: `(click)="onNoClick()"`
    -   **保存ボタン**: `[mat-dialog-close]="data"`

## 4. コンポーネント仕様 (`EditUserDataDialogComponent`)

### 4.1. プロパティ

-   `maxStars`, `maxStarsArray`: 評価の星を描画するための補助的なプロパティ。
-   `data: IBoardGame`: ダイアログ内の編集データを保持するメインオブジェクト。`ngModel` で双方向バインディングされます。
-   `initialData: IBoardGame & { isAdmin: boolean }`: `ListComponent` から渡される、変更前の元データと管理者フラグ。`inject(MAT_DIALOG_DATA)` で取得。編集権限の判定 (`*ngIf`) や、変更の差分検出に使用できます。
-   `allEvaluationsDataSource`: 「みんなの評価」テーブル用の `MatTableDataSource`。
-   `displayedEvaluationColumns`: 「みんなの評価」テーブルの列定義。

### 4.2. コンストラクタと `ngOnInit`

-   **constructor**: `MatDialogRef`, `BoardgameService` をインジェクトします。`initialData` を `data` にディープコピーして、編集中の状態を分離します。
-   **ngOnInit**: コンポーネントの初期化時に `loadAllEvaluations()` を呼び出します。

### 4.3. メソッド

-   `loadAllEvaluations(): Promise<void>`: `BoardgameService.getAllEvaluationsForGame()` を呼び出し、現在のゲームに対する全ユーザーの評価データを非同期で取得し、`allEvaluationsDataSource` にセットします。
-   `onNoClick(): void`: ダイアログを閉じます。
-   `setRating(rating: number): void`: 評価の星がクリックされたときに `data.evaluation` の値を更新します。
-   `addTag(event: MatChipInputEvent): void`, `removeTag(tag: string): void`: 管理者権限がある場合のみ、タグの追加・削除を許可します。
-   `getStarIcon(rating: number, index: number): string`: 評価値に基づいて、塗りつぶし（`star`）、ハーフ（`star_half`）、枠のみ（`star_border`）のどのアイコンを表示するかを決定するヘルパーメソッドです。

## 5. データフロー

1.  `ListComponent` で編集ボタンがクリックされ、`dialog.open(EditUserDataDialogComponent, ...)` が呼び出されます。このとき、`data` プロパティに、クリックされた行の `IBoardGame` オブジェクトと、ユーザーが管理者かどうかの `isAdmin` フラグを結合したオブジェクトが渡されます。
2.  ダイアログが開かれ、`ngOnInit` で `loadAllEvaluations` が実行され、「みんなの評価」テーブルのデータが非同期で読み込まれます。
3.  ユーザー（または管理者）がフォームの値を編集します。変更は `data` オブジェクトに即時反映されます。
4.  ユーザーが「保存」ボタンをクリックします。
5.  ダイアログが閉じ、変更後の `data` オブジェクト (`IBoardGame`) が `dialogRef.afterClosed()` から返されます。
6.  `ListComponent` は返された `result` を受け取ります。
7.  `result` をユーザーデータ (`played`, `evaluation`, `comment`) とボードゲームのマスターデータ（それ以外）に分割します。
8.  `boardgameService.updateUserBoardGame()` を呼び出し、ユーザーデータを更新します。
9.  管理者の場合は、さらに `boardgameService.updateBoardGame()` を呼び出し、マスターデータを更新します。
10. `ListComponent` は、Firestoreからの再取得を待たずに、ローカルの `dataSource` を直接更新して、画面に即時変更を反映させます。

