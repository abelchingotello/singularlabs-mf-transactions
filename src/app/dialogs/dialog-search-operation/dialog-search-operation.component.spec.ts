import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogSearchOperationComponent } from './dialog-search-operation.component';

describe('DialogSearchOperationComponent', () => {
  let component: DialogSearchOperationComponent;
  let fixture: ComponentFixture<DialogSearchOperationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogSearchOperationComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogSearchOperationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
