
# ボードゲーム追加ダイアログ 設計書 (`add-boardgame-dialog.md`)

## 1. 概要

このダイアログは、管理者権限を持つユーザーが新しいボードゲームをデータベースに登録するためのUIを提供します。
`ListComponent` の「新しいゲームを追加」ボタンによって呼び出されます。

## 2. ファイル構成

-   **Component**: `src/app/page/list/add-boardgame-dialog/add-boardgame-dialog.component.ts`
-   **Template**: `src/app/page/list/add-boardgame-dialog/add-boardgame-dialog.component.html`
-   **Style**: `src/app/page/list/add-boardgame-dialog/add-boardgame-dialog.component.scss`

## 3. UI要素とレイアウト

ダイアログはAngular Materialのコンポーネントで構成されます。

-   **ダイアログタイトル (`mat-dialog-title`)**: 「新しいボードゲームを追加」
-   **入力フォーム (`mat-dialog-content`)**:
    -   **名前 (`mat-form-field`)**: ボードゲーム名を入力。必須項目。
        -   `[(ngModel)]="data.name"`
    -   **最小人数 (`mat-form-field`)**: プレイ可能な最小人数を入力。数値型。
        -   `[(ngModel)]="data.min"`
    -   **最大人数 (`mat-form-field`)**: プレイ可能な最大人数を入力。数値型。
        -   `[(ngModel)]="data.max"`
    -   **プレイ時間 (`mat-form-field`)**: 平均プレイ時間（分）を入力。数値型。
        -   `[(ngModel)]="data.time"`
    -   **タグ (`mat-chip-list`)**: ゲームの特徴を表すタグを入力・管理します。
        -   `matChipInputFor`: 入力フィールドを提供。
        -   `(matChipInputTokenEnd)`: `addTag()`を呼び出し、入力された値をチップとして追加します。
        -   各チップの削除ボタンで `removeTag()` を呼び出します。
-   **アクションボタン (`mat-dialog-actions`)**:
    -   **キャンセルボタン (`mat-button`)**: `(click)="onNoClick()"`。ダイアログを閉じ、変更を破棄します。
    -   **保存ボタン (`mat-button`)**: `[mat-dialog-close]="data"`。`data`オブジェクトをダイアログの呼び出し元に返します。

## 4. コンポーネント仕様 (`AddBoardgameDialogComponent`)

### 4.1. クラスデコレーター

-   `@Component`: `standalone: true` であり、必要なモジュールを `imports` 配列で直接インポートします。
    -   `CommonModule`, `MatFormFieldModule`, `MatInputModule`, `FormsModule`, `MatButtonModule`, `MatDialogModule`, `MatChipsModule`, `MatIconModule`

### 4.2. プロパティ

-   `data: Partial<IBoardGameData>`: ダイアログ内でユーザーが入力したデータを保持するオブジェクトです。テンプレートの `ngModel` と双方向バインディングされています。
-   `initialData: Partial<IBoardGameData>`: `ListComponent` から渡される初期データです。`inject(MAT_DIALOG_DATA)` を使って取得します。コンストラクタで `data` オブジェクトの初期化に使用されます。

### 4.3. コンストラクタ

-   `MatDialogRef` をインジェクトし、ダイアログを制御する参照を保持します。
-   `initialData` をスプレッド構文 (`...`) でコピーして `data` プロパティを初期化します。これにより、元のオブジェクトへの参照を断ち切り、ダイアログ内での変更が呼び出し元に直接影響しないようにします。

### 4.4. メソッド

-   `onNoClick(): void`: ダイアログを閉じます。`dialogRef.close()` を呼び出します。戻り値はありません。
-   `addTag(event: MatChipInputEvent): void`: タグ入力欄で値が確定されたときに呼び出されます。
    1.  入力値の前後の空白を削除します。
    2.  値が存在すれば、`data.tags` 配列（存在しない場合は初期化）に値を追加します。
    3.  入力フィールドをクリアします。
-   `removeTag(tag: string): void`: タグの削除ボタンがクリックされたときに呼び出されます。
    1.  `data.tags` 配列から指定された `tag` を検索します。
    2.  見つかった場合、`splice` メソッドで配列からその要素を削除します。

## 5. データフロー

1.  `ListComponent` が `dialog.open(AddBoardgameDialogComponent, ...)` を呼び出します。このとき、`data` プロパティに初期データ（空のオブジェクトやデフォルト値）を渡します。
2.  ダイアログが開かれ、ユーザーがフォームに入力します。入力内容は `data` プロパティにリアルタイムでバインドされます。
3.  ユーザーが「保存」ボタンをクリックします。
4.  ダイアログが閉じ、`[mat-dialog-close]="data"` の指定により、`data` オブジェクトが `dialogRef.afterClosed()` の `Observable` から射出されます。
5.  `ListComponent` はこの `Observable` を購読（または `await`）しており、返された `data` オブジェクトを受け取って `boardgameService.addBoardGame()` を呼び出し、Firestoreへの保存処理を実行します。

