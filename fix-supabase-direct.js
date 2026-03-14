const { Client } = require('pg');

// Using Port 6543 (Pooler) to bypass IPv6 direct connection issues
const connectionString = "postgresql://postgres.qazqsxpwidviarnkxbgw:GhostRecovery2026!@db.qazqsxpwidviarnkxbgw.supabase.co:6543/postgres?pgbouncer=true";

async function fixSchema() {
  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log("Connecting directly to Supabase...");
    await client.connect();
    console.log("Connected! Applying schema fixes...");

    const sql = `
      -- 1. Add missing columns to Business
      ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "whatsappNumber" TEXT;
      ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "pushSubscription" TEXT;
      
      -- 2. Ensure Service table has required timestamps
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Service' AND column_name='createdAt') THEN
          ALTER TABLE "Service" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Service' AND column_name='updatedAt') THEN
          ALTER TABLE "Service" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
        END IF;
      END $$;

      -- 3. Verify changes
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE table_name IN ('Business', 'Service') 
      AND column_name IN ('whatsappNumber', 'pushSubscription', 'createdAt', 'updatedAt');
    `;

    const res = await client.query(sql);
    console.log("SQL executed successfully.");
    console.table(res[res.length - 1].rows);

  } catch (err) {
    console.error("Failed to fix schema directly:", err.message);
    if (err.message.includes('ECONNREFUSED')) {
      console.error("\nCRITICAL: Connection refused. This usually means the local network or a firewall is blocking port 5432.");
    }
  } finally {
    await client.end();
  }
}

fixSchema();
