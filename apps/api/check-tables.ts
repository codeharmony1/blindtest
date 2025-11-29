import { AppDataSource } from "./src/db/data-source";

async function checkTables() {
  try {
    await AppDataSource.initialize();
    console.log("✅ Connected to database");

    const tables = await AppDataSource.query("SHOW TABLES");
    console.log("\n📋 Tables dans la base de données:");
    tables.forEach((row: any) => {
      const tableName = Object.values(row)[0];
      console.log(`  - ${tableName}`);
    });

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

checkTables();
