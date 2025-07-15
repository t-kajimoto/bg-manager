import { TestBed } from '@angular/core/testing';
import { BoardgameService } from './boardgame.service';
import { Firestore, collection, collectionData, addDoc, doc, setDoc, getDocs, query, where, DocumentData, DocumentReference } from '@angular/fire/firestore';
import * as FirebaseAuth from 'firebase/auth'; // Firebase Authのグローバル関数をインポート
import { Observable, from, of, combineLatest, switchMap, map, filter, take } from 'rxjs';
import { IBoardGameData, IBoardGameUserFirestore } from '../data/boardgame.model';

// Firestoreのモック
const mockFirestore = jasmine.createSpyObj('Firestore', [
  'collection',
  'collectionData',
  'addDoc',
  'doc',
  'setDoc',
  'getDocs',
  'query',
  'where',
]);
mockFirestore.collection.and.returnValue({});
mockFirestore.collectionData.and.returnValue(of([]));
mockFirestore.addDoc.and.returnValue(Promise.resolve({ id: 'newDocId' }));
mockFirestore.doc.and.returnValue({});
mockFirestore.setDoc.and.returnValue(Promise.resolve());
mockFirestore.getDocs.and.returnValue(Promise.resolve({ forEach: () => {} }));
mockFirestore.query.and.returnValue({});
mockFirestore.where.and.returnValue({});

// Authのモック (Authインスタンス自体は最小限のオブジェクトで提供)
const mockAuthInstance = {};

// グローバル関数 onAuthStateChanged と signInAnonymously のスパイ
let authStateChangedCallback: ((user: any) => void) | null = null;
const onAuthStateChangedSpy = jasmine.createSpy('onAuthStateChanged').and.callFake((authInstance: any, callback: any) => {
  authStateChangedCallback = callback;
  return () => {}; // unsubscribe関数を返す
});
const signInAnonymouslySpy = jasmine.createSpy('signInAnonymously').and.returnValue(Promise.resolve({ user: { uid: 'anonUser' } }));

