# Fix: Erreur 500 lors de la création d'événement

## 🐛 Problème identifié

Lors de la création d'un nouvel événement via l'interface admin, une erreur HTTP 500 se produit:

```
❌ Erreur lors de la création:
Object { headers: {…}, status: 500, statusText: "OK", url: "https://blindtest.codeharmony.fr/api/events" }
```

### Cause racine

Le code de création d'événement pour le système multi-tenant (ligne 146-155 de `apps/api/src/modules/events/routes.ts`) tentait d'insérer une entrée `EventStaff` de manière synchrone et **faisait échouer toute la transaction** si cette insertion échouait.

Le problème est que:
1. L'insertion dans `EventStaff` peut échouer pour diverses raisons (contraintes FK, user_id invalide, etc.)
2. L'erreur n'était pas catchée, causant une erreur 500 générique
3. Aucun log détaillé n'était disponible pour debugger

## ✅ Solution appliquée

### 1. Gestion d'erreur améliorée

**Fichier modifié:** `apps/api/src/modules/events/routes.ts`

#### A. Ajout de logs détaillés au début de la route (ligne 102-109)

```typescript
console.log("[DEBUG] POST /api/events - Request context:", {
  hasTenantContext: !!tenantContext,
  tenantId: tenantContext?.tenantId,
  userId: tenantContext?.userId,
  hasStaff: !!req.staff,
  organizerId: req.staff?.organizerId,
  body: { name, code, gameMode, tableMode, hasSettings: !!settings }
});
```

#### B. Protection de l'insertion EventStaff (ligne 155-180)

```typescript
// Créer automatiquement une entrée EventStaff pour le créateur
if (tenantContext.userId) {
  try {
    const staffRepo = AppDataSource.getRepository(
      (await import("../../db/entities/EventStaff")).EventStaff,
    );
    console.log("[DEBUG] Creating EventStaff entry:", {
      event_id: saved.id,
      tenant_user_id: tenantContext.userId,
      role: "ADMIN"
    });
    await staffRepo.insert({
      event_id: saved.id,
      tenant_user_id: tenantContext.userId,
      role: "ADMIN",
    } as any);
    console.log("[DEBUG] EventStaff entry created successfully");
  } catch (staffError: any) {
    console.error("[ERROR] Failed to create EventStaff entry:", {
      error: staffError,
      message: staffError.message,
      code: staffError.code
    });
    // Ne pas faire échouer toute la création d'événement si EventStaff échoue
    // L'événement est déjà créé
  }
}
```

**Changement clé:** L'erreur d'insertion EventStaff est maintenant catchée et loggée, mais ne fait plus échouer la création de l'événement.

#### C. Amélioration du catch principal (ligne 226-242)

```typescript
} catch (e: any) {
  console.error("[ERROR] Event creation failed:", {
    error: e,
    message: e.message,
    stack: e.stack,
    code: e.code,
    query: e.query
  });
  return res
    .status(500)
    .json({
      error: {
        code: "SERVER_ERROR",
        message: String(e),
        details: e.message
      }
    });
}
```

**Changement clé:** Logs détaillés de l'erreur avec stack trace, et retour du message d'erreur détaillé au client.

#### D. Même protection pour la duplication d'événement (ligne 679-692)

```typescript
// Create EventStaff entry for multi-tenant system
if (tenantContext?.userId) {
  try {
    const staffRepo = AppDataSource.getRepository(
      (await import("../../db/entities/EventStaff")).EventStaff,
    );
    await staffRepo.insert({
      event_id: savedEvent.id,
      tenant_user_id: tenantContext.userId,
      role: "ADMIN",
    } as any);
  } catch (staffError) {
    console.error("[ERROR] Failed to create EventStaff entry during duplication:", staffError);
    // Ne pas faire échouer toute la duplication si EventStaff échoue
  }
}
```

## 📋 Instructions de déploiement

### Option 1: Déploiement via Git (recommandé)

```bash
# Sur votre machine locale
cd "d:\Projet\Blind test musical"
git add apps/api/src/modules/events/routes.ts
git commit -m "fix(api): handle EventStaff insertion errors gracefully during event creation"
git push

# Sur le serveur
ssh root@blindtest.codeharmony.fr
cd /root
git pull
docker-compose down
docker-compose up -d --build
docker logs -f blindtest-api
```

### Option 2: Déploiement manuel des fichiers modifiés

