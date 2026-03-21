import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="placeholder-page">
      <mat-icon class="placeholder-icon">settings</mat-icon>
      <h2>Ajustes</h2>
      <p>Próximamente — configurá umbrales de anomalías, notificaciones y perfil.</p>
    </div>
  `,
  styles: [`.placeholder-page { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:60vh; gap:16px; color:#64748b; text-align:center; }
  .placeholder-icon { font-size:64px; width:64px; height:64px; color:#818cf8; }`],
})
export class SettingsComponent {}
