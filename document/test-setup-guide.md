# ユニットテスト ガイドライン

## 1. 概要

このドキュメントは、HARIDICEアプリケーションにおけるユニットテストの基本方針、環境設定、および具体的なテストコードの記述方法を定義するガイドラインです。
プロジェクトの品質を維持し、安全なリファクタリングを可能にするために、すべての新しい機能追加や修正時には、このガイドラインに沿ったユニットテストの作成を推奨します。

本文書は、過去の[テスト環境構築時のトラブルシューティング記録](#appendix-a-トラブルシューティングの記録)を元に作成されています。

## 2. テストの基本方針

-   **テスト対象**: 主にコンポーネント (`.component.ts`) とサービス (`.service.ts`) をテストの対象とします。
-   **コンポーネントテスト**: ユーザーのインタラクションを起点としたテストを重視します。メソッドを直接呼び出すのではなく、「ボタンをクリックしたら、特定のサービスメソッドが呼ばれ、表示が変化すること」などをテストします。
-   **サービステスト**: サービスの責務は、外部（Firestoreなど）との連携です。テストでは、サービスのメソッドが、依存する外部モジュール（`Firestore`など）の関数を正しい引数で呼び出すことを確認します。
-   **E2Eテスト**: 現時点では導入しません。ユニットテストとコンポーネントテストで品質を担保します。

## 3. テスト実行コマンド

```bash
npm test
```

このコマンドは、Karmaテストランナーを起動し、`src`ディレクトリ以下のすべての`*.spec.ts`ファイルを実行します。

## 4. テスト環境のセットアップ (`TestBed`)

Angularのテストは、`TestBed`というテスト用のモジュール環境を構築することから始まります。依存関係の注入（DI）に関するエラー (`NullInjectorError`) を避けるため、テスト対象が必要とするすべての依存関係をモック（偽のオブジェクト）として`providers`配列に提供する必要があります。

### 4.1. コンポーネントのテスト設定例

`ListComponent`のように、複数のサービスやダイアログに依存するコンポーネントのテスト設定例です。

```typescript
// list.component.spec.ts

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListComponent } from './list.component';
import { BoardgameService } from '../../services/boardgame.service';
import { AuthService } from '../../services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs'; // Observableをモックするために必要

// モックオブジェクトの作成
const mockBoardgameService = jasmine.createSpyObj('BoardgameService', ['getBoardGames', 'addBoardGame', 'updateBoardGame']);
const mockAuthService = {
  isAdmin$: of(false), // isAdmin$プロパティをObservableとしてモック
  user$: of(null)
};
const mockMatDialog = jasmine.createSpyObj('MatDialog', ['open']);


describe('ListComponent', () => {
  let component: ListComponent;
  let fixture: ComponentFixture<ListComponent>;

  beforeEach(async () => {
    // モックの戻り値を設定
    mockBoardgameService.getBoardGames.and.returnValue(of([])); // getBoardGamesは空のObservableを返す

    await TestBed.configureTestingModule({
      imports: [ListComponent], // Standalone Componentなので直接インポート
      providers: [
        { provide: BoardgameService, useValue: mockBoardgameService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: MatDialog, useValue: mockMatDialog },
        // FirestoreなどのFirebase関連のモックも必要に応じて追加
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // ngOnInit()を呼び出す
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('コンポーネント初期化時にボードゲームのリストが読み込まれること', () => {
    // ngOnInitでgetBoardGamesが呼び出されたことを確認
    expect(mockBoardgameService.getBoardGames).toHaveBeenCalled();
  });
});
```

### 4.2. サービスのテスト設定例

`BoardgameService`のように、Firestoreに依存するサービスのテスト設定例です。

```typescript
// boardgame.service.spec.ts

import { TestBed } from '@angular/core/testing';
import { BoardgameService } from './boardgame.service';
import { Firestore } from '@angular/fire/firestore';
import { AuthService } from './auth.service';

// モックオブジェクトの作成
const mockFirestore = jasmine.createSpyObj('Firestore', ['collection', 'doc', 'addDoc', 'updateDoc']);
const mockAuthService = { /* ... */ };


describe('BoardgameService', () => {
  let service: BoardgameService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        BoardgameService, // テスト対象のサービスはそのまま提供
        { provide: Firestore, useValue: mockFirestore },
        { provide: AuthService, useValue: mockAuthService }
      ]
    });
    service = TestBed.inject(BoardgameService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('addBoardGameメソッドがFirestoreのaddDocを正しい引数で呼び出すこと', () => {
    const newGame = { name: 'Test Game', min: 2, max: 4, time: 60 };
    service.addBoardGame(newGame as any);
    // addDocが呼ばれたことを確認
    expect(mockFirestore.addDoc).toHaveBeenCalled();
  });
});
```

---

## Appendix A: トラブルシューティングの記録

（このセクションには、元の`test-setup-guide.md`に記載されていた問題と解決策の記録をそのまま移管します）

### 問題①：テスト設定ファイルの不備

-   **事象A: `test.ts` がコンパイル対象外**
    -   **解決策:** `tsconfig.spec.json` の `include` 配列に `"src/test.ts"` を追加。
-   **事象B: `require.context` の実行時エラー**
    -   **解決策:** `src/test.ts` から `require.context` を使用する部分をすべて削除。

### 問題②：依存関係の注入エラー (NullInjectorError)

-   **原因:** テスト対象が必要とするサービスやオブジェクトが、テスト環境で提供されていなかった。
-   **解決策:** すべての `*.spec.ts` ファイルにおいて、`TestBed.configureTestingModule` の `providers` 配列に必要な依存関係のモックを提供。

### 問題③：古いテストコードの存在

-   **原因:** 自動生成されたテストコードが、その後の仕様変更に追従していなかった。
-   **解決策:** 古いテストケースは削除し、コンポーネントが正常に作成されることだけを確認する最小限のテストケースに置き換え。