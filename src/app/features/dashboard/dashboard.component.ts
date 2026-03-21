import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { DashboardService, DashboardSummary, GrowthPoint, AnomalyItem } from '../../core/services/dashboard.service';
import { MetricCardComponent } from '../../shared/components/metric-card/metric-card.component';

interface PeriodOption { label: string; months: number; days: number; }

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
  private dashboard = inject(DashboardService);

  loading = true;
  error = '';

  summary: DashboardSummary | null = null;
  anomalies: AnomalyItem[] = [];

  // Period selector
  periods: PeriodOption[] = [
    { label: 'Últimos 7 días',   months: 1,  days: 7   },
    { label: 'Últimos 30 días',  months: 1,  days: 30  },
    { label: 'Últimos 90 días',  months: 3,  days: 90  },
    { label: 'Últimos 6 meses',  months: 6,  days: 180 },
    { label: 'Último año',       months: 12, days: 365 },
  ];
  selectedPeriod: PeriodOption = this.periods[1]; // 30 días por defecto

  // Chart
  growthChartData: ChartData<'line'> = { labels: [], datasets: [] };
  growthChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: { legend: { position: 'top' } },
    scales: {
      y: {
        type: 'linear',
        position: 'left',
        beginAtZero: true,
        ticks: { callback: (v) => '$' + Number(v).toLocaleString() },
        grid: { color: 'rgba(0,0,0,0.05)' },
      },
      y1: {
        type: 'linear',
        position: 'right',
        beginAtZero: true,
        grid: { drawOnChartArea: false },
        ticks: { callback: (v) => v + ' órd.' },
      },
    },
  };

  // Top customers table
  displayedColumns = ['name', 'totalOrders', 'lifetimeValue'];

  ngOnInit() {
    this.loadAll();
  }

  onPeriodChange() {
    this.loadAll();
  }

  loadAll() {
    this.loading = true;
    this.error = '';

    this.dashboard.getSummary(this.selectedPeriod.days).subscribe({
      next: (res) => {
        this.summary = res.data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message ?? 'Error al cargar el dashboard';
        this.loading = false;
      },
    });

    this.dashboard.getGrowth(this.selectedPeriod.months).subscribe({
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
          backgroundColor: 'rgba(57,73,171,0.08)',
          fill: true,
          tension: 0.4,
          yAxisID: 'y',
        },
        {
          label: 'Pedidos',
          data: data.map((d) => d.orders),
          borderColor: '#00897b',
          backgroundColor: 'rgba(0,137,123,0.08)',
          fill: true,
          tension: 0.4,
          yAxisID: 'y1',
        },
      ],
    };
  }

  comparePeriods(a: PeriodOption, b: PeriodOption): boolean {
    return a?.days === b?.days;
  }

  severityColor(s: string): string {
    const map: Record<string, string> = { critical: 'warn', high: 'warn', medium: 'accent', low: '' };
    return map[s] ?? '';
  }
}
