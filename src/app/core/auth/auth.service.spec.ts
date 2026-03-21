import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService, LoginResponse } from './auth.service';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  const mockResponse: LoginResponse = {
    accessToken: 'access-jwt',
    refreshToken: 'refresh-jwt',
    tokenType: 'Bearer',
    tenantId: 'tenant-123',
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('login() stores tokens and emits isLoggedIn = true', fakeAsync(() => {
    let emitted = false;
    service.login('user@test.com', 'password123').subscribe();
    http.expectOne(`${environment.apiUrl}/auth/login`).flush(mockResponse);
    tick();

    service.isLoggedIn$.subscribe((v) => (emitted = v));
    expect(emitted).toBeTrue();
    expect(localStorage.getItem('access_token')).toBe('access-jwt');
    expect(localStorage.getItem('refresh_token')).toBe('refresh-jwt');
    expect(localStorage.getItem('tenant_id')).toBe('tenant-123');
  }));

  it('getToken() returns stored access token', () => {
    localStorage.setItem('access_token', 'my-token');
    expect(service.getToken()).toBe('my-token');
  });

  it('getToken() returns null when not set', () => {
    expect(service.getToken()).toBeNull();
  });

  it('getTenantId() returns stored tenant id', () => {
    localStorage.setItem('tenant_id', 'tid-42');
    expect(service.getTenantId()).toBe('tid-42');
  });

  it('logout() clears localStorage and navigates to /login', fakeAsync(() => {
    localStorage.setItem('access_token', 'tok');
    localStorage.setItem('refresh_token', 'ref');
    localStorage.setItem('tenant_id', 'tid');

    service.logout();
    tick();

    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
    expect(localStorage.getItem('tenant_id')).toBeNull();

    let loggedIn = true;
    service.isLoggedIn$.subscribe((v) => (loggedIn = v));
    expect(loggedIn).toBeFalse();
  }));

  it('refreshToken() returns null when no refresh token stored', () => {
    expect(service.refreshToken()).toBeNull();
  });

  it('refreshToken() calls POST /auth/refresh and stores new accessToken', fakeAsync(() => {
    localStorage.setItem('refresh_token', 'old-refresh');
    service.refreshToken()!.subscribe();
    http.expectOne(`${environment.apiUrl}/auth/refresh`).flush({ accessToken: 'new-token', tokenType: 'Bearer' });
    tick();
    expect(localStorage.getItem('access_token')).toBe('new-token');
  }));

  it('isLoggedIn$ is false when localStorage is empty initially', () => {
    let value!: boolean;
    service.isLoggedIn$.subscribe((v) => (value = v));
    expect(value).toBeFalse();
  });
});
