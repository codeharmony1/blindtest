# 🎯 Guide de finalisation du déploiement

## 📋 État actuel

✅ **Déjà effectué :**
- Images Docker buildées et transférées sur le serveur
- Conteneurs démarrés et en status `healthy`
- Base de données initialisée avec 16 tables créées
- HTTPS fonctionnel via Traefik
- API répond sur `/api/health`
- Frontend accessible

---

## 🔐 Étape 1 : Créer le super admin

### Sur le serveur

```bash
# Se connecter au serveur
ssh alex@srv506488

# Créer le super admin de test
docker exec blindtest-api node dist/scripts/create-super-admin-test.js
```

**Résultat attendu :**

```
==============================================
  Création d'un Super-Admin de TEST
==============================================

✅ Connexion à la base de données établie

📝 Données du super-admin de test:
   Email: admin@blindtest.local
   Password: SuperAdmin123!
   Name: Super Admin Test

⏳ Création du super-admin...

✅ Super-admin de test créé avec succès !
==============================================
ID: 1
Email: admin@blindtest.local
Nom: Super Admin Test
Actif: Oui
Créé le: 2025-10-26...
==============================================

🔐 Connexion:
   URL: http://localhost:3000/api/backstage/auth/login
   Email: admin@blindtest.local
   Password: SuperAdmin123!
```

### Si le super admin existe déjà

Si vous voyez le message `EMAIL_ALREADY_EXISTS`, c'est normal ! Vous pouvez simplement vous connecter avec les identifiants existants.

---

## 🧪 Étape 2 : Tests de validation

### Test 1 : Connexion API super admin

```bash
# Test de login
curl -X POST https://blindtest.codeharmony.fr/api/backstage/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@blindtest.local",
    "password": "SuperAdmin123!"
  }'
```

**Résultat attendu :**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc...",
    "user": {
      "id": 1,
      "email": "admin@blindtest.local",
      "name": "Super Admin Test",
      "is_active": true
    }
  }
}
```

### Test 2 : Accès au frontend

```bash
# Vérifier que la page se charge
curl -I https://blindtest.codeharmony.fr/
```

**Résultat attendu :**
```
HTTP/2 200
content-type: text/html
```

### Test 3 : Vérifier les tables de la base de données

```bash
# Lister toutes les tables
docker exec -it mariadb mariadb -u blindtest_prod -p blindtest_production -e "SHOW TABLES;"
```

**Résultat attendu : 16 tables**
```
+----------------------------------+
| Tables_in_blindtest_production   |
+----------------------------------+
| answers                          |
| audit_logs                       |
| event_staff                      |
| events                           |
| organizers                       |
| password_reset_tokens            |
| payments                         |
| players                          |
| round_songs                      |
| rounds                           |
| scores                           |
| super_admins                     |
| team                             |
| tenant_sessions                  |
| tenant_users                     |
| tenants                          |
+----------------------------------+
```

### Test 4 : Vérifier le super admin dans la base

```bash
docker exec -it mariadb mariadb -u blindtest_prod -p blindtest_production -e "SELECT id, email, name, is_active FROM super_admins;"
```

**Résultat attendu :**
```
+----+-----------------------+------------------+-----------+
| id | email                 | name             | is_active |
+----+-----------------------+------------------+-----------+
|  1 | admin@blindtest.local | Super Admin Test |         1 |
+----+-----------------------+------------------+-----------+
```

---

## 🌐 Étape 3 : Accès à l'interface web

### Accéder à l'application

1. **Ouvrir dans un navigateur :**
   ```
   https://blindtest.codeharmony.fr
   ```

2. **Se connecter avec les identifiants super admin :**
   - Email : `admin@blindtest.local`
   - Password : `SuperAdmin123!`

### Pages à vérifier

- ✅ Page d'accueil : `https://blindtest.codeharmony.fr/`
- ✅ Interface admin : `https://blindtest.codeharmony.fr/admin`
- ✅ API health : `https://blindtest.codeharmony.fr/api/health`

---

## ⚠️ Sécurité post-déploiement

### 1. Changer le mot de passe par défaut

**Important :** Le mot de passe `SuperAdmin123!` est un mot de passe de test. Vous devriez le changer immédiatement après le premier login.

```bash
# TODO: Implémenter la fonctionnalité de changement de mot de passe dans l'interface admin
```

### 2. Créer un vrai super admin en production

Si vous voulez créer un super admin avec vos propres identifiants :

