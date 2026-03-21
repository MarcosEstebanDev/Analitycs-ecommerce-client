import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="placeholder-page">
      <mat-icon class="placeholder-icon">credit_card</mat-icon>
      <h2>Billing & Plan</h2>
      <p>Próximamente — gestioná tu suscripción y método de pago.</p>
    </div>
  `,
  styles: [`.placeholder-page { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:60vh; gap:16px; color:#64748b; text-align:center; }
  .placeholder-icon { font-size:64px; width:64px; height:64px; color:#818cf8; }`],
})
export class BillingComponent {}
