# 📚 Documentation Blind Test Musical

Documentation technique complète du projet Blind Test Musical.

## 📖 Table des Matières

### 🚀 Démarrage Rapide
- [Guide de démarrage](./01-GETTING-STARTED.md) - Installation et configuration initiale
- [Architecture](./02-ARCHITECTURE.md) - Vue d'ensemble de l'architecture du projet

### 💻 Développement
- [Développement Local](./03-DEVELOPMENT.md) - Configuration de l'environnement de développement
- [Base de Données](./04-DATABASE.md) - Schéma, migrations et gestion de la base de données
- [API Documentation](./05-API.md) - Documentation des endpoints et services

### 🏗️ Déploiement
- [Guide de Déploiement](./06-DEPLOYMENT.md) - Procédures de déploiement en production
- [Migrations](./07-MIGRATIONS.md) - Historique et documentation des migrations

### 🧪 Tests & Qualité
- [Tests](./08-TESTING.md) - Stratégie de tests et procédures de validation
- [Troubleshooting](./09-TROUBLESHOOTING.md) - Résolution des problèmes courants

### 📋 Référence
- [Changelog](./10-CHANGELOG.md) - Historique des versions et modifications
- [Glossaire](./11-GLOSSARY.md) - Termes techniques et concepts

### 🧹 Maintenance
- [Cleanup Checklist](./CLEANUP-CHECKLIST.md) - Guide de nettoyage de la documentation
- [Archives](./archives/README.md) - Documentation archivée

## 🗂️ Organisation des Fichiers

```
docs/
├── README.md                    # Ce fichier - Index principal
├── 01-GETTING-STARTED.md       # Démarrage rapide
├── 02-ARCHITECTURE.md          # Architecture du projet
├── 03-DEVELOPMENT.md           # Guide de développement
├── 04-DATABASE.md              # Documentation BDD
├── 05-API.md                   # Documentation API
├── 06-DEPLOYMENT.md            # Guide de déploiement ✅
├── 07-MIGRATIONS.md            # Migrations et changements DB ✅
├── 08-TESTING.md               # Tests et validation
├── 09-TROUBLESHOOTING.md       # Résolution de problèmes ✅
├── 10-CHANGELOG.md             # Historique des versions
├── 11-GLOSSARY.md              # Glossaire technique
├── CLEANUP-CHECKLIST.md        # Guide de nettoyage ✅
└── archives/                   # Anciennes documentations ✅
    ├── README.md               # Index des archives ✅
    ├── sessions/               # Rapports de sessions
    ├── migrations/             # Anciennes migrations
    ├── deployment/             # Anciens guides déploiement
    ├── features/               # Implémentations de features
    ├── tests/                  # Rapports de tests
    ├── guides/                 # Guides divers
    ├── analysis/               # Analyses et conformité
    └── progress/               # Suivi de progression
```

## 🔍 Documentation par Rôle

### Développeur
1. [Getting Started](./01-GETTING-STARTED.md)
2. [Development](./03-DEVELOPMENT.md)
3. [Database](./04-DATABASE.md)
4. [API](./05-API.md)

### DevOps / SysAdmin
1. [Architecture](./02-ARCHITECTURE.md)
2. [Deployment](./06-DEPLOYMENT.md)
3. [Migrations](./07-MIGRATIONS.md)
4. [Troubleshooting](./09-TROUBLESHOOTING.md)

### Product Owner / Chef de Projet
1. [Getting Started](./01-GETTING-STARTED.md)
2. [Architecture](./02-ARCHITECTURE.md)
3. [Changelog](./10-CHANGELOG.md)

## 📝 Conventions

- **Dates** : Format ISO (YYYY-MM-DD)
- **Versions** : Semantic Versioning (MAJOR.MINOR.PATCH)
- **Commits** : [Conventional Commits](https://www.conventionalcommits.org/)

## 🔄 Mise à Jour de la Documentation

Lors de chaque modification significative :
1. Mettre à jour le fichier concerné
2. Ajouter une entrée dans [CHANGELOG.md](./10-CHANGELOG.md)
3. Mettre à jour la date de dernière modification

---

**Dernière mise à jour** : 2025-10-29
**Version** : 1.0.0
