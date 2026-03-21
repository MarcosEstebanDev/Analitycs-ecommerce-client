import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AuthService } from '../auth/auth.service';
import { map } from 'rxjs';

export interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    RouterOutlet,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatDividerModule,
  ],
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss'],
})
export class ShellComponent {
  @ViewChild('sidenav') sidenav!: MatSidenav;

  private auth = inject(AuthService);
  private router = inject(Router);
  private bp = inject(BreakpointObserver);

  tenantId = this.auth.getTenantId() ?? '—';

  isHandset$ = this.bp.observe(Breakpoints.Handset).pipe(map((r) => r.matches));

  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard',   route: '/dashboard' },
    { label: 'Insights',  icon: 'lightbulb',   route: '/insights'  },
    { label: 'Equipo',    icon: 'group',        route: '/team'      },
    { label: 'Ajustes',   icon: 'settings',     route: '/settings'  },
    { label: 'Billing',   icon: 'credit_card',  route: '/billing'   },
  ];

  onNavClick() {
    this.isHandset$.subscribe((h) => { if (h) this.sidenav.close(); }).unsubscribe();
  }

  logout() {
    this.auth.logout();
  }
}
