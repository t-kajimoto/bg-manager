/**
 * @fileoverview
 * このファイルは、アプリケーションの主要なビジネスロジックを担当するサービスを定義します。
 * Firestoreデータベースとのやり取り（データの読み書き）をすべてこのサービスに集約することで、
 * コンポーネントの関心をUIの表示とユーザーインタラクションに集中させることができます。
 */

import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, doc, setDoc, where, query, DocumentData, DocumentReference, getDocs, getDoc, deleteDoc } from '@angular/fire/firestore';
import { Observable, from, combineLatest, switchMap, map, filter, firstValueFrom } from 'rxjs';
import { IBoardGame, IBoardGameData, IBoardGameUser, IBoardGameUserFirestore } from '../data/boardgame.model';
import { AuthService } from './auth.service';

/**
 * ボードゲームのデータ管理と、それに関連するユーザーデータの操作を専門に行うサービスです。
 */
@Injectable({
  providedIn: 'root'
})
export class BoardgameService {

  /**
   * BoardgameServiceのコンストラクタです。
   * AngularのDI（依存性注入）により、FirestoreとAuthServiceのインスタンスを受け取ります。
   * @param firestore Firestoreデータベースとやり取りするためのサービス
   * @param authService ユーザー認証情報を管理するサービス
   */
  constructor(private firestore: Firestore, private authService: AuthService) { }

  /**
   * 指定されたユーザーIDに対応するユーザーのプロフィール情報を取得します。
   * @param userId 情報を取得したいユーザーのID
   * @returns ユーザーのニックネームとプロフィール写真URLを含むオブジェクト。見つからない場合はnull。
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
   * 特定のボードゲームに対する全ユーザーの評価情報を取得します。
   * @param boardGameId 評価を取得したいボードゲームのID
   * @returns 各ユーザーの名前、写真URL、評価を含むオブジェクトの配列
   */
  async getAllEvaluationsForGame(boardGameId: string): Promise<any[]> {
    const userGamesCollection = collection(this.firestore, 'userBoardGames');
    const q = query(userGamesCollection, where('boardGameId', '==', boardGameId));
    const querySnapshot = await getDocs(q);

    // Promise.allを使って、全ユーザーのプロフィール取得を並行して行い、効率化します。
    const evaluations = await Promise.all(querySnapshot.docs.map(async (docSnap) => {
      const data = docSnap.data();
      const userId = data['userId'];
      const userProfile = await this.getUserProfile(userId);
      return {
        userName: userProfile?.nickname ?? 'Unknown User',
        userPhotoUrl: userProfile?.photoURL ?? 'assets/default-user.png',
        evaluation: data['evaluation'],
        comment: data['comment'] // ひとことコメントを追加
      };
    }));

    return evaluations;
  }

