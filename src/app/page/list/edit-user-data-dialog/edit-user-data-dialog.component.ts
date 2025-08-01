import { Component, ElementRef, ViewChild, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { IBoardGame, EditUserDataDialogData } from '../../../data/boardgame.model';
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
import { Observable, startWith, map, firstValueFrom } from 'rxjs';

/**
 * @class EditUserDataDialogComponent
 * @description
 * ボードゲームの詳細情報を表示し、ユーザー自身の評価やプレイ状況を編集するためのダイアログです。
 * 管理者権限を持つユーザーは、このダイアログでゲームの基本情報（マスターデータ）を直接編集することもできます。
 */
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
  /** 評価の星の最大数。 */
  maxStars: number = 5;
  /** テンプレートで星のアイコンを繰り返し表示するために使用する配列。 */
  maxStarsArray: number[] = Array(this.maxStars).fill(0);
  /** テンプレートのフォームと双方向バインディングされる、編集中のボードゲームデータ。 */
  data: IBoardGame;
  /**
   * @property initialData
   * @description
   * `ListComponent`から注入される、ダイアログの初期化データです。
   * 編集前の元データ、管理者フラグ、全タグリストなどが含まれます。
   */
  public initialData: EditUserDataDialogData = inject(MAT_DIALOG_DATA);
  /** 「みんなの評価」セクションのテーブルに表示するデータソース。 */
  allEvaluationsDataSource = new MatTableDataSource<any>();
  /** 「みんなの評価」テーブルで表示するカラム名の配列。 */
  displayedEvaluationColumns: string[] = ['photo', 'name', 'evaluation', 'comment'];

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
   * @param boardgameService - ボードゲームのデータ操作を行うサービス。
   * @param dialog - 確認ダイアログなど、新しいダイアログを開くために使用します。
   */
  constructor(
    public dialogRef: MatDialogRef<EditUserDataDialogComponent>,
    private boardgameService: BoardgameService,
    public dialog: MatDialog
  ) {
    // 注入された初期データを、編集用の`data`プロパティにディープコピーします。
    // これにより、ダイアログ内での変更が「保存」ボタンを押すまで呼び出し元に影響しないようにします。
    this.data = { ...this.initialData };
    this.allTags = this.initialData.allTags || [];

    // タグ入力フォームの値の変更を監視し、オートコンプリートの候補をフィルタリングします。
    this.filteredTags = this.tagCtrl.valueChanges.pipe(
      startWith(null), // 初期状態でも一度流す
      map((tag: string | null) => (tag ? this._filter(tag) : this.allTags.slice())),
    );
  }

  /**
   * @method ngOnInit
   * @description
   * コンポーネントの初期化時に、このゲームに対する全ユーザーの評価データを読み込みます。
   */
  ngOnInit(): void {
    this.loadAllEvaluations();
  }

  /**
   * @method loadAllEvaluations
   * @description
   * `BoardgameService`を呼び出して、このゲームに対する全ユーザーの評価データを非同期で取得し、
   * 「みんなの評価」テーブルのデータソースを更新します。
   */
  async loadAllEvaluations(): Promise<void> {
    const boardGameId = this.initialData.id;
    if (!boardGameId) {
      console.warn('boardGameId is not provided.');
      return;
    }
    const evaluations = await this.boardgameService.getAllEvaluationsForGame(boardGameId);
    this.allEvaluationsDataSource.data = evaluations;
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
   * @method onDeleteClick
   * @description
   * （管理者向け）削除ボタンがクリックされたときに呼び出されます。
   * ユーザーに最終確認を求めるための確認ダイアログを表示し、承認された場合にのみ削除処理を実行します。
   */
  async onDeleteClick(): Promise<void> {
    const confirmDialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: { message: `「${this.data.name}」を削除してもよろしいですか？関連するすべての評価データも削除されます。` }
    });

    const result = await firstValueFrom(confirmDialogRef.afterClosed());
    if (result) {
      await this.boardgameService.deleteBoardGame(this.data.id!);
      this.dialogRef.close('deleted'); // 呼び出し元に削除が完了したことを通知
    }
  }

  /**
   * @method setRating
   * @param rating - ユーザーが選択した評価値（星の数）。
   * @description
   * 評価の星アイコンがクリックされたときに、編集中のデータ(`data.evaluation`)を更新します。
   */
  setRating(rating: number): void {
    this.data.evaluation = rating;
  }

  /**
   * @method addTag
   * @param event - タグ入力イベント。
   * @description
   * （管理者向け）タグ入力フォームで新しいタグが入力されたときに追加処理を行います。
   */
  addTag(event: MatChipInputEvent): void {
    if (!this.initialData.isAdmin) return; // 管理者でなければ何もしない
    const value = (event.value || '').trim();
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
   * （管理者向け）タグの削除ボタンがクリックされたときに、タグをデータから削除します。
   */
  removeTag(tag: string): void {
    if (!this.initialData.isAdmin) return; // 管理者でなければ何もしない
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
   * （管理者向け）オートコンプリートの候補が選択されたときに、そのタグを追加します。
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

  /**
   * @method getStarIcon
   * @param rating - 評価値 (0-5)。
   * @param index - 星のインデックス (0-4)。
   * @returns 表示すべき星アイコンの文字列（'star', 'star_half', 'star_border'）。
   * @description
   * 評価の数値に基づいて、対応する星のアイコン名を返します。これにより、テンプレートで星評価を簡単に表示できます。
   */
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