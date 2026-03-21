import { Component, OnInit, OnDestroy, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Order {
  id: string;
  externalId: string;
  status: string;
  totalAmount: number;
  subtotal?: number;
  tax?: number;
  shipping?: number;
  discount?: number;
  currency: string;
  createdAt: string;
  customer?: { id: string; email: string; firstName?: string; lastName?: string };
  store?: { id: string; name: string; platform?: string };
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  productName: string;
  externalProductId?: string;
  price: number;
  quantity: number;
  lineTotal: number;
}

// ── Order Detail Dialog ────────────────────────────────────────────────
@Component({
  selector: 'app-order-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatTableModule,
  ],
  template: `
    <div class="od-dialog">
      <!-- Header -->
      <div class="od-header">
        <div class="od-header__left">
          <mat-icon class="od-header__icon">receipt_long</mat-icon>
          <div>
            <h2 class="od-title">Detalle de orden</h2>
            @if (order) {
              <code class="od-ext-id">{{ order.externalId }}</code>
            }
          </div>
        </div>
        @if (order) {
          <span [class]="'od-badge od-badge--' + order.status">
            {{ statusLabel(order.status) }}
          </span>
        }
        <button mat-icon-button class="od-close" (click)="dialogRef.close()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Loading -->
      @if (loading) {
        <div class="od-loading">
          <mat-spinner diameter="40"></mat-spinner>
          <span>Cargando detalle...</span>
        </div>
      }

      <!-- Error -->
      @if (error) {
        <div class="od-error">
          <mat-icon>error_outline</mat-icon>
          {{ error }}
        </div>
      }

      <!-- Content -->
      @if (order && !loading) {
        <div class="od-body">

          <!-- Summary row -->
          <div class="od-summary-grid">
            <div class="od-summary-item">
              <span class="od-summary-label">Total</span>
              <span class="od-summary-value od-summary-value--primary">
                {{ order.currency }} {{ order.totalAmount | number:'1.2-2' }}
              </span>
            </div>
            @if (order.subtotal != null) {
              <div class="od-summary-item">
                <span class="od-summary-label">Subtotal</span>
                <span class="od-summary-value">{{ order.currency }} {{ order.subtotal | number:'1.2-2' }}</span>
              </div>
            }
            @if (order.tax) {
              <div class="od-summary-item">
                <span class="od-summary-label">Impuestos</span>
                <span class="od-summary-value">{{ order.currency }} {{ order.tax | number:'1.2-2' }}</span>
              </div>
            }
            @if (order.shipping) {
              <div class="od-summary-item">
                <span class="od-summary-label">Envío</span>
                <span class="od-summary-value">{{ order.currency }} {{ order.shipping | number:'1.2-2' }}</span>
              </div>
            }
            @if (order.discount) {
              <div class="od-summary-item">
                <span class="od-summary-label">Descuento</span>
                <span class="od-summary-value od-summary-value--discount">−{{ order.currency }} {{ order.discount | number:'1.2-2' }}</span>
              </div>
            }
            <div class="od-summary-item">
              <span class="od-summary-label">Fecha</span>
              <span class="od-summary-value">{{ order.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
            </div>
          </div>

          <mat-divider></mat-divider>

          <!-- Customer + Store -->
          <div class="od-info-row">
            @if (order.customer) {
              <div class="od-info-card">
                <div class="od-info-card__header">
                  <mat-icon>person</mat-icon>
                  <strong>Cliente</strong>
                </div>
                <p class="od-info-name">{{ customerName(order) }}</p>
                <p class="od-info-sub">{{ order.customer.email }}</p>
              </div>
            }
            @if (order.store) {
              <div class="od-info-card">
                <div class="od-info-card__header">
                  <mat-icon>storefront</mat-icon>
                  <strong>Tienda</strong>
                </div>
                <p class="od-info-name">{{ order.store.name }}</p>
                @if (order.store.platform) {
                  <p class="od-info-sub">{{ order.store.platform }}</p>
                }
              </div>
            }
          </div>

          <mat-divider></mat-divider>

          <!-- Items -->
          @if (order.items && order.items.length > 0) {
            <div class="od-items">
              <h3 class="od-section-title">
                <mat-icon>inventory_2</mat-icon>
                Productos ({{ order.items.length }})
              </h3>
              <table class="od-items-table">
                <thead>
                  <tr>
                    <th class="col-product">Producto</th>
                    <th class="col-price">Precio unit.</th>
                    <th class="col-qty">Cant.</th>
                    <th class="col-total">Total</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of order.items; track item.id) {
                    <tr>
                      <td class="col-product">
                        <span class="item-name">{{ item.productName }}</span>
                        @if (item.externalProductId) {
                          <code class="item-sku">{{ item.externalProductId }}</code>
                        }
                      </td>
                      <td class="col-price">{{ order.currency }} {{ item.price | number:'1.2-2' }}</td>
                      <td class="col-qty">
                        <span class="qty-badge">×{{ item.quantity }}</span>
                      </td>
                      <td class="col-total">
                        <strong>{{ order.currency }} {{ item.lineTotal | number:'1.2-2' }}</strong>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <div class="od-no-items">
              <mat-icon>inventory_2</mat-icon>
              <span>Sin productos registrados</span>
            </div>
          }

        </div>
      }

      <!-- Footer -->
      <div class="od-footer">
        <button mat-stroked-button (click)="dialogRef.close()">Cerrar</button>
      </div>
    </div>
  `,
  styles: [`
    .od-dialog {
      min-width: 580px;
      max-width: 720px;
      display: flex;
      flex-direction: column;
      max-height: 90vh;
    }

    .od-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px 24px 16px;
      border-bottom: 1px solid #e5e7eb;
      flex-shrink: 0;
    }

    .od-header__left {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
    }

    .od-header__icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      color: #4f46e5;
    }

    .od-title {
      margin: 0 0 2px;
      font-size: 17px;
      font-weight: 700;
      color: #111827;
    }

    .od-ext-id {
      font-family: monospace;
      font-size: 12px;
      background: #f1f5f9;
      padding: 2px 6px;
      border-radius: 4px;
      color: #475569;
    }

    .od-close {
      margin-left: auto;
      flex-shrink: 0;
    }

    .od-badge {
      padding: 3px 12px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .od-badge--pending   { background: #f1f5f9; color: #475569; }
    .od-badge--confirmed { background: #eff6ff; color: #1d4ed8; }
    .od-badge--shipped   { background: #fff7ed; color: #c2410c; }
    .od-badge--delivered { background: #f0fdf4; color: #15803d; }
    .od-badge--cancelled { background: #fef2f2; color: #b91c1c; }
    .od-badge--refunded  { background: #faf5ff; color: #7e22ce; }

    .od-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 48px;
      color: #6b7280;
      font-size: 14px;
    }

    .od-error {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px 24px;
      background: #fef2f2;
      color: #b91c1c;
      font-size: 14px;
    }

    .od-body {
      padding: 20px 24px;
      overflow-y: auto;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .od-summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      gap: 12px;
    }

    .od-summary-item {
      background: #f8fafc;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .od-summary-label {
      font-size: 11px;
      font-weight: 600;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: .04em;
    }

    .od-summary-value {
      font-size: 15px;
      font-weight: 600;
      color: #1e293b;
    }
    .od-summary-value--primary { color: #4f46e5; font-size: 17px; }
    .od-summary-value--discount { color: #16a34a; }

    .od-info-row {
      display: flex;
      gap: 16px;
    }

    .od-info-card {
      flex: 1;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 14px 16px;
    }

    .od-info-card__header {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 8px;
      font-size: 13px;
      color: #6b7280;
    }

    .od-info-card__header mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .od-info-name {
      margin: 0 0 2px;
      font-size: 14px;
      font-weight: 600;
      color: #111827;
    }

    .od-info-sub {
      margin: 0;
      font-size: 13px;
      color: #6b7280;
    }

    .od-section-title {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 0 0 12px;
      font-size: 13px;
      font-weight: 600;
      color: #374151;

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: #9ca3af;
      }
    }

    .od-items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;

      thead tr {
        border-bottom: 2px solid #e5e7eb;
      }

      th {
        padding: 8px 10px;
        text-align: left;
        font-size: 11px;
        font-weight: 600;
        color: #9ca3af;
        text-transform: uppercase;
        letter-spacing: .04em;
      }

      tbody tr {
        border-bottom: 1px solid #f3f4f6;
        &:last-child { border-bottom: none; }
        &:hover { background: #f9fafb; }
      }

      td {
        padding: 10px 10px;
        color: #374151;
        vertical-align: middle;
      }
    }

    .col-product { width: 50%; }
    .col-price   { width: 18%; text-align: right; }
    .col-qty     { width: 10%; text-align: center; }
    .col-total   { width: 22%; text-align: right; }

    .item-name {
      display: block;
      font-weight: 500;
      color: #111827;
    }

    .item-sku {
      display: block;
      font-family: monospace;
      font-size: 11px;
      color: #94a3b8;
      margin-top: 2px;
    }

    .qty-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: #f1f5f9;
      color: #475569;
      font-weight: 600;
      font-size: 12px;
      padding: 2px 8px;
      border-radius: 6px;
    }

    .od-no-items {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 24px;
      color: #9ca3af;
      font-size: 13px;
      background: #f9fafb;
      border-radius: 8px;
      border: 1px dashed #e5e7eb;

      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }

    .od-footer {
      padding: 12px 24px 16px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: flex-end;
      flex-shrink: 0;
    }

    @media (max-width: 640px) {
      .od-dialog { min-width: unset; width: 100vw; }
      .od-info-row { flex-direction: column; }
    }
  `],
})
export class OrderDetailDialogComponent {
  dialogRef = inject(MatDialogRef<OrderDetailDialogComponent>);
  private http = inject(HttpClient);

