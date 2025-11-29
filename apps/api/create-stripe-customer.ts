import { AppDataSource } from "./src/db/data-source";
import { Tenant } from "./src/db/entities/Tenant";
import Stripe from "stripe";
import * as dotenv from "dotenv";

// Charger les variables d'environnement
dotenv.config();

async function createStripeCustomer() {
  try {
    await AppDataSource.initialize();
    console.log("✅ Connected to database");

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      console.error("❌ STRIPE_SECRET_KEY not found in .env");
      process.exit(1);
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-12-18.acacia" as any,
    });

    const tenantRepo = AppDataSource.getRepository(Tenant);

    // Chercher le tenant default
    const defaultTenant = await tenantRepo.findOne({ where: { slug: "default" } });

    if (!defaultTenant) {
      console.log("❌ Tenant 'default' introuvable");
      process.exit(1);
    }

    console.log(`\n📋 Tenant trouvé: ${defaultTenant.name} (ID: ${defaultTenant.id})`);

    // Vérifier si un client Stripe existe déjà
    if (defaultTenant.stripe_customer_id) {
      console.log(`\n⚠️  Un client Stripe existe déjà: ${defaultTenant.stripe_customer_id}`);
      console.log("Voulez-vous le remplacer ? (Ctrl+C pour annuler)");
    }

    // Créer un client Stripe de test
    console.log("\n🔄 Création du client Stripe de test...");

    const customerData: any = {
      email: defaultTenant.billing_email || "admin@blindtest.local",
      name: defaultTenant.name,
      metadata: {
        tenant_id: defaultTenant.id,
        tenant_slug: defaultTenant.slug,
      },
      description: `Client de test pour ${defaultTenant.name}`,
    };

    const customer = await stripe.customers.create(customerData);

    console.log(`✅ Client Stripe créé: ${customer.id}`);

    // Mettre à jour le tenant avec l'ID du client
    defaultTenant.stripe_customer_id = customer.id;
    await tenantRepo.save(defaultTenant);

    console.log("\n✅ Tenant mis à jour avec le client Stripe");

    console.log("\n📋 Informations finales:");
    console.log(`   Tenant: ${defaultTenant.name}`);
    console.log(`   Stripe Customer ID: ${customer.id}`);
    console.log(`   Email: ${customer.email}`);
    console.log(`\n💡 Vous pouvez maintenant accéder au portail client depuis /admin/billing`);

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

createStripeCustomer();
