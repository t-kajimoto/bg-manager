import { Injectable, inject } from '@angular/core';
import { Auth, User, onAuthStateChanged, signInAnonymously } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

/**
 * @class AuthService
 * @description
 * アプリケーション全体の認証状態とユーザー権限を管理するサービスです。
 * Firebase Authenticationと連携し、ユーザーのログイン状態の監視、管理者権限のチェックなどを一元管理します。
 * このサービスをコンポーネントに注入することで、現在のユーザー情報や管理者であるかどうかをリアクティブに取得できます。
 */
@Injectable({
  providedIn: 'root' // アプリケーションのどこからでも単一のインスタンスとして利用可能にする設定
})
export class AuthService {
  // Angular v14以降で推奨されているinject関数を使い、FirebaseのAuthサービスを取得します。
  private auth: Auth = inject(Auth);

  // このアプリケーションの管理者として認識するユーザーのFirebase UIDのリストです。
  // Firestoreのセキュリティルールと連携して、特定の操作（ボードゲームの追加・削除など）を許可するために使用します。
  private readonly ADMIN_USER_IDS = ['nsPr7XWcyhhJMi9ipeS6GoU5g9A2'];

  /**
   * @property user$
   * @description
   * 現在のログインユーザーの状態を監視するObservableです。
   * ユーザーがログインしている場合はFirebaseのUserオブジェクトを、していない場合はnullをストリームとして流します。
   * onAuthStateChangedを使用して、Firebaseの認証状態の変更をリアルタイムで検知します。
   * ユーザーが未ログインの場合は、データの読み取り権限などを得るために自動的に匿名認証を行います。
   */
  user$: Observable<User | null> = new Observable<User | null>(observer => {
    // onAuthStateChangedは、認証状態（ログイン、ログアウトなど）が変わるたびにコールバック関数を実行します。
    // この監視を解除するための関数を返します。
    const unsubscribe = onAuthStateChanged(this.auth,
      (user) => {
        if (user) {
          // ユーザーがログインしている場合、そのユーザー情報を通知します。
          observer.next(user);
        } else {
          // ユーザーがログインしていない場合、匿名でサインインし、その認証情報を通知します。
          // これにより、ログインしていないユーザーでもアプリの機能（データの閲覧など）を限定的に利用できます。
          signInAnonymously(this.auth).then(cred => observer.next(cred.user));
        }
      },
      (error) => observer.error(error), // エラーが発生した場合
      () => observer.complete() // ストリームが完了した場合
    );
    // このObservableが破棄される際に、onAuthStateChangedの監視を解除するためのクリーンアップ関数を返します。
    return { unsubscribe };
  }).pipe(
    // shareReplay(1)は、複数のコンポーネントがこのuser$を購読した際に、
    // 最後の値をキャッシュして共有し、認証状態の監視処理が複数回実行されるのを防ぎ、パフォーマンスを向上させます。
    shareReplay(1)
  );

  /**
   * @property userId$
   * @description
   * 現在のユーザーのUID（一意なID）をストリームとして提供するObservableです。
   * user$からユーザー情報を取得し、その中からuidだけを抽出（map）して流します。
   */
  userId$: Observable<string | null> = this.user$.pipe(
    map(user => user ? user.uid : null)
  );

  /**
   * @property isAdmin$
   * @description
   * 現在のユーザーが管理者であるかどうかをboolean値のストリームとして提供するObservableです。
   * userId$から流れてくるUIDが、事前に定義したADMIN_USER_IDSリストに含まれているかをチェックします。
   */
  isAdmin$: Observable<boolean> = this.userId$.pipe(
    map(userId => !!userId && this.ADMIN_USER_IDS.includes(userId))
  );

  /**
   * @constructor
   * @description
   * AuthServiceのコンストラクタです。
   * DI（依存性注入）はクラスプロパティの初期化で行っているため、コンストラクタ内での処理は不要です。
   */
  constructor() { }
}