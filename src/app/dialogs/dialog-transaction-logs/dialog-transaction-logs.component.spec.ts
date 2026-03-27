import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogTransactionLogsComponent } from './dialog-transaction-logs.component';

describe('DialogTransactionLogsComponent', () => {
  let component: DialogTransactionLogsComponent;
  let fixture: ComponentFixture<DialogTransactionLogsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogTransactionLogsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogTransactionLogsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
