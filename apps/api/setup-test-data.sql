-- Script pour préparer les données de test
-- Email: admin@test.com
-- Password: admin123456

-- 1. Créer l'organisateur de test (si n'existe pas)
INSERT IGNORE INTO organizers (id, email, password_hash, created_at, updated_at)
VALUES (
  999,
  'admin@test.com',
  '$2a$10$XNud3k5wepns7nh5rwEeK.44Z0LruK4.EGabHY6z1IqWToi03SQyC',
  NOW(),
  NOW()
);

-- Vérification
SELECT 'Organisateur créé/vérifié:' as status;
SELECT id, email, created_at FROM organizers WHERE email = 'admin@test.com';

-- Note: L'événement et le round seront créés par le script de test
