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
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { DashboardService, DashboardSummary, GrowthPoint, AnomalyItem, Insight, Store } from '../../core/services/dashboard.service';
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
    MatTooltipModule,
    MatBadgeModule,
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
  insights: Insight[] = [];
  stores: Store[] = [];
  selectedStoreId: string | null = null;

  // Period selector
  periods: PeriodOption[] = [
    { label: 'Últimos 7 días',   months: 1,  days: 7   },
    { label: 'Últimos 30 días',  months: 1,  days: 30  },
    { label: 'Últimos 90 días',  months: 3,  days: 90  },
    { label: 'Últimos 6 meses',  months: 6,  days: 180 },
    { label: 'Último año',       months: 12, days: 365 },
  ];
  selectedPeriod: PeriodOption = this.periods[1];

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
    this.dashboard.getStores().subscribe({
      next: (res) => {
        this.stores = res.data ?? [];
      },
    });
    this.loadAll();
  }

  onPeriodChange() { this.loadAll(); }
  onStoreChange()  { this.loadAll(); }

  loadAll() {
    this.loading = true;
    this.error = '';
    const storeId = this.selectedStoreId ?? undefined;

    this.dashboard.getSummary(this.selectedPeriod.days, storeId).subscribe({
      next: (res) => { this.summary = res.data; this.loading = false; },
      error: (err) => {
        this.error = err?.error?.message ?? 'Error al cargar el dashboard';
        this.loading = false;
      },
    });

    this.dashboard.getGrowth(this.selectedPeriod.months).subscribe({
      next: (res) => this.buildChart(res.data),
    });

    this.dashboard.getInsights(storeId).subscribe({
      next: (res) => (this.insights = res.data?.insights ?? []),
    });
  }

  markRead(insight: Insight) {
    if (insight.isRead) return;
    this.dashboard.markInsightRead(insight.id).subscribe({
      next: () => { insight.isRead = true; },
    });
  }

  markActioned(insight: Insight) {
    if (insight.isActioned) return;
    this.dashboard.markInsightActioned(insight.id).subscribe({
      next: () => { insight.isActioned = true; },
    });
  }

  get unreadCount(): number {
    return this.insights.filter((i) => !i.isRead).length;
  }

  private buildChart(data: GrowthPoint[]) {
    this.growthChartData = {
      labels: data.map((d) => d.month),
      datasets: [
        {
          label: 'Ingresos ($)',
          data: data.map((d) => d.revenue),
          borderColor: '#4f46e5',
          backgroundColor: 'rgba(79,70,229,0.08)',
          fill: true,
          tension: 0.4,
          yAxisID: 'y',
        },
        {
          label: 'Pedidos',
          data: data.map((d) => d.orders),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16,185,129,0.08)',
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

  insightIcon(type: string): string {
    const map: Record<string, string> = {
      customer_growth:   'trending_up',
      high_aov:          'receipt_long',
      repeat_customer:   'loyalty',
      seasonal_trend:    'event_note',
      revenue_drop:      'trending_down',
      anomaly:           'troubleshoot',
    };
    return map[type] ?? 'lightbulb';
  }

  insightSeverityClass(severity: string): string {
    const map: Record<string, string> = {
      info:     'badge--info',
      warning:  'badge--warning',
      critical: 'badge--critical',
    };
    return map[severity] ?? 'badge--info';
  }
}
