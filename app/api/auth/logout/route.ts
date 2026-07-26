import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  cookies().delete('session');
  
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  const protocol = req.headers.get('x-forwarded-proto') || 'http';
  
  let baseUrl = req.url;
  if (host) {
    baseUrl = `${protocol}://${host}`;
  }
  
  return NextResponse.redirect(new URL('/', baseUrl));
}
