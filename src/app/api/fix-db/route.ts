import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log("API Bridge: Executing SQL fixes on Supabase...");

    const sql = `
      -- 1. Add missing columns to Business
      ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "whatsappNumber" TEXT;
      ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "pushSubscription" TEXT;
      
      -- 2. Ensure Service table has required timestamps
      ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
      ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    `;

    // Execute multiple statements
    // PostgreSQL allows multiple statements in a single executeRaw if separated by semicolons
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "whatsappNumber" TEXT;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "pushSubscription" TEXT;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    `);

    return NextResponse.json({ 
      success: true, 
      message: "SQL SCHEMA SYNC SUCCESSFUL. Business and Service tables are now up to date."
    });
  } catch (err: any) {
    console.error("API Bridge Failed:", err.message);
    return NextResponse.json({ 
      success: false, 
      error: err.message,
      hint: "Make sure DATABASE_URL is correct and Supabase project is active."
    }, { status: 500 });
  }
}
