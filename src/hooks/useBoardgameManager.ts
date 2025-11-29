
import { useState } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { IBoardGameData, IBoardGameUser } from '@/types/boardgame';

// useBoardgameManagerフックが返す関数の型定義
type BoardgameManagerFunctions = {
  addBoardgame: (gameData: Omit<IBoardGameData, 'id'>) => Promise<void>;
  updateBoardgame: (gameId: string, gameData: Partial<IBoardGameData>) => Promise<void>;
  deleteBoardgame: (gameId: string) => Promise<void>;
  updateUserEvaluation: (userId: string, boardGameId: string, evaluationData: IBoardGameUser) => Promise<void>;
};

// useBoardgameManagerフックの戻り値の型定義
type UseBoardgameManagerReturn = {
  loading: boolean;
  error: Error | null;
} & BoardgameManagerFunctions;

/**
 * @hook useBoardgameManager
 * @description FirestoreのboardGamesコレクションに対するCRUD操作（追加、更新、削除）を提供するカスタムフック。
 *              操作の実行中はローディング状態を管理し、エラーが発生した場合はエラー情報を保持します。
 *
 * @returns {UseBoardgameManagerReturn}
 *   - `loading`: いずれかの操作が実行中かを示すフラグ。
 *   - `error`: 直前の操作で発生したエラー。
 *   - `addBoardgame`: 新しいボードゲームをDBに追加する関数。
 *   - `updateBoardgame`: 既存のボードゲーム情報を更新する関数。
 *   - `deleteBoardgame`: ボードゲームをDBから削除する関数。
 */
export const useBoardgameManager = (): UseBoardgameManagerReturn => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * @function addBoardgame
   * @description 新しいボードゲームデータをFirestoreの`boardGames`コレクションに追加します。
   * @param {Omit<IBoardGameData, 'id'>} gameData - 追加するボードゲームのデータ（IDはFirestoreが自動採番）。
   */
  const addBoardgame = async (gameData: Omit<IBoardGameData, 'id'>) => {
    if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
      console.log('Mock: addBoardgame', gameData);
      return;
    }

    // DB接続がない場合はエラー
    if (!db) {
      setError(new Error("データベース接続に失敗しました。"));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // `boardGames`コレクションへの参照を取得し、addDocでドキュメントを追加
      await addDoc(collection(db, 'boardGames'), gameData);
    } catch (e) {
      console.error("ボードゲームの追加に失敗しました:", e);
      setError(e instanceof Error ? e : new Error('不明なエラーが発生しました'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * @function updateBoardgame
   * @description 既存のボードゲームデータを更新します。
   * @param {string} gameId - 更新対象のボードゲームのドキュメントID。
   * @param {Partial<IBoardGameData>} gameData - 更新するデータ。Partial型なので、一部のフィールドのみでも可。
   */
  const updateBoardgame = async (gameId: string, gameData: Partial<IBoardGameData>) => {
    if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
      console.log('Mock: updateBoardgame', gameId, gameData);
      return;
    }

    if (!db) {
      setError(new Error("データベース接続に失敗しました。"));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // 更新対象となるドキュメントへの参照を作成
      const gameRef = doc(db, 'boardGames', gameId);
      // updateDocでドキュメントを更新
      await updateDoc(gameRef, gameData);
    } catch (e) {
      console.error("ボードゲームの更新に失敗しました:", e);
      setError(e instanceof Error ? e : new Error('不明なエラーが発生しました'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * @function deleteBoardgame
   * @description 指定されたIDのボードゲームを削除します。
   * @param {string} gameId - 削除対象のボードゲームのドキュメントID。
   */
  const deleteBoardgame = async (gameId: string) => {
    if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
      console.log('Mock: deleteBoardgame', gameId);
      return;
    }

    if (!db) {
      setError(new Error("データベース接続に失敗しました。"));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // 削除対象となるドキュメントへの参照を作成
      const gameRef = doc(db, 'boardGames', gameId);
      // deleteDocでドキュメントを削除
      await deleteDoc(gameRef);
    } catch (e) {
      console.error("ボードゲームの削除に失敗しました:", e);
      setError(e instanceof Error ? e : new Error('不明なエラーが発生しました'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * @function updateUserEvaluation
   * @description ユーザーの評価情報を作成または更新します。
   * @param {string} userId - ユーザーID。
   * @param {string} boardGameId - ボードゲームID。
   * @param {IBoardGameUser} evaluationData - 評価データ（played, evaluation, comment）。
   */
  const updateUserEvaluation = async (userId: string, boardGameId: string, evaluationData: IBoardGameUser) => {
    if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
      console.log('Mock: updateUserEvaluation', userId, boardGameId, evaluationData);
      return;
    }

    if (!db) {
      setError(new Error("データベース接続に失敗しました。"));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // 複合IDでドキュメント参照を作成
      const evaluationRef = doc(db, 'userBoardGames', `${userId}_${boardGameId}`);
      // setDocにmerge: trueオプションを付けると、ドキュメントが存在しない場合は作成、存在する場合は更新(マージ)される
      await setDoc(evaluationRef, { userId, boardGameId, ...evaluationData }, { merge: true });
    } catch (e) {
      console.error("評価の更新に失敗しました:", e);
      setError(e instanceof Error ? e : new Error('不明なエラーが発生しました'));
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, addBoardgame, updateBoardgame, deleteBoardgame, updateUserEvaluation };
};
