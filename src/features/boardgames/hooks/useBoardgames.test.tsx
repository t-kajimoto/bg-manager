
import { renderHook, waitFor } from '@testing-library/react';
import { useBoardgames } from './useBoardgames';
import { onSnapshot, DocumentData, QuerySnapshot, Query } from 'firebase/firestore';
import { AuthContext, AuthContextType } from '@/contexts/AuthContext';
import { IBoardGameData, IBoardGameUserFirestore } from '@/features/boardgames/types';
import { IUser } from '@/features/auth/types';
import { ReactNode } from 'react';
import { User } from 'firebase/auth';

// Firebase configをモック化し、テスト用のダミーdb/authオブジェクトを使わせる
jest.mock('@/lib/firebase/config');

// ==========================================================================================
// テスト用のモック設定
// ==========================================================================================

// Firebase Firestoreの機能をモック化します。
// これにより、実際のデータベースに接続せずにテストを実行できます。
jest.mock('firebase/firestore', () => ({
  // collection関数は、単に引数をそのまま返すようにモック化します。
  collection: jest.fn((_, path) => ({ path })),
  // query関数も、第一引数をそのまま返すようにモック化します。
  query: jest.fn(query => query),
  // onSnapshot関数をモック化し、テストケースごとに異なる振る舞いをさせられるようにします。
  onSnapshot: jest.fn(),
}));

// onSnapshotのモックを型付けして、IDEの補完を効きやすくします。
const mockOnSnapshot = onSnapshot as jest.Mock;

// ==========================================================================================
// テスト用のダミーデータ
// ==========================================================================================

// テストで使用するログインユーザーのダミーデータ
const mockUser: IUser = {
  uid: 'user123',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: '',
  nickname: 'Taro',
};

// Firestoreの 'boardGames' コレクションから返されるダミーデータ
const mockGamesData: IBoardGameData[] = [
  { id: 'game1', name: 'Game A', min: 2, max: 4, time: 30, ownerName: 'Admin' },
  { id: 'game2', name: 'Game B', min: 3, max: 5, time: 60, ownerName: 'Admin' },
];

// Firestoreの 'userBoardGames' コレクションから返されるダミーデータ
const mockUserGamesData: IBoardGameUserFirestore[] = [
  // Game A に対する評価 (ログインユーザーと別ユーザー)
  { userId: 'user123', boardGameId: 'game1', played: true, evaluation: 5, comment: '面白い！' },
  { userId: 'user456', boardGameId: 'game1', played: true, evaluation: 3, comment: '普通' },
  // Game B に対する評価 (別ユーザーのみ)
  { userId: 'user456', boardGameId: 'game2', played: false, evaluation: 0, comment: '' },
];

// ==========================================================================================
// テスト用のヘルパーコンポーネント
// ==========================================================================================

/**
 * @function createWrapper
 * @description テスト対象のフックをラップするためのReactコンポーネントを作成するヘルパー関数。
 *              AuthContext.Providerを使って、テストケースごとに異なる認証状態を注入できるようにします。
 * @param user - テストケースで使用するユーザー情報。未ログイン状態をテストする場合はnullを渡す。
 */
const createWrapper = (user: IUser | null) => {
  // AuthContextに渡すダミーの値
  const authContextValue: AuthContextType = {
    user: user as any, // FirebaseのUser型とIUser型は異なるため、テストの簡便性のためにanyにキャスト
    customUser: null, // 今回のテストではcustomUserは未使用
    loading: false,
    error: null,
  };

  // props.childrenをAuthContext.Providerでラップして返すコンポーネント
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <AuthContext.Provider value={authContextValue}>{children}</AuthContext.Provider>
  );
  return Wrapper;
};

// ==========================================================================================
// テストスイート
// ==========================================================================================

