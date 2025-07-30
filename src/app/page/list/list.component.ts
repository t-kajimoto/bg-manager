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
import { MatCardModule } from '@angular/material/card'; // ★ これを追加
import { IBoardGame } from '../../data/boardgame.model';
import { BoardgameService } from '../../services/boardgame.service';
import { AuthService } from '../../services/auth.service';
import { AddBoardgameDialogComponent } from './add-boardgame-dialog/add-boardgame-dialog.component';
import { EditUserDataDialogComponent } from './edit-user-data-dialog/edit-user-data-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BodogeGachaDialogComponent, GachaCondition } from './bodoge-gacha-dialog/bodoge-gacha-dialog.component';
import { Observable, firstValueFrom, filter } from 'rxjs';

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
    MatCardModule, // ★ これを追加
  ],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
})
export class ListComponent implements AfterViewInit, OnInit {
  public isAdmin$: Observable<boolean>;
  displayedColumns: string[] = ['name', 'players', 'time', 'evaluation', 'averageEvaluation', 'actions'];
  dataSource: MatTableDataSource<IBoardGame>;
  maxStars: number = 5;
  maxStarsArray: number[] = Array(this.maxStars).fill(0);
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  constructor(
    private boardgameService: BoardgameService,
    public dialog: MatDialog,
    private viewContainerRef: ViewContainerRef,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.dataSource = new MatTableDataSource<IBoardGame>([]);
    this.isAdmin$ = this.authService.isAdmin$;
  }

  ngOnInit() {
    this.loadBoardGames();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  loadBoardGames() {
    this.boardgameService.getBoardGames().subscribe(data => {
      this.dataSource.data = data;
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  async openGachaDialog(): Promise<void> {
    const dialogRef = this.dialog.open(BodogeGachaDialogComponent, {
      width: '500px',
      data: { }
    });

    const result = await firstValueFrom(dialogRef.afterClosed());
    if (result) {
      this.executeGacha(result);
    }
  }

  private executeGacha(condition: GachaCondition): void {
    let candidates = this.dataSource.data;

    // 人数で絞り込み
    if (condition.players) {
      candidates = candidates.filter(game => game.min <= condition.players! && game.max >= condition.players!);
    }

    // プレイ状況で絞り込み
    if (condition.playStatus !== 'any') {
      candidates = candidates.filter(game => {
        const played = game.played;
        if (condition.playStatus === 'played') return played;
        if (condition.playStatus === 'unplayed') return !played;
        return true;
      });
    }

    // プレイ時間で絞り込み
    candidates = candidates.filter(game => game.time >= condition.timeRange.min && game.time <= condition.timeRange.max);

    // タグで絞り込み
    if (condition.tags.length > 0) {
      candidates = candidates.filter(game => game.tags && condition.tags.every(tag => game.tags!.includes(tag)));
    }

    // 平均評価で絞り込み
    candidates = candidates.filter(game => typeof game.averageEvaluation === 'number' && game.averageEvaluation >= condition.ratingRange.min && game.averageEvaluation <= condition.ratingRange.max);

    if (candidates.length > 0) {
      const randomIndex = Math.floor(Math.random() * candidates.length);
      const selectedGame = candidates[randomIndex];
      this.searchInput.nativeElement.value = selectedGame.name;
      this.dataSource.filter = selectedGame.name.trim().toLowerCase();
      this.snackBar.open(`「${selectedGame.name}」が選ばれました！`, '閉じる', { duration: 5000 });
    } else {
      this.snackBar.open('条件に合うゲームが見つかりませんでした。', '閉じる', { duration: 5000 });
    }
  }

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
        this.loadBoardGames();
      } catch (error) {
        console.error('Error adding board game: ', error);
      }
    }
  }

  async openEditUserDataDialog(game: IBoardGame): Promise<void> {
    const isAdmin = await firstValueFrom(this.isAdmin$);
    const dialogRef = this.dialog.open(EditUserDataDialogComponent, {
      width: '800px',
      data: { ...game, isAdmin },
      viewContainerRef: this.viewContainerRef,
      injector: this.viewContainerRef.injector,
    });

    const result = await firstValueFrom(dialogRef.afterClosed());
    if (result) {
      const index = this.dataSource.data.findIndex(item => item.id === game.id);
      if (index > -1) {
        this.dataSource.data[index] = { ...this.dataSource.data[index], ...result };
        this.dataSource.data = [...this.dataSource.data];
      }

      const { played, evaluation, comment, ...boardGameData } = result;
      const userData = { played, evaluation, comment };

      try {
        await this.boardgameService.updateUserBoardGame(game.id, userData);
        if (isAdmin) {
          await this.boardgameService.updateBoardGame(game.id, boardGameData);
        }
      } catch (error) {
        console.error('Error updating data: ', error);
      }
    }
  }

  openGoogleImageSearch(boardgameName: string): void {
    const query = `${boardgameName} ボードゲーム 画像`;
    const googleSearchUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`;
    window.open(googleSearchUrl, '_blank');
  }

  public getStarIcon(rating: number, index: number): string {
    if (rating >= index + 1) return 'star';
    if (rating >= index + 0.5) return 'star_half';
    return 'star_border';
  }
}
