# Évolution Blind Test Musical - Spécifications Fonctionnelles
**Date :** 03 octobre 2025
**Version :** 1.0
**Objet :** Mise en place d'un système multi-tenant avec Super-Administration

---

## 1. Vue d'Ensemble

### 1.1 Contexte
L'application Blind Test Musical évolue d'une application mono-organisateur vers une **plateforme multi-tenant** permettant à plusieurs organisations de créer et gérer leurs propres événements de manière isolée.

### 1.2 Objectifs
- Implémenter une architecture multi-tenant complète
- Créer un système de gestion des abonnements
- Développer une interface de Super-Administration pour la supervision globale
- Mettre en place un modèle économique flexible (démo/événement/mensuel)

---

## 2. Architecture Multi-Tenant

### 2.1 Modèle d'Organisation
- **1 Abonnement = 1 Organisation/Entreprise**
- Chaque organisation peut créer **plusieurs événements** (selon son plan d'abonnement)
- Isolation complète des données entre organisations
- L'administrateur d'abonnement gère tous les événements de son organisation

### 2.2 Vérification de l'Existant
**À VÉRIFIER :** Architecture multi-tenant déjà en place ?
- Tables : `Tenant`, `TenantSession`, `TenantUser`
- Middlewares d'isolation des données
- Services de gestion des tenants

---

## 3. Gestion des Rôles et Permissions

### 3.1 Super-Administrateur (Plateforme)

**Responsabilités :**
- Supervision globale de tous les comptes et abonnements
- Gestion du cycle de vie des organisations (création, suspension, suppression)
- Support technique et intervention sur les sessions
- Analyse des statistiques globales

**Permissions - Gestion des Comptes :**
- ✅ Voir la liste de tous les comptes/abonnements
- ✅ Créer de nouveaux comptes
- ✅ Suspendre/réactiver des comptes
- ✅ Supprimer des comptes
- ✅ Modifier les plans d'abonnement
- ✅ Se connecter "en tant que" un admin d'abonnement (impersonation)

**Permissions - Gestion des Sessions :**
- ✅ Voir tous les événements en cours en temps réel
- ✅ Voir le nombre de joueurs connectés par événement
- ✅ Arrêter/suspendre un événement en cours
- ✅ Prendre le contrôle DJ d'un événement
- ✅ Consulter les logs et l'historique d'un événement
- ✅ Réinitialiser/débloquer un événement problématique
- ✅ Accéder aux événements de tous les comptes

**Permissions - Statistiques :**
- ✅ Voir les statistiques globales (nb total d'événements, joueurs, etc.)
- ✅ Analyser l'utilisation par organisation
- ✅ Générer des rapports d'activité

### 3.2 Administrateur d'Abonnement (Client)

**Responsabilités :**
- Gestion des événements de son organisation uniquement
- Gestion de son équipe (staff)
- Configuration de ses événements

**Permissions :**
- ✅ Créer/modifier/supprimer ses propres événements
- ✅ Gérer son équipe (EventStaff)
- ✅ Voir ses statistiques d'utilisation
- ✅ Configurer les paramètres de son organisation
- ❌ Voir les événements d'autres organisations
- ❌ Modifier les paramètres de facturation (lecture seule)

### 3.3 Staff d'Événement (DJ/Organisateur)
**Inchangé** - Gère un événement spécifique

### 3.4 Joueur
**Inchangé** - Participe aux événements

---

## 4. Interface Super-Administration

### 4.1 Tableau de Bord Principal

**Vue d'ensemble :**
- Nombre total d'organisations (actives/suspendues/expirées)
- Nombre d'événements en cours actuellement
- Nombre de joueurs connectés en temps réel
- Statistiques globales du jour/semaine/mois
- Alertes et notifications système

**Widgets :**
```
┌─────────────────────────────────────────────────────┐
│ 📊 Vue d'Ensemble                                    │
├─────────────────────────────────────────────────────┤
│ 🏢 Organisations Actives: 47                        │
│ 🎮 Événements en Cours: 12                          │
│ 👥 Joueurs Connectés: 284                           │
│ 📈 Événements Aujourd'hui: 28                       │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ ⚠️ Alertes & Notifications                          │
├─────────────────────────────────────────────────────┤
│ • Événement "Mariage Sophie" - 150 joueurs (max)    │
│ • Organisation "EventPro" - Abonnement expire 5j    │
│ • Pic de connexions détecté - Serveur 89%          │
└─────────────────────────────────────────────────────┘
```

### 4.2 Gestion des Organisations

**Liste des Organisations :**
- Tableau filtrable et triable
- Colonnes : Nom, Email admin, Plan, Statut, Date création, Nb événements, Actions
- Filtres : Statut (actif/suspendu/expiré), Plan, Date d'inscription
- Recherche par nom/email

**Actions sur une Organisation :**
- 👁️ Voir les détails complets
- ✏️ Modifier les informations
- 🔄 Changer le plan d'abonnement
- ⏸️ Suspendre le compte
- ▶️ Réactiver le compte
- 🗑️ Supprimer le compte (avec confirmation)
- 🔐 Se connecter en tant que (impersonation)

**Détails d'une Organisation :**
```
┌─────────────────────────────────────────────────────┐
│ 🏢 EventPro SARL                                     │
├─────────────────────────────────────────────────────┤
│ Admin: jean.dupont@eventpro.fr                      │
│ Plan: Premium Mensuel                               │
│ Statut: ✅ Actif                                     │
│ Créé le: 15/01/2025                                 │
│ Expire le: 15/11/2025                               │
│                                                      │
│ 📊 Statistiques:                                     │
│   • 45 événements créés (15 actifs)                 │
│   • 2,340 joueurs accueillis                        │
│   • 850 parties jouées                              │
│                                                      │
│ 👥 Équipe: 3 membres                                │
│ 💳 Facturation: À jour                              │
└─────────────────────────────────────────────────────┘
```

### 4.3 Supervision des Sessions en Direct

**Liste des Événements en Cours :**
- Vue temps réel des événements actifs
- Colonnes : Organisation, Nom événement, Code, Joueurs connectés, Manche en cours, Actions
- Mise à jour automatique via WebSocket

**Actions sur une Session :**
- 👁️ Voir les détails en temps réel
- 🎛️ Prendre le contrôle DJ
- ⏸️ Mettre en pause
- ⏹️ Arrêter la session
- 🔄 Réinitialiser
- 📋 Voir les logs

**Vue Détaillée d'une Session :**
```
┌─────────────────────────────────────────────────────┐
│ 🎮 Mariage de Sophie - DEMO                         │
│ Organisation: EventPro SARL                         │
├─────────────────────────────────────────────────────┤
│ 👥 42 joueurs connectés (8 équipes)                 │
│ 🎵 Manche 3/5 - Chanson 2/10                        │
│ ⏱️ Démarré il y a 47 minutes                        │
│                                                      │
│ 🏆 Classement Live:                                  │
│   1. Les Mélomanes - 850 pts                        │
│   2. Team Disco - 720 pts                           │
│   3. Les Virtuoses - 680 pts                        │
│                                                      │
│ 📊 Performance Serveur:                             │
│   • Latence WebSocket: 45ms                         │
│   • CPU: 23% | RAM: 512MB                           │
└─────────────────────────────────────────────────────┘

[⏸️ Pause] [⏹️ Arrêter] [🎛️ Prendre Contrôle] [📋 Logs]
```

### 4.4 Logs et Historique

**Logs Système :**
- Vue chronologique des événements système
- Filtres : Type (erreur/warning/info), Organisation, Date
- Recherche textuelle

**Historique des Actions :**
- Actions du super-admin (si audit trail activé)
- Actions critiques des admins d'abonnement
- Connexions et déconnexions

### 4.5 Statistiques Globales

**Métriques Clés :**
- Graphiques d'évolution (événements, joueurs, organisations)
- Taux d'utilisation par plan
- Périodes de pic d'activité
- Top organisations (par activité)
- Taux de conversion démo → payant

---

## 5. Modèle d'Abonnement

### 5.1 Plans Proposés (Flexible)

**Plan DÉMO (Gratuit) :**
- ✅ Créer des événements illimités
- ⚠️ **Limitation : 5 chansons maximum par événement**
- ✅ Joueurs illimités
- ✅ Fonctionnalités de base
- 🎯 **Objectif : Conversion vers plans payants**

**Plan PAR ÉVÉNEMENT :**
- ✅ Paiement à l'usage
- ✅ Chansons illimitées
- ✅ Toutes les fonctionnalités
- 💰 Prix : À définir (ex: 19€/événement)

**Plan MENSUEL :**
- ✅ Événements illimités dans le mois
- ✅ Chansons illimitées
- ✅ Toutes les fonctionnalités
- ✅ Support prioritaire
- 💰 Prix : À définir (ex: 49€/mois)

### 5.2 Gestion des Limitations

**Contrôles à Implémenter :**
- Bloquer l'ajout de chansons au-delà de 5 pour les comptes DÉMO
- Message informatif : "Passez à un plan payant pour ajouter plus de chansons"
- Afficher le nombre de chansons restantes
- Call-to-action vers la page de tarification

### 5.3 Facturation (Scope Futur)
- Intégration Stripe ou équivalent
- Gestion des paiements récurrents
- Factures automatiques
- Relances en cas d'échec de paiement

---

## 6. Sécurité et Accès

### 6.1 URL Super-Admin

**Exigence :** URL non-évidente pour éviter les scans automatisés de robots

**Proposition :**
- ❌ `/admin` (trop évident)
- ❌ `/super-admin` (trop évident)
- ✅ `/console-op` (operational console)
- ✅ `/dashboard-sys` (system dashboard)
- ✅ `/backstage` (en lien avec le thème musical)
- ✅ Ou utiliser un hash/code personnalisé : `/c0ntr0l-p4n3l`

**URL Choisie :** À définir

### 6.2 Authentification

**Système Séparé :**
- Base de données dédiée ou table séparée pour super-admins
- Authentification distincte (pas de collision avec admins d'abonnement)
- JWT avec rôle `SUPER_ADMIN`
- Tokens de courte durée (1h) pour sécurité maximale
- Possibilité de MFA (2FA) pour renforcer la sécurité

**Credentials :**
- Email/mot de passe fort obligatoire
- Pas de création de compte auto (création manuelle uniquement)

### 6.3 Audit Trail

**Principe :** Ne pas surcharger la base de données inutilement

**Logging Minimal :**
- ✅ Connexions/déconnexions super-admin
- ✅ Actions critiques uniquement :
  - Création/suppression d'organisation
  - Suspension/réactivation de compte
  - Arrêt forcé d'événement
  - Prise de contrôle DJ
  - Modification de plan
- ❌ Pas de log sur les consultations simples
- 🗓️ Rétention : 90 jours maximum

**Format Léger :**
```json
{
  "timestamp": "2025-10-03T14:30:00Z",
  "admin_id": "super_001",
  "action": "suspend_tenant",
  "target": "tenant_123",
  "reason": "Abus détecté"
}
```

---

## 7. Isolation des Données

### 7.1 Architecture Technique

**Stratégie :** Schema-based isolation (préférable à database-per-tenant)

**Avantages :**
- Maintenance simplifiée
- Backups centralisés
- Performances optimisées
- Migrations unifiées

**Middleware d'Isolation :**
```typescript
// Chaque requête filtre automatiquement par tenantId
WHERE tenantId = :currentTenantId
```

### 7.2 Tables Partagées vs Isolées

**Tables Partagées (avec tenantId) :**
- Event
- Team
- Player
- Round
- RoundSong
- Answer
- Score

**Tables Globales (sans tenantId) :**
- Tenant (liste des organisations)
- TenantUser (admins d'abonnement)
- SuperAdmin (super-administrateurs)
- AuditLog (logs système)

---

## 8. Fonctionnalités Additionnelles

### 8.1 Impersonation (Se connecter en tant que)

**Cas d'usage :** Support client, débogage

**Fonctionnement :**
1. Super-admin clique sur "Se connecter en tant que"
2. Nouvelle session créée avec le contexte du tenant ciblé
3. Accès complet à l'interface admin de l'organisation
4. Bandeau visible : "🔒 Connecté en tant que EventPro SARL - [Quitter]"
5. Toutes les actions sont tracées dans l'audit log

**Sécurité :**
- Token temporaire (30 minutes max)
- Impossible de modifier les paramètres de facturation
- Log automatique de toutes les actions en mode impersonation

### 8.2 Alertes Automatiques

**Déclencheurs :**
- Abonnement expire dans 7 jours
- Événement avec >90% de la capacité max
- Pic de connexions inhabituel
- Erreurs répétées sur un tenant
- Paiement échoué

**Notifications :**
- Badge sur le dashboard
- Email (optionnel)

### 8.3 Export de Données

**Pour les Organisations :**
- Export CSV de leurs événements
- Export des résultats/scores
- RGPD : Export complet de leurs données

**Pour le Super-Admin :**
- Rapports d'activité globaux
- Statistiques consolidées
- Export pour analyse

---

## 9. Priorisation et Phases

### Phase 1 - MVP Super-Admin (Prioritaire)
1. ✅ **[TERMINÉ]** Vérifier/Compléter l'architecture multi-tenant existante
   - Architecture complète déjà en place (Tenant, SuperAdmin, TenantUser, TenantSession, AuditLog)
   - Middlewares d'isolation fonctionnels
   - Services de gestion déjà implémentés

2. ✅ **[TERMINÉ]** Créer l'authentification super-admin séparée
   - API `/api/backstage/auth/login` fonctionnelle
   - JWT avec rôle `isSuperAdmin`
   - Middleware `requireSuperAdmin` opérationnel
   - Super-admin créé: `superadmin@blindtest.fr` / `SuperAdmin2025!`

3. ✅ **[API TERMINÉ]** Backend Super-Admin complet
   - GET `/api/backstage/stats` - Statistiques globales ✅
   - GET `/api/backstage/tenants` - Liste des tenants avec filtres ✅
   - GET `/api/backstage/tenants/:id` - Détails d'un tenant ✅
   - PUT `/api/backstage/tenants/:id/suspend` - Suspendre ✅
   - PUT `/api/backstage/tenants/:id/reactivate` - Réactiver ✅
   - PUT `/api/backstage/tenants/:id/plan` - Changer le plan ✅
   - DELETE `/api/backstage/tenants/:id` - Supprimer ✅
   - GET `/api/backstage/events/live` - Événements en cours ✅
   - GET `/api/backstage/audit-logs` - Logs d'audit ✅

4. ✅ **[TERMINÉ]** Migration des plans d'abonnement
   - Plans adaptés: DEMO, PER_EVENT, MONTHLY
   - Limites configurées selon spécification:
     - DEMO: Événements illimités, 5 chansons max, gratuit
     - PER_EVENT: 1 événement à la fois, chansons illimitées
     - MONTHLY: Tout illimité

5. 🔄 **[EN COURS]** Développer le dashboard principal (Angular)
   - À implémenter: Interface web du super-admin

6. ⏳ **[À FAIRE]** Implémenter la gestion des organisations (CRUD basique)
   - Backend ✅ terminé
   - Frontend ⏳ à développer

7. ⏳ **[À FAIRE]** Ajouter la supervision des sessions en direct
   - Backend ✅ terminé
   - Frontend ⏳ à développer

8. ⏳ **[À FAIRE]** Implémenter les limitations DÉMO (5 chansons)
   - Entité tenant mise à jour avec `max_songs_per_event`
   - Logique de validation à implémenter dans l'API des chansons

### Phase 2 - Fonctionnalités Avancées
1. Statistiques globales et graphiques
2. Impersonation (se connecter en tant que)
3. Gestion des plans d'abonnement
4. Alertes automatiques
5. Logs et audit trail minimal

### Phase 3 - Monétisation
1. Intégration système de paiement (Stripe)
2. Gestion de la facturation
3. Page de tarification publique
4. Processus d'inscription automatique
5. Relances et gestion des impayés

---

## 10. Questions en Suspens

### Décisions à Prendre
- [ ] URL finale pour l'accès super-admin ?
- [ ] Prix des plans (événement/mensuel) ?
- [ ] Activer ou non le MFA (2FA) pour super-admins ?
- [ ] Rétention des logs (90 jours suffisants ?) ?
- [ ] Support multilingue pour le super-admin ?

### Points à Clarifier
- [ ] L'architecture multi-tenant est-elle déjà en place ?
- [ ] Y a-t-il déjà des données production à migrer ?
- [ ] Hébergement : capacité à gérer plusieurs tenants ?
- [ ] Backup strategy par tenant ou global ?

---

## 11. Annexes

### 11.1 Schéma de Navigation Super-Admin

```
/backstage (ou URL choisie)
├── /login (authentification séparée)
├── /dashboard (tableau de bord principal)
├── /organizations (gestion des organisations)
│   ├── /list
│   ├── /create
│   ├── /:id/view
│   ├── /:id/edit
│   └── /:id/impersonate
├── /sessions (supervision temps réel)
│   ├── /live (événements en cours)
│   └── /:eventId/control
├── /statistics (statistiques globales)
├── /logs (logs et audit)
└── /settings (paramètres super-admin)
```

### 11.2 Structure de Base de Données (À Vérifier)

**Nouvelles Tables Potentielles :**
```sql
-- Super-administrateurs
CREATE TABLE SuperAdmin (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  passwordHash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  createdAt TIMESTAMP DEFAULT NOW(),
  lastLoginAt TIMESTAMP
);

-- Logs d'audit (minimal)
CREATE TABLE AuditLog (
  id UUID PRIMARY KEY,
  adminId UUID REFERENCES SuperAdmin(id),
  action VARCHAR(100) NOT NULL,
  targetType VARCHAR(50), -- 'tenant', 'event', etc.
  targetId UUID,
  metadata JSON,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Plans d'abonnement
CREATE TABLE SubscriptionPlan (
  id VARCHAR(50) PRIMARY KEY, -- 'demo', 'per_event', 'monthly'
  name VARCHAR(100),
  price DECIMAL(10,2),
  maxSongsPerEvent INT, -- NULL = illimité
  features JSON,
  active BOOLEAN DEFAULT true
);

-- Abonnements des organisations
ALTER TABLE Tenant ADD COLUMN planId VARCHAR(50) REFERENCES SubscriptionPlan(id);
ALTER TABLE Tenant ADD COLUMN subscriptionStatus VARCHAR(50); -- 'active', 'suspended', 'expired'
ALTER TABLE Tenant ADD COLUMN subscriptionExpiresAt TIMESTAMP;
```

---

**Document maintenu par :** Super-Admin
**Dernière mise à jour :** 03/10/2025
**Statut :** Spécifications en cours de validation
