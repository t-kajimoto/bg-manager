import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { Observable, startWith, map } from 'rxjs';

export interface GachaDialogData {
  players: number | null;
  playStatus: 'played' | 'unplayed' | 'any';
  tags: string[];
  timeRange: { min: number; max: number; };
  ratingRange: { min: number; max: number; };
  allTags?: string[]; // ListComponentから渡される全タグリスト
}

@Component({
  selector: 'app-bodoge-gacha-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    MatChipsModule,
    MatIconModule,
    MatSliderModule,
    MatAutocompleteModule,
    DecimalPipe
  ],
  templateUrl: './bodoge-gacha-dialog.component.html',
  styleUrls: ['./bodoge-gacha-dialog.component.scss']
})
export class BodogeGachaDialogComponent {

  data: GachaDialogData;
  tagCtrl = new FormControl('');
  filteredTags: Observable<string[]>;
  allTags: string[] = [];

  @ViewChild('tagInput') tagInput!: ElementRef<HTMLInputElement>;

  constructor(
    public dialogRef: MatDialogRef<BodogeGachaDialogComponent>,
  ) {
    const initialData: Partial<GachaDialogData> = inject(MAT_DIALOG_DATA, { optional: true }) || {};
    this.allTags = initialData.allTags || [];
    this.data = {
      players: null,
      playStatus: 'any',
      tags: [],
      timeRange: { min: 0, max: 180 },
      ratingRange: { min: 0, max: 5 },
      ...initialData
    };

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
    if (value && !this.data.tags.includes(value)) {
      this.data.tags.push(value);
    }
    event.chipInput!.clear();
    this.tagCtrl.setValue(null);
  }

  removeTag(tag: string): void {
    const index = this.data.tags.indexOf(tag);
    if (index >= 0) {
      this.data.tags.splice(index, 1);
    }
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    const value = event.option.viewValue;
    if (!this.data.tags.includes(value)) {
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
