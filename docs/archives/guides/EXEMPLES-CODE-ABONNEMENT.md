# Exemples de Code - Système d'Abonnement

Ce document fournit des exemples de code pratiques pour intégrer le système d'abonnement dans votre application.

---

## Table des Matières

1. [Configuration Client API](#configuration-client-api)
2. [Inscription et Connexion](#inscription-et-connexion)
3. [Gestion du Token JWT](#gestion-du-token-jwt)
4. [Gestion des Utilisateurs](#gestion-des-utilisateurs)
5. [Gestion des Abonnements](#gestion-des-abonnements)
6. [Intégration Stripe](#intégration-stripe)
7. [Exemples Frontend (Angular)](#exemples-frontend-angular)
8. [Tests Automatisés](#tests-automatisés)

---

## Configuration Client API

### TypeScript/JavaScript avec Axios

```typescript
import axios, { AxiosInstance, AxiosError } from 'axios';

interface TenantAuthResponse {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    displayName: string;
  };
  tenant: {
    id: string;
    name: string;
    slug: string;
    plan: string;
  };
}

class TenantApiClient {
  private api: AxiosInstance;
  private token: string | null = null;
  private refreshToken: string | null = null;

  constructor(baseURL: string = 'http://localhost:3001') {
    this.api = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Intercepteur pour ajouter le token automatiquement
    this.api.interceptors.request.use((config) => {
      if (this.token && config.headers) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    // Intercepteur pour gérer le refresh token
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && this.refreshToken) {
          try {
            const { data } = await this.api.post('/api/tenants/refresh-token', {
              refreshToken: this.refreshToken
            });

            this.setToken(data.token);

            if (originalRequest && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${data.token}`;
              return this.api.request(originalRequest);
            }
          } catch (refreshError) {
            this.clearAuth();
            throw refreshError;
          }
        }

        throw error;
      }
    );
  }

  setToken(token: string, refreshToken?: string) {
    this.token = token;
    if (refreshToken) {
      this.refreshToken = refreshToken;
    }

    // Sauvegarder dans localStorage
    localStorage.setItem('tenant_token', token);
    if (refreshToken) {
      localStorage.setItem('tenant_refresh_token', refreshToken);
    }
  }

  clearAuth() {
    this.token = null;
    this.refreshToken = null;
    localStorage.removeItem('tenant_token');
    localStorage.removeItem('tenant_refresh_token');
  }

  loadAuth() {
    this.token = localStorage.getItem('tenant_token');
    this.refreshToken = localStorage.getItem('tenant_refresh_token');
  }

  async register(data: {
    name: string;
    slug: string;
    ownerEmail: string;
    ownerPassword: string;
    ownerName: string;
    plan?: 'DEMO' | 'PER_EVENT' | 'MONTHLY';
  }): Promise<TenantAuthResponse> {
    const response = await this.api.post<TenantAuthResponse>(
      '/api/tenants/register',
      data
    );

    this.setToken(response.data.token, response.data.refreshToken);
    return response.data;
  }

  async login(
    email: string,
    password: string,
    tenantSlug: string
  ): Promise<TenantAuthResponse> {
    const response = await this.api.post<TenantAuthResponse>(
      '/api/tenants/login',
      { email, password, tenantSlug }
    );

    this.setToken(response.data.token, response.data.refreshToken);
    return response.data;
  }

  async getCurrentTenant() {
    const response = await this.api.get('/api/tenants/current');
    return response.data;
  }

  async getPaymentStatus() {
    const response = await this.api.get('/api/payments/status');
    return response.data;
  }

  // Autres méthodes...
}

// Usage
const apiClient = new TenantApiClient();
apiClient.loadAuth();

export default apiClient;
```

---

## Inscription et Connexion

### Exemple 1: Inscription d'un Nouveau Tenant

```typescript
import apiClient from './api-client';

async function registerNewTenant() {
  try {
    const result = await apiClient.register({
      name: 'Ma Super Entreprise',
      slug: 'ma-super-entreprise',
      ownerEmail: 'admin@masuperentreprise.com',
      ownerPassword: 'SecurePassword123!',
      ownerName: 'Jean Administrateur',
      plan: 'DEMO' // Commencer en mode démo
    });

    console.log('✅ Inscription réussie!');
    console.log('Tenant ID:', result.tenant.id);
    console.log('Plan:', result.tenant.plan);
    console.log('Token:', result.token);

    // Rediriger vers le dashboard
    window.location.href = '/dashboard';

  } catch (error: any) {
    if (error.response?.data?.error?.code === 'SLUG_ALREADY_EXISTS') {
      console.error('❌ Ce nom est déjà utilisé');
    } else {
      console.error('❌ Erreur inscription:', error.message);
    }
  }
}
```

### Exemple 2: Vérification de Disponibilité du Slug

```typescript
async function checkSlugAvailability(slug: string): Promise<boolean> {
  try {
    const response = await axios.get(
      `http://localhost:3001/api/tenants/check-slug/${slug}`
    );
    return response.data.available;
  } catch (error) {
    return false;
  }
}

// Usage dans un formulaire
async function handleSlugInput(slug: string) {
  const isAvailable = await checkSlugAvailability(slug);

  if (isAvailable) {
    console.log('✅ Slug disponible');
  } else {
    console.log('❌ Slug déjà utilisé');
  }
}
```

### Exemple 3: Connexion avec Gestion d'Erreurs

```typescript
async function loginUser(
  email: string,
  password: string,
  tenantSlug: string
) {
  try {
    const result = await apiClient.login(email, password, tenantSlug);

    console.log('✅ Connexion réussie');
    console.log('Rôle:', result.user.role);
    console.log('Plan tenant:', result.tenant.plan);

    // Sauvegarder les infos utilisateur
    localStorage.setItem('user', JSON.stringify(result.user));
    localStorage.setItem('tenant', JSON.stringify(result.tenant));

    return result;

  } catch (error: any) {
    const errorCode = error.response?.data?.error?.code;

    switch (errorCode) {
      case 'TENANT_NOT_FOUND':
        throw new Error('Organisation introuvable');
      case 'INVALID_CREDENTIALS':
        throw new Error('Email ou mot de passe incorrect');
      case 'TENANT_SUSPENDED':
        throw new Error('Compte suspendu, contactez le support');
      case 'SUBSCRIPTION_EXPIRED':
        throw new Error('Abonnement expiré');
      default:
        throw new Error('Erreur de connexion');
    }
  }
}
```

---

## Gestion du Token JWT

### Exemple 4: Hook React pour Authentification

```typescript
import { useState, useEffect, useContext, createContext } from 'react';
import apiClient from './api-client';

interface AuthContextType {
  user: any;
  tenant: any;
  isAuthenticated: boolean;
  login: (email: string, password: string, slug: string) => Promise<void>;
  logout: () => void;
  register: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Charger l'auth depuis localStorage
    apiClient.loadAuth();

    const savedUser = localStorage.getItem('user');
    const savedTenant = localStorage.getItem('tenant');

    if (savedUser && savedTenant) {
      setUser(JSON.parse(savedUser));
      setTenant(JSON.parse(savedTenant));
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (email: string, password: string, slug: string) => {
    const result = await apiClient.login(email, password, slug);

    setUser(result.user);
    setTenant(result.tenant);
    setIsAuthenticated(true);

    localStorage.setItem('user', JSON.stringify(result.user));
    localStorage.setItem('tenant', JSON.stringify(result.tenant));
  };

  const logout = () => {
    apiClient.clearAuth();
    setUser(null);
    setTenant(null);
    setIsAuthenticated(false);
    localStorage.clear();
  };

  const register = async (data: any) => {
    const result = await apiClient.register(data);

    setUser(result.user);
    setTenant(result.tenant);
    setIsAuthenticated(true);

    localStorage.setItem('user', JSON.stringify(result.user));
    localStorage.setItem('tenant', JSON.stringify(result.tenant));
  };

  return (
    <AuthContext.Provider value={{
      user,
      tenant,
      isAuthenticated,
      login,
      logout,
      register
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### Exemple 5: Guard de Route avec Vérification Permissions

```typescript
import { useAuth } from './auth-context';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'OWNER' | 'ADMIN' | 'USER';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredRole) {
    const roleHierarchy = { OWNER: 3, ADMIN: 2, USER: 1 };
    const userLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0;
    const requiredLevel = roleHierarchy[requiredRole];

    if (userLevel < requiredLevel) {
      return <Navigate to="/unauthorized" />;
    }
  }

  return <>{children}</>;
}

// Usage
<Route path="/settings" element={
  <ProtectedRoute requiredRole="OWNER">
    <SettingsPage />
  </ProtectedRoute>
} />
```

---

## Gestion des Utilisateurs

### Exemple 6: Créer un Nouvel Utilisateur

```typescript
async function inviteUser(
  email: string,
  role: 'ADMIN' | 'USER',
  displayName: string
) {
  try {
    const response = await apiClient.api.post('/api/tenants/users', {
      email,
      password: generateTemporaryPassword(), // Générer un mot de passe temporaire
      role,
      displayName
    });

    console.log('✅ Utilisateur créé:', response.data.user);

    // Envoyer un email d'invitation
    await sendInvitationEmail(email, response.data.user.id);

    return response.data.user;

  } catch (error: any) {
    const errorCode = error.response?.data?.error?.code;

    switch (errorCode) {
      case 'EMAIL_ALREADY_EXISTS':
        throw new Error('Cet email est déjà utilisé');
      case 'USER_LIMIT_REACHED':
        throw new Error('Limite d\'utilisateurs atteinte pour votre plan');
      case 'INSUFFICIENT_PERMISSIONS':
        throw new Error('Permissions insuffisantes');
      default:
        throw new Error('Erreur création utilisateur');
    }
  }
}

function generateTemporaryPassword(): string {
  return Math.random().toString(36).slice(-12) + 'A1!';
}
```

### Exemple 7: Liste des Utilisateurs avec Filtre

```typescript
interface User {
  id: string;
  email: string;
  role: string;
  displayName: string;
  isActive: boolean;
  lastLoginAt: string;
  createdAt: string;
}

async function getUsersList(
  filter?: {
    role?: string;
    isActive?: boolean;
    search?: string;
  }
): Promise<User[]> {
  const response = await apiClient.api.get('/api/tenants/users');
  let users: User[] = response.data.users;

  // Filtrer côté client
  if (filter) {
    if (filter.role) {
      users = users.filter(u => u.role === filter.role);
    }

    if (filter.isActive !== undefined) {
      users = users.filter(u => u.isActive === filter.isActive);
    }

    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      users = users.filter(u =>
        u.email.toLowerCase().includes(searchLower) ||
        u.displayName.toLowerCase().includes(searchLower)
      );
    }
  }

  return users;
}

// Usage
const activeAdmins = await getUsersList({
  role: 'ADMIN',
  isActive: true
});
```

---

## Gestion des Abonnements

### Exemple 8: Vérifier les Limites et Capacités

```typescript
interface SubscriptionStatus {
  subscription: {
    plan: string;
    status: string;
    expiresAt: string | null;
    isActive: boolean;
  };
  limits: {
    maxEvents: number;
    maxPlayersPerEvent: number;
    maxUsers: number;
  };
  usage: {
    eventsCount: number;
    usersCount: number;
    activeSessionsCount: number;
    totalPlayersCount: number;
  };
  hasActiveSession: boolean;
  canCreateEvent: boolean;
}

async function checkSubscriptionLimits(): Promise<SubscriptionStatus> {
  const response = await apiClient.api.get('/api/payments/status');
  return response.data;
}

// Usage: Bloquer la création d'événement si limite atteinte
async function createEvent(eventData: any) {
  const status = await checkSubscriptionLimits();

  if (!status.canCreateEvent) {
    if (status.usage.eventsCount >= status.limits.maxEvents) {
      throw new Error(
        `Limite d'événements atteinte (${status.limits.maxEvents}). ` +
        `Passez au plan supérieur.`
      );
    }
  }

  // Créer l'événement
  // ...
}
```

### Exemple 9: Upgrade de Plan avec Stripe

```typescript
async function upgradeToPlan(
  plan: 'PER_EVENT' | 'MONTHLY',
  successUrl: string = window.location.origin + '/success',
  cancelUrl: string = window.location.origin + '/cancel'
) {
  try {
    const response = await apiClient.api.post(
      '/api/payments/checkout/subscription',
      { plan, successUrl, cancelUrl }
    );

    // Rediriger vers Stripe Checkout
    window.location.href = response.data.checkoutUrl;

  } catch (error: any) {
    console.error('❌ Erreur upgrade:', error);
    throw error;
  }
}

// Usage dans un bouton
function UpgradeButton() {
  const handleUpgrade = async () => {
    try {
      await upgradeToPlan('MONTHLY');
    } catch (error) {
      alert('Erreur lors de la mise à niveau');
    }
  };

  return (
    <button onClick={handleUpgrade}>
      Passer au Plan Mensuel (49€/mois)
    </button>
  );
}
```

### Exemple 10: Acheter une Session Temporaire

```typescript
async function buyTemporarySession(
  duration: '2days' | '1week' | '1month',
  sessionName: string
) {
  try {
    const response = await apiClient.api.post(
      '/api/payments/checkout/session',
      {
        sessionType: duration,
        sessionName,
        successUrl: window.location.origin + '/dashboard',
        cancelUrl: window.location.origin + '/pricing'
      }
    );

    console.log('Session créée:', response.data.tenantSessionId);

    // Rediriger vers Stripe
    window.location.href = response.data.checkoutUrl;

  } catch (error) {
    console.error('❌ Erreur achat session:', error);
    throw error;
  }
}

// Usage
await buyTemporarySession('1week', 'Semaine Halloween 2025');
```

---

## Intégration Stripe

### Exemple 11: Gérer le Retour de Stripe Checkout

```typescript
// Page de succès après paiement
function SuccessPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');

    if (sessionId) {
      // Vérifier le paiement
      verifyPayment(sessionId);
    }
  }, []);

  const verifyPayment = async (sessionId: string) => {
    try {
      // Rafraîchir le statut d'abonnement
      const status = await apiClient.getPaymentStatus();

      console.log('✅ Paiement confirmé!');
      console.log('Nouveau plan:', status.subscription.plan);

      // Afficher un message de succès
      showSuccessMessage(status.subscription.plan);

    } catch (error) {
      console.error('❌ Erreur vérification paiement:', error);
    }
  };

  return <div>Traitement du paiement en cours...</div>;
}
```

### Exemple 12: Portail Client Stripe

```typescript
async function openBillingPortal() {
  try {
    const response = await apiClient.api.post('/api/payments/portal', {
      returnUrl: window.location.href
    });

    // Rediriger vers le portail Stripe
    window.location.href = response.data.portalUrl;

  } catch (error: any) {
    if (error.response?.data?.error?.code === 'NO_CUSTOMER') {
      alert('Aucun abonnement actif');
    } else {
      console.error('❌ Erreur portail:', error);
    }
  }
}

