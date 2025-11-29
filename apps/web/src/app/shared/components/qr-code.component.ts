import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'bt-qr-code',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="qr-code-container">
      <div class="qr-code-wrapper">
        <img
          *ngIf="qrCodeUrl"
          [src]="qrCodeUrl"
          [alt]="'QR Code pour ' + data"
          class="qr-code-image"
        />
        <div *ngIf="!qrCodeUrl && !errorMessage" class="qr-loading">
          ⏳ Génération du QR Code...
        </div>
        <div *ngIf="errorMessage" class="qr-error">
          ❌ {{ errorMessage }}
        </div>
      </div>
      <div class="qr-info" *ngIf="label">
        <p class="qr-label">{{ label }}</p>
      </div>
    </div>
  `,
  styles: [`
    .qr-code-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .qr-code-wrapper {
      background: white;
      padding: 1rem;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 200px;
      min-height: 200px;
    }

    .qr-code-image {
      display: block;
      max-width: 100%;
      height: auto;
      border-radius: 8px;
    }

    .qr-loading,
    .qr-error {
      font-size: 1.1rem;
      text-align: center;
      padding: 2rem;
    }

    .qr-error {
      color: #d32f2f;
    }

    .qr-info {
      text-align: center;
    }

    .qr-label {
      font-size: 1.1rem;
      font-weight: 600;
      color: #333;
      margin: 0;
    }

    @media (max-width: 768px) {
      .qr-code-wrapper {
        min-width: 150px;
        min-height: 150px;
        padding: 0.8rem;
      }

      .qr-label {
        font-size: 1rem;
      }
    }
  `]
})
export class QrCodeComponent implements OnChanges {
  @Input() data!: string;
  @Input() size: number = 256;
  @Input() label?: string;

  qrCodeUrl: string = '';
  errorMessage: string = '';

  ngOnChanges(): void {
    if (this.data) {
      this.generateQRCode();
    }
  }

  private generateQRCode(): void {
    try {
      // Utiliser l'API publique QR Server pour générer le QR Code
      // Alternative: api.qrserver.com, quickchart.io, etc.
      const encodedData = encodeURIComponent(this.data);
      this.qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${this.size}x${this.size}&data=${encodedData}`;
      this.errorMessage = '';
    } catch (error) {
      this.errorMessage = 'Erreur lors de la génération du QR Code';
      this.qrCodeUrl = '';
      console.error('QR Code generation error:', error);
    }
  }
}
