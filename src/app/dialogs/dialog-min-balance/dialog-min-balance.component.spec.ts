import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogPersonEntityMinBalanceComponent } from './dialog-person-entity-min-balance.component';

describe('DialogPersonEntityMinBalanceComponent', () => {
  let component: DialogPersonEntityMinBalanceComponent;
  let fixture: ComponentFixture<DialogPersonEntityMinBalanceComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DialogPersonEntityMinBalanceComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(DialogPersonEntityMinBalanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
