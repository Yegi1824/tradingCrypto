import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {BinanceService} from '../../services/binance.service';
import {Trade, TradesService} from '../../services/trades.service';
import {catchError, fromEvent, Observable, of, Subject, Subscription, tap} from 'rxjs';
import {debounceTime} from 'rxjs/operators';
import {createChart, CrosshairMode, IPriceLine, LineStyle, PriceLineOptions,} from 'lightweight-charts';

interface TradeMarker {
  priceLine: IPriceLine;
  options: PriceLineOptions;
}

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.scss'],
})
export class ChartComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @ViewChild('chartContainer') chartContainer: ElementRef;
  @Input() symbol: string;
  @Input() timeframe: string;
  @Input() realtimeTimeframe: string;

  private chart: any;
  private markers: any[] = [];
  private currentSeries: any;
  private chartDataSubscription: Subscription;
  currentPrice: number;
  chartData!: any[];
  tradeMarkers: TradeMarker[] = [];
  candlestickSeries: any;
  realtimeDataSubscription: Subscription | null = null;
  candles: any[] = [];
  private changeTrigger = new Subject<void>();

  constructor(private binanceService: BinanceService,
              private tradesService: TradesService
  ) {
  }

  ngOnInit(): void {
    this.fetchChartData().subscribe(
      () => {
      },
      (error) => console.error(error)
    );
  }

  ngAfterViewInit(): void {
    this.initChart();
    this.updateChartData();
    this.subscribeToRealtimeData();

    // Подписываемся на обновления данных графика
    this.chartDataSubscription.add(
      this.tradesService.chartData$.subscribe(chartData => {
        // Если данные графика существуют, обновляем текущую цену
        if (chartData.length > 0) {
          const latestPrice = chartData[chartData.length - 1].close;
          this.tradesService.setCurrentChartPrice(latestPrice);
        }
      })
    );

    this.changeTrigger.pipe(debounceTime(500)).subscribe(() => {
      this.tradesService.updateCurrentPrice(this.symbol, this.timeframe);
    });
  }

  ngOnDestroy() {
    this.chartDataSubscription?.unsubscribe();
    this.realtimeDataSubscription?.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.chart) {
      if (changes['symbol'] && !changes['symbol'].firstChange) {
        this.changeSymbol(changes['symbol'].currentValue);
        this.updateChartData();
      } else if (changes['timeframe']) {
        this.updateChartData();
        // Update realtimeTimeframe when the timeframe changes
        this.realtimeTimeframe = this.convertTimeframeToRealtime(this.timeframe);
      }
      this.subscribeToRealtimeData();
      this.changeTrigger.next();
    }
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
      case '1d':
        return '1h';
      case '1w':
        return '1h';
      case '1M':
        return '1d';
      default:
        return '1m';
    }
  }

  initChart(): void {
    this.chart = createChart(this.chartContainer.nativeElement, {
      width: this.chartContainer.nativeElement.clientWidth,
      height: this.chartContainer.nativeElement.clientHeight,
      crosshair: {
        mode: CrosshairMode.Normal,
      },
    });

    this.chart.applyOptions({
      localization: {
        locale: 'ru', // Задайте локализацию, соответствующую вашему региону или предпочтениям
        timeFormatter: (time) => {
          const date = new Date(time * 1000); // Преобразуйте время в миллисекунды
          return `${date.toLocaleDateString()} ${date.toLocaleTimeString().split(':')[0] + ':' + date.toLocaleTimeString().split(':')[1]}`;
        },
      },
    });

    fromEvent(window, 'resize')
      .pipe(debounceTime(100))
      .subscribe(() => {
        this.chart.resize(this.chartContainer.nativeElement.clientWidth, this.chartContainer.nativeElement.clientHeight);
      });
  }

  subscribeToRealtimeData(): void {
    this.realtimeDataSubscription?.unsubscribe();
    this.realtimeDataSubscription = this.tradesService
      .getRealtimeData(this.symbol, this.timeframe)
      .subscribe(
        (message) => {
          if (message.e === 'kline') {
            const candle = message.k;
            const chartCandle = {
              time: candle.t / 1000,
              open: Number(candle.o),
              high: Number(candle.h),
              low: Number(candle.l),
              close: Number(candle.c),
            };
            this.updateCurrentPrice(chartCandle.close);

            if (this.realtimeTimeframe === this.timeframe) {
              // Если новая свеча начинается, добавьте ее к данным и обновите график
              if (chartCandle.time > this.candles[this.candles.length - 1].time) {
                this.candles.push(chartCandle);
                this.candlestickSeries.update(chartCandle);
              } else {
                // Иначе обновите последнюю свечу
                this.candles[this.candles.length - 1] = chartCandle;
                this.candlestickSeries.update(chartCandle);
              }
            }
          }
        },
        (error) => {
          console.error('Error receiving realtime data:', error);
        }
      );
  }

  restoreTradeMarkers(): void {
    this.tradeMarkers.forEach((marker) => {
      this.candlestickSeries.createPriceLine(marker.options);
    });
  }

  addSavedTradeMarkers() {
    this.tradeMarkers.forEach(tradeMarker => {
      this.candlestickSeries.addPriceLine(tradeMarker.options);
    });
  }

  removeTradeMarkers(): void {
    this.tradeMarkers.forEach((marker) => {
      this.candlestickSeries.removePriceLine(marker.priceLine);
    });
    this.tradeMarkers = [];
  }


  changeSymbol(newSymbol: string): void {
    this.symbol = newSymbol;
    this.fetchChartData();
    this.subscribeToRealtimeData();
    this.tradesService.updateCurrentPrice(this.symbol, this.timeframe); // добавьте эту строку
  }

  updateRealtimeCandle(candle: any): void {
    if (
      this.candles.length === 0 ||
      (candle.time > this.candles[this.candles.length - 1].time &&
        this.realtimeTimeframe === this.timeframe)
    ) {
      this.candlestickSeries.update(candle);
    }
  }

  addTradeMarker(trade: Trade): void {
    const priceLineOptions: PriceLineOptions = {
      color: trade.tradeType === 'buy' ? '#00FF00' : '#FF0000',
      price: trade.price,
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
      lineVisible: true,
      axisLabelVisible: true,
      title: trade.tradeType === 'buy' ? 'Buy' : 'Sell',
      axisLabelColor: trade.tradeType === 'buy' ? '#00FF00' : '#FF0000', // добавьте эту строку
      axisLabelTextColor: '#FFFFFF', // добавьте эту строку
    };

    const priceLine = this.candlestickSeries.createPriceLine(priceLineOptions);
    this.tradeMarkers.push({ priceLine, options: priceLineOptions });
  }

  updateChartData(): void {
    this.chartDataSubscription?.unsubscribe();
    this.chartDataSubscription = this.tradesService
      .getChartData(this.symbol, this.timeframe)
      .subscribe(
        (chartData) => {
          this.candles = chartData;

          // Удаление старых индикаторов торгов
          this.removeTradeMarkers();

          // Удаление предыдущих данных графика
          if (this.currentSeries) {
            this.chart.removeSeries(this.currentSeries);
          }

          this.candlestickSeries = this.chart.addCandlestickSeries();
          this.candlestickSeries.setData(chartData);
          this.addSavedTradeMarkers();

          // Обновление текущей серии графика
          this.currentSeries = this.candlestickSeries;
        },
        (error) => {
          console.error('Error fetching chart data:', error);
        }
      );
  }


  fetchChartData(): Observable<any> {
    return this.tradesService.getChartData(this.symbol, this.timeframe).pipe(
      tap((data) => {
        console.log(data)
        this.chartData = data.map(item => ({
          time: item['time'] / 1000,
          open: item['open'],
          high: item['high'],
          low: item['low'],
          close: item['close'],
        }));
        this.updateCurrentPrice(data[data.length - 1].close);
        this.updateChartData();
      }),
      catchError(error => {
        console.error(error);
        return of([]);
      })
    );
  }

  updateCurrentPrice(price): void {
    this.tradesService.setCurrentPrice(price);
  }
}

