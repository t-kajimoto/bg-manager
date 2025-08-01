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

/**
 * @interface GachaDialogData
 * @description
 * 「ボドゲガチャ」ダイアログのデータモデルです。
 * ユーザーが設定する絞り込み条件と、ListComponentから渡される全タグリストを定義します。
 */
export interface GachaDialogData {
  players: number | null;
  playStatus: 'played' | 'unplayed' | 'any';
  tags: string[];
  timeRange: { min: number; max: number; };
  ratingRange: { min: number; max: number; };
  allTags?: string[]; // ListComponentから渡される全タグリスト
}

/**
 * @class BodogeGachaDialogComponent
 * @description
 * ユーザーが指定した条件に合うボードゲームをランダムに1つ提案する「ボドゲガチャ」機能のUIを提供するダイアログです。
 */
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

  /** テンプレートのフォームと双方向バインディングされる、ガチャの条件データ。 */
  data: GachaDialogData;
  /** タグ入力用のリアクティブフォームコントロール。 */
  tagCtrl = new FormControl('');
  /** 入力に応じてフィルタリングされたタグの候補リストを保持するObservable。 */
  filteredTags: Observable<string[]>;
  /** 既存のすべてのタグのリスト。オートコンプリートの候補として使用します。 */
  allTags: string[] = [];

  /** タグ入力フォームのElementRef。 */
  @ViewChild('tagInput') tagInput!: ElementRef<HTMLInputElement>;

  /**
   * @constructor
   * @param dialogRef - このダイアログ自身への参照。ダイアログを閉じる際に使用します。
   */
  constructor(
    public dialogRef: MatDialogRef<BodogeGachaDialogComponent>,
  ) {
    // `inject`関数を使って、ダイアログの初期化データを取得します。
    const initialData: Partial<GachaDialogData> = inject(MAT_DIALOG_DATA, { optional: true }) || {};
    this.allTags = initialData.allTags || [];
    // ガチャ条件の各プロパティに初期値を設定し、フォームを初期化します。
    this.data = {
      players: null,
      playStatus: 'any',
      tags: [],
      timeRange: { min: 0, max: 180 },
      ratingRange: { min: 0, max: 5 },
      ...initialData
    };

    // タグ入力フォームの値の変更を監視し、オートコンプリートの候補をフィルタリングします。
    this.filteredTags = this.tagCtrl.valueChanges.pipe(
      startWith(null),
      map((tag: string | null) => (tag ? this._filter(tag) : this.allTags.slice())),
    );
  }

  /**
   * @method onNoClick
   * @description
   * 「キャンセル」ボタンがクリックされたときに呼び出され、何も返さずにダイアログを閉じます。
   */
  onNoClick(): void {
    this.dialogRef.close();
  }

  /**
   * @method addTag
   * @param event - タグ入力イベント。
   * @description
   * タグ入力フォームで新しいタグが入力されたときに追加処理を行います。
   */
  addTag(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value && !this.data.tags.includes(value)) {
      this.data.tags.push(value);
    }
    event.chipInput!.clear();
    this.tagCtrl.setValue(null);
  }

  /**
   * @method removeTag
   * @param tag - 削除するタグの文字列。
   * @description
   * タグの削除ボタンがクリックされたときに、タグをデータから削除します。
   */
  removeTag(tag: string): void {
    const index = this.data.tags.indexOf(tag);
    if (index >= 0) {
      this.data.tags.splice(index, 1);
    }
  }

  /**
   * @method selected
   * @param event - オートコンプリート選択イベント。
   * @description
   * オートコンプリートの候補が選択されたときに、そのタグを追加します。
   */
  selected(event: MatAutocompleteSelectedEvent): void {
    const value = event.option.viewValue;
    if (!this.data.tags.includes(value)) {
        this.data.tags.push(value);
    }
    this.tagInput.nativeElement.value = '';
    this.tagCtrl.setValue(null);
  }

  /**
   * @method _filter
   * @private
   * @param value - フィルタリングする文字列。
   * @returns フィルタリングされたタグの候補リスト。
   * @description
   * タグ入力のオートコンプリート機能のためのプライベートなヘルパーメソッドです。
   */
  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.allTags.filter(tag => tag.toLowerCase().includes(filterValue));
  }
}