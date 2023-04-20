import { io } from 'socket.io-client';
import { Subject } from 'rxjs';

export class SocketClient {
  private socket: any;
  private realtimeDataSubject = new Subject<any>();
  private priceChangeSubject = new Subject<number>(); // добавьте новый Subject для priceChange

  constructor() {
    this.socket = io('http://localhost:3001');

    this.socket.on('priceChange', (data) => {
      console.log('Received new priceChange:', data.priceChange);
      this.priceChangeSubject.next(parseFloat(data.priceChange));
    });
  }

  on(eventName: string, callback: (data: any) => void): void {
    this.socket.on(eventName, callback);
  }

  emit(eventName: string, data: any): void {
    this.socket.emit(eventName, data);
  }

  // Добавьте этот метод для получения Observable
  getRealtimeData$() {
    return this.realtimeDataSubject.asObservable();
  }

  // Добавьте этот метод для обновления данных и отправки их в компонент
  updateRealtimeData(data: any) {
    this.realtimeDataSubject.next(data);
  }

  // Добавьте этот метод для получения Observable для priceChange
  getPriceChange$() {
    return this.priceChangeSubject.asObservable();
  }
}
