#!/bin/bash

# Script pour déployer la nouvelle image API avec les corrections tenant_id

set -e

echo "🔄 Arrêt du conteneur API actuel..."
cd ~/docker-services
docker compose -f docker-compose.prod.yml stop blindtest-api

echo "📦 Chargement de la nouvelle image API..."
docker load -i ~/blindtest-api.tar

echo "🗑️  Suppression de l'ancien conteneur..."
docker compose -f docker-compose.prod.yml rm -f blindtest-api

echo "🚀 Démarrage du nouveau conteneur API..."
docker compose -f docker-compose.prod.yml up -d blindtest-api

echo "⏳ Attente du démarrage (15 secondes)..."
sleep 15

echo "📋 Vérification des logs..."
docker logs blindtest-api --tail 30

echo "✅ Déploiement terminé!"
echo ""
echo "Pour vérifier l'état:"
echo "  docker logs blindtest-api --tail 50"
echo "  docker compose -f docker-compose.prod.yml ps"
