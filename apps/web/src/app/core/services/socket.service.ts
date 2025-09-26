import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket!: Socket;

  connect() {
    if (this.socket && this.socket.connected) return;
    this.socket = io(environment.wsUrl, { transports: ['websocket'] });
  }
  disconnect() {
    if (this.socket) this.socket.disconnect();
  }

  joinEvent(eventCode: string, role: 'PLAYER' | 'DJ' | 'ADMIN' | 'DISPLAY', teamId?: string) {
    this.socket.emit('join_event', { eventCode, role, teamId });
  }

  on<T>(event: string, handler: (data: T) => void) {
    this.socket.on(event, handler);
  }
  off(event: string, handler?: (...args: any[]) => void) {
    this.socket.off(event, handler as any);
  }

  emit<T>(event: string, payload: T) {
    this.socket.emit(event, payload);
  }
}
