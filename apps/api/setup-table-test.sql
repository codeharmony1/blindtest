-- Script SQL pour créer un événement de test avec le mode table activé

-- D'abord, trouvons un tenant existant
SET @tenant_id = (SELECT id FROM tenants LIMIT 1);

-- Si aucun tenant n'existe, en créer un
INSERT INTO tenants (id, name, plan, created_at)
SELECT 'test-tenant-001', 'Test Tenant', 'PRO', NOW()
WHERE NOT EXISTS (SELECT 1 FROM tenants WHERE id = 'test-tenant-001');

SET @tenant_id = 'test-tenant-001';

-- Créer un événement de test avec table_mode activé
INSERT INTO events (
  code,
  name,
  game_mode,
  table_mode,
  status,
  tenant_id,
  created_at
) VALUES (
  'TABLETEST',
  'Test Mode Table',
  'TEAM',
  1,
  'ACTIVE',
  @tenant_id,
  NOW()
) ON DUPLICATE KEY UPDATE
  table_mode = 1,
  status = 'ACTIVE';

SELECT 'Événement TABLETEST créé avec table_mode activé' AS message;
SELECT * FROM events WHERE code = 'TABLETEST';
