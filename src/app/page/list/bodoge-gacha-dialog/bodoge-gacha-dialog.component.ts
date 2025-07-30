import { Component, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';

/**
 * ボドゲガチャの検索条件を表すインターフェース
 */
export interface GachaCondition {
  players: number | null;
  playStatus: 'played' | 'unplayed' | 'any';
  tags: string[];
  timeRange: { min: number; max: number; };
  ratingRange: { min: number; max: number; };
}

@Component({
  selector: 'app-bodoge-gacha-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    MatChipsModule,
    MatIconModule,
    MatSliderModule,
    DecimalPipe
  ],
  templateUrl: './bodoge-gacha-dialog.component.html',
  styleUrls: ['./bodoge-gacha-dialog.component.scss']
})
export class BodogeGachaDialogComponent {

  /**
   * ダイアログのデータオブジェクト
   */
  data: GachaCondition;
  private initialData: Partial<GachaCondition> = inject(MAT_DIALOG_DATA, { optional: true });

  constructor(
    public dialogRef: MatDialogRef<BodogeGachaDialogComponent>
  ) {
    // 受け取ったデータで初期化、またはデフォルト値を設定
    this.data = {
      players: null,
      playStatus: 'any',
      tags: [],
      timeRange: { min: 0, max: 180 },
      ratingRange: { min: 0, max: 5 },
      ...this.initialData
    };
  }

  /**
   * キャンセルボタンがクリックされたときの処理
   */
  onNoClick(): void {
    this.dialogRef.close();
  }

  /**
   * タグを追加する
   * @param event MatChipInputEvent
   */
  addTag(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      this.data.tags.push(value);
    }
    event.chipInput!.clear();
  }

  /**
   * タグを削除する
   * @param tag 削除するタグ
   */
  removeTag(tag: string): void {
    const index = this.data.tags.indexOf(tag);
    if (index >= 0) {
      this.data.tags.splice(index, 1);
    }
  }
}