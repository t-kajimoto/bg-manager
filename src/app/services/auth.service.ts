/**
 * @fileoverview
 * このファイルは、Firebase Authenticationを使用した認証と認可（権限管理）に関連するロジックを専門に扱うサービスを定義します。
 * ユーザーのログイン状態の監視、管理者権限のチェックなどを一元管理します。
 */

import { Injectable, inject } from '@angular/core';
import { Auth, User, onAuthStateChanged, signInAnonymously } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

/**
 * アプリケーション全体の認証状態とユーザー権限を管理するサービスです。
 * このサービスをコンポーネントに注入することで、現在のユーザー情報や管理者であるかどうかを簡単に取得できます。
 */
@Injectable({
  providedIn: 'root' // アプリケーションのどこからでも単一のインスタンスとして利用可能にする設定
})
export class AuthService {
  // AngularのDI（依存性注入）システムを使って、FirebaseのAuthサービスを取得します。
  private auth: Auth = inject(Auth);

  // 管理者として認識するユーザーのFirebase UIDのリストです。
  // ここにUIDを追加することで、そのユーザーに管理者権限を付与できます。
  private readonly ADMIN_USER_IDS = ['nsPr7XWcyhhJMi9ipeS6GoU5g9A2'];

  /**
   * 現在のログインユーザーの状態を監視するObservableです。
   * ユーザーがログインしている場合はUserオブジェクトを、していない場合はnullをストリームとして流します。
   * onAuthStateChangedを使用して、Firebaseの認証状態の変更をリアルタイムで検知します。
   * ユーザーが未ログインの場合は、自動的に匿名認証を行います。
   */
  user$: Observable<User | null> = new Observable<User | null>(observer => {
    // onAuthStateChangedは認証状態が変わるたびにコールバック関数を実行します。
    const unsubscribe = onAuthStateChanged(this.auth,
      (user) => {
        if (user) {
          // ユーザーがログインしている場合、そのユーザー情報を通知します。
          observer.next(user);
        } else {
          // ユーザーがログインしていない場合、匿名でサインインし、その認証情報を通知します。
          // これにより、ログインしていないユーザーでもアプリの機能（データの閲覧など）を利用できます。
          signInAnonymously(this.auth).then(cred => observer.next(cred.user));
        }
      },
      (error) => observer.error(error), // エラーが発生した場合
      () => observer.complete() // ストリームが完了した場合
    );
    // このObservableが破棄される際に、onAuthStateChangedの監視を解除するための関数を返します。
    return { unsubscribe };
  }).pipe(
    // shareReplay(1)は、複数のコンポーネントがこのuser$を購読した際に、
    // 最後の値をキャッシュして共有し、認証状態の監視処理が複数回実行されるのを防ぎます。
    shareReplay(1)
  );

  /**
   * 現在のユーザーのUID（一意なID）をストリームとして提供するObservableです。
   * user$からユーザー情報を取得し、その中からuidだけを抽出（map）して流します。
   */
  userId$: Observable<string | null> = this.user$.pipe(
    map(user => user ? user.uid : null)
  );

  /**
   * 現在のユーザーが管理者であるかどうかをboolean値のストリームとして提供するObservableです。
   * userId$から流れてくるUIDが、事前に定義したADMIN_USER_IDSリストに含まれているかをチェックします。
   */
  isAdmin$: Observable<boolean> = this.userId$.pipe(
    map(userId => !!userId && this.ADMIN_USER_IDS.includes(userId))
  );

  /**
   * AuthServiceのコンストラクタです。
   * 初期化時に特別な処理は行いません。
   */
  constructor() { }
}
