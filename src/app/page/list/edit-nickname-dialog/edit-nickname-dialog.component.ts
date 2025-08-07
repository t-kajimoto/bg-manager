import { Component, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';


/**
 * @interface DialogData
 * @description
 * ニックネーム編集ダイアログに渡すためのデータ型定義です。
 */
export interface DialogData {
  nickname: string;
}

/**
 * @class EditNicknameDialogComponent
 * @description
 * ユーザーが自身のニックネームを変更するためのUIを提供する、シンプルなダイアログコンポーネントです。
 */
@Component({
  selector: 'app-edit-nickname-dialog',
  templateUrl: './edit-nickname-dialog.component.html',
  styleUrls: ['./edit-nickname-dialog.component.scss'],
  standalone: true,
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatButtonModule
],
})
export class EditNicknameDialogComponent {
  /**
   * @property data
   * @description
   * `inject`関数を使って、ダイアログの呼び出し元(`AppComponent`)から渡されたデータを取得します。
   * このデータは、テンプレートの`[(ngModel)]`と双方向バインディングされ、ユーザーの入力を保持します。
   */
  public data: DialogData = inject(MAT_DIALOG_DATA);
  /**
   * @property dialogRef
   * @description
   * `inject`関数を使って、このダイアログ自身への参照を取得します。
   * ダイアログを閉じる際に使用します。
   */
  public dialogRef = inject(MatDialogRef<EditNicknameDialogComponent>);

  /**
   * @constructor
   * @description
   * DI（依存性注入）はクラスプロパティの初期化で`inject`関数を使って行っているため、コンストラクタ内での処理は不要です。
   */
  constructor() {}

  /**
   * @method onNoClick
   * @description
   * 「キャンセル」ボタンがクリックされたときに呼び出され、何も変更を返さずにダイアログを閉じます。
   */
  onNoClick(): void {
    this.dialogRef.close();
  }

}
