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
import {createChart, CrosshairMode, IPriceLine, LineStyle, PriceLineOptions} from 'lightweight-charts';

interface TradeMarker {
  priceLine: IPriceLine;
  options: PriceLineOptions;
}

interface IchimokuData {
  tenkanSen: number[];
  kijunSen: number[];
  senkouSpanA: number[];
  senkouSpanB: number[];
  chikouSpan: number[];
}

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.scss'],
})
export class ChartComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @ViewChild('chartContainer') chartContainer: ElementRef;
  @ViewChild('rsiChart', {static: true}) rsiChartRef: ElementRef;
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

  private emaLine: any;

  public lineSeries: any;
  public emaSeries: any;
  public annotationData: any[] = [];

  indicators = {
    ema: null,
    sma: null,
    bb: null,
    /* rsi: null,
     macd: null,
     so: null,*/
    ichimoku: null
  };

  areaSeries: any;
  smaLine1: any;
  smaLine2: any;
  // rsiArea: any;
  macdArea: any;
  macdSignalSeries: any;
  stochasticDSeries: any;
  stochasticKSeries: any;
  tenkanSenSeries: any;
  kijunSenSeries: any;
  chikouSpanSeries: any;
  senkouSpanASeries: any;
  senkouSpanBSeries: any;
  ichimokuCloudSeries: any;
  volumeSeries: any;

  constructor(private binanceService: BinanceService,
              private tradesService: TradesService
  ) {
  }

  ngOnInit(): void {
    this.fetchChartData().subscribe(
      () => {
        console.log(123)
        // this.addEMA(); // Добавить индикатор EMA после получения данных графика
        // this.addVector(); // Добавить аннотацию Vector после получения данных графика
      },
      (error) => console.error(error)
    );
  }

  ngAfterViewInit(): void {
    this.initChart();
    this.updateChartData();
    this.subscribeToRealtimeData();
    this.tradesService.registerChartComponent(this);

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
      this.removePriceLines();
      this.subscribeToRealtimeData();
      this.changeTrigger.next();
      this.addSavedTradeMarkers();
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

  /*addEMA() {
    console.log('this.emaLine', this.emaLine)
    if (!this.emaLine) {
      this.emaLine = this.chart.addLineSeries({
        color: 'blue',
        lineWidth: 2,
        lineStyle: LineStyle.Solid,
      });
    }

    // Здесь вы можете запросить данные EMA для выбранного символа и временного интервала
    const emaData = this.calculateEMA(this.chartData, 12); // Замените на реальные данные EMA

    this.emaLine.setData(emaData);
  }*/

  calculateEMA(data: { close: number }[], period: number): number[] {
    const alpha = 2 / (period + 1);
    let prevEMA = data[0].close;
    const emaData: number[] = [prevEMA];

    for (let i = 1; i < data.length; i++) {
      const currentEMA = alpha * (data[i].close - prevEMA) + prevEMA;
      emaData.push(currentEMA);
      prevEMA = currentEMA;
    }

    return emaData;
  }

  calculateBollingerBands(data: number[], period: number, stdDev: number = 2): { upper: number[]; middle: number[]; lower: number[] } {
    const sma = this.calculateSMA(data, period);

    const bands = {
      upper: [],
      middle: sma,
      lower: [],
    };

    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        bands.upper.push(null);
        bands.lower.push(null);
      } else {
        const slice = data.slice(i - period + 1, i + 1);
        const std = Math.sqrt(slice.map((x) => Math.pow(x - sma[i], 2)).reduce((a, b) => a + b) / period);

        bands.upper.push(sma[i] + stdDev * std);
        bands.lower.push(sma[i] - stdDev * std);
      }
    }

    return bands;
  }

  /*calculateRSI(data: number[], period: number): number[] {
    const rsi: number[] = [];

    const gains: number[] = [];
    const losses: number[] = [];

    for (let i = 1; i < data.length; i++) {
      const diff = data[i] - data[i - 1];
      gains.push(diff > 0 ? diff : 0);
      losses.push(diff < 0 ? -diff : 0);

      if (i < period) {
        rsi.push(null);
      } else {
        const avgGain = gains.slice(-period).reduce((a, b) => a + b) / period;
        const avgLoss = losses.slice(-period).reduce((a, b) => a + b) / period;

        const rs = avgGain / (avgLoss || 1);
        rsi.push(100 - 100 / (1 + rs));
      }
    }

    return rsi;
  }*/

  /*calculateMACD(data: { close: number }[],
                shortPeriod: number = 12,
                longPeriod: number = 26,
                signalPeriod: number = 9)
    : { macd: (number | null)[]; signal: (number | null)[] } {
    const shortEMA = this.calculateEMA(data, shortPeriod);
    const longEMA = this.calculateEMA(data, longPeriod);
    const macd: (number | null)[] = [];
    const signal: (number | null)[] = [];

    for (let i = 0; i < data.length; i++) {
      macd.push(shortEMA[i] !== null && longEMA[i] !== null ? shortEMA[i] - longEMA[i] : null);

      if (i < longPeriod + signalPeriod - 2) {
        signal.push(null);
      } else {
        signal.push(this.calculateEMA(macd.slice(0, i + 1).map((x, idx) => ({close: x ?? 0})), signalPeriod).pop());
      }
    }

    return {macd, signal};
  }*/

  calculateIchimoku(
    data,
    tenkanPeriod: number = 9,
    kijunPeriod: number = 26,
    senkouSpanBPeriod: number = 52
  ): IchimokuData {
    const tenkanSen: number[] = [];
    const kijunSen: number[] = [];
    const senkouSpanA: number[] = [];
    const senkouSpanB: number[] = [];
    const chikouSpan: number[] = [];

    for (let i = 0; i < data.length; i++) {
      const tenkanHighMax = i < tenkanPeriod - 1 ? null : Math.max(...data.slice(i - tenkanPeriod + 1, i + 1).map(candle => candle.high));
      const tenkanLowMin = i < tenkanPeriod - 1 ? null : Math.min(...data.slice(i - tenkanPeriod + 1, i + 1).map(candle => candle.low));
      tenkanSen.push(tenkanHighMax !== null ? (tenkanHighMax + tenkanLowMin) / 2 : null);

      const kijunHighMax = i < kijunPeriod - 1 ? null : Math.max(...data.slice(i - kijunPeriod + 1, i + 1).map(candle => candle.high));
      const kijunLowMin = i < kijunPeriod - 1 ? null : Math.min(...data.slice(i - kijunPeriod + 1, i + 1).map(candle => candle.low));
      kijunSen.push(kijunHighMax !== null ? (kijunHighMax + kijunLowMin) / 2 : null);

      if (i < kijunPeriod - 1) {
        senkouSpanA.push(null);
      } else {
        senkouSpanA.push((tenkanSen[i] + kijunSen[i]) / 2);
      }

      const senkouSpanBHighMax = i < senkouSpanBPeriod - 1 ? null : Math.max(...data.slice(i - senkouSpanBPeriod + 1, i + 1).map(candle => candle.high));
      const senkouSpanBLowMin = i < senkouSpanBPeriod - 1 ? null : Math.min(...data.slice(i - senkouSpanBPeriod + 1, i + 1).map(candle => candle.low));
      senkouSpanB.push(senkouSpanBHighMax !== null ? (senkouSpanBHighMax + senkouSpanBLowMin) / 2 : null);

      chikouSpan.push(data[i].close);
    }

    return {
      tenkanSen,
      kijunSen,
      senkouSpanA,
      senkouSpanB,
      chikouSpan,
    };
  }

  /*calculateStochastic(data: { high: number[]; low: number[]; close: number[] }, period: number = 14, smoothing: number = 3): { k: number[]; d: number[] } {
    const k: number[] = [];
    const d: number[] = [];

    for (let i = 0; i < data.close.length; i++) {
      if (i < period - 1) {
        k.push(null);
      } else {
        const highMax = Math.max(...data.high.slice(i - period + 1, i + 1));
        const lowMin = Math.min(...data.low.slice(i - period + 1, i + 1));
        k.push(((data.close[i] - lowMin) / (highMax - lowMin)) * 100);
      }
    }

    const kSma = this.calculateSMA(k.filter((x) => x !== null), smoothing);
    for (let i = 0; i < k.length; i++) {
      d.push(i < period - 1 + smoothing - 1 ? null : kSma.shift());
    }

    return {k, d};
  }*/

  initChart(): void {
    this.chart = createChart(this.chartContainer.nativeElement, {
      watermark: {
        visible: true,
        color: '#fff',
        text: 'Не оплачено'
      },
      width: this.chartContainer.nativeElement.clientWidth,
      height: this.chartContainer.nativeElement.clientHeight,
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      layout: {
        background: {
          color: '#000'
        },
        textColor: 'rgba(255, 255, 255, 0.9)',
      },
      grid: {
        vertLines: {
          color: 'rgba(255, 255, 255, 0.2)',
        },
        horzLines: {
          color: 'rgba(255, 255, 255, 0.2)',
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.8)',
        visible: true,
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.8)',
      }
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

    this.areaSeries = this.chart.addAreaSeries({
      topColor: 'rgba(0, 255, 0, 0.56)',
      bottomColor: 'rgba(0, 255, 0, 0.04)',
      lineColor: 'rgba(0, 255, 0, 1)',
      lineWidth: 2,
    });

    //SMAIndicator
    this.smaLine1 = this.chart.addLineSeries({
      color: 'rgba(255, 0, 0, 1)',
      lineWidth: 1,
      lineStyle: LineStyle.Solid,
    });

    this.smaLine2 = this.chart.addLineSeries({
      color: 'rgba(0, 0, 255, 1)',
      lineWidth: 1,
      lineStyle: LineStyle.Solid,
    });

    /*// Создание нового графика для RSI
    const rsiChart = createChart(this.rsiChartRef.nativeElement, {
      width: this.chartContainer.nativeElement.clientWidth,
      height: 100,
      layout: {
        background: {
          color: 'rgba(0, 0, 0, 0.2)',
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.8)',
        visible: true,
        scaleMargins: {
          top: 0.05,
          bottom: 0.05,
        },
      },
      grid: {
        vertLines: {
          color: 'rgba(197, 203, 206, 0.5)',
        },
        horzLines: {
          color: 'rgba(197, 203, 206, 0.5)',
        },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      timeScale: {
        borderColor: 'rgba(197, 203, 206, 0.8)',
      },
    });

    rsiChart.applyOptions({
      localization: {
        locale: 'ru', // Задайте локализацию, соответствующую вашему региону или предпочтениям
        timeFormatter: (time) => {
          const date = new Date(time * 1000); // Преобразуйте время в миллисекунды
          return `${date.toLocaleDateString()} ${date.toLocaleTimeString().split(':')[0] + ':' + date.toLocaleTimeString().split(':')[1]}`;
        },
      },
    });*/

    /*// Volume Indicator
    this.volumeSeries = this.chart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
      base: 0,
    });*/

    /*// Инициализация RSI
    this.rsiArea = rsiChart.addAreaSeries({
      topColor: 'rgba(0, 255, 0, 0.1)',
      bottomColor: 'rgba(255, 0, 0, 0.1)',
      lineColor: 'rgba(0, 128, 255, 1)',
      lineWidth: 2,
    });*/

    //MACDIndicator
    this.macdArea = this.chart.addHistogramSeries({
      color: 'rgba(0, 128, 255, 0.8)',
    });

    this.macdSignalSeries = this.chart.addLineSeries({
      color: 'rgba(255, 0, 0, 0.8)',
      lineWidth: 2,
    });

    //Stochastic Oscillator Indicator
    this.stochasticKSeries = this.chart.addLineSeries({
      color: 'rgba(0, 128, 255, 0.8)',
      lineWidth: 2,
    });

    this.stochasticDSeries = this.chart.addLineSeries({
      color: 'rgba(255, 0, 0, 0.8)',
      lineWidth: 2,
    });

    //Ichimoku Cloud Indicator
    this.tenkanSenSeries = this.chart.addLineSeries({color: 'rgba(0, 128, 255, 0.8)', lineWidth: 1});
    this.kijunSenSeries = this.chart.addLineSeries({color: 'rgba(255, 0, 0, 0.8)', lineWidth: 1});
    this.chikouSpanSeries = this.chart.addLineSeries({color: 'rgba(0, 255, 0, 0.8)', lineWidth: 1});

    this.senkouSpanASeries = this.chart.addLineSeries({color: 'rgba(0, 128, 255, 0.8)', lineWidth: 1});
    this.senkouSpanBSeries = this.chart.addLineSeries({color: 'rgba(255, 0, 0, 0.8)', lineWidth: 1});

    this.ichimokuCloudSeries = this.chart.addAreaSeries({
      topColor: 'rgba(0, 128, 255, 0.1)',
      bottomColor: 'rgba(255, 0, 0, 0.1)',
      lineWidth: 0,
    });

    /*// Устанавливаем одинаковые правые отступы для обоих графиков
    const mainChartPriceScale = this.chart.priceScale('right');
    const rsiChartPriceScale = rsiChart.priceScale('right');

    mainChartPriceScale.applyOptions({
      borderColor: 'rgba(255, 255, 255, 0.8)',
      visible: true,
    });

    rsiChartPriceScale.applyOptions({
      borderColor: 'rgba(255, 255, 255, 0.8)',
      visible: true,
    });*/

    fromEvent(window, 'resize')
      .pipe(debounceTime(100))
      .subscribe(() => {
        this.chart.resize(this.chartContainer.nativeElement.clientWidth, this.chartContainer.nativeElement.clientHeight);
        // rsiChart.resize(this.chartContainer.nativeElement.clientWidth, 100);
      });
    // this.syncCharts(this.chart, rsiChart);
  }

  /*syncCharts(chart1, chart2) {
    chart1.timeScale().subscribeVisibleTimeRangeChange(() => {
      const visibleRange = chart1.timeScale().getVisibleRange();
      if (visibleRange !== null) {
        chart2.timeScale().setVisibleRange(visibleRange);
      }
    });

    chart2.timeScale().subscribeVisibleTimeRangeChange(() => {
      const visibleRange = chart2.timeScale().getVisibleRange();
      if (visibleRange !== null) {
        chart1.timeScale().setVisibleRange(visibleRange);
      }
    });

    chart1.timeScale().subscribeVisibleLogicalRangeChange(() => {
      const visibleLogicalRange = chart1.timeScale().getVisibleLogicalRange();
      if (visibleLogicalRange !== null) {
        chart2.timeScale().setVisibleLogicalRange(visibleLogicalRange);
      }
    });

    chart2.timeScale().subscribeVisibleLogicalRangeChange(() => {
      const visibleLogicalRange = chart2.timeScale().getVisibleLogicalRange();
      if (visibleLogicalRange !== null) {
        chart1.timeScale().setVisibleLogicalRange(visibleLogicalRange);
      }
    });
  }*/

  calculateSMA(data: number[], period: number): number[] {
    const sma = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        sma.push(null);
      } else {
        const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b);
        sma.push(sum / period);
      }
    }
    return sma;
  }

  subscribeToRealtimeData(): void {
    this.realtimeDataSubscription?.unsubscribe();
    this.tradesService.subscribeToRealtimeData(this.symbol, this.realtimeTimeframe);
  }

  updateChartIndicators(): void {
    this.addVolume();
    let sActiveIndicator: any = localStorage.getItem('sActiveIndicator');
    if (sActiveIndicator) {
      if (sActiveIndicator === 'SMA') {
        this.addSMA();
      } else if (sActiveIndicator === 'EMA') {
        this.addEMA(21)
      } else if (sActiveIndicator === 'BB') {
        this.addBollingerBands(20, 2);
      } else if (sActiveIndicator === 'IC') {
        this.addIchimoku(9, 26, 52)
      }
    }
  }

  addSMA(): void {
    const smaPeriod1 = 5;
    const smaPeriod2 = 10;

    let mapValueTimeCandles = this.candles.map((value, index, array) => {
      return {value: value.close, time: value.time}
    })

    const smaValues1 = this.calculateSMA(mapValueTimeCandles.map(d => d.value), smaPeriod1);
    const smaValues2 = this.calculateSMA(mapValueTimeCandles.map(d => d.value), smaPeriod2);

    this.areaSeries.setData(mapValueTimeCandles);
    this.smaLine1.setData(
      mapValueTimeCandles
        .map((d, i) => ({time: d.time, value: smaValues1[i]}))
        .filter((d) => d.value !== null)
    );
    this.smaLine2.setData(
      mapValueTimeCandles
        .map((d, i) => ({time: d.time, value: smaValues2[i]}))
        .filter((d) => d.value !== null)
    );
  }

  addEMA(period: number): void {
    const emaData = this.calculateEMA(this.candles, period);
    if (this.indicators.ema) {
      // Если индикатор EMA уже создан, обновляем его данные
      this.indicators.ema.setData(emaData.map((value, index) => ({...this.candles[index], value})));
    } else {
      // В противном случае создаем новый индикатор EMA
      const emaSeries = this.chart.addLineSeries({
        color: 'rgba(255, 255, 0, 0.8)',
        lineWidth: 2,
      });

      emaSeries.setData(emaData.map((value, index) => ({...this.candles[index], value})));
      this.indicators.ema = emaSeries;
    }
  }

  addVolume(): void {
    // Создаем серию гистограммы для отображения объема
    this.volumeSeries = this.chart.addHistogramSeries({
      color: 'rgba(76, 175, 80, 0.66)',
      lineWidth: 2,
      priceFormatter: (volumeValue) => {
        return volumeValue.toFixed(0);
      },
    });

    // Устанавливаем данные объема
    this.volumeSeries.setData(this.candles.map(candle => ({
      time: candle.time,
      value: candle.volume,
      color: candle.close > candle.open ? 'rgba(76, 175, 80, 0.66)' : 'rgba(255, 82, 82, 0.66)',
    })));
  }

  /*addVolume(): void {
    this.volumeSeries.setData(this.candles.map((a) => {
      return {time: a.time, value: a.close}
    }))
  }
*/

  /*addRSI(period: number): void {
    const rsiData = this.calculateRSI(this.candles.map(p => p.close), period);
    const filteredData = rsiData
      .map((value, index) => {
        if (value === null) {
          return null;
        }
        return { time: this.candles[index].time, value };
      })
      .filter(item => item !== null);

    if (!this.indicators.rsi) {
      // Если индикатор RSI еще не был создан, устанавливаем его
      this.indicators.rsi = this.rsiArea;
    }
    // Обновляем данные индикатора RSI
    this.indicators.rsi.setData(filteredData);
  }*/

  addBollingerBands(period: number, stdDev: number): void {
    const bbData = this.calculateBollingerBands(this.candles.map(p => p.close), period, stdDev);

    if (this.indicators.bb) {
      // Если индикатор BB уже создан, обновляем его данные
      this.indicators.bb.upper.setData(
        bbData.upper
          .map((value, index) => {
            if (value === null) {
              return null;
            }
            return {time: this.candles[index].time, value};
          })
          .filter(item => item !== null)
      );

      this.indicators.bb.middle.setData(
        bbData.middle
          .map((value, index) => {
            if (value === null) {
              return null;
            }
            return {time: this.candles[index].time, value};
          })
          .filter(item => item !== null)
      );

      this.indicators.bb.lower.setData(
        bbData.lower
          .map((value, index) => {
            if (value === null) {
              return null;
            }
            return {time: this.candles[index].time, value};
          })
          .filter(item => item !== null)
      );
    } else {
      // В противном случае создаем новый индикатор BB
      const upperSeries = this.chart.addLineSeries({color: 'green', lineWidth: 1});
      const middleSeries = this.chart.addLineSeries({color: 'blue', lineWidth: 1});
      const lowerSeries = this.chart.addLineSeries({color: 'red', lineWidth: 1});

      upperSeries.setData(
        bbData.upper
          .map((value, index) => {
            if (value === null) {
              return null;
            }
            return {time: this.candles[index].time, value};
          })
          .filter(item => item !== null)
      );

      middleSeries.setData(
        bbData.middle
          .map((value, index) => {
            if (value === null) {
              return null;
            }
            return {time: this.candles[index].time, value};
          })
          .filter(item => item !== null)
      );

      lowerSeries.setData(
        bbData.lower
          .map((value, index) => {
            if (value === null) {
              return null;
            }
            return {time: this.candles[index].time, value};
          })
          .filter(item => item !== null)
      );

      this.indicators.bb = {
        upper: upperSeries,
        middle: middleSeries,
        lower: lowerSeries,
      };
    }
  }

  /*addMACD(shortPeriod: number, longPeriod: number, signalPeriod: number): void {
    const macdData = this.calculateMACD(this.candles.map(p => p.close), shortPeriod, longPeriod, signalPeriod);

    // Создаем новую видимую ценовую шкалу справа
    this.chart.applyOptions({
      rightPriceScale: {
        visible: true,
      },
    });
    const priceScale = this.chart.priceScale('right');

    if (this.indicators.macd) {
      // Если индикатор MACD уже создан, обновляем его данные
      this.indicators.macd.macdArea.setData(
        macdData.macd
          .map((value, index) => {
            if (value === null) {
              return null;
            }
            return {time: this.candles[index].time, value};
          })
          .filter(item => item !== null)
      );

      this.indicators.macd.macdSignalSeries.setData(
        macdData.signal
          .map((value, index) => {
            if (value === null) {
              return null;
            }
            return {time: this.candles[index].time, value};
          })
          .filter(item => item !== null)
      );
    } else {
      // В противном случае создаем новый индикатор MACD
      const macdArea = this.chart.addHistogramSeries({
        color: 'rgba(76, 175, 80, 0.8)',
        lineWidth: 1,
        priceLineColor: 'rgba(0, 0, 0, 0)',
        priceScaleId: 'right'
      });
      const macdSignalSeries = this.chart.addLineSeries({
        color: 'blue',
        lineWidth: 1,
        priceLineColor: 'rgba(0, 0, 0, 0)',
        priceScaleId: 'right'
      });
      const macdLineSeries = this.chart.addLineSeries({
        color: 'red',
        lineWidth: 1,
        priceLineColor: 'rgba(0, 0, 0, 0)',
        priceScaleId: 'right'
      });

      macdArea.setData(
        macdData.macd
          .map((value, index) => {
            if (value === null) {
              return null;
            }
            return {time: this.candles[index].time, value};
          })
          .filter(item => item !== null)
      );

      macdSignalSeries.setData(
        macdData.signal
          .map((value, index) => {
            if (value === null) {
              return null;
            }
            return {time: this.candles[index].time, value};
          })
          .filter(item => item !== null)
      );

      this.indicators.macd = {
        macdArea: macdArea,
        macdSignalSeries: macdSignalSeries,
        macdLineSeries: macdLineSeries
      };
    }
  }*/

  /*addStochastic(period: number, smoothing: number): void {
    const stochData = this.calculateStochastic(
      {
        high: this.candles.map(p => p.high),
        low: this.candles.map(p => p.low),
        close: this.candles.map(p => p.close),
      },
      period,
      smoothing
    );

    this.stochasticKSeries.setData(stochData.k.map((value, index) => {
      return {time: this.candles[index].time, value};
    }));

    this.stochasticDSeries.setData(stochData.d.map((value, index) => {
      return {time: this.candles[index].time, value};
    }));
  }*/

  addIchimoku(tenkanPeriod: number, kijunPeriod: number, senkouSpanBPeriod: number): void {
    const ichimokuData = this.calculateIchimoku(this.candles, tenkanPeriod, kijunPeriod, senkouSpanBPeriod);

    if (this.indicators.ichimoku) {
      // Если индикатор Ichimoku уже создан, обновляем его данные
      this.indicators.ichimoku.tenkanSenSeries.setData(ichimokuData.tenkanSen.map((value, index) => {
        return {time: this.candles[index].time, value};
      }).filter(point => point.value !== null));

      this.indicators.ichimoku.kijunSenSeries.setData(ichimokuData.kijunSen.map((value, index) => {
        return {time: this.candles[index].time, value};
      }).filter(point => point.value !== null));

      this.indicators.ichimoku.chikouSpanSeries.setData(ichimokuData.chikouSpan.map((value, index) => {
        return {time: this.candles[index].time, value};
      }).filter(point => point.value !== null));

      this.indicators.ichimoku.senkouSpanASeries.setData(ichimokuData.senkouSpanA.map((value, index) => {
        return {time: this.candles[index].time, value};
      }).filter(point => point.value !== null));

      this.indicators.ichimoku.senkouSpanBSeries.setData(ichimokuData.senkouSpanB.map((value, index) => {
        return {time: this.candles[index].time, value};
      }).filter(point => point.value !== null));

      const cloudData = ichimokuData.senkouSpanA.map((spanA, index) => {
        return {
          time: this.candles[index].time,
          topValue: Math.max(spanA, ichimokuData.senkouSpanB[index]),
          bottomValue: Math.min(spanA, ichimokuData.senkouSpanB[index]),
        };
      }).filter(point => point.topValue !== null && point.bottomValue !== null);

      this.indicators.ichimoku.ichimokuCloudSeries.setData(cloudData);
    } else {
      this.tenkanSenSeries.setData(ichimokuData.tenkanSen.map((value, index) => {
        return {time: this.candles[index].time, value};
      }).filter(point => point.value !== null));

      this.kijunSenSeries.setData(ichimokuData.kijunSen.map((value, index) => {
        return {time: this.candles[index].time, value};
      }).filter(point => point.value !== null));

      this.chikouSpanSeries.setData(ichimokuData.chikouSpan.map((value, index) => {
        return {time: this.candles[index].time, value};
      }).filter(point => point.value !== null));

      this.senkouSpanASeries.setData(ichimokuData.senkouSpanA.map((value, index) => {
        return {time: this.candles[index].time, value};
      }).filter(point => point.value !== null));

      this.senkouSpanBSeries.setData(ichimokuData.senkouSpanB.map((value, index) => {
        return {time: this.candles[index].time, value};
      }).filter(point => point.value !== null));

      const cloudData = ichimokuData.senkouSpanA.map((spanA, index) => {
        return {
          time: this.candles[index].time,
          topValue: Math.max(spanA, ichimokuData.senkouSpanB[index]),
          bottomValue: Math.min(spanA, ichimokuData.senkouSpanB[index]),
        };
      });

      this.ichimokuCloudSeries.setData(cloudData);
      this.indicators.ichimoku = {
        tenkanSenSeries: this.tenkanSenSeries,
        kijunSenSeries: this.kijunSenSeries,
        chikouSpanSeries: this.chikouSpanSeries,
        senkouSpanASeries: this.senkouSpanASeries,
        senkouSpanBSeries: this.senkouSpanBSeries,
        ichimokuCloudSeries: this.ichimokuCloudSeries,
      };
    }
  }

  updateChartDataRealtime(candle: any): void {
    const chartCandle = {
      time: candle.t / 1000,
      open: Number(candle.o),
      high: Number(candle.h),
      low: Number(candle.l),
      close: Number(candle.c),
    };
    this.updateCurrentPrice(chartCandle.close);

    // Если новая свеча начинается, добавьте ее к данным и обновите график
    if (chartCandle.time > this.candles[this.candles.length - 1].time) {
      this.candles.push(chartCandle);
      this.candlestickSeries.update(chartCandle);
    } else if (chartCandle.time === this.candles[this.candles.length - 1].time) {
      // Иначе обновите последнюю свечу, если время совпадает
      this.candles[this.candles.length - 1] = chartCandle;
      this.candlestickSeries.update(chartCandle);
    }
  }

  removePriceLines(): void {
    this.tradeMarkers.forEach((tradeMarker) => {
      this.candlestickSeries.removePriceLine(tradeMarker.priceLine);
    });
  }

  addSavedTradeMarkers() {
    this.tradeMarkers.forEach(tradeMarker => {
      const lineOptions = {
        price: tradeMarker.options.price,
        color: tradeMarker.options.color,
        lineWidth: tradeMarker.options.lineWidth,
        lineStyle: tradeMarker.options.lineStyle,
      };
      tradeMarker.priceLine = this.candlestickSeries.createPriceLine(lineOptions);
    });
  }

  changeSymbol(newSymbol: string): void {
    this.symbol = newSymbol;
    this.fetchChartData();
    this.subscribeToRealtimeData();
    this.tradesService.updateCurrentPrice(this.symbol, this.timeframe);
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
      axisLabelColor: trade.tradeType === 'buy' ? '#00FF00' : '#FF0000',
      axisLabelTextColor: '#FFFFFF',
    };

    const priceLine = this.candlestickSeries.createPriceLine(priceLineOptions);
    this.tradeMarkers.push({priceLine, options: priceLineOptions});
  }

  removeTradeMarker(trade: Trade): void {
    const markerIndex = this.tradeMarkers.findIndex(
      (marker) => marker.options.price === trade.price && marker.options.axisLabelColor === (trade.tradeType === 'buy' ? '#00FF00' : '#FF0000')
    );
    if (markerIndex !== -1) {
      this.candlestickSeries.removePriceLine(this.tradeMarkers[markerIndex].priceLine);
      this.tradeMarkers.splice(markerIndex, 1);
    }
  }

  updateChartData(): void {
    this.chartDataSubscription?.unsubscribe();
    this.chartDataSubscription = this.tradesService
      .getChartData(this.symbol, this.timeframe)
      .subscribe(
        (chartData) => {
          this.candles = chartData;

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

  // Добавьте этот метод для обновления размеров графика при изменении размеров окна
  onWindowResize(): void {
    if (this.chart) {
      this.chart.resize(
        this.chartContainer.nativeElement.clientWidth,
        this.chartContainer.nativeElement.clientHeight
      );
    }
  }
}

