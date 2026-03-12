import { NextResponse } from 'next/server';

export async function GET() {
  // Generate a random 8-digit code (e.g., 1234-5678)
  const code = Math.floor(10000000 + Math.random() * 90000000).toString();
  const formattedCode = `${code.slice(0, 4)}-${code.slice(4)}`;

  return NextResponse.json({ 
    code: formattedCode,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes expiry
  });
}
