#!/bin/bash

# Script de déploiement des sources API
# Construit l'image directement sur le serveur

set -e

echo "🚀 Déploiement des sources API..."

# 1. Créer une archive des sources
echo "📦 Création de l'archive des sources..."
tar -czf api-sources.tar.gz \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='.git' \
  --exclude='*.log' \
  apps/api/ \
  package.json \
  package-lock.json

# 2. Transférer vers le serveur
echo "📤 Transfert vers le serveur..."
scp api-sources.tar.gz root@blindtest.codeharmony.fr:/tmp/

# 3. Construire et redémarrer sur le serveur
echo "🔄 Construction et redémarrage sur le serveur..."
ssh root@blindtest.codeharmony.fr << 'ENDSSH'
  cd /tmp

  # Extraire les sources
  echo "📂 Extraction des sources..."
  rm -rf /tmp/blindtest-build
  mkdir -p /tmp/blindtest-build
  tar -xzf api-sources.tar.gz -C /tmp/blindtest-build

  cd /tmp/blindtest-build

  # Construire l'image Docker
  echo "🏗️  Construction de l'image Docker..."
  docker build -t blindtest-api:latest -f apps/api/Dockerfile .

  # Arrêter l'ancien conteneur
  echo "🛑 Arrêt de l'ancien conteneur..."
  docker stop blindtest-api || true
  docker rm blindtest-api || true

  # Démarrer le nouveau conteneur
  echo "▶️  Démarrage du nouveau conteneur..."
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

  # Nettoyer
  echo "🧹 Nettoyage..."
  cd /root
  rm -rf /tmp/blindtest-build
  rm /tmp/api-sources.tar.gz

  echo "✅ Déploiement terminé!"

  # Attendre 3 secondes que le conteneur démarre
  sleep 3

  # Afficher les logs
  echo ""
  echo "📋 Logs du conteneur:"
  docker logs blindtest-api --tail 30
ENDSSH

echo "✅ Déploiement terminé avec succès!"
