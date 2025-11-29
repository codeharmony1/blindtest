import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { TenantAuthService, RegisterRequest } from '../../../core/services/tenant-auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <header class="auth-header">
          <h1 class="auth-title">
            <span class="logo">🎵</span>
            Créer votre compte
          </h1>
          <p class="auth-subtitle">
            <span *ngIf="!selectedPlan">Commencez gratuitement avec le plan DÉMO</span>
            <span *ngIf="selectedPlan === 'DEMO'">Plan DÉMO - Gratuit à vie</span>
            <span *ngIf="selectedPlan === 'PER_EVENT'">Plan par Événement - 19€</span>
            <span *ngIf="selectedPlan === 'MONTHLY'">Plan Mensuel - 49€/mois</span>
          </p>
        </header>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="auth-form">
          <div class="form-group">
            <label for="name">Nom de votre organisation (optionnel)</label>
            <input
              id="name"
              type="text"
              formControlName="name"
              placeholder="Ex: Mon École de Musique"
              [class.error]="isFieldInvalid('name')"
            />
          </div>

          <div class="form-group">
            <label for="ownerEmail">Votre adresse email</label>
            <input
              id="ownerEmail"
              type="email"
              formControlName="ownerEmail"
              placeholder="admin@mon-ecole.com"
              [class.error]="isFieldInvalid('ownerEmail')"
            />
            <div class="field-error" *ngIf="isFieldInvalid('ownerEmail')">
              <span *ngIf="registerForm.get('ownerEmail')?.errors?.['required']">
                L'email est requis
              </span>
              <span *ngIf="registerForm.get('ownerEmail')?.errors?.['email']">
                Format d'email invalide
              </span>
            </div>
          </div>

          <div class="form-group">
            <label for="ownerName">Votre nom complet</label>
            <input
              id="ownerName"
              type="text"
              formControlName="ownerName"
              placeholder="Jean Dupont"
            />
          </div>

          <div class="form-group">
            <label for="ownerPassword">Mot de passe</label>
            <input
              id="ownerPassword"
              type="password"
              formControlName="ownerPassword"
              placeholder="••••••••"
              [class.error]="isFieldInvalid('ownerPassword')"
            />
            <div class="field-error" *ngIf="isFieldInvalid('ownerPassword')">
              Le mot de passe doit contenir au moins 8 caractères
            </div>
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirmer le mot de passe</label>
            <input
              id="confirmPassword"
              type="password"
              formControlName="confirmPassword"
              placeholder="••••••••"
              [class.error]="isFieldInvalid('confirmPassword')"
            />
            <div class="field-error" *ngIf="isFieldInvalid('confirmPassword')">
              Les mots de passe ne correspondent pas
            </div>
          </div>

          <div class="form-group">
            <label for="plan">Plan d'abonnement</label>
            <select id="plan" formControlName="plan" class="plan-select">
              <option value="DEMO">Plan DÉMO - Gratuit (5 chansons max par événement)</option>
              <option value="PER_EVENT">Paiement par Événement - 19€</option>
              <option value="MONTHLY">Plan Mensuel - 49€/mois</option>
            </select>
          </div>

          <div class="form-actions">
            <button
              type="submit"
              class="btn btn-primary btn-full"
              [disabled]="registerForm.invalid || isLoading"
            >
              <span *ngIf="!isLoading">Créer mon compte</span>
              <span *ngIf="isLoading">Création en cours...</span>
            </button>
          </div>

          <div class="auth-footer">
            <p>
              Déjà un compte ?
              <a routerLink="/auth/login" class="auth-link">Se connecter</a>
            </p>
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
      max-width: 480px;
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

    input, select {
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

    input:focus, select:focus {
      border-color: #60a5fa;
      box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.18);
    }

    input.error {
      border-color: #f87171;
      box-shadow: 0 0 0 3px rgba(248, 113, 113, 0.18);
    }

    .plan-select {
      color: #e5e7eb;
      appearance: none;
      background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
      background-position: right 12px center;
      background-repeat: no-repeat;
      background-size: 16px;
      padding-right: 40px;
    }

    .plan-select option {
      background-color: #1f2937;
      color: #e5e7eb;
      padding: 8px;
    }

    .field-error {
      color: #f87171;
      font-size: 0.8rem;
      margin-top: 4px;
    }

    .field-hint {
      color: #6b7280;
      font-size: 0.8rem;
    }

    .btn {
      padding: 14px 24px;
      border-radius: 12px;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
      outline: none;
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

    .btn-primary:disabled {
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
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  selectedPlan: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: TenantAuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.registerForm = this.fb.group({
      name: [''],
      ownerEmail: ['', [Validators.required, Validators.email]],
      ownerName: [''],
      ownerPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      plan: ['DEMO']
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit(): void {
    // Récupérer le plan depuis les paramètres d'URL
    this.route.queryParams.subscribe(params => {
      if (params['plan']) {
        this.selectedPlan = params['plan'];
        this.registerForm.patchValue({ plan: params['plan'] });
      }
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('ownerPassword');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    return null;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const selectedPlan = this.registerForm.value.plan;

      const request: RegisterRequest = {
        name: this.registerForm.value.name || 'Organisation',
        ownerEmail: this.registerForm.value.ownerEmail,
        ownerPassword: this.registerForm.value.ownerPassword,
        ownerName: this.registerForm.value.ownerName,
        plan: selectedPlan
      };

      this.authService.register(request).subscribe({
        next: (response) => {
          this.isLoading = false;

          // Si plan payant, rediriger vers page de paiement
          if (selectedPlan === 'PER_EVENT' || selectedPlan === 'MONTHLY') {
            this.router.navigate(['/admin/billing/checkout'], {
              queryParams: { plan: selectedPlan, newAccount: true }
            });
          } else {
            // Plan DEMO: rediriger directement vers le dashboard
            this.router.navigate(['/admin']);
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Une erreur est survenue lors de l\'inscription';
        }
      });
    }
  }
}