import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Auth, GoogleAuthProvider, signInWithPopup, UserCredential, signOut, User } from '@angular/fire/auth';

import { Firestore, doc, setDoc, onSnapshot, updateDoc, getDoc } from '@angular/fire/firestore';
import { MatDialog } from '@angular/material/dialog';
import { EditNicknameDialogComponent } from './page/list/edit-nickname-dialog/edit-nickname-dialog.component';

/**
 * @class AppComponent
 * @description
 * このアプリケーションのルートコンポーネントです。
 * 全ページで共通して表示されるヘッダー（ツールバー）の管理と、
 * ユーザー認証（ログイン、ログアウト、ニックネーム変更）に関するUIロジックを担当します。
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule
],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {

  /** ユーザーがログインしているかどうかを示すフラグ。UIの表示切り替えに使用します。 */
  isLoggedIn: boolean = false;
  /** ログインユーザーのニックネーム。Firestoreから取得し、ヘッダーに表示します。 */
  userNickname: string | null = null;
  /** ログインユーザーのプロフィール写真URL。ヘッダーに表示します。 */
  userPhotoUrl: string | null = null;
  /** 現在のログインユーザーのFirebase Userオブジェクト。UIDなどを取得するために使用します。 */
  private currentUser: User | null = null;

  /**
   * @constructor
   * @param router - Angularのルーターサービス（現在は未使用）。
   * @param auth - Firebase Authenticationサービス。
   * @param firestore - Firestoreデータベースサービス。
   * @param dialog - Angular Materialのダイアログサービス。
   */
  constructor(
    private router: Router, 
    private auth: Auth, 
    private firestore: Firestore,
    public dialog: MatDialog
  ) {}

  /**
   * @method ngOnInit
   * @description
   * コンポーネントの初期化時に、Firebaseの認証状態の変更を監視します。
   * ログイン状態に応じて、UIの表示に必要なプロパティを更新します。
   */
  ngOnInit() {
    // onAuthStateChangedで認証状態の変更をサブスクライブします。
    this.auth.onAuthStateChanged(user => {
      if (user) {
        // --- ユーザーがログインしている場合の処理 ---
        this.isLoggedIn = true;
        this.currentUser = user;
        this.userPhotoUrl = user.photoURL;
        
        // Firestoreの`users`コレクションから、対応するユーザードキュメントをリアルタイムで監視します。
        // これにより、ニックネームが変更された際に即座にヘッダーの表示を更新できます。
        const userRef = doc(this.firestore, 'users', user.uid);
        onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            // ニックネームが設定されていればそれを、なければGoogleの表示名を使用します。
            this.userNickname = userData['nickname'] || user.displayName;
          } else {
            // Firestoreにドキュメントがまだ存在しない場合（初回ログイン直後など）は、Googleの表示名を一時的に使用します。
            this.userNickname = user.displayName;
          }
        });
        console.log('User is logged in:', user.displayName);
      } else {
        // --- ユーザーがログアウトしている場合の処理 ---
        this.isLoggedIn = false;
        this.currentUser = null;
        this.userNickname = null;
        this.userPhotoUrl = null;
        console.log('User is logged out.');
      }
    });
  }

  /**
   * @method loginWithGoogle
   * @description
   * Googleの認証プロバイダを使用して、ポップアップウィンドウでのログインフローを開始します。
   * ログイン成功後、Firestoreの`users`コレクションにユーザー情報が存在するか確認し、
   * 存在しない場合は新規作成、存在する場合は情報を更新します。
   */
  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
      const result: UserCredential = await signInWithPopup(this.auth, provider);
      const user = result.user;
      console.log('Google login successful!', user);

      if (user.uid) {
        const userRef = doc(this.firestore, 'users', user.uid);
        const docSnap = await getDoc(userRef);

        if (!docSnap.exists()) {
          // ドキュメントが存在しない場合（初回ログイン）、Firestoreに新しいユーザードキュメントを作成します。
          // ニックネームの初期値として、Googleの表示名を設定します。
          await setDoc(userRef, {
            displayName: user.displayName,
            nickname: user.displayName,
            photoURL: user.photoURL,
            email: user.email
          });
          console.log('New user profile created in Firestore.');
        } else {
          // ドキュメントが存在する場合（再ログイン）、Googleアカウント由来の基本情報（表示名、写真）を最新の状態に更新します。
          // ニックネームはユーザーが任意で変更するため、ここでは更新しません。
          await updateDoc(userRef, {
            displayName: user.displayName,
            photoURL: user.photoURL
          });
          console.log('Existing user profile updated.');
        }
      }
    } catch (error: any) {
      console.error('Google login failed:', error);
      // ユーザーがポップアップを閉じた場合のエラーは、コンソールに出力するだけで、ユーザーには通知しません。
      if (error.code === 'auth/popup-closed-by-user') {
        console.log('Login popup closed by user.');
      }
    }
  }

  /**
   * @method openEditNicknameDialog
   * @description
   * ニックネームを編集するためのダイアログを開きます。
   * ダイアログが閉じた後、返された新しいニックネームでFirestoreのデータを更新します。
   */
  openEditNicknameDialog(): void {
    if (!this.currentUser) return; // ユーザー情報がなければ何もしない

    const dialogRef = this.dialog.open(EditNicknameDialogComponent, {
      width: '300px',
      data: { nickname: this.userNickname }, // 現在のニックネームをダイアログに渡す
    });

    // ダイアログが閉じた後の処理をサブスクライブします。
    dialogRef.afterClosed().subscribe(async (result) => {
      // 結果が存在し（キャンセルされなかった）、かつユーザー情報がある場合のみ処理を続行します。
      if (result && this.currentUser) {
        const userRef = doc(this.firestore, 'users', this.currentUser.uid);
        try {
          // Firestoreの該当ユーザードキュメントの`nickname`フィールドを更新します。
          await updateDoc(userRef, { nickname: result });
          console.log('Nickname updated successfully!');
        } catch (error) {
          console.error('Error updating nickname:', error);
        }
      }
    });
  }

  /**
   * @method logout
   * @description
   * Firebaseからサインアウトし、アプリケーションをログアウト状態にします。
   */
  async logout() {
    try {
      await signOut(this.auth);
      console.log('Logged out successfully.');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }
}
