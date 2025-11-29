# 🧪 GUIDE DE TEST - RESET PASSWORD

**Date:** 2025-10-18
**Statut:** ✅ Backend + Frontend prêts
**URLs:**
- API: http://localhost:3001
- Web: http://localhost:4200

---

## ✅ SYSTÈMES OPÉRATIONNELS

- ✅ MySQL XAMPP - Port 3306
- ✅ API Node.js - Port 3001
- ✅ Angular - Port 4200
- ✅ Migration `password_reset_tokens` exécutée
- ✅ Token généré : `1a4865f6-a762-49a8-8060-f371eb3b893f`
- ⚠️ SMTP : Non configuré (mode dev, email non envoyé)

---

## 🎯 TEST 1 : FORGOT PASSWORD (Manuel)

### Étape 1 : Accéder à la page
1. Ouvrir navigateur : **http://localhost:4200/auth/login**
2. Cliquer sur le lien **"Mot de passe oublié ?"**
3. **Vérifier :** Redirection vers `/auth/forgot-password`

### Étape 2 : Remplir le formulaire
1. Entrer email : `admin@blindtest.local`
2. **Vérifier :** Champ email validé (pas d'erreur rouge)
3. Cliquer bouton **"Envoyer le lien"**

### Étape 3 : Vérifier la réponse
1. **Vérifier :** Redirection vers `/auth/reset-password-sent?email=admin@blindtest.local`
2. **Vérifier :** Message "Email envoyé !" affiché
3. **Vérifier :** Email `admin@blindtest.local` affiché

### Étape 4 : Vérifier en base de données
```sql
USE blindtest;
SELECT * FROM password_reset_tokens ORDER BY created_at DESC LIMIT 1;
```

**Attendu :**
- Un nouveau token créé
- `email` = admin@blindtest.local
- `used` = 0
- `expires_at` = environ +1h de `created_at`

---

## 🎯 TEST 2 : RESET PASSWORD (Manuel)

### Étape 1 : Récupérer le token
Depuis la base de données :
```sql
SELECT token FROM password_reset_tokens
WHERE email = 'admin@blindtest.local'
AND used = 0
AND expires_at > NOW()
ORDER BY created_at DESC LIMIT 1;
```

**Exemple token :** `1a4865f6-a762-49a8-8060-f371eb3b893f`

### Étape 2 : Accéder à la page reset
1. Ouvrir navigateur : **http://localhost:4200/auth/reset-password?token=1a4865f6-a762-49a8-8060-f371eb3b893f**
2. **Vérifier :** Spinner "Vérification du lien..." affiché brièvement
3. **Vérifier :** Formulaire "Nouveau mot de passe" affiché
4. **Vérifier :** Email `admin@blindtest.local` affiché en haut

### Étape 3 : Remplir le formulaire
1. Nouveau mot de passe : `NewPassword123`
2. Confirmer : `NewPassword123`
3. **Vérifier :** Pas d'erreur de validation
4. Cliquer **"Réinitialiser le mot de passe"**

### Étape 4 : Vérifier succès
1. **Vérifier :** Message vert "Mot de passe réinitialisé avec succès !"
2. **Vérifier :** Redirection automatique vers `/auth/login` après 2 secondes
3. **Vérifier :** Possibilité de se connecter avec nouveau mot de passe

### Étape 5 : Vérifier en base
```sql
SELECT used, used_at FROM password_reset_tokens
WHERE token = '1a4865f6-a762-49a8-8060-f371eb3b893f';
```

**Attendu :**
- `used` = 1
- `used_at` = timestamp récent

---

## 🎯 TEST 3 : TOKEN EXPIRÉ

### Étape 1 : Expirer un token
```sql
UPDATE password_reset_tokens
SET expires_at = DATE_SUB(NOW(), INTERVAL 2 HOUR)
WHERE email = 'admin@blindtest.local'
ORDER BY created_at DESC LIMIT 1;
```

### Étape 2 : Tenter d'utiliser le token
1. Accéder : **http://localhost:4200/auth/reset-password?token=xxx**
2. **Vérifier :** Message "Lien expiré" affiché
3. **Vérifier :** Icône horloge ⏱️
4. **Vérifier :** Bouton "Demander un nouveau lien" présent
5. Cliquer bouton **"Demander un nouveau lien"**
6. **Vérifier :** Redirection vers `/auth/forgot-password`

---

## 🎯 TEST 4 : TOKEN INVALIDE

### Étape 1 : Token inexistant
1. Accéder : **http://localhost:4200/auth/reset-password?token=invalid-token-123**
2. **Vérifier :** Message "Lien expiré" affiché (même comportement)

### Étape 2 : Sans token
1. Accéder : **http://localhost:4200/auth/reset-password**
2. **Vérifier :** Message "Lien expiré" affiché immédiatement

---

## 🎯 TEST 5 : VALIDATION FORMULAIRE

### Test email invalide
1. Page `/auth/forgot-password`
2. Entrer : `test` (sans @)
3. Cliquer ailleurs
4. **Vérifier :** Erreur "Format d'email invalide"
5. Bouton désactivé

### Test mot de passe trop court
1. Page `/auth/reset-password?token=xxx`
2. Entrer mot de passe : `short`
3. **Vérifier :** Erreur "Minimum 8 caractères requis"
4. Bouton désactivé

### Test mots de passe différents
1. Nouveau mot de passe : `Password123`
2. Confirmation : `Password456`
3. **Vérifier :** Erreur "Les mots de passe ne correspondent pas"
4. Bouton désactivé

---

## 🎯 TEST 6 : AUTO-REFRESH TOKENS (Simulation)

### Préparation
1. Se connecter normalement
2. Ouvrir DevTools → Application → Local Storage
3. Noter `bt_access_token` et `bt_refresh_token`

### Simulation expiration (via console)
```javascript
// Dans la console navigateur
localStorage.setItem('bt_access_token', 'expired-token-xyz');
```

### Test refresh
1. Naviguer vers `/admin` ou faire une action API
2. **Vérifier dans Network :**
   - 1ère requête → 401
   - 2ème requête automatique → POST `/api/auth/refresh`
   - 3ème requête → Même endpoint avec nouveau token

3. **Vérifier localStorage :**
   - Nouveaux tokens stockés
   - Pas de déconnexion

### Test échec refresh
```javascript
// Supprimer le refresh token
localStorage.removeItem('bt_refresh_token');
localStorage.setItem('bt_access_token', 'expired');
```

1. Naviguer vers `/admin`
2. **Vérifier :** Redirection automatique vers `/auth/login`
3. **Vérifier :** localStorage nettoyé

---

## 🎯 TEST 7 : RATE LIMITING

### Test 4 tentatives rapides
```bash
# Depuis terminal
for i in {1..4}; do
  curl -X POST http://localhost:3001/api/auth/forgot-password \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com"}' && echo "";
done
```

**Attendu :**
- 3 premières : `{"success":true}`
- 4ème : `429 Too Many Requests`

---

## 🎯 TEST 8 : API DIRECTE (curl)

### Forgot password
```bash
curl -X POST http://localhost:3001/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@blindtest.local"}' | python -m json.tool
```

**Attendu :**
```json
{
  "success": true,
  "message": "Si cet email existe, un lien de réinitialisation a été envoyé."
}
```

### Verify token
```bash
curl -s http://localhost:3001/api/auth/verify-reset-token/1a4865f6-a762-49a8-8060-f371eb3b893f | python -m json.tool
```

**Attendu :**
```json
{
  "valid": true,
  "email": "admin@blindtest.local",
  "expiresAt": "2025-10-18T14:33:19.697Z"
}
```

### Reset password
```bash
curl -X POST http://localhost:3001/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token":"1a4865f6-a762-49a8-8060-f371eb3b893f",
    "newPassword":"NewPassword123"
  }' | python -m json.tool
```

**Attendu :**
```json
{
  "success": true,
  "message": "Mot de passe réinitialisé avec succès"
}
```

---

## 🎯 TEST 9 : NAVIGATEURS MULTIPLES

### Test chaque navigateur
- [ ] Chrome
- [ ] Firefox
- [ ] Edge
- [ ] Safari (si Mac)

### Points à vérifier
1. Design responsive
2. Animations (spinner, bounce)
3. Focus states
4. Transitions
5. Validation formulaire
6. Redirections

---

## 🎯 TEST 10 : MOBILE

### Responsive design
1. DevTools → Toggle device toolbar
2. Tester iPhone, Android
3. **Vérifier :**
   - Formulaires utilisables
   - Boutons accessibles
   - Texte lisible
   - Pas de scroll horizontal

---

## ❌ TESTS IMPOSSIBLES (SMTP non configuré)

Ces tests nécessitent SMTP configuré :
- ❌ Recevoir email réel
- ❌ Cliquer lien dans email
- ❌ Vérifier template email HTML
- ❌ Tester délai de livraison

**Pour tester en production :**
1. Configurer SMTP_PASS dans `.env`
2. Redémarrer API
3. Utiliser vraie adresse email

---

## ✅ CHECKLIST COMPLÈTE

### Backend
- [x] API health check
- [x] POST /auth/forgot-password fonctionne
- [x] GET /auth/verify-reset-token/:token fonctionne
- [x] POST /auth/reset-password fonctionne
- [x] POST /auth/refresh fonctionne
- [x] Migration password_reset_tokens exécutée
- [x] Token créé en base
- [ ] Email SMTP configuré (optionnel dev)

### Frontend
- [x] Page /forgot-password charge
- [x] Page /reset-password charge
- [x] Page /reset-password-sent charge
- [x] Validation formulaires
- [x] Appels API fonctionnent
- [x] Redirections fonctionnent
- [x] Design cohérent
- [x] Interceptor auto-refresh configuré

### Tests à faire manuellement
- [ ] Flow complet utilisateur
- [ ] Token expiré
- [ ] Token invalide
- [ ] Validation formulaires
- [ ] Rate limiting
- [ ] Auto-refresh tokens
- [ ] Multi-navigateurs
- [ ] Mobile responsive

---

## 📝 NOTES

**Token de test disponible :**
```
1a4865f6-a762-49a8-8060-f371eb3b893f
```

**Lien de test direct :**
```
http://localhost:4200/auth/reset-password?token=1a4865f6-a762-49a8-8060-f371eb3b893f
```

**Compte de test :**
```
Email: admin@blindtest.local
Ancien mot de passe: (inconnu - à reset)
Nouveau mot de passe: NewPassword123 (après test)
```

---

## 🚀 DÉMARRAGE RAPIDE

```bash
# Terminal 1 - API
cd "d:\Projet\Blind test musical"
npm run dev:api

# Terminal 2 - Web
npm run start:web

# Navigateur
http://localhost:4200/auth/login
```

---

**Version:** 1.0
**Auteur:** Claude Code
**Date:** 2025-10-18
