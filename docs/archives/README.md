# 📦 Archives de Documentation

Ce dossier contient l'historique des documents de développement qui ont été archivés après consolidation dans la documentation principale.

## 📂 Structure

### `sessions/`
Rapports de sessions de développement passées. Chaque fichier documente une session de travail spécifique avec ses objectifs, réalisations et problèmes rencontrés.

**Utilité** : Traçabilité historique, comprendre l'évolution du projet.

### `migrations/`
Documents de migration de base de données créés lors d'évolutions spécifiques du schéma. Maintenant consolidés dans [docs/07-MIGRATIONS.md](../07-MIGRATIONS.md).

**Utilité** : Référence pour les migrations passées, rollback si nécessaire.

### `deployment/`
Anciens guides de déploiement créés à différentes étapes du projet. Maintenant consolidés dans [docs/06-DEPLOYMENT.md](../06-DEPLOYMENT.md).

**Utilité** : Comprendre les évolutions de la procédure de déploiement.

### `features/`
Documentation détaillée de l'implémentation de features spécifiques (authentification, Stripe, game mode, etc.).

**Utilité** : Référence technique, comprendre les choix d'implémentation.

### `tests/`
Rapports de tests manuels et automatisés effectués à différentes phases du projet.

**Utilité** : Preuves de fonctionnement, référence pour les tests futurs.

### `guides/`
Guides et tutoriels créés pour des fonctionnalités spécifiques (Stripe, base de données, abonnements, etc.).

**Utilité** : Tutoriels pas-à-pas, onboarding de nouveaux développeurs.

### `analysis/`
Analyses de conformité, rapports d'audit, et documentation d'architecture.

**Utilité** : Conformité cahier des charges, décisions d'architecture.

### `progress/`
Fichiers de suivi de progression, roadmaps, et états d'avancement du projet.

**Utilité** : Comprendre l'historique du projet, priorisation passée.

---

## 🔍 Comment Utiliser Ces Archives

### Rechercher un Document Spécifique

```bash
# Chercher un mot-clé dans tous les fichiers archivés
grep -r "stripe" docs/archives/

# Lister tous les fichiers d'un type spécifique
ls docs/archives/tests/
```

### Consulter l'Historique d'une Feature

1. Regarder dans `features/` pour la documentation d'implémentation
2. Regarder dans `tests/` pour les rapports de tests
3. Regarder dans `sessions/` pour le contexte de développement

### Comprendre une Migration Passée

1. Consulter `migrations/` pour les détails de la migration
2. Consulter `sessions/` pour comprendre pourquoi elle a été nécessaire
3. Se référer à [docs/07-MIGRATIONS.md](../07-MIGRATIONS.md) pour la procédure actuelle

---

## 📋 Documentation Principale

Pour la documentation à jour et active, consulter :

- **Index** : [docs/README.md](../README.md)
- **Déploiement** : [docs/06-DEPLOYMENT.md](../06-DEPLOYMENT.md)
- **Migrations** : [docs/07-MIGRATIONS.md](../07-MIGRATIONS.md)
- **Dépannage** : [docs/09-TROUBLESHOOTING.md](../09-TROUBLESHOOTING.md)

---

## 🗑️ Politique de Rétention

- **Conserver** : Tous les documents archivés sont conservés pour référence historique
- **Ne pas modifier** : Les archives ne doivent pas être modifiées (lecture seule)
- **Commiter** : Les archives sont commitées dans Git pour traçabilité complète

---

## 📅 Archivage

**Date d'archivage** : 29 octobre 2025
**Raison** : Consolidation de 60+ fichiers markdown éparpillés en structure professionnelle
**Archivé par** : Claude Code (Alexandre Désiré)

---

**Dernière mise à jour** : 2025-10-29
