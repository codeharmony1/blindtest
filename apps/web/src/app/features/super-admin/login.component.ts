import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SuperAdminService } from '../../core/services/super-admin.service';

@Component({
  selector: 'bt-super-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="super-admin-login">
      <div class="login-container">
        <div class="login-card">
          <div class="login-header">
            <h1>🔐 Super Admin</h1>
            <p>Blind Test Musical Platform</p>
          </div>

          <form (ngSubmit)="onLogin()" class="login-form">
            <div class="form-group">
              <label for="email">Email</label>
              <input
                type="email"
                id="email"
                [(ngModel)]="email"
                name="email"
                placeholder="admin@blindtest.local"
                required
                autocomplete="username"
              />
            </div>

            <div class="form-group">
              <label for="password">Mot de passe</label>
              <input
                type="password"
                id="password"
                [(ngModel)]="password"
                name="password"
                placeholder="••••••••"
                required
                autocomplete="current-password"
              />
            </div>

            <div class="error-message" *ngIf="errorMessage">⚠️ {{ errorMessage }}</div>

            <button type="submit" class="btn-login" [disabled]="loading">
              <span *ngIf="!loading">Se connecter</span>
              <span *ngIf="loading">Connexion en cours...</span>
            </button>
          </form>

          <div class="login-footer">
            <small>Accès réservé aux super-administrateurs</small>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .super-admin-login {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 2rem;
      }

      .login-container {
        width: 100%;
        max-width: 420px;
      }

      .login-card {
        background: white;
        border-radius: 16px;
        padding: 3rem;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        animation: slideUp 0.5s ease-out;
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .login-header {
        text-align: center;
        margin-bottom: 2rem;
      }

      .login-header h1 {
        font-size: 2rem;
        margin: 0 0 0.5rem 0;
        color: #2d3748;
        font-weight: 700;
      }

      .login-header p {
        margin: 0;
        color: #718096;
        font-size: 0.95rem;
      }

      .login-form {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .form-group label {
        font-weight: 600;
        color: #2d3748;
        font-size: 0.9rem;
      }

      .form-group input {
        padding: 0.875rem 1rem;
        border: 2px solid #e2e8f0;
        border-radius: 8px;
        font-size: 1rem;
        transition: all 0.2s;
      }

      .form-group input:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      }

      .error-message {
        padding: 0.875rem;
        background: #fed7d7;
        color: #c53030;
        border-radius: 8px;
        font-size: 0.9rem;
        text-align: center;
      }

      .btn-login {
        padding: 1rem;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .btn-login:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
      }

      .btn-login:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .login-footer {
        margin-top: 2rem;
        text-align: center;
        color: #a0aec0;
        font-size: 0.85rem;
      }

      @media (max-width: 480px) {
        .login-card {
          padding: 2rem 1.5rem;
        }

        .login-header h1 {
          font-size: 1.5rem;
        }
      }
    `,
  ],
})
export class SuperAdminLoginComponent {
  email = '';
  password = '';
  loading = false;
  errorMessage = '';

  constructor(
    private superAdminService: SuperAdminService,
    private router: Router,
  ) {
    // Si déjà connecté, rediriger vers le dashboard
    if (this.superAdminService.isAuthenticated()) {
      this.router.navigate(['/backstage/dashboard']);
    }
  }

  onLogin(): void {
    this.errorMessage = '';
    this.loading = true;

    this.superAdminService.login(this.email, this.password).subscribe({
      next: (response) => {
        console.log('Login successful', response);
        this.router.navigate(['/backstage/dashboard']);
      },
      error: (error) => {
        console.error('Login error', error);
        this.loading = false;

        if (error.status === 401) {
          this.errorMessage = 'Email ou mot de passe incorrect';
        } else if (error.status === 400) {
          this.errorMessage = 'Veuillez remplir tous les champs';
        } else {
          this.errorMessage = 'Erreur de connexion. Réessayez plus tard.';
        }
      },
    });
  }
}
