import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface DJLoginRequest {
  eventCode: string;
  pin: string;
}

export interface DJLoginResponse {
  token: string;
  event: {
    id: string;
    code: string;
    name: string;
    status: string;
  };
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class DJAuthService {
  private readonly TOKEN_KEY = 'dj_token';
  private readonly EVENT_KEY = 'dj_event';

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  /**
   * Connexion DJ par PIN
   */
  login(request: DJLoginRequest): Observable<DJLoginResponse> {
    return this.http.post<DJLoginResponse>('/api/auth/dj-pin-login', request)
      .pipe(
        tap(response => {
          this.storeToken(response.token);
          this.storeEvent(response.event);
          this.isAuthenticatedSubject.next(true);
        })
      );
  }

  /**
   * Déconnexion
   */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.EVENT_KEY);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/dj-login']);
  }

  /**
   * Vérifier si un token existe
   */
  isAuthenticated(): boolean {
    return this.hasToken();
  }

  /**
   * Récupérer le token JWT
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Récupérer les infos de l'événement
   */
  getCurrentEvent(): any {
    const eventJson = localStorage.getItem(this.EVENT_KEY);
    return eventJson ? JSON.parse(eventJson) : null;
  }

  /**
   * Stocker le token
   */
  private storeToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Stocker les infos événement
   */
  private storeEvent(event: any): void {
    localStorage.setItem(this.EVENT_KEY, JSON.stringify(event));
  }

  /**
   * Vérifier si un token existe
   */
  private hasToken(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }
}
