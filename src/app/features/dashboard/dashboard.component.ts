import { Component, OnInit, inject } from '@angular/core';
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
