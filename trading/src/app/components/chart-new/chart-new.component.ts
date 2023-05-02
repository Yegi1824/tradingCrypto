import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
/*import * as am4core from '@amcharts/amcharts4/core';
import * as am4charts from '@amcharts/amcharts4/charts';
import am4themes_animated from '@amcharts/amcharts4/themes/animated';*/
import {Subscription} from "rxjs";
import {TradesService} from "../../services/trades.service";

// am4core.useTheme(am4themes_animated);


@Component({
  selector: 'app-chart-new',
  templateUrl: './chart-new.component.html',
  styleUrls: ['./chart-new.component.scss']
})
export class ChartNewComponent implements OnInit, AfterViewInit {
  realtimeDataSubscription: Subscription | null = null;

  @ViewChild('chartDiv') chartDiv: ElementRef;

  // private chart: am4charts.XYChart;

  constructor(private tradesService: TradesService) {}

  ngOnInit(): void {}

  ngAfterViewInit() {
    /*this.subscribeToRealtimeData();
    this.chart = am4core.create(this.chartDiv.nativeElement, am4charts.XYChart);

    // Здесь вы можете добавить свои данные
    this.chart.data = [
      {
        date: new Date(2021, 5, 1),
        open: 100,
        close: 110,
        high: 115,
        low: 95,
      },
      {
        date: new Date(2021, 5, 2),
        open: 110,
        close: 120,
        high: 125,
        low: 105,
      },{
        date: new Date(2021, 5, 3),
        open: 110,
        close: 80,
        high: 125,
        low: 70,
      },
      {
        date: new Date(2021, 5, 4),
        open: 80,
        close: 86,
        high: 150,
        low: 40,
      },
      {
        date: new Date(2021, 5, 5),
        open: 86,
        close: 25,
        high: 86,
        low: 15,
      },{

        date: new Date(2021, 5, 6),
        open: 25,
        close: 150,
        high: 190,
        low: 25,
      },
      {
        date: new Date(2021, 5, 7),
        open: 100,
        close: 110,
        high: 115,
        low: 95,
      },
      {
        date: new Date(2021, 5, 8),
        open: 110,
        close: 120,
        high: 125,
        low: 105,
      },{
        date: new Date(2021, 5, 9),
        open: 110,
        close: 80,
        high: 125,
        low: 70,
      },
      {
        date: new Date(2021, 5, 10),
        open: 80,
        close: 86,
        high: 150,
        low: 40,
      },
      {
        date: new Date(2021, 5, 11),
        open: 86,
        close: 25,
        high: 86,
        low: 15,
      },{

        date: new Date(2021, 5, 12),
        open: 25,
        close: 150,
        high: 190,
        low: 25,
      },
      {
        date: new Date(2021, 5, 13),
        open: 100,
        close: 110,
        high: 115,
        low: 95,
      },
      {
        date: new Date(2021, 5, 14),
        open: 110,
        close: 120,
        high: 125,
        low: 105,
      },{
        date: new Date(2021, 5, 15),
        open: 110,
        close: 80,
        high: 125,
        low: 70,
      },
      {
        date: new Date(2021, 5, 16),
        open: 80,
        close: 86,
        high: 150,
        low: 40,
      },
      {
        date: new Date(2021, 5, 17),
        open: 86,
        close: 25,
        high: 86,
        low: 15,
      },{

        date: new Date(2021, 5, 18),
        open: 25,
        close: 150,
        high: 190,
        low: 25,
      },
      {
        date: new Date(2021, 5, 19),
        open: 100,
        close: 110,
        high: 115,
        low: 95,
      },
      {
        date: new Date(2021, 5, 20),
        open: 110,
        close: 120,
        high: 125,
        low: 105,
      },{
        date: new Date(2021, 5, 21),
        open: 110,
        close: 80,
        high: 125,
        low: 70,
      },
      {
        date: new Date(2021, 5, 22),
        open: 80,
        close: 86,
        high: 150,
        low: 40,
      },
      {
        date: new Date(2021, 5, 23),
        open: 86,
        close: 25,
        high: 86,
        low: 15,
      },{

        date: new Date(2021, 5, 24),
        open: 25,
        close: 150,
        high: 190,
        low: 25,
      },
      {
        date: new Date(2021, 5, 25),
        open: 100,
        close: 110,
        high: 115,
        low: 95,
      },
      {
        date: new Date(2021, 5, 26),
        open: 110,
        close: 120,
        high: 125,
        low: 105,
      },{
        date: new Date(2021, 5, 27),
        open: 110,
        close: 80,
        high: 125,
        low: 70,
      },
      {
        date: new Date(2021, 5, 28),
        open: 80,
        close: 86,
        high: 150,
        low: 40,
      },
      {
        date: new Date(2021, 5, 29),
        open: 86,
        close: 25,
        high: 86,
        low: 15,
      },{

        date: new Date(2021, 5, 30),
        open: 25,
        close: 150,
        high: 190,
        low: 25,
      },
      {
        date: new Date(2021, 6, 1),
        open: 100,
        close: 110,
        high: 115,
        low: 95,
      },
      {
        date: new Date(2021, 6, 2),
        open: 110,
        close: 120,
        high: 125,
        low: 105,
      },{
        date: new Date(2021, 6, 3),
        open: 110,
        close: 80,
        high: 125,
        low: 70,
      },
      {
        date: new Date(2021, 6, 4),
        open: 80,
        close: 86,
        high: 150,
        low: 40,
      },
      {
        date: new Date(2021, 6, 5),
        open: 86,
        close: 25,
        high: 86,
        low: 15,
      },{

        date: new Date(2021, 6, 6),
        open: 25,
        close: 150,
        high: 190,
        low: 25,
      },
      {
        date: new Date(2021, 6, 7),
        open: 100,
        close: 110,
        high: 115,
        low: 95,
      },
      {
        date: new Date(2021, 6, 8),
        open: 110,
        close: 120,
        high: 125,
        low: 105,
      },{
        date: new Date(2021, 6, 9),
        open: 110,
        close: 80,
        high: 125,
        low: 70,
      },
      {
        date: new Date(2021, 6, 10),
        open: 80,
        close: 86,
        high: 150,
        low: 40,
      },
      {
        date: new Date(2021, 6, 11),
        open: 86,
        close: 25,
        high: 86,
        low: 15,
      },{

        date: new Date(2021, 6, 12),
        open: 25,
        close: 150,
        high: 190,
        low: 25,
      },
      {
        date: new Date(2021, 6, 13),
        open: 100,
        close: 110,
        high: 115,
        low: 95,
      },
      {
        date: new Date(2021, 6, 14),
        open: 110,
        close: 120,
        high: 125,
        low: 105,
      },{
        date: new Date(2021, 6, 15),
        open: 110,
        close: 80,
        high: 125,
        low: 70,
      },
      {
        date: new Date(2021, 6, 16),
        open: 80,
        close: 86,
        high: 150,
        low: 40,
      },
      {
        date: new Date(2021, 6, 17),
        open: 86,
        close: 25,
        high: 86,
        low: 15,
      },{

        date: new Date(2021, 6, 18),
        open: 25,
        close: 150,
        high: 190,
        low: 25,
      },{
        date: new Date(2021, 6, 19),
        open: 100,
        close: 110,
        high: 115,
        low: 95,
      },
      {
        date: new Date(2021, 6, 20),
        open: 110,
        close: 120,
        high: 125,
        low: 105,
      },{
        date: new Date(2021, 6, 21),
        open: 110,
        close: 80,
        high: 125,
        low: 70,
      },
      {
        date: new Date(2021, 6, 22),
        open: 80,
        close: 86,
        high: 150,
        low: 40,
      },
      {
        date: new Date(2021, 6, 23),
        open: 86,
        close: 25,
        high: 86,
        low: 15,
      }, {

        date: new Date(2021, 6, 24),
        open: 25,
        close: 150,
        high: 190,
        low: 25,
      }
      // ...
    ];

    // Создайте серию для свечей
    let candlestickSeries = this.chart.series.push(new am4charts.CandlestickSeries());
    candlestickSeries.dataFields.dateX = 'date';
    candlestickSeries.groupFields.valueY = 'close';
    candlestickSeries.groupFields.openValueY = 'open';
    candlestickSeries.groupFields.lowValueY = 'low';
    candlestickSeries.groupFields.highValueY = 'high';
    candlestickSeries.tooltipText = 'Open: {openValueY}\nClose: {valueY}\nHigh: {highValueY}\nLow: {lowValueY}';

    // Добавьте курсор
    this.chart.cursor = new am4charts.XYCursor();

    // Создайте оси
    let dateAxis = this.chart.xAxes.push(new am4charts.DateAxis());
    let valueAxis = this.chart.yAxes.push(new am4charts.ValueAxis());

    dateAxis.baseInterval = {
      timeUnit: 'minute',
      count: 1,
    };
    dateAxis.dateFormats.setKey('minute', 'HH:mm');
    dateAxis.periodChangeDateFormats.setKey('minute', 'HH:mm');
    dateAxis.groupData = true;
    dateAxis.groupCount = 1000; // Установите подходящее количество групп для вашего графика

    interface MyGroupField {
      [index: string]: (group: any) => number;
    }

    const myGroupFields: MyGroupField = {
      valueY: group => {
        let sum = 0;
        let count = 0;
        group.values.forEach(value => {
          sum += value.value * value.count;
          count += value.count;
        });
        return sum / count;
      },
      openValueY: group => {
        return group.values[0].value;
      },
      lowValueY: group => {
        return Math.min(...group.values.map(value => value.value));
      },
      highValueY: group => {
        return Math.max(...group.values.map(value => value.value));
      },
    };

    candlestickSeries.groupFields = { ...candlestickSeries.groupFields, ...myGroupFields };*/
  }

  subscribeToRealtimeData(): void {
    /*this.realtimeDataSubscription?.unsubscribe();
    this.tradesService.subscribeToRealtimeData('BTCUSDT', '1m');*/
  }

  ngOnDestroy() {
    /*if (this.chart) {
      this.chart.dispose();
    }*/
  }

}
