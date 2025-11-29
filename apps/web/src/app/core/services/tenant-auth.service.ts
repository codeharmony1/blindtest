import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

export interface TenantUser {
  id: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'DJ' | 'VIEWER';
  displayName: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: 'TRIAL' | 'BASIC' | 'PRO' | 'ENTERPRISE';
  status: string;
  expiresAt?: string;
}

export interface AuthResponse {
  user: TenantUser;
  tenant: Tenant;
  token: string;
  refreshToken?: string;
}

export interface RegisterRequest {
  name: string;
  slug?: string;
  ownerEmail: string;
  ownerPassword: string;
  ownerName?: string;
  plan?: 'TRIAL' | 'BASIC' | 'PRO' | 'ENTERPRISE';
}

export interface LoginRequest {
  email: string;
  password: string;
  tenantSlug?: string; // Optionnel, utilise 'default' par défaut
}

@Injectable({
  providedIn: 'root',
})
export class TenantAuthService {
  private readonly API_URL = '/api';
  private readonly TOKEN_KEY = 'tenant_auth_token';
  private readonly REFRESH_TOKEN_KEY = 'tenant_refresh_token';
  private readonly USER_KEY = 'tenant_user';
  private readonly TENANT_KEY = 'tenant_info';

  private currentUserSubject = new BehaviorSubject<TenantUser | null>(null);
  private currentTenantSubject = new BehaviorSubject<Tenant | null>(null);

  public currentUser$ = this.currentUserSubject.asObservable();
  public currentTenant$ = this.currentTenantSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
    this.loadStoredAuth();
  }

  private loadStoredAuth(): void {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const user = localStorage.getItem(this.USER_KEY);
    const tenant = localStorage.getItem(this.TENANT_KEY);

    if (token && user && tenant) {
      try {
        this.currentUserSubject.next(JSON.parse(user));
        this.currentTenantSubject.next(JSON.parse(tenant));
      } catch (error) {
        this.clearAuth();
      }
    }
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.API_URL}/tenants/register`, request)
      .pipe(tap((response) => this.handleAuthResponse(response)));
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.API_URL}/tenants/login`, request)
      .pipe(tap((response) => this.handleAuthResponse(response)));
  }

  logout(): void {
    this.clearAuth();
    this.router.navigate(['/auth/login']);
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    return this.http
      .post<AuthResponse>(`${this.API_URL}/tenants/refresh-token`, { refreshToken })
      .pipe(tap((response) => this.handleAuthResponse(response)));
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY) && !!this.currentUserSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getCurrentUser(): TenantUser | null {
    return this.currentUserSubject.value;
  }

  getCurrentTenant(): Tenant | null {
    return this.currentTenantSubject.value;
  }

  private handleAuthResponse(response: AuthResponse): void {
    // Stocker le token et les informations
    localStorage.setItem(this.TOKEN_KEY, response.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
    localStorage.setItem(this.TENANT_KEY, JSON.stringify(response.tenant));

    if (response.refreshToken) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
    }

    // Mettre à jour les subjects
    this.currentUserSubject.next(response.user);
    this.currentTenantSubject.next(response.tenant);
  }

  private clearAuth(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.TENANT_KEY);

    this.currentUserSubject.next(null);
    this.currentTenantSubject.next(null);
  }
}