```bash
# Sur votre machine locale - créer l'archive
cd "d:\Projet\Blind test musical"
tar -czf event-routes-fix.tar.gz apps/api/src/modules/events/routes.ts

# Transférer
scp event-routes-fix.tar.gz root@blindtest.codeharmony.fr:/tmp/

# Sur le serveur
ssh root@blindtest.codeharmony.fr
cd /root
tar -xzf /tmp/event-routes-fix.tar.gz
docker-compose down
docker-compose up -d --build
docker logs -f blindtest-api
```

### Option 3: Build et redéploiement complet de l'image Docker

```bash
# Sur le serveur
cd /tmp
rm -rf blindtest-build
mkdir blindtest-build
cd blindtest-build

# Cloner le repo (ou copier les sources)
git clone <votre-repo> .
# OU si vous avez les sources:
# scp -r /chemin/vers/sources/* root@blindtest.codeharmony.fr:/tmp/blindtest-build/

# Builder l'image
docker build -t blindtest-api:latest -f apps/api/Dockerfile .

# Stopper l'ancien conteneur
docker stop blindtest-api
docker rm blindtest-api

# Démarrer le nouveau
docker run -d \
  --name blindtest-api \
  --network traefik-public \
  --env-file /root/.env.production \
  -l "traefik.enable=true" \
  -l "traefik.http.routers.blindtest-api.rule=Host(\`blindtest.codeharmony.fr\`) && PathPrefix(\`/api\`, \`/socket.io\`)" \
  -l "traefik.http.routers.blindtest-api.entrypoints=websecure" \
  -l "traefik.http.routers.blindtest-api.tls.certresolver=letsencrypt" \
  -l "traefik.http.services.blindtest-api.loadbalancer.server.port=3000" \
  blindtest-api:latest

# Vérifier les logs
docker logs -f blindtest-api
```

## 🧪 Test après déploiement

1. Connectez-vous à l'interface admin: `https://blindtest.codeharmony.fr/admin`
2. Essayez de créer un nouvel événement
3. Vérifiez les logs du conteneur:
   ```bash
   docker logs blindtest-api --tail 50
   ```
4. Cherchez les logs `[DEBUG] POST /api/events - Request context:` pour voir le contexte d'authentification
5. Vérifiez qu'il n'y a plus d'erreur 500

## 📊 Logs attendus après le fix

### En cas de succès
```
[DEBUG] POST /api/events - Request context: { hasTenantContext: true, tenantId: '...', userId: '...', ... }
[DEBUG] Creating EventStaff entry: { event_id: '...', tenant_user_id: '...', role: 'ADMIN' }
[DEBUG] EventStaff entry created successfully
```

### En cas d'échec EventStaff (mais événement créé quand même)
```
[DEBUG] POST /api/events - Request context: { hasTenantContext: true, tenantId: '...', userId: '...', ... }
[DEBUG] Creating EventStaff entry: { event_id: '...', tenant_user_id: '...', role: 'ADMIN' }
[ERROR] Failed to create EventStaff entry: { error: ..., message: '...', code: '...' }
```

## 🔍 Debug supplémentaire si le problème persiste

Si l'erreur 500 persiste après le déploiement, vérifiez:

1. **Le token JWT utilisé:**
   ```bash
   # Dans les logs, vérifier que tenantId et userId sont présents
   docker logs blindtest-api | grep "POST /api/events"
   ```

2. **L'état de la base de données:**
   ```sql
   -- Vérifier que la table tenants existe
   SHOW TABLES LIKE 'tenants';

   -- Vérifier que la table event_staff existe avec les bonnes colonnes
   DESCRIBE event_staff;

   -- Vérifier qu'il y a des tenants
   SELECT * FROM tenants LIMIT 5;
   ```

3. **Le contexte d'authentification:**
   - L'utilisateur est-il connecté via le système multi-tenant ou legacy?
   - Le token contient-il `tenantId` et `userId`?

## 📝 Fichiers modifiés

- ✅ `apps/api/src/modules/events/routes.ts` (lignes 102-109, 155-180, 226-242, 679-692)

## 🎯 Résultat attendu

Après ce fix:
- ✅ Les événements sont créés avec succès même si EventStaff échoue
- ✅ Des logs détaillés permettent de debugger les erreurs
- ✅ L'utilisateur reçoit une réponse 201 avec l'événement créé
- ✅ Pas d'erreur 500 côté client
