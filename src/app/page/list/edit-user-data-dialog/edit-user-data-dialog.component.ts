
/**
 * @fileoverview
 * このファイルは、ボードゲームの情報を編集するためのダイアログコンポーネントを定義します。
 * ユーザーはここで、自分のプレイ状況や評価を編集できます。
 * 管理者権限を持つユーザーは、さらにボードゲームの基本情報（名前、タグなど）も編集できます。
 */

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IBoardGame } from '../../../data/boardgame.model';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { BoardgameService } from '../../../services/boardgame.service';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';

/**
 * ボードゲーム情報の編集を行うダイアログのコンポーネントです。
 */
@Component({
  selector: 'app-edit-user-data-dialog',
  templateUrl: './edit-user-data-dialog.component.html',
  styleUrls: ['./edit-user-data-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule, MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule,
    MatDialogModule, MatCheckboxModule, MatIconModule, MatTableModule, MatChipsModule, MatDividerModule, MatExpansionModule
  ]
})
export class EditUserDataDialogComponent implements OnInit {
  /** 評価の星の最大数 */
  maxStars: number = 5;
  /** 評価の星を描画するために使用する配列 */
  maxStarsArray: number[] = Array(this.maxStars).fill(0);

  /**
   * ダイアログ内で編集中のデータを保持するオブジェクトです。
   * `[(ngModel)]`によってテンプレートと双方向バインディングされています。
   */
  data: IBoardGame;

  /**
   * ダイアログが開かれたときに親コンポーネント(ListComponent)から渡される初期データです。
   * `inject(MAT_DIALOG_DATA)`を使ってDIシステムから取得します。
   * このデータは変更せず、編集権限のチェックなどに使用します。
   */
  public initialData: IBoardGame & { isAdmin: boolean } = inject(MAT_DIALOG_DATA);

  /** 「みんなの評価」テーブルのデータソース */
  allEvaluationsDataSource = new MatTableDataSource<any>();
  /** 「みんなの評価」テーブルで表示する列の定義 */
  displayedEvaluationColumns: string[] = ['photo', 'name', 'evaluation', 'comment'];

  /**
   * EditUserDataDialogComponentのコンストラクタです。
   * @param dialogRef このダイアログ自身への参照。ダイアログを閉じるなどの操作に使用します。
   * @param boardgameService ボードゲームのデータを扱うサービス
   */
  constructor(
    public dialogRef: MatDialogRef<EditUserDataDialogComponent>,
    private boardgameService: BoardgameService
  ) {
    // 渡された初期データをコピーして、編集用の`data`オブジェクトを作成します。
    // これにより、保存せずにダイアログを閉じた場合に元のデータが変更されるのを防ぎます。
    this.data = { ...this.initialData };
  }

  /**
   * コンポーネントが初期化されるときに呼び出されます。
   */
  ngOnInit(): void {
    // このボードゲームに対する全ユーザーの評価情報を読み込みます。
    this.loadAllEvaluations();
  }

  /**
   * BoardgameServiceを通じて、このゲームの全評価データを取得し、テーブルに表示します。
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
   * 「キャンセル」ボタンがクリックされたときに呼び出され、何も変更せずにダイアログを閉じます。
   */
  onNoClick(): void {
    this.dialogRef.close();
  }

  /**
   * 評価の星がクリックされたときに、評価の値を設定します。
   * @param rating クリックされた星の数（評価値）
   */
  setRating(rating: number): void {
    this.data.evaluation = rating;
  }

  /**
   * タグ入力欄でEnterキーが押されるか、フォーカスが外れたときに呼び出されます。
   * @param event MatChipInputEventオブジェクト
   */
  addTag(event: MatChipInputEvent): void {
    // 管理者でなければタグを追加できないようにします。
    if (!this.initialData.isAdmin) return;

    const value = (event.value || '').trim();

    // 値が入力されている場合のみタグを追加します。
    if (value) {
      // `tags`配列がまだ存在しない場合は、空の配列で初期化します。
      if (!this.data.tags) {
        this.data.tags = [];
      }
      this.data.tags.push(value);
    }

    // 入力欄をクリアします。
    event.chipInput!.clear();
  }

  /**
   * タグの削除ボタン（×）がクリックされたときに呼び出されます。
   * @param tag 削除するタグの文字列
   */
  removeTag(tag: string): void {
    // 管理者でなければタグを削除できないようにします。
    if (!this.initialData.isAdmin) return;

    if (this.data.tags) {
      const index = this.data.tags.indexOf(tag);
      if (index >= 0) {
        this.data.tags.splice(index, 1);
      }
    }
  }

  /**
   * 評価の数値に基づいて、表示すべき星アイコンの名前を返します。
   * @param rating 評価値 (例: 3.7)
   * @param index 星のインデックス (0-4)
   * @returns 'star', 'star_half', 'star_border' のいずれかのアイコン名
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
