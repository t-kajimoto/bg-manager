
import { renderHook, waitFor } from '@testing-library/react';
import { useBoardgames } from './useBoardgames';
import { onSnapshot } from 'firebase/firestore';
import { AuthContext, AuthContextType } from '@/contexts/AuthContext';
import { IBoardGameData, IBoardGameUserFirestore } from '@/features/boardgames/types';
import { IUser } from '@/features/auth/types';
import { ReactNode } from 'react';

// Firebase configをモック化し、テスト用のダミーdb/authオブジェクトを使わせる
jest.mock('@/lib/firebase/config', () => ({
  db: {}, // dbをtruthyな値としてモック化
  auth: {},
}));

// Server Actionをモック化
jest.mock('@/app/actions/boardgames', () => ({
  getBoardGames: jest.fn(),
}));

const mockGetBoardGames = require('@/app/actions/boardgames').getBoardGames;

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
    user: user as unknown as import('firebase/auth').User, // FirebaseのUser型とIUser型は異なるため、テストの簡便性のためにキャスト
    customUser: null, // 今回のテストではcustomUserは未使用
    loading: false,
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
  it('ログインしている場合、Server Actionからデータを取得し、ステートにセットすること', async () => {
    // getBoardGamesのモック実装
    // データ構造は IBoardGame[] (結合済みデータ) を返す前提
    const mockCombinedData: IBoardGame[] = [
      {
        id: 'game1', name: 'Game A', min: 2, max: 4, time: 30, ownerName: 'Admin',
        played: true, evaluation: 5, comment: '面白い！', averageEvaluation: 4,
        isOwned: true,
        tags: []
      },
      {
        id: 'game2', name: 'Game B', min: 3, max: 5, time: 60, ownerName: 'Admin',
        played: false, evaluation: 0, comment: '', averageEvaluation: 0,
        isOwned: false,
        tags: []
      },
    ];

    mockGetBoardGames.mockResolvedValue({ data: mockCombinedData, error: null });

    // renderHookを使用してフックをレンダリング。ログイン状態のWrapperでラップする。
    const { result } = renderHook(() => useBoardgames(), { wrapper: createWrapper(mockUser) });

    // waitForを使って、フック内の非同期処理が完了し、状態が更新されるのを待つ
    await waitFor(() => {
      // ローディングが完了したことを確認
      expect(result.current.loading).toBe(false);
      // データが2件取得できていることを確認
      expect(result.current.boardGames).toHaveLength(2);
    });

    // Server Actionが呼ばれたか確認
    expect(mockGetBoardGames).toHaveBeenCalled();

    // --- Game A のデータ検証 ---
    const gameA = result.current.boardGames.find(g => g.id === 'game1');
    expect(gameA?.name).toBe('Game A');
    expect(gameA?.evaluation).toBe(5);

    // --- Game B のデータ検証 ---
    const gameB = result.current.boardGames.find(g => g.id === 'game2');
    expect(gameB?.name).toBe('Game B');
  });



  // ------------------------------------------------------------------------------------------
  // テストケース3: ローディング状態のテスト
  // ------------------------------------------------------------------------------------------
  it('データ取得中はloadingがtrueであること', async () => {
    // 解決しないPromiseを返すことでローディング状態を維持
    mockGetBoardGames.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useBoardgames(), { wrapper: createWrapper(mockUser) });

    // 初回レンダリング直後はローディング状態であるはず
    expect(result.current.loading).toBe(true);
    
    // 念のため少し待ってもtrueのままであるか（省略可だがwaitが必要な場合もある）
    // 今回は即時returnではないので renderHook 直後にtrueチェックでOK
  });

  // ------------------------------------------------------------------------------------------
  // テストケース4: エラー発生時のテスト
  // ------------------------------------------------------------------------------------------
  it('データ取得でエラーが発生した場合、errorステートにエラーオブジェクトがセットされること', async () => {
    const mockErrorMsg = 'Server Error';
    // エラーを返すようにモック
    mockGetBoardGames.mockResolvedValue({ data: [], error: mockErrorMsg });

    const { result } = renderHook(() => useBoardgames(), { wrapper: createWrapper(mockUser) });

    await waitFor(() => {
      // ローディングが終了し、
      expect(result.current.loading).toBe(false);
      // errorステートにエラーがセットされていることを確認
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe(mockErrorMsg);
    });
  });
});
