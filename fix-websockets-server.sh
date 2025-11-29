#!/bin/bash
# Script pour configurer Traefik pour supporter les WebSockets Socket.IO
# À exécuter SUR LE SERVEUR

echo "🔧 Configuration des WebSockets pour Traefik..."

cd ~/docker-services

# Créer une sauvegarde du docker-compose.yml
cp docker-compose.yml docker-compose.yml.backup-$(date +%Y%m%d-%H%M%S)

# Mettre à jour les labels du service blindtest-api
# On utilise cat avec heredoc pour générer la nouvelle section labels

cat > /tmp/blindtest-labels.yml << 'EOF'
    labels:
      - "traefik.enable=true"

      # Router principal pour l'API (HTTP/HTTPS)
      - "traefik.http.routers.blindtest-api.rule=Host(\`blindtest.codeharmony.fr\`) && PathPrefix(\`/api\`)"
      - "traefik.http.routers.blindtest-api.entrypoints=https"
      - "traefik.http.routers.blindtest-api.tls=true"
      - "traefik.http.routers.blindtest-api.tls.certresolver=letsencrypt"
      - "traefik.http.routers.blindtest-api.priority=100"

      # Router pour Socket.IO (WebSocket) - PRIORITÉ PLUS ÉLEVÉE
      - "traefik.http.routers.blindtest-ws.rule=Host(\`blindtest.codeharmony.fr\`) && PathPrefix(\`/socket.io\`)"
      - "traefik.http.routers.blindtest-ws.entrypoints=https"
      - "traefik.http.routers.blindtest-ws.tls=true"
      - "traefik.http.routers.blindtest-ws.tls.certresolver=letsencrypt"
      - "traefik.http.routers.blindtest-ws.priority=200"

      # Middleware pour WebSocket upgrade
      - "traefik.http.middlewares.ws-headers.headers.customrequestheaders.Connection=Upgrade"
      - "traefik.http.middlewares.ws-headers.headers.customrequestheaders.Upgrade=websocket"

      # Appliquer le middleware au router WebSocket
      - "traefik.http.routers.blindtest-ws.middlewares=ws-headers"

      # Service (port 3000 pour API et WebSocket)
      - "traefik.http.services.blindtest-api.loadbalancer.server.port=3000"

      # Network
      - "traefik.docker.network=proxy"
EOF

echo ""
echo "📝 Nouvelle configuration des labels créée dans /tmp/blindtest-labels.yml"
echo ""
echo "⚠️  IMPORTANT: Vous devez maintenant éditer manuellement ~/docker-services/docker-compose.yml"
echo "   et remplacer la section 'labels:' du service 'blindtest-api' par le contenu de:"
echo "   /tmp/blindtest-labels.yml"
echo ""
echo "💡 Commandes suggérées:"
echo "   nano ~/docker-services/docker-compose.yml"
echo "   # Chercher la section blindtest-api et remplacer les labels"
echo ""
echo "   Ensuite:"
echo "   docker compose up -d blindtest-api"
echo ""
read -p "Appuyez sur Entrée pour ouvrir l'éditeur nano..."

nano ~/docker-services/docker-compose.yml

echo ""
read -p "Avez-vous mis à jour les labels ? (o/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Oo]$ ]]
then
    echo "🚀 Redémarrage du conteneur API avec la nouvelle configuration..."
    docker compose up -d blindtest-api

    echo ""
    echo "✅ Fait ! Les WebSockets devraient maintenant fonctionner."
    echo ""
    echo "🧪 Testez en rechargeant https://blindtest.codeharmony.fr"
    echo "   Les erreurs WebSocket devraient disparaître dans la console."
fi
