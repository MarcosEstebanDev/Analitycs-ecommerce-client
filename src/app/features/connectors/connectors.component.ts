import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth/auth.service';

export interface Connector {
  id: string;
  name: string;
  provider: string;
  isActive: boolean;
  externalId: string;
  lastSyncedAt: string | null;
  totalOrdersSync: number;
  totalOrders: number;
  lastOrderAt: string | null;
  minutesSinceSync: number | null;
  status: 'synced' | 'stale' | 'disconnected';
  createdAt: string;
}

@Component({
  selector: 'app-connectors',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule, MatIconModule, MatButtonModule, MatTooltipModule,
    MatProgressSpinnerModule, MatChipsModule, MatDividerModule, MatSnackBarModule,
    EmptyStateComponent,
  ],
  templateUrl: './connectors.component.html',
  styleUrls: ['./connectors.component.scss'],
})
export class ConnectorsComponent implements OnInit {
  private http    = inject(HttpClient);
  private auth    = inject(AuthService);
  private snack   = inject(MatSnackBar);

  connectors: Connector[] = [];
  loading = true;
  error = '';
  togglingId: string | null = null;

  private get headers() {
    const token = this.auth.getToken();
    const tid   = this.auth.getTenantId() ?? '';
    return { Authorization: `Bearer ${token}`, 'x-tenant-id': tid };
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error   = '';
    this.http.get<any>(`${environment.apiUrl}/dashboard/connectors`, { headers: this.headers })
      .subscribe({
        next: (res) => { this.connectors = res.data ?? []; this.loading = false; },
        error: (err) => { this.error = err.message || 'Error al cargar conectores'; this.loading = false; },
      });
  }

  toggle(c: Connector): void {
    this.togglingId = c.id;
    this.http.post<any>(
      `${environment.apiUrl}/dashboard/connectors/${c.id}/toggle`,
      {},
      { headers: this.headers },
    ).subscribe({
      next: (res) => {
        this.togglingId = null;
        this.snack.open(res.message ?? 'Estado actualizado', 'OK', { duration: 3000 });
        this.load();
      },
      error: () => {
        this.togglingId = null;
        this.snack.open('Error al actualizar', 'Cerrar', { duration: 3000 });
      },
    });
  }

  get syncedCount()       { return this.connectors.filter(c => c.status === 'synced').length; }
  get staleCount()        { return this.connectors.filter(c => c.status === 'stale').length; }
  get disconnectedCount() { return this.connectors.filter(c => c.status === 'disconnected').length; }

  providerIcon(provider: string): string {
    const map: Record<string, string> = {
      shopify:     'storefront',
      woocommerce: 'shopping_cart',
      custom:      'code',
    };
    return map[provider.toLowerCase()] ?? 'link';
  }

  providerColor(provider: string): string {
    const map: Record<string, string> = {
      shopify:     '#96bf48',
      woocommerce: '#7f54b3',
      custom:      '#6366f1',
    };
    return map[provider.toLowerCase()] ?? '#6b7280';
  }

  statusLabel(status: string): string {
    return { synced: 'Sincronizado', stale: 'Sin sincronizar', disconnected: 'Desconectado' }[status] ?? status;
  }

  statusIcon(status: string): string {
    return { synced: 'check_circle', stale: 'schedule', disconnected: 'cancel' }[status] ?? 'help';
  }

  statusColor(status: string): string {
    return { synced: '#10b981', stale: '#f59e0b', disconnected: '#ef4444' }[status] ?? '#9ca3af';
  }

  timeAgo(dateStr: string | null): string {
    if (!dateStr) return 'Nunca';
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'Hace un momento';
    if (m < 60) return `Hace ${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `Hace ${h} h`;
    return `Hace ${Math.floor(h / 24)} días`;
  }
}
