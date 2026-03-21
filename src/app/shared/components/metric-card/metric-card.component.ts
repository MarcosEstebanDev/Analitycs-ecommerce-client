import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-metric-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './metric-card.component.html',
  styleUrls: ['./metric-card.component.scss'],
})
export class MetricCardComponent {
  @Input() label = '';
  @Input() value: number | string = 0;
  @Input() icon = 'bar_chart';
  @Input() prefix = '';
  @Input() suffix = '';
  @Input() color: 'primary' | 'accent' | 'warn' | 'success' = 'primary';
}
