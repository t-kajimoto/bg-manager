import { AfterViewInit, Component, ElementRef, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
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
import { MatCardModule } from '@angular/material/card';
import { IBoardGame } from '../../data/boardgame.model';
import { BoardgameService } from '../../services/boardgame.service';
import { AuthService } from '../../services/auth.service';
import { AddBoardgameDialogComponent } from './add-boardgame-dialog/add-boardgame-dialog.component';
import { EditUserDataDialogComponent } from './edit-user-data-dialog/edit-user-data-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BodogeGachaDialogComponent, GachaDialogData } from './bodoge-gacha-dialog/bodoge-gacha-dialog.component';
import { User } from '@angular/fire/auth';
import { Observable, firstValueFrom, filter } from 'rxjs';

/**
 * @class ListComponent
 * @description
 * このアプリケーションのメインページとなるコンポーネントです。
 * ボードゲームの一覧表示、検索、ソート、および各種ダイアログの呼び出しによる
 * データ操作の起点となる、中心的な役割を担います。
 */
@Component({
  selector: 'app-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSortModule,
    MatTooltipModule,
    FormsModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatCardModule,
  ],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
})
export class ListComponent implements AfterViewInit, OnInit {
  /** ログインしているユーザーの情報を保持するObservable。テンプレートでasyncパイプと共に使用し、UIの表示を切り替えます。 */
  public user$: Observable<User | null>;
  /** 現在のユーザーが管理者権限を持つかどうかを示すObservable。管理者向けUIの表示制御に使用します。 */
  public isAdmin$: Observable<boolean>;
  /** 表示するテーブルのカラム名を定義した配列。この配列の順序でテーブルの列が表示されます。 */
  displayedColumns: string[] = ['actions', 'name', 'tags', 'players', 'time', 'evaluation', 'averageEvaluation'];
  /** Angular Materialのテーブルにデータを提供するためのデータソース。ソートやフィルタリングの機能も持ちます。 */
  dataSource: MatTableDataSource<IBoardGame>;
  /** 評価の星の最大数。 */
  maxStars: number = 5;
  /** テンプレートで星のアイコンを繰り返し表示するために使用する配列。 */
  maxStarsArray: number[] = Array(this.maxStars).fill(0);
  /** データベースに存在するすべてのタグを格納する配列。ダイアログに渡すことで、タグ入力のサジェスト機能を実現します。 */
  allTags: string[] = [];

  /** MatSortディレクティブへの参照を保持するプライベートプロパティ。 */
  private _sort!: MatSort;
  /**
   * @ViewChildのセッター。*ngIfなどで遅延して表示されるMatSortディレクティブを確実に取得します。
   * @param sort - テンプレートから注入されるMatSortインスタンス。
   * @description
   * このセッターは、Angularがビューの変更を検出し、MatSortディレクティブがDOMに描画されたときに呼び出されます。
   * これにより、未ログイン時にテーブルが存在しない場合でも、ログインしてテーブルが表示された瞬間に正しくソート機能を紐付けることができます。
   */
  @ViewChild(MatSort) set sort(sort: MatSort) {
    if (sort) {
      this._sort = sort;
      this.dataSource.sort = this._sort;
    }
  }
  /** 検索入力フォームのElementRef。フォームの値を直接操作するために使用します。 */
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  /**
   * @constructor
   * @param boardgameService - ボードゲームのデータ操作を行うサービス。
   * @param dialog - Angular Materialのダイアログを開くためのサービス。
   * @param viewContainerRef - ダイアログのインジェクタを設定するために使用。
   * @param authService - ユーザー認証と権限管理を行うサービス。
   * @param snackBar - ユーザーへの簡単なフィードバック（通知）を表示するサービス。
   */
  constructor(
    private boardgameService: BoardgameService,
    public dialog: MatDialog,
    private viewContainerRef: ViewContainerRef,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    // dataSourceを初期化します。この時点ではデータは空です。
    this.dataSource = new MatTableDataSource<IBoardGame>([]);
    // AuthServiceからユーザー情報と管理者状態のObservableを取得し、プロパティに設定します。
    this.user$ = this.authService.user$;
    this.isAdmin$ = this.authService.isAdmin$;
  }

