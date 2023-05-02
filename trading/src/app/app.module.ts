import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { initializeApp,provideFirebaseApp } from '@angular/fire/app';
import { environment } from '../environments/environment';
import { provideAnalytics,getAnalytics,ScreenTrackingService,UserTrackingService } from '@angular/fire/analytics';
import { provideAuth,getAuth } from '@angular/fire/auth';
import { provideDatabase,getDatabase } from '@angular/fire/database';
import { provideFirestore,getFirestore } from '@angular/fire/firestore';
import { provideMessaging,getMessaging } from '@angular/fire/messaging';
import { provideStorage,getStorage } from '@angular/fire/storage';
import { ChartComponent } from './components/chart/chart.component';
import { TradeComponent } from './components/trade/trade.component';
import { CurrentTradeComponent } from './components/current-trade/current-trade.component';
import { CurrencyPairSelectorComponent } from './components/currency-pair-selector/currency-pair-selector.component';
import {HttpClientModule} from "@angular/common/http";
import { TradeFormComponent } from './components/trade-form/trade-form.component';
import {FormsModule} from "@angular/forms";
import { ActiveTradesComponent } from './components/active-trades/active-trades.component';
import { ToolbarComponent } from './components/toolbar/toolbar.component';
import { ChartNewComponent } from './components/chart-new/chart-new.component';

@NgModule({
  declarations: [
    AppComponent,
    ChartComponent,
    TradeComponent,
    CurrentTradeComponent,
    CurrencyPairSelectorComponent,
    TradeFormComponent,
    ActiveTradesComponent,
    ToolbarComponent,
    ChartNewComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAnalytics(() => getAnalytics()),
    provideAuth(() => getAuth()),
    provideDatabase(() => getDatabase()),
    provideFirestore(() => getFirestore()),
    provideMessaging(() => getMessaging()),
    provideStorage(() => getStorage()),
    FormsModule
  ],
  providers: [
    ScreenTrackingService,UserTrackingService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
