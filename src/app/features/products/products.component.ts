import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { Subscription } from 'rxjs';
import { DashboardService, TopProduct } from '../../core/services/dashboard.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatTableModule, MatIconModule,
    MatProgressSpinnerModule, MatProgressBarModule, MatButtonModule,
    MatTooltipModule, BaseChartDirective,
  ],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss'],
})
export class ProductsComponent implements OnInit, OnDestroy {
  private svc = inject(DashboardService);
  private theme = inject(ThemeService);
  private themeSub?: Subscription;

  products: TopProduct[] = [];
  loading = false;
  error = '';
  displayedColumns = ['rank', 'title', 'revenue', 'qty', 'bar'];

  ngOnInit(): void {
    this.chartOptions = this.buildChartOptions(this.theme.isDarkValue);
    this.themeSub = this.theme.isDark.subscribe(dark => {
      this.chartOptions = this.buildChartOptions(dark);
    });
    this.load();
  }

  ngOnDestroy(): void { this.themeSub?.unsubscribe(); }

  load(): void {
    this.loading = true;
    this.svc.getTopProducts().subscribe({
      next: (res) => { this.products = res.data.products; this.loading = false; },
      error: () => { this.loading = false; this.error = 'Error al cargar los productos.'; },
    });
  }

  get maxRevenue(): number {
    return this.products[0]?.revenue ?? 1;
  }

  get chartData(): ChartData<'bar'> {
    return {
      labels: this.products.map(p => p.title.length > 18 ? p.title.slice(0, 18) + '…' : p.title),
      datasets: [{
        label: 'Revenue ($)',
        data: this.products.map(p => p.revenue),
        backgroundColor: this.products.map((_, i) =>
          i === 0 ? '#6366f1' : i === 1 ? '#8b5cf6' : i === 2 ? '#a78bfa' : '#c4b5fd'
        ),
        borderRadius: 6,
        borderSkipped: false,
      }],
    };
  }

  chartOptions: ChartOptions<'bar'> = {};

  buildChartOptions(dark: boolean): ChartOptions<'bar'> {
    return {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y' as const,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: dark ? '#1e293b' : '#fff',
          titleColor: dark ? '#f1f5f9' : '#111827',
          bodyColor: dark ? '#e2e8f0' : '#374151',
          borderColor: dark ? '#334155' : '#e5e7eb',
          borderWidth: 1,
        },
      },
      scales: {
        x: {
          grid: { color: dark ? 'rgba(255,255,255,0.07)' : '#f1f5f9' },
          ticks: {
            callback: (v: any) => `$${v}`,
            color: dark ? '#94a3b8' : '#6b7280',
          },
          border: { color: dark ? '#334155' : '#e5e7eb' },
        },
        y: {
          grid: { display: false },
          ticks: { color: dark ? '#94a3b8' : '#374151', font: { size: 12 } },
          border: { color: 'transparent' },
        },
      },
    };
  }
}
