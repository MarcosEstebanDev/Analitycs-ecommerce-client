import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  isActive: boolean;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class TenantService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/tenants`;

  list() {
    return this.http.get<{ success: boolean; data: Tenant[] }>(this.base);
  }

  getById(tenantId: string) {
    return this.http.get<{ success: boolean; data: { tenant: Tenant; stores: unknown[] } }>(
      `${this.base}/${tenantId}`,
    );
  }

  create(name: string, slug: string, plan = 'free') {
    return this.http.post<{ success: boolean; data: Tenant }>(this.base, { name, slug, plan });
  }
}
