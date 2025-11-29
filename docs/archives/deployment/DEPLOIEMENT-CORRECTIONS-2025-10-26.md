# 🔧 Corrections et redéploiement - 26 octobre 2025

## 🐛 Problèmes identifiés

### 1. Rate Limiting trop strict (Erreur 429)
**Symptôme :**
```
Failed to load resource: the server responded with a status of 429 ()
```

**Cause :** Limites de rate limiting trop restrictives en production (100 req/min)

**Solution :** Augmentation des limites dans [apps/api/src/middlewares/rate-limit.ts](apps/api/src/middlewares/rate-limit.ts:66-68)
- Requêtes générales : **100 → 500** par minute
- Authentification : **5 → 20** tentatives par 5 minutes
- Réponses de jeu : **1 → 3** par seconde

### 2. Un seul thème disponible
**Symptôme :**
```
✅ Thèmes chargés depuis le service local: 1
```

**Cause :** Le fichier [apps/web/src/app/shared/themes/themes.ts](apps/web/src/app/shared/themes/themes.ts) ne contenait qu'un seul thème au lieu de 17

**Solution :** Copie complète des thèmes depuis l'API vers le frontend

---

## ✅ Corrections appliquées

### Fichiers modifiés

1. **[apps/api/src/middlewares/rate-limit.ts](apps/api/src/middlewares/rate-limit.ts)**
   ```typescript
   // Avant
   const generalLimiter = new RateLimiter(60000, isDevelopment ? 1000 : 100);
   const answerLimiter = new RateLimiter(1000, isDevelopment ? 10 : 1);
   const authLimiter = new RateLimiter(300000, isDevelopment ? 1000 : 5);

   // Après
   const generalLimiter = new RateLimiter(60000, isDevelopment ? 1000 : 500);
   const answerLimiter = new RateLimiter(1000, isDevelopment ? 10 : 3);
   const authLimiter = new RateLimiter(300000, isDevelopment ? 1000 : 20);
   ```

2. **[apps/web/src/app/shared/themes/themes.ts](apps/web/src/app/shared/themes/themes.ts)**
   - Copie complète des 17 thèmes depuis l'API
   - Catégories : wedding (3), corporate (3), birthday (2), seasonal (4), party (5)

### Nouveaux fichiers

3. **[deploy-windows.ps1](deploy-windows.ps1)**
   - Script de déploiement automatique pour Windows PowerShell
   - 5 étapes : transfert, chargement, redémarrage, tests, logs

---

## 🚀 Procédure de déploiement

### Méthode automatique (recommandée)

```powershell
cd "d:\Projet\Blind test musical"
.\deploy-windows.ps1
```

Le script effectuera automatiquement :
1. Transfert des images .tar vers le serveur
2. Chargement dans Docker
3. Redémarrage des services
4. Tests de validation
5. Affichage des logs

---

### Méthode manuelle

#### Étape 1 : Transférer les images

```bash
scp blindtest-api.tar alex@srv506488:~/
scp blindtest-web.tar alex@srv506488:~/
```

#### Étape 2 : Sur le serveur

```bash
ssh alex@srv506488

# Charger les images
docker load < ~/blindtest-api.tar
docker load < ~/blindtest-web.tar

# Redémarrer les services
cd ~/docker-services
docker compose stop blindtest-api blindtest-web
docker compose rm -f blindtest-api blindtest-web
docker compose up -d blindtest-api blindtest-web

# Vérifier
docker ps | grep blindtest
docker logs blindtest-api --tail 20
```

---

## 🧪 Tests à effectuer

### 1. Test du rate limiting

Essayez de créer un compte plusieurs fois :
```
https://blindtest.codeharmony.fr/auth/register
```

**Résultat attendu :** Pas d'erreur 429, création de compte réussie

### 2. Test des thèmes

Accédez à l'interface admin et créez un événement :
```
https://blindtest.codeharmony.fr/admin/events/new
```

**Résultat attendu :** 17 thèmes disponibles dans le sélecteur

Thèmes attendus :
- **Mariage** : Automne, Printemps, Coucher de Soleil
- **Corporate** : Moderne, Prestige, Dégradé
- **Anniversaire** : Festif, Élégant
- **Saisonnier** : Été Tropical, Hiver Cosy, Nature Zen, Océan
- **Party** : Néon, Rétro, Cyberpunk, Nébuleuse

### 3. Test de création d'événement

1. Créer un événement avec un thème au choix
2. Vérifier qu'il apparaît dans la liste
3. Vérifier que les couleurs du thème sont appliquées

---

## 📊 Comparaison avant/après

| Métrique | Avant | Après |
|----------|-------|-------|
| **Rate limit général** | 100 req/min | 500 req/min |
| **Rate limit auth** | 5 tentatives/5min | 20 tentatives/5min |
| **Rate limit réponses** | 1/sec | 3/sec |
| **Nombre de thèmes** | 1 | 17 |

---

## 🎯 Résultat attendu

Après ce déploiement, vous devriez pouvoir :

✅ Créer un compte sans erreur 429
✅ Se connecter sans problème
✅ Créer des événements avec le choix de 17 thèmes
✅ Voir les statistiques du dashboard sans erreur 429

---

## 📝 Checklist post-déploiement

- [ ] Images transférées sur le serveur
- [ ] Images chargées dans Docker
- [ ] Services redémarrés (status healthy)
- [ ] API répond sur `/api/health`
- [ ] Frontend accessible sur `/`
- [ ] Création de compte fonctionne
- [ ] 17 thèmes disponibles
- [ ] Création d'événement fonctionne
- [ ] Dashboard accessible sans erreur 429

---

## 🔙 Rollback

Si les problèmes persistent :

```bash
# Sur le serveur
ssh alex@srv506488
cd ~/docker-services

# Revenir aux anciennes images (si sauvegardées)
docker load < ~/backups/blindtest-api-backup.tar
docker load < ~/backups/blindtest-web-backup.tar

docker compose restart blindtest-api blindtest-web
```

---

## 📞 Support

En cas de problème pendant le déploiement :

1. Vérifier les logs :
   ```bash
   docker logs blindtest-api --tail 50
   docker logs blindtest-web --tail 20
   ```

2. Vérifier le status :
   ```bash
   docker ps | grep blindtest
   ```

3. Tester l'API :
   ```bash
   curl https://blindtest.codeharmony.fr/api/health
   ```

---

**Date :** 26 octobre 2025
**Version :** 1.0.1
**Fichiers modifiés :** 2 (rate-limit.ts, themes.ts)
**Fichiers créés :** 1 (deploy-windows.ps1)
