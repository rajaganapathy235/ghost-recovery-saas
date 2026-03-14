import { prisma } from './src/lib/prisma';

async function diagnose() {
  try {
    console.log("Checking database connection...");
    await prisma.$connect();
    console.log("Connected successfully.");

    console.log("\nListing all tables...");
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log("Tables in database:", JSON.stringify(tables, null, 2));

    const checkTable = async (name: string) => {
      console.log(`\nChecking structure of table: ${name}...`);
      const columns = await prisma.$queryRawUnsafe(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = '${name}'
        ORDER BY column_name
      `);
      console.log(`Columns in ${name}:`, JSON.stringify(columns, null, 2));
    };

    await checkTable('Business');
    await checkTable('business');

  } catch (err: any) {
    console.error("Diagnosis Failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

diagnose();
