import {Component} from '@angular/core';
import {v4} from 'uuid'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'trading';
  selectedSymbol = 'BTCUSDT';
  selectedTimeframe = '1h';
  realtimeTimeframe = '1h';

  onCurrencyPairChanged(symbol: string): void {
    this.selectedSymbol = symbol;
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
