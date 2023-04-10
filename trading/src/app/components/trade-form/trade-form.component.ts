import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {TradesService} from '../../services/trades.service';
import {filter, Observable, take} from "rxjs";

@Component({
  selector: 'app-trade-form',
  templateUrl: './trade-form.component.html',
  styleUrls: ['./trade-form.component.scss'],
})
export class TradeFormComponent implements OnInit {
  @Output() buySubmit = new EventEmitter<{ price, amount }>();
  @Output() sellSubmit = new EventEmitter<{ price, amount }>();
  amount: number;

  ngOnInit(): void {}

  constructor(private tradesService: TradesService) {}

  get currentPrice$(): Observable<number> {
    return this.tradesService.currentPrice$;
  }

  buy(): void {
    this.currentPrice$.pipe(take(1)).subscribe(price => {
      this.buySubmit.emit({price, amount: this.amount});
      this.amount = null;
    });
  }

  sell(): void {
    this.currentPrice$.pipe(take(1)).subscribe(price => {
      this.sellSubmit.emit({price, amount: this.amount});
      this.amount = null;
    });
  }
}
