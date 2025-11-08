/**
 * Google OAuth 2.0 콜백 API
 * - 인증 코드를 받아서 액세스 토큰으로 교환
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  // 에러 처리
  if (error) {
    return NextResponse.redirect(
      new URL(`/?google_auth_error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/?google_auth_error=no_code', request.url)
    );
  }

  try {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${request.nextUrl.origin}/api/auth/google/callback`;

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials not configured');
    }

    // 인증 코드를 액세스 토큰으로 교환
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', errorData);
      throw new Error('Failed to exchange token');
    }

    const tokens = await tokenResponse.json();

    // 성공 페이지로 리디렉션 (토큰은 프론트엔드에서 처리)
    const successUrl = new URL('/', request.url);
    successUrl.searchParams.set('google_auth_success', 'true');
    successUrl.searchParams.set('access_token', tokens.access_token);
    if (tokens.refresh_token) {
      successUrl.searchParams.set('refresh_token', tokens.refresh_token);
    }

    return NextResponse.redirect(successUrl);
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/?google_auth_error=server_error', request.url)
    );
  }
}
