import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface SuperAdmin {
  id: string;
  email: string;
  name?: string;
  lastLoginAt?: Date;
}

export interface LoginResponse {
  token: string;
  admin: SuperAdmin;
}

export interface GlobalStats {
  tenantsCount: number;
  activeTenantsCount: number;
  totalEventsCount: number;
  liveEventsCount: number;
  totalUsersCount: number;
  totalPlayersCount: number;
}

export interface Tenant {
  id: string;
  name: string;
  slug?: string;
  subscription_plan: string;
  subscription_status: string;
  billing_email: string;
  is_active: boolean;
  created_at: string;
  users?: any[];
  events?: any[];
  stats?: {
    usersCount: number;
    eventsCount: number;
    activeEventsCount: number;
    totalPlayers?: number;
    totalGames?: number;
    sessionsCount?: number;
    activeSessionsCount?: number;
  };
}

export interface LiveEvent {
  id: string;
  code: string;
  name: string;
  tenant_id: string;
  tenant: {
    id: string;
    name: string;
  };
  playersCount: number;
  teamsCount: number;
  created_at: string;
}

export interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  target_type?: string;
  target_id?: string;
  metadata_json?: string;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
  admin?: SuperAdmin;
}

@Injectable({
  providedIn: 'root',
})
export class SuperAdminService {
  private readonly apiUrl = '/api/backstage';
  private tokenSubject = new BehaviorSubject<string | null>(this.getStoredToken());
  private adminSubject = new BehaviorSubject<SuperAdmin | null>(this.getStoredAdmin());

  public token$ = this.tokenSubject.asObservable();
  public admin$ = this.adminSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ==================== Authentification ====================

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, { email, password }).pipe(
      tap((response) => {
        this.setToken(response.token);
        this.setAdmin(response.admin);
      }),
    );
  }

  logout(): void {
    this.clearAuth();
  }

  isAuthenticated(): boolean {
    return !!this.tokenSubject.value;
  }

  getToken(): string | null {
    return this.tokenSubject.value;
  }

  getAdmin(): SuperAdmin | null {
    return this.adminSubject.value;
  }

  // ==================== Statistiques ====================

  getGlobalStats(): Observable<GlobalStats> {
    const headers = this.getAuthHeaders();
    return this.http.get<GlobalStats>(`${this.apiUrl}/stats`, { headers });
  }

  // ==================== Gestion des Tenants ====================

  getAllTenants(filters?: {
    status?: string;
    plan?: string;
    search?: string;
  }): Observable<Tenant[]> {
    let params: any = {};
    if (filters?.status) params.status = filters.status;
    if (filters?.plan) params.plan = filters.plan;
    if (filters?.search) params.search = filters.search;

    const headers = this.getAuthHeaders();
    return this.http.get<Tenant[]>(`${this.apiUrl}/tenants`, { headers, params });
  }

  getTenantDetails(tenantId: string): Observable<Tenant> {
    const headers = this.getAuthHeaders();
    return this.http.get<Tenant>(`${this.apiUrl}/tenants/${tenantId}`, { headers });
  }

  suspendTenant(tenantId: string, reason?: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put(`${this.apiUrl}/tenants/${tenantId}/suspend`, { reason }, { headers });
  }

  reactivateTenant(tenantId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put(`${this.apiUrl}/tenants/${tenantId}/reactivate`, {}, { headers });
  }

  updateTenantPlan(tenantId: string, plan: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put(`${this.apiUrl}/tenants/${tenantId}/plan`, { plan }, { headers });
  }

  deleteTenant(tenantId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/tenants/${tenantId}`, {
      headers,
      body: { confirmation: 'DELETE' },
    });
  }

  // ==================== Impersonation ====================

  impersonateTenant(tenantId: string): Observable<{
    success: boolean;
    impersonationToken: string;
    tenant: any;
    user: any;
    expiresIn: number;
    warning: string;
  }> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(`${this.apiUrl}/impersonate/${tenantId}`, {}, { headers });
  }

  exitImpersonation(): Observable<{ success: boolean; message: string }> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(`${this.apiUrl}/exit-impersonation`, {}, { headers });
  }

  // ==================== Événements Live ====================

  getLiveEvents(): Observable<LiveEvent[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<LiveEvent[]>(`${this.apiUrl}/events/live`, { headers });
  }

  forceStopEvent(
    eventId: string,
    reason?: string,
  ): Observable<{
    success: boolean;
    message: string;
    eventId: string;
  }> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(
      `${this.apiUrl}/events/${eventId}/force-stop`,
      { reason },
      { headers },
    );
  }

  // ==================== Audit Logs ====================

  getAuditLogs(filters?: {
    adminId?: string;
    action?: string;
    targetType?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Observable<AuditLog[]> {
    let params: any = {};
    if (filters?.adminId) params.adminId = filters.adminId;
    if (filters?.action) params.action = filters.action;
    if (filters?.targetType) params.targetType = filters.targetType;
    if (filters?.startDate) params.startDate = filters.startDate;
    if (filters?.endDate) params.endDate = filters.endDate;
    if (filters?.limit) params.limit = filters.limit.toString();

    const headers = this.getAuthHeaders();
    return this.http.get<AuditLog[]>(`${this.apiUrl}/audit-logs`, { headers, params });
  }

  // ==================== Helpers privés ====================

  private getAuthHeaders(): HttpHeaders | undefined {
    const token = this.tokenSubject.value;
    if (!token) return undefined;
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  private setToken(token: string): void {
    localStorage.setItem('bt_super_admin_token', token);
    this.tokenSubject.next(token);
  }

  private setAdmin(admin: SuperAdmin): void {
    localStorage.setItem('bt_super_admin', JSON.stringify(admin));
    this.adminSubject.next(admin);
  }

  private clearAuth(): void {
    localStorage.removeItem('bt_super_admin_token');
    localStorage.removeItem('bt_super_admin');
    this.tokenSubject.next(null);
    this.adminSubject.next(null);
  }

  private getStoredToken(): string | null {
    return localStorage.getItem('bt_super_admin_token');
  }

  private getStoredAdmin(): SuperAdmin | null {
    const stored = localStorage.getItem('bt_super_admin');
    return stored ? JSON.parse(stored) : null;
  }
}
