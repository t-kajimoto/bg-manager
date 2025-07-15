import { Component, inject } from '@angular/core'; // inject をインポート
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

export interface DialogData {
  nickname: string;
}

@Component({
  selector: 'app-edit-nickname-dialog',
  templateUrl: './edit-nickname-dialog.component.html',
  styleUrls: ['./edit-nickname-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatButtonModule
  ],
})
export class EditNicknameDialogComponent {
  // inject関数を使ってダイアログのデータを取得
  public data: DialogData = inject(MAT_DIALOG_DATA);
  public dialogRef = inject(MatDialogRef<EditNicknameDialogComponent>);

  // コンストラクタは空にするか、他のロジックに使う
  constructor() {}

  onNoClick(): void {
    this.dialogRef.close();
  }

}