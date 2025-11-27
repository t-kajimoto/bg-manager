
import { renderHook, act } from '@testing-library/react';
import { useBoardgameManager } from './useBoardgameManager';
import { collection, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';

// ==========================================================================================
// テスト用のモック設定
// ==========================================================================================

// Firebase configをモック化し、テスト用のダミーdbオブジェクトを使わせる
jest.mock('@/lib/firebase/config');

// firebase/firestoreの関数をモック化
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  setDoc: jest.fn(),
}));

// モック関数を型付けしてIDEの補完を効きやすくする
const mockCollection = collection as jest.Mock;
const mockDoc = doc as jest.Mock;
const mockAddDoc = addDoc as jest.Mock;
const mockUpdateDoc = updateDoc as jest.Mock;
const mockDeleteDoc = deleteDoc as jest.Mock;
const mockSetDoc = setDoc as jest.Mock;

// ==========================================================================================
// テストスイート
// ==========================================================================================

describe('useBoardgameManager', () => {
  // 各テストの前にモックをリセット
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ------------------------------------------------------------------------------------------
  // addBoardgame 関数のテスト
  // ------------------------------------------------------------------------------------------
  describe('addBoardgame', () => {
    it('成功時: 正しい引数でaddDocを呼び出し、ローディング状態が正しく遷移すること', async () => {
      // addDocが成功したPromiseを返すように設定
      mockAddDoc.mockResolvedValue(undefined);

      const { result } = renderHook(() => useBoardgameManager());
      const newGame = { name: 'New Game', min: 2, max: 4, time: 30 };

      // actを使用して、stateの更新を伴う非同期関数をラップする
      await act(async () => {
        await result.current.addBoardgame(newGame);
      });

      // addDocが正しい引数で呼び出されたか検証
      expect(mockAddDoc).toHaveBeenCalledTimes(1);
      expect(mockAddDoc).toHaveBeenCalledWith(mockCollection(), newGame);

      // ローディングとエラーの状態を検証
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  // ------------------------------------------------------------------------------------------
  // updateUserEvaluation 関数のテスト
  // ------------------------------------------------------------------------------------------
  describe('updateUserEvaluation', () => {
    it('成功時: 正しい引数でsetDocを呼び出すこと', async () => {
      mockSetDoc.mockResolvedValue(undefined);
      const userId = 'user123';
      const boardGameId = 'game456';
      const evaluationData = { played: true, evaluation: 5, comment: 'Great!' };

      const { result } = renderHook(() => useBoardgameManager());

      await act(async () => {
        await result.current.updateUserEvaluation(userId, boardGameId, evaluationData);
      });

      // docとsetDocが正しい引数で呼び出されたか検証
      expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'userBoardGames', `${userId}_${boardGameId}`);
      expect(mockSetDoc).toHaveBeenCalledTimes(1);
      expect(mockSetDoc).toHaveBeenCalledWith(
        mockDoc(),
        { userId, boardGameId, ...evaluationData },
        { merge: true }
      );

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('失敗時: addDocが失敗した場合にエラーがセットされること', async () => {
      const mockError = new Error('Failed to add');
      // addDocが失敗したPromiseを返すように設定
      mockAddDoc.mockRejectedValue(mockError);

      const { result } = renderHook(() => useBoardgameManager());
      const newGame = { name: 'New Game', min: 2, max: 4, time: 30 };

      await act(async () => {
        await result.current.addBoardgame(newGame);
      });

      // エラーが正しくセットされ、ローディングが解除されているか検証
      expect(result.current.error).toBe(mockError);
      expect(result.current.loading).toBe(false);
    });
  });

  // ------------------------------------------------------------------------------------------
  // updateBoardgame 関数のテスト
  // ------------------------------------------------------------------------------------------
  describe('updateBoardgame', () => {
    it('成功時: 正しい引数でupdateDocを呼び出すこと', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);
      const gameId = 'game123';
      const updates = { name: 'Updated Game Name' };

      const { result } = renderHook(() => useBoardgameManager());

      await act(async () => {
        await result.current.updateBoardgame(gameId, updates);
      });

      // docとupdateDocが正しい引数で呼び出されたか検証
      expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'boardGames', gameId);
      expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
      expect(mockUpdateDoc).toHaveBeenCalledWith(mockDoc(), updates);

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  // ------------------------------------------------------------------------------------------
  // deleteBoardgame 関数のテスト
  // ------------------------------------------------------------------------------------------
  describe('deleteBoardgame', () => {
    it('成功時: 正しい引数でdeleteDocを呼び出すこと', async () => {
      mockDeleteDoc.mockResolvedValue(undefined);
      const gameId = 'game123';

      const { result } = renderHook(() => useBoardgameManager());

      await act(async () => {
        await result.current.deleteBoardgame(gameId);
      });

      // docとdeleteDocが正しい引数で呼び出されたか検証
      expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'boardGames', gameId);
      expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
      expect(mockDeleteDoc).toHaveBeenCalledWith(mockDoc());

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });
});
