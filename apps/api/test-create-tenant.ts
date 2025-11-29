/**
 * Script de test : Créer un nouveau tenant avec plan DEMO
 */
import { AppDataSource } from "./src/db/data-source";
import { TenantService } from "./src/services/tenant.service";

async function testCreateTenant() {
  try {
    console.log("🔌 Connexion à la base de données...");
    await AppDataSource.initialize();
    console.log("✅ Connecté\n");

    const tenantService = new TenantService();

    console.log("📝 Création d'un tenant DEMO...");
    const result = await tenantService.createTenant({
      name: "Test Organization DEMO",
      slug: "test-demo-org",
      ownerEmail: "owner-demo@test.fr",
      ownerPassword: "TestPassword123!",
      ownerName: "Demo Owner",
      plan: "DEMO"
    });

    console.log("\n✅ Tenant créé avec succès !");
    console.log("\n📊 Informations du tenant :");
    console.log({
      id: result.tenant.id,
      name: result.tenant.name,
      slug: result.tenant.slug,
      plan: result.tenant.subscription_plan,
      max_concurrent_events: result.tenant.max_concurrent_events,
      max_players_per_event: result.tenant.max_players_per_event,
      max_users: result.tenant.max_users,
      max_songs_per_event: result.tenant.max_songs_per_event,
      is_active: result.tenant.is_active,
      subscription_status: result.tenant.subscription_status
    });

    console.log("\n👤 Propriétaire créé :");
    console.log({
      id: result.owner.id,
      email: result.owner.email,
      role: result.owner.role,
      display_name: result.owner.display_name,
      is_active: result.owner.is_active
    });

    console.log("\n✅ Test terminé avec succès !");
    process.exit(0);
  } catch (error: any) {
    console.error("\n❌ Erreur lors du test :", error.message);
    console.error(error);
    process.exit(1);
  }
}

testCreateTenant();
