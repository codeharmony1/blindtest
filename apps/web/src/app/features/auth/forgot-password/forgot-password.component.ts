import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <header class="auth-header">
          <h1 class="auth-title">
            <span class="logo">🔑</span>
            Mot de passe oublié
          </h1>
          <p class="auth-subtitle">
            Entrez votre adresse email pour recevoir un lien de réinitialisation
          </p>
        </header>

        <form [formGroup]="forgotPasswordForm" (ngSubmit)="onSubmit()" class="auth-form">
          <div class="form-group">
            <label for="email">Adresse email</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              placeholder="admin@example.com"
              [class.error]="isFieldInvalid('email')"
              autofocus
            />
            <div class="field-error" *ngIf="isFieldInvalid('email')">
              <span *ngIf="forgotPasswordForm.get('email')?.errors?.['required']">
                L'email est requis
              </span>
              <span *ngIf="forgotPasswordForm.get('email')?.errors?.['email']">
                Format d'email invalide
              </span>
            </div>
          </div>

          <div class="form-actions">
            <button
              type="submit"
              class="btn btn-primary btn-full"
              [disabled]="forgotPasswordForm.invalid || isLoading"
            >
              <span *ngIf="!isLoading">Envoyer le lien</span>
              <span *ngIf="isLoading">Envoi en cours...</span>
            </button>
          </div>

          <div class="auth-footer">
            <p>
              <a routerLink="/auth/login" class="auth-link">← Retour à la connexion</a>
            </p>
          </div>

          <div class="success-message" *ngIf="successMessage">
            {{ successMessage }}
          </div>

          <div class="error-message" *ngIf="errorMessage">
            {{ errorMessage }}
          </div>
        </form>
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
      margin: 0;
      font-size: 0.95rem;
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
    }

    .auth-footer {
      text-align: center;
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .auth-footer p {
      color: #9ca3af;
      margin: 0;
    }

    .auth-link {
      color: #60a5fa;
      text-decoration: none;
      font-weight: 600;
    }

    .auth-link:hover {
      color: #93c5fd;
    }

    .success-message {
      background: rgba(52, 211, 153, 0.1);
      border: 1px solid rgba(52, 211, 153, 0.3);
      color: #34d399;
      padding: 12px;
      border-radius: 8px;
      margin-top: 16px;
      text-align: center;
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
  `]
})
export class ForgotPasswordComponent {
  forgotPasswordForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private router: Router
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.forgotPasswordForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const email = this.forgotPasswordForm.value.email;

      this.apiService.forgotPassword(email).subscribe({
        next: (response) => {
          this.isLoading = false;
          // Rediriger vers la page de confirmation
          this.router.navigate(['/auth/reset-password-sent'], {
            queryParams: { email }
          });
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Une erreur est survenue. Veuillez réessayer.';
        }
      });
    }
  }
}
