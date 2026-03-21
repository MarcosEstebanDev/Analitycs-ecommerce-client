import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-insights',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <div class="placeholder-page">
      <mat-icon class="placeholder-icon">lightbulb</mat-icon>
      <h2>Insights & Alertas</h2>
      <p>Próximamente — vista detallada de todos los insights y alertas generados.</p>
    </div>
  `,
  styles: [`.placeholder-page { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:60vh; gap:16px; color:#64748b; text-align:center; }
  .placeholder-icon { font-size:64px; width:64px; height:64px; color:#818cf8; }`],
})
export class InsightsComponent {}
