import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditNicknameDialogComponent } from './edit-nickname-dialog.component';

describe('EditNicknameDialogComponent', () => {
  let component: EditNicknameDialogComponent;
  let fixture: ComponentFixture<EditNicknameDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditNicknameDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditNicknameDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
