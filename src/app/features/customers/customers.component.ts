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
  ],
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.scss'],
})
export class CustomersComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/customers`;

  displayedColumns = ['avatar', 'email', 'name', 'ltv', 'orders', 'lastOrder', 'createdAt'];
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

