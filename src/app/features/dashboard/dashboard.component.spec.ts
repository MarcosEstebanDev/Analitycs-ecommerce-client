import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { DashboardService } from '../../core/services/dashboard.service';

const mockSummary = {
  data: {
    totalRevenue: 12500,
    totalOrders: 100,
    averageOrderValue: 125,
    repeatCustomerRate: 0.35,
    topCustomers: [
      { name: 'Alice', totalOrders: 5, lifetimeValue: 600 },
      { name: 'Bob',   totalOrders: 3, lifetimeValue: 400 },
    ],
  },
};

const mockGrowth = {
  data: [
    { month: '2024-01', revenue: 4000, orders: 32 },
    { month: '2024-02', revenue: 5500, orders: 44 },
    { month: '2024-03', revenue: 3000, orders: 24 },
  ],
};

const mockInsights = {
  data: {
    insights: [
      { id: '1', type: 'high_aov', message: 'High AOV detected', severity: 'info', isRead: false, isActioned: false },
    ],
  },
};

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let component: DashboardComponent;
  let dashSpy: jasmine.SpyObj<DashboardService>;

  beforeEach(async () => {
    dashSpy = jasmine.createSpyObj('DashboardService', [
      'getSummary', 'getGrowth', 'getInsights', 'getStores', 'markInsightRead', 'markInsightActioned',
    ]);
    dashSpy.getSummary.and.returnValue(of(mockSummary as any));
    dashSpy.getGrowth.and.returnValue(of(mockGrowth as any));
    dashSpy.getInsights.and.returnValue(of(mockInsights as any));
    dashSpy.getStores.and.returnValue(of({ data: [] } as any));

    await TestBed.configureTestingModule({
      imports: [
        DashboardComponent,
        HttpClientTestingModule,
        RouterTestingModule,
        NoopAnimationsModule,
      ],
      providers: [{ provide: DashboardService, useValue: dashSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call getSummary, getGrowth, getInsights on init', () => {
    expect(dashSpy.getSummary).toHaveBeenCalled();
    expect(dashSpy.getGrowth).toHaveBeenCalled();
    expect(dashSpy.getInsights).toHaveBeenCalled();
  });

  it('should populate summary after load', () => {
    expect(component.summary).toBeTruthy();
    expect(component.summary!.totalRevenue).toBe(12500);
    expect(component.summary!.totalOrders).toBe(100);
  });

  it('should build chart data from growth response', () => {
    expect(component.growthChartData.labels).toEqual(['2024-01', '2024-02', '2024-03']);
    expect(component.growthChartData.datasets.length).toBe(2);
    expect(component.growthChartData.datasets[0].data).toEqual([4000, 5500, 3000]);
  });

  it('should populate insights list', () => {
    expect(component.insights.length).toBe(1);
    expect(component.insights[0].type).toBe('high_aov');
  });

  it('unreadCount should count unread insights', () => {
    expect(component.unreadCount).toBe(1);
  });

  it('markRead() should call markInsightRead and set isRead', () => {
    const insight = component.insights[0];
    dashSpy.markInsightRead.and.returnValue(of({} as any));
    component.markRead(insight);
    expect(dashSpy.markInsightRead).toHaveBeenCalledWith('1');
    expect(insight.isRead).toBeTrue();
  });

  it('markRead() should not call service if already read', () => {
    const insight = { ...component.insights[0], isRead: true };
    component.markRead(insight);
    expect(dashSpy.markInsightRead).not.toHaveBeenCalled();
  });

  it('insightIcon() should return correct icon for known type', () => {
    expect(component.insightIcon('high_aov')).toBe('receipt_long');
    expect(component.insightIcon('anomaly')).toBe('troubleshoot');
    expect(component.insightIcon('unknown')).toBe('lightbulb');
  });

  it('loading should be false after data loads', () => {
    expect(component.loading).toBeFalse();
  });

  it('periods array should have 5 options', () => {
    expect(component.periods.length).toBe(5);
  });
});
