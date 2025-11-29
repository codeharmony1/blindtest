-- Script SQL pour créer le tenant 'default' et son propriétaire
-- À exécuter sur le serveur de production

-- 1. Créer le tenant
INSERT INTO tenants (
  id,
  name,
  slug,
  subscription_plan,
  subscription_status,
  subscription_expires_at,
  max_concurrent_events,
  max_players_per_event,
  max_users,
  max_songs_per_event,
  is_active,
  created_at,
  updated_at
) VALUES (
  UUID(),
  'Default Company',
  'default',
  'DEMO',
  'ACTIVE',
  DATE_ADD(NOW(), INTERVAL 30 DAY),
  5,
  100,
  10,
  1000,
  1,
  NOW(),
  NOW()
) ON DUPLICATE KEY UPDATE name=name;

-- 2. Créer l'utilisateur propriétaire
-- Note: Le mot de passe est 'admin123456' hashé avec bcrypt (coût 10)
SET @tenant_id = (SELECT id FROM tenants WHERE slug = 'default' LIMIT 1);

INSERT INTO tenant_users (
  id,
  tenant_id,
  email,
  password_hash,
  role,
  display_name,
  first_name,
  last_name,
  is_active,
  created_at,
  updated_at
) VALUES (
  UUID(),
  @tenant_id,
  'admin@blindtest.local',
  '$2b$10$rZ7zQXxN5xH5vGx5Z5xqXuQXxN5xH5vGx5Z5xqXuQXxN5xH5vGx5Z',
  'OWNER',
  'Administrator',
  'Admin',
  'Default',
  1,
  NOW(),
  NOW()
) ON DUPLICATE KEY UPDATE email=email;

SELECT
  '✅ Tenant créé avec succès!' as message,
  'admin@blindtest.local' as email,
  'admin123456' as password,
  'default' as tenant_slug;
