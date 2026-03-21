import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DashboardService, Insight } from '../../core/services/dashboard.service';

type FilterStatus = 'all' | 'unread' | 'unactioned';
type FilterSeverity = 'all' | 'critical' | 'warning' | 'info';

@Component({
  selector: 'app-insights',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatIconModule, MatButtonModule,
    MatChipsModule, MatProgressSpinnerModule, MatTooltipModule,
    MatBadgeModule, MatSelectModule, MatFormFieldModule, FormsModule,
    MatSnackBarModule,
  ],
  templateUrl: './insights.component.html',
  styleUrls: ['./insights.component.scss'],
})
export class InsightsComponent implements OnInit {
  private svc = inject(DashboardService);
  private snackBar = inject(MatSnackBar);

  insights: Insight[] = [];
  loading = false;

  filterStatus: FilterStatus = 'all';
  filterSeverity: FilterSeverity = 'all';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.svc.getInsights().subscribe({
      next: (res) => { this.insights = res.data.insights; this.loading = false; },
      error: () => { this.loading = false; this.notify('Error al cargar insights', true); },
    });
  }

  get filtered(): Insight[] {
    return this.insights.filter(i => {
      if (this.filterStatus === 'unread' && i.isRead) return false;
      if (this.filterStatus === 'unactioned' && i.isActioned) return false;
      if (this.filterSeverity !== 'all' && i.severity !== this.filterSeverity) return false;
      return true;
    });
  }

  get unreadCount(): number {
    return this.insights.filter(i => !i.isRead).length;
  }
  get criticalCount(): number {
    return this.insights.filter(i => i.severity === 'critical' && !i.isActioned).length;
  }
  get actionedCount(): number {
    return this.insights.filter(i => i.isActioned).length;
  }

  markRead(insight: Insight): void {
    if (insight.isRead) return;
    insight.isRead = true;
    this.svc.markInsightRead(insight.id).subscribe({
      error: () => { insight.isRead = false; this.notify('Error', true); },
    });
  }

  markActioned(insight: Insight): void {
    if (insight.isActioned) return;
    insight.isActioned = true;
    insight.isRead = true;
    this.svc.markInsightActioned(insight.id).subscribe({
      error: () => { insight.isActioned = false; this.notify('Error', true); },
    });
  }

  markAllRead(): void {
    const unread = this.insights.filter(i => !i.isRead);
    unread.forEach(i => { i.isRead = true; this.svc.markInsightRead(i.id).subscribe(); });
    this.notify(`${unread.length} insight(s) marcados como leídos`);
  }

  iconFor(type: string): string {
    const map: Record<string, string> = {
      revenue_drop: 'trending_down',
      revenue_spike: 'trending_up',
      orders_drop: 'remove_shopping_cart',
      orders_spike: 'add_shopping_cart',
      aov_deviation: 'price_change',
      new_customer_spike: 'person_add',
      churn_risk: 'person_off',
      cart_abandonment: 'shopping_cart',
      low_inventory: 'inventory_2',
    };
    return map[type] ?? 'lightbulb';
  }

  severityLabel(s: string): string {
    return s === 'critical' ? 'Crítico' : s === 'warning' ? 'Advertencia' : 'Info';
  }

  private notify(msg: string, error = false): void {
    this.snackBar.open(msg, 'Cerrar', {
      duration: 3000,
      panelClass: error ? ['snack-error'] : ['snack-success'],
    });
  }
}
