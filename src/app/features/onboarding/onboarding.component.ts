import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/auth/auth.service';
import { environment } from '../../../environments/environment';

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

  storeForm = this.fb.group({
    shopDomain: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+\.myshopify\.com$/)]],
    accessToken: ['', [Validators.required, Validators.minLength(10)]],
  });

  connect() {
    if (this.storeForm.invalid) return;

    this.loading = true;
    this.error = '';

    const { shopDomain, accessToken } = this.storeForm.value;
    const tenantId = this.auth.getTenantId();

    this.http
      .post(
        `${environment.apiUrl}/connectors/shopify/connect-store`,
        { shopDomain, accessToken },
        { headers: { 'x-tenant-id': tenantId! } },
      )
      .subscribe({
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
