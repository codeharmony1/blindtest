# 🧪 GUIDE DE TEST - INTÉGRATION STRIPE

**Date :** 2025-10-18
**Objectif :** Tester l'intégration complète Stripe (checkout, webhooks, succès/annulation)
**Durée estimée :** 30 minutes

---

## 📋 PRÉREQUIS

1. ✅ Compte Stripe créé sur [dashboard.stripe.com](https://dashboard.stripe.com)
2. ✅ MySQL démarré via XAMPP
3. ✅ API démarrée (`npm run dev:api`)
4. ✅ Web démarrée (`npm run start:web`)

---

## 🔑 ÉTAPE 1 : OBTENIR LES CLÉS DE TEST STRIPE

### 1.1 Connexion au Dashboard Stripe

1. Allez sur [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. Connectez-vous avec votre compte Stripe
3. **IMPORTANT :** Vérifiez que vous êtes en **mode Test** (toggle en haut à droite)

### 1.2 Récupérer les clés API

1. Dans le menu de gauche, cliquez sur **Developers** > **API keys**
2. Vous verrez deux clés :

   - **Publishable key** : Commence par `pk_test_...`
   - **Secret key** : Commence par `sk_test_...` (cliquez sur "Reveal test key")

3. Copiez ces deux clés

### 1.3 Récupérer le Webhook Secret (optionnel pour tests locaux)

1. Dans **Developers** > **Webhooks**
2. Cliquez sur **Add endpoint**
3. URL de l'endpoint : `http://localhost:3001/api/payments/webhooks/stripe`
4. Sélectionnez les événements :
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Après création, copiez le **Signing secret** (commence par `whsec_...`)

---

## ⚙️ ÉTAPE 2 : CONFIGURER LES CLÉS

### 2.1 Modifier le fichier .env

Ouvrez `apps/api/.env` et remplacez :

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_VotreCléSecrèteIci
STRIPE_PUBLISHABLE_KEY=pk_test_VotreCléPubliqueIci
STRIPE_WEBHOOK_SECRET=whsec_VotreWebhookSecretIci
```

### 2.2 Redémarrer l'API

```bash
# Arrêtez l'API (Ctrl+C dans le terminal)
# Puis redémarrez
cd "d:\Projet\Blind test musical"
npm run dev:api
```

Attendez le message : `🚀 API server is running on http://localhost:3001`

---

## 🧪 ÉTAPE 3 : TESTS DE L'INTÉGRATION

### Test 1 : Endpoint Pricing ✅

**Objectif :** Vérifier que l'API retourne les plans disponibles

```bash
curl http://localhost:3001/api/payments/pricing
```

**Résultat attendu :**
```json
{
  "subscriptions": [
    {
      "id": "DEMO",
      "name": "Démo Gratuite",
      "price": 0,
      "currency": "EUR",
      "features": ["5 chansons maximum", "1 événement", "Support de base"]
    },
    {
      "id": "PER_EVENT",
      "name": "Par Événement",
      "price": 19,
      "currency": "EUR",
      "features": ["Événement unique", "Chansons illimitées", "Support prioritaire"]
    },
    {
      "id": "MONTHLY",
      "name": "Mensuel",
      "price": 49,
      "currency": "EUR",
      "interval": "month",
      "features": ["Événements illimités", "Chansons illimitées", "Support premium"]
    }
  ],
  "sessions": [...]
}
```

---

### Test 2 : Connexion et Accès à /pricing 🌐

1. **Ouvrez votre navigateur :**
   ```
   http://localhost:4200/auth/login
   ```

2. **Connectez-vous** avec un compte existant ou créez-en un nouveau :
   - Email : `demo@blindtest.local`
   - Password : `demo123456`

3. **Naviguez vers la page Pricing :**
   ```
   http://localhost:4200/pricing
   ```

4. **Vérifiez l'affichage :**
   - ✅ Les 3 plans d'abonnement sont affichés
   - ✅ Les 3 types de sessions sont affichés
   - ✅ Les boutons "Choisir" sont cliquables

---

### Test 3 : Flow Checkout Stripe 💳

1. **Sur la page /pricing, cliquez sur "Choisir" pour le plan MENSUEL**

2. **Vérification :**
   - ✅ Une requête POST est envoyée à `/api/payments/checkout/subscription`
   - ✅ Vous êtes redirigé vers une page Stripe (URL commence par `https://checkout.stripe.com/`)

3. **Sur la page Stripe Checkout :**
   - Utilisez une **carte de test Stripe** :
     - Numéro : `4242 4242 4242 4242`
     - Date d'expiration : N'importe quelle date future (ex: `12/26`)
     - CVC : N'importe quel code 3 chiffres (ex: `123`)
     - Code postal : N'importe lequel (ex: `75001`)

4. **Remplissez le formulaire :**
   - Email : Votre email
   - Nom : N'importe quel nom
   - Cliquez sur "Payer"

5. **Après paiement :**
   - ✅ Vous devriez être redirigé vers `http://localhost:4200/pricing/success`
   - ✅ La page affiche le message de succès
   - ✅ Un lien vers le dashboard est disponible

---

### Test 4 : Vérification dans Stripe Dashboard 🎯

1. **Retournez sur [dashboard.stripe.com](https://dashboard.stripe.com)**

2. **Vérifiez dans "Payments" :**
   - ✅ Un nouveau paiement apparaît avec le montant 49€
   - ✅ Le statut est "Succeeded"

3. **Vérifiez dans "Customers" :**
   - ✅ Un nouveau client a été créé
   - ✅ L'email correspond à celui utilisé lors du checkout

4. **Vérifiez dans "Subscriptions" :**
   - ✅ Un abonnement "Active" est créé
   - ✅ Le plan correspond (MONTHLY - 49€/mois)

---

### Test 5 : Annulation de Checkout ❌

1. **Retournez sur http://localhost:4200/pricing**

2. **Cliquez sur "Choisir" pour un autre plan**

3. **Sur la page Stripe, cliquez sur le bouton "Retour"** (en haut à gauche)

4. **Vérification :**
   - ✅ Vous êtes redirigé vers `http://localhost:4200/pricing/cancel`
   - ✅ Le message "Paiement annulé" s'affiche
   - ✅ Un bouton "Retour aux tarifs" est disponible

---

### Test 6 : Session Temporaire 📅

1. **Sur la page /pricing, testez une session temporaire :**
   - Exemple : "Session 1 semaine - 9€"

2. **Processus identique au Test 3 :**
   - Redirection vers Stripe
   - Paiement avec carte test
   - Redirection vers /pricing/success

3. **Différence :**
   - ✅ C'est un paiement unique (pas d'abonnement récurrent)
   - ✅ Aucune souscription n'apparaît dans Stripe (seulement un paiement)

---

### Test 7 : Webhooks (Avancé) 🔔

**Note :** Pour tester les webhooks en local, vous devez utiliser **Stripe CLI**.

#### Installation Stripe CLI

1. **Téléchargez Stripe CLI :**
   - Windows : [https://github.com/stripe/stripe-cli/releases](https://github.com/stripe/stripe-cli/releases)
   - Téléchargez `stripe_X.X.X_windows_x86_64.zip`

2. **Extrayez et ajoutez au PATH**

3. **Authentifiez-vous :**
   ```bash
   stripe login
   ```

#### Démarrer le tunnel webhook

```bash
stripe listen --forward-to localhost:3001/api/payments/webhooks/stripe
```

Copiez le **webhook signing secret** affiché (commence par `whsec_...`) et mettez-le dans `.env` :

```env
STRIPE_WEBHOOK_SECRET=whsec_VotreNouveauSecret
```

Redémarrez l'API.

#### Tester un webhook

```bash
stripe trigger checkout.session.completed
```

**Vérification :**
- ✅ Le webhook est reçu par votre API
- ✅ Un log apparaît dans le terminal de l'API
- ✅ La base de données est mise à jour (table `payments`)

---

## 📊 RÉSULTATS ATTENDUS

### Endpoints API fonctionnels

```bash
# Pricing
GET    http://localhost:3001/api/payments/pricing

# Checkout subscription
POST   http://localhost:3001/api/payments/checkout/subscription
Body: { "plan": "MONTHLY", "successUrl": "...", "cancelUrl": "..." }

# Checkout session
POST   http://localhost:3001/api/payments/checkout/session
Body: { "sessionType": "1week", "sessionName": "Session Test", "successUrl": "...", "cancelUrl": "..." }

# Portal client
POST   http://localhost:3001/api/payments/portal
Body: { "returnUrl": "..." }

# Historique
GET    http://localhost:3001/api/payments/history

# Statut
GET    http://localhost:3001/api/payments/status

# Sessions actives
GET    http://localhost:3001/api/payments/sessions

# Annuler abonnement
POST   http://localhost:3001/api/payments/subscription/cancel

# Webhook
POST   http://localhost:3001/api/payments/webhooks/stripe
```

### Pages Frontend fonctionnelles

```
✅ http://localhost:4200/pricing          → Affichage des plans
✅ http://localhost:4200/pricing/success  → Page de succès après paiement
✅ http://localhost:4200/pricing/cancel   → Page d'annulation
```

---

## 🐛 DÉPANNAGE

### Problème : "Invalid API Key"

**Solution :**
- Vérifiez que vous avez copié la clé complète (commence par `sk_test_`)
- Vérifiez qu'il n'y a pas d'espaces avant/après la clé dans `.env`
- Redémarrez l'API après modification

### Problème : Redirection ne fonctionne pas

**Solution :**
- Vérifiez la console du navigateur (F12)
- Vérifiez que l'API retourne bien un `checkoutUrl`
- Vérifiez les logs de l'API dans le terminal

### Problème : Webhook non reçu

**Solution :**
- Vérifiez que Stripe CLI est démarré (`stripe listen`)
- Vérifiez que le `STRIPE_WEBHOOK_SECRET` est à jour dans `.env`
- Vérifiez les logs de l'API pour voir si la requête arrive

### Problème : Page success ne s'affiche pas

**Solution :**
- Vérifiez l'URL de redirection dans la requête POST
- Le paramètre `{CHECKOUT_SESSION_ID}` doit être présent
- Exemple : `http://localhost:4200/pricing/success?session_id={CHECKOUT_SESSION_ID}`

---

## 📝 CHECKLIST FINALE

Avant de passer à la suite, vérifiez :

- [ ] ✅ Clés Stripe configurées dans `.env`
- [ ] ✅ API redémarrée avec les nouvelles clés
- [ ] ✅ Endpoint `/api/payments/pricing` retourne les plans
- [ ] ✅ Connexion au frontend réussie
- [ ] ✅ Page `/pricing` affiche les plans
- [ ] ✅ Clic sur "Choisir" redirige vers Stripe
- [ ] ✅ Paiement test réussi avec carte `4242 4242 4242 4242`
- [ ] ✅ Redirection vers `/pricing/success` fonctionne
- [ ] ✅ Paiement visible dans Stripe Dashboard
- [ ] ✅ Annulation redirige vers `/pricing/cancel`
- [ ] ✅ Session temporaire fonctionne
- [ ] 🔶 Webhooks testés (optionnel)

---

## 🎯 PROCHAINES ÉTAPES

Une fois tous les tests validés :

1. **Option A :** Créer interface admin gestion abonnements (1-2h)
2. **Option B :** Déploiement production (3-4h)
3. **Option C :** Tests finaux et documentation utilisateur

---

## 📚 RESSOURCES

- **Stripe Test Cards :** [https://stripe.com/docs/testing](https://stripe.com/docs/testing)
- **Stripe CLI :** [https://stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)
- **Stripe Checkout :** [https://stripe.com/docs/payments/checkout](https://stripe.com/docs/payments/checkout)
- **Stripe Webhooks :** [https://stripe.com/docs/webhooks](https://stripe.com/docs/webhooks)

---

**Version :** 1.0
**Auteur :** Claude Code
**Date :** 2025-10-18
