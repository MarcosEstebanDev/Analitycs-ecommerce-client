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
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Customer {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  lifetimeValue: number;
  totalOrders: number;
  totalQuantity?: number;
  lastOrderAt?: string;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  productTitle: string;
  quantity: number;
  price: number;
  sku?: string;
}

export interface Order {
  id: string;
  total: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

@Component({
  selector: 'app-customer-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <div class="header-content">
          <div class="avatar-large" [style.background]="avatarColor(customer)">
            {{ getInitials(customer) }}
          </div>
          <div class="header-info">
            <h2>{{ fullName(customer) }}</h2>
            <span class="email">{{ customer.email ?? '—' }}</span>
          </div>
        </div>
        <button mat-icon-button (click)="dialogRef.close()" class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      @if (loading) {
        <div class="loading-state">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else {
        <div class="metrics-row">
          <div class="metric-card">
            <span class="metric-label">LTV</span>
            <span class="metric-value ltv">{{ metrics?.ltv | currency:'USD':'symbol':'1.2-2' }}</span>
          </div>
          <div class="metric-card">
            <span class="metric-label">Total Órdenes</span>
            <span class="metric-value orders">{{ metrics?.totalOrders }}</span>
          </div>
          <div class="metric-card">
            <span class="metric-label">AOV</span>
            <span class="metric-value aov">{{ metrics?.aov | currency:'USD':'symbol':'1.2-2' }}</span>
          </div>
        </div>

        <div class="orders-section">
          <h3 class="section-title">Órdenes recientes</h3>
          @if (recentOrders.length === 0) {
            <div class="empty-state">
              <mat-icon>receipt_long</mat-icon>
              <p>No hay órdenes registradas</p>
            </div>
          } @else {
            <table mat-table [dataSource]="recentOrders" class="orders-table">
              <ng-container matColumnDef="date">
                <th mat-header-cell *matHeaderCellDef>Fecha</th>
                <td mat-cell *matCellDef="let row">{{ row.createdAt | date:'dd/MM/yyyy' }}</td>
              </ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Estado</th>
                <td mat-cell *matCellDef="let row">
                  <span class="status-badge" [class]="'status-' + row.status?.toLowerCase()">{{ row.status }}</span>
                </td>
              </ng-container>
              <ng-container matColumnDef="total">
                <th mat-header-cell *matHeaderCellDef>Total</th>
                <td mat-cell *matCellDef="let row">{{ row.total | currency:'USD':'symbol':'1.2-2' }}</td>
              </ng-container>
              <ng-container matColumnDef="items">
                <th mat-header-cell *matHeaderCellDef>Items</th>
                <td mat-cell *matCellDef="let row">{{ row.items?.length ?? 0 }}</td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="orderColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: orderColumns;"></tr>
            </table>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    :host-context(.dark-theme) .dialog-container { background: #1e1e2e; color: #e0e0e0; }
    :host-context(.dark-theme) .metric-card { background: #2a2a3e; }
    :host-context(.dark-theme) .status-badge { background: #3a3a50; }
    .dialog-container { padding: 0; min-width: 500px; }
    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 24px 24px 16px;
      border-bottom: 1px solid rgba(0,0,0,0.08);
    }
    .header-content { display: flex; align-items: center; gap: 16px; }
    .avatar-large {
      width: 64px; height: 64px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 24px; font-weight: 700; color: white;
      flex-shrink: 0;
    }
    .header-info h2 { margin: 0 0 4px; font-size: 20px; font-weight: 600; }
    .header-info .email { font-size: 14px; color: #666; }
    .loading-state { display: flex; justify-content: center; padding: 40px; }
    .metrics-row {
      display: flex; gap: 16px; padding: 20px 24px;
      border-bottom: 1px solid rgba(0,0,0,0.06);
    }
    .metric-card {
      flex: 1; padding: 16px; border-radius: 12px;
      background: #f8f9fa; text-align: center;
    }
    .metric-label { display: block; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
    .metric-value { font-size: 20px; font-weight: 700; }
    .metric-value.ltv { color: #667eea; }
    .metric-value.orders { color: #43e97b; }
    .metric-value.aov { color: #f093fb; }
    .orders-section { padding: 16px 24px 24px; }
    .section-title { margin: 0 0 12px; font-size: 16px; font-weight: 600; }
    .orders-table { width: 100%; }
    .status-badge {
      padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 500;
      background: #e0e0e0;
    }
    .status-completed, .status-delivered { background: #e8f5e9; color: #2e7d32; }
    .status-pending { background: #fff3e0; color: #e65100; }
    .status-cancelled { background: #ffebee; color: #c62828; }
    .empty-state {
      text-align: center; padding: 32px; color: #aaa;
      display: flex; flex-direction: column; align-items: center; gap: 8px;
    }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
  `],
})
export class CustomerDetailDialogComponent implements OnInit {
  private http = inject(HttpClient);
  orderColumns = ['date', 'status', 'total', 'items'];
  recentOrders: Order[] = [];
  metrics: { ltv: number; totalOrders: number; aov: number } | null = null;
  loading = true;

  constructor(
    public dialogRef: MatDialogRef<CustomerDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public customer: Customer,
  ) {}

  ngOnInit(): void {
    this.http
      .get<{ success: boolean; data: { recentOrders: Order[]; metrics: { ltv: number; totalOrders: number; aov: number } } }>(
        `${environment.apiUrl}/customers/${this.customer.id}`,
      )
      .subscribe({
        next: (res) => {
          this.recentOrders = res.data?.recentOrders ?? [];
          this.metrics = res.data?.metrics ?? null;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  getInitials(customer: Customer): string {
    const f = (customer.firstName ?? '').charAt(0).toUpperCase();
    const l = (customer.lastName ?? '').charAt(0).toUpperCase();
    if (f || l) return `${f}${l}`;
    return (customer.email ?? '?').charAt(0).toUpperCase();
  }

  fullName(customer: Customer): string {
    const name = `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim();
    return name || '—';
  }

  avatarColor(customer: Customer): string {
    const colors = [
      'linear-gradient(135deg, #667eea, #764ba2)',
      'linear-gradient(135deg, #f093fb, #f5576c)',
      'linear-gradient(135deg, #4facfe, #00f2fe)',
      'linear-gradient(135deg, #43e97b, #38f9d7)',
      'linear-gradient(135deg, #fa709a, #fee140)',
      'linear-gradient(135deg, #a18cd1, #fbc2eb)',
    ];
    const idx = (customer.email?.charCodeAt(0) ?? 0) % colors.length;
    return colors[idx];
  }
}

@Component({
  selector: 'app-customers',
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
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.scss'],
})
export class CustomersComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private dialog = inject(MatDialog);
  private base = `${environment.apiUrl}/customers`;

  displayedColumns = ['avatar', 'email', 'name', 'ltv', 'orders', 'lastOrder', 'createdAt', 'actions'];
  dataSource: Customer[] = [];
  total = 0;
  pageSize = 20;
  pageIndex = 0;
  loading = false;
  error = '';

  searchQuery = '';
  sortBy = 'ltv';

  sortOptions = [
    { value: 'ltv', label: 'Por LTV' },
    { value: 'orders', label: 'Por Órdenes' },
    { value: 'date', label: 'Por Fecha' },
  ];

  private searchSubject = new Subject<string>();
  private subs = new Subscription();

  ngOnInit(): void {
    this.subs.add(
      this.searchSubject.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => {
        this.pageIndex = 0;
        this.loadCustomers();
      }),
    );
    this.loadCustomers();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  loadCustomers(): void {
    this.loading = true;
    this.error = '';

    let params = new HttpParams()
      .set('page', String(this.pageIndex + 1))
      .set('limit', String(this.pageSize))
      .set('sortBy', this.sortBy);

    if (this.searchQuery) params = params.set('search', this.searchQuery);

    this.http
      .get<{ success: boolean; data: { customers: Customer[]; total: number } }>(this.base, { params })
      .subscribe({
        next: (res) => {
          this.dataSource = res.data?.customers ?? [];
          this.total = res.data?.total ?? 0;
          this.loading = false;
        },
        error: (err) => {
          this.error = err?.error?.message ?? 'Error al cargar clientes';
          this.loading = false;
        },
      });
  }

  onSearchChange(value: string): void {
    this.searchSubject.next(value);
  }

  onSortChange(): void {
    this.pageIndex = 0;
    this.loadCustomers();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadCustomers();
  }

  openDetail(customer: Customer): void {
    this.dialog.open(CustomerDetailDialogComponent, {
      data: customer,
      width: '700px',
      maxHeight: '90vh',
    });
  }

  exportCsv(): void {
    let params = new HttpParams().set('sortBy', this.sortBy);
    if (this.searchQuery) params = params.set('search', this.searchQuery);

    const url = `${this.base}/export?${params.toString()}`;
    const token = localStorage.getItem('access_token');
    this.http.get(url, { responseType: 'blob', headers: { Authorization: `Bearer ${token}` } }).subscribe({
      next: (blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'customers.csv';
        a.click();
        URL.revokeObjectURL(a.href);
      },
    });
  }

  getInitials(customer: Customer): string {
    const f = (customer.firstName ?? '').charAt(0).toUpperCase();
    const l = (customer.lastName ?? '').charAt(0).toUpperCase();
    if (f || l) return `${f}${l}`;
    return (customer.email ?? '?').charAt(0).toUpperCase();
  }

  fullName(customer: Customer): string {
    const name = `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim();
    return name || '—';
  }

  avatarColor(customer: Customer): string {
    const colors = [
      'linear-gradient(135deg, #667eea, #764ba2)',
      'linear-gradient(135deg, #f093fb, #f5576c)',
      'linear-gradient(135deg, #4facfe, #00f2fe)',
      'linear-gradient(135deg, #43e97b, #38f9d7)',
      'linear-gradient(135deg, #fa709a, #fee140)',
      'linear-gradient(135deg, #a18cd1, #fbc2eb)',
    ];
    const idx = (customer.email?.charCodeAt(0) ?? 0) % colors.length;
    return colors[idx];
  }
}