import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IBoardGameData } from '../../../data/boardgame.model';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { Observable, startWith, map } from 'rxjs';

export interface AddBoardgameDialogData extends IBoardGameData {
  allTags?: string[];
}

@Component({
  selector: 'app-add-boardgame-dialog',
  templateUrl: './add-boardgame-dialog.component.html',
  styleUrls: ['./add-boardgame-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    MatFormFieldModule, 
    MatInputModule, 
    FormsModule, 
    ReactiveFormsModule,
    MatButtonModule, 
    MatDialogModule, 
    MatChipsModule, 
    MatIconModule,
    MatAutocompleteModule
  ]
})
export class AddBoardgameDialogComponent {
  data: Partial<AddBoardgameDialogData>;
  tagCtrl = new FormControl('');
  filteredTags: Observable<string[]>;
  allTags: string[] = [];

  @ViewChild('tagInput') tagInput!: ElementRef<HTMLInputElement>;

  constructor(
    public dialogRef: MatDialogRef<AddBoardgameDialogComponent>
  ) {
    const initialData: Partial<AddBoardgameDialogData> = inject(MAT_DIALOG_DATA);
    this.allTags = initialData.allTags || [];
    this.data = { ...initialData, tags: [] };

    this.filteredTags = this.tagCtrl.valueChanges.pipe(
      startWith(null),
      map((tag: string | null) => (tag ? this._filter(tag) : this.allTags.slice())),
    );
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  addTag(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value && !this.data.tags?.includes(value)) {
      if (!this.data.tags) {
        this.data.tags = [];
      }
      this.data.tags.push(value);
    }
    event.chipInput!.clear();
    this.tagCtrl.setValue(null);
  }

  removeTag(tag: string): void {
    if (this.data.tags) {
      const index = this.data.tags.indexOf(tag);
      if (index >= 0) {
        this.data.tags.splice(index, 1);
      }
    }
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    const value = event.option.viewValue;
    if (!this.data.tags?.includes(value)) {
        if (!this.data.tags) {
            this.data.tags = [];
        }
        this.data.tags.push(value);
    }
    this.tagInput.nativeElement.value = '';
    this.tagCtrl.setValue(null);
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.allTags.filter(tag => tag.toLowerCase().includes(filterValue));
  }
}