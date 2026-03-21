/**
 * Setup script — Analitycs-ecommerce-client
 * Ejecutar: node setup.js
 * Crea toda la estructura de carpetas y archivos del proyecto Angular 17.
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

function write(filePath, content) {
  const abs = path.join(ROOT, filePath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content, 'utf8');
  console.log('✅', filePath);
}

// ─── src/index.html ─────────────────────────────────────────────────────────
write('src/index.html', `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Analytics E-commerce</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="favicon.ico">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
</head>
<body>
  <app-root></app-root>
</body>
</html>
`);

// ─── src/main.ts ─────────────────────────────────────────────────────────────
write('src/main.ts', `import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
`);

// ─── src/styles.scss ─────────────────────────────────────────────────────────
write('src/styles.scss', `@use '@angular/material' as mat;

@include mat.core();

$primary: mat.define-palette(mat.$indigo-palette, 600);
$accent:  mat.define-palette(mat.$teal-palette, A200);
$warn:    mat.define-palette(mat.$red-palette);

$theme: mat.define-light-theme((
  color: (primary: $primary, accent: $accent, warn: $warn),
  typography: mat.define-typography-config($font-family: 'Inter, sans-serif'),
  density: 0,
));

@include mat.all-component-themes($theme);

*, *::before, *::after { box-sizing: border-box; }

body {
  margin: 0;
  font-family: 'Inter', sans-serif;
  background-color: #f5f6fa;
  color: #1a1a2e;
}

.page-container {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.mat-mdc-card {
  border-radius: 12px !important;
}
`);

// ─── src/environments ────────────────────────────────────────────────────────
write('src/environments/environment.ts', `export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
};
`);

write('src/environments/environment.prod.ts', `export const environment = {
  production: true,
  apiUrl: '/api',
};
`);

// ─── src/assets/.gitkeep ─────────────────────────────────────────────────────
write('src/assets/.gitkeep', '');

// ─── app.config.ts ────────────────────────────────────────────────────────────
write('src/app/app.config.ts', `import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations(),
  ],
};
`);

// ─── app.routes.ts ────────────────────────────────────────────────────────────
write('src/app/app.routes.ts', `import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  { path: '**', redirectTo: 'dashboard' },
];
`);

// ─── app.component ────────────────────────────────────────────────────────────
write('src/app/app.component.ts', `import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class AppComponent {}
`);

// ─── core/auth/auth.service.ts ────────────────────────────────────────────────
write('src/app/core/auth/auth.service.ts', `import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly TOKEN_KEY = 'access_token';
  private readonly TENANT_KEY = 'tenant_id';

  isLoggedIn$ = new BehaviorSubject<boolean>(this.hasToken());

  login(email: string, tenantId: string) {
    return this.http
      .post<LoginResponse>(
        \`\${environment.apiUrl}/auth/login\`,
        { email },
        { headers: { 'x-tenant-id': tenantId } },
      )
      .pipe(
        tap((res) => {
          localStorage.setItem(this.TOKEN_KEY, res.accessToken);
          localStorage.setItem(this.TENANT_KEY, tenantId);
          this.isLoggedIn$.next(true);
        }),
      );
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.TENANT_KEY);
    this.isLoggedIn$.next(false);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getTenantId(): string | null {
    return localStorage.getItem(this.TENANT_KEY);
  }

  private hasToken(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }
}
`);

// ─── core/auth/auth.guard.ts ─────────────────────────────────────────────────
write('src/app/core/auth/auth.guard.ts', `import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.getToken()) return true;
  return router.createUrlTree(['/login']);
};
`);

// ─── core/auth/auth.interceptor.ts ───────────────────────────────────────────
write('src/app/core/auth/auth.interceptor.ts', `import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();
  const tenantId = auth.getTenantId();

  if (!token) return next(req);

  const authReq = req.clone({
    setHeaders: {
      Authorization: \`Bearer \${token}\`,
      ...(tenantId ? { 'x-tenant-id': tenantId } : {}),
    },
  });

  return next(authReq);
};
`);

// ─── core/services/dashboard.service.ts ──────────────────────────────────────
write('src/app/core/services/dashboard.service.ts', `import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface DashboardMetrics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalCustomers: number;
  repeatCustomers: number;
  conversionRate: number;
  totalProductQty: number;
  period: { startDate: string; endDate: string };
}

export interface DashboardSummary {
  metrics: Pick<DashboardMetrics, 'totalRevenue' | 'totalOrders' | 'averageOrderValue' | 'totalCustomers' | 'repeatCustomers'>;
  anomalies: { count: number; critical: number; high: number };
  alerts: { critical: number; unread: number };
  topCustomers: TopCustomer[];
  avgLTV: number;
}

export interface TopCustomer {
  email: string;
  lifetimeValue: number;
  totalOrders: number;
  firstName?: string;
  lastName?: string;
}

export interface GrowthPoint {
  month: string;
  revenue: number;
  orders: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private base = \`\${environment.apiUrl}/dashboard\`;

  getSummary() {
    return this.http.get<{ success: boolean; data: DashboardSummary }>(\`\${this.base}/summary\`);
  }

  getMetrics(days = 30) {
    return this.http.get<{ success: boolean; data: DashboardMetrics; period: { days: number } }>(
      \`\${this.base}/metrics\`,
      { params: { days: days.toString() } },
    );
  }

  getGrowth(months = 6) {
    return this.http.get<{ success: boolean; data: GrowthPoint[] }>(
      \`\${this.base}/growth\`,
      { params: { months: months.toString() } },
    );
  }

  getAnomalies() {
    return this.http.get<{ success: boolean; data: { anomalies: AnomalyItem[]; anomalyCount: number } }>(
      \`\${this.base}/anomalies\`,
    );
  }
}

export interface AnomalyItem {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  value: number;
  baseline: number;
  deviation: number;
}
`);

// ─── core/services/tenant.service.ts ─────────────────────────────────────────
write('src/app/core/services/tenant.service.ts', `import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  isActive: boolean;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class TenantService {
  private http = inject(HttpClient);
  private base = \`\${environment.apiUrl}/tenants\`;

  list() {
    return this.http.get<{ success: boolean; data: Tenant[] }>(this.base);
  }

  getById(tenantId: string) {
    return this.http.get<{ success: boolean; data: { tenant: Tenant; stores: unknown[] } }>(
      \`\${this.base}/\${tenantId}\`,
    );
  }

  create(name: string, slug: string, plan = 'free') {
    return this.http.post<{ success: boolean; data: Tenant }>(this.base, { name, slug, plan });
  }
}
`);

// ─── shared/components/metric-card ───────────────────────────────────────────
write('src/app/shared/components/metric-card/metric-card.component.ts', `import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-metric-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './metric-card.component.html',
  styleUrls: ['./metric-card.component.scss'],
})
export class MetricCardComponent {
  @Input() label = '';
  @Input() value: number | string = 0;
  @Input() icon = 'bar_chart';
  @Input() prefix = '';
  @Input() suffix = '';
  @Input() color: 'primary' | 'accent' | 'warn' | 'success' = 'primary';
}
`);

write('src/app/shared/components/metric-card/metric-card.component.html', `<mat-card class="metric-card metric-card--{{ color }}">
  <mat-card-content>
    <div class="metric-card__icon">
      <mat-icon>{{ icon }}</mat-icon>
    </div>
    <div class="metric-card__body">
      <span class="metric-card__label">{{ label }}</span>
      <span class="metric-card__value">{{ prefix }}{{ value | number:'1.0-2' }}{{ suffix }}</span>
    </div>
  </mat-card-content>
</mat-card>
`);

write('src/app/shared/components/metric-card/metric-card.component.scss', `.metric-card {
  height: 100%;

  mat-card-content {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px !important;
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    border-radius: 12px;

    mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }
  }

  &__body {
    display: flex;
    flex-direction: column;
  }

  &__label {
    font-size: 12px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #6b7280;
    margin-bottom: 4px;
  }

  &__value {
    font-size: 24px;
    font-weight: 700;
    color: #1a1a2e;
  }

  &--primary .metric-card__icon { background: #e8eaf6; color: #3949ab; }
  &--accent  .metric-card__icon { background: #e0f7fa; color: #00897b; }
  &--warn    .metric-card__icon { background: #fce4ec; color: #e53935; }
  &--success .metric-card__icon { background: #e8f5e9; color: #43a047; }
}
`);

// ─── features/login ───────────────────────────────────────────────────────────
write('src/app/features/login/login.component.ts', `import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = false;
  error = '';

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    tenantId: ['', Validators.required],
  });

  onSubmit() {
    if (this.form.invalid) return;

    this.loading = true;
    this.error = '';

    const { email, tenantId } = this.form.value;

    this.auth.login(email!, tenantId!).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.error = err?.error?.message ?? 'Error al iniciar sesión';
        this.loading = false;
      },
    });
  }
}
`);

write('src/app/features/login/login.component.html', `<div class="login-wrapper">
  <mat-card class="login-card">
    <mat-card-header>
      <div class="login-card__logo">
        <mat-icon>analytics</mat-icon>
      </div>
      <mat-card-title>Analytics E-commerce</mat-card-title>
      <mat-card-subtitle>Ingresá a tu dashboard</mat-card-subtitle>
    </mat-card-header>

    <mat-card-content>
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Email</mat-label>
          <mat-icon matPrefix>email</mat-icon>
          <input matInput type="email" formControlName="email" placeholder="admin@empresa.com" />
          @if (form.get('email')?.hasError('required')) {
            <mat-error>El email es requerido</mat-error>
          }
          @if (form.get('email')?.hasError('email')) {
            <mat-error>Email inválido</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Tenant ID</mat-label>
          <mat-icon matPrefix>business</mat-icon>
          <input matInput formControlName="tenantId" placeholder="mi-tienda" />
          @if (form.get('tenantId')?.hasError('required')) {
            <mat-error>El tenant ID es requerido</mat-error>
          }
        </mat-form-field>

        @if (error) {
          <div class="login-error">
            <mat-icon>error_outline</mat-icon>
            <span>{{ error }}</span>
          </div>
        }

        <button
          mat-flat-button
          color="primary"
          class="full-width login-btn"
          type="submit"
          [disabled]="form.invalid || loading"
        >
          @if (loading) {
            <mat-progress-spinner diameter="20" mode="indeterminate" />
          } @else {
            Ingresar
          }
        </button>
      </form>
    </mat-card-content>
  </mat-card>
</div>
`);

write('src/app/features/login/login.component.scss', `.login-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #3949ab 0%, #00897b 100%);
}

.login-card {
  width: 100%;
  max-width: 420px;
  padding: 16px;

  mat-card-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
    margin-bottom: 24px;
  }

  &__logo {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: #e8eaf6;
    margin-bottom: 12px;

    mat-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
      color: #3949ab;
    }
  }
}

.full-width {
  width: 100%;
  margin-bottom: 8px;
}

.login-error {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #e53935;
  font-size: 14px;
  margin-bottom: 12px;

  mat-icon { font-size: 18px; width: 18px; height: 18px; }
}

.login-btn {
  margin-top: 8px;
  height: 46px;
  font-size: 16px;
  font-weight: 600;
}
`);

// ─── features/dashboard ──────────────────────────────────────────────────────
write('src/app/features/dashboard/dashboard.component.ts', `import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { AuthService } from '../../core/auth/auth.service';
import { DashboardService, DashboardSummary, GrowthPoint, AnomalyItem } from '../../core/services/dashboard.service';
import { MetricCardComponent } from '../../shared/components/metric-card/metric-card.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule,
    BaseChartDirective,
    MetricCardComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  private auth = inject(AuthService);
  private dashboard = inject(DashboardService);

  tenantId = this.auth.getTenantId() ?? '—';
  loading = true;
  error = '';

  summary: DashboardSummary | null = null;
  anomalies: AnomalyItem[] = [];

  // Chart
  growthChartData: ChartData<'line'> = { labels: [], datasets: [] };
  growthChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' } },
    scales: {
      y: { beginAtZero: true, ticks: { callback: (v) => '$' + v.toLocaleString() } },
    },
  };

  // Top customers table
  displayedColumns = ['name', 'totalOrders', 'lifetimeValue'];

  ngOnInit() {
    this.loadAll();
  }

  loadAll() {
    this.loading = true;
    this.dashboard.getSummary().subscribe({
      next: (res) => {
        this.summary = res.data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message ?? 'Error al cargar el dashboard';
        this.loading = false;
      },
    });

    this.dashboard.getGrowth(6).subscribe({
      next: (res) => this.buildChart(res.data),
    });

    this.dashboard.getAnomalies().subscribe({
      next: (res) => (this.anomalies = res.data?.anomalies ?? []),
    });
  }

  private buildChart(data: GrowthPoint[]) {
    this.growthChartData = {
      labels: data.map((d) => d.month),
      datasets: [
        {
          label: 'Ingresos ($)',
          data: data.map((d) => d.revenue),
          borderColor: '#3949ab',
          backgroundColor: 'rgba(57,73,171,0.1)',
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Pedidos',
          data: data.map((d) => d.orders),
          borderColor: '#00897b',
          backgroundColor: 'rgba(0,137,123,0.1)',
          fill: true,
          tension: 0.4,
          yAxisID: 'y',
        },
      ],
    };
  }

  severityColor(s: string): string {
    const map: Record<string, string> = { critical: 'warn', high: 'warn', medium: '', low: '' };
    return map[s] ?? '';
  }

  logout() {
    this.auth.logout();
  }
}
`);

write('src/app/features/dashboard/dashboard.component.html', `<!-- Navbar -->
<mat-toolbar color="primary" class="navbar">
  <mat-icon class="navbar__logo">analytics</mat-icon>
  <span class="navbar__title">Analytics E-commerce</span>
  <span class="spacer"></span>
  <span class="navbar__tenant">
    <mat-icon>business</mat-icon> {{ tenantId }}
  </span>
  <button mat-icon-button (click)="logout()" matTooltip="Cerrar sesión">
    <mat-icon>logout</mat-icon>
  </button>
</mat-toolbar>

<div class="page-container">

  <!-- Loading -->
  @if (loading) {
    <div class="loading-center">
      <mat-progress-spinner mode="indeterminate" diameter="56" />
      <p>Cargando dashboard…</p>
    </div>
  }

  <!-- Error -->
  @if (error && !loading) {
    <mat-card class="error-card">
      <mat-icon color="warn">error_outline</mat-icon>
      <p>{{ error }}</p>
      <button mat-stroked-button (click)="loadAll()">Reintentar</button>
    </mat-card>
  }

  <!-- Content -->
  @if (summary && !loading) {
    <!-- KPI Cards -->
    <section class="kpi-grid">
      <app-metric-card
        label="Ingresos totales"
        [value]="summary.metrics.totalRevenue"
        icon="attach_money"
        prefix="$"
        color="primary"
      />
      <app-metric-card
        label="Pedidos"
        [value]="summary.metrics.totalOrders"
        icon="shopping_cart"
        color="accent"
      />
      <app-metric-card
        label="Ticket promedio"
        [value]="summary.metrics.averageOrderValue"
        icon="receipt"
        prefix="$"
        color="success"
      />
      <app-metric-card
        label="Clientes"
        [value]="summary.metrics.totalCustomers"
        icon="people"
        color="primary"
      />
      <app-metric-card
        label="LTV promedio"
        [value]="summary.avgLTV"
        icon="trending_up"
        prefix="$"
        color="success"
      />
      <app-metric-card
        label="Alertas críticas"
        [value]="summary.alerts.critical"
        icon="warning"
        color="warn"
      />
    </section>

    <!-- Chart -->
    <mat-card class="chart-card">
      <mat-card-header>
        <mat-card-title>Crecimiento últimos 6 meses</mat-card-title>
      </mat-card-header>
      <mat-card-content class="chart-content">
        <canvas baseChart
          [data]="growthChartData"
          [options]="growthChartOptions"
          type="line">
        </canvas>
      </mat-card-content>
    </mat-card>

    <!-- Bottom row -->
    <div class="bottom-row">

      <!-- Top customers -->
      <mat-card class="bottom-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>emoji_events</mat-icon> Top Clientes
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <table mat-table [dataSource]="summary.topCustomers" class="full-width">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Cliente</th>
              <td mat-cell *matCellDef="let c">{{ c.firstName ?? '' }} {{ c.lastName ?? c.email }}</td>
            </ng-container>
            <ng-container matColumnDef="totalOrders">
              <th mat-header-cell *matHeaderCellDef>Pedidos</th>
              <td mat-cell *matCellDef="let c">{{ c.totalOrders }}</td>
            </ng-container>
            <ng-container matColumnDef="lifetimeValue">
              <th mat-header-cell *matHeaderCellDef>LTV</th>
              <td mat-cell *matCellDef="let c">\${{ c.lifetimeValue | number:'1.0-0' }}</td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </mat-card-content>
      </mat-card>

      <!-- Anomalies -->
      <mat-card class="bottom-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>troubleshoot</mat-icon> Anomalías detectadas
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          @if (anomalies.length === 0) {
            <p class="no-data">
              <mat-icon color="accent">check_circle</mat-icon>
              Sin anomalías detectadas
            </p>
          }
          @for (a of anomalies; track a.type) {
            <div class="anomaly-item">
              <mat-chip [color]="severityColor(a.severity)" highlighted>
                {{ a.severity }}
              </mat-chip>
              <div class="anomaly-item__text">
                <strong>{{ a.type }}</strong>
                <span>{{ a.message }}</span>
              </div>
            </div>
          }
        </mat-card-content>
      </mat-card>

    </div>
  }

</div>
`);

write('src/app/features/dashboard/dashboard.component.scss', `.navbar {
  position: sticky;
  top: 0;
  z-index: 100;

  &__logo { margin-right: 8px; }
  &__title { font-size: 18px; font-weight: 700; }
  &__tenant {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    opacity: 0.85;
    margin-right: 8px;
  }
}

.spacer { flex: 1; }

.page-container {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.loading-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 16px;
  color: #6b7280;
}

.error-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 32px;
  text-align: center;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.chart-card {
  margin-bottom: 24px;

  .chart-content {
    height: 300px;
    padding: 0 8px 8px;
  }
}

.bottom-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.bottom-card {
  mat-card-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
  }
}

.full-width { width: 100%; }

.no-data {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6b7280;
  padding: 16px 0;
}

.anomaly-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #f3f4f6;

  &:last-child { border-bottom: none; }

  &__text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 13px;

    strong { color: #1a1a2e; }
    span { color: #6b7280; }
  }
}
`);

// ─── README.md ────────────────────────────────────────────────────────────────
const t = '`';
const t3 = '```';
write('README.md', [
  '# Analitycs-ecommerce-client',
  '',
  'Frontend Angular 17 para el dashboard de analytics e-commerce.',
  '',
  '## Stack',
  '- **Angular 17** — standalone components',
  '- **Angular Material 17** — UI components',
  '- **Chart.js + ng2-charts** — gráficos de crecimiento',
  '- **TypeScript 5.4**',
  '',
  '## Requisitos',
  '- Node.js >= 18',
  '- Angular CLI >= 17 (' + t + 'npm install -g @angular/cli' + t + ')',
  '- Backend corriendo en ' + t + 'http://localhost:3000' + t,
  '',
  '## Instalación',
  '',
  t3 + 'bash',
  'npm install',
  'ng serve',
  t3,
  '',
  'La app corre en ' + t + 'http://localhost:4200' + t,
  '',
  '## Variables de entorno',
  'Editá ' + t + 'src/environments/environment.ts' + t + ' para apuntar a tu API:',
  '',
  t3 + 'typescript',
  'export const environment = {',
  "  production: false,",
  "  apiUrl: 'http://localhost:3000/api',",
  '};',
  t3,
  '',
  '## Estructura',
  '',
  t3,
  'src/app/',
  '├── core/',
  '│   ├── auth/          # AuthService, authGuard, authInterceptor',
  '│   └── services/      # DashboardService, TenantService',
  '├── features/',
  '│   ├── login/         # Pantalla de login',
  '│   └── dashboard/     # Dashboard principal',
  '└── shared/',
  '    └── components/',
  '        └── metric-card/',
  t3,
  '',
  '## Flujo de autenticación',
  '1. Login con email + tenant ID → el backend devuelve JWT',
  '2. El ' + t + 'authInterceptor' + t + ' agrega ' + t + 'Authorization: Bearer <token>' + t + ' y ' + t + 'x-tenant-id' + t + ' en cada request',
  '3. El ' + t + 'authGuard' + t + ' protege la ruta ' + t + '/dashboard' + t,
].join('\n'));

console.log('\\n🎉 Proyecto creado exitosamente.');
console.log('\\nPróximos pasos:');
console.log('  1. npm install');
console.log('  2. ng serve');
console.log('  3. Abrí http://localhost:4200');
