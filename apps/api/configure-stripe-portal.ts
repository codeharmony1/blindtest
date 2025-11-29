import Stripe from "stripe";
import * as dotenv from "dotenv";

// Charger les variables d'environnement
dotenv.config();

async function configurePortal() {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      console.error("❌ STRIPE_SECRET_KEY not found in .env");
      process.exit(1);
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-12-18.acacia" as any,
    });

    console.log("🔄 Configuration du portail client Stripe...\n");

    // Créer une configuration de portail (simple - sans subscription_update)
    const configuration = await stripe.billingPortal.configurations.create({
      business_profile: {
        headline: "Gérez votre abonnement Blind Test Musical",
      },
      features: {
        customer_update: {
          enabled: true,
          allowed_updates: ["email", "address", "shipping", "phone", "tax_id"],
        },
        invoice_history: {
          enabled: true,
        },
        payment_method_update: {
          enabled: true,
        },
        subscription_cancel: {
          enabled: true,
          mode: "at_period_end",
          cancellation_reason: {
            enabled: true,
            options: [
              "too_expensive",
              "missing_features",
              "switched_service",
              "unused",
              "customer_service",
              "too_complex",
              "low_quality",
              "other",
            ],
          },
        },
      },
    });

    console.log("✅ Configuration du portail créée avec succès!");
    console.log(`   Configuration ID: ${configuration.id}`);
    console.log(`   Is default: ${configuration.is_default}`);
    console.log(`\n📋 Fonctionnalités activées:`);
    console.log(`   ✅ Mise à jour des informations client`);
    console.log(`   ✅ Historique des factures`);
    console.log(`   ✅ Mise à jour des moyens de paiement`);
    console.log(`   ✅ Annulation d'abonnement`);

    // Tester la création d'une session portail
    console.log(`\n🧪 Test de création d'une session portail...`);
    const customerId = "cus_TG9gXA1tVmi3hE"; // ID créé précédemment

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: "http://localhost:4200/admin/billing",
    });

    console.log(`\n✅ Session portail créée avec succès!`);
    console.log(`   Session ID: ${session.id}`);
    console.log(`   Portal URL: ${session.url}`);
    console.log(`\n💡 Le portail client est maintenant configuré et fonctionnel!`);

    process.exit(0);
  } catch (error: any) {
    console.error("\n❌ Erreur lors de la configuration:");
    console.error(`   Message: ${error.message}`);
    console.error(`   Type: ${error.type}`);
    if (error.raw) {
      console.error(`   Code: ${error.raw.code}`);
      console.error(`   Details:`, error.raw);
    }
    process.exit(1);
  }
}

configurePortal();
