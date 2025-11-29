# RAPPORT DE TEST : 10 ÉQUIPES - 10 QUESTIONS

## 📋 Vue d'ensemble

Ce rapport documente le test complet du système de jeu multi-équipes avec timer pour l'application **Blindtest Musical**.

---

## ✅ Travail Accompli

### 1. Script de Test Créé

**Fichier** : [apps/api/test-10-teams-10-questions.ts](apps/api/test-10-teams-10-questions.ts)

**Fonctionnalités du script** :
- ✅ Création automatique d'un événement de test
- ✅ Création d'un round avec 10 chansons
- ✅ Création de 10 équipes avec leurs joueurs
- ✅ Connexion WebSocket pour chaque équipe
- ✅ Simulation de réponses simultanées réparties sur 30 secondes
- ✅ Test de soumission après expiration du timer
- ✅ Vérification des événements WebSocket (`round_started`, `round_ended`)
- ✅ Génération d'un rapport détaillé des résultats

### 2. Dépendances Installées

```bash
npm install socket.io-client --save-dev
```

### 3. Analyse Complète du Système de Timer

J'ai effectué une analyse approfondie du code existant et documenté :

#### **Timer Frontend** ([round.component.ts:632-684](apps/web/src/app/features/player/round.component.ts#L632-L684))
- **Résolution** : 100ms (mise à jour 10 fois par seconde)
- **Calcul** : `remaining = Math.max(0, endsAt - Date.now())`
- **Auto-soumission** : Si l'utilisateur a tapé une réponse mais n'a pas cliqué "Envoyer", la réponse est automatiquement soumise à l'expiration du timer

#### **Validation Backend** ([temporal-security.ts](apps/api/src/middlewares/temporal-security.ts))
- **Middleware 1 (`requireSongOpen`)** : Vérifie que la chanson est en statut "open"
- **Middleware 2 (`requireStrictTimeWindow`)** : Valide que l'heure serveur est <= `ended_at`
- **Codes d'erreur** :
  - `SONG_NOT_OPEN` : La chanson n'est pas ouverte
  - `SUBMISSION_WINDOW_CLOSED` : La fenêtre de soumission est fermée
  - `TIME_EXPIRED` : Le temps est écoulé

#### **Événements WebSocket** ([socket.ts:44-59](apps/api/src/ws/socket.ts#L44-L59))
- `round_started` : Envoyé quand le DJ lance une chanson
  - Contient : `{ roundId, songId, duration, endsAt }`
- `round_ended` : Envoyé quand le DJ ferme une chanson
  - Contient : `{ roundId, songId }`

#### **Verrouillage de l'Input** ([round-autumn.component.html:101-108](apps/web/src/app/features/player/round-autumn.component.html#L101-L108))
```html
<input
  [(ngModel)]="answer"
  [disabled]="!songId || sending"
  (keyup.enter)="send()"
/>
```
- **Conditions de désactivation** :
  - `!songId` : Aucune chanson en cours (en attente de `round_started`)
  - `sending` : Envoi en cours (évite les doubles soumissions)

#### **Message "Temps écoulé"** ([round-autumn.component.html:54-58](apps/web/src/app/features/player/round-autumn.component.html#L54-L58))
```html
<div class="timer-value">
  <span *ngIf="remaining > 0">{{ remaining / 1000 | number: '1.0-1' }}s</span>
  <span *ngIf="remaining === 0">Temps écoulé !</span>
</div>
```

#### **Bouton "LANCER LA CHANSON SUIVANTE"** ([live-control.component.ts:198-237](apps/web/src/app/features/dj/live-control.component.ts#L198-L237))
- **Endpoint** : `POST /api/rounds/:roundId/next`
- **Actions** :
  1. Ferme et grade la chanson précédente
  2. Recalcule les points pour toutes les réponses
  3. Ouvre la prochaine chanson "pending"
  4. Émet `round_started` via WebSocket
  5. Les joueurs reçoivent le nouveau timer

---

## ⚠️ Prérequis pour Exécuter le Test

### 1. Base de Données MariaDB

**CRITIQUE** : Le test nécessite que MariaDB soit démarré et configuré.

**Erreur rencontrée** :
```
❌ DB init error: Error: connect ECONNREFUSED 127.0.0.1:3306
```

**Actions nécessaires** :
1. Vérifier que MariaDB est installé
2. Démarrer le service MariaDB
3. Vérifier que la base de données `blindtest` existe
4. Vérifier les credentials dans le fichier `.env` :
   ```env
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASS=
   DB_NAME=blindtest
   ```

