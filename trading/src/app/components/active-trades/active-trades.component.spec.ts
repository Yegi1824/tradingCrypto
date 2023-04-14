import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActiveTradesComponent } from './active-trades.component';

describe('ActiveTradesComponent', () => {
  let component: ActiveTradesComponent;
  let fixture: ComponentFixture<ActiveTradesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ActiveTradesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActiveTradesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
