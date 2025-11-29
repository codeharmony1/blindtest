# 🧪 Configuration Stripe Mode TEST

**Pour tester l'application sans vrais paiements**

---

## 📋 Récupérer Vos Clés TEST Stripe (2 min)

### Étape 1 : Aller sur Stripe Dashboard

1. Ouvrir https://dashboard.stripe.com
2. **S'assurer que "Mode Test" est ACTIVÉ** (switch en haut à droite)
   - Si pas activé, cliquer sur le switch pour passer en mode Test

### Étape 2 : Récupérer les Clés API

1. Dans le menu, aller sur **Developers** → **API keys**
2. Copier les 2 clés :

```
Publishable key (commence par pk_test_...)
→ Copier dans STRIPE_PUBLISHABLE_KEY

Secret key (commence par sk_test_...)  ⚠️ Ne jamais partager !
→ Copier dans STRIPE_SECRET_KEY
```

### Étape 3 : Remplir .env.production

```bash
# Ouvrir le fichier
nano .env.production

# Remplacer ces lignes :
STRIPE_SECRET_KEY=sk_test_VOTRE_CLE_ICI
STRIPE_PUBLISHABLE_KEY=pk_test_VOTRE_CLE_ICI
```

### Étape 4 : Webhooks (Optionnel pour le début)

**⚠️ À configurer APRÈS avoir déployé l'application**

1. **Developers** → **Webhooks**
2. **Add endpoint**
3. URL : `https://votre-domaine.com/api/payments/webhook`
4. Events : `checkout.session.completed`, `customer.subscription.*`
5. Copier **Signing secret** (whsec_...)
6. Mettre dans `STRIPE_WEBHOOK_SECRET`

---

## ✅ Avantages Mode TEST

### Pas de Prix Préconfigurés Nécessaires

En mode TEST, vous pouvez **laisser vides** les `STRIPE_PRICE_*` :

```bash
STRIPE_PRICE_PER_EVENT=
STRIPE_PRICE_MONTHLY=
STRIPE_PRICE_2DAYS=
STRIPE_PRICE_1WEEK=
STRIPE_PRICE_1MONTH=
```

**L'API créera automatiquement les prix** la première fois (fallback dynamique).

### Cartes de Test

Pour tester les paiements, utiliser ces cartes :

| Carte | Résultat |
|-------|----------|
| `4242 4242 4242 4242` | ✅ Paiement réussi |
| `4000 0000 0000 0002` | ❌ Carte refusée |
| `4000 0000 0000 9995` | ❌ Fonds insuffisants |
| `4000 0025 0000 3155` | ⚠️ Nécessite authentification 3D Secure |

**Autres infos pour tester :**
- Date expiration : N'importe quelle date future (ex: 12/25)
- CVC : N'importe quel 3 chiffres (ex: 123)
- Code postal : N'importe quel (ex: 75001)

### Aucun Vrai Paiement

- ✅ **Aucune carte ne sera réellement débitée**
- ✅ Testez autant que vous voulez
- ✅ Dashboard Stripe TEST séparé du LIVE

---

## 🎯 Configuration Minimale pour Tester

Dans `.env.production`, vous avez seulement besoin de :

```bash
# STRIPE MODE TEST - Configuration minimale
STRIPE_SECRET_KEY=sk_test_51abc123def...
STRIPE_PUBLISHABLE_KEY=pk_test_51abc123def...
STRIPE_WEBHOOK_SECRET=  # Optionnel au début

# Prix (laisser vides en mode TEST)
STRIPE_PRICE_PER_EVENT=
STRIPE_PRICE_MONTHLY=
STRIPE_PRICE_2DAYS=
STRIPE_PRICE_1WEEK=
STRIPE_PRICE_1MONTH=
```

---

## 🔄 Basculer en LIVE Plus Tard

### Quand Passer en Mode LIVE ?

