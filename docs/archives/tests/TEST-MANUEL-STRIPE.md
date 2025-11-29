# 🧪 TEST MANUEL - STRIPE CHECKOUT

**Date :** 2025-10-18
**Durée estimée :** 10-15 minutes
**Statut :** ✅ Prêt pour les tests

---

## ✅ PRÉREQUIS

- ✅ **Clés Stripe configurées** dans `apps/api/.env`
- ✅ **API démarrée** sur http://localhost:3001
- ✅ **Web démarrée** sur http://localhost:4200
- ✅ **MySQL actif** via XAMPP

---

## 📝 ÉTAPES DE TEST

### Étape 1 : Connexion

1. Ouvrez votre navigateur (Chrome/Edge recommandé)
2. Allez sur : **http://localhost:4200/auth/login**
3. Connectez-vous avec :
   - **Email :** `admin@blindtest.local`
   - **Mot de passe :** `admin123456` (ou le nouveau mot de passe si vous l'avez changé)

**Résultat attendu :**
- ✅ Connexion réussie
- ✅ Redirection vers `/admin`

---

### Étape 2 : Accéder à la page Pricing

1. Dans la barre d'adresse, allez sur : **http://localhost:4200/pricing**
2. Vous devriez voir la page des tarifs

**Résultat attendu :**
- ✅ 3 plans d'abonnement affichés :
  - **Plan DÉMO** - 0€ - Gratuit
  - **Paiement par Événement** - 19€ - One-time
  - **Plan Mensuel** - 49€/mois - Récurrent
- ✅ 3 sessions temporaires affichées :
  - **2 jours** - 19€
  - **1 semaine** - 49€
  - **1 mois** - 99€
- ✅ Boutons "Choisir" cliquables
- ✅ Design responsive et moderne

---

### Étape 3 : Test du Checkout - Plan Mensuel

1. Sur la page `/pricing`, cliquez sur **"Choisir"** pour le **Plan Mensuel (49€/mois)**

**Résultat attendu :**
- ✅ Vous êtes redirigé vers une page Stripe (URL commence par `https://checkout.stripe.com/...`)
- ✅ La page Stripe affiche :
  - Nom du produit : "Plan Mensuel" ou similaire
  - Montant : **49,00 €**
  - Récurrence : **Mensuel** ou "par mois"
  - Formulaire de paiement (carte, email, etc.)

**📌 Vérification dans la Console (F12) :**
- Ouvrez les Developer Tools (F12)
- Onglet "Network"
- Vous devriez voir une requête `POST` vers `/api/payments/checkout/subscription`
- La réponse devrait contenir un `checkoutUrl` Stripe

---

### Étape 4 : Paiement Test

Sur la page Stripe Checkout, remplissez le formulaire avec ces **cartes de test Stripe** :

#### Carte de test réussie ✅
```
Numéro : 4242 4242 4242 4242
Date   : 12/26 (n'importe quelle date future)
CVC    : 123 (n'importe quel code 3 chiffres)
Nom    : Test User
Email  : test@example.com
```

1. Remplissez tous les champs
2. Cliquez sur **"Payer"** (ou "Pay")

**Résultat attendu :**
- ✅ Le paiement est accepté
- ✅ Vous êtes redirigé vers **http://localhost:4200/pricing/success**
- ✅ Message de succès affiché
- ✅ Lien vers le dashboard visible

---

### Étape 5 : Vérification dans Stripe Dashboard

1. Ouvrez un nouvel onglet
2. Allez sur [https://dashboard.stripe.com](https://dashboard.stripe.com)
3. **IMPORTANT :** Vérifiez que vous êtes en **mode Test** (toggle en haut à droite)
4. Naviguez dans les sections suivantes :

#### A. Vérifier le Paiement
1. Allez dans **Payments** (menu de gauche)
2. Vous devriez voir un nouveau paiement de **49,00 €**
3. Statut : **Succeeded** ✅

**Détails à vérifier :**
- Montant : 49,00 €
- Email client : test@example.com
- Date : Aujourd'hui

#### B. Vérifier le Client
1. Allez dans **Customers**
2. Vous devriez voir un nouveau client avec l'email `test@example.com`

#### C. Vérifier l'Abonnement
1. Allez dans **Subscriptions**
2. Vous devriez voir un abonnement **Active**
3. Plan : MONTHLY ou Plan Mensuel
4. Montant : 49€/mois

---

### Étape 6 : Test d'Annulation

1. Retournez sur **http://localhost:4200/pricing**
2. Cliquez sur **"Choisir"** pour un autre plan (ex: Plan DÉMO)
3. Une fois sur la page Stripe, cliquez sur le bouton **"← Retour"** (en haut à gauche)

**Résultat attendu :**
- ✅ Vous êtes redirigé vers **http://localhost:4200/pricing/cancel**
- ✅ Message "Paiement annulé" affiché
- ✅ Bouton "Retour aux tarifs" visible et fonctionnel

---

### Étape 7 : Test Session Temporaire

1. Retournez sur **http://localhost:4200/pricing**
2. Cliquez sur **"Session 1 semaine - 49€"**
3. Une popup apparaît : **"Nom de votre session temporaire :"**
4. Entrez un nom (ex: "Session Test")
5. Cliquez OK
6. Vous êtes redirigé vers Stripe
7. Remplissez à nouveau le formulaire avec la carte test `4242 4242 4242 4242`
8. Validez le paiement

**Résultat attendu :**
- ✅ Paiement de **49,00 €** accepté
- ✅ Redirection vers `/pricing/success`
- ✅ Dans Stripe Dashboard, vous voyez :
  - Un nouveau paiement de 49€
  - **MAIS PAS d'abonnement récurrent** (c'est un paiement unique)

---

## 🧪 TESTS DE CARTES STRIPE

Voici d'autres cartes de test Stripe que vous pouvez utiliser :

### Cartes qui réussissent ✅
```
4242 4242 4242 4242   → Succès
5555 5555 5555 4444   → Succès (Mastercard)
```

### Cartes qui échouent ❌
```
4000 0000 0000 0002   → Échec (carte déclinée)
4000 0000 0000 9995   → Échec (fonds insuffisants)
```

### Authentification 3D Secure
```
4000 0025 0000 3155   → Requiert une authentification 3D Secure
```

---

## 📊 CHECKLIST DE VALIDATION

Cochez au fur et à mesure :

### Frontend
- [ ] ✅ Page `/pricing` affiche correctement tous les plans
- [ ] ✅ Boutons "Choisir" fonctionnent
- [ ] ✅ Redirection vers Stripe Checkout fonctionne
- [ ] ✅ Page `/pricing/success` s'affiche après paiement
- [ ] ✅ Page `/pricing/cancel` s'affiche après annulation
- [ ] ✅ Design responsive (tester sur mobile avec F12 > Device Toolbar)

### Stripe Checkout
- [ ] ✅ Page Stripe affiche le bon montant
- [ ] ✅ Formulaire de paiement complet et fonctionnel
- [ ] ✅ Carte test `4242 4242 4242 4242` acceptée
- [ ] ✅ Redirection automatique après paiement

### Stripe Dashboard
- [ ] ✅ Paiement visible dans "Payments" avec statut "Succeeded"
- [ ] ✅ Client créé dans "Customers"
- [ ] ✅ Abonnement créé dans "Subscriptions" (pour plan récurrent)
- [ ] ✅ Pas d'abonnement pour session temporaire (paiement unique)

### Annulation
- [ ] ✅ Bouton "Retour" dans Stripe redirige vers `/pricing/cancel`
- [ ] ✅ Aucun paiement créé si annulé

---

## 🐛 DÉPANNAGE

### Problème : Erreur 400 ou 500 lors du checkout

**Solution :**
1. Ouvrez la console du navigateur (F12)
2. Vérifiez l'onglet "Console" pour voir les erreurs
3. Vérifiez l'onglet "Network" pour voir la requête API
4. Vérifiez que vous êtes bien connecté (token présent)

### Problème : "Invalid API Key" dans Stripe

**Solution :**
1. Vérifiez que vous avez copié les bonnes clés dans `.env`
2. Vérifiez qu'il n'y a pas d'espaces avant/après les clés
3. Redémarrez l'API après modification du `.env`

### Problème : Pas de redirection après paiement

**Solution :**
1. Vérifiez que `successUrl` et `cancelUrl` sont corrects dans le code
2. Vérifiez qu'il y a bien `{CHECKOUT_SESSION_ID}` dans l'URL
3. Consultez les logs de l'API (terminal où tourne `npm run dev:api`)

### Problème : Rien ne se passe au clic sur "Choisir"

**Solution :**
1. Ouvrez la console (F12)
2. Vérifiez les erreurs JavaScript
3. Vérifiez que `ApiService` est bien injecté dans `PricingComponent`
4. Vérifiez que le frontend a bien compilé sans erreurs

---

## ✅ SI TOUS LES TESTS PASSENT

**Félicitations ! L'intégration Stripe est fonctionnelle à 100%** 🎉

Vous pouvez maintenant :
1. **Tester d'autres cartes** (voir section "Tests de cartes Stripe")
2. **Tester sur mobile** (F12 > Device Toolbar)
3. **Tester les webhooks** (nécessite Stripe CLI - voir GUIDE-TEST-STRIPE.md)
4. **Passer en production** (changer les clés pour les clés live)

---

## 📝 RAPPORT DE TEST

Après vos tests, remplissez ce rapport :

**Date du test :** _______________

**Navigateur utilisé :** _______________

**Résultats :**
- Page /pricing : ☐ OK ☐ KO
- Redirection Stripe : ☐ OK ☐ KO
- Paiement test : ☐ OK ☐ KO
- Page success : ☐ OK ☐ KO
- Page cancel : ☐ OK ☐ KO
- Paiement dans Stripe Dashboard : ☐ OK ☐ KO
- Abonnement dans Stripe Dashboard : ☐ OK ☐ KO
- Session temporaire : ☐ OK ☐ KO

**Problèmes rencontrés :**
_______________________________________________
_______________________________________________
_______________________________________________

**Commentaires :**
_______________________________________________
_______________________________________________
_______________________________________________

---

**Version :** 1.0
**Auteur :** Claude Code
**Date :** 2025-10-18
**Temps estimé :** 10-15 minutes
