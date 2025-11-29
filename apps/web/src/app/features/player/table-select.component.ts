import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { SessionService } from '../../core/services/session.service';
import { SocketService } from '../../core/services/socket.service';

@Component({
  selector: 'bt-table-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './table-select.component.html',
  styleUrls: ['../../shared/styles/autumn-wedding.scss'],
  styles: [
    `
      .autumn-theme {
        position: relative;
      }

      .autumn-container {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        gap: 2rem;
      }

      .tables-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 1.5rem;
        margin-top: 1.5rem;
      }

      .table-card {
        cursor: pointer;
        border-radius: 22px;
        background: rgba(255, 255, 255, 0.95);
        border: 2px solid #e8dcc8;
        box-shadow: 0 18px 36px rgba(74, 52, 40, 0.12);
        transition:
          transform 0.3s ease,
          box-shadow 0.3s ease,
          border-color 0.3s ease;
        overflow: hidden;
        position: relative;
      }

      .table-card:hover {
        transform: translateY(-6px);
        box-shadow: 0 22px 44px rgba(74, 52, 40, 0.18);
        border-color: #d4a574;
      }

      .table-card-content {
        display: flex;
        align-items: center;
        gap: 1.2rem;
        padding: 1.6rem 1.8rem;
        position: relative;
        z-index: 1;
      }

      .table-icon {
        width: 3.2rem;
        height: 3.2rem;
        border-radius: 16px;
        background: rgba(247, 239, 225, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.8rem;
        color: #d9794d;
        box-shadow: 0 8px 18px rgba(212, 165, 116, 0.35);
      }

      .table-details {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .table-label {
        font-size: 0.75rem;
        letter-spacing: 1px;
        text-transform: uppercase;
        color: #c9a87f;
      }

      .table-name {
        font-size: 1.25rem;
        font-weight: 600;
        color: #4a3828;
      }

      .table-count {
        font-size: 0.85rem;
        color: #8b6f47;
      }

      .table-action {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.3rem;
        font-size: 0.9rem;
        font-weight: 600;
        color: #c87250;
        text-transform: uppercase;
        letter-spacing: 0.8px;
      }

      .table-creation-form {
        display: flex;
        flex-direction: column;
        gap: 1.6rem;
      }

      .autumn-label {
        font-weight: 600;
        color: #8b6f47;
        font-size: 1rem;
      }

      .autumn-input {
        font-size: 1.05rem;
        padding: 1.1rem 1.4rem;
        background: #faf8f4;
        border: 2px solid #e8dcc8;
        border-radius: 18px;
        color: #4a3828;
      }

      .btn-autumn {
        border-radius: 16px;
        padding: 1.1rem;
        font-size: 1.05rem;
        font-weight: 600;
        background: linear-gradient(135deg, #d4a574 0%, #b87333 100%);
        box-shadow: 0 16px 30px rgba(184, 92, 71, 0.25);
      }

      .btn-autumn:hover:not(:disabled) {
        box-shadow: 0 18px 34px rgba(184, 92, 71, 0.3);
      }

      .btn-autumn:disabled {
        background: linear-gradient(135deg, #d7d2ca, #bdb7af);
        color: #6f6a62;
        box-shadow: none;
      }
    `,
  ],
})
export class TableSelectComponent implements OnInit, OnDestroy {
  eventCode!: string;
  teamId!: string;
  tables: Array<{ id: string; name: string; teamsCount: number }> = [];
  newTable = '';
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private session: SessionService,
    private socket: SocketService
  ) {
    this.eventCode = this.route.snapshot.parent!.params['eventCode'];
    const sess = this.session.load();
    if (sess) {
      this.teamId = sess.teamId;
    }
  }

  ngOnInit() {
    // Connecter le socket avant de l'utiliser
    this.socket.connect();

    this.loadTables();

    // Écouter les nouvelles tables créées
    this.socket.on('table_created', (data: any) => {
      this.loadTables();
    });
  }

  loadTables() {
    this.api.getTables(this.eventCode).subscribe({
      next: (list) => (this.tables = list),
      error: (err) => console.error('Error loading tables:', err)
    });
  }

  createTable() {
    if (!this.newTable.trim()) return;

    this.loading = true;
    this.api.createTable(this.eventCode, this.newTable.trim()).subscribe({
      next: (table) => {
        this.newTable = '';
        this.loading = false;

        // Émettre un événement WebSocket
        this.socket.emit('table_created', {
          eventCode: this.eventCode,
          tableId: table.id,
          tableName: table.name
        });

        // Auto-sélectionner la table créée
        this.selectTable(table.id);
      },
      error: (err) => {
        this.loading = false;
        alert('Erreur lors de la création de la table. ' + (err.error?.message || ''));
      }
    });
  }

  selectTable(tableId: string) {
    this.loading = true;
    this.api.joinTable(this.teamId, tableId).subscribe({
      next: (response) => {
        this.loading = false;

        // Émettre un événement WebSocket
        this.socket.emit('team_joined_table', {
          eventCode: this.eventCode,
          teamId: response.teamId,
          teamName: response.teamName,
          tableId: response.tableId,
          tableName: response.tableName
        });

        // Mettre à jour la session pour inclure la table
        const sess = this.session.load();
        if (sess) {
          this.session.save({
            ...sess,
            tableId: response.tableId,
            tableName: response.tableName
          });
        }

        // Rediriger vers la page de jeu
        this.router.navigate(['../round'], { relativeTo: this.route });
      },
      error: (err) => {
        this.loading = false;
        if (err.error?.code === 'TEAM_ALREADY_HAS_TABLE') {
          alert('Votre équipe a déjà rejoint une table.');
          this.router.navigate(['../round'], { relativeTo: this.route });
        } else {
          alert('Erreur lors de la sélection de la table. Veuillez réessayer.');
        }
      }
    });
  }

  trackByTableId(index: number, table: any): string {
    return table.id;
  }

  ngOnDestroy() {
    // Nettoyer les listeners et déconnecter le socket
    this.socket.off('table_created');
    this.socket.disconnect();
  }
}
