import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CancelationTransactionComponent } from './cancelation-transaction.component';

describe('CancelationTransactionComponent', () => {
  let component: CancelationTransactionComponent;
  let fixture: ComponentFixture<CancelationTransactionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CancelationTransactionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CancelationTransactionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
