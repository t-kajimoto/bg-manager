/**
 * @fileoverview
 * このファイルは、アプリケーションのメイン画面であるボードゲームリストページのコンポーネントを定義します。
 * データの表示、ユーザー操作（フィルタ、ソート、編集）、ダイアログの表示などを担当します。
 */

import { AfterViewInit, Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { IBoardGame } from '../../data/boardgame.model';
import { BoardgameService } from '../../services/boardgame.service';
import { AuthService } from '../../services/auth.service';
import { AddBoardgameDialogComponent } from './add-boardgame-dialog/add-boardgame-dialog.component';
import { EditUserDataDialogComponent } from './edit-user-data-dialog/edit-user-data-dialog.component';
import { Observable, firstValueFrom, filter } from 'rxjs';

/**
 * ボードゲームのリスト表示と、それに関連するすべての機能を提供するメインコンポーネントです。
 */
@Component({
  selector: 'app-list', // このコンポーネントをHTMLで使うためのタグ名
  standalone: true, // このコンポーネントが他のモジュールに依存しないことを示す
  imports: [ // このコンポーネントがテンプレート内で使用するモジュールやコンポーネントのリスト
    CommonModule, // *ngIf, *ngForなどの基本的なディレクティブを提供
    MatTableModule, // Angular Materialのテーブル
    MatFormFieldModule, // フォームフィールド
    MatInputModule, // 入力欄
    MatSortModule, // ソート機能
    MatTooltipModule, // ツールチップ
    FormsModule, // ngModelを使った双方向データバインディング
    MatCheckboxModule, // チェックボックス
    MatButtonModule, // ボタン
    MatIconModule, // アイコン
    MatChipsModule, // チップ（タグ表示用）
  ],
  templateUrl: './list.component.html', // このコンポーネントのHTMLテンプレート
  styleUrl: './list.component.scss', // このコンポーネントのスタイルシート
})
export class ListComponent implements AfterViewInit, OnInit {
  /** 現在のユーザーが管理者かどうかを示すObservable。テンプレートでasyncパイプと共に使用します。 */
  public isAdmin$: Observable<boolean>;

  /** Angular Materialのテーブルで表示する列の名前を定義した配列です。 */
  displayedColumns: string[] = [
    'name', 'tags', 'min', 'max', 'time', 'played', 'evaluation', 'averageEvaluation', 'actions',
  ];

  /** テーブルのデータソース。ボードゲームのリストを保持し、フィルタやソート機能を提供します。 */
  dataSource: MatTableDataSource<IBoardGame>;

  /** 評価の星の最大数 */
  maxStars: number = 5;
  /** 評価の星を描画するために使用する配列（例: [0, 0, 0, 0, 0]） */
  maxStarsArray: number[] = Array(this.maxStars).fill(0);

  /** テーブルのソート機能を制御するためのインスタンスへの参照。@ViewChildデコレータで取得します。 */
  @ViewChild(MatSort) sort!: MatSort;

  /**
   * ListComponentのコンストラクタです。
   * DIにより、必要なサービス（BoardgameService, MatDialog, AuthService）を注入します。
   * @param boardgameService ボードゲームのデータを扱うサービス
   * @param dialog ダイアログを開くためのサービス
   * @param viewContainerRef ダイアログを動的に生成する場所の参照
   * @param authService 認証情報を扱うサービス
   */
  constructor(
    private boardgameService: BoardgameService,
    public dialog: MatDialog,
    private viewContainerRef: ViewContainerRef,
    private authService: AuthService
  ) {
    // データソースを初期化します。
    this.dataSource = new MatTableDataSource<IBoardGame>([]);
    // AuthServiceからisAdmin$を取得し、テンプレートで使えるようにします。
    this.isAdmin$ = this.authService.isAdmin$;
  }

  /**
   * コンポーネントが初期化されるときに一度だけ呼び出されるライフサイクルフックです。
   */
  ngOnInit() {
    // Firestoreからボードゲームのデータを読み込みます。
    this.loadBoardGames();
  }

  /**
   * コンポーネントのビュー（HTML）が初期化された後に呼び出されるライフサイクルフックです。
   */
  ngAfterViewInit() {
    // データソースにソート機能を紐付けます。
    this.dataSource.sort = this.sort;
  }

  /**
   * BoardgameServiceを通じて、Firestoreからボードゲームのリストを取得し、テーブルのデータソースを更新します。
   */
  loadBoardGames() {
    this.boardgameService.getBoardGames().subscribe(data => {
      this.dataSource.data = data;
    });
  }

  /**
   * フィルター入力欄のキー入力イベントに応じて、テーブルの表示内容をフィルタリングします。
   * @param event キー入力イベント
   */
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  /**
   * 「ボードゲームを追加」ダイアログを開きます。
   */
  async openAddBoardGameDialog(): Promise<void> {
    const user = await firstValueFrom(this.authService.user$.pipe(filter(u => !!u)));
    const dialogRef = this.dialog.open(AddBoardgameDialogComponent, {
      width: '400px',
      data: { name: '', min: 0, max: 0, time: 0, ownerName: user?.displayName || 'Unknown' },
    });

    const result = await firstValueFrom(dialogRef.afterClosed());
    if (result) {
      try {
        await this.boardgameService.addBoardGame(result);
        console.log('Board game added successfully!');
        // 追加が成功したら、リストを再読み込みして表示を更新します。
        this.loadBoardGames();
      } catch (error) {
        console.error('Error adding board game: ', error);
      }
    }
  }

  /**
   * 「評価・プレイ状況を編集」ダイアログを開きます。
   * このメソッドは、ユーザー体験を向上させるための「オプティミスティックUI」パターンを実装しています。
   * @param game 編集対象のボードゲームオブジェクト
   */
  async openEditUserDataDialog(game: IBoardGame): Promise<void> {
    // 現在のユーザーが管理者かどうかを非同期で取得します。
    const isAdmin = await firstValueFrom(this.isAdmin$);
    const dialogRef = this.dialog.open(EditUserDataDialogComponent, {
      width: '800px',
      // ダイアログに、編集対象のゲーム情報と管理者フラグを渡します。
      data: { ...game, isAdmin },
      viewContainerRef: this.viewContainerRef,
      injector: this.viewContainerRef.injector,
    });

    // ダイアログが閉じるのを待ち、結果を受け取ります。
    const result = await firstValueFrom(dialogRef.afterClosed());

    if (result) {
      // --- オプティミスティックUI更新 ---
      // 1. まず、ローカルのデータソースを直接更新して、画面に即時反映させます。
      const index = this.dataSource.data.findIndex(item => item.id === game.id);
      if (index > -1) {
        this.dataSource.data[index] = { ...this.dataSource.data[index], ...result };
        // 新しい配列をデータソースにセットすることで、テーブルの再描画をトリガーします。
        this.dataSource.data = [...this.dataSource.data];
      }
      // --- オプティミスティックUI更新ここまで ---

      // 2. 次に、実際のデータベース更新処理をバックグラウンドで行います。
      const { played, evaluation, comment, ...boardGameData } = result;
      const userData = { played, evaluation, comment };

      try {
        // ユーザー個人のデータと、ボードゲーム自体のデータをそれぞれ更新します。
        await this.boardgameService.updateUserBoardGame(game.id, userData);
        if (isAdmin) {
          await this.boardgameService.updateBoardGame(game.id, boardGameData);
        }
        console.log('Firebase data updated successfully in the background.');
      } catch (error) {
        console.error('Error updating data: ', error);
        // エラーが発生した場合、UIを元に戻す処理をここに追加することも可能です。
      }
    }
  }

  /**
   * ボードゲーム名でGoogle画像検索を実行する新しいタブを開きます。
   * @param boardgameName 検索したいボードゲームの名前
   */
  openGoogleImageSearch(boardgameName: string): void {
    const query = `${boardgameName} ボードゲーム 画像`;
    const googleSearchUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`;
    window.open(googleSearchUrl, '_blank');
  }

  /**
   * 評価の数値に基づいて、表示すべき星アイコンの名前を返します。
   * @param rating 評価値 (例: 3.7)
   * @param index 星のインデックス (0-4)
   * @returns 'star', 'star_half', 'star_border' のいずれかのアイコン名
   */
  public getStarIcon(rating: number, index: number): string {
    if (rating >= index + 1) {
      return 'star'; // 完全に塗りつぶされた星
    }
    if (rating >= index + 0.5) {
      return 'star_half'; // 半分の星
    }
    return 'star_border'; // 空の星
  }
}