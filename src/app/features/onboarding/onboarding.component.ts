import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/auth/auth.service';
import { environment } from '../../../environments/environment';

type Platform = 'shopify' | 'woocommerce';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatStepperModule,
  ],
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.scss'],
})
export class OnboardingComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = false;
  error = '';
  connected = false;
  platform: Platform = 'shopify';

  shopifyForm = this.fb.group({
    shopDomain: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+\.myshopify\.com$/)]],
    accessToken: ['', [Validators.required, Validators.minLength(10)]],
  });

  wooForm = this.fb.group({
    siteUrl: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
    consumerKey: ['', [Validators.required, Validators.pattern(/^ck_/)]],
    consumerSecret: ['', [Validators.required, Validators.pattern(/^cs_/)]],
  });

  selectPlatform(p: Platform) {
    this.platform = p;
    this.error = '';
  }

  get currentFormInvalid(): boolean {
    return this.platform === 'shopify'
      ? this.shopifyForm.invalid
      : this.wooForm.invalid;
  }

  connect() {
    if (this.currentFormInvalid) return;

    this.loading = true;
    this.error = '';
    const tenantId = this.auth.getTenantId();

    const request$ = this.platform === 'shopify'
      ? this.http.post(
          `${environment.apiUrl}/connectors/shopify/connect-store`,
          this.shopifyForm.value,
          { headers: { 'x-tenant-id': tenantId! } },
        )
      : this.http.post(
          `${environment.apiUrl}/connectors/woo/connect-store`,
          this.wooForm.value,
          { headers: { 'x-tenant-id': tenantId! } },
        );

    request$.subscribe({
      next: () => {
        this.connected = true;
        this.loading = false;
        setTimeout(() => this.router.navigate(['/dashboard']), 2000);
      },
      error: (err) => {
        this.error = err?.error?.message ?? 'Error al conectar la tienda';
        this.loading = false;
      },
    });
  }

  skip() {
    this.router.navigate(['/dashboard']);
  }
}
