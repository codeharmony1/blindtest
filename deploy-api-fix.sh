#!/bin/bash

# Script de déploiement rapide pour correctif API
# Usage: ./deploy-api-fix.sh

set -e

echo "🚀 Déploiement du correctif API..."

# 1. Sauvegarder l'image Docker
echo "📦 Sauvegarde de l'image Docker..."
docker save blindtest-api:latest | gzip > blindtest-api-fix.tar.gz

# 2. Transférer vers le serveur
echo "📤 Transfert vers le serveur..."
scp blindtest-api-fix.tar.gz root@blindtest.codeharmony.fr:/tmp/

# 3. Charger et redémarrer sur le serveur
echo "🔄 Chargement et redémarrage sur le serveur..."
ssh root@blindtest.codeharmony.fr << 'ENDSSH'
  cd /root

  # Charger la nouvelle image
  echo "📥 Chargement de la nouvelle image..."
  gunzip < /tmp/blindtest-api-fix.tar.gz | docker load

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
  rm /tmp/blindtest-api-fix.tar.gz

  echo "✅ Déploiement terminé!"

  # Afficher les logs
  echo "📋 Logs du conteneur (10 dernières lignes):"
  docker logs blindtest-api --tail 10
ENDSSH

echo "✅ Déploiement du correctif terminé avec succès!"
