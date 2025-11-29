import Stripe from "stripe";
import * as dotenv from "dotenv";

// Charger les variables d'environnement
dotenv.config();

async function testPortal() {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      console.error("❌ STRIPE_SECRET_KEY not found in .env");
      process.exit(1);
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-12-18.acacia" as any,
    });

    const customerId = "cus_TG9gXA1tVmi3hE"; // ID créé précédemment
    const returnUrl = "http://localhost:4200/admin/billing";

    console.log("🔄 Tentative de création du portail client...");
    console.log(`   Customer ID: ${customerId}`);
    console.log(`   Return URL: ${returnUrl}`);

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    console.log("\n✅ Portail créé avec succès!");
    console.log(`   Session ID: ${session.id}`);
    console.log(`   Portal URL: ${session.url}`);
    console.log(`\n💡 Ouvrez cette URL dans votre navigateur pour tester le portail:`);
    console.log(`   ${session.url}`);

    process.exit(0);
  } catch (error: any) {
    console.error("\n❌ Erreur lors de la création du portail:");
    console.error(`   Message: ${error.message}`);
    console.error(`   Type: ${error.type}`);
    if (error.raw) {
      console.error(`   Code: ${error.raw.code}`);
      console.error(`   Param: ${error.raw.param}`);
    }
    process.exit(1);
  }
}

testPortal();
