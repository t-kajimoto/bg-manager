import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';

// ----------------------------------------------------------------------
// 型定義 (Types)
// ----------------------------------------------------------------------

/**
 * ConfirmDialogコンポーネントのプロパティ
 * 
 * @property open - ダイアログが開いているかどうか
 * @property title - 確認ダイアログのタイトル（例: "削除の確認"）
 * @property message - ユーザーへのメッセージ（例: "本当に削除してもよろしいですか？"）
 * @property onConfirm - 「はい/確認」ボタンが押された時の関数
 * @property onCancel - 「いいえ/キャンセル」ボタンが押された時の関数
 * @property confirmText - 確認ボタンのラベル（デフォルト: "OK"）
 * @property cancelText - キャンセルボタンのラベル（デフォルト: "キャンセル"）
 * @property isDangerous - 危険な操作（削除など）かどうか。trueの場合、確認ボタンが赤色になります。
 */
interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
}

// ----------------------------------------------------------------------
// コンポーネント定義 (Component Definition)
// ----------------------------------------------------------------------

/**
 * [共通コンポーネント] ConfirmDialog
 * 
 * ユーザーに Yes/No の判断を求めるためのシンプルなダイアログです。
 * BaseDialogよりも機能を絞り、迅速な確認操作に最適化されています。
 */
export const ConfirmDialog = ({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'OK',
  cancelText = 'キャンセル',
  isDangerous = false,
}: ConfirmDialogProps) => {
  return (
    <Dialog
      open={open}
      onClose={onCancel} // ダイアログ外クリックでもキャンセル扱い
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      <DialogTitle id="confirm-dialog-title">{title}</DialogTitle>
      
      <DialogContent>
        <DialogContentText id="confirm-dialog-description">
          {message}
        </DialogContentText>
      </DialogContent>
      
      <DialogActions>
        {/* キャンセルボタン */}
        <Button onClick={onCancel} color="inherit">
          {cancelText}
        </Button>
        
        {/* 確認ボタン: 危険な操作の場合は赤色(error)を使用 */}
        <Button
          onClick={onConfirm}
          color={isDangerous ? 'error' : 'primary'}
          variant="contained"
          autoFocus // キーボード操作時にフォーカスを当てる
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
