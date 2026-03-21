import { Injectable, inject, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';

export interface AppNotification {
  id: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  type: string;
  createdAt: string;
  isRead: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {
  private auth = inject(AuthService);
  private socket: Socket | null = null;

  private _notifications$ = new BehaviorSubject<AppNotification[]>([]);
  notifications$ = this._notifications$.asObservable();

  get unreadCount(): number {
    return this._notifications$.value.filter((n) => !n.isRead).length;
  }

  connect(): void {
    if (this.socket?.connected) return;
    const token = this.auth.getToken();
    if (!token) return;

    this.socket = io(`${environment.wsUrl}/notifications`, {
      auth: { token },
      transports: ['websocket'],
      reconnectionAttempts: 3,
    });

    this.socket.on('insight:new', (insight: any) => {
      const notif: AppNotification = {
        id: insight.id,
        message: insight.message,
        severity: insight.severity,
        type: insight.type,
        createdAt: insight.createdAt ?? new Date().toISOString(),
        isRead: false,
      };
      this._notifications$.next([notif, ...this._notifications$.value].slice(0, 20));
    });

    this.socket.on('alert:new', (alert: any) => {
      const notif: AppNotification = {
        id: alert.id ?? crypto.randomUUID(),
        message: alert.message,
        severity: alert.severity ?? 'warning',
        type: alert.type ?? 'alert',
        createdAt: new Date().toISOString(),
        isRead: false,
      };
      this._notifications$.next([notif, ...this._notifications$.value].slice(0, 20));
    });
  }

  markAllRead(): void {
    this._notifications$.next(this._notifications$.value.map((n) => ({ ...n, isRead: true })));
  }

  markRead(id: string): void {
    this._notifications$.next(
      this._notifications$.value.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
