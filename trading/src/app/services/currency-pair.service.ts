import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CurrencyPairService {
  private currencyPairs: string[] = ['BTC/USDT', 'ETH/USDT', 'LTC/USDT', 'XRP/USDT', 'BCH/USDT'];

  constructor() {}

  getCurrencyPairs(): string[] {
    return this.currencyPairs;
  }
}
