import { TestBed } from '@angular/core/testing';

import { CurrencyPairService } from './currency-pair.service';

describe('CurrencyPairService', () => {
  let service: CurrencyPairService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CurrencyPairService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
