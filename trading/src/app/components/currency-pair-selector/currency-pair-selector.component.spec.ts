import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CurrencyPairSelectorComponent } from './currency-pair-selector.component';

describe('CurrencyPairSelectorComponent', () => {
  let component: CurrencyPairSelectorComponent;
  let fixture: ComponentFixture<CurrencyPairSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CurrencyPairSelectorComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CurrencyPairSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
