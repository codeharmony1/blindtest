import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket!: Socket;
  private connectionCount = 0;

  connect() {
    if (this.socket && this.socket.connected) {
      this.connectionCount++;
      console.log('[SocketService] Reusing existing connection, count:', this.connectionCount);
      return;
    }
    console.log('[SocketService] Creating new connection to:', environment.wsUrl);
    this.socket = io(environment.wsUrl, { transports: ['websocket'] });
    this.connectionCount = 1;

    this.socket.on('connect', () => {
      console.log('[SocketService] Connected with socket ID:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[SocketService] Disconnected. Reason:', reason);
    });
  }
  disconnect() {
    this.connectionCount = Math.max(0, this.connectionCount - 1);
    console.log('[SocketService] Disconnect called, remaining connections:', this.connectionCount);
    // Ne déconnecter que si plus aucun composant n'utilise la connexion
    if (this.connectionCount === 0 && this.socket) {
      console.log('[SocketService] Actually disconnecting socket');
      this.socket.disconnect();
    }
  }

  joinEvent(eventCode: string, role: 'PLAYER' | 'DJ' | 'ADMIN' | 'DISPLAY', teamId?: string) {
    console.log('[SocketService] Joining event:', { eventCode, role, teamId });
    this.socket.emit('join_event', { eventCode, role, teamId });

    // Écouter la confirmation de join
    this.socket.once('joined', (data: any) => {
      console.log('[SocketService] Successfully joined room:', data);
    });
  }

  on<T>(event: string, handler: (data: T) => void) {
    console.log('[SocketService] Registering handler for event:', event);
    if (!this.socket) {
      console.warn('[SocketService] Socket not connected. Call connect() first.');
      return;
    }
    this.socket.on(event, handler);
  }
  off(event: string, handler?: (...args: any[]) => void) {
    console.log('[SocketService] Removing handler for event:', event);
    if (!this.socket) {
      console.warn('[SocketService] Socket not connected.');
      return;
    }
    this.socket.off(event, handler as any);
  }

  emit<T>(event: string, payload: T) {
    console.log('[SocketService] Emitting event:', event, 'with payload:', payload);
    if (!this.socket) {
      console.warn('[SocketService] Socket not connected. Call connect() first.');
      return;
    }
    this.socket.emit(event, payload);
  }
}