### 2. Configuration de l'Organisateur

Le test utilise les credentials suivants :
```javascript
ORGANIZER_CREDENTIALS: {
  email: 'admin@test.com',
  password: 'admin123456',
}
```

**Vérifier** : Est-ce que cet utilisateur existe déjà dans la base de données ?

---

## 🚀 Comment Exécuter le Test

Une fois MariaDB démarré et l'API fonctionnelle :

```bash
# 1. Démarrer l'API (dans un terminal séparé)
npm run dev:api

# 2. Attendre que l'API soit prête (voir "Server running on port 3000")

# 3. Exécuter le test
cd apps/api
npx ts-node test-10-teams-10-questions.ts
```

**Durée estimée** : ~6-7 minutes
- 10 questions × 30 secondes par question = 5 minutes
- + Temps de setup (~1 minute)
- + Temps de génération du rapport (~10 secondes)

---

## 📊 Résultats Attendus

Le test va vérifier :

### ✅ Tests Fonctionnels
1. **Création d'événement** : L'organisateur peut créer un événement
2. **Création de round** : Un round peut être créé avec 10 chansons
3. **Création d'équipes** : 10 équipes peuvent être créées et recevoir des tokens
4. **Connexion WebSocket** : Les 10 équipes se connectent via Socket.IO
5. **Événements `round_started`** : Toutes les équipes reçoivent l'événement quand le DJ lance une chanson
6. **Soumission de réponses** : Les réponses envoyées AVANT expiration du timer sont acceptées
7. **Rejet après expiration** : Les réponses envoyées APRÈS expiration du timer sont rejetées avec le code d'erreur approprié (`TIME_EXPIRED`, `SUBMISSION_WINDOW_CLOSED`, ou `SONG_NOT_OPEN`)
8. **Passage à la chanson suivante** : Le bouton "LANCER LA CHANSON SUIVANTE" fonctionne correctement
9. **Événements `round_ended`** : Les équipes reçoivent l'événement de fin

### 📈 Métriques Collectées
- Nombre total de réponses soumises (attendu : 100 = 10 équipes × 10 questions)
- Nombre de réponses acceptées
- Nombre de réponses rejetées
- Timing des soumissions (répartition sur les 30 secondes)
- Réception des événements WebSocket par équipe

---

## 🔍 Ce Que le Test Va Détecter

### Problèmes Potentiels
1. **Perte d'événements WebSocket** : Si certaines équipes ne reçoivent pas `round_started` ou `round_ended`
2. **Validation temporelle incorrecte** : Si des réponses après expiration sont acceptées
3. **Calcul de timer incorrect** : Si le timer côté client ne correspond pas au serveur
4. **Problèmes de concurrence** : Si plusieurs réponses simultanées causent des erreurs
5. **Gestion des tokens** : Si les tokens d'équipe sont invalides ou expirent

### Comportements Vérifiés
- ✅ Toutes les réponses envoyées entre 0-30 secondes sont acceptées
- ✅ Toutes les réponses envoyées après 32+ secondes sont rejetées
- ✅ Le message "Temps écoulé !" s'affiche quand `remaining === 0`
- ✅ L'input reste désactivé (`!songId`) jusqu'à ce que `round_started` soit reçu
- ✅ Les scores sont correctement calculés et stockés

---

## 📝 Rapport Généré

À la fin du test, un rapport détaillé sera affiché dans la console avec :

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 RAPPORT FINAL DU TEST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 Équipes créées : 10/10
📌 Questions jouées : 10
📌 Réponses totales soumises : 100
   ✅ Acceptées : X
   ❌ Rejetées : Y

📡 Événements WebSocket reçus :
   Team1 : round_started=10, round_ended=10
   Team2 : round_started=10, round_ended=10
   ...

✅ Tests réussis :
   ✓ Connexion organisateur réussie
   ✓ Événement créé : CODE123
   ✓ 10 équipes créées
   ✓ Toutes les sockets connectées
   ✓ Question 1 : Réponse rejetée après expiration (TIME_EXPIRED)
   ...

❌ Tests échoués :
   (aucun si tout fonctionne correctement)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 SCORE FINAL : X/Y (Z%)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🧪 Tests Supplémentaires Recommandés Avant Production

Le script recommandera automatiquement ces tests additionnels :

### 1. **Test de Charge** (Haute priorité)
- **Objectif** : Tester avec 50-100 équipes simultanées
- **Vérifie** : Performance du serveur, stabilité des WebSockets
- **Métriques** : Temps de réponse API, utilisation CPU/RAM, latence WebSocket

