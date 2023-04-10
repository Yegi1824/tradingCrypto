import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class BinanceService {
  private apiUrl = 'https://api.binance.com';

  constructor(private http: HttpClient) {}

  getTickerPrice(symbol: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/v3/ticker/price?symbol=${symbol}`);
  }

  getKlines(symbol: string, interval: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/v3/klines?symbol=${symbol}&interval=${interval}`);
  }
}
