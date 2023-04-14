import {Component} from '@angular/core';
import {v4} from 'uuid'
import {Trade, TradesService} from "./services/trades.service";
import {SocketClient} from "../socketClient";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  socketClient: SocketClient;
  constructor(private tradesService: TradesService) {
    this.socketClient = new SocketClient();
  }

  title = 'trading';
  selectedSymbol = 'BTCUSDT';
  selectedTimeframe = '1h';
  realtimeTimeframe = '1h';

  onCurrencyPairChanged(symbol: string): void {
    this.socketClient.emit('changeSymbol', { symbol: symbol, interval: this.realtimeTimeframe, priceChange: 0.03 });
    this.selectedSymbol = symbol;
  }

  onBuySubmit(event: { price: number; amount: number }): void {
    const trade: Trade = {
      id: Date.now(),
      symbol: this.selectedSymbol,
      tradeType: 'buy',
      amount: event.amount,
      price: event.price,
    };
    this.tradesService.addTrade(trade);
  }

  onSellSubmit(event: { price: number; amount: number }): void {
    const trade: Trade = {
      id: Date.now(),
      symbol: this.selectedSymbol,
      tradeType: 'sell',
      amount: event.amount,
      price: event.price,
    };
    this.tradesService.addTrade(trade);
  }

  getUniqUUID() {
    return v4.get();
  }

  onTimeframeChanged(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedTimeframe = target.value;
    this.realtimeTimeframe = this.convertTimeframeToRealtime(this.selectedTimeframe);
  }

  convertTimeframeToRealtime(timeframe: string): string {
    switch (timeframe) {
      case '1m':
        return '1m';
      case '5m':
        return '1m';
      case '15m':
        return '1m';
      case '30m':
        return '1m';
      case '1h':
        return '1m';
      case '1D':
        return '1h';
      case '1W':
        return '1h';
      case '1M':
        return '1D';
      default:
        return '1m';
    }
  }

}
