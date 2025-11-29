@echo off
echo.
echo ====================================
echo Test de l'API Super-Admin
echo ====================================
echo.

REM 1. Test de connexion super-admin
echo 1. Test de connexion super-admin...
curl -X POST http://localhost:3001/api/backstage/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@blindtest.local\",\"password\":\"admin123456\"}" ^
  -o login-response.json

echo.
type login-response.json
echo.
echo.

REM Extraire le token (simplifié pour Windows)
for /f "tokens=2 delims=:," %%a in ('findstr /C:"token" login-response.json') do set TOKEN=%%a
set TOKEN=%TOKEN:"=%
set TOKEN=%TOKEN: =%

echo Token recupere (debut): %TOKEN:~0,30%...
echo.

REM 2. Test des statistiques globales
echo 2. Test des statistiques globales...
curl -X GET http://localhost:3001/api/backstage/stats ^
  -H "Authorization: Bearer %TOKEN%"
echo.
echo.

REM 3. Test de la liste des tenants
echo 3. Test de la liste des tenants...
curl -X GET http://localhost:3001/api/backstage/tenants ^
  -H "Authorization: Bearer %TOKEN%"
echo.
echo.

REM 4. Test des evenements en direct
echo 4. Test des evenements en direct...
curl -X GET http://localhost:3001/api/backstage/events/live ^
  -H "Authorization: Bearer %TOKEN%"
echo.
echo.

REM Cleanup
del login-response.json

echo.
echo ====================================
echo Tests termines
echo ====================================
