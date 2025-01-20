import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportBalanceComponent } from './report-balance.component';

describe('ReportBalanceComponent', () => {
  let component: ReportBalanceComponent;
  let fixture: ComponentFixture<ReportBalanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReportBalanceComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportBalanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
