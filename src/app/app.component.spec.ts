import { TestBed, ComponentFixture } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import { AuthService } from './services/auth.service';
import { of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore'; // Firestoreをインポート

// AuthServiceのモック
const mockAuthService = {
  user$: of(null),
  isLoggedIn$: of(false),
  userNickname$: of(null),
  userPhotoUrl$: of(null),
  loginWithGoogle: jasmine.createSpy('loginWithGoogle').and.returnValue(Promise.resolve()),
  logout: jasmine.createSpy('logout').and.returnValue(Promise.resolve()),
  getNickname: jasmine.createSpy('getNickname').and.returnValue(Promise.resolve(null)),
};

// MatDialogのモック
const mockMatDialog = {
  open: jasmine.createSpy('open'),
};

// AuthとFirestoreのモック
const mockAuth = jasmine.createSpyObj('Auth', ['onAuthStateChanged']);
const mockFirestore = jasmine.createSpyObj('Firestore', ['doc', 'setDoc']);

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: MatDialog, useValue: mockMatDialog },
        { provide: Auth, useValue: mockAuth },
        { provide: Firestore, useValue: mockFirestore } // Firestoreのモックを提供
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });
});