import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SuperAdminService } from '../../core/services/super-admin.service';

interface AuditLog {
  id: string;
  action: string;
  admin_id: string;
  admin_email: string;
  target_type?: string;
  target_id?: string;
  target_name?: string;
  metadata?: any;
  ip_address?: string;
  created_at: string;
}

@Component({
  selector: 'bt-super-admin-logs',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="page-content">
      <div class="content-header">
        <div>
          <h1>📋 Journal d'audit</h1>
          <p>Traçabilité des actions critiques</p>
        </div>
      </div>
      <div class="filters-bar">
        <select [(ngModel)]="filterAction" (change)="applyFilter()" class="filter-select">
          <option value="">Toutes les actions</option>
          <option value="login">Connexion</option>
          <option value="logout">Déconnexion</option>
          <option value="suspend_tenant">Suspension organisation</option>
          <option value="reactivate_tenant">Réactivation organisation</option>
          <option value="update_plan">Changement plan</option>
          <option value="force_stop_event">Arrêt forcé événement</option>
          <option value="take_dj_control">Prise contrôle DJ</option>
          <option value="impersonate_tenant">Impersonnation</option>
          <option value="exit_impersonation">Sortie impersonation</option>
        </select>

        <select [(ngModel)]="filterTargetType" (change)="applyFilter()" class="filter-select">
          <option value="">Tous les types</option>
          <option value="tenant">Organisation</option>
          <option value="event">Événement</option>
          <option value="user">Utilisateur</option>
        </select>

        <input
          type="text"
          [(ngModel)]="searchQuery"
          (input)="applyFilter()"
          placeholder="Rechercher par admin ou cible..."
          class="search-input"
        />

        <button class="btn-export" (click)="exportLogs()">📥 Exporter CSV</button>
      </div>

      <div class="stats-bar">
        <div class="stat-card">
          <span class="stat-label">Total</span>
          <span class="stat-value">{{ logs.length }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Aujourd'hui</span>
          <span class="stat-value">{{ getTodayCount() }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Actions critiques</span>
          <span class="stat-value critical">{{ getCriticalCount() }}</span>
        </div>
      </div>

      <div class="loading" *ngIf="loading">Chargement...</div>
      <div class="error" *ngIf="error">{{ error }}</div>

      <div class="logs-table-wrapper" *ngIf="!loading">
        <table class="logs-table">
          <thead>
            <tr>
              <th>Date/Heure</th>
              <th>Action</th>
              <th>Admin</th>
              <th>Type</th>
              <th>Cible</th>
              <th>IP</th>
              <th>Détails</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let log of filteredLogs" [class]="'action-' + log.action">
              <td class="td-date">{{ log.created_at | date: 'dd/MM/yy HH:mm:ss' }}</td>
              <td>
                <span class="action-badge" [class]="'action-' + log.action">
                  {{ getActionLabel(log.action) }}
                </span>
              </td>
              <td class="td-admin">{{ log.admin_email }}</td>
              <td>
                <span class="type-badge" *ngIf="log.target_type">
                  {{ getTargetTypeLabel(log.target_type) }}
                </span>
              </td>
              <td class="td-target">{{ log.target_name || log.target_id || '-' }}</td>
              <td class="td-ip">{{ log.ip_address || '-' }}</td>
              <td>
                <button class="btn-details" (click)="showDetails(log)">👁️</button>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="empty-state" *ngIf="filteredLogs.length === 0">
          <p>Aucun journal d'audit trouvé</p>
        </div>

        <div class="pagination" *ngIf="filteredLogs.length > 0">
          <button class="btn-page" (click)="loadMore()" *ngIf="hasMore">Charger plus</button>
        </div>
      </div>
    </div>

    <!-- Modal for log details -->
    <div class="modal-overlay" *ngIf="selectedLog" (click)="closeDetails()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Détails du journal</h3>
          <button class="btn-close" (click)="closeDetails()">✕</button>
        </div>
        <div class="modal-body">
          <div class="detail-row">
            <span class="detail-label">ID:</span>
            <span>{{ selectedLog.id }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Date/Heure:</span>
            <span>{{ selectedLog.created_at | date: 'dd/MM/yyyy HH:mm:ss' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Action:</span>
            <span class="action-badge" [class]="'action-' + selectedLog.action">
              {{ getActionLabel(selectedLog.action) }}
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Admin:</span>
            <span>{{ selectedLog.admin_email }}</span>
          </div>
          <div class="detail-row" *ngIf="selectedLog.target_type">
            <span class="detail-label">Type cible:</span>
            <span>{{ getTargetTypeLabel(selectedLog.target_type) }}</span>
          </div>
          <div class="detail-row" *ngIf="selectedLog.target_id">
            <span class="detail-label">ID cible:</span>
            <span>{{ selectedLog.target_id }}</span>
          </div>
          <div class="detail-row" *ngIf="selectedLog.target_name">
            <span class="detail-label">Nom cible:</span>
            <span>{{ selectedLog.target_name }}</span>
          </div>
          <div class="detail-row" *ngIf="selectedLog.ip_address">
            <span class="detail-label">Adresse IP:</span>
            <span>{{ selectedLog.ip_address }}</span>
          </div>
          <div class="detail-row" *ngIf="selectedLog.metadata">
            <span class="detail-label">Métadonnées:</span>
            <pre class="metadata-json">{{ selectedLog.metadata | json }}</pre>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .page-content {
        padding: 0; /* layout already provides padding and max-width */
      }

      .content-header {
        margin-bottom: 1.5rem;
      }
      .content-header h1 {
        margin: 0 0 0.25rem 0;
        font-size: 1.5rem;
        font-weight: 700;
        color: #2d3748;
      }
      .content-header p {
        margin: 0;
        color: #718096;
      }

      .filters-bar {
        display: flex;
        gap: 1rem;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
      }

      .filter-select {
        padding: 0.75rem 1rem;
        border: 2px solid #e2e8f0;
        border-radius: 8px;
        font-size: 1rem;
        background: white;
        cursor: pointer;
      }

      .search-input {
        flex: 1;
        min-width: 250px;
        padding: 0.75rem 1rem;
        border: 2px solid #e2e8f0;
        border-radius: 8px;
        font-size: 1rem;
      }

      .btn-export {
        padding: 0.75rem 1.25rem;
        background: #48bb78;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.2s;
      }

      .btn-export:hover {
        background: #38a169;
      }

      .stats-bar {
        display: flex;
        gap: 1rem;
        margin-bottom: 2rem;
      }

      .stat-card {
        flex: 1;
        background: white;
        padding: 1rem;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .stat-label {
        font-size: 0.85rem;
        color: #718096;
        margin-bottom: 0.5rem;
      }

      .stat-value {
        font-size: 1.75rem;
        font-weight: 700;
        color: #2d3748;
      }

      .stat-value.critical {
        color: #f56565;
      }

      .logs-table-wrapper {
        background: white;
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        overflow: hidden;
      }

      .logs-table {
        width: 100%;
        border-collapse: collapse;
      }

      .logs-table thead {
        background: #f7fafc;
        border-bottom: 2px solid #e2e8f0;
      }

      .logs-table th {
        padding: 1rem;
        text-align: left;
        font-weight: 600;
        color: #2d3748;
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .logs-table td {
        padding: 1rem;
        border-bottom: 1px solid #f7fafc;
        font-size: 0.9rem;
      }

      .logs-table tbody tr:hover {
        background: #f7fafc;
      }

      .td-date {
        font-family: monospace;
        color: #4a5568;
        white-space: nowrap;
      }

      .td-admin {
        font-weight: 500;
        color: #2d3748;
      }

      .td-target {
        color: #4a5568;
      }

      .td-ip {
        font-family: monospace;
        color: #718096;
        font-size: 0.85rem;
      }

      .action-badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 999px;
        font-size: 0.8rem;
        font-weight: 600;
        white-space: nowrap;
      }

      .action-badge.action-login,
      .action-badge.action-logout {
        background: #bee3f8;
        color: #2c5282;
      }

      .action-badge.action-suspend_tenant,
      .action-badge.action-stop_event {
        background: #fed7d7;
        color: #c53030;
      }

      .action-badge.action-reactivate_tenant {
        background: #c6f6d5;
        color: #22543d;
      }

      .action-badge.action-update_plan,
      .action-badge.action-take_dj_control {
        background: #feebc8;
        color: #c05621;
      }

      .action-badge.action-impersonate {
        background: #e9d8fd;
        color: #553c9a;
      }

      .type-badge {
        display: inline-block;
        padding: 0.25rem 0.5rem;
        background: #e6fffa;
        color: #234e52;
        border-radius: 4px;
        font-size: 0.8rem;
        font-weight: 600;
      }

      .btn-details {
        padding: 0.25rem 0.75rem;
        background: #edf2f7;
        border: 1px solid #cbd5e0;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .btn-details:hover {
        background: #667eea;
        color: white;
        border-color: #667eea;
      }

      .pagination {
        padding: 1.5rem;
        text-align: center;
      }

      .btn-page {
        padding: 0.75rem 2rem;
        background: #667eea;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.2s;
      }

      .btn-page:hover {
        background: #5a67d8;
      }

      .empty-state {
        padding: 4rem 2rem;
        text-align: center;
        color: #718096;
        font-size: 1.1rem;
      }

      .loading,
      .error {
        text-align: center;
        padding: 3rem;
      }

      /* Modal styles */
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }

      .modal-content {
        background: white;
        border-radius: 12px;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      }

      .modal-header {
        padding: 1.5rem;
        border-bottom: 2px solid #e2e8f0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .modal-header h3 {
        margin: 0;
        color: #2d3748;
      }

      .btn-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #718096;
      }

      .modal-body {
        padding: 1.5rem;
      }

      .detail-row {
        display: flex;
        padding: 0.75rem 0;
        border-bottom: 1px solid #f7fafc;
      }

      .detail-label {
        font-weight: 600;
        color: #4a5568;
        min-width: 150px;
      }

      .metadata-json {
        background: #f7fafc;
        padding: 1rem;
        border-radius: 6px;
        font-size: 0.85rem;
        overflow-x: auto;
        margin: 0.5rem 0 0 0;
      }

      @media (max-width: 768px) {
        .filters-bar {
          flex-direction: column;
        }

        .stats-bar {
          flex-direction: column;
        }

        .logs-table-wrapper {
          overflow-x: auto;
        }

        .logs-table {
          min-width: 800px;
        }
      }
    `,
  ],
})
export class SuperAdminLogsComponent implements OnInit {
  logs: AuditLog[] = [];
  filteredLogs: AuditLog[] = [];
  loading = false;
  error = '';
  searchQuery = '';
  filterAction = '';
  filterTargetType = '';
  selectedLog: AuditLog | null = null;
  hasMore = false;

  constructor(
    private superAdminService: SuperAdminService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    if (!this.superAdminService.isAuthenticated()) {
      this.router.navigate(['/backstage/login']);
      return;
    }
    this.loadLogs();
  }

  loadLogs(): void {
    this.loading = true;
    this.error = '';

    // TODO: Implement getAuditLogs in SuperAdminService
    // For now, mock some data
    setTimeout(() => {
      this.logs = this.generateMockLogs();
      this.applyFilter();
      this.loading = false;
    }, 500);
  }

  applyFilter(): void {
    const query = this.searchQuery.toLowerCase();
    this.filteredLogs = this.logs.filter((log) => {
      const matchesSearch =
        !query ||
        log.admin_email.toLowerCase().includes(query) ||
        log.target_name?.toLowerCase().includes(query) ||
        log.target_id?.toLowerCase().includes(query);

      const matchesAction = !this.filterAction || log.action === this.filterAction;
      const matchesType = !this.filterTargetType || log.target_type === this.filterTargetType;

      return matchesSearch && matchesAction && matchesType;
    });
  }

  getTodayCount(): number {
    const today = new Date().toDateString();
    return this.logs.filter((log) => new Date(log.created_at).toDateString() === today).length;
  }

  getCriticalCount(): number {
    const criticalActions = ['suspend_tenant', 'stop_event', 'take_dj_control', 'impersonate'];
    return this.logs.filter((log) => criticalActions.includes(log.action)).length;
  }

  getActionLabel(action: string): string {
    const labels: Record<string, string> = {
      login: 'Connexion',
      logout: 'Déconnexion',
      suspend_tenant: 'Suspension',
      reactivate_tenant: 'Réactivation',
      update_plan: 'Changement plan',
      stop_event: 'Arrêt événement',
      take_dj_control: 'Prise contrôle DJ',
      impersonate: 'Impersonnation',
    };
    return labels[action] || action;
  }

  getTargetTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      tenant: 'Organisation',
      event: 'Événement',
      user: 'Utilisateur',
    };
    return labels[type] || type;
  }

  showDetails(log: AuditLog): void {
    this.selectedLog = log;
  }

  closeDetails(): void {
    this.selectedLog = null;
  }

  exportLogs(): void {
    // TODO: Implement CSV export
    alert('Export CSV à implémenter (Phase 2)');
  }

  loadMore(): void {
    // TODO: Implement pagination
    alert('Pagination à implémenter');
  }

  private generateMockLogs(): AuditLog[] {
    const now = Date.now();
    return [
      {
        id: '1',
        action: 'login',
        admin_id: 'a1',
        admin_email: 'admin@blindtest.local',
        ip_address: '192.168.1.100',
        created_at: new Date(now - 1000).toISOString(),
      },
      {
        id: '2',
        action: 'suspend_tenant',
        admin_id: 'a1',
        admin_email: 'admin@blindtest.local',
        target_type: 'tenant',
        target_id: 't1',
        target_name: 'Organisation Demo',
        metadata: { reason: 'Non-paiement' },
        ip_address: '192.168.1.100',
        created_at: new Date(now - 3600000).toISOString(),
      },
      {
        id: '3',
        action: 'update_plan',
        admin_id: 'a1',
        admin_email: 'admin@blindtest.local',
        target_type: 'tenant',
        target_id: 't2',
        target_name: 'Events Corp',
        metadata: { old_plan: 'DEMO', new_plan: 'MONTHLY' },
        ip_address: '192.168.1.100',
        created_at: new Date(now - 7200000).toISOString(),
      },
      {
        id: '4',
        action: 'stop_event',
        admin_id: 'a1',
        admin_email: 'admin@blindtest.local',
        target_type: 'event',
        target_id: 'e1',
        target_name: 'DEMO',
        metadata: { reason: 'Violation CGU' },
        ip_address: '192.168.1.100',
        created_at: new Date(now - 86400000).toISOString(),
      },
    ];
  }
}