describe('BoardgameService', () => {
  let service: BoardgameService;

  beforeEach(() => {
    // グローバル関数をスパイする
    spyOn(FirebaseAuth, 'onAuthStateChanged').and.callFake(onAuthStateChangedSpy);
    spyOn(FirebaseAuth, 'signInAnonymously').and.callFake(signInAnonymouslySpy);

    TestBed.configureTestingModule({
      providers: [
        BoardgameService,
        { provide: Firestore, useValue: mockFirestore },
        { provide: FirebaseAuth.Auth, useValue: mockAuthInstance }, // Authの型を正しく指定
      ],
    });
    service = TestBed.inject(BoardgameService);

    // 各モックの呼び出し履歴をクリア
    mockFirestore.collection.calls.reset();
    mockFirestore.collectionData.calls.reset();
    mockFirestore.addDoc.calls.reset();
    mockFirestore.doc.calls.reset();
    mockFirestore.setDoc.calls.reset();
    mockFirestore.getDocs.calls.reset();
    mockFirestore.query.calls.reset();
    mockFirestore.where.calls.reset();
    onAuthStateChangedSpy.calls.reset();
    signInAnonymouslySpy.calls.reset();

    // サービス初期化時にonAuthStateChangedが呼ばれるので、ここで一度クリア
    // そして、テストごとにユーザー状態を制御できるようにする
    if (authStateChangedCallback) {
      authStateChangedCallback(null); // デフォルトはログアウト状態
    }
  });

  /**
   * サービスが正常に作成されることを確認するテストケース。
   */
  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  /**
   * ユーザーがログインしていない場合に匿名認証がトリガーされることを確認するテストケース。
   */
  it('should sign in anonymously if no user is logged in', () => {
    expect(onAuthStateChangedSpy).toHaveBeenCalled();
    expect(signInAnonymouslySpy).toHaveBeenCalled();
  });

  /**
   * ユーザーがログインしている場合に匿名認証がトリガーされないことを確認するテストケース。
   */
  it('should not sign in anonymously if a user is logged in', () => {
    const mockUser = { uid: 'testUser123' };
    if (authStateChangedCallback) {
      authStateChangedCallback(mockUser);
    }
    // サービスが初期化された後にonAuthStateChangedが呼ばれるため、再度サービスを注入して確認
    TestBed.inject(BoardgameService);
    expect(onAuthStateChangedSpy).toHaveBeenCalled();
    expect(signInAnonymouslySpy).not.toHaveBeenCalled();
  });

  describe('getBoardGames', () => {
    const mockBoardGamesData: IBoardGameData[] = [
      { id: 'bg1', name: 'Game A', min: 2, max: 4, time: 60 },
      { id: 'bg2', name: 'Game B', min: 1, max: 5, time: 90 },
    ];

    const mockUserGamesData: Omit<IBoardGameUserFirestore, 'id'>[] = [
      { userId: 'testUser123', boardGameId: 'bg1', played: true, evaluation: 4 },
    ];

    const mockAllUserGamesSnapshot = (boardGameId: string) => ({
      forEach: (callback: (doc: any) => void) => {
        if (boardGameId === 'bg1') {
          callback({ data: () => ({ userId: 'user1', boardGameId: 'bg1', played: true, evaluation: 4 }) });
          callback({ data: () => ({ userId: 'user2', boardGameId: 'bg1', played: true, evaluation: 5 }) });
          callback({ data: () => ({ userId: 'user3', boardGameId: 'bg1', played: false, evaluation: 0 }) });
        } else if (boardGameId === 'bg2') {
          callback({ data: () => ({ userId: 'user1', boardGameId: 'bg2', played: false, evaluation: 0 }) });
        }
      },
    });

    beforeEach(() => {
      mockFirestore.collectionData.and.callFake((colRef: any, options: any) => {
        if (colRef === mockFirestore.collection('boardGames')) {
          return of(mockBoardGamesData);
        } else if (colRef === mockFirestore.collection('userBoardGames')) {
          return of(mockUserGamesData);
        }
        return of([]);
      });

      mockFirestore.getDocs.and.callFake((q: any) => {
        // queryの引数からboardGameIdを推測して適切なスナップショットを返す
        const boardGameId = q.query.find((clause: any) => clause.field === 'boardGameId')?.value;
        return Promise.resolve(mockAllUserGamesSnapshot(boardGameId));
      });

      mockFirestore.query.and.callFake((colRef: any, ...args: any[]) => ({
        collection: colRef,
        query: args, // where句などを保持
      }));

      mockFirestore.where.and.callFake((field: string, op: string, value: any) => ({ field, op, value }));

      // ユーザーがログインしている状態にする
      if (authStateChangedCallback) {
        authStateChangedCallback({ uid: 'testUser123' });
      }
    });

    /**
     * ボードゲームデータが正しく結合され、ユーザー固有のデータと平均評価が含まれることを確認するテストケース。
     */
    it('should return combined board game data with user-specific info and average evaluation', (done) => {
      service.getBoardGames().subscribe(games => {
        expect(games.length).toBe(2);

        const gameA = games.find(g => g.id === 'bg1');
        expect(gameA).toBeDefined();
        expect(gameA?.played).toBeTrue();
        expect(gameA?.evaluation).toBe(4);
        expect(gameA?.averageEvaluation).toBeCloseTo(4.5); // (4+5)/2 = 4.5
        expect(gameA?.anyPlayed).toBeTrue();

        const gameB = games.find(g => g.id === 'bg2');
        expect(gameB).toBeDefined();
        expect(gameB?.played).toBeFalse(); // ユーザーデータがないためデフォルト値
        expect(gameB?.evaluation).toBe(0); // ユーザーデータがないためデフォルト値
        expect(gameB?.averageEvaluation).toBe(0); // 評価がないため0
        expect(gameB?.anyPlayed).toBeFalse();

        done();
      });
    });

    /**
     * ユーザーがログインしていない場合にgetBoardGamesが空の配列を返すことを確認するテストケース。
     */
    it('should return an empty array if no user is logged in', (done) => {
      if (authStateChangedCallback) {
        authStateChangedCallback(null); // ユーザーをログアウト状態にする
      }
      service.getBoardGames().subscribe(games => {
        expect(games).toEqual([]);
        done();
      });
    });
  });

  describe('addBoardGame', () => {
    /**
     * 新しいボードゲームがFirestoreに正しく追加されることを確認するテストケース。
     */
    it('should add a new board game to Firestore', async () => {
      const newGame = { name: 'New Game', min: 2, max: 4, time: 120 };
      const result = await service.addBoardGame(newGame);

      expect(mockFirestore.addDoc).toHaveBeenCalledWith(mockFirestore.collection('boardGames'), newGame);
      // addDocはDocumentReferenceを返すため、toEqualではなくtoBeTruthyで確認
      expect(result).toBeTruthy();
    });
  });

  describe('updateUserBoardGame', () => {
    const mockUser = { uid: 'testUser123' };

    beforeEach(() => {
      // ユーザーがログインしている状態にする
      if (authStateChangedCallback) {
        authStateChangedCallback(mockUser);
      }
    });

    /**
     * ユーザーのボードゲームデータがFirestoreに正しく更新されることを確認するテストケース。
     */
    it('should update user board game data in Firestore', async () => {
      const gameId = 'bg1';
      const userData = { played: true, evaluation: 5 };

      await service.updateUserBoardGame(gameId, userData);

      const expectedDocRef = mockFirestore.doc(mockFirestore, `userBoardGames/${mockUser.uid}_${gameId}`);
      expect(mockFirestore.setDoc).toHaveBeenCalledWith(expectedDocRef, {
        ...userData,
        userId: mockUser.uid,
        boardGameId: gameId,
      }, { merge: true });
    });

    /**
     * ユーザーがログインしていない場合にupdateUserBoardGameがエラーを返すことを確認するテストケース。
     */
    it('should reject if no user is logged in', async () => {
      if (authStateChangedCallback) {
        authStateChangedCallback(null); // ユーザーをログアウト状態にする
      }
      const gameId = 'bg1';
      const userData = { played: true, evaluation: 5 };

      await expectAsync(service.updateUserBoardGame(gameId, userData)).toBeRejectedWith('User not logged in');
      expect(mockFirestore.setDoc).not.toHaveBeenCalled();
    });
  });

  describe('waitForUser', () => {
    /**
     * ユーザーが既にログインしている場合に、waitForUserが即座に解決することを確認するテストケース。
     */
    it('should resolve immediately if user is already available', async () => {
      const mockUser = { uid: 'existingUser' };
      if (authStateChangedCallback) {
        authStateChangedCallback(mockUser);
      }
      // サービスを再注入してcurrentUserが設定されていることを確認
      const newServiceInstance = TestBed.inject(BoardgameService);

      const user = await (newServiceInstance as any)['waitForUser']();
      expect(user).toEqual(mockUser);
      expect(onAuthStateChangedSpy).toHaveBeenCalledTimes(1); // サービス初期化時のみ
    });

    /**
     * ユーザーがログインしていない場合に、waitForUserがonAuthStateChangedを待機することを確認するテストケース。
     */
    it('should wait for onAuthStateChanged to emit a user', async () => {
      // サービスを初期化し、ユーザーがいない状態にする
      if (authStateChangedCallback) {
        authStateChangedCallback(null);
      }
      const newServiceInstance = TestBed.inject(BoardgameService);

      const promise = (newServiceInstance as any)['waitForUser']();

      const mockUser = { uid: 'delayedUser' };
      if (authStateChangedCallback) {
        authStateChangedCallback(mockUser);
      }

      const user = await promise;
      expect(user).toEqual(mockUser);
      expect(onAuthStateChangedSpy).toHaveBeenCalledTimes(2); // 初期化時とwaitForUser内で呼ばれる
    });
  });
});


