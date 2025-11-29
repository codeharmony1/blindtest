# 🚀 Déployer Maintenant - Guide Express

**⏱️ Temps total : 2h30**

---

## Étape 1 : Stripe (30 min)

### Actions
1. https://dashboard.stripe.com → **Désactiver "Mode Test"**
2. **Products** → Create product (x5)

### Produits à créer

```
Produit 1 : "Paiement par Événement"
Prix : 19.00 EUR (one-time)
→ Copier Price ID : price_xxxxx

Produit 2 : "Plan Mensuel"
Prix : 49.00 EUR (recurring monthly)
→ Copier Price ID : price_xxxxx

Produit 3 : "Session 2 jours"
Prix : 5.00 EUR (one-time)
→ Copier Price ID : price_xxxxx

Produit 4 : "Session 1 semaine"
Prix : 10.00 EUR (one-time)
→ Copier Price ID : price_xxxxx

Produit 5 : "Session 1 mois"
Prix : 15.00 EUR (one-time)
→ Copier Price ID : price_xxxxx
```

### Clés API
**Developers** → **API Keys** :
- Copier **Secret key** (sk_live_...)
- Copier **Publishable key** (pk_live_...)

---

## Étape 2 : Email SMTP (15 min)

### Hostinger (Recommandé)
```
Host: smtp.hostinger.com
Port: 465
Secure: true
User: support@votre-domaine.com
Pass: [votre mot de passe]
```

### OU Gmail
```
Host: smtp.gmail.com
Port: 587
Secure: false
User: votre-email@gmail.com
Pass: [App Password de Google]
```

---

## Étape 3 : Compléter .env.production (15 min)

### Ouvrir le fichier
```bash
nano .env.production
```

### Remplacer (Ctrl+F)

```bash
# Database
DB_PASS=CHANGEZ_MOI → DB_PASS=VotreMotDePasseSecurise123!

# Stripe
STRIPE_SECRET_KEY=sk_live_CHANGEZ_MOI → sk_live_[votre clé]
STRIPE_PUBLISHABLE_KEY=pk_live_CHANGEZ_MOI → pk_live_[votre clé]

STRIPE_PRICE_PER_EVENT=price_CHANGEZ_MOI → price_[copié étape 1]
STRIPE_PRICE_MONTHLY=price_CHANGEZ_MOI → price_[copié étape 1]
STRIPE_PRICE_2DAYS=price_CHANGEZ_MOI → price_[copié étape 1]
STRIPE_PRICE_1WEEK=price_CHANGEZ_MOI → price_[copié étape 1]
STRIPE_PRICE_1MONTH=price_CHANGEZ_MOI → price_[copié étape 1]

# SMTP
SMTP_USER=CHANGEZ_MOI → support@votre-domaine.com
SMTP_PASS=CHANGEZ_MOI → [votre mot de passe SMTP]

# Domaines
CORS_ORIGIN=https://CHANGEZ_MOI → https://votre-domaine.com
FRONTEND_URL=https://CHANGEZ_MOI → https://votre-domaine.com
DOMAIN=votre-domaine.com
LETSENCRYPT_EMAIL=moi@blabla.fr
```

**Sauvegarder** : Ctrl+X → Y → Enter

---

## Étape 4 : VPS (1h)

### 4.1 Installer Docker (10 min)
```bash
ssh root@votre-ip-vps

# Docker
curl -fsSL https://get.docker.com | sh

# Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Vérifier
docker --version
docker-compose --version
```

### 4.2 Firewall (2 min)
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 4.3 Cloner Projet (3 min)
```bash
cd /var/www
git clone <votre-repo> blindtest
cd blindtest
```

### 4.4 Upload .env.production (5 min)

**Option A : Éditer directement**
```bash
nano .env.production
# Coller contenu préparé localement
# Sauvegarder
```

**Option B : SCP depuis local**
```bash
# Depuis votre PC
scp .env.production root@votre-ip-vps:/var/www/blindtest/
```

