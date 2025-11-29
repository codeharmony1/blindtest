import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <header class="auth-header" *ngIf="!tokenExpired">
          <h1 class="auth-title">
            <span class="logo">🔐</span>
            Nouveau mot de passe
          </h1>
          <p class="auth-subtitle" *ngIf="userEmail">
            Réinitialisation pour {{ userEmail }}
          </p>
          <p class="auth-subtitle" *ngIf="!userEmail">
            Entrez votre nouveau mot de passe
          </p>
        </header>

        <div *ngIf="isVerifying" class="loading-message">
          <div class="spinner"></div>
          <p>Vérification du lien...</p>
        </div>

        <div *ngIf="tokenExpired" class="expired-section">
          <div class="expired-icon">⏱️</div>
          <h2 class="expired-title">Lien expiré</h2>
          <p class="expired-message">
            Ce lien de réinitialisation a expiré. Les liens sont valides pendant 1 heure.
          </p>
          <a routerLink="/auth/forgot-password" class="btn btn-primary btn-full">
            Demander un nouveau lien
          </a>
          <div class="auth-footer">
            <p>
              <a routerLink="/auth/login" class="auth-link">← Retour à la connexion</a>
            </p>
          </div>
        </div>

        <form
          *ngIf="!isVerifying && !tokenExpired"
          [formGroup]="resetPasswordForm"
          (ngSubmit)="onSubmit()"
          class="auth-form"
        >
          <div class="form-group">
            <label for="newPassword">Nouveau mot de passe</label>
            <input
              id="newPassword"
              type="password"
              formControlName="newPassword"
              placeholder="••••••••"
              [class.error]="isFieldInvalid('newPassword')"
              autofocus
            />
            <div class="field-error" *ngIf="isFieldInvalid('newPassword')">
              <span *ngIf="resetPasswordForm.get('newPassword')?.errors?.['required']">
                Le mot de passe est requis
              </span>
              <span *ngIf="resetPasswordForm.get('newPassword')?.errors?.['minlength']">
                Minimum 8 caractères requis
              </span>
            </div>
            <div class="password-hint">
              Minimum 8 caractères
            </div>
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirmer le mot de passe</label>
            <input
              id="confirmPassword"
              type="password"
              formControlName="confirmPassword"
              placeholder="••••••••"
              [class.error]="isFieldInvalid('confirmPassword') || passwordMismatch()"
            />
            <div class="field-error" *ngIf="isFieldInvalid('confirmPassword')">
              <span *ngIf="resetPasswordForm.get('confirmPassword')?.errors?.['required']">
                Veuillez confirmer le mot de passe
              </span>
            </div>
            <div class="field-error" *ngIf="passwordMismatch() && resetPasswordForm.get('confirmPassword')?.touched">
              Les mots de passe ne correspondent pas
            </div>
          </div>

          <div class="form-actions">
            <button
              type="submit"
              class="btn btn-primary btn-full"
              [disabled]="resetPasswordForm.invalid || passwordMismatch() || isLoading"
            >
              <span *ngIf="!isLoading">Réinitialiser le mot de passe</span>
              <span *ngIf="isLoading">Réinitialisation...</span>
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
      margin: 8px 0 0;
      font-size: 0.95rem;
    }

    .loading-message {
      text-align: center;
      padding: 40px 20px;
      color: #94a3b8;
    }

    .spinner {
      width: 40px;
      height: 40px;
      margin: 0 auto 16px;
      border: 3px solid rgba(96, 165, 250, 0.2);
      border-top-color: #60a5fa;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .expired-section {
      text-align: center;
      padding: 20px 0;
    }

    .expired-icon {
      font-size: 4rem;
      margin-bottom: 16px;
      filter: drop-shadow(0 4px 16px rgba(248, 113, 113, 0.4));
    }

    .expired-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #f87171;
      margin: 0 0 12px;
    }

    .expired-message {
      color: #94a3b8;
      margin: 0 0 24px;
      line-height: 1.6;
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

    .password-hint {
      color: #6b7280;
      font-size: 0.8rem;
      margin-top: 4px;
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
      text-decoration: none;
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
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm: FormGroup;
  isLoading = false;
  isVerifying = true;
  tokenExpired = false;
  errorMessage = '';
  successMessage = '';
  resetToken = '';
  userEmail = '';

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.resetPasswordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    // Récupérer le token depuis l'URL
    this.route.queryParams.subscribe(params => {
      this.resetToken = params['token'];

      if (!this.resetToken) {
        this.tokenExpired = true;
        this.isVerifying = false;
        return;
      }

      // Vérifier la validité du token
      this.verifyToken();
    });
  }

  verifyToken(): void {
    this.apiService.verifyResetToken(this.resetToken).subscribe({
      next: (response) => {
        this.isVerifying = false;
        if (response.valid) {
          this.userEmail = response.email || '';
          this.tokenExpired = false;
        } else {
          this.tokenExpired = true;
        }
      },
      error: () => {
        this.isVerifying = false;
        this.tokenExpired = true;
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.resetPasswordForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  passwordMismatch(): boolean {
    const password = this.resetPasswordForm.get('newPassword')?.value;
    const confirm = this.resetPasswordForm.get('confirmPassword')?.value;
    return password !== confirm && confirm !== '';
  }

  onSubmit(): void {
    if (this.resetPasswordForm.valid && !this.passwordMismatch()) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const newPassword = this.resetPasswordForm.value.newPassword;

      this.apiService.resetPassword(this.resetToken, newPassword).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.successMessage = 'Mot de passe réinitialisé avec succès ! Redirection...';

          // Rediriger vers la page de connexion après 2 secondes
          setTimeout(() => {
            this.router.navigate(['/auth/login']);
          }, 2000);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Une erreur est survenue. Veuillez réessayer.';

          // Si le token est invalide/expiré, afficher la section expirée
          if (error.status === 400 || error.status === 404) {
            this.tokenExpired = true;
          }
        }
      });
    }
  }
}
