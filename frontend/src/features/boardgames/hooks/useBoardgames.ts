import { useState, useEffect, useCallback } from 'react';
import { IBoardGame } from '@/features/boardgames/types';
import { useAuth } from '@/contexts/AuthContext';
import { MOCK_BOARDGAMES } from '@/lib/mock/data';
import { getBoardGames } from '@/app/actions/boardgames';

/**
 * @interface UseBoardgamesReturn
 * @description useBoardgames フックの戻り値の型定義
 */
interface UseBoardgamesReturn {
  boardGames: IBoardGame[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * @hook useBoardgames
 * @description Supabaseからボードゲームのデータを取得するためのカスタムフック。
 *              Server Actions を使用してデータをフェッチします。
 *
 * @returns {UseBoardgamesReturn}
 *   - `boardGames`: 取得されたボードゲームのリスト。
 *   - `loading`: データ取得中かどうかを示すフラグ。
 *   - `error`: データ取得中に発生したエラー。
 *   - `refetch`: データを再取得するための関数。
 */
export const useBoardgames = (userId?: string): UseBoardgamesReturn => {
  const { user, loading: authLoading } = useAuth();
  const [boardGames, setBoardGames] = useState<IBoardGame[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchBoardGames = useCallback(async () => {
    if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
      setBoardGames(MOCK_BOARDGAMES);
      setLoading(false);
      return;
    }

    // 特定のユーザーIDが指定されている場合は、ログイン状態に関わらず取得を試みる
    if (authLoading && !userId) return;

    if (authLoading && !userId) return;

    // 未ログイン時でも全体の一覧は取得できるように、ユーザー有無によるブロックを解除
    // if (!user && !userId) {
    //   setBoardGames([]);
    //   setLoading(false);
    //   return;
    // }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await getBoardGames(userId, !!userId);
      if (error) {
        throw new Error(error);
      }
      setBoardGames(data);
    } catch (err) {
      console.error('Error fetching board games:', err);
      setError(
        err instanceof Error ? err : new Error('不明なエラーが発生しました'),
      );
    } finally {
      setLoading(false);
    }
  }, [user, authLoading, userId]);

  useEffect(() => {
    fetchBoardGames();
  }, [fetchBoardGames]);

  return { boardGames, loading, error, refetch: fetchBoardGames };
};
