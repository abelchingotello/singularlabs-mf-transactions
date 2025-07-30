import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListBalanceComponent } from './list-balance.component';

describe('ListBalanceComponent', () => {
  let component: ListBalanceComponent;
  let fixture: ComponentFixture<ListBalanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListBalanceComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListBalanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
