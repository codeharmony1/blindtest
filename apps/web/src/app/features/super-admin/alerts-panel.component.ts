import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AlertsService, Alert } from '../../core/services/alerts.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'bt-alerts-panel',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="alerts-panel">
      <div class="panel-header">
        <h3>⚠️ Alertes & Notifications</h3>
        <div class="header-actions">
          <span class="unread-badge" *ngIf="unreadCount > 0">{{ unreadCount }}</span>
          <button class="btn-icon" (click)="markAllAsRead()" *ngIf="unreadCount > 0" title="Tout marquer comme lu">
            ✓
          </button>
        </div>
      </div>

      <div class="alerts-list" *ngIf="alerts.length > 0">
        <div
          *ngFor="let alert of alerts"
          class="alert-item"
          [class.unread]="!alert.read"
          [class]="'alert-' + alert.severity"
          (click)="handleAlertClick(alert)"
        >
          <div class="alert-icon">{{ getAlertIcon(alert) }}</div>
          <div class="alert-content">
            <div class="alert-header">
              <h4>{{ alert.title }}</h4>
              <span class="alert-time">{{ getRelativeTime(alert.timestamp) }}</span>
            </div>
            <p class="alert-message">{{ alert.message }}</p>
            <div class="alert-meta" *ngIf="alert.tenantName || alert.eventCode">
              <span class="meta-tag" *ngIf="alert.tenantName">🏢 {{ alert.tenantName }}</span>
              <span class="meta-tag" *ngIf="alert.eventCode">🎮 {{ alert.eventCode }}</span>
            </div>
          </div>
          <button class="btn-dismiss" (click)="dismissAlert(alert, $event)">✕</button>
        </div>
      </div>

      <div class="empty-state" *ngIf="alerts.length === 0">
        <div class="empty-icon">✅</div>
        <p>Aucune alerte pour le moment</p>
      </div>
    </div>
  `,
  styles: [`
    .alerts-panel {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 2px solid #f7fafc;
      background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
    }

    .panel-header h3 {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 700;
      color: #2d3748;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .unread-badge {
      background: #ef4444;
      color: white;
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 700;
      min-width: 20px;
      text-align: center;
    }

    .btn-icon {
      width: 32px;
      height: 32px;
      border: none;
      background: white;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      font-weight: 600;
    }

    .btn-icon:hover {
      background: #667eea;
      color: white;
    }

    .alerts-list {
      max-height: 400px;
      overflow-y: auto;
    }

    .alert-item {
      display: flex;
      gap: 1rem;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #f7fafc;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
    }

    .alert-item:hover {
      background: #f7fafc;
    }

    .alert-item.unread {
      background: #fef3c7;
    }

    .alert-item.unread::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: #f59e0b;
    }

    .alert-item.alert-critical::before {
      background: #ef4444;
    }

    .alert-item.alert-high::before {
      background: #f97316;
    }

    .alert-item.alert-medium::before {
      background: #f59e0b;
    }

    .alert-item.alert-low::before {
      background: #3b82f6;
    }

    .alert-icon {
      font-size: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: #f7fafc;
      border-radius: 8px;
      flex-shrink: 0;
    }

    .alert-content {
      flex: 1;
      min-width: 0;
    }

    .alert-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 0.25rem;
    }

    .alert-header h4 {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 600;
      color: #2d3748;
    }

    .alert-time {
      font-size: 0.75rem;
      color: #a0aec0;
      white-space: nowrap;
      margin-left: 1rem;
    }

    .alert-message {
      margin: 0;
      font-size: 0.875rem;
      color: #4a5568;
      line-height: 1.5;
    }

    .alert-meta {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    .meta-tag {
      padding: 0.125rem 0.5rem;
      background: #e2e8f0;
      color: #4a5568;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .btn-dismiss {
      width: 24px;
      height: 24px;
      border: none;
      background: transparent;
      border-radius: 4px;
      cursor: pointer;
      color: #a0aec0;
      font-size: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all 0.2s;
    }

    .btn-dismiss:hover {
      background: #fed7d7;
      color: #c53030;
    }

    .empty-state {
      padding: 3rem 1.5rem;
      text-align: center;
    }

    .empty-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    .empty-state p {
      margin: 0;
      color: #a0aec0;
      font-size: 0.95rem;
    }

    /* Scrollbar */
    .alerts-list::-webkit-scrollbar {
      width: 6px;
    }

    .alerts-list::-webkit-scrollbar-track {
      background: #f7fafc;
    }

    .alerts-list::-webkit-scrollbar-thumb {
      background: #cbd5e0;
      border-radius: 3px;
    }

    .alerts-list::-webkit-scrollbar-thumb:hover {
      background: #a0aec0;
    }
  `],
})
export class AlertsPanelComponent implements OnInit, OnDestroy {
  alerts: Alert[] = [];
  unreadCount = 0;
  private subscription?: Subscription;

  constructor(private alertsService: AlertsService) {}

  ngOnInit(): void {
    this.subscription = this.alertsService.alerts$.subscribe((alerts) => {
      this.alerts = alerts.slice(0, 10); // Afficher les 10 dernières alertes
      this.unreadCount = alerts.filter((a) => !a.read).length;
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  getAlertIcon(alert: Alert): string {
    const icons: Record<Alert['category'], string> = {
      subscription: '📅',
      capacity: '📊',
      performance: '⚡',
      security: '🔒',
      system: '⚙️',
    };
    return icons[alert.category] || '📢';
  }

  getRelativeTime(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes}min`;
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${days}j`;
  }

  handleAlertClick(alert: Alert): void {
    this.alertsService.markAsRead(alert.id);
    if (alert.actionUrl) {
      window.location.href = alert.actionUrl;
    }
  }

  dismissAlert(alert: Alert, event: Event): void {
    event.stopPropagation();
    this.alertsService.removeAlert(alert.id);
  }

  markAllAsRead(): void {
    this.alertsService.markAllAsRead();
  }
}