**Passer en LIVE quand :**
- ✅ Tous les tests sont validés
- ✅ Webhooks fonctionnent en TEST
- ✅ Flow complet testé plusieurs fois
- ✅ Business verification Stripe complétée

### Comment Basculer ?

1. **Créer produits/prix dans Dashboard LIVE**
   - Dashboard Stripe → **Désactiver "Mode Test"**
   - Products → Create product (x5)
   - Copier les 5 Price IDs

2. **Récupérer clés LIVE**
   - Developers → API keys (en mode LIVE)
   - Copier `sk_live_...` et `pk_live_...`

3. **Mettre à jour .env.production**
   ```bash
   STRIPE_SECRET_KEY=sk_live_...  # Nouvelle clé LIVE
   STRIPE_PUBLISHABLE_KEY=pk_live_...

   STRIPE_PRICE_PER_EVENT=price_... # Price IDs LIVE
   STRIPE_PRICE_MONTHLY=price_...
   # etc.
   ```

4. **Reconfigurer webhooks LIVE**
   - Même URL mais endpoint séparé en mode LIVE
   - Copier nouveau signing secret

5. **Redémarrer API**
   ```bash
   docker-compose restart api
   ```

---

## 📊 Vérifier Mode Actuel

### Dans Stripe Dashboard

**En haut à droite :**
- 🧪 **"Mode Test"** activé = Mode TEST
- 💳 **"Mode Test"** désactivé = Mode LIVE

**Vérifier vos clés :**
- `sk_test_...` / `pk_test_...` = TEST ✅
- `sk_live_...` / `pk_live_...` = LIVE ⚠️

### Dans l'Application

**Test simple :**
1. Aller sur `/pricing`
2. Cliquer "Choisir ce plan"
3. Utiliser carte `4242 4242 4242 4242`
4. Si succès **SANS** débiter vraie carte = Mode TEST ✅

---

## 🆘 Problèmes Courants

### Erreur "Invalid API Key"

**Cause :** Clé TEST dans `.env` mais Dashboard en mode LIVE (ou inverse)

**Solution :**
- Vérifier que Dashboard est en mode TEST
- Copier clés depuis la bonne section (TEST)
- Redémarrer l'API après changement

### Produits se Créent en Double

**Cause :** Prix laissés vides → Création dynamique à chaque fois

**Solution en TEST :**
- C'est normal, pas grave en TEST
- Dashboard TEST peut devenir encombré mais c'est OK

**Solution en PRODUCTION :**
- Créer les prix une fois dans Dashboard LIVE
- Remplir `STRIPE_PRICE_*` dans `.env`
- Plus de création dynamique

### Webhooks Non Reçus

**Cause :** Signing secret incorrect ou URL inaccessible

**Solution :**
1. Vérifier URL webhook publiquement accessible
2. Copier **nouveau** signing secret (mode TEST)
3. Mettre à jour `.env.production`
4. Redémarrer API

---

## 📚 Documentation Stripe

**Guides officiels :**
- Mode Test : https://stripe.com/docs/testing
- Cartes test : https://stripe.com/docs/testing#cards
- Webhooks : https://stripe.com/docs/webhooks

---

## ✅ Checklist Configuration TEST

- [ ] Dashboard Stripe en **Mode Test**
- [ ] `STRIPE_SECRET_KEY=sk_test_...` copié
- [ ] `STRIPE_PUBLISHABLE_KEY=pk_test_...` copié
- [ ] Prix laissés vides (création automatique)
- [ ] `.env.production` sauvegardé
- [ ] API redémarrée
- [ ] Test paiement avec carte `4242 4242 4242 4242`
- [ ] Paiement visible dans Dashboard TEST Stripe
- [ ] Webhooks (optionnel - configurer plus tard)

---

**Mode TEST configuré ! Vous pouvez tester sans risque.** 🧪

**Basculer en LIVE quand prêt pour production.** 🚀