// Bouton de gestion de facturation
function BillingButton() {
  return (
    <button onClick={openBillingPortal}>
      Gérer ma facturation
    </button>
  );
}
```

---

## Exemples Frontend (Angular)

### Exemple 13: Service Angular d'Authentification

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class TenantAuthService {
  private baseUrl = 'http://localhost:3001/api';
  private tokenSubject = new BehaviorSubject<string | null>(null);
  public token$ = this.tokenSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadToken();
  }

  private loadToken() {
    const token = localStorage.getItem('tenant_token');
    if (token) {
      this.tokenSubject.next(token);
    }
  }

  register(data: {
    name: string;
    slug: string;
    ownerEmail: string;
    ownerPassword: string;
    ownerName: string;
    plan?: string;
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/tenants/register`, data)
      .pipe(
        tap((response: any) => {
          this.setToken(response.token);
        })
      );
  }

  login(email: string, password: string, tenantSlug: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/tenants/login`, {
      email,
      password,
      tenantSlug
    }).pipe(
      tap((response: any) => {
        this.setToken(response.token);
      })
    );
  }

  private setToken(token: string) {
    localStorage.setItem('tenant_token', token);
    this.tokenSubject.next(token);
  }

  logout() {
    localStorage.removeItem('tenant_token');
    this.tokenSubject.next(null);
  }

  getAuthHeaders(): HttpHeaders {
    const token = this.tokenSubject.value;
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }
}
```

### Exemple 14: Intercepteur HTTP Angular

```typescript
import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { TenantAuthService } from './tenant-auth.service';

@Injectable()
export class TenantAuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  constructor(private authService: TenantAuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Ajouter le token à chaque requête
    const token = localStorage.getItem('tenant_token');

    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          return this.handle401Error(request, next);
        }
        return throwError(() => error);
      })
    );
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler) {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      const refreshToken = localStorage.getItem('tenant_refresh_token');

      if (refreshToken) {
        // Rafraîchir le token
        // Implementation similaire au client axios
      }
    }

    return this.refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap((token) => {
        return next.handle(request.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        }));
      })
    );
  }
}
```

---

## Tests Automatisés

### Exemple 15: Tests Jest/Vitest

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import apiClient from './api-client';

describe('Tenant API', () => {
  let tenantData: any;
  let token: string;

  it('should register a new tenant', async () => {
    const timestamp = Date.now();

    const result = await apiClient.register({
      name: `Test Company ${timestamp}`,
      slug: `test-${timestamp}`,
      ownerEmail: `owner${timestamp}@test.com`,
      ownerPassword: 'TestPassword123!',
      ownerName: 'Test Owner',
      plan: 'DEMO'
    });

    expect(result.tenant).toBeDefined();
    expect(result.token).toBeDefined();
    expect(result.tenant.plan).toBe('DEMO');

    tenantData = result;
    token = result.token;
  });

  it('should login with credentials', async () => {
    const result = await apiClient.login(
      tenantData.user.email,
      'TestPassword123!',
      tenantData.tenant.slug
    );

    expect(result.token).toBeDefined();
    expect(result.user.role).toBe('OWNER');
  });

  it('should get current tenant info', async () => {
    const info = await apiClient.getCurrentTenant();

    expect(info.tenant).toBeDefined();
    expect(info.tenant.plan).toBe('DEMO');
    expect(info.usage).toBeDefined();
  });

  it('should check subscription limits', async () => {
    const status = await apiClient.getPaymentStatus();

    expect(status.subscription.plan).toBe('DEMO');
    expect(status.limits.maxEvents).toBe(999);
    expect(status.canCreateEvent).toBe(true);
  });

  it('should create a new user', async () => {
    const newUser = await apiClient.api.post('/api/tenants/users', {
      email: `user${Date.now()}@test.com`,
      password: 'UserPass123!',
      role: 'ADMIN',
      displayName: 'Test Admin'
    });

    expect(newUser.data.user).toBeDefined();
    expect(newUser.data.user.role).toBe('ADMIN');
  });
});
```

---

## Conclusion

Ces exemples couvrent les cas d'utilisation les plus courants du système d'abonnement. Pour plus d'informations, consultez:

- [GUIDE-UTILISATION-ABONNEMENT.md](GUIDE-UTILISATION-ABONNEMENT.md) - Documentation complète de l'API
- [RAPPORT-TESTS-ABONNEMENT.md](RAPPORT-TESTS-ABONNEMENT.md) - Rapport de tests détaillé
- [test-subscription-complete.ts](apps/api/test-subscription-complete.ts) - Script de tests automatisés

---

**Besoin d'aide ?** Consultez la documentation API ou les logs serveur pour plus de détails.
