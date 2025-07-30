import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { EditUserDataDialogComponent } from './edit-user-data-dialog.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BoardgameService } from '../../../services/boardgame.service';

// BoardgameServiceのモック
const mockBoardgameService = jasmine.createSpyObj('BoardgameService', ['getAllEvaluationsForGame']);
mockBoardgameService.getAllEvaluationsForGame.and.returnValue(Promise.resolve([]));

describe('EditUserDataDialogComponent', () => {
  let component: EditUserDataDialogComponent;
  let fixture: ComponentFixture<EditUserDataDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        EditUserDataDialogComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: { allTags: [] } },
        { provide: BoardgameService, useValue: mockBoardgameService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditUserDataDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});