import { Component, OnInit, inject } from '@angular/core';
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
import { DashboardService, TopProduct } from '../../core/services/dashboard.service';

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
export class ProductsComponent implements OnInit {
  private svc = inject(DashboardService);

  products: TopProduct[] = [];
  loading = false;
  error = '';
  displayedColumns = ['rank', 'title', 'revenue', 'qty', 'bar'];

  ngOnInit(): void { this.load(); }

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

  chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: '#f1f5f9' }, ticks: { callback: (v) => `$${v}` } },
      y: { grid: { display: false } },
    },
  };
}
