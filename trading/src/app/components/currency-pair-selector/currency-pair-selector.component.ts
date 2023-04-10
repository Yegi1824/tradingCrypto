import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CurrencyPairService } from '../../services/currency-pair.service';

@Component({
  selector: 'app-currency-pair-selector',
  templateUrl: './currency-pair-selector.component.html',
  styleUrls: ['./currency-pair-selector.component.scss'],
})
export class CurrencyPairSelectorComponent implements OnInit {
  @Output() selectedCurrencyPair = new EventEmitter<string>();
  currencyPairs: string[] = [];

  constructor(private currencyPairService: CurrencyPairService) {}

  ngOnInit(): void {
    this.currencyPairs = this.currencyPairService.getCurrencyPairs();
  }

  onSelectCurrencyPair(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const formattedPair = target.value.replace('/', ''); // Удаление символа разделителя
    this.selectedCurrencyPair.emit(formattedPair);
  }
}
