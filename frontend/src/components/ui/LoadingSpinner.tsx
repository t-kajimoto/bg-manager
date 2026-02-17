import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

// ----------------------------------------------------------------------
// 型定義 (Types)
// ----------------------------------------------------------------------

/**
 * LoadingSpinnerコンポーネントのプロパティ
 * 
 * @property message - スピナーの下に表示するテキストメッセージ（任意）
 * @property fullScreen - 画面全体を覆うかどうか (true: 全画面, false: 親要素内)
 */
interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
}

// ----------------------------------------------------------------------
// コンポーネント定義 (Component Definition)
// ----------------------------------------------------------------------

/**
 * [共通コンポーネント] LoadingSpinner
 * 
 * 処理待ちであることをユーザーに伝えるためのローディングインジケーターです。
 * 
 * 使用例:
 * 1. データのフェッチ中: <LoadingSpinner />
 * 2. 画面全体をロックして処理中: <LoadingSpinner fullScreen message="保存中..." />
 */
export const LoadingSpinner = ({ message, fullScreen = false }: LoadingSpinnerProps) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        // fullScreenがtrueの場合は画面全体(100vh)、falseの場合は親要素の100%または最小200px
        height: fullScreen ? '100vh' : '100%',
        minHeight: fullScreen ? '100vh' : 200,
        width: '100%',
        // fullScreenの場合は画面の最前面に固定表示
        ...(fullScreen && {
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 9999,
          bgcolor: 'rgba(255, 255, 255, 0.8)', // 背景を少し透過させて後ろが見えるように
        }),
      }}
    >
      {/* 回転する円形プログレスバー */}
      <CircularProgress />
      
      {/* メッセージがある場合のみ表示 */}
      {message && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 2, fontWeight: 'medium' }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );
};
