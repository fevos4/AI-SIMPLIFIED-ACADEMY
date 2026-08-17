import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export interface SessionPayload {
  userId: string;
  role: string;
  email: string;
}

const COOKIE_NAME = 'elearning_session';
const SIGNUP_VERIFIED_COOKIE = 'signup_verified';
const SECRET_KEY = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'super-secret-jwt-key-at-least-32-characters-long'
);

const USER_SESSION_EXPIRY = '7d';
const ADMIN_SESSION_EXPIRY_SECONDS = 15 * 60; // 15 minutes idle expiry

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

export async function createSession(userId: string, role: string, email: string): Promise<string> {
  const isAdmin = role === 'admin' || role === 'super_admin';
  const expiresIn = isAdmin ? `${ADMIN_SESSION_EXPIRY_SECONDS}s` : USER_SESSION_EXPIRY;
  
  let token = await signToken({ userId, role, email }, expiresIn);
  try {
    const cookieStore = await cookies();
    const isProd = process.env.NODE_ENV === 'production';
    const maxAge = isAdmin ? ADMIN_SESSION_EXPIRY_SECONDS : 7 * 24 * 60 * 60;

    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge,
    });
  } catch (e) {
    // Called outside Next.js request context (e.g. CLI test scripts)
  }

  return token;
}

export async function getSession(req?: NextRequest | Request): Promise<SessionPayload | null> {
  let token: string | undefined;

  if (req) {
    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader.split('; ').find(row => row.startsWith(`${COOKIE_NAME}=`));
    if (match) {
      token = match.split('=')[1];
    }
  } else {
    const cookieStore = await cookies();
    token = cookieStore.get(COOKIE_NAME)?.value;
  }

  if (!token) return null;
  return verifyToken<SessionPayload>(token);
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });
}

export async function refreshAdminSession(response: NextResponse, payload: SessionPayload): Promise<NextResponse> {
  if (payload.role !== 'admin' && payload.role !== 'super_admin') {
    return response;
  }

  const token = await signToken({ userId: payload.userId, role: payload.role, email: payload.email }, `${ADMIN_SESSION_EXPIRY_SECONDS}s`);
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
