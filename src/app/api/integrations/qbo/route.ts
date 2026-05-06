import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'coming_soon',
    message: 'QuickBooks Online integration is coming in a future update.'
  }, { status: 503 });
}

export async function POST() {
  return NextResponse.json({
    status: 'coming_soon',
    message: 'QuickBooks Online integration is coming in a future update.'
  }, { status: 503 });
}
