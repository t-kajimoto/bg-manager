import { Component, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IBoardGameData } from '../../../data/boardgame.model';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-boardgame-dialog',
  templateUrl: './add-boardgame-dialog.component.html',
  styleUrls: ['./add-boardgame-dialog.component.scss'],
  standalone: true,
  imports: [CommonModule, MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule, MatDialogModule, MatChipsModule, MatIconModule]
})
export class AddBoardgameDialogComponent {
  data: Partial<IBoardGameData>;
  initialData: Partial<IBoardGameData> = inject(MAT_DIALOG_DATA);

  constructor(
    public dialogRef: MatDialogRef<AddBoardgameDialogComponent>
  ) {
    this.data = { ...this.initialData, tags: [] };
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  addTag(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      if (!this.data.tags) {
        this.data.tags = [];
      }
      this.data.tags.push(value);
    }
    event.chipInput!.clear();
  }

  removeTag(tag: string): void {
    if (this.data.tags) {
      const index = this.data.tags.indexOf(tag);
      if (index >= 0) {
        this.data.tags.splice(index, 1);
      }
    }
  }
}
