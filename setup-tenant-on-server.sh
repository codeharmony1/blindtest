#!/bin/bash
# Script pour créer le tenant par défaut sur le serveur de production

echo "🔧 Création du tenant 'default' dans la base de données..."

# Exécuter le script de setup dans le conteneur API
docker exec blindtest-api node /app/apps/api/setup-default-tenant.js

echo ""
echo "✅ Fait ! Vous pouvez maintenant vous connecter avec :"
echo "   Email: admin@blindtest.local"
echo "   Password: admin123456"
