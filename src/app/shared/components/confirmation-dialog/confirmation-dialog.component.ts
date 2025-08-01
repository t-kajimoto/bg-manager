import { Component, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

export interface ConfirmationDialogData {
  message: string;
  title?: string;
  confirmText?: string;
  cancelText?: string;
}

@Component({
  selector: 'app-confirmation-dialog',
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.scss'],
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule]
})
export class ConfirmationDialogComponent {

  dialogRef = inject(MatDialogRef<ConfirmationDialogComponent>);
  data = inject<ConfirmationDialogData>(MAT_DIALOG_DATA);

  onNoClick(): void {
    this.dialogRef.close(false);
  }
}
