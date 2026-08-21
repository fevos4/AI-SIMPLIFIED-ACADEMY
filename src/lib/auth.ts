import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

export interface SessionPayload {
  userId: string;
  role: string;
  email: string;
  sessionId: string;
}

export const COOKIE_NAME = 'elearning_session';
export const SESSION_TOKEN_COOKIE = 'elearning_session_token';
const SIGNUP_VERIFIED_COOKIE = 'signup_verified';
const SECRET_KEY = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'super-secret-jwt-key-at-least-32-characters-long'
);

const USER_SESSION_EXPIRY = '7d';
const ADMIN_SESSION_EXPIRY_SECONDS = 15 * 60; // 15 minutes idle expiry

export function parseUserAgent(uaString?: string | null): string {
  if (!uaString) return 'Unknown Device';
  let browser = 'Browser';
  if (uaString.includes('Firefox/')) browser = 'Firefox';
  else if (uaString.includes('Edg/')) browser = 'Edge';
  else if (uaString.includes('Chrome/')) browser = 'Chrome';
  else if (uaString.includes('Safari/')) browser = 'Safari';

  let os = 'Unknown OS';
  if (uaString.includes('Windows')) os = 'Windows';
  else if (uaString.includes('Mac OS')) os = 'macOS';
  else if (uaString.includes('Android')) os = 'Android';
  else if (uaString.includes('iPhone') || uaString.includes('iPad')) os = 'iOS';
  else if (uaString.includes('Linux')) os = 'Linux';

  return `${browser} on ${os}`;
}

export function getClientIpFromReq(req?: NextRequest | Request): string | null {
  if (!req) return null;
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return null;
}

export async function signToken(payload: Record<string, any>, expiresIn: string | number): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(SECRET_KEY);
}

export async function verifyToken<T = Record<string, any>>(token: string): Promise<T | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as T;
  } catch (err) {
    return null;
  }
}

export async function createSession(
  userId: string,
  role: string,
  email: string,
  req?: NextRequest | Request
): Promise<{ token: string; sessionToken: string; sessionId: string }> {
  const isAdmin = role === 'admin' || role === 'super_admin';
  const maxAge = isAdmin ? ADMIN_SESSION_EXPIRY_SECONDS : 7 * 24 * 60 * 60;
  const expiresIn = isAdmin ? `${ADMIN_SESSION_EXPIRY_SECONDS}s` : USER_SESSION_EXPIRY;

  const rawSessionToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawSessionToken).digest('hex');
  const expiresAt = new Date(Date.now() + maxAge * 1000);

  let deviceHint = 'Unknown Device';
  let ipAddress: string | null = null;

  if (req) {
    deviceHint = parseUserAgent(req.headers.get('user-agent'));
    ipAddress = getClientIpFromReq(req);
  } else {
    try {
      const headersList = await import('next/headers').then(m => m.headers());
      deviceHint = parseUserAgent(headersList.get('user-agent'));
      const forwarded = headersList.get('x-forwarded-for');
      ipAddress = forwarded ? forwarded.split(',')[0].trim() : headersList.get('x-real-ip');
    } catch (e) {}
  }

  const userSession = await prisma.userSession.create({
    data: {
      user_id: userId,
      token_hash: tokenHash,
      device_hint: deviceHint,
      ip_address: ipAddress,
      expires_at: expiresAt,
    },
  });

  const sessionId = userSession.id;
  const jwtToken = await signToken({ userId, role, email, sessionId }, expiresIn);

  try {
    const cookieStore = await cookies();
    const isProd = process.env.NODE_ENV === 'production';

    cookieStore.set(COOKIE_NAME, jwtToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge,
    });

    cookieStore.set(SESSION_TOKEN_COOKIE, rawSessionToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge,
    });
  } catch (e) {
    // Called outside Next.js request context (e.g. CLI test scripts)
  }

  return { token: jwtToken, sessionToken: rawSessionToken, sessionId };
}

export async function getJwtSession(req?: NextRequest | Request): Promise<SessionPayload | null> {
  let token: string | undefined;

  if (req) {
    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader.split('; ').find(row => row.startsWith(`${COOKIE_NAME}=`));
    if (match) {
      token = match.split('=')[1];
    }
  } else {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(COOKIE_NAME)?.value;
    } catch (e) {}
  }

  if (!token) return null;
  return verifyToken<SessionPayload>(token);
}

