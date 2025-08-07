import { Component, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';


/**
 * @interface ConfirmationDialogData
 * @description
 * 確認ダイアログに表示するテキスト（タイトル、メッセージ、ボタンラベル）を定義します。
 * これにより、様々な確認シナリオでこの汎用ダイアログを再利用できます。
 */
export interface ConfirmationDialogData {
  message: string;
  title?: string;
  confirmText?: string;
  cancelText?: string;
}

/**
 * @class ConfirmationDialogComponent
 * @description
 * 「はい」「いいえ」でユーザーの意思を確認するための、汎用的な確認ダイアログコンポーネントです。
 * 削除操作など、破壊的なアクションの前に使用することを想定しています。
 */
@Component({
  selector: 'app-confirmation-dialog',
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.scss'],
  standalone: true,
  imports: [MatDialogModule, MatButtonModule]
})
export class ConfirmationDialogComponent {

  /** このダイアログ自身への参照。ダイアログを閉じる際に使用します。 */
  dialogRef = inject(MatDialogRef<ConfirmationDialogComponent>);
  /**
   * @property data
   * @description
   * ダイアログの呼び出し元から渡されたデータを取得します。
   * メッセージやタイトルなど、テンプレートに表示する内容が含まれます。
   */
  data = inject<ConfirmationDialogData>(MAT_DIALOG_DATA);

  /**
   * @method onNoClick
   * @description
   * 「いいえ」（キャンセル）ボタンがクリックされたときに呼び出されます。
   * `false`を結果として返し、ダイアログを閉じます。
   */
  onNoClick(): void {
    this.dialogRef.close(false);
  }
}