### 4.5 Vérifier Config (1 min)
```bash
chmod +x check-production-ready.sh
./check-production-ready.sh
```

**Attendu :** ✅ Tous les checks passent !

### 4.6 Déployer (10 min)
```bash
chmod +x deploy.sh
./deploy.sh production
```

**Le script fait tout automatiquement :**
- Build images Docker
- Démarre containers
- Migrations DB
- Health check

### 4.7 Super-Admin (1 min)
```bash
docker-compose -f docker-compose.prod.yml exec api npm run create:super-admin
```

**Noter credentials** (changer après premier login)

---

## Étape 5 : Webhooks Stripe (5 min)

### 5.1 Configurer
1. https://dashboard.stripe.com/webhooks
2. **Add endpoint**
3. URL : `https://api.votre-domaine.com/api/payments/webhook`
4. Events :
   - checkout.session.completed
   - customer.subscription.*
5. **Copier Signing Secret** (whsec_...)

### 5.2 Ajouter Secret
```bash
nano .env.production
# Trouver ligne STRIPE_WEBHOOK_SECRET
# Remplacer par whsec_[copié ci-dessus]
# Sauvegarder
```

### 5.3 Redémarrer API
```bash
docker-compose -f docker-compose.prod.yml restart api
```

---

## Étape 6 : Tester (30 min)

### Backend
```bash
curl https://api.votre-domaine.com/api/health
# → {"ok":true,...}

curl https://api.votre-domaine.com/api/payments/pricing
# → Retourne 3 plans
```

### Frontend
**Navigateur :**
- https://votre-domaine.com → Page d'accueil
- /pricing → Plans affichés
- /auth/login → Formulaire login

**Login Super-Admin :**
- Email : superadmin@blindtest.fr
- Password : SuperAdmin2025!
- ⚠️ Changer immédiatement après connexion

### Paiement Test (vraie carte ⚠️)
1. Créer compte → Register
2. Aller sur /pricing
3. Choisir "Paiement par Événement" (19€)
4. Carte sera **débitée réellement**
5. Vérifier :
   - ✅ Page success affiche détails
   - ✅ Stripe Dashboard : paiement visible
   - ✅ Webhook reçu (logs API)

---

## ✅ Checklist Rapide

- [ ] Stripe : 5 produits créés
- [ ] Stripe : Clés API copiées
- [ ] SMTP : Credentials notés
- [ ] .env.production : Complété
- [ ] VPS : Docker installé
- [ ] VPS : Projet cloné
- [ ] VPS : Config vérifiée
- [ ] VPS : Déployé
- [ ] VPS : Super-admin créé
- [ ] Stripe : Webhooks configurés
- [ ] Tests : Backend OK
- [ ] Tests : Frontend OK
- [ ] Tests : Paiement validé

---

## 🆘 Problèmes ?

### API ne répond pas
```bash
docker-compose -f docker-compose.prod.yml logs api
```

### SSL erreur
```bash
docker-compose -f docker-compose.prod.yml logs traefik
# Vérifier DNS propagé : nslookup votre-domaine.com
```

### DB erreur
```bash
docker-compose -f docker-compose.prod.yml logs mariadb
docker-compose -f docker-compose.prod.yml restart mariadb
```

---

## 📚 Docs Complètes

**Besoin de plus de détails ?**
→ [GUIDE-DEPLOIEMENT-VPS.md](GUIDE-DEPLOIEMENT-VPS.md)

**Checklist exhaustive ?**
→ [CHECKLIST-DEPLOIEMENT-FINAL.md](CHECKLIST-DEPLOIEMENT-FINAL.md)

**Résumé complet ?**
→ [PRET-POUR-PRODUCTION.md](PRET-POUR-PRODUCTION.md)

---

## 🎉 C'est Tout !

**Temps total : 2h30**
- Stripe : 30 min
- SMTP : 15 min
- .env : 15 min
- VPS : 60 min
- Webhooks : 5 min
- Tests : 30 min

**Application maintenant accessible sur https://votre-domaine.com** 🚀

---

**Bon déploiement !**
