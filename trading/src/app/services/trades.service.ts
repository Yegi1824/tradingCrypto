import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {BehaviorSubject, Observable, take} from 'rxjs';
import { map } from 'rxjs/operators';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

export interface Trade {
  id: string;
  symbol: string;
  tradeType: string;
  amount: number;
  price: number;
}

@Injectable({
  providedIn: 'root',
})
export class TradesService {
  private trades: Trade[] = [];
  private currentPriceSource = new BehaviorSubject<number>(0);
  currentPrice$ = this.currentPriceSource.asObservable();

  private chartDataSource = new BehaviorSubject<any[]>([]);
  chartData$ = this.chartDataSource.asObservable();

  constructor(private http: HttpClient) {}

  updateCurrentPrice(symbol: string, timeFrame: string): void {
    this.getRealtimeData(symbol, timeFrame).pipe(take(1)).subscribe(data => {
      const price = Number(data.k.c); // Извлекаем цену закрытия из объекта k
      this.currentPriceSource.next(price);
    });
  }

  setCurrentPrice(price: number): void {
    this.currentPriceSource.next(price);
  }

  getRealtimeData(symbol: string, timeFrame: string): WebSocketSubject<any> {
    const wsUrl = `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${timeFrame}`;
    return webSocket(wsUrl);
  }

  getChartData(symbol: string, interval: string): Observable<any> {
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}`;

    return this.http.get(url).pipe(
      map((data: any[]) => {
        const chartData = data.map((entry) => {
          return {
            time: entry[0] / 1000,
            open: parseFloat(entry[1]),
            high: parseFloat(entry[2]),
            low: parseFloat(entry[3]),
            close: parseFloat(entry[4]),
          };
        });

        // Обновляем данные графика
        this.chartDataSource.next(chartData);

        return chartData;
      })
    );
  }

  setCurrentChartPrice(price: number): void {
    this.currentPriceSource.next(price);
  }
}
