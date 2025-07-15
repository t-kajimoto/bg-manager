import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Auth, GoogleAuthProvider, signInWithPopup, UserCredential, signOut, User } from '@angular/fire/auth';
import { CommonModule } from '@angular/common';
import { Firestore, doc, setDoc, onSnapshot, updateDoc, getDoc } from '@angular/fire/firestore';
import { MatDialog } from '@angular/material/dialog';
import { EditNicknameDialogComponent } from './page/list/edit-nickname-dialog/edit-nickname-dialog.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    CommonModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {

  isLoggedIn: boolean = false;
  userNickname: string | null = null; // displayNameからnicknameに変更
  userPhotoUrl: string | null = null;
  private currentUser: User | null = null;

  constructor(
    private router: Router, 
    private auth: Auth, 
    private firestore: Firestore,
    public dialog: MatDialog // MatDialogを注入
  ) {}

  ngOnInit() {
    this.auth.onAuthStateChanged(user => {
      if (user) {
        this.isLoggedIn = true;
        this.currentUser = user;
        this.userPhotoUrl = user.photoURL;
        
        // Firestoreからユーザードキュメントを監視してニックネームを取得
        const userRef = doc(this.firestore, 'users', user.uid);
        onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            this.userNickname = userData['nickname'] || user.displayName; // nicknameがなければdisplayName
          } else {
            this.userNickname = user.displayName; // ドキュメントがまだなければdisplayName
          }
        });
        console.log('User is logged in:', user.displayName);
      } else {
        this.isLoggedIn = false;
        this.currentUser = null;
        this.userNickname = null;
        this.userPhotoUrl = null;
        console.log('User is logged out.');
      }
    });
  }

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
          // ドキュメントが存在しない場合（初回ログイン）、新規作成
          await setDoc(userRef, {
            displayName: user.displayName,
            nickname: user.displayName, // displayNameをnicknameの初期値として設定
            photoURL: user.photoURL,
            email: user.email
          });
          console.log('New user profile created in Firestore.');
        } else {
          // ドキュメントが存在する場合（再ログイン）、Googleアカウント由来の情報を更新
          await updateDoc(userRef, {
            displayName: user.displayName,
            photoURL: user.photoURL
          });
          console.log('Existing user profile updated.');
        }
      }
    } catch (error: any) {
      console.error('Google login failed:', error);
      const errorCode = error.code;
      if (errorCode === 'auth/popup-closed-by-user') {
        console.log('Login popup closed by user.');
      }
    }
  }

  openEditNicknameDialog(): void {
    if (!this.currentUser) return;

    const dialogRef = this.dialog.open(EditNicknameDialogComponent, {
      width: '300px',
      data: { nickname: this.userNickname },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result && this.currentUser) {
        const userRef = doc(this.firestore, 'users', this.currentUser.uid);
        try {
          await updateDoc(userRef, { nickname: result });
          console.log('Nickname updated successfully!');
        } catch (error) {
          console.error('Error updating nickname:', error);
        }
      }
    });
  }

  async logout() {
    try {
      await signOut(this.auth);
      console.log('Logged out successfully.');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }
}