import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

interface Event {
  id: string;
  code: string;
  name: string;
}

@Component({
  selector: 'bt-round-form',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, HttpClientModule],
  template: `
    <div class="round-form">
      <!-- Header -->
      <div class="form-header">
        <div class="header-left">
          <h1 class="page-title">{{ isEdit ? 'Modifier le round' : 'Nouveau round' }}</h1>
          <p class="event-info" *ngIf="currentEvent">
            <span class="event-name">{{ currentEvent.name }}</span>
            <span class="event-code">Code: {{ currentEvent.code }}</span>
          </p>
        </div>
        <div class="header-actions">
          <a [routerLink]="['/admin/events', eventId, 'rounds']" class="btn btn-secondary">
            ← Retour aux rounds
          </a>
        </div>
      </div>

      <!-- Form -->
      <div class="form-container">
        <form [formGroup]="roundForm" (ngSubmit)="onSubmit()" class="round-form-content">
          <!-- Basic Info -->
          <div class="form-section">
            <h2 class="section-title">Informations du round</h2>

            <div class="form-grid">
              <div class="form-group">
                <label for="name" class="form-label">
                  Nom du round <span class="optional">(optionnel)</span>
                </label>
                <input
                  id="name"
                  type="text"
                  formControlName="name"
                  class="form-input"
                  placeholder="Ex: Round 1 - Années 80"
                />
                <small class="form-help">
                  Si vide, le round sera nommé automatiquement "Round 1", "Round 2", etc.
                </small>
              </div>

              <div class="form-group">
                <label for="totalSongs" class="form-label">
                  Nombre de chansons <span class="required">*</span>
                </label>
                <input
                  id="totalSongs"
                  type="number"
                  formControlName="totalSongs"
                  class="form-input"
                  min="1"
                  max="100"
                  placeholder="20"
                />
                <div
                  *ngIf="
                    roundForm.get('totalSongs')?.errors?.['required'] &&
                    roundForm.get('totalSongs')?.touched
                  "
                  class="form-error"
                >
                  Le nombre de chansons est obligatoire
                </div>
                <div
                  *ngIf="
                    roundForm.get('totalSongs')?.errors?.['min'] &&
                    roundForm.get('totalSongs')?.touched
                  "
                  class="form-error"
                >
                  Le minimum est 1 chanson
                </div>
              </div>

              <div class="form-group">
                <label for="defaultDuration" class="form-label">
                  Durée par défaut (secondes) <span class="required">*</span>
                </label>
                <input
                  id="defaultDuration"
                  type="number"
                  formControlName="defaultDuration"
                  class="form-input"
                  min="5"
                  max="120"
                  placeholder="15"
                />
                <small class="form-help"> Durée par défaut pour chaque chanson de ce round </small>
                <div
                  *ngIf="
                    roundForm.get('defaultDuration')?.errors?.['required'] &&
                    roundForm.get('defaultDuration')?.touched
                  "
                  class="form-error"
                >
                  La durée est obligatoire
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="form-actions">
            <a [routerLink]="['/admin/events', eventId, 'rounds']" class="btn btn-secondary">
              Annuler
            </a>
            <button
              type="submit"
              [disabled]="roundForm.invalid || isSubmitting"
              class="btn btn-primary"
            >
              <span *ngIf="isSubmitting">⏳</span>
              <span *ngIf="!isSubmitting">{{
                isEdit ? '💾 Sauvegarder' : '✨ Créer le round'
              }}</span>
            </button>
          </div>
        </form>

        <!-- Preview -->
        <div class="preview-section">
          <h3 class="preview-title">Aperçu</h3>
          <div class="preview-card">
            <div class="preview-header">
              <h4 class="preview-name">
                {{ roundForm.get('name')?.value || 'Round automatique' }}
              </h4>
            </div>
            <div class="preview-stats">
              <div class="preview-stat">
                <span class="stat-icon">🎵</span>
                <span>{{ roundForm.get('totalSongs')?.value || 0 }} chansons</span>
              </div>
              <div class="preview-stat">
                <span class="stat-icon">⏱️</span>
                <span>{{ roundForm.get('defaultDuration')?.value || 15 }}s par chanson</span>
              </div>
              <div class="preview-stat">
                <span class="stat-icon">🕐</span>
                <span>≈ {{ getEstimatedDuration() }} min au total</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .round-form {
        max-width: 1000px;
        margin: 0 auto;
        padding: 2rem;
      }

      /* Header */
      .form-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 2rem;
        gap: 2rem;
      }

      .header-left {
        flex: 1;
      }

      .page-title {
        font-size: 2rem;
        font-weight: 800;
        color: #1e293b;
        margin: 0 0 0.5rem 0;
      }

      .event-info {
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .event-name {
        font-size: 1.125rem;
        font-weight: 600;
        color: #374151;
      }

      .event-code {
        font-size: 0.875rem;
        color: #64748b;
        font-family: monospace;
      }

      .header-actions {
        display: flex;
        gap: 1rem;
        align-items: center;
      }

      /* Form Container */
      .form-container {
        display: grid;
        grid-template-columns: 1fr 300px;
        gap: 2rem;
      }

      .round-form-content {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 2rem;
      }

      /* Form Sections */
      .form-section {
        margin-bottom: 2rem;
      }

      .section-title {
        font-size: 1.25rem;
        font-weight: 700;
        color: #374151;
        margin: 0 0 1.5rem 0;
      }

      .form-grid {
        display: grid;
        gap: 1.5rem;
      }

      .form-group {
        display: flex;
        flex-direction: column;
      }

      .form-label {
        font-size: 0.875rem;
        font-weight: 600;
        color: #374151;
        margin-bottom: 0.5rem;
      }

      .required {
        color: #ef4444;
      }

      .optional {
        color: #64748b;
        font-weight: normal;
      }

      .form-input {
        padding: 0.75rem 1rem;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        font-size: 0.875rem;
        transition: all 0.2s ease;
      }

      .form-input:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }

      .form-help {
        font-size: 0.75rem;
        color: #64748b;
        margin-top: 0.25rem;
      }

      .form-error {
        font-size: 0.75rem;
        color: #ef4444;
        margin-top: 0.25rem;
      }

      /* Buttons */
      .btn {
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 600;
        font-size: 0.875rem;
        border: none;
        cursor: pointer;
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
      }

      .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .btn-primary {
        background: #3b82f6;
        color: white;
      }

      .btn-primary:hover:not(:disabled) {
        background: #1d4ed8;
      }

      .btn-secondary {
        background: #f1f5f9;
        color: #475569;
        border: 1px solid #cbd5e1;
      }

      .btn-secondary:hover {
        background: #e2e8f0;
      }

      /* Form Actions */
      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        padding-top: 2rem;
        border-top: 1px solid #e5e7eb;
      }

      /* Preview */
      .preview-section {
        position: sticky;
        top: 2rem;
        height: fit-content;
      }

      .preview-title {
        font-size: 1rem;
        font-weight: 600;
        color: #374151;
        margin-bottom: 1rem;
      }

      .preview-card {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .preview-header {
        margin-bottom: 1rem;
      }

      .preview-name {
        font-size: 1.125rem;
        font-weight: 600;
        color: #1e293b;
        margin: 0;
      }

      .preview-stats {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .preview-stat {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        color: #64748b;
      }

      .stat-icon {
        font-size: 1rem;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .round-form {
          padding: 1rem;
        }

        .form-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 1rem;
        }

        .header-actions {
          width: 100%;
          justify-content: flex-start;
        }

        .form-container {
          grid-template-columns: 1fr;
          gap: 1rem;
        }

        .preview-section {
          order: -1;
          position: static;
        }

        .form-actions {
          flex-direction: column-reverse;
        }

        .btn {
          width: 100%;
          justify-content: center;
        }
      }
    `,
  ],
})
export class RoundFormComponent implements OnInit {
  roundForm: FormGroup;
  isEdit = false;
  isSubmitting = false;
  eventId: string;
  roundId: string | null = null;
  currentEvent: Event | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
  ) {
    this.eventId = this.route.snapshot.paramMap.get('eventId') || '';
    this.roundId = this.route.snapshot.paramMap.get('roundId');
    this.isEdit = !!this.roundId && this.roundId !== 'new';

    this.roundForm = this.createForm();
  }

  ngOnInit() {
    this.loadEventInfo();
    if (this.isEdit) {
      this.loadRound();
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: [''],
      totalSongs: [20, [Validators.required, Validators.min(1), Validators.max(100)]],
      defaultDuration: [15, [Validators.required, Validators.min(5), Validators.max(120)]],
    });
  }

  loadEventInfo() {
    this.http.get<Event>(`/api/events/id/${this.eventId}`).subscribe({
      next: (event) => {
        this.currentEvent = event;
      },
      error: (error) => {
        console.error("Erreur lors du chargement de l'événement:", error);
      },
    });
  }

  loadRound() {
    // TODO: Implement round loading for edit mode
    console.log('Loading round for edit:', this.roundId);
  }

  onSubmit() {
    if (this.roundForm.valid && this.currentEvent) {
      this.isSubmitting = true;

      const formData = this.roundForm.value;
      const roundData = {
        name: formData.name || null,
        defaultDuration: formData.defaultDuration,
        totalSongs: formData.totalSongs,
      };

      this.http.post(`/api/events/${this.currentEvent.code}/rounds`, roundData).subscribe({
        next: (response) => {
          console.log('✅ Round créé:', response);
          this.isSubmitting = false;
          alert('Round créé avec succès !');
          this.router.navigate(['/admin/events', this.eventId, 'rounds']);
        },
        error: (error) => {
          console.error('❌ Erreur lors de la création:', error);
          this.isSubmitting = false;
          alert('Erreur lors de la création du round. Vérifiez la console.');
        },
      });
    }
  }

  getEstimatedDuration(): number {
    const totalSongs = this.roundForm.get('totalSongs')?.value || 0;
    const defaultDuration = this.roundForm.get('defaultDuration')?.value || 15;
    const totalSeconds = totalSongs * defaultDuration;
    return Math.round(totalSeconds / 60);
  }
}