export async function getSession(req?: NextRequest | Request): Promise<SessionPayload | null> {
  let token: string | undefined;
  let rawSessionToken: string | undefined;

  if (req) {
    const cookieHeader = req.headers.get('cookie') || '';
    const cookiesParsed = Object.fromEntries(
      cookieHeader.split('; ').filter(Boolean).map(c => {
        const [k, ...v] = c.split('=');
        return [k, v.join('=')];
      })
    );
    token = cookiesParsed[COOKIE_NAME];
    rawSessionToken = cookiesParsed[SESSION_TOKEN_COOKIE];
  } else {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(COOKIE_NAME)?.value;
      rawSessionToken = cookieStore.get(SESSION_TOKEN_COOKIE)?.value;
    } catch (e) {}
  }

  if (!token) return null;
  const payload = await verifyToken<SessionPayload>(token);
  if (!payload || !payload.sessionId) return null;

  if (!rawSessionToken) return null;

  const sessionRecord = await prisma.userSession.findUnique({
    where: { id: payload.sessionId },
  });

  if (!sessionRecord || sessionRecord.expires_at < new Date()) {
    return null;
  }

  const incomingHash = crypto.createHash('sha256').update(rawSessionToken).digest('hex');
  const hashA = Buffer.from(incomingHash, 'utf-8');
  const hashB = Buffer.from(sessionRecord.token_hash, 'utf-8');

  if (hashA.length !== hashB.length || !crypto.timingSafeEqual(hashA, hashB)) {
    return null;
  }

  // Update last_used_at
  await prisma.userSession.update({
    where: { id: payload.sessionId },
    data: { last_used_at: new Date() },
  }).catch(() => {});

  return payload;
}

export async function destroySession(req?: NextRequest | Request): Promise<void> {
  const session = await getSession(req).catch(() => null);
  if (session?.sessionId) {
    await prisma.userSession.delete({
      where: { id: session.sessionId },
    }).catch(() => {});
  }

  try {
    const cookieStore = await cookies();
    const isProd = process.env.NODE_ENV === 'production';
    cookieStore.set(COOKIE_NAME, '', {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    });
    cookieStore.set(SESSION_TOKEN_COOKIE, '', {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    });
  } catch (e) {}
}

export async function refreshAdminSession(response: NextResponse, payload: SessionPayload): Promise<NextResponse> {
  if (payload.role !== 'admin' && payload.role !== 'super_admin') {
    return response;
  }

  const token = await signToken(
    { userId: payload.userId, role: payload.role, email: payload.email, sessionId: payload.sessionId },
    `${ADMIN_SESSION_EXPIRY_SECONDS}s`
  );
  const isProd = process.env.NODE_ENV === 'production';

  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: ADMIN_SESSION_EXPIRY_SECONDS,
  });

  return response;
}

export async function cleanupExpiredSessions(): Promise<number> {
  const result = await prisma.userSession.deleteMany({
    where: {
      expires_at: {
        lt: new Date(),
      },
    },
  });
  return result.count;
}

export async function createOtpVerifiedToken(email: string): Promise<string> {
  return signToken({ email: email.trim().toLowerCase(), purpose: 'otp_verified_pending_password' }, '15m');
}

export async function verifyOtpVerifiedToken(token: string): Promise<{ email: string } | null> {
  const payload = await verifyToken<{ email: string; purpose: string }>(token);
  if (!payload || payload.purpose !== 'otp_verified_pending_password') {
    return null;
  }
  return { email: payload.email };
}

export async function setSignupVerifiedCookie(email: string): Promise<string> {
  const token = await createOtpVerifiedToken(email);
  try {
    const cookieStore = await cookies();
    const isProd = process.env.NODE_ENV === 'production';
    cookieStore.set(SIGNUP_VERIFIED_COOKIE, token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60, // 15 minutes
    });
  } catch (e) {}
  return token;
}

export async function getSignupVerifiedEmail(req?: NextRequest | Request): Promise<string | null> {
  let token: string | undefined;

  if (req) {
    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader.split('; ').find(row => row.startsWith(`${SIGNUP_VERIFIED_COOKIE}=`));
    if (match) {
      token = match.split('=')[1];
    }
  } else {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(SIGNUP_VERIFIED_COOKIE)?.value;
    } catch (e) {}
  }

  if (!token) return null;
  const verified = await verifyOtpVerifiedToken(token);
  return verified ? verified.email : null;
}

export async function clearSignupVerifiedCookie(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.set(SIGNUP_VERIFIED_COOKIE, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    });
  } catch (e) {}
}