  order: Order | null = null;
  loading = true;
  error = '';

  constructor(@Inject(MAT_DIALOG_DATA) public data: { orderId: string }) {
    this.http
      .get<{ success: boolean; data: Order }>(`${environment.apiUrl}/orders/${data.orderId}`)
      .subscribe({
        next: (res) => { this.order = res.data; this.loading = false; },
        error: (err) => {
          this.error = err?.error?.message ?? 'Error al cargar el detalle';
          this.loading = false;
        },
      });
  }

  customerName(order: Order): string {
    if (!order.customer) return '—';
    const name = `${order.customer.firstName ?? ''} ${order.customer.lastName ?? ''}`.trim();
    return name || order.customer.email || '—';
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      pending: 'Pendiente', confirmed: 'Confirmado', shipped: 'Enviado',
      delivered: 'Entregado', cancelled: 'Cancelado', refunded: 'Reembolsado',
    };
    return map[status] ?? status;
  }
}

// ── Orders List Component ──────────────────────────────────────────────
@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule,
  ],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss'],
})
export class OrdersComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private dialog = inject(MatDialog);
  private base = `${environment.apiUrl}/orders`;

  displayedColumns = ['externalId', 'customer', 'amount', 'status', 'currency', 'createdAt', 'actions'];
  dataSource: Order[] = [];
  total = 0;
  pageSize = 20;
  pageIndex = 0;
  loading = false;
  error = '';

  filterStatus = '';
  searchQuery = '';

  statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'pending', label: 'Pendiente' },
    { value: 'confirmed', label: 'Confirmado' },
    { value: 'shipped', label: 'Enviado' },
    { value: 'delivered', label: 'Entregado' },
    { value: 'cancelled', label: 'Cancelado' },
    { value: 'refunded', label: 'Reembolsado' },
  ];

  private searchSubject = new Subject<string>();
  private subs = new Subscription();

  ngOnInit(): void {
    this.subs.add(
      this.searchSubject.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => {
        this.pageIndex = 0;
        this.loadOrders();
      }),
    );
    this.loadOrders();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  loadOrders(): void {
    this.loading = true;
    this.error = '';

    let params = new HttpParams()
      .set('page', String(this.pageIndex + 1))
      .set('limit', String(this.pageSize));

    if (this.filterStatus) params = params.set('status', this.filterStatus);
    if (this.searchQuery) params = params.set('search', this.searchQuery);

    this.http
      .get<{ success: boolean; data: { orders: Order[]; total: number; page: number; limit: number; pages: number } }>(
        this.base,
        { params },
      )
      .subscribe({
        next: (res) => {
          this.dataSource = res.data?.orders ?? [];
          this.total = res.data?.total ?? 0;
          this.loading = false;
        },
        error: (err) => {
          this.error = err?.error?.message ?? 'Error al cargar órdenes';
          this.loading = false;
        },
      });
  }

  onSearchChange(value: string): void {
    this.searchSubject.next(value);
  }

  onStatusChange(): void {
    this.pageIndex = 0;
    this.loadOrders();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadOrders();
  }

  exportCsv(): void {
    let params = new HttpParams();
    if (this.filterStatus) params = params.set('status', this.filterStatus);
    if (this.searchQuery) params = params.set('search', this.searchQuery);

    const url = `${this.base}/export?${params.toString()}`;
    const token = localStorage.getItem('access_token');
    this.http.get(url, { responseType: 'blob', headers: { Authorization: `Bearer ${token}` } }).subscribe({
      next: (blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'orders.csv';
        a.click();
        URL.revokeObjectURL(a.href);
      },
    });
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      pending: 'badge--gray',
      confirmed: 'badge--blue',
      shipped: 'badge--orange',
      delivered: 'badge--green',
      cancelled: 'badge--red',
      refunded: 'badge--purple',
    };
    return `badge ${map[status] ?? 'badge--gray'}`;
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      pending: 'Pendiente',
      confirmed: 'Confirmado',
      shipped: 'Enviado',
      delivered: 'Entregado',
      cancelled: 'Cancelado',
      refunded: 'Reembolsado',
    };
    return map[status] ?? status;
  }

  customerName(order: Order): string {
    if (!order.customer) return '—';
    const name = `${order.customer.firstName ?? ''} ${order.customer.lastName ?? ''}`.trim();
    return name || order.customer.email || '—';
  }

  openDetail(order: Order): void {
    this.dialog.open(OrderDetailDialogComponent, {
      data: { orderId: order.id },
      maxWidth: '720px',
      width: '95vw',
      maxHeight: '90vh',
      panelClass: 'order-detail-panel',
    });
  }
}
