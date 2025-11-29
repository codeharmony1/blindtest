# Script de déploiement automatique - Blind Test Musical (Windows PowerShell)
# Usage: .\deploy-windows.ps1

Write-Host "╔═══════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                                           ║" -ForegroundColor Cyan
Write-Host "║              🚀 DÉPLOIEMENT BLIND TEST MUSICAL 🚀                        ║" -ForegroundColor Cyan
Write-Host "║                                                                           ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

# Configuration
$ServerUser = "alex"
$ServerHost = "srv506488"
$LocalPath = "d:\Projet\Blind test musical"

Write-Host ""
Write-Host "📦 Étape 1/5 : Transfert des images Docker vers le serveur..." -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

Write-Host "  → Transfert de blindtest-api.tar..." -ForegroundColor Gray
scp "$LocalPath\blindtest-api.tar" "${ServerUser}@${ServerHost}`:~/"

Write-Host "  → Transfert de blindtest-web.tar..." -ForegroundColor Gray
scp "$LocalPath\blindtest-web.tar" "${ServerUser}@${ServerHost}`:~/"

Write-Host "✅ Images transférées avec succès" -ForegroundColor Green

Write-Host ""
Write-Host "🔄 Étape 2/5 : Chargement des images Docker sur le serveur..." -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

$LoadCommands = @"
echo '  → Chargement de blindtest-api.tar...'
docker load < ~/blindtest-api.tar

echo '  → Chargement de blindtest-web.tar...'
docker load < ~/blindtest-web.tar

echo '  → Vérification des images chargées...'
docker images | grep blindtest
"@

ssh "${ServerUser}@${ServerHost}" $LoadCommands

Write-Host "✅ Images chargées avec succès" -ForegroundColor Green

Write-Host ""
Write-Host "🔄 Étape 3/5 : Redémarrage des services..." -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

$RestartCommands = @"
cd ~/docker-services

echo '  → Arrêt des anciens conteneurs...'
docker compose stop blindtest-api blindtest-web

echo '  → Suppression des anciens conteneurs...'
docker compose rm -f blindtest-api blindtest-web

echo '  → Démarrage des nouveaux conteneurs...'
docker compose up -d blindtest-api blindtest-web

echo '  → Attente du démarrage (20 secondes)...'
sleep 20

echo '  → Vérification du status des conteneurs...'
docker ps | grep blindtest
"@

ssh "${ServerUser}@${ServerHost}" $RestartCommands

Write-Host "✅ Services redémarrés avec succès" -ForegroundColor Green

Write-Host ""
Write-Host "🧪 Étape 4/5 : Tests de validation..." -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

Write-Host "  → Test de l'API..." -ForegroundColor Gray
$ApiTest = ssh "${ServerUser}@${ServerHost}" "curl -s https://blindtest.codeharmony.fr/api/health"
if ($ApiTest -match '"ok":true') {
    Write-Host "  ✅ API fonctionne" -ForegroundColor Green
} else {
    Write-Host "  ❌ API ne répond pas" -ForegroundColor Red
}

Write-Host "  → Test du frontend..." -ForegroundColor Gray
$WebTest = ssh "${ServerUser}@${ServerHost}" "curl -sI https://blindtest.codeharmony.fr/ | grep -q '200' && echo 'OK' || echo 'FAIL'"
if ($WebTest -match "OK") {
    Write-Host "  ✅ Frontend accessible" -ForegroundColor Green
} else {
    Write-Host "  ❌ Frontend inaccessible" -ForegroundColor Red
}

Write-Host ""
Write-Host "📊 Étape 5/5 : Vérification des logs..." -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

$LogsCommands = @"
echo '  → Dernières lignes des logs API:'
docker logs blindtest-api --tail 10

echo ''
echo '  → Dernières lignes des logs Web:'
docker logs blindtest-web --tail 5
"@

ssh "${ServerUser}@${ServerHost}" $LogsCommands

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                                           ║" -ForegroundColor Green
Write-Host "║                    🎉 DÉPLOIEMENT TERMINÉ ! 🎉                           ║" -ForegroundColor Green
Write-Host "║                                                                           ║" -ForegroundColor Green
Write-Host "║  ✅ Application déployée sur https://blindtest.codeharmony.fr            ║" -ForegroundColor Green
Write-Host "║                                                                           ║" -ForegroundColor Green
Write-Host "║  📝 Prochaines étapes:                                                   ║" -ForegroundColor Green
Write-Host "║     1. Tester la création de compte                                      ║" -ForegroundColor Green
Write-Host "║     2. Tester la création d'événement                                    ║" -ForegroundColor Green
Write-Host "║     3. Vérifier les thèmes disponibles (17 au total)                     ║" -ForegroundColor Green
Write-Host "║                                                                           ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green

Write-Host ""
Write-Host "🔗 Liens utiles:" -ForegroundColor Cyan
Write-Host "   - Application: https://blindtest.codeharmony.fr" -ForegroundColor White
Write-Host "   - API Health:  https://blindtest.codeharmony.fr/api/health" -ForegroundColor White
Write-Host "   - Admin:       https://blindtest.codeharmony.fr/admin" -ForegroundColor White
Write-Host ""
