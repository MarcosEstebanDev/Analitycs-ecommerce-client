import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, RouterModule],
  template: `
    <div class="empty-state">
      <div class="empty-state__icon-wrap" [style.background]="iconBg">
        <mat-icon [style.color]="iconColor">{{ icon }}</mat-icon>
      </div>
      <h3 class="empty-state__title">{{ title }}</h3>
      <p class="empty-state__desc">{{ description }}</p>
      @if (actionLabel && actionRoute) {
        <a mat-flat-button color="primary" [routerLink]="actionRoute">
          <mat-icon>{{ actionIcon }}</mat-icon> {{ actionLabel }}
        </a>
      }
      @if (actionLabel && !actionRoute) {
        <ng-content/>
      }
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      padding: 64px 32px; gap: 14px; text-align: center;
    }
    .empty-state__icon-wrap {
      width: 72px; height: 72px; border-radius: 20px;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 4px;
      mat-icon { font-size: 34px; width: 34px; height: 34px; }
    }
    .empty-state__title { font-size: 18px; font-weight: 700; color: #111827; margin: 0; }
    .empty-state__desc  { font-size: 14px; color: #6b7280; margin: 0; max-width: 360px; line-height: 1.5; }
  `],
})
export class EmptyStateComponent {
  @Input() icon = 'inbox';
  @Input() title = 'Sin datos';
  @Input() description = '';
  @Input() actionLabel = '';
  @Input() actionRoute = '';
  @Input() actionIcon = 'add';
  @Input() iconColor = '#6366f1';
  @Input() iconBg = '#ede9fe';
}
