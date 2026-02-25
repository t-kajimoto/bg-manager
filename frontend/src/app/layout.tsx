import type { Metadata } from "next";
import "./globals.css";
import ThemeRegistry from './ThemeRegistry';
import { AuthProvider } from '@/contexts/AuthContext';
import { SetUsernameDialog } from '@/features/auth/components/SetUsernameDialog';
import { AppLayout } from '@/components/layout/AppLayout';
import { TutorialProvider } from '@/contexts/TutorialContext';

// =============================================================================
// アプリケーション全体のメタデータ
// HARIDICE = ハリネズミ(HARI) + サイコロ(DICE) のボードゲーム管理アプリ
// =============================================================================
export const metadata: Metadata = {
  title: "HARIDICE",
  description: "ハリネズミと一緒にボードゲームを管理・評価するアプリ",
  icons: {
    icon: '/favicon.ico',
    apple: '/icon.png',
  },
};

// =============================================================================
// ルートレイアウト
// ThemeRegistry → AuthProvider → TutorialProvider → AppLayout の順で階層構成
// =============================================================================
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // lang="ja" で日本語アプリであることを明示
    <html lang="ja" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeRegistry>
          <AuthProvider>
            <TutorialProvider>
              {/* AppLayoutがHeader + Navigation + Main Content構造を提供 */}
              <AppLayout>
                {children}
              </AppLayout>
              {/* 初回ログイン時のユーザー名設定ダイアログ */}
              <SetUsernameDialog />
            </TutorialProvider>
          </AuthProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
