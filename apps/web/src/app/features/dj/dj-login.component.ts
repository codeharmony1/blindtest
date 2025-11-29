import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { DJAuthService, DJLoginRequest } from '../../core/services/dj-auth.service';

@Component({
  selector: 'bt-dj-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="dj-login-container">
      <div class="dj-login-card">
        <header class="dj-header">
          <div class="dj-icon">🎧</div>
          <h1>Interface DJ</h1>
          <p>Connexion sécurisée par code PIN</p>
        </header>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="dj-form">
          <!-- Code événement -->
          <div class="form-group">
            <label for="eventCode">Code de l'événement</label>
            <input
              id="eventCode"
              type="text"
              formControlName="eventCode"
              placeholder="ABC123"
              maxlength="16"
              [class.error]="isFieldInvalid('eventCode')"
              (input)="formatEventCode($event)"
            />
            <div class="field-error" *ngIf="isFieldInvalid('eventCode')">
              Le code événement est requis
            </div>
          </div>

          <!-- Code PIN -->
          <div class="form-group">
            <label for="pin">Code PIN DJ (6 chiffres)</label>
            <input
              id="pin"
              type="password"
              inputmode="numeric"
              formControlName="pin"
              placeholder="••••••"
              maxlength="6"
              [class.error]="isFieldInvalid('pin')"
              (input)="formatPIN($event)"
            />
            <div class="field-error" *ngIf="isFieldInvalid('pin')">
              <span *ngIf="loginForm.get('pin')?.errors?.['required']">
                Le code PIN est requis
              </span>
              <span *ngIf="loginForm.get('pin')?.errors?.['pattern']">
                Le PIN doit contenir exactement 6 chiffres
              </span>
            </div>
            <div class="field-hint">
              Demandez le code PIN à l'organisateur de l'événement
            </div>
          </div>

          <!-- Bouton de connexion -->
          <div class="form-actions">
            <button
              type="submit"
              class="btn btn-primary btn-full"
              [disabled]="loginForm.invalid || isLoading"
            >
              <span *ngIf="!isLoading">🎵 Accéder à l'interface DJ</span>
              <span *ngIf="isLoading">⏳ Vérification...</span>
            </button>
          </div>

          <!-- Message d'erreur -->
          <div class="error-message" *ngIf="errorMessage">
            {{ errorMessage }}
          </div>
        </form>

        <!-- Lien vers la page d'accueil -->
        <div class="dj-footer">
          <a href="/" class="back-link">← Retour à l'accueil</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dj-login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .dj-login-card {
      width: 100%;
      max-width: 420px;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 20px;
      padding: 40px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    .dj-header {
      text-align: center;
      margin-bottom: 32px;
    }

    .dj-icon {
      font-size: 4rem;
      margin-bottom: 16px;
      filter: drop-shadow(0 4px 16px rgba(102, 126, 234, 0.4));
    }

    .dj-header h1 {
      font-size: 2rem;
      font-weight: 700;
      color: #1a202c;
      margin: 0 0 8px;
    }

    .dj-header p {
      color: #718096;
      margin: 0;
    }

    .dj-form {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    label {
      font-weight: 600;
      color: #2d3748;
      font-size: 0.95rem;
    }

    input {
      padding: 14px 16px;
      border-radius: 12px;
      background: #f7fafc;
      border: 2px solid #e2e8f0;
      color: #2d3748;
      font-size: 1rem;
      outline: none;
      transition: all 0.2s ease;
    }

    input::placeholder {
      color: #a0aec0;
    }

    input:focus {
      border-color: #667eea;
      background: white;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    input.error {
      border-color: #f56565;
      box-shadow: 0 0 0 3px rgba(245, 101, 101, 0.1);
    }

    input[type="password"] {
      font-size: 1.5rem;
      letter-spacing: 0.5em;
      text-align: center;
    }

    .field-error {
      color: #f56565;
      font-size: 0.85rem;
    }

    .field-hint {
      color: #718096;
      font-size: 0.85rem;
      font-style: italic;
    }

    .btn {
      padding: 16px 24px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 1rem;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
      outline: none;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      box-shadow: 0 8px 24px rgba(102, 126, 234, 0.35);
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 12px 30px rgba(102, 126, 234, 0.45);
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .btn-full {
      width: 100%;
    }

    .error-message {
      background: #fff5f5;
      border: 2px solid #feb2b2;
      color: #c53030;
      padding: 14px;
      border-radius: 12px;
      text-align: center;
      font-weight: 500;
    }

    .dj-footer {
      text-align: center;
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #e2e8f0;
    }

    .back-link {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
      transition: color 0.2s ease;
    }

    .back-link:hover {
      color: #764ba2;
    }
  `]
})
export class DJLoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: DJAuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      eventCode: ['', [Validators.required]],
      pin: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });
  }

  ngOnInit(): void {
    // Pré-remplir le code événement si présent dans l'URL
    this.route.queryParams.subscribe(params => {
      if (params['eventCode']) {
        this.loginForm.patchValue({
          eventCode: params['eventCode'].toUpperCase()
        });
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Formater le code événement en majuscules
   */
  formatEventCode(event: any): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.toUpperCase();
    this.loginForm.patchValue({ eventCode: input.value });
  }

  /**
   * Formater le PIN (seulement des chiffres)
   */
  formatPIN(event: any): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/\D/g, ''); // Garder seulement les chiffres
    this.loginForm.patchValue({ pin: input.value });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const request: DJLoginRequest = {
        eventCode: this.loginForm.value.eventCode.toUpperCase(),
        pin: this.loginForm.value.pin
      };

      this.authService.login(request).subscribe({
        next: (response) => {
          this.isLoading = false;
          console.log('[DJ Login] Success:', response.event.name);

          // Rediriger vers l'interface DJ
          this.router.navigate(['/dj', response.event.code]);
        },
        error: (error) => {
          this.isLoading = false;

          // Messages d'erreur personnalisés
          if (error.status === 404) {
            this.errorMessage = '❌ Événement introuvable. Vérifiez le code.';
          } else if (error.status === 401) {
            this.errorMessage = '❌ Code PIN incorrect. Réessayez.';
          } else if (error.status === 403 && error.error?.error?.code === 'DJ_PIN_NOT_CONFIGURED') {
            this.errorMessage = '⚠️ Le code PIN DJ n\'est pas configuré pour cet événement.';
          } else {
            this.errorMessage = '❌ Erreur de connexion. Vérifiez vos informations.';
          }

          console.error('[DJ Login] Error:', error);
        }
      });
    }
  }
}
