# Implémentation du Mode Solo vs Équipe

## ✅ Fonctionnalité implémentée

Ajout du choix entre **mode TEAM** et **mode SOLO** lors de la création d'un événement.

---

## 🎯 Comportement

### Mode TEAM (par défaut)
- **Un capitaine par table** crée l'équipe avec le nom de sa table
- Les autres joueurs donnent leurs réponses **oralement au capitaine**
- **Un seul appareil par table** (géré par le capitaine)
- Unicité du **nom d'équipe** par événement
- Unicité du **pseudo de joueur** par événement

### Mode SOLO
- **Chaque joueur crée son propre pseudo** et joue individuellement
- **Pas de sélection d'équipe** : une équipe individuelle est créée automatiquement
- **Chaque joueur sur son appareil**
- Unicité du **pseudo** par événement (le pseudo devient le nom de l'équipe)

---

## 📋 Modifications Backend

### 1. Migration base de données
✅ **Fichier** : `apps/api/src/db/migrations/1728040000000-AddGameModeToEvents.ts`
- Ajout colonne `game_mode` dans table `events`
- Type : `enum('TEAM', 'SOLO')`
- Valeur par défaut : `'TEAM'`
- Migration exécutée avec succès ✓

### 2. Entité Event
✅ **Fichier** : `apps/api/src/db/entities/Event.ts`
```typescript
@Column({ type: "enum", enum: ["TEAM", "SOLO"], default: "TEAM" })
game_mode!: "TEAM" | "SOLO";
```

### 3. Routes API Events
✅ **Fichier** : `apps/api/src/modules/events/routes.ts`
- `POST /api/events` : accepte `gameMode` dans le body
- `GET /api/events/:code` : retourne `gameMode`
- `GET /api/events/:code/public` : retourne `gameMode`
- Validation : `gameMode` doit être 'TEAM' ou 'SOLO'

### 4. Routes API Players (logique de join)
✅ **Fichier** : `apps/api/src/modules/players/routes.ts`
- `POST /api/events/:code/join` modifié :
  - **Mode TEAM** : `teamId` obligatoire, vérification unicité du pseudo dans l'événement
  - **Mode SOLO** : `teamId` optionnel, création automatique d'une équipe individuelle avec le pseudo comme nom
  - Vérification que le pseudo (= nom d'équipe en mode SOLO) n'existe pas déjà

---

## 📱 Modifications Frontend

### 1. Service Event
✅ **Fichier** : `apps/web/src/app/core/services/event.service.ts`
- Ajout `gameMode?: 'TEAM' | 'SOLO'` aux interfaces :
  - `Event`
  - `CreateEventRequest`
  - `EventByIdResponse`
  - `UpdateEventRequest`

### 2. Service API
✅ **Fichier** : `apps/web/src/app/core/services/api.service.ts`
- Modification `getEventPublic()` : retourne `gameMode`
- Modification `joinEvent()` : `teamId` peut être `null` en mode SOLO

### 3. Formulaire Événement
✅ **Fichier** : `apps/web/src/app/features/admin/events/event-form.component.ts`
- Ajout champ `gameMode` au `FormGroup` avec valeur par défaut `'TEAM'`
- **Interface utilisateur** avec 2 cartes de sélection :
  - **Carte Mode Équipe** (👥) : description claire du fonctionnement
  - **Carte Mode Solo** (🎯) : description claire du fonctionnement
- Textes explicatifs génériques pour chaque mode
- Styles CSS pour les cartes interactives avec effet hover et sélection
- Transmission du `gameMode` lors de la création

### 4. Parcours Joueur (Join)
✅ **Fichier** : `apps/web/src/app/features/player/join.component.ts`
- Récupération du `gameMode` depuis l'API publique
- **Mode TEAM** : redirection vers sélection d'équipe (comportement actuel)
- **Mode SOLO** :
  - Appel direct de l'API `/events/:code/join` sans `teamId`
  - Création automatique de l'équipe individuelle côté serveur
  - Sauvegarde de la session
  - Redirection directe vers l'écran de jeu
- Gestion d'erreur si le pseudo est déjà pris

---

## 🧪 Tests et Validation

### ✅ Compilation
- Backend TypeScript : aucune erreur
- Frontend Angular : build réussi sans erreur

### ✅ Migration
```
Migration AddGameModeToEvents1728040000000 has been executed successfully.
```

### 🎯 Tests à effectuer manuellement
1. **Créer un événement en mode TEAM** → vérifier que la sélection d'équipe fonctionne
2. **Créer un événement en mode SOLO** → vérifier que le join est direct
3. **Vérifier l'unicité des pseudos en mode SOLO**
4. **Vérifier l'unicité des noms d'équipe en mode TEAM**
5. **Tester les événements existants** → doivent être en mode TEAM par défaut

---

## 📝 Rétrocompatibilité

- Tous les événements existants sont automatiquement en mode `TEAM`
- Le champ `game_mode` a une valeur par défaut `'TEAM'`
- Aucune modification manuelle nécessaire sur les données existantes

---

## 🚀 Déploiement

### Commandes à exécuter :
```bash
# 1. Migrer la base de données
npm run migrate:run -w @blindtest/api

# 2. Redémarrer l'application
npm run dev
```

---

## 📊 Résumé technique

| Composant | Fichiers modifiés | Tests |
|-----------|------------------|-------|
| Backend | 4 fichiers | ✅ Compilation OK |
| Frontend | 3 fichiers | ✅ Build OK |
| BDD | 1 migration | ✅ Exécutée |

**Total : 8 fichiers modifiés + 1 migration**

---

## 🎨 Interface Utilisateur

### Formulaire de création d'événement
```
┌────────────────────────────────────────┐
│ 🎮 Mode de jeu                         │
├────────────────────────────────────────┤
│ Choisissez comment les participants    │
│ vont jouer :                           │
│                                        │
│ ┌─────────────────┐ ┌─────────────────┐│
│ │ 👥 Mode Équipe  │ │ 🎯 Mode Solo    ││
│ │                 │ │                 ││
│ │ Un capitaine... │ │ Chaque joueur...││
│ │ [Sélectionné]   │ │                 ││
│ └─────────────────┘ └─────────────────┘│
└────────────────────────────────────────┘
```

---

## 🎉 Fonctionnalité prête à utiliser !
