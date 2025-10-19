#!/bin/bash

# ============================================
# VÉRIFICATION CONFIGURATION PRODUCTION
# ============================================
# Ce script vérifie que toute la configuration
# nécessaire est en place avant le déploiement
# ============================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

echo -e "${BLUE}╔═══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   VÉRIFICATION PRÉ-DÉPLOIEMENT        ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════╝${NC}"
echo ""

# ============================================
# VÉRIFICATION FICHIER .env.production
# ============================================
echo -e "${YELLOW}[1/5] Vérification .env.production...${NC}"

if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ Fichier .env.production manquant${NC}"
    ERRORS=$((ERRORS+1))
else
    echo -e "${GREEN}✅ Fichier .env.production trouvé${NC}"

    # Vérifier variables critiques
    source .env.production

    # NODE_ENV
    if [ "$NODE_ENV" != "production" ]; then
        echo -e "${RED}  ❌ NODE_ENV doit être 'production'${NC}"
        ERRORS=$((ERRORS+1))
    else
        echo -e "${GREEN}  ✅ NODE_ENV=production${NC}"
    fi

    # JWT Secrets
    if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" == "CHANGEZ_MOI"* ]; then
        echo -e "${RED}  ❌ JWT_SECRET non configuré${NC}"
        ERRORS=$((ERRORS+1))
    else
        echo -e "${GREEN}  ✅ JWT_SECRET configuré (${#JWT_SECRET} caractères)${NC}"
    fi

    if [ -z "$JWT_REFRESH_SECRET" ] || [ "$JWT_REFRESH_SECRET" == "CHANGEZ_MOI"* ]; then
        echo -e "${RED}  ❌ JWT_REFRESH_SECRET non configuré${NC}"
        ERRORS=$((ERRORS+1))
    else
        echo -e "${GREEN}  ✅ JWT_REFRESH_SECRET configuré (${#JWT_REFRESH_SECRET} caractères)${NC}"
    fi

    # Database
    if [ -z "$DB_HOST" ] || [ -z "$DB_USER" ] || [ -z "$DB_NAME" ]; then
        echo -e "${RED}  ❌ Configuration DB incomplète${NC}"
        ERRORS=$((ERRORS+1))
    else
        echo -e "${GREEN}  ✅ Configuration DB présente${NC}"
    fi

    if [ -z "$DB_PASS" ] || [ "$DB_PASS" == "CHANGEZ_MOI"* ]; then
        echo -e "${RED}  ❌ DB_PASS non configuré${NC}"
        ERRORS=$((ERRORS+1))
    fi

    # Stripe
    if [[ "$STRIPE_SECRET_KEY" == sk_test_* ]]; then
        echo -e "${YELLOW}  ⚠️  STRIPE_SECRET_KEY en mode TEST (utiliser sk_live_ en prod)${NC}"
        WARNINGS=$((WARNINGS+1))
    elif [[ "$STRIPE_SECRET_KEY" == sk_live_* ]]; then
        echo -e "${GREEN}  ✅ Stripe en mode LIVE${NC}"
    else
        echo -e "${RED}  ❌ STRIPE_SECRET_KEY invalide${NC}"
        ERRORS=$((ERRORS+1))
    fi

    if [ -z "$STRIPE_PRICE_PER_EVENT" ] || [ "$STRIPE_PRICE_PER_EVENT" == "price_CHANGEZ_MOI"* ]; then
        echo -e "${YELLOW}  ⚠️  STRIPE_PRICE_PER_EVENT non configuré (créera dynamiquement)${NC}"
        WARNINGS=$((WARNINGS+1))
    else
        echo -e "${GREEN}  ✅ Stripe Price IDs configurés${NC}"
    fi

    # SMTP
    if [ -z "$SMTP_HOST" ] || [ -z "$SMTP_USER" ] || [ "$SMTP_PASS" == "CHANGEZ_MOI"* ]; then
        echo -e "${YELLOW}  ⚠️  SMTP non configuré (reset password ne fonctionnera pas)${NC}"
        WARNINGS=$((WARNINGS+1))
    else
        echo -e "${GREEN}  ✅ SMTP configuré${NC}"
    fi

    # CORS
    if [[ "$CORS_ORIGIN" == *"localhost"* ]] || [ "$CORS_ORIGIN" == "CHANGEZ_MOI"* ]; then
        echo -e "${RED}  ❌ CORS_ORIGIN doit pointer vers domaine production${NC}"
        ERRORS=$((ERRORS+1))
    else
        echo -e "${GREEN}  ✅ CORS_ORIGIN configuré: $CORS_ORIGIN${NC}"
    fi
