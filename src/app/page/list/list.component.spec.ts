import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListComponent } from './list.component';
import { BoardgameService } from '../../services/boardgame.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { of } from 'rxjs';
import { IBoardGame } from '../../data/boardgame.model';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';

// BoardgameServiceのモック
const mockBoardgameService = jasmine.createSpyObj('BoardgameService', [
  'getBoardGames',
  'addBoardGame',
  'updateUserBoardGame',
]);
mockBoardgameService.getBoardGames.and.returnValue(of([])); // デフォルトは空配列
mockBoardgameService.addBoardGame.and.returnValue(Promise.resolve());
mockBoardgameService.updateUserBoardGame.and.returnValue(Promise.resolve());

// MatDialogのモック
const mockMatDialog = jasmine.createSpyObj('MatDialog', ['open']);

// Authのモック
const mockAuth = jasmine.createSpyObj('Auth', ['onAuthStateChanged', 'signInAnonymously']);
mockAuth.onAuthStateChanged.and.returnValue(() => {});
mockAuth.signInAnonymously.and.returnValue(Promise.resolve({ user: { uid: 'anonUser' } }));

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

describe('ListComponent', () => {
  let component: ListComponent;
  let fixture: ComponentFixture<ListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListComponent, NoopAnimationsModule], // NoopAnimationsModuleを追加
      providers: [
        { provide: BoardgameService, useValue: mockBoardgameService },
        { provide: MatDialog, useValue: mockMatDialog },
        { provide: Auth, useValue: mockAuth }, // Authのモックを追加
        { provide: Firestore, useValue: mockFirestore }, // Firestoreのモックを追加
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // ngOnInitをトリガー
  });

  /**
   * コンポーネントが正常に作成されることを確認するテストケース。
   */
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  /**
   * loadBoardGamesメソッドがBoardgameServiceからデータをロードし、dataSourceを更新することを確認するテストケース。
   */
  it('should load board games and update dataSource', () => {
    const mockGames: IBoardGame[] = [
      { id: '1', name: 'Game A', min: 2, max: 4, time: 60, played: false, evaluation: 0 },
    ];
    mockBoardgameService.getBoardGames.and.returnValue(of(mockGames));

    component.loadBoardGames();
    expect(component.dataSource.data).toEqual(mockGames);
    expect(mockBoardgameService.getBoardGames).toHaveBeenCalled();
  });

  /**
   * applyFilterメソッドがdataSourceにフィルタリングを正しく適用することを確認するテストケース。
   */
  it('should apply filter to dataSource', () => {
    const mockGames: IBoardGame[] = [
      { id: '1', name: 'Game A', min: 2, max: 4, time: 60, played: false, evaluation: 0 },
      { id: '2', name: 'Game B', min: 1, max: 3, time: 30, played: false, evaluation: 0 },
    ];
    component.dataSource.data = mockGames;

    const event = { target: { value: 'game a' } } as unknown as Event;
    component.applyFilter(event);

    expect(component.dataSource.filter).toEqual('game a');
    expect(component.dataSource.filteredData.length).toBe(1);
    expect(component.dataSource.filteredData[0].name).toEqual('Game A');
  });

  /**
   * ngAfterViewInitでMatSortがdataSourceに設定されることを確認するテストケース。
   */
  it('should set MatSort to dataSource after view init', () => {
    const mockSort = new MatSort();
    component.sort = mockSort;
    component.ngAfterViewInit();
    expect(component.dataSource.sort).toBe(mockSort);
  });

  /**
   * openAddBoardGameDialogメソッドがダイアログを開き、結果に基づいてボードゲームを追加することを確認するテストケース。
   */
  it('should open add board game dialog and add game on close with data', async () => {
    const dialogResult = { name: 'New Game', min: 2, max: 4, time: 90 };
    mockMatDialog.open.and.returnValue({
      afterClosed: () => of(dialogResult),
    } as MatDialogRef<any>);

    spyOn(component, 'loadBoardGames'); // loadBoardGamesが呼ばれることを確認するためスパイ

    component.openAddBoardGameDialog();

    expect(mockMatDialog.open).toHaveBeenCalled();
    expect(mockBoardgameService.addBoardGame).toHaveBeenCalledWith(dialogResult);
    await fixture.whenStable(); // Promiseが解決するのを待つ
    expect(component.loadBoardGames).toHaveBeenCalled();
  });

  /**
   * openAddBoardGameDialogメソッドがダイアログを開き、結果がない場合はボードゲームを追加しないことを確認するテストケース。
   */
  it('should open add board game dialog and not add game on close without data', () => {
    mockMatDialog.open.and.returnValue({
      afterClosed: () => of(undefined),
    } as MatDialogRef<any>);

    spyOn(component, 'loadBoardGames');

    component.openAddBoardGameDialog();

    expect(mockMatDialog.open).toHaveBeenCalled();
    expect(mockBoardgameService.addBoardGame).not.toHaveBeenCalled();
    expect(component.loadBoardGames).not.toHaveBeenCalled();
  });

  /**
   * openEditUserDataDialogメソッドがダイアログを開き、結果に基づいてユーザーデータを更新することを確認するテストケース。
   */
  it('should open edit user data dialog and update user data on close with data', async () => {
    const mockGame: IBoardGame = { id: '1', name: 'Game A', min: 2, max: 4, time: 60, played: false, evaluation: 0 };
    const dialogResult = { played: true, evaluation: 5 };
    mockMatDialog.open.and.returnValue({
      afterClosed: () => of(dialogResult),
    } as MatDialogRef<any>);

    spyOn(component, 'loadBoardGames');

    component.openEditUserDataDialog(mockGame);

    expect(mockMatDialog.open).toHaveBeenCalled();
    expect(mockBoardgameService.updateUserBoardGame).toHaveBeenCalledWith(mockGame.id, dialogResult);
    await fixture.whenStable();
    expect(component.loadBoardGames).toHaveBeenCalled();
  });

  /**
   * openEditUserDataDialogメソッドがダイアログを開き、結果がない場合はユーザーデータを更新しないことを確認するテストケース。
   */
  it('should open edit user data dialog and not update user data on close without data', () => {
    const mockGame: IBoardGame = { id: '1', name: 'Game A', min: 2, max: 4, time: 60, played: false, evaluation: 0 };
    mockMatDialog.open.and.returnValue({
      afterClosed: () => of(undefined),
    } as MatDialogRef<any>);

    spyOn(component, 'loadBoardGames');

    component.openEditUserDataDialog(mockGame);

    expect(mockMatDialog.open).toHaveBeenCalled();
    expect(mockBoardgameService.updateUserBoardGame).not.toHaveBeenCalled();
    expect(component.loadBoardGames).not.toHaveBeenCalled();
  });
});
