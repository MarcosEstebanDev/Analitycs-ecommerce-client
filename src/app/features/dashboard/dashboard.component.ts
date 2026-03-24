import { Component, OnInit, OnDestroy, inject } from '@angular/core';
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
import { Subscription } from 'rxjs';
import { DashboardService, DashboardSummary, GrowthPoint, AnomalyItem, Insight, Store } from '../../core/services/dashboard.service';
import { ThemeService } from '../../core/services/theme.service';
import { MetricCardComponent } from '../../shared/components/metric-card/metric-card.component';

interface PeriodOption { label: string; months: number; days: number; granularity: 'day' | 'week' | 'month'; chartTitle: string; }

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
export class DashboardComponent implements OnInit, OnDestroy {
  private dashboard = inject(DashboardService);
  private theme     = inject(ThemeService);
  private subs      = new Subscription();

  loading = true;
  error = '';

  summary: DashboardSummary | null = null;
  anomalies: AnomalyItem[] = [];
  insights: Insight[] = [];
  stores: Store[] = [];
  selectedStoreId: string | null = null;

  // Period selector
  periods: PeriodOption[] = [
    { label: 'Últimos 7 días',   months: 1,  days: 7,   granularity: 'day',   chartTitle: 'Movimiento últimos 7 días'   },
    { label: 'Últimos 30 días',  months: 1,  days: 30,  granularity: 'day',   chartTitle: 'Movimiento últimos 30 días'  },
    { label: 'Últimos 90 días',  months: 3,  days: 90,  granularity: 'week',  chartTitle: 'Crecimiento últimos 90 días' },
    { label: 'Últimos 6 meses',  months: 6,  days: 180, granularity: 'month', chartTitle: 'Crecimiento últimos 6 meses' },
    { label: 'Último año',       months: 12, days: 365, granularity: 'month', chartTitle: 'Crecimiento último año'      },
  ];
  selectedPeriod: PeriodOption = this.periods[1];

  // Chart
  growthChartData: ChartData<'line'> = { labels: [], datasets: [] };
  growthChartOptions: ChartConfiguration['options'] = this.buildGrowthChartOptions(false);

  // Top customers table
  displayedColumns = ['name', 'totalOrders', 'lifetimeValue'];

  ngOnInit() {
    this.subs.add(
      this.theme.isDark.subscribe((dark) => {
        this.growthChartOptions = this.buildGrowthChartOptions(dark);
      }),
    );
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

    this.dashboard.getGrowth(this.selectedPeriod.days, this.selectedPeriod.granularity).subscribe({
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

  ngOnDestroy() { this.subs.unsubscribe(); }

  private buildGrowthChartOptions(dark: boolean): ChartConfiguration['options'] {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'top',
          labels: { color: dark ? '#e2e8f0' : '#374151', usePointStyle: true, boxWidth: 10 },
        },
        tooltip: {
          backgroundColor: dark ? '#1e293b' : '#fff',
          titleColor: dark ? '#f1f5f9' : '#111827',
          bodyColor: dark ? '#e2e8f0' : '#374151',
          borderColor: dark ? '#334155' : '#e5e7eb',
          borderWidth: 1,
        },
      },
      scales: {
        y: {
          type: 'linear',
          position: 'left',
          beginAtZero: true,
          ticks: {
            callback: (v: any) => '$' + Number(v).toLocaleString(),
            color: dark ? '#94a3b8' : '#6b7280',
          },
          grid: { color: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)' },
          border: { color: dark ? '#334155' : '#e5e7eb' },
        },
        y1: {
          type: 'linear',
          position: 'right',
          beginAtZero: true,
          grid: { drawOnChartArea: false, color: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)' },
          ticks: {
            callback: (v: any) => v + ' órd.',
            color: dark ? '#94a3b8' : '#6b7280',
          },
          border: { color: dark ? '#334155' : '#e5e7eb' },
        },
      },
    };
  }
}
