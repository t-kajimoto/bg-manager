import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BodogeGachaDialogComponent } from './bodoge-gacha-dialog.component';

describe('BodogeGachaDialogComponent', () => {
  let component: BodogeGachaDialogComponent;
  let fixture: ComponentFixture<BodogeGachaDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BodogeGachaDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BodogeGachaDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
