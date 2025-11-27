
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot, query, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { IBoardGame, IBoardGameData, IBoardGameUserFirestore } from '@/types/boardgame';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user, loading: authLoading } = useAuth();
  const [boardGames, setBoardGames] = useState<IBoardGame[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // 認証状態の確認が終わる前にFirestoreへ問い合わせると、匿名リクエスト扱いで即座に拒否されるため待機する
    if (authLoading) {
      return;
    }

    // Firestoreルールでは認証済みユーザーのみがboardGames/userBoardGamesを読み取れる
    // 未ログインのままクエリすると "Missing or insufficient permissions." が発生するため、早期にエラーを提示する
    if (!user) {
      setBoardGames([]);
      setError(new Error('ボードゲームを表示するにはログインが必要です。'));
      setLoading(false);
      return;
    }

    if (!db) {
      setError(new Error("データベース接続に失敗しました。"));
      setLoading(false);
      return;
    }

    // クエリをやり直す前にステータスを初期化して、再ログイン時に前回のエラーが残らないようにする
    setError(null);
    setLoading(true);

    const qGames = query(collection(db, 'boardGames'));

    const unsubscribeGames = onSnapshot(qGames, (querySnapshot) => {
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

      const unsubscribeUserGames = onSnapshot(qUserGames, (userQuerySnapshot) => {
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

      return () => unsubscribeUserGames();
    }, (err) => {
      console.error("Error fetching board games:", err);
      setError(err);
      setLoading(false);
    });

    return () => unsubscribeGames();
  }, [user, authLoading]);

  return { boardGames, loading, error };
};
