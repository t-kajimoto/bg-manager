import { Component, ElementRef, ViewChild, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IBoardGame } from '../../../data/boardgame.model';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { BoardgameService } from '../../../services/boardgame.service';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { Observable, startWith, map } from 'rxjs';

export interface EditUserDataDialogData extends IBoardGame {
  isAdmin: boolean;
  allTags?: string[];
}

@Component({
  selector: 'app-edit-user-data-dialog',
  templateUrl: './edit-user-data-dialog.component.html',
  styleUrls: ['./edit-user-data-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule, MatFormFieldModule, MatInputModule, FormsModule, ReactiveFormsModule, MatButtonModule,
    MatDialogModule, MatCheckboxModule, MatIconModule, MatTableModule, MatChipsModule, MatDividerModule, MatExpansionModule,
    MatAutocompleteModule
  ]
})
export class EditUserDataDialogComponent implements OnInit {
  maxStars: number = 5;
  maxStarsArray: number[] = Array(this.maxStars).fill(0);
  data: IBoardGame;
  public initialData: EditUserDataDialogData = inject(MAT_DIALOG_DATA);
  allEvaluationsDataSource = new MatTableDataSource<any>();
  displayedEvaluationColumns: string[] = ['photo', 'name', 'evaluation', 'comment'];

  tagCtrl = new FormControl('');
  filteredTags: Observable<string[]>;
  allTags: string[] = [];

  @ViewChild('tagInput') tagInput!: ElementRef<HTMLInputElement>;

  constructor(
    public dialogRef: MatDialogRef<EditUserDataDialogComponent>,
    private boardgameService: BoardgameService
  ) {
    this.data = { ...this.initialData };
    this.allTags = this.initialData.allTags || [];

    this.filteredTags = this.tagCtrl.valueChanges.pipe(
      startWith(null),
      map((tag: string | null) => (tag ? this._filter(tag) : this.allTags.slice())),
    );
  }

  ngOnInit(): void {
    this.loadAllEvaluations();
  }

  async loadAllEvaluations(): Promise<void> {
    const boardGameId = this.initialData.id;
    if (!boardGameId) {
      console.warn('boardGameId is not provided.');
      return;
    }
    const evaluations = await this.boardgameService.getAllEvaluationsForGame(boardGameId);
    this.allEvaluationsDataSource.data = evaluations;
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  setRating(rating: number): void {
    this.data.evaluation = rating;
  }

  addTag(event: MatChipInputEvent): void {
    if (!this.initialData.isAdmin) return;
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
    if (!this.initialData.isAdmin) return;
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

  public getStarIcon(rating: number, index: number): string {
    if (rating >= index + 1) {
      return 'star';
    }
    if (rating >= index + 0.5) {
      return 'star_half';
    }
    return 'star_border';
  }
}