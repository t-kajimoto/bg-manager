import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Header from './Header';
import { AuthContext, AuthProvider } from '@/contexts/AuthContext'; // 本物のContextをインポート
import { User } from 'firebase/auth';

// FirebaseのUserオブジェクトのモック。必要なプロパティのみを定義します。
const mockUser: User = {
  uid: '12345',
  displayName: 'Test User',
  email: 'test@example.com',
  // ...その他の必要なUserのプロパティをモック
} as User;

/**
 * @description Headerコンポーネントのテストスイート
 */
describe('Header Component', () => {

  /**
   * @test ローディング中にスピナーが表示されること
   */
  it('should display a spinner while loading', () => {
    // AuthContextの値を { loading: true } に設定してレンダリング
    render(
      <AuthContext.Provider value={{ user: null, customUser: null, loading: true }}>
        <Header />
      </AuthContext.Provider>
    );

    // `progressbar` ロールを持つ要素（MUIのCircularProgress）が存在することを確認
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  /**
   * @test 未ログイン状態のときにログインボタンが表示されること
   */
  it('should display the login button when the user is not logged in', () => {
    // AuthContextの値を未ログイン状態に設定してレンダリング
    render(
      <AuthContext.Provider value={{ user: null, customUser: null, loading: false }}>
        <Header />
      </AuthContext.Provider>
    );

    // "Login with Google" というテキストを持つボタンが存在することを確認
    expect(screen.getByRole('button', { name: /login with google/i })).toBeInTheDocument();
  });

  /**
   * @test ログイン済みのときにウェルカムメッセージとログアウトボタンが表示されること
   */
  it('should display welcome message and logout button when the user is logged in', () => {
    // AuthContextの値をログイン状態に設定してレンダリング
    render(
      <AuthContext.Provider value={{ user: mockUser, customUser: { nickname: 'TestNickname', isAdmin: false }, loading: false }}>
        <Header />
      </AuthContext.Provider>
    );

    // "Welcome, TestNickname" というテキストが存在することを確認 (ニックネームを優先)
    expect(screen.getByText(/welcome, TestNickname/i)).toBeInTheDocument();

    // "Logout" というテキストを持つボタンが存在することを確認
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });

  /**
   * @test ログイン済みでニックネームがない場合にDisplayNameが表示されること
   */
  it('should display DisplayName when nickname is not available', () => {
    // AuthContextの値をカスタムユーザー情報なしのログイン状態に設定
    render(
      <AuthContext.Provider value={{ user: mockUser, customUser: null, loading: false }}>
        <Header />
      </AuthContext.Provider>
    );

    // "Welcome, Test User" というテキストが存在することを確認 (displayNameをフォールバック)
    expect(screen.getByText(/welcome, Test User/i)).toBeInTheDocument();
  });
});
