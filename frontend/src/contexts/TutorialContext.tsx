'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// =============================================================================
// チュートリアルコンテキスト
// 初回訪問時のオンボーディング状態を管理する
// =============================================================================

// localStorageのキー
const TUTORIAL_COMPLETED_KEY = 'haridice_tutorial_completed';

interface TutorialContextValue {
  /** チュートリアルが表示中かどうか */
  isTutorialActive: boolean;
  /** 現在のステップ番号（0始まり） */
  currentStep: number;
  /** チュートリアルの全ステップ数 */
  totalSteps: number;
  /** チュートリアルを開始する */
  startTutorial: () => void;
  /** 次のステップへ進む */
  nextStep: () => void;
  /** チュートリアルを終了・スキップする */
  completeTutorial: () => void;
  /** チュートリアルが完了済みかどうか */
  isCompleted: boolean;
}

const TutorialContext = createContext<TutorialContextValue | null>(null);

// --- チュートリアルのステップ定義 ---
const TUTORIAL_STEPS = [
  {
    title: 'HARIDICEへようこそ！🦔',
    description: 'ハリネズミと一緒にボードゲームを管理・評価するアプリです。',
  },
  {
    title: 'ボードゲームを追加しよう',
    description: '右下の「＋」ボタンからお気に入りのゲームを登録できます。',
  },
  {
    title: 'ガチャで今日遊ぶゲームを決めよう',
    description: 'ナビゲーションの「ガチャ」でランダムにゲームを選べます。',
  },
  {
    title: '戦績を記録しよう',
    description: '「戦績」ページでプレイ結果を残して振り返ろう。',
  },
];

export function TutorialProvider({ children }: { children: ReactNode }) {
  // localStorageから完了状態を確認（SSR対策でtypeofチェック）
  const [isCompleted, setIsCompleted] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(TUTORIAL_COMPLETED_KEY) === 'true';
  });
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // チュートリアルを開始する
  const startTutorial = useCallback(() => {
    setCurrentStep(0);
    setIsTutorialActive(true);
  }, []);

  // 次のステップへ進む
  const nextStep = useCallback(() => {
    setCurrentStep((prev) => {
      const next = prev + 1;
      // 全ステップ完了したら自動終了
      if (next >= TUTORIAL_STEPS.length) {
        setIsTutorialActive(false);
        setIsCompleted(true);
        if (typeof window !== 'undefined') {
          localStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true');
        }
        return 0;
      }
      return next;
    });
  }, []);

  // チュートリアルを終了・スキップする
  const completeTutorial = useCallback(() => {
    setIsTutorialActive(false);
    setIsCompleted(true);
    setCurrentStep(0);
    if (typeof window !== 'undefined') {
      localStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true');
    }
  }, []);

  return (
    <TutorialContext.Provider
      value={{
        isTutorialActive,
        currentStep,
        totalSteps: TUTORIAL_STEPS.length,
        startTutorial,
        nextStep,
        completeTutorial,
        isCompleted,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
}

// --- カスタムフック ---
export function useTutorial() {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial は TutorialProvider の中で使用してください');
  }
  return context;
}

// ステップデータのエクスポート（TutorialOverlayで使用）
export { TUTORIAL_STEPS };
