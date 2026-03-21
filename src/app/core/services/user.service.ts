import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'admin' | 'viewer';
  isActive: boolean;
  tenantId: string;
  createdAt: string;
}

export interface TenantSettings {
  webhookUrl?: string;
  slackUrl?: string;
  emailNotifications?: boolean;
  revenueDropThreshold?: number;
  ordersDropThreshold?: number;
  aovDeviationThreshold?: number;
  [key: string]: unknown;
}

export interface TenantSettingsData {
  settings: TenantSettings;
  plan: string;
  name: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/users`;

  getUsers(): Observable<User[]> {
    return this.http
      .get<ApiResponse<User[]>>(this.base)
      .pipe(map((r) => r.data));
  }

  createUser(payload: {
    email: string;
    password: string;
    role: 'admin' | 'viewer';
    firstName?: string;
    lastName?: string;
  }): Observable<User> {
    return this.http
      .post<ApiResponse<User>>(this.base, payload)
      .pipe(map((r) => r.data));
  }

  updateUser(
    id: string,
    payload: {
      firstName?: string;
      lastName?: string;
      role?: 'admin' | 'viewer';
      isActive?: boolean;
    }
  ): Observable<User> {
    return this.http
      .put<ApiResponse<User>>(`${this.base}/${id}`, payload)
      .pipe(map((r) => r.data));
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  getMe(): Observable<User> {
    return this.http
      .get<ApiResponse<User>>(`${this.base}/me`)
      .pipe(map((r) => r.data));
  }

  updateMe(payload: { firstName?: string; lastName?: string }): Observable<User> {
    return this.http
      .patch<ApiResponse<User>>(`${this.base}/me`, payload)
      .pipe(map((r) => r.data));
  }

  changePassword(payload: {
    currentPassword: string;
    newPassword: string;
  }): Observable<void> {
    return this.http.patch<void>(`${this.base}/me/password`, payload);
  }

  getTenantSettings(): Observable<TenantSettingsData> {
    return this.http
      .get<ApiResponse<TenantSettingsData>>(`${this.base}/me/tenant-settings`)
      .pipe(map((r) => r.data));
  }

  updateTenantSettings(
    payload: Record<string, unknown>
  ): Observable<TenantSettingsData> {
    return this.http
      .patch<ApiResponse<TenantSettingsData>>(
        `${this.base}/me/tenant-settings`,
        payload
      )
      .pipe(map((r) => r.data));
  }
}
