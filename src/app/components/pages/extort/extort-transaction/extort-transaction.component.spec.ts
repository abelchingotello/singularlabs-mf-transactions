import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExtortTransactionComponent } from './extort-transaction.component';

describe('ExtortTransactionComponent', () => {
  let component: ExtortTransactionComponent;
  let fixture: ComponentFixture<ExtortTransactionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExtortTransactionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExtortTransactionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
