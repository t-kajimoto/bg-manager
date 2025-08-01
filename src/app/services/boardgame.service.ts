import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, doc, setDoc, where, query, DocumentData, DocumentReference, getDocs, getDoc, deleteDoc } from '@angular/fire/firestore';
import { Observable, from, combineLatest, switchMap, map, filter, firstValueFrom } from 'rxjs';
import { IBoardGame, IBoardGameData, IBoardGameUser, IBoardGameUserFirestore } from '../data/boardgame.model';
import { AuthService } from './auth.service';

/**
 * @class BoardgameService
 * @description
 * このアプリケーションの主要なビジネスロジックを担当するサービスです。
 * Firestoreデータベースとのやり取り（データの読み書き）をすべてこのサービスに集約することで、
 * コンポーネントの関心をUIの表示とユーザーインタラクションに集中させることができます。
 */
@Injectable({
  providedIn: 'root'
})
export class BoardgameService {

  /**
   * @constructor
   * @param firestore - Firestoreデータベースとやり取りするためのAngularFireサービス。
   * @param authService - ユーザー認証情報を管理するサービス。
   */
  constructor(private firestore: Firestore, private authService: AuthService) { }

  /**
   * @method getUserProfile
   * @private
   * @param userId - 情報を取得したいユーザーのID。
   * @returns ユーザーのニックネームとプロフィール写真URLを含むオブジェクト。見つからない場合はnull。
   * @description
   * 指定されたユーザーIDに対応するユーザーのプロフィール情報を`users`コレクションから非同期で取得します。
   * このメソッドはサービス内部でのみ使用されます。
   */
  private async getUserProfile(userId: string): Promise<{ nickname: string, photoURL: string } | null> {
    const userDocRef = doc(this.firestore, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      return {
        nickname: userData['nickname'] || userData['displayName'] || 'Unknown User',
        photoURL: userData['photoURL'] || 'assets/default-user.png'
      };
    }
    return null;
  }

  /**
   * @method getAllEvaluationsForGame
   * @param boardGameId - 評価を取得したいボードゲームのID。
   * @returns 各ユーザーのID、名前、写真URL、評価、コメントを含むオブジェクトの配列。
   * @description
   * 特定のボードゲームに対する全ユーザーの評価情報を`userBoardGames`コレクションから取得し、
   * 各評価に紐づくユーザーのプロフィール情報を結合して返します。
   */
  async getAllEvaluationsForGame(boardGameId: string): Promise<any[]> {
    const userGamesCollection = collection(this.firestore, 'userBoardGames');
    const q = query(userGamesCollection, where('boardGameId', '==', boardGameId));
    const querySnapshot = await getDocs(q);

    // Promise.allを使い、全ユーザーのプロフィール取得を並行して行うことで、パフォーマンスを向上させています。
    const evaluations = await Promise.all(querySnapshot.docs.map(async (docSnap) => {
      const data = docSnap.data();
      const userId = data['userId'];
      const userProfile = await this.getUserProfile(userId);
      return {
        userId: userId,
        userName: userProfile?.nickname ?? 'Unknown User',
        userPhotoUrl: userProfile?.photoURL ?? 'assets/default-user.png',
        evaluation: data['evaluation'],
        comment: data['comment']
      };
    }));

    return evaluations;
  }