fi
echo ""

# ============================================
# VÉRIFICATION DOCKER
# ============================================
echo -e "${YELLOW}[2/5] Vérification Docker...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker non installé${NC}"
    ERRORS=$((ERRORS+1))
else
    DOCKER_VERSION=$(docker --version)
    echo -e "${GREEN}✅ Docker installé: $DOCKER_VERSION${NC}"
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose non installé${NC}"
    ERRORS=$((ERRORS+1))
else
    COMPOSE_VERSION=$(docker-compose --version)
    echo -e "${GREEN}✅ Docker Compose installé: $COMPOSE_VERSION${NC}"
fi
echo ""

# ============================================
# VÉRIFICATION FICHIERS DOCKER
# ============================================
echo -e "${YELLOW}[3/5] Vérification fichiers Docker...${NC}"

if [ ! -f "docker-compose.prod.yml" ]; then
    echo -e "${RED}❌ docker-compose.prod.yml manquant${NC}"
    ERRORS=$((ERRORS+1))
else
    echo -e "${GREEN}✅ docker-compose.prod.yml présent${NC}"
fi

if [ ! -f "apps/api/Dockerfile" ]; then
    echo -e "${RED}❌ apps/api/Dockerfile manquant${NC}"
    ERRORS=$((ERRORS+1))
else
    echo -e "${GREEN}✅ apps/api/Dockerfile présent${NC}"
fi

if [ ! -f "apps/web/Dockerfile" ]; then
    echo -e "${RED}❌ apps/web/Dockerfile manquant${NC}"
    ERRORS=$((ERRORS+1))
else
    echo -e "${GREEN}✅ apps/web/Dockerfile présent${NC}"
fi
echo ""

# ============================================
# VÉRIFICATION PORTS
# ============================================
echo -e "${YELLOW}[4/5] Vérification ports disponibles...${NC}"

check_port() {
    PORT=$1
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Port $PORT déjà utilisé${NC}"
        WARNINGS=$((WARNINGS+1))
    else
        echo -e "${GREEN}✅ Port $PORT disponible${NC}"
    fi
}

check_port 80
check_port 443
check_port 3001
echo ""

# ============================================
# VÉRIFICATION ESPACE DISQUE
# ============================================
echo -e "${YELLOW}[5/5] Vérification espace disque...${NC}"

DISK_USAGE=$(df -h . | awk 'NR==2 {print $5}' | sed 's/%//')

if [ "$DISK_USAGE" -gt 90 ]; then
    echo -e "${RED}❌ Espace disque critique: ${DISK_USAGE}%${NC}"
    ERRORS=$((ERRORS+1))
elif [ "$DISK_USAGE" -gt 80 ]; then
    echo -e "${YELLOW}⚠️  Espace disque limité: ${DISK_USAGE}%${NC}"
    WARNINGS=$((WARNINGS+1))
else
    echo -e "${GREEN}✅ Espace disque OK: ${DISK_USAGE}% utilisé${NC}"
fi
echo ""

# ============================================
# RÉSUMÉ
# ============================================
echo -e "${BLUE}╔═══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   RÉSUMÉ VÉRIFICATION                 ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════╝${NC}"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ Tous les checks passent !${NC}"
    echo -e "${GREEN}   Prêt pour le déploiement${NC}"
    echo ""
    echo "Lancer le déploiement avec:"
    echo -e "  ${BLUE}./deploy.sh production${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  $WARNINGS avertissement(s)${NC}"
    echo -e "${YELLOW}   Vous pouvez déployer, mais vérifiez les warnings ci-dessus${NC}"
    exit 0
else
    echo -e "${RED}❌ $ERRORS erreur(s) trouvée(s)${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠️  $WARNINGS avertissement(s)${NC}"
    fi
    echo ""
    echo "Corriger les erreurs avant de déployer"
    exit 1
fi
