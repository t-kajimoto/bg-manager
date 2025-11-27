'use client';

import { AppBar, Toolbar, Typography, Button, Box, CircularProgress } from '@mui/material';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';

/**
 * @component Header
 * @description アプリケーションの全ページで共通して表示されるヘッダーコンポーネントです。
 * ユーザーのログイン状態に応じて、ログインボタンやユーザー名、ログアウトボタンを動的に表示します。
 */
export default function Header() {
  // useAuthフックを使って、グローバルな認証情報（ユーザー、カスタムユーザー情報、ローディング状態）を取得します。
  const { user, customUser, loading } = useAuth();

  /**
   * @function handleLogin
   * @description Googleログイン処理を開始します。
   * FirebaseのGoogleAuthProviderを使用し、リダイレクト方式でログイン画面に遷移させます。
   */
  const handleLogin = async () => {
    // Firebase Authが設定されていない場合は、エラーメッセージをコンソールに出力して処理を中断します。
    if (!auth) {
      console.error("Firebase Auth is not configured.");
      return;
    }
    // Google認証のプロバイダーインスタンスを作成します。
    const provider = new GoogleAuthProvider();
    try {
      // signInWithPopupを利用すると、現在のタブを遷移させることなく認証ダイアログが開くため、
      // redirect URI の制約を気にせずにログインできます。ログインが完了すると onAuthStateChanged が発火します。
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in: ", error);
    }
  };

  /**
   * @function handleLogout
   * @description ログアウト処理を実行します。
   */
  const handleLogout = async () => {
    // Firebase Authが設定されていない場合は、エラーメッセージをコンソールに出力して処理を中断します。
    if (!auth) {
      console.error("Firebase Auth is not configured.");
      return;
    }
    try {
      // signOutを実行すると、Firebaseの認証情報がクリアされ、onAuthStateChangedが検知します。
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  return (
    // AppBarはMUIのコンポーネントで、ヘッダーの基本的なレイアウトを提供します。
    <AppBar position="static">
      <Toolbar>
        {/* アプリケーションのタイトル */}
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          HARIDICE Next
        </Typography>

        {/* 認証状態に応じたUIの表示切り替え */}
        <Box>
          {/* loadingがtrueの場合（認証状態を確認中）は、スピナーを表示します。 */}
          {loading ? (
            <CircularProgress color="inherit" size={24} />

          // userオブジェクトが存在する場合（ログイン済み）
          ) : user ? (
            <>
              {/* ユーザー名を表示します。ニックネームがあればそれを、なければGoogleアカウントの表示名を使います。 */}
              <Typography component="span" sx={{ marginRight: 2 }}>
                Welcome, {customUser?.nickname || user.displayName}
              </Typography>
              {/* ログアウトボタン */}
              <Button color="inherit" onClick={handleLogout}>
                Logout
              </Button>
            </>

          // userオブジェクトが存在しない場合（未ログイン）
          ) : (
            // ログインボタン
            <Button color="inherit" onClick={handleLogin}>
              Login with Google
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
