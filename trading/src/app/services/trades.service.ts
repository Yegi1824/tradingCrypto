import {AfterViewInit, Injectable} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {BehaviorSubject, catchError, Observable, of, take} from 'rxjs';
import { map } from 'rxjs/operators';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import {ChartComponent} from "../components/chart/chart.component";
import { io } from 'socket.io-client';
import {SocketClient} from "../../socketClient";

export interface Trade {
  id: string | number;
  symbol: string;
  tradeType: string;
  amount: number;
  price: number;
}

@Injectable({
  providedIn: 'root',
})
export class TradesService{
  private socketClient: SocketClient;
  private trades: Trade[] = [];
  private currentPriceSource = new BehaviorSubject<number>(0);
  activeTrades: Trade[] = [];
  private chartComponent: ChartComponent | null = null;

  currentPrice$ = this.currentPriceSource.asObservable();

  private chartDataSource = new BehaviorSubject<any[]>([]);
  chartData$ = this.chartDataSource.asObservable();

  constructor(private http: HttpClient) {
    this.socketClient = new SocketClient();
    this.initializeSocketEvents();

    // Подпишитесь на событие 'realtimeData', чтобы получать обновления графика в реальном времени
    this.socketClient.on('realtimeData', (data) => {
      // Проверьте наличие необходимых полей в данных
      if (data && data.t && data.o && data.h && data.l && data.c) {
        if (this.chartComponent) {
          this.chartComponent.updateChartDataRealtime(data);
        }
      } else {
        console.error('Invalid data received:', data);
      }
    });

  }

  private initializeSocketEvents(): void {
    this.socketClient.on('chartData', (data) => {
      // Обновите данные графика с помощью полученных данных
      this.chartDataSource.next(data);
    });

    this.socketClient.on('connect', () => {
      console.log('Соединение с сервером установлено');
    });

    this.socketClient.on('disconnect', () => {
      console.log('Соединение с сервером разорвано');
    });
  }

 /* requestDataFromServer(symbol: string, interval: string, priceChange: number): void {
    this.socketClient.emit('requestData', {
      symbol,
      interval,
      priceChange,
    });
  }*/

  // Новый метод для обновления текущей цены из данных графика
  private updateCurrentPriceFromChartData(chartData: any[]): void {
    const lastCandle = chartData[chartData.length - 1];
    const currentPrice = lastCandle.close;
    this.currentPriceSource.next(currentPrice);
  }

  subscribeToRealtimeData(symbol: string, timeFrame: string): void {
    // Запросите данные у сервера
    // this.requestDataFromServer(symbol, timeFrame, 0);

    // Отправьте запрос на обновление данных в реальном времени
    this.socketClient.emit('requestData', {symbol, interval: timeFrame, priceChange: 0.03});
  }

/*
  getRealtimeData$() {
    return this.socketClient.getRealtimeData$();
  }
*/


  updateCurrentPrice(symbol: string, timeFrame: string): void {
    this.getRealtimeData(symbol, timeFrame).pipe(take(1)).subscribe(data => {
      const price = Number(data.k.c); // Извлекаем цену закрытия из объекта k
      console.log('price', price)
      this.currentPriceSource.next(price);
    });
  }

  setCurrentPrice(price: number): void {
    this.currentPriceSource.next(price);
  }

  getRealtimeData(symbol: string, timeFrame: string): Observable<any> {
    const url = `http://localhost:3001/api/realtime?symbol=${symbol}&timeframe=${timeFrame}`;
    return this.http.get(url).pipe(
      catchError((error) => {
        console.error(error);
        return of([]);
      })
    );
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

  registerChartComponent(chartComponent: ChartComponent) {
    this.chartComponent = chartComponent;
  }

  setCurrentChartPrice(price: number): void {
    this.currentPriceSource.next(price);
  }

  getActiveTrades(): Trade[] {
    return this.activeTrades;
  }

  addTrade(trade: Trade) {
    this.activeTrades.push(trade);
    if (this.chartComponent) {
      this.chartComponent.addTradeMarker(trade);
    }
  }

  closeTrade(trade: Trade) {
    const tradeIndex = this.activeTrades.findIndex((t) => t.id === trade.id);
    if (tradeIndex !== -1) {
      this.activeTrades.splice(tradeIndex, 1);
      if (this.chartComponent) {
        this.chartComponent.removeTradeMarker(trade);
      }
    }
  }

}
