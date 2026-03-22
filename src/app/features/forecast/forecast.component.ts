import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { Subscription } from 'rxjs';
import { DashboardService, ForecastData } from '../../core/services/dashboard.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-forecast',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonToggleModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatChipsModule,
    BaseChartDirective,
  ],
  templateUrl: './forecast.component.html',
  styleUrls: ['./forecast.component.scss'],
})
export class ForecastComponent implements OnInit, OnDestroy {
  private dashboard = inject(DashboardService);
  private theme = inject(ThemeService);
  private themeSub?: Subscription;

  loading = true;
  error = '';
  forecastDays = 30;
  data: ForecastData | null = null;

  chartData: ChartData<'line'> = { datasets: [], labels: [] };

  chartOptions: ChartOptions<'line'> = {};

  buildChartOptions(dark: boolean): ChartOptions<'line'> {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'top',
          labels: { usePointStyle: true, boxWidth: 8, color: dark ? '#e2e8f0' : '#374151' },
        },
        tooltip: {
          backgroundColor: dark ? '#1e293b' : '#fff',
          titleColor: dark ? '#f1f5f9' : '#111827',
          bodyColor: dark ? '#e2e8f0' : '#374151',
          borderColor: dark ? '#334155' : '#e5e7eb',
          borderWidth: 1,
          callbacks: {
            label: (ctx: any) => `${ctx.dataset.label}: $${(ctx.parsed.y ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)' },
          ticks: { maxTicksLimit: 12, font: { size: 11 }, color: dark ? '#94a3b8' : '#6b7280' },
          border: { color: dark ? '#334155' : '#e5e7eb' },
        },
        y: {
          grid: { color: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)' },
          ticks: {
            callback: (v: any) => `$${Number(v).toLocaleString()}`,
            font: { size: 11 },
            color: dark ? '#94a3b8' : '#6b7280',
          },
          border: { color: dark ? '#334155' : '#e5e7eb' },
        },
      },
      elements: {
        line: { tension: 0.4 },
        point: { radius: 0, hoverRadius: 5 },
      },
    };
  }

  get trendIcon(): string {
    return this.data?.trend === 'up' ? 'trending_up' :
           this.data?.trend === 'down' ? 'trending_down' : 'trending_flat';
  }

  get trendLabel(): string {
    return this.data?.trend === 'up' ? 'Tendencia al alza' :
           this.data?.trend === 'down' ? 'Tendencia a la baja' : 'Tendencia estable';
  }

  get trendColor(): string {
    return this.data?.trend === 'up' ? '#4caf50' :
           this.data?.trend === 'down' ? '#f44336' : '#ff9800';
  }

  get forecastTotal(): number {
    if (!this.data) return 0;
    return this.data.forecast.reduce((s, f) => s + f.predictedRevenue, 0);
  }

  ngOnInit() {
    this.chartOptions = this.buildChartOptions(this.theme.isDarkValue);
    this.themeSub = this.theme.isDark.subscribe((dark) => {
      this.chartOptions = this.buildChartOptions(dark);
    });
    this.load();
  }

  ngOnDestroy() { this.themeSub?.unsubscribe(); }

  load() {
    this.loading = true;
    this.error = '';
    this.dashboard.getForecast(this.forecastDays, 90).subscribe({
      next: (res) => {
        if (res.success && res.data?.history?.length > 0) {
          this.data = res.data;
          this.buildChart();
        } else if (!res.success) {
          this.data = null;
          this.error = 'No se pudo obtener el pronóstico. Verificá que el backend esté corriendo.';
        }
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.data = null;
        if (err?.status === 0) {
          this.error = 'No se puede conectar al servidor. Verificá que el backend esté corriendo.';
        } else if (err?.status === 404) {
          this.error = 'Endpoint no encontrado. Actualizá el backend.';
        } else {
          this.error = 'Error cargando pronóstico. Intentá de nuevo más tarde.';
        }
      },
    });
  }

  private buildChart() {
    if (!this.data) return;

    const histLabels = this.data.history.map((h) =>
      new Date(h.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }),
    );
    const fcLabels = this.data.forecast.map((f) =>
      new Date(f.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }),
    );
    const allLabels = [...histLabels, ...fcLabels];

    const histRevenue = this.data.history.map((h) => h.revenue);
    const fcRevenue = this.data.forecast.map((f) => f.predictedRevenue);
    const fcLower  = this.data.forecast.map((f) => f.lower);
    const fcUpper  = this.data.forecast.map((f) => f.upper);

    const histLen = histLabels.length;
    const padHistory = Array(fcLabels.length).fill(null);
    const padForecast = Array(histLen).fill(null);

    this.chartData = {
      labels: allLabels,
      datasets: [
        {
          label: 'Revenue histórico',
          data: [...histRevenue, ...padHistory],
          borderColor: '#3f51b5',
          backgroundColor: 'rgba(63,81,181,0.08)',
          fill: true,
          borderWidth: 2,
        },
        {
          label: `Pronóstico ${this.forecastDays}d`,
          data: [...padForecast, ...fcRevenue],
          borderColor: '#00bcd4',
          backgroundColor: 'rgba(0,188,212,0.06)',
          fill: true,
          borderDash: [6, 3],
          borderWidth: 2,
        },
        {
          label: 'IC inferior (95%)',
          data: [...padForecast, ...fcLower],
          borderColor: 'rgba(0,188,212,0.3)',
          backgroundColor: 'transparent',
          borderDash: [3, 3],
          borderWidth: 1,
          pointRadius: 0,
        },
        {
          label: 'IC superior (95%)',
          data: [...padForecast, ...fcUpper],
          borderColor: 'rgba(0,188,212,0.3)',
          backgroundColor: 'rgba(0,188,212,0.06)',
          fill: '-1',
          borderDash: [3, 3],
          borderWidth: 1,
          pointRadius: 0,
        },
      ],
    };
  }
}
