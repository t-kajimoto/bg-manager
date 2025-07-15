import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Auth, GoogleAuthProvider, signInWithPopup, signOut } from '@angular/fire/auth';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { AppComponent } from './app.component';
import { of } from 'rxjs';

// Firebase Authのモック
const mockAuth = jasmine.createSpyObj('Auth', ['onAuthStateChanged', 'signInWithPopup', 'signOut']);
// onAuthStateChangedのコールバックを保持するための変数
let authStateChangedCallback: ((user: any) => void) | null = null;
mockAuth.onAuthStateChanged.and.callFake((callback: any) => {
  authStateChangedCallback = callback;
  return () => {}; // unsubscribe関数を返す
});
mockAuth.signInWithPopup.and.returnValue(Promise.resolve({ user: { uid: 'testUser', displayName: 'Test User', photoURL: 'test.jpg', email: 'test@example.com' } }));
mockAuth.signOut.and.returnValue(Promise.resolve());

// Firebase Firestoreのモック
const mockFirestore = jasmine.createSpyObj('Firestore', ['doc', 'setDoc']);
mockFirestore.doc.and.returnValue({}); // docはDocumentReferenceを返す
mockFirestore.setDoc.and.returnValue(Promise.resolve());

// Routerのモック
const mockRouter = jasmine.createSpyObj('Router', ['navigate']);

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        { provide: Auth, useValue: mockAuth },
        { provide: Firestore, useValue: mockFirestore },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // ngOnInitをトリガー
  });

  /**
   * コンポーネントが正常に作成されることを確認するテストケース。
   */
  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  /**
   * アプリケーションのタイトルが正しく設定されていることを確認するテストケース。
   */
  it(`should have the correct title`, () => {
    expect(component.title).toEqual('かえでのボードゲーム');
  });

  /**
   * ユーザーがログインしたときに認証状態が正しく更新されることを確認するテストケース。
   */
  it('should update auth state when user logs in', () => {
    const mockUser = { uid: '123', displayName: 'Test User', photoURL: 'photo.jpg' };
    if (authStateChangedCallback) {
      authStateChangedCallback(mockUser);
    }
    fixture.detectChanges();
    expect(component.isLoggedIn).toBeTrue();
    expect(component.userDisplayName).toEqual('Test User');
    expect(component.userPhotoUrl).toEqual('photo.jpg');
  });

  /**
   * ユーザーがログアウトしたときに認証状態が正しく更新されることを確認するテストケース。
   */
  it('should update auth state when user logs out', () => {
    // まずログイン状態にする
    const mockUser = { uid: '123', displayName: 'Test User', photoURL: 'photo.jpg' };
    if (authStateChangedCallback) {
      authStateChangedCallback(mockUser);
    }
    fixture.detectChanges();
    expect(component.isLoggedIn).toBeTrue();

    // ログアウト状態にする
    if (authStateChangedCallback) {
      authStateChangedCallback(null);
    }
    fixture.detectChanges();
    expect(component.isLoggedIn).toBeFalse();
    expect(component.userDisplayName).toBeNull();
    expect(component.userPhotoUrl).toBeNull();
  });

  /**
   * navigateToPageメソッドがRouter.navigateを正しく呼び出すことを確認するテストケース。
   */
  it('should navigate to the specified page', () => {
    component.navigateToPage('/test-route');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/test-route']);
  });

  /**
   * Googleログインが成功し、ユーザー情報がFirestoreに保存されることを確認するテストケース。
   */
  it('should log in with Google and save user profile to Firestore on success', async () => {
    const mockUser = { uid: 'user123', displayName: 'Test User', photoURL: 'test.jpg', email: 'test@example.com' };
    // mockAuth.signInWithPopup.and.returnValue(Promise.resolve({ user: mockUser })); // beforeEachで設定済み

    await component.loginWithGoogle();

    expect(mockAuth.signInWithPopup).toHaveBeenCalled();
    expect(mockFirestore.doc).toHaveBeenCalledWith(mockFirestore, 'users', mockUser.uid);
    expect(mockFirestore.setDoc).toHaveBeenCalledWith(jasmine.any(Object), {
      displayName: mockUser.displayName,
      photoURL: mockUser.photoURL,
      email: mockUser.email
    }, { merge: true });
    expect(component.isLoggedIn).toBeTrue(); // onAuthStateChangedが呼ばれることを期待
    expect(component.userDisplayName).toEqual(mockUser.displayName);
  });

  /**
   * Googleログインが失敗した場合にエラーが適切に処理されることを確認するテストケース。
   */
  it('should handle Google login failure', async () => {
    const mockError = { code: 'auth/popup-closed-by-user', message: 'Popup closed' };
    mockAuth.signInWithPopup.and.returnValue(Promise.reject(mockError));
    spyOn(console, 'error'); // console.errorをスパイ
    spyOn(console, 'log'); // console.logをスパイ

    await component.loginWithGoogle();

    expect(mockAuth.signInWithPopup).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith('Google login failed:', mockError);
    expect(console.log).toHaveBeenCalledWith('Login popup closed by user.');
    expect(component.isLoggedIn).toBeFalse();
  });

  /**
   * ログアウトが成功することを確認するテストケース。
   */
  it('should log out successfully', async () => {
    // mockAuth.signOut.and.returnValue(Promise.resolve()); // beforeEachで設定済み
    spyOn(console, 'log'); // console.logをスパイ

    await component.logout();

    expect(mockAuth.signOut).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith('Logged out successfully.');
    // onAuthStateChangedがnullユーザーで呼ばれることを期待し、isLoggedInがfalseになる
    if (authStateChangedCallback) {
      authStateChangedCallback(null);
    }
    fixture.detectChanges();
    expect(component.isLoggedIn).toBeFalse();
  });

  /**
   * ログアウトが失敗した場合にエラーが適切に処理されることを確認するテストケース。
   */
  it('should handle logout failure', async () => {
    const mockError = new Error('Logout failed');
    mockAuth.signOut.and.returnValue(Promise.reject(mockError));
    spyOn(console, 'error'); // console.errorをスパイ

    await component.logout();

    expect(mockAuth.signOut).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith('Logout failed:', mockError);
  });
});

