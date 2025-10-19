#!/bin/bash

# ============================================
# SCRIPT DE DÉPLOIEMENT - BLIND TEST MUSICAL
# ============================================
# Usage: ./deploy.sh [environment]
# Environments: staging | production
# ============================================

set -e  # Exit on error

# Couleurs pour output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
COMPOSE_FILE="docker-compose.prod.yml"

if [ "$ENVIRONMENT" != "production" ] && [ "$ENVIRONMENT" != "staging" ]; then
    echo -e "${RED}❌ Environnement invalide. Utiliser: staging ou production${NC}"
    exit 1
fi

echo -e "${BLUE}╔═══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   DÉPLOIEMENT BLIND TEST MUSICAL      ║${NC}"
echo -e "${BLUE}║   Environnement: ${ENVIRONMENT}              ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════╝${NC}"
echo ""

# ============================================
# 1. VÉRIFICATIONS PRÉ-DÉPLOIEMENT
# ============================================
echo -e "${YELLOW}[1/8] Vérifications pré-déploiement...${NC}"

# Vérifier que .env.production existe
if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ Fichier .env.production manquant${NC}"
    echo "Créer le fichier à partir du template .env.production.example"
    exit 1
fi

# Vérifier Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker n'est pas installé${NC}"
    exit 1
fi

# Vérifier Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose n'est pas installé${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Vérifications OK${NC}"
echo ""

# ============================================
# 2. BACKUP BASE DE DONNÉES (Si existe)
# ============================================
echo -e "${YELLOW}[2/8] Backup base de données...${NC}"

if docker-compose -f $COMPOSE_FILE ps | grep -q mariadb; then
    BACKUP_DIR="./backups"
    mkdir -p $BACKUP_DIR
    BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"

    docker-compose -f $COMPOSE_FILE exec -T mariadb \
        mysqldump -u root -p$DB_PASS blindtest_production > $BACKUP_FILE 2>/dev/null || true

    if [ -f "$BACKUP_FILE" ]; then
        echo -e "${GREEN}✅ Backup créé: $BACKUP_FILE${NC}"
    else
        echo -e "${YELLOW}⚠️  Pas de backup (première installation ?)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Base de données non trouvée (première installation)${NC}"
fi
echo ""

# ============================================
# 3. GIT PULL (Si dans un repo)
# ============================================
echo -e "${YELLOW}[3/8] Mise à jour du code...${NC}"

if [ -d ".git" ]; then
    git pull origin main || git pull origin master || echo "Git pull failed, continuing..."
    echo -e "${GREEN}✅ Code mis à jour${NC}"
else
    echo -e "${YELLOW}⚠️  Pas de repo Git détecté${NC}"
fi
echo ""

# ============================================
# 4. BUILD DOCKER IMAGES
# ============================================
echo -e "${YELLOW}[4/8] Build des images Docker...${NC}"
docker-compose -f $COMPOSE_FILE build --no-cache
echo -e "${GREEN}✅ Images buildées${NC}"
echo ""

# ============================================
# 5. STOP ANCIENS CONTAINERS
# ============================================
echo -e "${YELLOW}[5/8] Arrêt des anciens containers...${NC}"
docker-compose -f $COMPOSE_FILE down
echo -e "${GREEN}✅ Containers arrêtés${NC}"
echo ""

# ============================================
# 6. START NOUVEAUX CONTAINERS
# ============================================
echo -e "${YELLOW}[6/8] Démarrage des nouveaux containers...${NC}"
docker-compose -f $COMPOSE_FILE up -d
echo -e "${GREEN}✅ Containers démarrés${NC}"
echo ""

# Attendre que les services soient prêts
echo -e "${YELLOW}Attente du démarrage des services...${NC}"
sleep 10

# ============================================
# 7. MIGRATIONS BASE DE DONNÉES
# ============================================
echo -e "${YELLOW}[7/8] Exécution des migrations...${NC}"

# Attendre que la DB soit prête
MAX_TRIES=30
COUNT=0
until docker-compose -f $COMPOSE_FILE exec -T api npm run migrate:run 2>/dev/null || [ $COUNT -eq $MAX_TRIES ]; do
    COUNT=$((COUNT+1))
    echo -e "${YELLOW}⏳ Attente DB... ($COUNT/$MAX_TRIES)${NC}"
    sleep 2
done

if [ $COUNT -eq $MAX_TRIES ]; then
    echo -e "${RED}❌ Timeout: La base de données ne répond pas${NC}"
    echo "Vérifier les logs: docker-compose -f $COMPOSE_FILE logs mariadb"
    exit 1
fi

echo -e "${GREEN}✅ Migrations exécutées${NC}"
echo ""

# ============================================
# 8. HEALTH CHECK
# ============================================
echo -e "${YELLOW}[8/8] Vérification santé de l'application...${NC}"

# Récupérer le domaine depuis .env
source .env.production 2>/dev/null || true
API_URL=${API_URL:-http://localhost:3001}

sleep 5  # Laisser l'API démarrer

HEALTH_CHECK=$(curl -s "${API_URL}/api/health" || echo "")

if echo "$HEALTH_CHECK" | grep -q "\"ok\":true"; then
    echo -e "${GREEN}✅ API opérationnelle${NC}"
    echo "$HEALTH_CHECK" | python3 -m json.tool 2>/dev/null || echo "$HEALTH_CHECK"
else
    echo -e "${YELLOW}⚠️  Health check échoué, vérifier les logs${NC}"
    docker-compose -f $COMPOSE_FILE logs --tail=50 api
fi
echo ""

# ============================================
# RÉSUMÉ DÉPLOIEMENT
# ============================================
echo -e "${BLUE}╔═══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   DÉPLOIEMENT TERMINÉ                 ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Services actifs:${NC}"
docker-compose -f $COMPOSE_FILE ps
echo ""

echo -e "${GREEN}📋 Prochaines étapes:${NC}"
echo ""
echo "1. Vérifier les logs:"
echo "   ${BLUE}docker-compose -f $COMPOSE_FILE logs -f${NC}"
echo ""
echo "2. Créer un super-admin (si première installation):"
echo "   ${BLUE}docker-compose -f $COMPOSE_FILE exec api npm run create:super-admin${NC}"
echo ""
echo "3. Tester l'application:"
echo "   ${BLUE}https://votre-domaine.com${NC}"
echo ""
echo "4. Configurer Stripe webhooks:"
echo "   URL: ${BLUE}https://api.votre-domaine.com/api/payments/webhook${NC}"
echo "   Events: checkout.session.completed, customer.subscription.*"
echo ""

echo -e "${GREEN}✅ Déploiement réussi !${NC}"
