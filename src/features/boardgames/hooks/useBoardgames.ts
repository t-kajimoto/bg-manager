
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { IBoardGame, IBoardGameData, IBoardGameUserFirestore } from '@/features/boardgames/types';
import { useAuth } from '@/contexts/AuthContext';
import { MOCK_BOARDGAMES } from '@/lib/mock/data';

/**
 * @interface UseBoardgamesReturn
 * @description useBoardgames フックの戻り値の型定義
 */
interface UseBoardgamesReturn {
  boardGames: IBoardGame[];
  loading: boolean;
  error: Error | null;
}

/**
 * @hook useBoardgames
 * @description Firestoreからボードゲームのコレクションをリアルタイムで取得し、
 *              クライアントサイドで必要なデータ形式に整形・結合するためのカスタムフック。
 *
 * @returns {UseBoardgamesReturn}
 *   - `boardGames`: 取得・整形されたボードゲームのリスト。
 *   - `loading`: データ取得中かどうかを示すフラグ。
 *   - `error`: データ取得中に発生したエラー。
 */
export const useBoardgames = (): UseBoardgamesReturn => {
  const { user } = useAuth();
  const [boardGames, setBoardGames] = useState<IBoardGame[]>(() => {
    if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
      return MOCK_BOARDGAMES;
    }
    return [];
  });
  const [loading, setLoading] = useState<boolean>(() => {
    if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') return false;
    return !!db && !!user;
  });
  const [error, setError] = useState<Error | null>(() => {
    if (process.env.NEXT_PUBLIC_USE_MOCK !== 'true' && !db) {
      return new Error("データベース接続に失敗しました。");
    }
    return null;
  });

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
      console.log('Using Mock Data for Boardgames');
      return;
    }

    if (!db) {
      return;
    }

    // ユーザーがいない場合は、データ取得を行わず、クリーンアップでクリアされる
    if (!user) {
      return;
    }

    // 非同期で実行してlintエラーを回避
    const timer = setTimeout(() => setLoading(true), 0);

    let unsubscribeUserGames: (() => void) | undefined;
    const qGames = query(collection(db, 'boardGames'));

    const unsubscribeGames = onSnapshot(qGames, (querySnapshot) => {
      // 以前のuserBoardGamesリスナーがあれば解除
      if (unsubscribeUserGames) {
        unsubscribeUserGames();
      }

      const gamesData: IBoardGameData[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as IBoardGameData));

      // このコールバック内でもdbのnullチェックを追加
      if (!db) {
        setError(new Error("データベース接続が失われました。"));
        setLoading(false);
        return;
      }

      const qUserGames = query(collection(db, 'userBoardGames'));

      unsubscribeUserGames = onSnapshot(qUserGames, (userQuerySnapshot) => {
        const userGamesData: IBoardGameUserFirestore[] = userQuerySnapshot.docs.map(doc =>
          doc.data() as IBoardGameUserFirestore
        );

        const combinedGames: IBoardGame[] = gamesData.map(game => {
          const allUserDataForGame = userGamesData.filter(ug => ug.boardGameId === game.id);
          const currentUserData = user
            ? allUserDataForGame.find(ug => ug.userId === user.uid)
            : undefined;

          const evaluations = allUserDataForGame.map(ug => ug.evaluation).filter(e => e > 0);
          const averageEvaluation = evaluations.length > 0
            ? evaluations.reduce((a, b) => a + b, 0) / evaluations.length
            : 0;
          const anyPlayed = allUserDataForGame.some(ug => ug.played);

          return {
            ...game,
            played: currentUserData?.played ?? false,
            evaluation: currentUserData?.evaluation ?? 0,
            comment: currentUserData?.comment ?? '',
            averageEvaluation: Math.round(averageEvaluation * 10) / 10,
            anyPlayed: anyPlayed,
          };
        });

        setBoardGames(combinedGames);
        setLoading(false);
      }, (err) => {
        console.error("Error fetching user board games:", err);
        setError(err);
        setLoading(false);
      });

    }, (err) => {
      console.error("Error fetching board games:", err);
      setError(err);
      setLoading(false);
    });

    return () => {
      // クリーンアップ関数
      clearTimeout(timer);
      if (unsubscribeUserGames) {
        unsubscribeUserGames();
      }
      unsubscribeGames();

      // ユーザーログアウト時やコンポーネントアンマウント時にデータをクリア
      setBoardGames([]);
      setLoading(false);
    };
  }, [user]);

  return { boardGames, loading, error };
};
