import { io } from 'socket.io-client';
import { Subject } from 'rxjs';

export class SocketClient {
  private socket: any;
  private realtimeDataSubject = new Subject<any>();

  constructor() {
    this.socket = io('http://localhost:3001');
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
}
