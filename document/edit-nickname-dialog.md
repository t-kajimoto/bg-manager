
# ニックネーム編集ダイアログ 設計書 (`edit-nickname-dialog.md`)

## 1. 概要

このダイアログは、ユーザーが自身のニックネームを変更するためのシンプルなUIを提供します。
アプリケーションヘッダーのユーザー情報エリアにある編集ボタン (`mat-icon > edit`) によって `AppComponent` から呼び出されることを想定しています。（※現在の実装では `ListComponent` にボタンがありますが、UI/UXの観点から `AppComponent` に配置するのが一般的です）

## 2. ファイル構成

-   **Component**: `src/app/page/list/edit-nickname-dialog/edit-nickname-dialog.component.ts`
-   **Template**: `src/app/page/list/edit-nickname-dialog/edit-nickname-dialog.component.html`
-   **Style**: `src/app/page/list/edit-nickname-dialog/edit-nickname-dialog.component.scss`

## 3. UI要素とレイアウト

-   **ダイアログタイトル (`mat-dialog-title`)**: 「ニックネームを編集」
-   **入力フォーム (`mat-dialog-content`)**:
    -   **ニックネーム (`mat-form-field`)**: 新しいニックネームを入力するためのテキストフィールドです。
        -   `[(ngModel)]="data.nickname"`
-   **アクションボタン (`mat-dialog-actions`)**:
    -   **キャンセルボタン (`mat-button`)**: `(click)="onNoClick()"`。ダイアログを閉じ、変更を破棄します。
    -   **保存ボタン (`mat-button`)**: `[mat-dialog-close]="data.nickname"`。入力されたニックネームの文字列をダイアログの呼び出し元に返します。

## 4. コンポーネント仕様 (`EditNicknameDialogComponent`)

### 4.1. クラスデコレーター

-   `@Component`: `standalone: true` であり、必要なモジュールを `imports` 配列で直接インポートします。
    -   `CommonModule`, `MatDialogModule`, `MatFormFieldModule`, `MatInputModule`, `FormsModule`, `MatButtonModule`

### 4.2. インターフェース

-   `DialogData`: ダイアログに渡されるデータの型を定義します。
    -   `nickname: string;`

### 4.3. プロパティ

-   `data: DialogData`: `inject(MAT_DIALOG_DATA)` を使って、呼び出し元から渡された現在のニックネームを含むオブジェクトを取得します。テンプレートの `ngModel` と双方向バインディングされています。
-   `dialogRef`: `inject(MatDialogRef<EditNicknameDialogComponent>)` を使って、このダイアログ自身への参照を取得します。

### 4.4. コンストラクタ

-   DI（依存性注入）は `inject()` 関数で行っているため、コンストラクタは空です。

### 4.5. メソッド

-   `onNoClick(): void`: 「キャンセル」ボタンがクリックされたときに呼び出されます。`dialogRef.close()` を実行して、何も返さずにダイアログを閉じます。

## 5. データフロー

1.  ユーザーがニックネーム編集ボタンをクリックします。
2.  呼び出し元のコンポーネント（例: `AppComponent`）が `dialog.open(EditNicknameDialogComponent, ...)` を実行します。このとき、`data` プロパティに `{ nickname: '現在のニックネーム' }` というオブジェクトを渡します。
3.  ダイアログが開かれ、入力フィールドに現在のニックネームが表示されます。
4.  ユーザーが新しいニックネームを入力します。
5.  ユーザーが「保存」ボタンをクリックします。
6.  ダイアログが閉じ、`[mat-dialog-close]="data.nickname"` の指定により、入力された新しいニックネームの**文字列**が `dialogRef.afterClosed()` の `Observable` から射出されます。
7.  呼び出し元のコンポーネントは、返された文字列を受け取り、`AuthService` や `UserService` を通じてFirestoreの `users` コレクションに保存されている該当ユーザーのニックネーム情報を更新します。

