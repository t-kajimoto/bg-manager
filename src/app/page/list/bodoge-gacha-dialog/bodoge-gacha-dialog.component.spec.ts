import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BodogeGachaDialogComponent } from './bodoge-gacha-dialog.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('BodogeGachaDialogComponent', () => {
  let component: BodogeGachaDialogComponent;
  let fixture: ComponentFixture<BodogeGachaDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BodogeGachaDialogComponent,
        NoopAnimationsModule // アニメーションを無効化してテストを安定させる
      ],
      providers: [
        // ダイアログのテストに必要な依存関係をモックとして提供
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: { allTags: [] } } // allTagsプロパティを持つ空のオブジェクトを提供
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BodogeGachaDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  /**
   * コンポーネントが正常に作成されることを確認するテストケース。
   */
  it('should create', () => {
    // このテストは、コンポーネントのインスタンスが正常に作成されることだけを検証します。
    expect(component).toBeTruthy();
  });
});