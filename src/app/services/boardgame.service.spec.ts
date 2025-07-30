import { TestBed } from '@angular/core/testing';
import { BoardgameService } from './boardgame.service';
import { Firestore } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';

// FirestoreとAuthのモック
const mockFirestore = jasmine.createSpyObj('Firestore', ['collection', 'doc', 'setDoc', 'getDocs', 'query', 'where', 'addDoc', 'collectionData']);
const mockAuth = jasmine.createSpyObj('Auth', ['onAuthStateChanged']);

describe('BoardgameService', () => {
  let service: BoardgameService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        BoardgameService,
        { provide: Firestore, useValue: mockFirestore },
        { provide: Auth, useValue: mockAuth },
      ],
    });
    service = TestBed.inject(BoardgameService);
  });

  /**
   * サービスが正常に作成されることを確認するテストケース。
   */
  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});