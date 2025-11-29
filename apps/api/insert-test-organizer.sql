-- Insertion de l'organisateur de test
-- Email: admin@test.com
-- Password: admin123456

INSERT INTO organizers (email, password_hash, created_at, updated_at)
VALUES (
  'admin@test.com',
  '$2a$10$XNud3k5wepns7nh5rwEeK.44Z0LruK4.EGabHY6z1IqWToi03SQyC',
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE
  password_hash = '$2a$10$XNud3k5wepns7nh5rwEeK.44Z0LruK4.EGabHY6z1IqWToi03SQyC',
  updated_at = NOW();

SELECT * FROM organizers WHERE email = 'admin@test.com';
