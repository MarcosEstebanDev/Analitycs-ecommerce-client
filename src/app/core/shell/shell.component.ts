import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AuthService } from '../auth/auth.service';
import { UserService, User } from '../services/user.service';
import { NotificationService } from '../services/notification.service';
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
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatMenuModule,
    MatDividerModule,
    MatBadgeModule,
  ],
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss'],
})
export class ShellComponent implements OnInit {
  @ViewChild('sidenav') sidenav!: MatSidenav;

  private auth = inject(AuthService);
  private router = inject(Router);
  private bp = inject(BreakpointObserver);
  private userService = inject(UserService);
  notifService = inject(NotificationService);

  tenantId = this.auth.getTenantId() ?? '—';
  currentUser: User | null = null;

  isHandset$ = this.bp.observe(Breakpoints.Handset).pipe(map((r) => r.matches));

  navItems: NavItem[] = [
    { label: 'Dashboard',   icon: 'dashboard',    route: '/dashboard'  },
    { label: 'Órdenes',     icon: 'receipt_long', route: '/orders'     },
    { label: 'Clientes',    icon: 'people',        route: '/customers'  },
    { label: 'Productos',   icon: 'inventory_2',   route: '/products'   },
    { label: 'Conectores',  icon: 'hub',           route: '/connectors' },
    { label: 'Insights',    icon: 'lightbulb',     route: '/insights'   },
    { label: 'Equipo',      icon: 'group',         route: '/team'       },
    { label: 'Ajustes',     icon: 'settings',      route: '/settings'   },
    { label: 'Billing',     icon: 'credit_card',   route: '/billing'    },
  ];

  ngOnInit(): void {
    this.userService.getMe().subscribe({
      next: (user) => { this.currentUser = user; },
    });
    this.notifService.connect();
  }

  get userInitials(): string {
    if (!this.currentUser) return '?';
    const f = (this.currentUser.firstName ?? '').charAt(0).toUpperCase();
    const l = (this.currentUser.lastName ?? '').charAt(0).toUpperCase();
    if (f || l) return `${f}${l}`;
    return this.currentUser.email.charAt(0).toUpperCase();
  }

  get userDisplayName(): string {
    if (!this.currentUser) return '';
    const name = `${this.currentUser.firstName ?? ''} ${this.currentUser.lastName ?? ''}`.trim();
    return name || this.currentUser.email;
  }

  onNavClick() {
    this.isHandset$.subscribe((h) => { if (h) this.sidenav.close(); }).unsubscribe();
  }

  logout() {
    this.auth.logout();
  }
}
