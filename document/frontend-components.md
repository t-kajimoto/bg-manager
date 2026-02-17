# フロントエンド共通コンポーネント

このプロジェクトでは、UIの一貫性と保守性を高めるために、以下の共通コンポーネントを使用しています。
`src/components/ui` ディレクトリに配置されています。

## BaseDialog

Material-UIの `Dialog` をラップした基本ダイアログコンポーネントです。
全てのモーダルダイアログはこのコンポーネントをベースに作成することを推奨します。

### 特徴

- モバイル対応（レスポンシブデザイン）
- 共通のスタイル（タイトル、コンテンツ、アクションボタンの配置）
- `maxWidth`, `fullWidth` などの標準的なプロパティをサポート

### 使用例

```tsx
import { BaseDialog } from "@/components/ui/BaseDialog";

const MyDialog = ({ open, onClose }) => {
  const actions = (
    <>
      <Button onClick={onClose}>キャンセル</Button>
      <Button variant="contained" onClick={handleSubmit}>
        保存
      </Button>
    </>
  );

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title="ダイアログのタイトル"
      actions={actions}
    >
      <Typography>ダイアログのコンテンツ</Typography>
    </BaseDialog>
  );
};
```

## LoadingSpinner

ローディング状態を表示するためのコンポーネントです。
部分的なローディングや、画面全体を覆うオーバーレイローディングに対応しています。

### 使用例

```tsx
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

// 部分的なローディング
if (loading) return <LoadingSpinner />;

// 全画面ローディング（メッセージ付き）
if (isSubmitting) return <LoadingSpinner fullScreen message="保存中..." />;
```

## ConfirmDialog

ユーザーに確認を求めるためのダイアログコンポーネントです。
削除操作などの危険なアクションには `isDangerous` プロパティを `true` に設定してください。

### 使用例

```tsx
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

<ConfirmDialog
  open={open}
  onCancel={handleCancel}
  onConfirm={handleDelete}
  title="削除の確認"
  message="本当に削除しますか？"
  confirmText="削除"
  isDangerous={true} // 削除ボタンが赤くなります
/>;
```
