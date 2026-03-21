import { Component, OnInit, OnDestroy, inject } from '@angular/core';
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
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Order {
  id: string;
  externalId: string;
  status: string;
  totalAmount: number;
  currency: string;
  createdAt: string;
  customer?: { id: string; email: string; firstName?: string; lastName?: string };
  store?: { id: string; name: string };
}

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
  ],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss'],
})
export class OrdersComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
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
}

