import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogTransactionStatusComponent } from './dialog-transaction-status.component';

describe('DialogTransactionStatusComponent', () => {
  let component: DialogTransactionStatusComponent;
  let fixture: ComponentFixture<DialogTransactionStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogTransactionStatusComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogTransactionStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
