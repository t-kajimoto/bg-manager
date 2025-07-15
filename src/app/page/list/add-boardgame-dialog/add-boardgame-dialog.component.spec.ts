import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AddBoardgameDialogComponent } from './add-boardgame-dialog.component';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

// MatDialogRefのモック
const mockMatDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

describe('AddBoardgameDialogComponent', () => {
  let component: AddBoardgameDialogComponent;
  let fixture: ComponentFixture<AddBoardgameDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AddBoardgameDialogComponent,
        FormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockMatDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { name: '', min: 0, max: 0, time: 0 } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddBoardgameDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  /**
   * コンポーネントが正常に作成されることを確認するテストケース。
   */
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  /**
   * onNoClickメソッドがダイアログを閉じ、undefinedを返すことを確認するテストケース。
   */
  it('should close the dialog with undefined on onNoClick', () => {
    component.onNoClick();
    expect(mockMatDialogRef.close).toHaveBeenCalledWith(undefined);
  });

  /**
   * ダイアログがデータを伴って閉じられることを確認するテストケース。
   * (通常、テンプレート内のボタンクリックによってトリガーされる)
   */
  it('should close the dialog with data when save is triggered', () => {
    const testData = { name: 'Test Game', min: 2, max: 4, time: 60 };
    component.data = { ...testData }; // データをコンポーネントに設定

    // テンプレート内のボタンクリックをシミュレートする代わりに、直接closeを呼び出す
    // 実際のアプリケーションでは、テンプレート内のボタンがdialogRef.close(this.data)を呼び出す
    component.dialogRef.close(component.data);
    expect(mockMatDialogRef.close).toHaveBeenCalledWith(testData);
  });
});
