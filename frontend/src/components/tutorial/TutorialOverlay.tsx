'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Paper,
  LinearProgress,
  Fade,
  Backdrop,
  Avatar,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useTutorial, TUTORIAL_STEPS } from '@/contexts/TutorialContext';
import { useAuth } from '@/contexts/AuthContext';

// =============================================================================
// チュートリアルオーバーレイ
// 初回ログイン時に表示されるステップバイステップのオンボーディング
// HARIDICEのハリネズミキャラクターが案内する形式
// =============================================================================

// ステップごとの絵文字アイコン
const STEP_EMOJIS = ['🦔', '🎲', '🎰', '🏆'];

export function TutorialOverlay() {
  const { user } = useAuth();
  const {
    isTutorialActive,
    currentStep,
    totalSteps,
    startTutorial,
    nextStep,
    completeTutorial,
    isCompleted,
  } = useTutorial();

  // ログイン後、チュートリアル未完了なら自動的に開始する
  useEffect(() => {
    if (user && !isCompleted && !isTutorialActive) {
      // 少し遅延させて画面が安定してから表示
      const timer = setTimeout(() => {
        startTutorial();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user, isCompleted, isTutorialActive, startTutorial]);

  // チュートリアルが非アクティブなら何も表示しない
  if (!isTutorialActive) return null;

  const step = TUTORIAL_STEPS[currentStep];
  const isLastStep = currentStep === totalSteps - 1;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <>
      {/* 背景を暗くするBackdrop */}
      <Backdrop
        open={isTutorialActive}
        sx={{
          zIndex: (theme) => theme.zIndex.modal,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
        }}
      />

      {/* チュートリアルカード */}
      <Fade in={isTutorialActive}>
        <Paper
          elevation={6}
          sx={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: (theme) => theme.zIndex.modal + 1,
            maxWidth: 420,
            width: '90vw',
            borderRadius: '28px',
            overflow: 'hidden',
            animation: 'm3-scale-in 300ms cubic-bezier(0.2, 0, 0, 1) both',
          }}
        >
          {/* 進捗バー */}
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 4,
              backgroundColor: 'var(--md-sys-color-surface-container-highest)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: 'var(--md-sys-color-primary)',
                borderRadius: 2,
              },
            }}
          />

          {/* ヘッダー（閉じるボタン） */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              px: 3,
              pt: 2,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              {currentStep + 1} / {totalSteps}
            </Typography>
            <IconButton
              size="small"
              onClick={completeTutorial}
              aria-label="チュートリアルをスキップ"
              sx={{ color: 'text.secondary' }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* コンテンツ */}
          <Box
            sx={{
              px: 4,
              py: 3,
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            {/* ステップの絵文字アイコン */}
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                backgroundColor: 'var(--md-sys-color-primary-container)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.5rem',
                mb: 1,
              }}
            >
              {currentStep === 0 ? (
                // 最初のステップではアプリロゴを表示
                <Avatar
                  src="/icon.png"
                  alt="HARIDICE"
                  sx={{ width: 56, height: 56 }}
                />
              ) : (
                STEP_EMOJIS[currentStep]
              )}
            </Box>

            {/* タイトル */}
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: 'var(--md-sys-color-on-surface)',
              }}
            >
              {step.title}
            </Typography>

            {/* 説明文 */}
            <Typography
              variant="body1"
              sx={{
                color: 'var(--md-sys-color-on-surface-variant)',
                lineHeight: 1.6,
              }}
            >
              {step.description}
            </Typography>
          </Box>

          {/* アクションボタン */}
          <Box
            sx={{
              px: 4,
              pb: 3,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Button
              variant="text"
              onClick={completeTutorial}
              sx={{ color: 'text.secondary' }}
            >
              スキップ
            </Button>
            <Button
              variant="contained"
              onClick={isLastStep ? completeTutorial : nextStep}
              endIcon={!isLastStep && <ArrowForwardIcon />}
              sx={{
                px: 4,
                borderRadius: 20,
                fontWeight: 600,
              }}
            >
              {isLastStep ? 'はじめよう！' : '次へ'}
            </Button>
          </Box>
        </Paper>
      </Fade>
    </>
  );
}