describe('useBoardgames', () => {
  // 各テストの前にモックをリセットし、テスト間の影響を防ぎます。
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ------------------------------------------------------------------------------------------
  // テストケース1: データ取得成功時 (ログイン状態)
  // ------------------------------------------------------------------------------------------
  it('ログインしている場合、Firestoreからデータを取得し、正しく結合すること', async () => {
    // onSnapshotのモック実装
    mockOnSnapshot
      // 1回目の呼び出し (boardGames) では、ダミーのゲームデータを返す
      .mockImplementationOnce((query, callback) => {
        callback({ docs: mockGamesData.map(game => ({ id: game.id, data: () => game })) });
        return jest.fn(); // unsubscribe関数を返す
      })
      // 2回目の呼び出し (userBoardGames) では、ダミーのユーザー評価データを返す
      .mockImplementationOnce((query, callback) => {
        callback({ docs: mockUserGamesData.map(ug => ({ data: () => ug })) });
        return jest.fn(); // unsubscribe関数を返す
      });

    // renderHookを使用してフックをレンダリング。ログイン状態のWrapperでラップする。
    const { result } = renderHook(() => useBoardgames(), { wrapper: createWrapper(mockUser) });

    // waitForを使って、フック内の非同期処理が完了し、状態が更新されるのを待つ
    await waitFor(() => {
      // ローディングが完了したことを確認
      expect(result.current.loading).toBe(false);
      // データが2件取得できていることを確認
      expect(result.current.boardGames).toHaveLength(2);
    });

    // --- Game A のデータ検証 ---
    const gameA = result.current.boardGames.find(g => g.id === 'game1');
    expect(gameA?.name).toBe('Game A');
    // ログインユーザー自身の評価が正しく反映されているか
    expect(gameA?.played).toBe(true);
    expect(gameA?.evaluation).toBe(5);
    expect(gameA?.comment).toBe('面白い！');
    // 全ユーザーの平均評価が正しく計算されているか ( (5 + 3) / 2 = 4 )
    expect(gameA?.averageEvaluation).toBe(4);

    // --- Game B のデータ検証 ---
    const gameB = result.current.boardGames.find(g => g.id === 'game2');
    expect(gameB?.name).toBe('Game B');
    // ログインユーザーはGame Bを評価していないので、初期値になっているか
    expect(gameB?.played).toBe(false);
    expect(gameB?.evaluation).toBe(0);
    expect(gameB?.comment).toBe('');
    // Game Bは誰も評価していない (evaluationが0) ので、平均評価は0になるか
    expect(gameB?.averageEvaluation).toBe(0);
  });

  // ------------------------------------------------------------------------------------------
  // テストケース2: データ取得成功時 (未ログイン状態)
  // ------------------------------------------------------------------------------------------
  it('ログインしていない場合、個人データは初期値のまま、全体のデータは正しく計算されること', async () => {
    // onSnapshotのモック実装 (テストケース1と同様)
    mockOnSnapshot
      .mockImplementationOnce((query, callback) => {
        callback({ docs: mockGamesData.map(game => ({ id: game.id, data: () => game })) });
        return jest.fn();
      })
      .mockImplementationOnce((query, callback) => {
        callback({ docs: mockUserGamesData.map(ug => ({ data: () => ug })) });
        return jest.fn();
      });

    // 未ログイン状態 (currentUser: null) のWrapperでフックをレンダリング
    const { result } = renderHook(() => useBoardgames(), { wrapper: createWrapper(null) });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.boardGames).toHaveLength(2);
    });

    // --- Game A のデータ検証 ---
    const gameA = result.current.boardGames.find(g => g.id === 'game1');
    // 未ログインなので、個人の評価は初期値になる
    expect(gameA?.played).toBe(false);
    expect(gameA?.evaluation).toBe(0);
    expect(gameA?.comment).toBe('');
    // 全体の平均評価はログイン状態に関わらず計算される
    expect(gameA?.averageEvaluation).toBe(4);
  });

  // ------------------------------------------------------------------------------------------
  // テストケース3: ローディング状態のテスト
  // ------------------------------------------------------------------------------------------
  it('データ取得中はloadingがtrueであること', () => {
    // onSnapshotがまだコールバックを呼ばないようにモックを空実装
    mockOnSnapshot.mockImplementation(() => jest.fn());

    const { result } = renderHook(() => useBoardgames(), { wrapper: createWrapper(mockUser) });

    // 初回レンダリング直後はローディング状態であるはず
    expect(result.current.loading).toBe(true);
  });

  // ------------------------------------------------------------------------------------------
  // テストケース4: エラー発生時のテスト
  // ------------------------------------------------------------------------------------------
  it('データ取得でエラーが発生した場合、errorステートにエラーオブジェクトがセットされること', async () => {
    const mockError = new Error('Firestore Error');
    // onSnapshotのモックを、エラーを発生させる実装に変更
    mockOnSnapshot.mockImplementation((query, onNext, onError) => {
      onError(mockError); // エラーコールバックを直接呼ぶ
      return jest.fn();
    });

    const { result } = renderHook(() => useBoardgames(), { wrapper: createWrapper(mockUser) });

    await waitFor(() => {
      // ローディングが終了し、
      expect(result.current.loading).toBe(false);
      // errorステートにエラーがセットされていることを確認
      expect(result.current.error).toBe(mockError);
    });
  });
});
