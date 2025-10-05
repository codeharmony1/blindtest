# Blindtest (Angular + Node + MariaDB)

- API: Node/Express + Socket.IO + TypeORM (MariaDB)
- Web: Angular (PWA)
- Dev: `npm run dev` (API + Web)

cd "d:\Projet\Blind test musical\apps\api"; npm run dev
cd "d:\Projet\Blind test musical\apps\web"; npm start

Navigation :

- Accueil : http://localhost:4200/
- Admin : http://localhost:4200/admin
- Joueur : http://localhost:4200/join/CODE_EVENT
- DJ : http://localhost:4200/dj/CODE_EVENT
- Affichage : http://localhost:4200/display/CODE_EVENT

URLs d'accès :

- Page d'accueil : http://localhost:4200
- Inscription : http://localhost:4200/auth/register
- Connexion : http://localhost:4200/auth/login
- Admin : http://localhost:4200/admin (nécessite authentification)

🔐 Comptes de test :

Tenant par défaut (pour la démo) :

- Organisation : default
- Email : admin@blindtest.local
- Mot de passe : admin123456

Nouveau tenant créé précédemment :

- Organisation : test-company
- Email : admin@test.com
- Mot de passe : password123

http://localhost:4200/backstage/login
superadmin@blindtest.fr / SuperAdmin2025!
