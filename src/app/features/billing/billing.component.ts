import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  isCurrent: boolean;
  highlight?: boolean;
}

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './billing.component.html',
  styleUrls: ['./billing.component.scss'],
})
export class BillingComponent implements OnInit {
  private http = inject(HttpClient);
  private snack = inject(MatSnackBar);

  currentPlan = 'growth';
  tenantName = '';
  loading = true;
  upgrading: string | null = null;

  plans: Plan[] = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      period: '/mes',
      description: 'Para probar la plataforma',
      isCurrent: false,
      features: [
        '1 tienda conectada',
        'Hasta 100 pedidos/mes',
        'Dashboard básico',
        'Retención 7 días',
      ],
    },
    {
      id: 'growth',
      name: 'Growth',
      price: 49,
      period: '/mes',
      description: 'Para negocios en crecimiento',
      highlight: true,
      isCurrent: false,
      features: [
        '3 tiendas conectadas',
        'Pedidos ilimitados',
        'Insights automáticos',
        'Detección de anomalías',
        'Retención 90 días',
        'Webhooks & Slack',
      ],
    },
    {
      id: 'scale',
      name: 'Scale',
      price: 149,
      period: '/mes',
      description: 'Para equipos y alto volumen',
      isCurrent: false,
      features: [
        'Tiendas ilimitadas',
        'Pedidos ilimitados',
        'Todo de Growth',
        'Acceso API avanzada',
        'Retención 1 año',
        'Soporte prioritario',
        'Team management',
      ],
    },
  ];

  ngOnInit() {
    this.http.get<{ success: boolean; data: { settings: any; plan: string; name: string } }>(
      `${environment.apiUrl}/users/me/tenant-settings`,
    ).subscribe({
      next: (res) => {
        this.currentPlan = res.data.plan;
        this.tenantName = res.data.name;
        this.plans = this.plans.map((p) => ({ ...p, isCurrent: p.id === this.currentPlan }));
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  upgrade(planId: string) {
    if (planId === this.currentPlan) return;
    this.upgrading = planId;

    // Stripe is in dry-run mode — show demo message
    setTimeout(() => {
      this.upgrading = null;
      this.snack.open(
        `Upgrade a ${planId} — integración con Stripe disponible próximamente.`,
        'OK',
        { duration: 4000 },
      );
    }, 800);
  }

  planIcon(planId: string): string {
    const map: Record<string, string> = { free: 'rocket_launch', growth: 'trending_up', scale: 'bolt' };
    return map[planId] ?? 'star';
  }
}

