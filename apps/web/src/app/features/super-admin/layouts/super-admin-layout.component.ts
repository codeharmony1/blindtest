import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SuperAdminService } from '../../../core/services/super-admin.service';

@Component({
  selector: 'bt-super-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="super-admin-layout">
      <header class="dashboard-header">
        <div class="header-content">
          <div class="header-left">
            <h1>🎛️ Super Admin</h1>
            <p>Blind Test Musical Platform</p>
          </div>
          <div class="header-right">
            <span class="admin-name" *ngIf="admin">{{ admin.name || admin.email }}</span>
            <button class="btn-logout" (click)="logout()">Déconnexion</button>
          </div>
        </div>
      </header>

      <nav class="dashboard-nav">
        <a
          routerLink="/backstage/dashboard"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: true }"
        >
          📊 Dashboard
        </a>
        <a routerLink="/backstage/organizations" routerLinkActive="active"> 🏢 Organisations </a>
        <a routerLink="/backstage/events" routerLinkActive="active"> 🎮 Événements Live </a>
        <a routerLink="/backstage/logs" routerLinkActive="active"> 📋 Audit Logs </a>
      </nav>

      <main class="dashboard-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [
    `
      .super-admin-layout {
        min-height: 100vh;
        background: linear-gradient(135deg, #f5f7fa 0%, #e3e8ef 100%);
      }

      .dashboard-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 1.25rem 2rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      .header-content {
        max-width: 1400px;
        margin: 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
      }

      .header-left h1 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 700;
      }

      .header-left p {
        margin: 0.25rem 0 0 0;
        opacity: 0.9;
        font-size: 0.9rem;
      }

      .header-right {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .admin-name {
        font-size: 0.9rem;
        opacity: 0.95;
      }

      .btn-logout {
        padding: 0.5rem 1rem;
        background: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 6px;
        color: white;
        cursor: pointer;
        font-size: 0.9rem;
        transition: all 0.2s;
      }

      .btn-logout:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      .dashboard-nav {
        background: white;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
        padding: 0;
        display: flex;
        gap: 0;
        max-width: 1400px;
        margin: 0 auto;
      }

      .dashboard-nav a {
        padding: 1rem 1.5rem;
        color: #4a5568;
        text-decoration: none;
        border-bottom: 3px solid transparent;
        transition: all 0.2s;
        font-weight: 500;
      }

      .dashboard-nav a:hover {
        background: #f7fafc;
        color: #667eea;
      }

      .dashboard-nav a.active {
        color: #667eea;
        border-bottom-color: #667eea;
        background: #f7fafc;
      }

      .dashboard-content {
        max-width: 1400px;
        margin: 0 auto;
        padding: 2rem;
      }

      @media (max-width: 768px) {
        .header-content {
          flex-direction: column;
          align-items: flex-start;
        }
        .dashboard-nav {
          flex-direction: column;
        }
      }
    `,
  ],
})
export class SuperAdminLayoutComponent implements OnInit {
  admin: any = null;

  constructor(
    private superAdminService: SuperAdminService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.admin = this.superAdminService.getAdmin();
  }

  logout(): void {
    this.superAdminService.logout();
    this.router.navigate(['/backstage/login']);
  }
}
