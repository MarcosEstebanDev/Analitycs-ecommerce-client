import { Injectable, inject } from '@angular/core';
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
  private base = `${environment.apiUrl}/dashboard`;

  getSummary(days = 30) {
    return this.http.get<{ success: boolean; data: DashboardSummary }>(
      `${this.base}/summary`,
      { params: { days: days.toString() } },
    );
  }

  getMetrics(days = 30) {
    return this.http.get<{ success: boolean; data: DashboardMetrics; period: { days: number } }>(
      `${this.base}/metrics`,
      { params: { days: days.toString() } },
    );
  }

  getGrowth(months = 6) {
    return this.http.get<{ success: boolean; data: GrowthPoint[] }>(
      `${this.base}/growth`,
      { params: { months: months.toString() } },
    );
  }

  getAnomalies() {
    return this.http.get<{ success: boolean; data: { anomalies: AnomalyItem[]; anomalyCount: number } }>(
      `${this.base}/anomalies`,
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
