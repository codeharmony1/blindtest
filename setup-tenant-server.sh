#!/bin/bash
# Script à exécuter SUR LE SERVEUR pour créer le tenant par défaut

echo "🔧 Création du tenant 'default'..."

# Copier le script de setup dans le conteneur
docker cp ~/docker-services/apps/api/setup-default-tenant.js blindtest-api:/tmp/setup-tenant.js 2>/dev/null

# Si le fichier n'existe pas, on utilise node directement dans le conteneur
if [ $? -ne 0 ]; then
  echo "📝 Création du tenant via l'API..."

  # Appel direct à l'API de registration
  curl -X POST https://blindtest.codeharmony.fr/api/tenants/register \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Default Company",
      "slug": "default",
      "ownerEmail": "admin@blindtest.local",
      "ownerPassword": "admin123456",
      "ownerName": "Administrator",
      "plan": "DEMO"
    }'

  echo ""
  echo "✅ Fait ! Credentials:"
  echo "   Email: admin@blindtest.local"
  echo "   Password: admin123456"
  echo "   Tenant: default"
else
  # Exécuter le script dans le conteneur
  docker exec blindtest-api node /tmp/setup-tenant.js
fi
