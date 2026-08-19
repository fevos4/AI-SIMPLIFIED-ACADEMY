'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import PublicNavbar from '@/components/PublicNavbar';
import Footer from '@/components/Footer';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const callbackUrl = searchParams.get('callbackUrl');

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 State
  const [email, setEmail] = useState('');
  const [step1Error, setStep1Error] = useState<string | null>(null);
  const [step1Loading, setStep1Loading] = useState(false);

  // Step 2 State
  const [otpToken, setOtpToken] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const otpInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];
  const [step2Error, setStep2Error] = useState<string | null>(null);
  const [step2Loading, setStep2Loading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  // Step 3 State
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step3Error, setStep3Error] = useState<string | null>(null);
  const [step3Loading, setStep3Loading] = useState(false);

  // Auto-fill email from URL param
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  // Resend Timer Countdown
  useEffect(() => {
    let interval: any;
    if (step === 2 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  // Step 1: Initiate Signup
  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStep1Loading(true);
    setStep1Error(null);

    try {
      const res = await fetch('/api/auth/signup/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (res.ok) {
        setStep(2);
        setResendTimer(60);
        setTimeout(() => otpInputRefs[0].current?.focus(), 100);
      } else {
        if (data.error && data.error.toLowerCase().includes('already exists')) {
          setStep1Error('Account exists. Log in?');
        } else {
          setStep1Error(data.error || 'Failed to send OTP code.');
        }
      }
    } catch {
      setStep1Error('An unexpected error occurred. Please try again.');
    } finally {
      setStep1Loading(false);
    }
  };

  // OTP Digit Change Handler
  const handleOtpDigitChange = (index: number, value: string) => {
    const char = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = char;
    setOtpDigits(newDigits);

    if (char && index < 5) {
      otpInputRefs[index + 1].current?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs[index - 1].current?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || '';
      }
      setOtpDigits(newDigits);
      const nextFocus = Math.min(pasted.length, 5);
      otpInputRefs[nextFocus].current?.focus();
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otpDigits.join('');
    if (otpCode.length !== 6) {
      setStep2Error('Please enter the complete 6-digit OTP code.');
      return;
    }

    setStep2Loading(true);
    setStep2Error(null);

    try {
      const res = await fetch('/api/auth/signup/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp_code: otpCode }),
      });
      const data = await res.json();

      if (res.ok) {
        if (data.otp_token) setOtpToken(data.otp_token);
        setStep(3);
      } else {
        setStep2Error(data.error || 'Invalid or expired OTP code.');
      }
    } catch {
      setStep2Error('Verification failed. Please try again.');
    } finally {
      setStep2Loading(false);
    }
  };

  // Step 2: Resend OTP
  const handleResendOtp = async () => {
    if (resendTimer > 0 || resending) return;

    setResending(true);
    setResendMessage(null);
    setStep2Error(null);

    try {
      const res = await fetch('/api/auth/signup/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (res.ok) {
        setResendMessage('A new OTP code has been sent to your email!');
        setResendTimer(60);
      } else {
        setStep2Error(data.error || 'Failed to resend OTP.');
      }
    } catch {
      setStep2Error('Resend failed. Please try again.');
    } finally {
      setResending(false);
    }
  };

  // Step 3: Complete Signup
  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setStep3Error('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setStep3Error('Passwords do not match.');
      return;
    }

    setStep3Loading(true);
    setStep3Error(null);

    try {
      const res = await fetch('/api/auth/signup/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim(),
          password,
          confirm_password: confirmPassword,
          otp_token: otpToken || 'cookie',
        }),
      });
      const data = await res.json();

      if (res.ok) {
        const dest = callbackUrl || '/dashboard';
        router.push(dest);
      } else {
        setStep3Error(data.error || 'Failed to create account.');
      }
    } catch {
      setStep3Error('Account creation failed. Please try again.');
    } finally {
      setStep3Loading(false);
    }
  };

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { text: '', color: '', percent: 0 };
    if (pwd.length < 8) return { text: 'Weak (min 8 chars)', color: '#A63A2C', percent: 33 };
    if (pwd.match(/[A-Z]/) && pwd.match(/[0-9]/)) return { text: 'Strong', color: '#191510', percent: 100 };
    return { text: 'Medium', color: '#9A9284', percent: 66 };
  };

  const strength = getPasswordStrength(password);

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'IBM Plex Sans', sans-serif", color: '#191510' }}>
      <PublicNavbar />

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 1.5rem 3rem 1.5rem' }}>
        <div
          style={{
            width: '100%',
            maxWidth: '460px',
            backgroundColor: '#FFFFFF',
            borderRadius: '0px',
            border: '1px solid rgba(25, 21, 16, 0.2)',
            padding: '2.5rem 2rem',
          }}
        >
          {/* Progress Indicator */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#A63A2C', textTransform: 'uppercase', fontFamily: "'IBM Plex Sans', sans-serif", letterSpacing: '0.08em' }}>
                Step {step} of 3
              </span>
              <span style={{ fontSize: '0.85rem', color: '#9A9284', fontWeight: '500', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                {step === 1 ? 'Email Entry' : step === 2 ? 'Verification' : 'Profile'}
              </span>
            </div>
            <div style={{ height: '4px', backgroundColor: 'rgba(25, 21, 16, 0.1)', borderRadius: '0px', overflow: 'hidden', display: 'flex' }}>
              <div style={{ width: step === 1 ? '33.3%' : step === 2 ? '66.6%' : '100%', backgroundColor: '#A63A2C', transition: 'width 0.3s ease' }} />
            </div>
          </div>

          {/* STEP 1 FORM */}
          {step === 1 && (
            <form onSubmit={handleInitiate}>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.75rem', fontWeight: '700', color: '#191510', margin: '0 0 0.5rem 0', letterSpacing: '-0.02em' }}>
                Create Your Account
              </h2>
              <p style={{ color: '#55503F', fontSize: '0.92rem', margin: '0 0 1.75rem 0', fontFamily: "'IBM Plex Sans', sans-serif", lineHeight: '1.5' }}>
                Enter your email address to receive your 6-digit verification code.
              </p>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#191510', marginBottom: '0.4rem', fontFamily: "'IBM Plex Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    borderRadius: '0px',
                    border: '1.5px solid #191510',
                    backgroundColor: '#F7F3EA',
                    color: '#191510',
                    fontSize: '0.95rem',
                    outline: 'none',
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {step1Error && (
                <div style={{ padding: '0.85rem', backgroundColor: '#F7F3EA', border: '1.5px solid #A63A2C', borderRadius: '0px', color: '#A63A2C', fontSize: '0.85rem', marginBottom: '1.5rem', fontWeight: '500' }}>
                  {step1Error}{' '}
                  {step1Error.includes('Log in') && (
                    <Link href={`/login${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`} style={{ color: '#A63A2C', fontWeight: '600', textDecoration: 'underline', marginLeft: '0.25rem' }}>
                      Log in instead?
                    </Link>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={step1Loading}
                style={{
                  width: '100%',
                  padding: '0.9rem',
                  backgroundColor: '#191510',
                  color: '#F7F3EA',
                  border: 'none',
                  borderRadius: '0px',
                  fontWeight: '500',
                  fontSize: '0.95rem',
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  cursor: step1Loading ? 'not-allowed' : 'pointer',
                  marginBottom: '1.5rem',
                  transition: 'background-color 0.15s ease',
                }}
              >
                {step1Loading ? 'Sending Code...' : 'Send Verification Code'}
              </button>

              <div style={{ textAlign: 'center', fontSize: '0.88rem', color: '#55503F', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                Already have an account?{' '}
                <Link href={`/login${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`} style={{ color: '#A63A2C', fontWeight: '600', textDecoration: 'none' }}>
                  Log in
                </Link>
              </div>
            </form>
          )}

          {/* STEP 2 FORM */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp}>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.75rem', fontWeight: '700', color: '#191510', margin: '0 0 0.5rem 0', letterSpacing: '-0.02em' }}>
                Verify Your Email
              </h2>
              <p style={{ color: '#55503F', fontSize: '0.92rem', margin: '0 0 1.75rem 0', fontFamily: "'IBM Plex Sans', sans-serif", lineHeight: '1.5' }}>
                We sent a 6-digit code to <strong>{email}</strong>. Enter it below to verify.
              </p>

              <div style={{ marginBottom: '1.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#191510', marginBottom: '0.75rem', fontFamily: "'IBM Plex Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>
                  6-Digit OTP Code
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                  {otpDigits.map((digit, i) => (
                    <input
                      key={i}
                      ref={otpInputRefs[i]}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpDigitChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      onPaste={handleOtpPaste}
                      style={{
                        width: '44px',
                        height: '50px',
                        textAlign: 'center',
                        fontSize: '1.25rem',
                        fontWeight: '700',
                        fontFamily: "'Space Grotesk', monospace",
                        borderRadius: '0px',
                        border: '1.5px solid #191510',
                        outline: 'none',
                        backgroundColor: '#F7F3EA',
                        color: '#191510',
                      }}
                    />
                  ))}
                </div>
              </div>

              {resendMessage && (
                <div style={{ padding: '0.75rem', backgroundColor: '#F7F3EA', border: '1.5px solid #191510', borderRadius: '0px', color: '#191510', fontSize: '0.85rem', marginBottom: '1.5rem', textAlign: 'center', fontWeight: '500' }}>
                  {resendMessage}
                </div>
              )}

              {step2Error && (
                <div style={{ padding: '0.85rem', backgroundColor: '#F7F3EA', border: '1.5px solid #A63A2C', borderRadius: '0px', color: '#A63A2C', fontSize: '0.85rem', marginBottom: '1.5rem', fontWeight: '500' }}>
                  {step2Error}
                </div>
              )}

              <button
                type="submit"
                disabled={step2Loading}
                style={{
                  width: '100%',
                  padding: '0.9rem',
                  backgroundColor: '#191510',
                  color: '#F7F3EA',
                  border: 'none',
                  borderRadius: '0px',
                  fontWeight: '500',
                  fontSize: '0.95rem',
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  cursor: step2Loading ? 'not-allowed' : 'pointer',
                  marginBottom: '1.25rem',
                  transition: 'background-color 0.15s ease',
                }}
              >
                {step2Loading ? 'Verifying...' : 'Verify Code'}
              </button>

              <div style={{ textAlign: 'center', fontSize: '0.88rem', color: '#55503F', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                Didn't receive code?{' '}
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendTimer > 0 || resending}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: resendTimer > 0 ? '#9A9284' : '#A63A2C',
                    fontWeight: '600',
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    cursor: resendTimer > 0 ? 'not-allowed' : 'pointer',
                    padding: 0,
                    textDecoration: 'underline',
                  }}
                >
                  {resending ? 'Resending...' : resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend Code'}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3 FORM */}
          {step === 3 && (
            <form onSubmit={handleComplete}>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.75rem', fontWeight: '700', color: '#191510', margin: '0 0 0.5rem 0', letterSpacing: '-0.02em' }}>
                Complete Profile
              </h2>
              <p style={{ color: '#55503F', fontSize: '0.92rem', margin: '0 0 1.75rem 0', fontFamily: "'IBM Plex Sans', sans-serif", lineHeight: '1.5' }}>
                Set your name and password to finalize your account.
              </p>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#191510', marginBottom: '0.4rem', fontFamily: "'IBM Plex Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    borderRadius: '0px',
                    border: '1.5px solid #191510',
                    backgroundColor: '#F7F3EA',
                    color: '#191510',
                    fontSize: '0.95rem',
                    outline: 'none',
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#191510', fontFamily: "'IBM Plex Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Password *
                  </label>
                  {strength.text && (
                    <span style={{ fontSize: '0.78rem', color: strength.color, fontWeight: '600', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                      {strength.text}
                    </span>
                  )}
                </div>
                <input
                  type="password"
                  required
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    borderRadius: '0px',
                    border: '1.5px solid #191510',
                    backgroundColor: '#F7F3EA',
                    color: '#191510',
                    fontSize: '0.95rem',
                    outline: 'none',
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    boxSizing: 'border-box',
                  }}
                />
                {password && (
                  <div style={{ height: '3px', backgroundColor: 'rgba(25, 21, 16, 0.1)', borderRadius: '0px', marginTop: '6px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${strength.percent}%`, backgroundColor: strength.color, transition: 'all 0.3s ease' }} />
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#191510', marginBottom: '0.4rem', fontFamily: "'IBM Plex Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Confirm Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    borderRadius: '0px',
                    border: '1.5px solid #191510',
                    backgroundColor: '#F7F3EA',
                    color: '#191510',
                    fontSize: '0.95rem',
                    outline: 'none',
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {step3Error && (
                <div style={{ padding: '0.85rem', backgroundColor: '#F7F3EA', border: '1.5px solid #A63A2C', borderRadius: '0px', color: '#A63A2C', fontSize: '0.85rem', marginBottom: '1.5rem', fontWeight: '500' }}>
                  {step3Error}
                </div>
              )}

              <button
                type="submit"
                disabled={step3Loading}
                style={{
                  width: '100%',
                  padding: '0.9rem',
                  backgroundColor: '#191510',
                  color: '#F7F3EA',
                  border: 'none',
                  borderRadius: '0px',
                  fontWeight: '500',
                  fontSize: '0.95rem',
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  cursor: step3Loading ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
              >
                {step3Loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center', backgroundColor: '#F7F3EA', color: '#191510' }}>Loading signup...</div>}>
      <SignupForm />
    </Suspense>
  );
}
