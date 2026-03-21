import { Component, inject, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
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

/** ─── Add Connector Dialog ─────────────────────────────────── */
@Component({
  selector: 'app-add-connector-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatButtonToggleModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>add_link</mat-icon>
      Nueva conexión
    </h2>

    <mat-dialog-content>
      <div class="platform-toggle-wrap">
        <mat-button-toggle-group [(ngModel)]="platform" class="platform-toggle">
          <mat-button-toggle value="shopify">
            <mat-icon>storefront</mat-icon> Shopify
          </mat-button-toggle>
          <mat-button-toggle value="woocommerce">
            <mat-icon>shopping_cart</mat-icon> WooCommerce
          </mat-button-toggle>
        </mat-button-toggle-group>
      </div>

      @if (platform === 'shopify') {
        <form [formGroup]="shopifyForm" class="conn-form">
          <mat-form-field appearance="outline">
            <mat-label>Dominio de la tienda</mat-label>
            <input matInput formControlName="shopDomain" placeholder="mi-tienda.myshopify.com">
            <mat-hint>Dominio sin https://</mat-hint>
            @if (shopifyForm.get('shopDomain')?.hasError('required') && shopifyForm.get('shopDomain')?.touched) {
              <mat-error>El dominio es requerido</mat-error>
            }
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Access Token</mat-label>
            <input matInput formControlName="accessToken" type="password" placeholder="shpat_...">
            @if (shopifyForm.get('accessToken')?.hasError('required') && shopifyForm.get('accessToken')?.touched) {
              <mat-error>El access token es requerido</mat-error>
            }
          </mat-form-field>
        </form>
      }

      @if (platform === 'woocommerce') {
        <form [formGroup]="wooForm" class="conn-form">
          <mat-form-field appearance="outline">
            <mat-label>URL de la tienda</mat-label>
            <input matInput formControlName="siteUrl" placeholder="https://mi-tienda.com">
            @if (wooForm.get('siteUrl')?.hasError('required') && wooForm.get('siteUrl')?.touched) {
              <mat-error>La URL es requerida</mat-error>
            }
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Consumer Key</mat-label>
            <input matInput formControlName="consumerKey" placeholder="ck_...">
            @if (wooForm.get('consumerKey')?.hasError('required') && wooForm.get('consumerKey')?.touched) {
              <mat-error>El Consumer Key es requerido</mat-error>
            }
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Consumer Secret</mat-label>
            <input matInput formControlName="consumerSecret" type="password" placeholder="cs_...">
            @if (wooForm.get('consumerSecret')?.hasError('required') && wooForm.get('consumerSecret')?.touched) {
              <mat-error>El Consumer Secret es requerido</mat-error>
            }
          </mat-form-field>
        </form>
      }

      @if (error) {
        <div class="dlg-error">
          <mat-icon>error_outline</mat-icon> {{ error }}
        </div>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close [disabled]="saving">Cancelar</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="saving || currentFormInvalid">
        @if (saving) {
          <mat-spinner diameter="16" />
        } @else {
          <mat-icon>save</mat-icon>
          Conectar
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2 { display: flex; align-items: center; gap: 8px; }
    .platform-toggle-wrap { margin-bottom: 20px; }
    .platform-toggle { width: 100%; }
    .platform-toggle mat-button-toggle { flex: 1; }
    .conn-form { display: flex; flex-direction: column; gap: 4px; min-width: 360px; }
    .conn-form mat-form-field { width: 100%; }
    .dlg-error { display: flex; align-items: center; gap: 6px; color: #f44336; font-size: 14px; margin-top: 8px; }
    mat-dialog-content { overflow-y: auto; max-height: 60vh; }
  `],
})
export class AddConnectorDialogComponent {
  private http  = inject(HttpClient);
  private auth  = inject(AuthService);
  private ref   = inject(MatDialogRef<AddConnectorDialogComponent>);
  private fb    = inject(FormBuilder);

  platform: 'shopify' | 'woocommerce' = 'shopify';
  saving = false;
  error = '';

  shopifyForm = this.fb.group({
    shopDomain:  ['', Validators.required],
    accessToken: ['', Validators.required],
  });

  wooForm = this.fb.group({
    siteUrl:        ['', Validators.required],
    consumerKey:    ['', Validators.required],
    consumerSecret: ['', Validators.required],
  });

  get currentFormInvalid(): boolean {
    return this.platform === 'shopify'
      ? this.shopifyForm.invalid
      : this.wooForm.invalid;
  }

  private get headers() {
    const token = this.auth.getToken();
    const tid   = this.auth.getTenantId() ?? '';
    return { Authorization: `Bearer ${token}`, 'x-tenant-id': tid };
  }

  save(): void {
    if (this.currentFormInvalid) return;
    this.saving = true;
    this.error  = '';

    const url = this.platform === 'shopify'
      ? `${environment.apiUrl}/connectors/shopify/connect-store`
      : `${environment.apiUrl}/connectors/woo/connect-store`;

    const body = this.platform === 'shopify'
      ? this.shopifyForm.value
      : this.wooForm.value;

    this.http.post<any>(url, body, { headers: this.headers }).subscribe({
      next: (res) => {
        this.saving = false;
        if (res.success) {
          this.ref.close(true);
        } else {
          this.error = res.error ?? 'Error al conectar la tienda';
        }
      },
      error: (err) => {
        this.saving = false;
        this.error = err?.error?.message ?? err?.message ?? 'Error al conectar la tienda';
      },
    });
  }
}

/** ─── Confirm Delete Dialog ───────────────────────────────── */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>
      <mat-icon color="warn">warning</mat-icon>
      Eliminar conector
    </h2>
    <mat-dialog-content>
      <p>¿Estás seguro de que querés eliminar <strong>{{ data.name }}</strong>?</p>
      <p style="color:#6b7280;font-size:13px">Esta acción no se puede deshacer. Las órdenes y clientes ya importados no se eliminarán.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="warn" [mat-dialog-close]="true">
        <mat-icon>delete</mat-icon> Eliminar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`h2 { display: flex; align-items: center; gap: 8px; }`],
})
export class ConfirmDeleteDialogComponent {
  data = inject<{ name: string }>(MAT_DIALOG_DATA);
}

/** ─── Connectors Page ────────────────────────────────────── */
@Component({
  selector: 'app-connectors',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule, MatIconModule, MatButtonModule, MatTooltipModule,
    MatProgressSpinnerModule, MatChipsModule, MatDividerModule, MatSnackBarModule,
    MatDialogModule,
    EmptyStateComponent,
  ],
  templateUrl: './connectors.component.html',
  styleUrls: ['./connectors.component.scss'],
})
export class ConnectorsComponent implements OnInit {
  private http    = inject(HttpClient);
  private auth    = inject(AuthService);
  private snack   = inject(MatSnackBar);
  private dialog  = inject(MatDialog);

  connectors: Connector[] = [];
  loading = true;
  error = '';
  togglingId: string | null = null;
  deletingId: string | null = null;

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

  openAddDialog(): void {
    const ref = this.dialog.open(AddConnectorDialogComponent, {
      width: '480px',
      disableClose: true,
    });
    ref.afterClosed().subscribe((added) => {
      if (added) {
        this.snack.open('Tienda conectada exitosamente', 'OK', { duration: 3000 });
        this.load();
      }
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

  confirmDelete(c: Connector): void {
    const ref = this.dialog.open(ConfirmDeleteDialogComponent, {
      data: { name: c.name },
      width: '400px',
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) this.deleteConnector(c);
    });
  }

  private deleteConnector(c: Connector): void {
    this.deletingId = c.id;
    this.http.delete<any>(
      `${environment.apiUrl}/dashboard/connectors/${c.id}`,
      { headers: this.headers },
    ).subscribe({
      next: (res) => {
        this.deletingId = null;
        if (res.success) {
          this.snack.open(`${c.name} eliminado`, 'OK', { duration: 3000 });
          this.load();
        } else {
          this.snack.open(res.error ?? 'Error al eliminar', 'Cerrar', { duration: 3000 });
        }
      },
      error: () => {
        this.deletingId = null;
        this.snack.open('Error al eliminar el conector', 'Cerrar', { duration: 3000 });
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

