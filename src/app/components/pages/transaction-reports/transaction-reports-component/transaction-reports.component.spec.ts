import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransactionReportsComponent } from './transaction-reports.component';

describe('TransactionReportsComponent', () => {
  let component: TransactionReportsComponent;
  let fixture: ComponentFixture<TransactionReportsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TransactionReportsComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(TransactionReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
