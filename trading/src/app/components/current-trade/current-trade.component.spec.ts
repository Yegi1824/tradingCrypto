import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CurrentTradeComponent } from './current-trade.component';

describe('CurrentTradeComponent', () => {
  let component: CurrentTradeComponent;
  let fixture: ComponentFixture<CurrentTradeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CurrentTradeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CurrentTradeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
