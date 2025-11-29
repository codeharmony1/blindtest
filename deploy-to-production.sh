#!/bin/bash

# Script de déploiement automatisé - Blind Test Musical
# Usage: ./deploy-to-production.sh [SERVER_USER@SERVER_IP]

set -e  # Arrêter en cas d'erreur

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Déploiement Blind Test Musical ===${NC}\n"

# Vérifier les arguments
if [ -z "$1" ]; then
    echo -e "${RED}Erreur: Veuillez spécifier le serveur${NC}"
    echo "Usage: $0 user@server-ip"
    echo "Exemple: $0 alex@srv506488.hstgr.cloud"
    exit 1
fi

SERVER=$1
REMOTE_DIR="~/blindtest-deployment"

echo -e "${YELLOW}Serveur cible: $SERVER${NC}\n"

# Étape 1 : Build local
echo -e "${GREEN}[1/6] Build des images Docker localement...${NC}"
docker build -t blindtest-api:latest -f apps/api/Dockerfile .
docker build -t blindtest-web:latest -f apps/web/Dockerfile .

# Étape 2 : Export des images
echo -e "${GREEN}[2/6] Export des images Docker...${NC}"
docker save blindtest-api:latest -o blindtest-api.tar
docker save blindtest-web:latest -o blindtest-web.tar
echo -e "${GREEN}✓ Images exportées${NC}\n"

# Étape 3 : Transfert vers le serveur
echo -e "${GREEN}[3/6] Transfert des fichiers vers le serveur...${NC}"
ssh $SERVER "mkdir -p $REMOTE_DIR"

# Transférer les images Docker
echo "Transfert de blindtest-api.tar..."
scp blindtest-api.tar $SERVER:$REMOTE_DIR/

echo "Transfert de blindtest-web.tar..."
scp blindtest-web.tar $SERVER:$REMOTE_DIR/

# Transférer docker-compose
scp docker-compose.prod.yml $SERVER:$REMOTE_DIR/

# Transférer le guide de déploiement
scp DEPLOIEMENT-GUIDE.md $SERVER:$REMOTE_DIR/

echo -e "${GREEN}✓ Fichiers transférés${NC}\n"

# Étape 4 : Chargement des images sur le serveur
echo -e "${GREEN}[4/6] Chargement des images Docker sur le serveur...${NC}"
ssh $SERVER << 'ENDSSH'
cd ~/blindtest-deployment
echo "Chargement de blindtest-api..."
docker load < blindtest-api.tar
echo "Chargement de blindtest-web..."
docker load < blindtest-web.tar
ENDSSH
echo -e "${GREEN}✓ Images chargées${NC}\n"

# Étape 5 : Redémarrage des conteneurs
echo -e "${GREEN}[5/6] Redémarrage des services...${NC}"
ssh $SERVER << 'ENDSSH'
cd ~/docker-services
docker-compose down
docker-compose up -d
ENDSSH
echo -e "${GREEN}✓ Services redémarrés${NC}\n"

# Étape 6 : Exécution des migrations
echo -e "${GREEN}[6/6] Exécution des migrations de base de données...${NC}"
ssh $SERVER << 'ENDSSH'
echo "Attente du démarrage de l'API (10 secondes)..."
sleep 10

echo "Exécution des migrations..."
docker exec blindtest-api npm run migrate:run || {
    echo "⚠️  Les migrations ont échoué. Vérifiez les logs avec:"
    echo "   docker logs blindtest-api"
    exit 0  # Ne pas bloquer le déploiement
}
ENDSSH

# Nettoyage local
echo -e "\n${GREEN}Nettoyage des fichiers temporaires locaux...${NC}"
rm -f blindtest-api.tar blindtest-web.tar

echo -e "\n${GREEN}=== Déploiement terminé avec succès ! ===${NC}"
echo -e "\nVérifications recommandées:"
echo -e "  1. Vérifier les logs: ${YELLOW}ssh $SERVER 'docker logs blindtest-api --tail 50'${NC}"
echo -e "  2. Tester l'API: ${YELLOW}curl https://blindtest.codeharmony.fr/api/health${NC}"
echo -e "  3. Tester l'interface: ${YELLOW}https://blindtest.codeharmony.fr${NC}"
echo -e "\nEn cas de problème, consultez: ${YELLOW}$REMOTE_DIR/DEPLOIEMENT-GUIDE.md${NC}"
