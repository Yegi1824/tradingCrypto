import { Component, OnInit } from '@angular/core';
import { Trade, TradesService } from '../../services/trades.service';

@Component({
  selector: 'app-active-trades',
  templateUrl: './active-trades.component.html',
  styleUrls: ['./active-trades.component.scss']
})
export class ActiveTradesComponent implements OnInit {

  constructor(private tradesService: TradesService) { }

  activeTrades: Trade[] = [];

  ngOnInit() {
    this.getActiveTrades();
  }

  getActiveTrades() {
    this.activeTrades = this.tradesService.getActiveTrades();
  }

  closeTrade(trade: Trade) {
    this.tradesService.closeTrade(trade);
    this.getActiveTrades();
  }
}
