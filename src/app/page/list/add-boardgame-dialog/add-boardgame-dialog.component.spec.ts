import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AddBoardgameDialogComponent } from './add-boardgame-dialog.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('AddBoardgameDialogComponent', () => {
  let component: AddBoardgameDialogComponent;
  let fixture: ComponentFixture<AddBoardgameDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AddBoardgameDialogComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: { allTags: [] } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddBoardgameDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});