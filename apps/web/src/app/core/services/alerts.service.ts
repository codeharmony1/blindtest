import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  category: 'subscription' | 'capacity' | 'performance' | 'security' | 'system';
  tenantId?: string;
  tenantName?: string;
  eventId?: string;
  eventCode?: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  metadata?: any;
}

@Injectable({
  providedIn: 'root',
})
export class AlertsService {
  private alertsSubject = new BehaviorSubject<Alert[]>([]);
  public alerts$ = this.alertsSubject.asObservable();

  constructor() {}

  // Ajouter une alerte
  addAlert(alert: Omit<Alert, 'id' | 'timestamp' | 'read'>): void {
    const newAlert: Alert = {
      ...alert,
      id: this.generateId(),
      timestamp: new Date(),
      read: false,
    };

    const currentAlerts = this.alertsSubject.value;
    this.alertsSubject.next([newAlert, ...currentAlerts]);
  }

  // Marquer une alerte comme lue
  markAsRead(alertId: string): void {
    const alerts = this.alertsSubject.value.map((alert) =>
      alert.id === alertId ? { ...alert, read: true } : alert
    );
    this.alertsSubject.next(alerts);
  }

  // Marquer toutes les alertes comme lues
  markAllAsRead(): void {
    const alerts = this.alertsSubject.value.map((alert) => ({ ...alert, read: true }));
    this.alertsSubject.next(alerts);
  }

  // Supprimer une alerte
  removeAlert(alertId: string): void {
    const alerts = this.alertsSubject.value.filter((alert) => alert.id !== alertId);
    this.alertsSubject.next(alerts);
  }

  // Obtenir le nombre d'alertes non lues
  getUnreadCount(): number {
    return this.alertsSubject.value.filter((alert) => !alert.read).length;
  }

  // Obtenir les alertes par sévérité
  getAlertsBySeverity(severity: Alert['severity']): Alert[] {
    return this.alertsSubject.value.filter((alert) => alert.severity === severity);
  }

  // Vérifier les alertes automatiques (à appeler périodiquement)
  checkAutoAlerts(stats: any, tenants: any[]): void {
    // 1. Vérifier les abonnements qui expirent bientôt
    tenants.forEach((tenant) => {
      if (tenant.subscription_expires_at) {
        const expiresAt = new Date(tenant.subscription_expires_at);
        const daysUntilExpiry = Math.ceil(
          (expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
          // Vérifier si l'alerte existe déjà
          const existingAlert = this.alertsSubject.value.find(
            (a) =>
              a.category === 'subscription' &&
              a.tenantId === tenant.id &&
              !a.read
          );

          if (!existingAlert) {
            this.addAlert({
              type: 'warning',
              severity: daysUntilExpiry <= 3 ? 'high' : 'medium',
              title: 'Abonnement expire bientôt',
              message: `L'abonnement de "${tenant.name}" expire dans ${daysUntilExpiry} jour${daysUntilExpiry > 1 ? 's' : ''}`,
              category: 'subscription',
              tenantId: tenant.id,
              tenantName: tenant.name,
              actionUrl: `/backstage/organizations`,
              metadata: { expiresAt: tenant.subscription_expires_at, daysLeft: daysUntilExpiry },
            });
          }
        }
      }
    });

    // 2. Vérifier les tenants suspendus
    const suspendedTenants = tenants.filter((t) => !t.is_active);
    if (suspendedTenants.length > 0) {
      const existingAlert = this.alertsSubject.value.find(
        (a) => a.category === 'system' && a.title === 'Organisations suspendues' && !a.read
      );

      if (!existingAlert) {
        this.addAlert({
          type: 'info',
          severity: 'low',
          title: 'Organisations suspendues',
          message: `${suspendedTenants.length} organisation${suspendedTenants.length > 1 ? 's' : ''} suspendue${suspendedTenants.length > 1 ? 's' : ''}`,
          category: 'system',
          actionUrl: `/backstage/organizations`,
          metadata: { count: suspendedTenants.length },
        });
      }
    }

    // 3. Vérifier les événements en cours avec beaucoup de joueurs
    // Note: Cette fonctionnalité nécessite les données d'événements live
  }

  private generateId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Simuler des alertes pour les tests
  simulateAlerts(): void {
    this.addAlert({
      type: 'warning',
      severity: 'high',
      title: 'Abonnement expire bientôt',
      message: 'L\'abonnement de "EventPro SARL" expire dans 5 jours',
      category: 'subscription',
      tenantId: 't1',
      tenantName: 'EventPro SARL',
      actionUrl: '/backstage/organizations',
    });

    this.addAlert({
      type: 'error',
      severity: 'critical',
      title: 'Événement saturé',
      message: 'L\'événement "DEMO" a atteint 95% de sa capacité (142/150 joueurs)',
      category: 'capacity',
      eventId: 'e1',
      eventCode: 'DEMO',
      actionUrl: '/backstage/events',
    });

    this.addAlert({
      type: 'info',
      severity: 'medium',
      title: 'Pic de connexions',
      message: 'Pic de connexions détecté - 284 joueurs actifs actuellement',
      category: 'performance',
      actionUrl: '/backstage/dashboard',
    });
  }
}
