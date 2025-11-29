import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QrCodeComponent } from './qr-code.component';

@Component({
  selector: 'bt-qr-code-modal',
  standalone: true,
  imports: [CommonModule, QrCodeComponent],
  template: `
    <div class="modal-backdrop" *ngIf="isOpen" (click)="close()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2 class="modal-title">{{ title }}</h2>
          <button class="modal-close" (click)="close()" aria-label="Fermer">×</button>
        </div>

        <div class="modal-body">
          <bt-qr-code
            [data]="joinUrl"
            [size]="300"
            [label]="'Scannez pour rejoindre'"
          ></bt-qr-code>

          <div class="url-display">
            <label class="url-label">Ou utilisez le lien :</label>
            <div class="url-box">
              <input
                type="text"
                [value]="joinUrl"
                readonly
                class="url-input"
                #urlInput
              />
              <button
                class="btn-copy"
                (click)="copyUrl(urlInput)"
                [class.copied]="copied"
              >
                {{ copied ? '✓ Copié' : '📋 Copier' }}
              </button>
            </div>
          </div>

          <div class="instructions">
            <h3>Instructions pour les joueurs :</h3>
            <ol>
              <li>Scannez le QR Code avec votre téléphone</li>
              <li>Ou accédez directement au lien ci-dessus</li>
              <li>Entrez votre pseudo</li>
              <li>Rejoignez ou créez une équipe</li>
            </ol>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="close()">Fermer</button>
          <button class="btn btn-primary" (click)="printQR()">🖨️ Imprimer</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
      animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .modal-content {
      background: white;
      border-radius: 16px;
      max-width: 600px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      animation: slideUp 0.3s ease-out;
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

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 2rem;
      border-bottom: 2px solid #f0f0f0;
    }

    .modal-title {
      margin: 0;
      font-size: 1.8rem;
      color: #333;
    }

    .modal-close {
      background: none;
      border: none;
      font-size: 2.5rem;
      line-height: 1;
      cursor: pointer;
      color: #666;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.2s ease;
    }

    .modal-close:hover {
      background: #f0f0f0;
      color: #333;
    }

    .modal-body {
      padding: 2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2rem;
    }

    .url-display {
      width: 100%;
    }

    .url-label {
      display: block;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: #555;
    }

    .url-box {
      display: flex;
      gap: 0.5rem;
    }

    .url-input {
      flex: 1;
      padding: 0.8rem 1rem;
      border: 2px solid #ddd;
      border-radius: 8px;
      font-family: monospace;
      font-size: 0.9rem;
      background: #f9f9f9;
    }

    .btn-copy {
      padding: 0.8rem 1.5rem;
      background: #4caf50;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
    }

    .btn-copy:hover {
      background: #45a049;
      transform: translateY(-1px);
    }

    .btn-copy.copied {
      background: #2196f3;
    }

    .instructions {
      width: 100%;
      background: #f9f9f9;
      padding: 1.5rem;
      border-radius: 12px;
      border-left: 4px solid #4caf50;
    }

    .instructions h3 {
      margin: 0 0 1rem 0;
      color: #333;
      font-size: 1.2rem;
    }

    .instructions ol {
      margin: 0;
      padding-left: 1.5rem;
      color: #555;
    }

    .instructions li {
      margin-bottom: 0.5rem;
      line-height: 1.5;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding: 1.5rem 2rem;
      border-top: 2px solid #f0f0f0;
    }

    .btn {
      padding: 0.8rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn:hover {
      transform: translateY(-1px);
    }

    .btn-secondary {
      background: #757575;
      color: white;
    }

    .btn-secondary:hover {
      background: #616161;
    }

    .btn-primary {
      background: #2196f3;
      color: white;
    }

    .btn-primary:hover {
      background: #1976d2;
    }

    @media print {
      .modal-backdrop {
        background: white;
      }

      .modal-header,
      .modal-footer {
        display: none;
      }

      .btn-copy {
        display: none;
      }
    }

    @media (max-width: 768px) {
      .modal-content {
        margin: 0;
        border-radius: 16px 16px 0 0;
        max-height: 95vh;
      }

      .modal-header,
      .modal-body,
      .modal-footer {
        padding: 1.2rem 1.5rem;
      }

      .modal-title {
        font-size: 1.5rem;
      }

      .url-box {
        flex-direction: column;
      }

      .btn-copy {
        width: 100%;
      }
    }
  `]
})
export class QrCodeModalComponent {
  @Input() eventCode!: string;
  @Input() eventName: string = '';

  isOpen = false;
  copied = false;

  get title(): string {
    return this.eventName ? `Rejoindre "${this.eventName}"` : 'Rejoindre l\'événement';
  }

  get joinUrl(): string {
    // En production, utiliser window.location.origin
    const baseUrl = window.location.origin;
    return `${baseUrl}/join/${this.eventCode}`;
  }

  open(): void {
    this.isOpen = true;
    this.copied = false;
  }

  close(): void {
    this.isOpen = false;
  }

  copyUrl(input: HTMLInputElement): void {
    input.select();
    document.execCommand('copy');
    this.copied = true;

    setTimeout(() => {
      this.copied = false;
    }, 2000);
  }

  printQR(): void {
    window.print();
  }
}
