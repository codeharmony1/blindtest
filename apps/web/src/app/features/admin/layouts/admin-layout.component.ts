import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'bt-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="admin-layout">
      <!-- Header -->
      <header class="admin-header">
        <div class="header-content">
          <h1 class="header-title">
            <span class="header-icon">⚙️</span>
            Administration Blind Test
          </h1>
          <div class="header-actions">
            <a routerLink="/dj/DEMO" class="btn btn-secondary"> 🎧 Interface DJ </a>
            <a routerLink="/join/DEMO" class="btn btn-secondary"> 🎮 Interface Joueur </a>
          </div>
        </div>
      </header>

      <div class="admin-body">
        <!-- Sidebar -->
        <aside class="admin-sidebar">
          <nav class="sidebar-nav">
            <a routerLink="/admin/dashboard" routerLinkActive="active" class="nav-item">
              <span class="nav-icon">📊</span>
              <span class="nav-label">Dashboard</span>
            </a>
            <a routerLink="/admin/events" routerLinkActive="active" class="nav-item">
              <span class="nav-icon">🎪</span>
              <span class="nav-label">Événements</span>
            </a>
            <div class="nav-divider"></div>
            <div class="nav-section">
              <span class="nav-section-title">Gestion</span>
              <a routerLink="/admin/rounds" routerLinkActive="active" class="nav-item nav-sub">
                <span class="nav-icon">🎵</span>
                <span class="nav-label">Rounds</span>
              </a>
            </div>
          </nav>
        </aside>

        <!-- Main Content -->
        <main class="admin-main">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [
    `
      .admin-layout {
        height: 100vh;
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        font-family: 'Inter', sans-serif;
      }

      /* Header */
      .admin-header {
        background: white;
        border-bottom: 1px solid #e2e8f0;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 2rem;
      }

      .header-title {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-size: 1.5rem;
        font-weight: 700;
        color: #1e293b;
        margin: 0;
      }

      .header-icon {
        font-size: 1.75rem;
      }

      .header-actions {
        display: flex;
        gap: 1rem;
      }

      .btn {
        padding: 0.5rem 1rem;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 600;
        font-size: 0.875rem;
        transition: all 0.2s ease;
        border: none;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
      }

      .btn-secondary {
        background: #f1f5f9;
        color: #475569;
        border: 1px solid #cbd5e1;
      }

      .btn-secondary:hover {
        background: #e2e8f0;
        border-color: #94a3b8;
      }

      /* Body Layout */
      .admin-body {
        display: flex;
        height: calc(100vh - 80px);
      }

      /* Sidebar */
      .admin-sidebar {
        width: 260px;
        background: white;
        border-right: 1px solid #e2e8f0;
        overflow-y: auto;
      }

      .sidebar-nav {
        padding: 1.5rem 1rem;
      }

      .nav-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        border-radius: 8px;
        text-decoration: none;
        color: #64748b;
        font-weight: 500;
        transition: all 0.2s ease;
        margin-bottom: 0.25rem;
      }

      .nav-item:hover {
        background: #f8fafc;
        color: #374151;
      }

      .nav-item.active {
        background: #3b82f6;
        color: white;
      }

      .nav-icon {
        font-size: 1.125rem;
        width: 20px;
        text-align: center;
      }

      .nav-label {
        font-size: 0.875rem;
      }

      .nav-divider {
        height: 1px;
        background: #e2e8f0;
        margin: 1rem 0;
      }

      .nav-section {
        margin-bottom: 1rem;
      }

      .nav-section-title {
        display: block;
        padding: 0.5rem 1rem;
        font-size: 0.75rem;
        font-weight: 600;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .nav-sub {
        margin-left: 1rem;
        padding-left: 0.75rem;
      }

      /* Main Content */
      .admin-main {
        flex: 1;
        padding: 2rem;
        overflow-y: auto;
        background: #f8fafc;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .admin-sidebar {
          width: 200px;
        }

        .admin-main {
          padding: 1rem;
        }

        .header-content {
          padding: 1rem;
          flex-direction: column;
          gap: 1rem;
        }
      }

      @media (max-width: 640px) {
        .admin-sidebar {
          display: none;
        }

        .header-actions {
          flex-direction: column;
          width: 100%;
        }
      }
    `,
  ],
})
export class AdminLayoutComponent {}