  /**
   * @method getBoardGames
   * @returns 画面表示用にすべての情報が結合されたボードゲーム情報のObservable配列。
   * @description
   * このサービスで最も複雑なメソッドです。RxJSのオペレータを駆使して、複数の非同期データソースをリアクティブに結合します。
   * 1. 全ゲーム情報を取得 (`boardGames`)
   * 2. ログインユーザーの評価情報を取得 (`userBoardGames`)
   * 3. 各ゲームの全ユーザーの評価情報を取得し、平均評価などを計算
   * これらすべてを結合し、コンポーネントが扱いやすい`IBoardGame[]`の形式で提供します。
   */
  getBoardGames(): Observable<IBoardGame[]> {
    // 1. Firestoreからすべてのボードゲームの基本情報(`boardGames`コレクション)をObservableとして取得します。
    const boardGamesCollection = collection(this.firestore, 'boardGames');
    const allGames$ = collectionData(boardGamesCollection, { idField: 'id' }) as Observable<IBoardGameData[]>;

    // 2. AuthServiceから現在のログインユーザーIDのObservableを取得します。
    return this.authService.userId$.pipe(
      // ユーザーがログインし、有効なIDが取得できるまで後続の処理を待機します。
      filter((userId): userId is string => !!userId),
      // ユーザーIDが得られたら、そのIDを使ってユーザー固有のデータを取得する新しいObservableに切り替えます。
      switchMap(userId => {
        // 3. ログインユーザーのプレイ状況(`userBoardGames`コレクション)をObservableとして取得します。
        const userGamesCollection = collection(this.firestore, 'userBoardGames');
        const q = query(userGamesCollection, where("userId", "==", userId));
        const userGames$ = collectionData(q, { idField: 'id' }) as Observable<IBoardGameUserFirestore[]>;

        // 4. `combineLatest`を使い、全ゲーム情報とログインユーザーのプレイ状況が両方揃うのを待ちます。
        return combineLatest([allGames$, userGames$]).pipe(
          // 2つのデータストリームから最新の値を受け取ります。
          map(([games, userGames]) => {
            // ユーザーのプレイ状況を、ボードゲームIDですぐに検索できるようMap形式に変換しておきます（計算量O(1)でのアクセスを可能にするため）。
            const userGamesMap = new Map(userGames.map(ug => [ug.boardGameId, { played: ug.played, evaluation: ug.evaluation, comment: ug.comment }]));

            // 5. 各ゲーム情報に対して、さらに追加情報（平均評価など）を非同期で取得し、結合するためのObservableの配列を生成します。
            return games.map(game => {
              const userData = userGamesMap.get(game.id) || { played: false, evaluation: 0, comment: '' };

              // 特定のゲームに対する全ユーザーのプレイ状況を取得するためのクエリです。
              const allUserGamesQuery = query(collection(this.firestore, 'userBoardGames'), where('boardGameId', '==', game.id));
              // Firestoreのクエリ結果(Promise)をObservableに変換して、RxJSのパイプラインで処理できるようにします。
              return from(getDocs(allUserGamesQuery)).pipe(
                // クエリ結果のスナップショットを受け取ります。
                map(allUserGamesSnapshot => {
                  let totalEvaluation = 0;
                  let evaluationCount = 0;
                  let anyPlayed = false;

                  // 全ユーザーの評価をループ処理し、平均評価と誰かがプレイしたかを計算します。
                  allUserGamesSnapshot.forEach(docSnap => {
                    const data = docSnap.data() as IBoardGameUserFirestore;
                    if (data.evaluation > 0) {
                      totalEvaluation += data.evaluation;
                      evaluationCount++;
                    }
                    if (data.played) {
                      anyPlayed = true;
                    }
                  });

                  const average = evaluationCount > 0 ? totalEvaluation / evaluationCount : 0;
                  // 小数点第2位で四捨五入して、小数点第1位までの数値にします。
                  const averageEvaluation = Math.round(average * 10) / 10;

                  // 6. すべての情報を結合して、最終的な画面表示用のIBoardGameオブジェクトを構築します。
                  return { ...game, ...userData, averageEvaluation, anyPlayed };
                })
              );
            });
          }),
          // `games.map`によって作られたObservableの配列を、単一のObservable<IBoardGame[]>にまとめます。
          // これにより、すべてのゲームの追加情報（平均評価など）の計算が完了するのを待ってから、一度にデータを流すことができます。
          switchMap(observables => combineLatest(observables))
        );
      })
    );
  }