  /**
   * アプリケーションで表示するための、すべてのボードゲーム情報を取得します。
   * このメソッドは、複数の非同期データソースをRxJSのオペレータを使って巧みに結合しています。
   * @returns 画面表示用に加工されたボードゲーム情報のObservable配列
   */
  getBoardGames(): Observable<IBoardGame[]> {
    // 1. Firestoreからすべてのボードゲームの基本情報(`boardGames`コレクション)を取得します。
    const boardGamesCollection = collection(this.firestore, 'boardGames');
    const allGames$ = collectionData(boardGamesCollection, { idField: 'id' }) as Observable<IBoardGameData[]>;

    // 2. AuthServiceから現在のログインユーザーIDを取得します。
    return this.authService.userId$.pipe(
      // ユーザーIDが取得できるまで処理を待機します。
      filter((userId): userId is string => !!userId),
      // ユーザーIDを使って、次の処理（ユーザー固有のデータ取得）に切り替えます。
      switchMap(userId => {
        // 3. ログインユーザーのプレイ状況(`userBoardGames`コレクション)を取得します。
        const userGamesCollection = collection(this.firestore, 'userBoardGames');
        const q = query(userGamesCollection, where("userId", "==", userId));
        const userGames$ = collectionData(q, { idField: 'id' }) as Observable<IBoardGameUserFirestore[]>;

        // 4. `combineLatest`を使って、全ゲーム情報とログインユーザーのプレイ状況が両方揃うのを待ちます。
        return combineLatest([allGames$, userGames$]).pipe(
          map(([games, userGames]) => {
            // ユーザーのプレイ状況を、ボードゲームIDですぐに検索できるようMap形式に変換します。
            const userGamesMap = new Map(userGames.map(ug => [ug.boardGameId, { played: ug.played, evaluation: ug.evaluation, comment: ug.comment }]));

            // 5. 各ゲーム情報に対して、さらに追加情報（平均評価など）を非同期で取得し、結合します。
            return games.map(game => {
              const userData = userGamesMap.get(game.id) || { played: false, evaluation: 0, comment: '' };

              // 特定のゲームに対する全ユーザーのプレイ状況を取得するためのクエリです。
              const allUserGamesQuery = query(collection(this.firestore, 'userBoardGames'), where('boardGameId', '==', game.id));
              // Firestoreのクエリ結果(Promise)をObservableに変換して、RxJSのパイプラインで処理します。
              return from(getDocs(allUserGamesQuery)).pipe(
                map(allUserGamesSnapshot => {
                  let totalEvaluation = 0;
                  let evaluationCount = 0;
                  let anyPlayed = false;

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

                  // 平均評価を計算します。評価がない場合は0とします。
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
          switchMap(observables => combineLatest(observables))
        );
      })
    );
  }

  /**
   * 新しいボードゲームをFirestoreに追加します。
   * @param boardGame ユーザーが入力したボードゲーム情報
   * @returns Firestoreドキュメントへの参照を含むPromise
   */
  async addBoardGame(boardGame: Omit<IBoardGameData, 'id'>): Promise<DocumentReference<DocumentData>> {
    // 現在のユーザーIDを取得します。
    const userId = await firstValueFrom(this.authService.userId$.pipe(filter(id => !!id)));
    if (!userId) {
      throw new Error('User not logged in');
    }
    // ユーザーのプロフィールを取得して、所有者名を設定します。
    const userProfile = await this.getUserProfile(userId);
    const ownerName = userProfile ? userProfile.nickname : 'Unknown User';

    const boardGameWithOwner = { ...boardGame, ownerName };

    const boardGamesCollection = collection(this.firestore, 'boardGames');
    return addDoc(boardGamesCollection, boardGameWithOwner);
  }

  /**
   * 既存のボードゲームの基本情報を更新します。
   * @param gameId 更新対象のボードゲームID
   * @param boardGameData 更新するデータ（名前、人数、タグなど）
   * @returns 更新完了を示すPromise
   */
  updateBoardGame(gameId: string, boardGameData: Partial<IBoardGameData>): Promise<void> {
    const gameDocRef = doc(this.firestore, `boardGames/${gameId}`);
    // `merge: true`オプションにより、ドキュメント全体を上書きせず、指定したフィールドのみを更新します。
    return setDoc(gameDocRef, boardGameData, { merge: true });
  }

  /**
   * ユーザー個人のボードゲームに対するプレイ状況（プレイ済みか、評価）を更新します。
   * @param gameId 対象のボードゲームID
   * @param userData 更新するプレイ状況データ
   * @returns 更新完了を示すPromise
   */
  async updateUserBoardGame(gameId: string, userData: Partial<IBoardGameUser>): Promise<void> {
    // 現在のユーザーIDを取得します。
    const userId = await firstValueFrom(this.authService.userId$.pipe(filter(id => !!id)));
    if (!userId) {
      throw new Error('User not logged in');
    }
    // ユーザーIDとボードゲームIDを組み合わせて、一意なドキュメントIDを生成します。
    const docId = `${userId}_${gameId}`;
    const userGameDocRef = doc(this.firestore, `userBoardGames/${docId}`);
    const dataToSet = {
      ...userData,
      userId: userId,
      boardGameId: gameId
    };
    // `merge: true`で、ドキュメントの他のフィールドを壊さずに更新します。
    return setDoc(userGameDocRef, dataToSet, { merge: true });
  }

  /**
   * 指定されたボードゲームを削除します。
   * これには、`boardGames`コレクションの本体と、`userBoardGames`コレクションにあるすべての関連ドキュメントが含まれます。
   * @param {string} gameId - 削除するボードゲームのID。
   * @returns {Promise<void>} 削除処理の完了を示すPromise。
   */
  async deleteBoardGame(gameId: string): Promise<void> {
    // 1. `boardGames`コレクションから本体を削除
    const gameDocRef = doc(this.firestore, `boardGames/${gameId}`);
    const deleteGamePromise = deleteDoc(gameDocRef);

    // 2. `userBoardGames`コレクションから関連データをすべて検索
    const userGamesQuery = query(collection(this.firestore, 'userBoardGames'), where('boardGameId', '==', gameId));
    const userGamesSnapshot = await getDocs(userGamesQuery);

    // 3. 関連するすべての`userBoardGames`ドキュメントを削除
    const deleteUserGamesPromises = userGamesSnapshot.docs.map(docSnap => deleteDoc(docSnap.ref));

    // 4. すべての削除処理が完了するのを待つ
    await Promise.all([deleteGamePromise, ...deleteUserGamesPromises]);
  }
}

