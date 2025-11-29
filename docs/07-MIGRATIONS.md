# 🔄 Guide des Migrations de Base de Données

Guide complet des migrations de base de données pour Blind Test Musical.

## 📋 Table des Matières

- [Vue d'Ensemble](#vue-densemble)
- [Migrations TypeORM](#migrations-typeorm)
- [Migrations Manuelles SQL](#migrations-manuelles-sql)
- [Historique des Migrations](#historique-des-migrations)
- [Procédures](#procédures)

## Vue d'Ensemble

### Stratégie de Migration

Le projet utilise **deux approches complémentaires** pour gérer les migrations :

1. **TypeORM Migrations** (Développement)
   - Fichiers TypeScript dans `apps/api/src/db/migrations/`
   - Exécutés automatiquement via `npm run migrate:run`
   - Synchronisés avec les entités TypeORM

2. **Migrations SQL Manuelles** (Production)
   - Scripts SQL documentés dans ce guide
   - Exécutés manuellement via `docker exec` ou client MySQL
   - Recommandées pour la production pour un contrôle total

### Pourquoi Deux Approches ?

- **TypeORM** : Pratique en développement, génère automatiquement les migrations
- **SQL Manuel** : Plus sûr en production, permet de vérifier chaque changement

## Migrations TypeORM

### Commandes Disponibles

```bash
# Exécuter toutes les migrations en attente
npm run migrate:run -w @blindtest/api

# Annuler la dernière migration
npm run migrate:revert -w @blindtest/api

# Générer une nouvelle migration (détecte les changements d'entités)
npm run migrate:generate -w @blindtest/api -- -n NomDeLaMigration

# Créer une migration vide
npm run migrate:create -w @blindtest/api -- -n NomDeLaMigration
```

### Structure d'une Migration TypeORM

```typescript
import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddGroupOfficialToRoundSong1761000000000 implements MigrationInterface {
  name = 'AddGroupOfficialToRoundSong1761000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Vérifier si la colonne existe déjà (idempotence)
    const table = await queryRunner.getTable("round_songs");
    const hasGroupOfficial = table?.columns.find(column => column.name === "group_official");

    if (!hasGroupOfficial) {
      await queryRunner.addColumn("round_songs", new TableColumn({
        name: "group_official",
        type: "varchar",
        length: "255",
        isNullable: true,
      }));
      console.log('✅ Colonne group_official ajoutée');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback : supprimer la colonne
    await queryRunner.dropColumn("round_songs", "group_official");
  }
}
```

### Bonnes Pratiques TypeORM

1. **Toujours vérifier l'existence** avant d'ajouter/supprimer
2. **Implémenter le rollback** dans la méthode `down()`
3. **Tester en local** avant de déployer
4. **Logs explicites** pour comprendre ce qui se passe

## Migrations Manuelles SQL

### Exécution sur le Serveur

```bash
# Se connecter à MariaDB
docker exec -it mariadb mysql -u blindtest_prod -p blindtest_production

# Ou exécuter directement avec heredoc
docker exec -it mariadb mysql -u blindtest_prod -p blindtest_production << 'EOF'
ALTER TABLE round_songs ADD COLUMN IF NOT EXISTS group_official VARCHAR(255) NULL;
DESCRIBE round_songs;
EOF
```

### Template de Migration SQL

```sql
-- ========================================
-- Migration: [Nom de la migration]
-- Date: YYYY-MM-DD
-- Description: [Description des changements]
-- ========================================

-- 1. Vérifier l'état actuel
DESCRIBE table_name;

-- 2. Appliquer les changements
ALTER TABLE table_name
ADD COLUMN IF NOT EXISTS new_column VARCHAR(255) NULL
AFTER existing_column;

-- 3. Vérifier les changements
DESCRIBE table_name;
SELECT COUNT(*) FROM table_name;

-- 4. Rollback (commenté, à décommenter si nécessaire)
-- ALTER TABLE table_name DROP COLUMN new_column;
```

## Historique des Migrations

### Migration 1: Ajout de `group_official` à `round_songs`

**Date**: 29 octobre 2025
**Fichier TypeORM**: `1761000000000-AddGroupOfficialToRoundSong.ts`
**Statut**: ✅ Appliquée en production

**Objectif**: Permettre de différencier l'artiste (chanteur) du groupe (band).

**SQL Manuel**:
```sql
ALTER TABLE round_songs
ADD COLUMN IF NOT EXISTS group_official VARCHAR(255) NULL
AFTER artist_official;
```

**Vérification**:
```sql
DESCRIBE round_songs;
-- Doit montrer group_official après artist_official
```

**Impact**:
- Permet de stocker "Queen" comme groupe et "Freddie Mercury" comme artiste
- Compatible avec les données existantes (NULL autorisé)

---

### Migration 2: Ajout de `match_group` à `answers`

**Date**: 29 octobre 2025
**Fichier TypeORM**: `1761000000001-AddMatchGroupToAnswer.ts`
**Statut**: ✅ Appliquée en production

**Objectif**: Tracker si une réponse correspond au nom du groupe.

**SQL Manuel**:
```sql
ALTER TABLE answers
ADD COLUMN IF NOT EXISTS match_group TINYINT(1) NOT NULL DEFAULT 0
AFTER match_artist;
```

**Vérification**:
```sql
DESCRIBE answers;
-- Doit montrer match_group après match_artist
```

**Impact**:
- Système de scoring plus précis
- Compatible avec les données existantes (default 0)

---

### Migration 3: Suppression de `custom_domain` dans `tenants`

**Date**: 29 octobre 2025
**Fichier TypeORM**: `1759900000000-RemoveCustomDomain.ts`
**Statut**: ⚠️ À appliquer en production

**Objectif**: Nettoyer une colonne inutilisée.

**SQL Manuel**:
```sql
-- Vérifier si la colonne existe
DESCRIBE tenants;

-- Supprimer si elle existe
ALTER TABLE tenants DROP COLUMN IF EXISTS custom_domain;
```

**Vérification**:
```sql
DESCRIBE tenants;
-- custom_domain ne doit plus apparaître
```

**Impact**:
- Simplifie le schéma
- Aucun impact fonctionnel (colonne non utilisée)

**Rollback**:
```sql
ALTER TABLE tenants
ADD COLUMN custom_domain VARCHAR(255) NULL;
```

---

## Procédures

### Créer une Nouvelle Migration

#### Étape 1: Modifier l'Entité TypeORM

```typescript
// apps/api/src/db/entities/RoundSong.ts
@Column({ type: "varchar", length: 255, nullable: true })
group_official?: string | null;
```

#### Étape 2: Générer la Migration

```bash
npm run migrate:generate -w @blindtest/api -- -n AddGroupOfficialToRoundSong
```

#### Étape 3: Vérifier le Fichier Généré

```typescript
// apps/api/src/db/migrations/TIMESTAMP-AddGroupOfficialToRoundSong.ts
// Vérifier que le code est correct et ajouter la logique d'idempotence si nécessaire
```

#### Étape 4: Tester en Local

```bash
# Appliquer
npm run migrate:run -w @blindtest/api

# Vérifier
docker exec -it mariadb mysql -u root -p blindtest -e "DESCRIBE round_songs;"

# Tester le rollback
npm run migrate:revert -w @blindtest/api
```

#### Étape 5: Créer la Documentation SQL

Créer un fichier `MIGRATION-PRODUCTION-YYYY-MM-DD.md` avec les commandes SQL manuelles équivalentes.

### Appliquer une Migration en Production

#### Option A: Migration SQL Manuelle (RECOMMANDÉ)

```bash
# 1. Sauvegarder la base de données
mysqldump -u blindtest_prod -p blindtest_production > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Se connecter à MariaDB
docker exec -it mariadb mysql -u blindtest_prod -p blindtest_production

# 3. Exécuter les commandes SQL
ALTER TABLE round_songs ADD COLUMN IF NOT EXISTS group_official VARCHAR(255) NULL AFTER artist_official;

# 4. Vérifier
DESCRIBE round_songs;

# 5. Quitter
EXIT;
```

#### Option B: Migration TypeORM (si conteneur API a accès)

```bash
# Exécuter toutes les migrations en attente
docker exec -it blindtest-api npm run migrate:run
```

### Rollback d'une Migration

#### SQL Manuel

```bash
# Se connecter
docker exec -it mariadb mysql -u blindtest_prod -p blindtest_production

# Exécuter le rollback
ALTER TABLE round_songs DROP COLUMN group_official;
```

#### TypeORM

```bash
# Annuler la dernière migration
docker exec -it blindtest-api npm run migrate:revert
```

### Vérifier l'État des Migrations

```bash
# Voir les tables de la base
docker exec -it mariadb mysql -u blindtest_prod -p blindtest_production -e "SHOW TABLES;"

# Voir la structure d'une table
docker exec -it mariadb mysql -u blindtest_prod -p blindtest_production -e "DESCRIBE round_songs;"

# Voir les migrations TypeORM exécutées
docker exec -it mariadb mysql -u blindtest_prod -p blindtest_production -e "SELECT * FROM migrations;"
```

## Checklist de Migration

### Avant la Migration

- [ ] Backup de la base de données créé
- [ ] Migration testée en local
- [ ] Commandes SQL documentées
- [ ] Plan de rollback défini
- [ ] Fenêtre de maintenance planifiée (si nécessaire)

### Pendant la Migration

- [ ] Connexion au serveur établie
- [ ] Backup vérifié (taille > 0)
- [ ] Commandes SQL exécutées
- [ ] Aucune erreur SQL retournée
- [ ] Vérifications de structure passées

### Après la Migration

- [ ] Structure de table vérifiée (DESCRIBE)
- [ ] Données existantes intactes (COUNT)
- [ ] Application redémarrée si nécessaire
- [ ] Tests fonctionnels passés
- [ ] Logs applicatifs sans erreur
- [ ] Documentation mise à jour

## Bonnes Pratiques

### 1. Idempotence

Toujours utiliser `IF NOT EXISTS` / `IF EXISTS` pour permettre plusieurs exécutions sans erreur.

```sql
-- ✅ Bon
ALTER TABLE table_name ADD COLUMN IF NOT EXISTS new_column VARCHAR(255);

-- ❌ Mauvais
ALTER TABLE table_name ADD COLUMN new_column VARCHAR(255);
-- Échoue si la colonne existe déjà
```

### 2. Rétrocompatibilité

Toujours ajouter des colonnes comme **nullable** ou avec **valeur par défaut**.

```sql
-- ✅ Bon - NULL autorisé
ALTER TABLE table_name ADD COLUMN new_column VARCHAR(255) NULL;

-- ✅ Bon - Valeur par défaut
ALTER TABLE table_name ADD COLUMN flag TINYINT(1) NOT NULL DEFAULT 0;

-- ❌ Mauvais - NOT NULL sans default
ALTER TABLE table_name ADD COLUMN new_column VARCHAR(255) NOT NULL;
-- Échoue si la table contient des données
```

### 3. Ordre des Opérations

1. **Backup** avant tout
2. **Migration** de la base
3. **Déploiement** du code
4. **Vérification** fonctionnelle

### 4. Documentation

Chaque migration doit être documentée avec :
- Objectif
- Date
- Commandes SQL
- Impact
- Procédure de rollback

## Dépannage

### Erreur: Column already exists

```sql
-- Erreur
ERROR 1060 (42S21): Duplicate column name 'group_official'

-- Solution
ALTER TABLE round_songs ADD COLUMN IF NOT EXISTS group_official VARCHAR(255);
```

### Erreur: Unknown column in query

```sql
-- Cause: Code déployé avant la migration
-- Solution: Appliquer la migration puis redémarrer l'API
docker exec -it mariadb mysql -u blindtest_prod -p blindtest_production << 'EOF'
ALTER TABLE round_songs ADD COLUMN IF NOT EXISTS group_official VARCHAR(255) NULL;
EOF

docker-compose restart blindtest-api
```

### Migration TypeORM bloquée

```bash
# Voir l'état
docker exec -it mariadb mysql -u blindtest_prod -p blindtest_production -e "SELECT * FROM migrations;"

# Supprimer manuellement une migration bloquée (ATTENTION)
docker exec -it mariadb mysql -u blindtest_prod -p blindtest_production -e "DELETE FROM migrations WHERE name = 'MigrationName';"

# Réessayer
docker exec -it blindtest-api npm run migrate:run
```

## Fichiers de Référence

- **Entités TypeORM**: `apps/api/src/db/entities/`
- **Migrations TypeORM**: `apps/api/src/db/migrations/`
- **Documentation SQL**: `MIGRATION-PRODUCTION-*.md` (racine du projet)
- **Guide de déploiement**: [docs/06-DEPLOYMENT.md](./06-DEPLOYMENT.md)

## Contact et Support

Pour toute question sur les migrations :

1. Consulter [Troubleshooting](./09-TROUBLESHOOTING.md)
2. Vérifier les logs : `docker logs blindtest-api`
3. Vérifier la structure : `DESCRIBE table_name`

---

**Dernière mise à jour** : 2025-10-29
**Version** : 1.0.0
**Auteur** : Alexandre Désiré
