# Script PowerShell pour déployer le fix sur le serveur
# Usage: .\deploy-fix.ps1

Write-Host "🚀 Déploiement du fix pour création d'événements..." -ForegroundColor Cyan

# Vérifier que Git est clean
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "⚠️  Il y a des changements non committés. Veuillez commit avant de déployer." -ForegroundColor Yellow
    git status
    exit 1
}

Write-Host "📤 Push des changements vers le repo Git..." -ForegroundColor Green
git push

Write-Host ""
Write-Host "📋 Instructions de déploiement sur le serveur:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Connectez-vous au serveur:" -ForegroundColor White
Write-Host "   ssh root@blindtest.codeharmony.fr" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Naviguez vers le répertoire du projet:" -ForegroundColor White
Write-Host "   cd /root" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Pullez les derniers changements:" -ForegroundColor White
Write-Host "   git pull" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Reconstruisez et redémarrez l'API:" -ForegroundColor White
Write-Host "   docker-compose down" -ForegroundColor Gray
Write-Host "   docker-compose up -d --build" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Vérifiez les logs:" -ForegroundColor White
Write-Host "   docker logs -f blindtest-api" -ForegroundColor Gray
Write-Host ""
Write-Host "6. Testez la création d'événement:" -ForegroundColor White
Write-Host "   https://blindtest.codeharmony.fr/admin/events/new" -ForegroundColor Gray
Write-Host ""
Write-Host "✅ Changements pushés! Suivez les instructions ci-dessus pour déployer." -ForegroundColor Green
Write-Host ""
Write-Host "📄 Documentation complète disponible dans:" -ForegroundColor Cyan
Write-Host "   FIX-EVENT-CREATION-ERROR-500.md" -ForegroundColor Gray