  /**
   * @method addBoardGame
   * @param boardGame - ユーザーが入力したボードゲーム情報。
   * @returns Firestoreドキュメントへの参照を含むPromise。
   * @description
   * 新しいボードゲームをFirestoreの`boardGames`コレクションに追加します。
   * 所有者名には、操作を実行したユーザーの現在のニックネームが自動的に設定されます。
   */
  async addBoardGame(boardGame: Omit<IBoardGameData, 'id'>): Promise<DocumentReference<DocumentData>> {
    const userId = await firstValueFrom(this.authService.userId$.pipe(filter(id => !!id)));
    if (!userId) {
      throw new Error('User not logged in');
    }
    const userProfile = await this.getUserProfile(userId);
    const ownerName = userProfile ? userProfile.nickname : 'Unknown User';

    const boardGameWithOwner = { ...boardGame, ownerName };

    const boardGamesCollection = collection(this.firestore, 'boardGames');
    return addDoc(boardGamesCollection, boardGameWithOwner);
  }

  /**
   * @method updateBoardGame
   * @param gameId - 更新対象のボードゲームID。
   * @param boardGameData - 更新するデータ（名前、人数、タグなど）。
   * @returns 更新完了を示すPromise。
   * @description
   * 既存のボードゲームの基本情報（マスターデータ）を更新します。
   */
  updateBoardGame(gameId: string, boardGameData: Partial<IBoardGameData>): Promise<void> {
    const gameDocRef = doc(this.firestore, `boardGames/${gameId}`);
    // `merge: true`オプションにより、ドキュメント全体を上書きせず、指定したフィールドのみを安全に更新します。
    return setDoc(gameDocRef, boardGameData, { merge: true });
  }

  /**
   * @method updateUserBoardGame
   * @param gameId - 対象のボードゲームID。
   * @param userData - 更新するプレイ状況データ。
   * @returns 更新完了を示すPromise。
   * @description
   * ユーザー個人のボードゲームに対するプレイ状況（プレイ済みか、評価、コメント）を更新または作成します。
   * ドキュメントIDを`${userId}_${gameId}`とすることで、ユーザーとゲームの組み合わせに対して常に一意なドキュメントを保証します。
   */
  async updateUserBoardGame(gameId: string, userData: Partial<IBoardGameUser>): Promise<void> {
    const userId = await firstValueFrom(this.authService.userId$.pipe(filter(id => !!id)));
    if (!userId) {
      throw new Error('User not logged in');
    }
    const docId = `${userId}_${gameId}`;
    const userGameDocRef = doc(this.firestore, `userBoardGames/${docId}`);
    const dataToSet = {
      ...userData,
      userId: userId,
      boardGameId: gameId
    };
    // `merge: true`で、ドキュメントが存在しない場合は新規作成、存在する場合は指定フィールドのみを更新します。
    return setDoc(userGameDocRef, dataToSet, { merge: true });
  }

  /**
   * @method deleteBoardGame
   * @param gameId - 削除するボードゲームのID。
   * @returns 削除処理の完了を示すPromise。
   * @description
   * 指定されたボードゲームをデータベースから完全に削除します。
   * これには、`boardGames`コレクションの本体と、`userBoardGames`コレクションにあるすべての関連評価ドキュメントの削除が含まれます。
   */
  async deleteBoardGame(gameId: string): Promise<void> {
    // 1. `boardGames`コレクションから本体のドキュメントを削除します。
    const gameDocRef = doc(this.firestore, `boardGames/${gameId}`);
    const deleteGamePromise = deleteDoc(gameDocRef);

    // 2. `userBoardGames`コレクションから、このゲームIDを持つすべての関連ドキュメントを検索します。
    const userGamesQuery = query(collection(this.firestore, 'userBoardGames'), where('boardGameId', '==', gameId));
    const userGamesSnapshot = await getDocs(userGamesQuery);

    // 3. 見つかったすべての関連ドキュメントを削除するためのPromiseの配列を作成します。
    const deleteUserGamesPromises = userGamesSnapshot.docs.map(docSnap => deleteDoc(docSnap.ref));

    // 4. 本体とすべての関連ドキュメントの削除処理が完了するのを待ちます。
    await Promise.all([deleteGamePromise, ...deleteUserGamesPromises]);
  }
}