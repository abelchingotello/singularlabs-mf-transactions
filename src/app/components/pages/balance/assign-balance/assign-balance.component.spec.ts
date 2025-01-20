import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignBalanceComponent } from './assign-balance.component';

describe('AssignBalanceComponent', () => {
  let component: AssignBalanceComponent;
  let fixture: ComponentFixture<AssignBalanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AssignBalanceComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssignBalanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
