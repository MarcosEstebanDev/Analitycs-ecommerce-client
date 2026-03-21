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

export interface Insight {
  id: string;
  tenantId: string;
  storeId: string;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  description: string;
  isRead: boolean;
  isActioned: boolean;
  createdAt: string;
}

export interface Store {
  id: string;
  name: string;
  provider: string;
  isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/dashboard`;

  getSummary(days = 30, storeId?: string) {
    const params: Record<string, string> = { days: days.toString() };
    if (storeId) params['storeId'] = storeId;
    return this.http.get<{ success: boolean; data: DashboardSummary }>(
      `${this.base}/summary`, { params },
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

  getInsights(storeId?: string) {
    const params: Record<string, string> = { limit: '20' };
    if (storeId) params['storeId'] = storeId;
    return this.http.get<{ success: boolean; data: { insights: Insight[]; total: number } }>(
      `${this.base}/insights`, { params },
    );
  }

  markInsightRead(insightId: string) {
    return this.http.post<{ success: boolean }>(`${this.base}/insights/${insightId}/read`, {});
  }

  markInsightActioned(insightId: string) {
    return this.http.post<{ success: boolean }>(`${this.base}/insights/${insightId}/action`, {});
  }

  getStores() {
    return this.http.get<{ success: boolean; data: Store[] }>(`${this.base}/stores`);
  }

  getTopProducts() {
    return this.http.get<{ success: boolean; data: { products: TopProduct[] } }>(`${this.base}/top-products`);
  }

  getCohortRetention(months = 6) {
    return this.http.get<{ success: boolean; data: CohortData }>(
      `${this.base}/cohort-retention`,
      { params: { months: months.toString() } },
    );
  }

  getForecast(days = 30, history = 90) {
    return this.http.get<{ success: boolean; data: ForecastData }>(
      `${this.base}/forecast`,
      { params: { days: days.toString(), history: history.toString() } },
    );
  }
}

export interface TopProduct {
  title: string;
  totalQty: number;
  revenue: number;
}

export interface AnomalyItem {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  value: number;
  baseline: number;
  deviation: number;
}

export interface CohortRow {
  cohortMonth: string;
  size: number;
  retention: number[];
}

export interface CohortData {
  cohorts: CohortRow[];
  maxPeriods: number;
}

export interface ForecastPoint {
  date: string;
  predictedRevenue: number;
  lower: number;
  upper: number;
}

export interface ForecastData {
  history: Array<{ date: string; revenue: number }>;
  forecast: ForecastPoint[];
  trend: 'up' | 'down' | 'flat';
}
