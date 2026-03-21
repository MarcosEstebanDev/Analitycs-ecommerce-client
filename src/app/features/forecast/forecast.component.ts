import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { DashboardService, ForecastData } from '../../core/services/dashboard.service';

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
export class ForecastComponent implements OnInit {
  private dashboard = inject(DashboardService);

  loading = true;
  error = '';
  forecastDays = 30;
  data: ForecastData | null = null;

  chartData: ChartData<'line'> = { datasets: [], labels: [] };

  chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 8 } },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: $${(ctx.parsed.y ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: { maxTicksLimit: 12, font: { size: 11 } },
      },
      y: {
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: {
          callback: (v) => `$${Number(v).toLocaleString()}`,
          font: { size: 11 },
        },
      },
    },
    elements: {
      line: { tension: 0.4 },
      point: { radius: 0, hoverRadius: 5 },
    },
  };

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
    this.load();
  }

  load() {
    this.loading = true;
    this.error = '';
    this.dashboard.getForecast(this.forecastDays, 90).subscribe({
      next: (res) => {
        if (res.success) {
          this.data = res.data;
          this.buildChart();
        }
        this.loading = false;
      },
      error: () => {
        this.error = 'Error cargando pronóstico';
        this.loading = false;
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
