import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
  Box,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

// ----------------------------------------------------------------------
// 型定義 (Types)
// ----------------------------------------------------------------------

/**
 * BaseDialogコンポーネントのプロパティ（Props）定義
 * 
 * @property open - ダイアログが開いているかどうか (true: 開く, false: 閉じる)
 * @property onClose - ダイアログを閉じるためのハンドラ関数
 * @property title - ダイアログのヘッダーに表示するタイトル
 * @property children - ダイアログのメインコンテンツ（フォームやメッセージなど）
 * @property actions - ダイアログ下部に表示するアクションボタン（保存、キャンセルなど）
 * @property maxWidth - ダイアログの最大幅 (xs, sm, md, lg, xl, false)。デフォルトは 'sm'。
 * @property fullWidth - 幅を最大まで広げるかどうか。デフォルトは true。
 */
interface BaseDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  fullWidth?: boolean;
}

// ----------------------------------------------------------------------
// コンポーネント定義 (Component Definition)
// ----------------------------------------------------------------------

/**
 * [共通コンポーネント] BaseDialog
 * 
 * アプリケーション全体で使用する基本的なモーダルダイアログです。
 * Material-UIのDialogコンポーネントをラップし、デザインと挙動を統一しています。
 * 
 * 特徴:
 * - モバイル対応: 画面幅が狭い場合（sm以下）は全画面表示になります。
 * - 閉じるボタン: 右上に「×」ボタンを標準配置しています。
 * - 統一されたパディングとレイアウト。
 */
export const BaseDialog = ({
  open,
  onClose,
  title,
  children,
  actions,
  maxWidth = 'sm',
  fullWidth = true,
}: BaseDialogProps) => {
  // テーマ（デザイン設定）を取得
  const theme = useTheme();
  // 画面サイズが 'sm' (600px) より小さいかどうかを判定
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen} // モバイル時は全画面
      fullWidth={fullWidth}
      maxWidth={maxWidth}
      aria-labelledby="base-dialog-title"
    >
      {/* 
        ダイアログタイトルエリア 
        - m: 0 (マージンなし)
        - p: 2 (パディング 16px)
      */}
      <DialogTitle sx={{ m: 0, p: 2 }} id="base-dialog-title">
        {title}
        
        {/* 閉じるボタン (右上に配置) */}
        {onClose ? (
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        ) : null}
      </DialogTitle>

      {/* 
        ダイアログコンテンツエリア
        dividers: タイトルとアクションエリアとの間に区切り線を表示
      */}
      <DialogContent dividers>
        {children}
      </DialogContent>

      {/* 
        アクションボタンエリア
        actionsが渡された場合のみ表示
      */}
      {actions && (
        <DialogActions sx={{ p: 2 }}>
          {actions}
        </DialogActions>
      )}
    </Dialog>
  );
};