### 2. **Test de Reconnexion** (Haute priorité)
- **Objectif** : Simuler des pertes de connexion réseau
- **Vérifie** : Reconnexion automatique, récupération de l'état du jeu
- **Scénarios** :
  - Déconnexion pendant un round actif
  - Déconnexion entre deux rounds
  - Reconnexion après expiration du timer

### 3. **Test de Latence** (Moyenne priorité)
- **Objectif** : Simuler des connexions lentes (3G/4G)
- **Vérifie** : Comportement avec 100-500ms de latence
- **Outils** : Chrome DevTools throttling, `tc` (traffic control)

### 4. **Test de Stabilité** (Haute priorité)
- **Objectif** : Faire tourner le jeu pendant 1-2 heures
- **Vérifie** : Fuites mémoire, dégradation des performances
- **Scénarios** :
  - 10 rounds consécutifs
  - 50 chansons jouées
  - Équipes rejoignant/quittant pendant le jeu

### 5. **Test d'Intégrité des Scores** (Critique)
- **Objectif** : Vérifier les calculs de points
- **Vérifie** :
  - Points corrects pour bonnes réponses
  - Points corrects pour réponses proches (fuzzy matching)
  - Leaderboard mis à jour correctement
  - Persistance en base de données

### 6. **Test de Sécurité** (Critique)
- **Objectif** : Tenter des injections SQL/XSS, rejeu de tokens
- **Vérifie** :
  - Validation des inputs
  - Protection CSRF
  - Expiration des tokens JWT
  - Rate limiting

### 7. **Test de Cohérence** (Haute priorité)
- **Objectif** : Vérifier la synchronisation entre clients
- **Vérifie** :
  - Tous les clients voient le même timer
  - Leaderboard identique sur tous les écrans
  - Display projector synchronisé avec DJ

### 8. **Test de Performance API** (Moyenne priorité)
- **Objectif** : Mesurer les temps de réponse
- **Cibles** :
  - `POST /api/songs/:songId/answers` < 100ms
  - `POST /api/rounds/:roundId/next` < 200ms
  - WebSocket latency < 50ms

### 9. **Test UI/UX Multi-Devices** (Moyenne priorité)
- **Objectif** : Vérifier l'affichage sur différents appareils
- **Devices** :
  - Smartphones (iOS, Android)
  - Tablettes
  - Desktop (Chrome, Firefox, Safari)
  - Orientations portrait/paysage

### 10. **Test de Sauvegarde/Restauration** (Moyenne priorité)
- **Objectif** : Vérifier la persistance des données
- **Scénarios** :
  - Crash serveur pendant un round actif
  - Restauration de l'état après redémarrage
  - Export des résultats en CSV

---

## 🎯 Prochaines Étapes

### Immédiat
1. ✅ **Démarrer MariaDB** et vérifier la connexion
2. ✅ **Créer l'utilisateur admin** si nécessaire :
   ```sql
   INSERT INTO organizers (email, password, created_at, updated_at)
   VALUES ('admin@test.com', '$2b$10$...', NOW(), NOW());
   ```
3. ✅ **Exécuter le test** et analyser les résultats

### Court Terme (Avant Production)
1. Exécuter les tests de **charge** (50-100 équipes)
2. Exécuter les tests de **sécurité** (injections, tokens)
3. Exécuter les tests d'**intégrité des scores**
4. Exécuter les tests de **stabilité** (1-2 heures)

### Moyen Terme (Après Lancement)
1. Mettre en place un **monitoring** (CPU, RAM, latence)
2. Collecter des **métriques utilisateurs** (temps de réponse moyen)
3. Implémenter des **alertes** (taux d'erreur, disponibilité)

---

## 📞 Questions à Clarifier

Avant d'exécuter le test, merci de confirmer :

1. **MariaDB** : Comment démarrer le service sur ton système ?
2. **Utilisateur admin** : Existe-t-il déjà avec le mot de passe `admin123456` ?
3. **Environnement** : Le fichier `.env` est-il correctement configuré ?
4. **Migration** : Les migrations de base de données ont-elles été exécutées ?
   ```bash
   npm run migrate:run
   ```

---

## 📄 Fichiers Créés

1. [apps/api/test-10-teams-10-questions.ts](apps/api/test-10-teams-10-questions.ts) - Script de test complet
2. [TEST-REPORT-10-TEAMS.md](TEST-REPORT-10-TEAMS.md) - Ce rapport

---

**Date de création** : 2025-11-01
**Statut** : ⏳ En attente d'exécution (MariaDB requis)
**Prochaine action** : Démarrer MariaDB et exécuter le test
