import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListComponent } from './list.component';
import { BoardgameService } from '../../services/boardgame.service';
import { MatDialog } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AuthService } from '../../services/auth.service';
import { of } from 'rxjs';

// サービスのモック
const mockBoardgameService = jasmine.createSpyObj('BoardgameService', ['getBoardGames']);
mockBoardgameService.getBoardGames.and.returnValue(of([]));

const mockAuthService = {
  user$: of(null),
  isAdmin$: of(false),
};

describe('ListComponent', () => {
  let component: ListComponent;
  let fixture: ComponentFixture<ListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListComponent, NoopAnimationsModule],
      providers: [
        { provide: BoardgameService, useValue: mockBoardgameService },
        { provide: MatDialog, useValue: {} },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});