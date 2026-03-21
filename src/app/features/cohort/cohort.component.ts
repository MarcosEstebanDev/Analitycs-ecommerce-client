import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { DashboardService, CohortRow } from '../../core/services/dashboard.service';

@Component({
  selector: 'app-cohort',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonToggleModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './cohort.component.html',
  styleUrls: ['./cohort.component.scss'],
})
export class CohortComponent implements OnInit {
  private dashboard = inject(DashboardService);

  loading = true;
  error = '';
  months = 6;
  cohorts: CohortRow[] = [];
  maxPeriods = 0;

  get periodLabels(): string[] {
    return Array.from({ length: this.maxPeriods }, (_, i) =>
      i === 0 ? 'Mes 0\n(Adq.)' : `Mes ${i}`,
    );
  }

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.error = '';
    this.dashboard.getCohortRetention(this.months).subscribe({
      next: (res) => {
        if (res.success && res.data?.cohorts?.length > 0) {
          this.cohorts = res.data.cohorts;
          this.maxPeriods = res.data.maxPeriods;
        } else {
          this.cohorts = [];
          this.maxPeriods = 0;
          if (!res.success) {
            this.error = 'No se pudo obtener los datos de retención. Verificá que el backend esté corriendo.';
          }
        }
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        if (err?.status === 0) {
          this.error = 'No se puede conectar al servidor. Verificá que el backend esté corriendo.';
        } else if (err?.status === 404) {
          this.error = 'Endpoint no encontrado. Actualizá el backend.';
        } else {
          this.error = 'Error cargando datos de retención. Intentá de nuevo más tarde.';
        }
      },
    });
  }

  emptyArray(n: number): number[] {
    return Array(Math.max(0, n)).fill(0);
  }

  /** Converts a retention array to indexed items for @for tracking */
  indexedRetention(retention: number[]): { idx: number; pct: number }[] {
    return retention.map((pct, idx) => ({ idx, pct }));
  }

  /** Returns a CSS background color based on retention percentage */
  cellColor(value: number, isAcquisition: boolean): string {
    if (isAcquisition) return '#3f51b5';
    if (value === 0) return '#f5f5f5';
    // Interpolate from light blue (#e3f2fd) at 1% to deep blue (#1565c0) at 100%
    const intensity = Math.min(value / 100, 1);
    const r = Math.round(229 - (229 - 21) * intensity);
    const g = Math.round(242 - (242 - 101) * intensity);
    const b = Math.round(253 - (253 - 192) * intensity);
    return `rgb(${r},${g},${b})`;
  }

  cellTextColor(value: number, isAcquisition: boolean): string {
    if (isAcquisition) return 'white';
    if (value === 0) return '#9e9e9e';
    return value > 50 ? 'white' : '#1a237e';
  }
}
