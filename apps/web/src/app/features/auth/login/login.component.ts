import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { TenantAuthService, LoginRequest } from '../../../core/services/tenant-auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <header class="auth-header">
          <h1 class="auth-title">
            <span class="logo">🎵</span>
            Se connecter
          </h1>
          <p class="auth-subtitle">
            Accédez à votre espace d'administration
          </p>
        </header>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="auth-form">
          <div class="form-group">
            <label for="email">Adresse email</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              placeholder="exemple@email.com"
              autocomplete="email"
              [class.error]="isFieldInvalid('email')"
            />
            <div class="field-error" *ngIf="isFieldInvalid('email')">
              <span *ngIf="loginForm.get('email')?.errors?.['required']">
                L'email est requis
              </span>
              <span *ngIf="loginForm.get('email')?.errors?.['email']">
                Format d'email invalide
              </span>
            </div>
          </div>

          <div class="form-group">
            <label for="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              formControlName="password"
              placeholder="••••••••"
              autocomplete="current-password"
              [class.error]="isFieldInvalid('password')"
            />
            <div class="field-error" *ngIf="isFieldInvalid('password')">
              Le mot de passe est requis
            </div>
          </div>


          <div class="form-actions">
            <button
              type="submit"
              class="btn btn-primary btn-full"
              [disabled]="loginForm.invalid || isLoading"
            >
              <span *ngIf="!isLoading">Se connecter</span>
              <span *ngIf="isLoading">Connexion...</span>
            </button>

            <button
              type="button"
              class="btn btn-outline btn-full"
              routerLink="/"
            >
              ← Retour à l'accueil
            </button>
          </div>

          <div class="auth-footer">
            <p>
              Pas encore de compte ?
              <a routerLink="/auth/register" class="auth-link">Créer un compte</a>
            </p>
            <p class="forgot-password">
              <a routerLink="/auth/forgot-password" class="auth-link">Mot de passe oublié ?</a>
            </p>
          </div>

          <div class="error-message" *ngIf="errorMessage">
            {{ errorMessage }}
          </div>
        </form>

        <div class="demo-section">
          <div class="demo-divider">
            <span>ou</span>
          </div>
          <button
            type="button"
            class="btn btn-outline btn-full"
            (click)="loginAsDemo()"
            [disabled]="isLoading"
          >
            <span class="demo-icon">🎮</span>
            Accès démo (tenant par défaut)
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      background:
        radial-gradient(1200px 600px at 10% -10%, #0ea5e933, transparent),
        radial-gradient(800px 500px at 90% 10%, #a78bfa33, transparent),
        #0b1020;
    }

    .auth-card {
      width: 100%;
      max-width: 420px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 20px;
      padding: 32px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(10px);
    }

    .auth-header {
      text-align: center;
      margin-bottom: 32px;
    }

    .auth-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: #e5e7eb;
      margin: 0 0 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .logo {
      filter: drop-shadow(0 4px 16px rgba(167, 139, 250, 0.4));
    }

    .auth-subtitle {
      color: #94a3b8;
      margin: 0 0 8px;
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    label {
      font-weight: 600;
      color: #d1d5db;
      font-size: 0.9rem;
    }

    input {
      padding: 12px 16px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.16);
      color: #e5e7eb;
      outline: none;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    input::placeholder {
      color: #6b7280;
    }

    input:focus {
      border-color: #60a5fa;
      box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.18);
    }

    input.error {
      border-color: #f87171;
      box-shadow: 0 0 0 3px rgba(248, 113, 113, 0.18);
    }

    .slug-input {
      display: flex;
      align-items: center;
      position: relative;
    }

    .slug-input input {
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
      border-right: none;
    }

    .slug-suffix {
      padding: 12px 16px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.16);
      border-left: none;
      border-top-right-radius: 12px;
      border-bottom-right-radius: 12px;
      color: #9ca3af;
      font-size: 0.9rem;
    }

    .field-error {
      color: #f87171;
      font-size: 0.8rem;
      margin-top: 4px;
    }

    .btn {
      padding: 14px 24px;
      border-radius: 12px;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
      outline: none;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .btn-primary {
      background: linear-gradient(135deg, #22d3ee, #6366f1, #a855f7);
      color: white;
      box-shadow: 0 8px 24px rgba(99, 102, 241, 0.35);
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 12px 30px rgba(99, 102, 241, 0.45);
    }

    .btn-outline {
      background: transparent;
      color: #e5e7eb;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .btn-outline:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.3);
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .btn-full {
      width: 100%;
    }

    .form-actions {
      margin-top: 8px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .auth-footer {
      text-align: center;
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .auth-footer p {
      color: #9ca3af;
      margin: 8px 0;
    }

    .forgot-password {
      margin-top: 16px;
    }

    .auth-link {
      color: #60a5fa;
      text-decoration: none;
      font-weight: 600;
    }

    .auth-link:hover {
      color: #93c5fd;
    }

    .error-message {
      background: rgba(248, 113, 113, 0.1);
      border: 1px solid rgba(248, 113, 113, 0.3);
      color: #f87171;
      padding: 12px;
      border-radius: 8px;
      margin-top: 16px;
      text-align: center;
    }

    .demo-section {
      margin-top: 24px;
    }

    .demo-divider {
      position: relative;
      text-align: center;
      margin: 24px 0;
    }

    .demo-divider::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 1px;
      background: rgba(255, 255, 255, 0.1);
    }

    .demo-divider span {
      background: rgba(11, 16, 32, 0.9);
      padding: 0 16px;
      color: #6b7280;
      font-size: 0.9rem;
    }

    .demo-icon {
      font-size: 1.1rem;
    }
  `]
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: TenantAuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    // Note: Les DJs utilisent maintenant /dj-login avec authentification par PIN
    // Cette page est réservée aux administrateurs
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const request: LoginRequest = {
        email: this.loginForm.value.email,
        password: this.loginForm.value.password,
        tenantSlug: 'default' // Utiliser le tenant par défaut
      };

      this.authService.login(request).subscribe({
        next: (response) => {
          this.isLoading = false;
          // Rediriger vers le dashboard admin
          // Note: Les DJs utilisent /dj-login avec authentification par PIN
          this.router.navigate(['/admin']);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Identifiants incorrects';
        }
      });
    }
  }

  loginAsDemo(): void {
    // Connexion automatique au tenant par défaut pour la démo
    this.isLoading = true;
    this.errorMessage = '';

    const demoRequest: LoginRequest = {
      email: 'admin@blindtest.local',
      password: 'admin123456',
      tenantSlug: 'default'
    };

    this.authService.login(demoRequest).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.router.navigate(['/admin']);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Impossible d\'accéder au mode démo';
      }
    });
  }
}
