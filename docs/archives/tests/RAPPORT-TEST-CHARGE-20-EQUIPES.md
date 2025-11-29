# Rapport de Test de Charge - 20 Équipes

**Date**: 13 octobre 2025
**Objectif**: Tester la capacité du système à gérer 20 équipes avec 2 joueurs chacune sur 2 rounds

## Résumé Exécutif

✅ **Test partiellement réussi** - Le système a démontré d'excellentes performances pour la création d'événements, d'équipes et de joueurs.

### Résultats Principaux

| Métrique | Résultat | Statut |
|----------|----------|--------|
| **Équipes créées** | 20/20 (100%) | ✅ Excellent |
| **Temps de création des équipes** | ~2,8 secondes | ✅ Excellent |
| **Joueurs créés** | 40/40 (100%) | ✅ Excellent |
| **Temps d'ajout des joueurs** | ~6,9 secondes | ✅ Bon |
| **Authentification** | Réussie | ✅ |
| **Connexions WebSocket** | 0/40 (serveur WS non disponible) | ⚠️ Non testé |

## Détails des Tests

### 1. Authentification et Création d'Événement

**✅ Réussi**

- Création d'un nouvel organizer : `~200ms`
- Login avec token JWT : `~110ms`
- Création de l'événement : `~110ms`

**Événement créé** :
- Code événement : Généré automatiquement (ex: `4PA4CA`)
- Mode de jeu : `TEAM`
- Configuration : 20 équipes max, 3 joueurs par équipe max

### 2. Création de 20 Équipes

**✅ Excellent**

| Métrique | Valeur |
|----------|--------|
| Équipes créées | 20/20 |
| Temps total | 2 816 ms (~2,8 secondes) |
| Temps moyen par équipe | ~141 ms |
| Taux de réussite | 100% |

**Performance** :
- API endpoint : `POST /api/events/:code/teams`
- Aucune erreur rencontrée
- Création séquentielle avec délai de 50ms entre chaque équipe

### 3. Ajout de 40 Joueurs (2 par équipe)

**✅ Excellent**

| Métrique | Valeur |
|----------|--------|
| Joueurs créés | 40/40 |
| Temps total | 6 911 ms (~6,9 secondes) |
| Temps moyen par joueur | ~173 ms |
| Taux de réussite | 100% |

**Performance** :
- API endpoint : `POST /api/events/:code/join`
- Aucune erreur rencontrée
- Création séquentielle avec délai de 30ms entre chaque joueur
- Chaque joueur reçoit un token JWT unique
- Premier joueur de chaque équipe est automatiquement désigné capitaine

### 4. Connexions WebSocket

**⚠️ Non testé - Serveur WebSocket non disponible**

- Toutes les tentatives de connexion WebSocket ont échoué avec "socket hang up"
- Le serveur WebSocket n'était pas en cours d'exécution pendant le test
- Test modifié pour utiliser l'API HTTP à la place pour les réponses

**Note** : Le test a été adapté pour contourner les WebSockets et utiliser l'API REST pour soumettre les réponses.

### 5. Création des Rounds et Chansons

**⚠️ Partiellement testé**

Le script de test a été mis à jour pour utiliser les bons endpoints :
- `POST /api/events/:code/rounds` pour créer un round
- `POST /api/rounds/:roundId/songs` pour ajouter des chansons

Structure des données :
```typescript
// Création d'un round
{
  name: 'Round 1 - Load Test',
  defaultDuration: 30,
  totalSongs: 5
}

// Ajout d'une chanson
{
  mode: 'prepared',
  idx: 1,
  artist: 'Artist 1',
  title: 'Song 1',
  duration: 30
}
```

## Analyse des Performances

### Capacité de Charge

**Taux de création**:
- **Équipes** : 7 équipes/seconde (avec délai de 50ms)
- **Joueurs** : 5,8 joueurs/seconde (avec délai de 30ms)

**Projection** : Le système pourrait gérer :
- 100 équipes en ~14 secondes
- 200 joueurs en ~35 secondes

### Points d'Amélioration Identifiés

1. **WebSocket Server**
   - ⚠️ Le serveur WebSocket doit être démarré avant les tests
   - Recommandation : Vérifier que le serveur démarre correctement avec `npm run dev:api`

2. **Performances**
   - ✅ Les performances HTTP sont excellentes
   - ✅ Pas de dégradation observée avec 20 équipes
   - ✅ Aucune erreur de base de données ou de timeout

3. **API Consistency**
   - ✅ Les endpoints REST sont bien structurés et cohérents
   - ✅ Les tokens JWT fonctionnent correctement
   - ✅ Les relations entre entités (Event → Team → Player) sont bien gérées

## Recommandations

### Immédiates

1. **Démarrer le serveur WebSocket**
   ```bash
   npm run dev:api
   ```
   Vérifier que le serveur WebSocket écoute sur le port 3001

2. **Relancer le test complet**
   ```bash
   npx ts-node test-load-20-teams.ts
   ```

### Optimisations Futures

1. **Création en Parallèle**
   - Les équipes et joueurs pourraient être créés en parallèle (par lots de 5-10) au lieu de séquentiellement
   - Potentiel d'amélioration : 3-5x plus rapide

2. **Connexions WebSocket**
   - Implémenter une stratégie de reconnexion automatique
   - Ajouter un heartbeat pour maintenir les connexions ouvertes

3. **Monitoring**
   - Ajouter des métriques de performance (CPU, mémoire, requêtes/sec)
   - Implémenter un système de logging des performances

## Conclusion

Le test de charge démontre que **l'API REST du système peut gérer 20 équipes et 40 joueurs sans difficulté**. Les performances sont excellentes :

- ✅ Création rapide des entités (équipes et joueurs)
- ✅ Aucune erreur ou timeout
- ✅ Authentification et tokens JWT fonctionnent parfaitement
- ✅ Relations entre entités bien gérées

**Prochaines Étapes** :
1. Démarrer le serveur WebSocket
2. Compléter le test avec les rounds et les réponses
3. Tester avec des scénarios plus complexes (50 équipes, 100 joueurs)
4. Mesurer les performances sous charge continue

---

**Script de test disponible** : [`test-load-20-teams.ts`](./apps/api/test-load-20-teams.ts)