  /**
   * @method ngOnInit
   * @description
   * コンポーネントの初期化時に呼び出されるライフサイクルフックです。
   * ボードゲームのリストを読み込み、テーブルのカスタムソートロジックを設定します。
   */
  ngOnInit() {
    this.loadBoardGames();
    // MatTableDataSourceのデフォルトのソート動作をカスタマイズします。
    // これにより、'players'のようなデータモデルに直接存在しない列名でも、意図したプロパティでソートできるようになります。
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'players': return item.min; // 'players'列は'min'プロパティでソートする
        case 'evaluation': return item.evaluation; // 'evaluation'列は'evaluation'プロパティでソートする
        case 'averageEvaluation': return item.averageEvaluation; // 'averageEvaluation'列は'averageEvaluation'プロパティでソートする
        default: return (item as any)[property]; // それ以外の列はデフォルトの動作
      }
    };
  }

  /**
   * @method ngAfterViewInit
   * @description
   * ビューの初期化が完了した後に呼び出されるライフサイクルフックです。
   * ここでは、@ViewChildのセッターに処理を移譲したため、特別な処理は行いません。
   */
  ngAfterViewInit() {
    // ソートの設定は@ViewChildのセッターで行うため、ここでは何もしません。
  }

  /**
   * @method loadBoardGames
   * @description
   * BoardgameServiceを通じてFirestoreからボードゲームのリストを取得し、テーブルのデータソースを更新します。
   * また、取得したデータからすべてのタグを抽出し、`allTags`プロパティを更新します。
   */
  loadBoardGames() {
    this.boardgameService.getBoardGames().subscribe(data => {
      // 取得したデータをテーブルのデータソースに設定します。
      this.dataSource.data = data;
      // ダイアログでタグのサジェスト機能を使うため、すべてのゲームからタグ情報を収集し、重複を除外して保持します。
      const allTags = data.flatMap(game => game.tags || []);
      this.allTags = [...new Set(allTags)];
    });
  }

  /**
   * @method applyFilter
   * @param event - キーボード入力イベント。
   * @description
   * 検索フォームに入力された値に基づいて、テーブルの表示内容をリアルタイムに絞り込みます。
   */
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    // dataSourceのfilterプロパティに値を設定するだけで、Materialのテーブルが自動的にフィルタリングを行います。
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  /**
   * @method openGachaDialog
   * @description
   * 「ボドゲガチャ」ダイアログを開きます。
   * ダイアログが閉じた後、返された条件に基づいてガチャを実行します。
   */
  async openGachaDialog(): Promise<void> {
    const dialogRef = this.dialog.open(BodogeGachaDialogComponent, {
      width: '500px',
      data: { allTags: this.allTags } // タグのサジェスト用に、既存の全タグを渡す
    });

    // ダイアログが閉じるのを待ち、結果（ガチャの条件）を受け取ります。
    const result = await firstValueFrom(dialogRef.afterClosed());
    // 結果が存在する場合（キャンセルされなかった場合）のみ、ガチャ処理を実行します。
    if (result) {
      this.executeGacha(result);
    }
  }

  /**
   * @method executeGacha
   * @param condition - ガチャの絞り込み条件。
   * @description
   * 指定された条件に基づいて現在のリストから候補を絞り込み、ランダムに1つを選択してユーザーに提示します。
   */
  private executeGacha(condition: GachaDialogData): void {
    let candidates = this.dataSource.data;

    // 各条件で候補を絞り込んでいきます。
    if (condition.players) {
      candidates = candidates.filter(game => game.min <= condition.players! && game.max >= condition.players!);
    }
    if (condition.playStatus !== 'any') {
      candidates = candidates.filter(game => {
        const played = game.played;
        if (condition.playStatus === 'played') return played;
        if (condition.playStatus === 'unplayed') return !played;
        return true;
      });
    }
    if (condition.tags.length > 0) {
      candidates = candidates.filter(game => game.tags && condition.tags.every((tag: string) => game.tags!.includes(tag)));
    }
    candidates = candidates.filter(game => game.time >= condition.timeRange.min && game.time <= condition.timeRange.max);
    candidates = candidates.filter(game => typeof game.averageEvaluation === 'number' && game.averageEvaluation >= condition.ratingRange.min && game.averageEvaluation <= condition.ratingRange.max);

    // 絞り込み後の候補が存在するかチェックします。
    if (candidates.length > 0) {
      // 候補の中からランダムに1つを選びます。
      const randomIndex = Math.floor(Math.random() * candidates.length);
      const selectedGame = candidates[randomIndex];
      // 選ばれたゲームの名前を検索フォームにセットし、フィルターを適用してハイライトします。
      this.searchInput.nativeElement.value = selectedGame.name;
      this.dataSource.filter = selectedGame.name.trim().toLowerCase();
      // Snackbarで結果をユーザーに通知します。
      this.snackBar.open(`「${selectedGame.name}」が選ばれました！`, '閉じる', { duration: 5000 });
    } else {
      // 候補が見つからなかった場合も通知します。
      this.snackBar.open('条件に合うゲームが見つかりませんでした。', '閉じる', { duration: 5000 });
    }
  }

  /**
   * @method openAddBoardGameDialog
   * @description
   * （管理者向け）新しいボードゲームを追加するためのダイアログを開きます。
   */
  async openAddBoardGameDialog(): Promise<void> {
    // ダイアログに渡す所有者名の初期値として、現在のユーザーの表示名を取得します。
    const user = await firstValueFrom(this.authService.user$.pipe(filter(u => !!u)));
    const dialogRef = this.dialog.open(AddBoardgameDialogComponent, {
      width: '400px',
      data: { 
        name: '', 
        min: 0, 
        max: 0, 
        time: 0, 
        ownerName: user?.displayName || 'Unknown',
        allTags: this.allTags
      },
    });

    // ダイアログが閉じた後、結果（新しいゲーム情報）を受け取ります。
    const result = await firstValueFrom(dialogRef.afterClosed());
    if (result) {
      try {
        // BoardgameServiceを使って、新しいゲームをデータベースに追加します。
        await this.boardgameService.addBoardGame(result);
        // リストを再読み込みして、追加したゲームを画面に反映させます。
        this.loadBoardGames();
      } catch (error) {
        console.error('Error adding board game: ', error);
      }
    }
  }

  /**
   * @method openEditUserDataDialog
   * @param game - 編集対象のボードゲームデータ。
   * @description
   * ボードゲームの詳細情報を編集するためのダイアログを開きます。
   */
  async openEditUserDataDialog(game: IBoardGame): Promise<void> {
    // 現在のユーザーが管理者かどうかを非同期で取得します。
    const isAdmin = await firstValueFrom(this.isAdmin$);
    const dialogRef = this.dialog.open(EditUserDataDialogComponent, {
      width: '800px',
      // ダイアログに、編集対象のゲームデータ、管理者フラグ、全タグリストを渡します。
      data: { ...game, isAdmin, allTags: this.allTags },
      viewContainerRef: this.viewContainerRef,
      injector: this.viewContainerRef.injector,
    });

    // ダイアログが閉じた後、結果（更新後のゲーム情報または'deleted'）を受け取ります。
    const result = await firstValueFrom(dialogRef.afterClosed());
    if (result) {
      // データベースの更新を待たずに、UIを即時更新（楽観的更新）します。
      // これにより、ユーザーは自分の操作結果をすぐに確認でき、体感速度が向上します。
      const index = this.dataSource.data.findIndex(item => item.id === game.id);
      if (index > -1) {
        this.dataSource.data[index] = { ...this.dataSource.data[index], ...result };
        this.dataSource.data = [...this.dataSource.data];
      }

      // ダイアログから返されたデータを、ユーザー固有のデータとゲームのマスターデータに分割します。
      const { played, evaluation, comment, ...boardGameData } = result;
      const userData = { played, evaluation, comment };

      try {
        // BoardgameServiceを使って、各データをデータベースに保存します。
        await this.boardgameService.updateUserBoardGame(game.id, userData);
        if (isAdmin) {
          await this.boardgameService.updateBoardGame(game.id, boardGameData);
        }
      } catch (error) {
        console.error('Error updating data: ', error);
      }
    }
  }

  /**
   * @method openGoogleImageSearch
   * @param boardgameName - 検索するボードゲーム名。
   * @description
   * 指定されたゲーム名でGoogle画像検索を行い、結果を新しいタブで開きます。
   */
  openGoogleImageSearch(boardgameName: string): void {
    const query = `${boardgameName} ボードゲーム 画像`;
    const googleSearchUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`;
    window.open(googleSearchUrl, '_blank');
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
    if (rating >= index + 1) return 'star';
    if (rating >= index + 0.5) return 'star_half';
    return 'star_border';
  }

  /**
   * @method onTagClick
   * @param tag - クリックされたタグの文字列。
   * @description
   * テーブル内のタグがクリックされたときに、そのタグを検索フォームにセットしてフィルタリングを実行します。
   */
  public onTagClick(tag: string): void {
    this.searchInput.nativeElement.value = tag;
    this.dataSource.filter = tag.trim().toLowerCase();
  }

  /**
   * @method clearSearch
   * @description
   * 検索フォームのクリアボタンが押されたときに、フォームの内容とフィルターをリセットします。
   */
  public clearSearch(): void {
    this.searchInput.nativeElement.value = '';
    this.dataSource.filter = '';
  }
}