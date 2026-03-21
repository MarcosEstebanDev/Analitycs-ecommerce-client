import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { ShellComponent } from './core/shell/shell.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'onboarding',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/onboarding/onboarding.component').then((m) => m.OnboardingComponent),
  },
  // Authenticated shell — all protected pages render inside ShellComponent
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./features/orders/orders.component').then((m) => m.OrdersComponent),
      },
      {
        path: 'customers',
        loadComponent: () =>
          import('./features/customers/customers.component').then((m) => m.CustomersComponent),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./features/products/products.component').then((m) => m.ProductsComponent),
      },
      {
        path: 'connectors',
        loadComponent: () =>
          import('./features/connectors/connectors.component').then((m) => m.ConnectorsComponent),
      },
      {
        path: 'insights',
        loadComponent: () =>
          import('./features/insights/insights.component').then((m) => m.InsightsComponent),
      },
      {
        path: 'team',
        loadComponent: () =>
          import('./features/team/team.component').then((m) => m.TeamComponent),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings.component').then((m) => m.SettingsComponent),
      },
      {
        path: 'cohort',
        loadComponent: () =>
          import('./features/cohort/cohort.component').then((m) => m.CohortComponent),
      },
      {
        path: 'forecast',
        loadComponent: () =>
          import('./features/forecast/forecast.component').then((m) => m.ForecastComponent),
      },
      {
        path: 'billing',
        loadComponent: () =>
          import('./features/billing/billing.component').then((m) => m.BillingComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];

