# Script PowerShell pour build et déployer sur le serveur
# Usage: .\deploy-to-server.ps1

$ErrorActionPreference = "Stop"

Write-Host "🚀 Déploiement Blind Test Musical" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan

# Configuration
$SERVER = "alex@srv506488.hstgr.cloud"
$SERVER_PATH = "~/docker-services"
$BUILD_API = $true
$BUILD_WEB = $false  # Mettre à $true si le frontend a changé

# 1. Build l'image API
if ($BUILD_API) {
    Write-Host "`n📦 Build de l'image API..." -ForegroundColor Yellow
    docker build -t blindtest-api:latest -f apps/api/Dockerfile .

    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur lors du build de l'API" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Image API buildée avec succès" -ForegroundColor Green

    Write-Host "`n💾 Sauvegarde de l'image API..." -ForegroundColor Yellow
    docker save blindtest-api:latest -o blindtest-api.tar

    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur lors de la sauvegarde de l'API" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Image API sauvegardée (blindtest-api.tar)" -ForegroundColor Green
}

# 2. Build l'image Web (optionnel)
if ($BUILD_WEB) {
    Write-Host "`n📦 Build de l'image Web..." -ForegroundColor Yellow
    docker build -t blindtest-web:latest -f apps/web/Dockerfile .

    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur lors du build du Web" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Image Web buildée avec succès" -ForegroundColor Green

    Write-Host "`n💾 Sauvegarde de l'image Web..." -ForegroundColor Yellow
    docker save blindtest-web:latest -o blindtest-web.tar

    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur lors de la sauvegarde du Web" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Image Web sauvegardée (blindtest-web.tar)" -ForegroundColor Green
}

# 3. Transfert sur le serveur
Write-Host "`n📤 Transfert sur le serveur..." -ForegroundColor Yellow

if ($BUILD_API) {
    Write-Host "Transfert de blindtest-api.tar..." -ForegroundColor Gray
    scp blindtest-api.tar "${SERVER}:${SERVER_PATH}/"

    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur lors du transfert de l'API" -ForegroundColor Red
        exit 1
    }
}

if ($BUILD_WEB) {
    Write-Host "Transfert de blindtest-web.tar..." -ForegroundColor Gray
    scp blindtest-web.tar "${SERVER}:${SERVER_PATH}/"

    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur lors du transfert du Web" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Transfert terminé" -ForegroundColor Green

# 4. Instructions pour le serveur
Write-Host "`n" -NoNewline
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "✅ BUILD ET TRANSFERT TERMINÉS" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Cyan

Write-Host "`n📋 Prochaines étapes sur le serveur:" -ForegroundColor Yellow
Write-Host ""
Write-Host "ssh $SERVER" -ForegroundColor White
Write-Host "cd $SERVER_PATH" -ForegroundColor White

if ($BUILD_API) {
    Write-Host "docker load -i blindtest-api.tar" -ForegroundColor White
}

if ($BUILD_WEB) {
    Write-Host "docker load -i blindtest-web.tar" -ForegroundColor White
}

Write-Host "docker-compose down" -ForegroundColor White
Write-Host "docker-compose up -d" -ForegroundColor White
Write-Host "docker-compose logs -f api" -ForegroundColor White
Write-Host ""
Write-Host "# Puis exécutez les migrations et créez le compte admin:" -ForegroundColor Gray
Write-Host "docker exec -it blindtest-api npm run migrate:run" -ForegroundColor White
Write-Host 'docker exec -it blindtest-api npx ts-node apps/api/init-production.ts votre@email.com MotDePasse123 "Votre Nom"' -ForegroundColor White

Write-Host "`n💡 Conseil: Copiez-collez ces commandes dans votre terminal SSH" -ForegroundColor Cyan
Write-Host ""

# Nettoyage optionnel
$cleanup = Read-Host "`nVoulez-vous supprimer les fichiers .tar locaux ? (o/N)"
if ($cleanup -eq "o" -or $cleanup -eq "O") {
    if ($BUILD_API -and (Test-Path "blindtest-api.tar")) {
        Remove-Item "blindtest-api.tar"
        Write-Host "✅ blindtest-api.tar supprimé" -ForegroundColor Green
    }
    if ($BUILD_WEB -and (Test-Path "blindtest-web.tar")) {
        Remove-Item "blindtest-web.tar"
        Write-Host "✅ blindtest-web.tar supprimé" -ForegroundColor Green
    }
}

Write-Host "`n🎉 Script terminé !" -ForegroundColor Green
