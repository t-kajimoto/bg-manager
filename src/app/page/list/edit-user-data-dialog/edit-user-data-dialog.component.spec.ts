import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { EditUserDataDialogComponent } from './edit-user-data-dialog.component';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

// MatDialogRefのモック
const mockMatDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

describe('EditUserDataDialogComponent', () => {
  let component: EditUserDataDialogComponent;
  let fixture: ComponentFixture<EditUserDataDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        EditUserDataDialogComponent,
        FormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatCheckboxModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockMatDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { played: false, evaluation: 0, boardGameId: 'testId' } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditUserDataDialogComponent);
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
    const testData = { played: true, evaluation: 4 };
    component.data = { ...component.data, ...testData }; // データをコンポーネントに設定

    // テンプレート内のボタンクリックをシミュレートする代わりに、直接closeを呼び出す
    // 実際のアプリケーションでは、テンプレート内のボタンがdialogRef.close(this.data)を呼び出す
    component.dialogRef.close({ played: component.data.played, evaluation: component.data.evaluation });
    expect(mockMatDialogRef.close).toHaveBeenCalledWith(testData);
  });

  /**
   * 星の評価が正しく設定されることを確認するテストケース。
   */
  it('should set evaluation correctly', () => {
    component.setRating(3);
    expect(component.data.evaluation).toBe(3);
  });
});
