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

/**
 * @interface AddBoardgameDialogData
 * @description
 * 「新しいボードゲームを追加」ダイアログに渡すためのデータ型定義です。
 * `IBoardGameData`を拡張し、タグのオートコンプリート候補を渡せるようにしています。
 */
export interface AddBoardgameDialogData extends IBoardGameData {
  allTags?: string[];
}

/**
 * @class AddBoardgameDialogComponent
 * @description
 * （管理者向け）新しいボードゲームをデータベースに登録するためのUIを提供するダイアログコンポーネントです。
 */
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
  /** テンプレートのフォームと双方向バインディングされる、編集中のボードゲームデータ。 */
  data: Partial<AddBoardgameDialogData>;
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
    public dialogRef: MatDialogRef<AddBoardgameDialogComponent>
  ) {
    // `inject`関数を使って、ダイアログの初期化データを取得します。
    const initialData: Partial<AddBoardgameDialogData> = inject(MAT_DIALOG_DATA);
    this.allTags = initialData.allTags || [];
    // 注入された初期データを、編集用の`data`プロパティにコピーします。
    // タグは空の配列で初期化します。
    this.data = { ...initialData, tags: [] };

    // タグ入力フォームの値の変更を監視し、オートコンプリートの候補をフィルタリングします。
    this.filteredTags = this.tagCtrl.valueChanges.pipe(
      startWith(null), // 初期状態でも一度流す
      map((tag: string | null) => (tag ? this._filter(tag) : this.allTags.slice())),
    );
  }

  /**
   * @method onNoClick
   * @description
   * 「キャンセル」ボタンがクリックされたときに呼び出され、何も変更を返さずにダイアログを閉じます。
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
    // 値が存在し、かつまだ追加されていないタグの場合のみ追加します。
    if (value && !this.data.tags?.includes(value)) {
      if (!this.data.tags) {
        this.data.tags = [];
      }
      this.data.tags.push(value);
    }
    event.chipInput!.clear(); // 入力フィールドをクリア
    this.tagCtrl.setValue(null); // オートコンプリートのトリガーをリセット
  }

  /**
   * @method removeTag
   * @param tag - 削除するタグの文字列。
   * @description
   * タグの削除ボタンがクリックされたときに、タグをデータから削除します。
   */
  removeTag(tag: string): void {
    if (this.data.tags) {
      const index = this.data.tags.indexOf(tag);
      if (index >= 0) {
        this.data.tags.splice(index, 1);
      }
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
    if (!this.data.tags?.includes(value)) {
        if (!this.data.tags) {
            this.data.tags = [];
        }
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