```bash
# Sur le serveur
docker exec -it blindtest-api node dist/scripts/create-super-admin.js
```

Le script vous demandera interactivement :
- Email
- Mot de passe (sera masqué)
- Nom

### 3. Désactiver le super admin de test

Une fois votre super admin créé, vous pouvez désactiver celui de test :

```bash
docker exec -it mariadb mariadb -u blindtest_prod -p blindtest_production
```

```sql
UPDATE super_admins
SET is_active = 0
WHERE email = 'admin@blindtest.local';
```

---

## 📊 Monitoring

### Vérifier les logs en continu

```bash
# Logs API
ssh alex@srv506488 'docker logs -f blindtest-api'

# Logs Web
ssh alex@srv506488 'docker logs -f blindtest-web'

# Logs Traefik (pour debug SSL/routing)
ssh alex@srv506488 'docker logs traefik | grep blindtest'
```

### Vérifier les métriques

```bash
# Utilisation CPU/RAM des conteneurs
ssh alex@srv506488 'docker stats blindtest-api blindtest-web --no-stream'

# Espace disque
ssh alex@srv506488 'df -h'

# Nombre de connexions actives
ssh alex@srv506488 'docker exec mariadb mariadb -u root -p -e "SHOW PROCESSLIST;"'
```

---

## 🎉 Validation finale

### Checklist complète

- [ ] Base de données créée avec 16 tables
- [ ] Super admin créé et vérifié dans la base
- [ ] Login API super admin fonctionne
- [ ] Frontend accessible via HTTPS
- [ ] Certificat SSL valide (pas d'erreur dans le navigateur)
- [ ] Conteneurs en status `healthy`
- [ ] Pas d'erreurs dans les logs
- [ ] Interface admin accessible après login
- [ ] Mot de passe de test changé (si en production)

---

## 🚀 Prochaines étapes

### 1. Tests fonctionnels complets

- Créer un événement de test
- Ajouter des équipes
- Ajouter des rounds et des chansons
- Tester l'interface DJ
- Tester l'interface joueur
- Tester l'affichage public

### 2. Configuration avancée

- Configurer Stripe pour les paiements (si nécessaire)
- Configurer l'email SMTP pour les notifications
- Configurer Redis pour les sessions
- Mettre en place des sauvegardes automatiques de la base

### 3. Optimisation

- Activer la compression gzip dans nginx
- Configurer le cache des assets statiques
- Optimiser les requêtes SQL
- Mettre en place un système de monitoring (Prometheus + Grafana)

---

## 🔙 Rollback en cas de problème

Si quelque chose ne fonctionne pas :

```bash
# 1. Arrêter les services
ssh alex@srv506488
cd ~/docker-services
docker compose stop blindtest-api blindtest-web

# 2. Vérifier les logs pour identifier le problème
docker logs blindtest-api --tail 100
docker logs blindtest-web --tail 100

# 3. Recharger une ancienne image si nécessaire
docker load < ~/backups/blindtest-api-backup.tar
docker compose restart blindtest-api
```

---

## 📞 Support et documentation

- **Guide d'initialisation DB :** [GUIDE-INITIALISATION-DB.md](./GUIDE-INITIALISATION-DB.md)
- **Workflow de déploiement :** [WORKFLOW-DEPLOIEMENT.md](./WORKFLOW-DEPLOIEMENT.md)
- **Modifications de configuration :** [DEPLOIEMENT-MODIFICATIONS.md](./DEPLOIEMENT-MODIFICATIONS.md)
- **Guide de déploiement rapide :** [GUIDE-DEPLOIEMENT-RAPIDE.md](./GUIDE-DEPLOIEMENT-RAPIDE.md)

---

## 🎯 Résumé des commandes essentielles

```bash
# Sur le serveur - Créer le super admin
docker exec blindtest-api node dist/scripts/create-super-admin-test.js

# Test login API
curl -X POST https://blindtest.codeharmony.fr/api/backstage/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@blindtest.local","password":"SuperAdmin123!"}'

# Vérifier les conteneurs
docker ps | grep blindtest

# Vérifier les tables
docker exec mariadb mariadb -u blindtest_prod -p blindtest_production -e "SHOW TABLES;"

# Accéder à l'application
# https://blindtest.codeharmony.fr
```

---

**Déploiement terminé ! 🎉**

Votre application Blind Test Musical est maintenant en production et prête à être utilisée.
