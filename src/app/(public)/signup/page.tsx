'use client';

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
    if (pwd.length < 8) return { text: 'Weak (min 8 chars)', color: '#e94f6b', percent: 33 };
    if (pwd.match(/[A-Z]/) && pwd.match(/[0-9]/)) return { text: 'Strong', color: '#05b98a', percent: 100 };
    return { text: 'Medium', color: '#ffd166', percent: 66 };
  };

  const strength = getPasswordStrength(password);

  return (
    <div style={{ backgroundColor: '#fdf9f2', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif", color: '#24201a' }}>
      <PublicNavbar />

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 1.5rem 3rem 1.5rem' }}>
        <div
          style={{
            width: '100%',
            maxWidth: '460px',
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #ecdfc4',
            boxShadow: '0 8px 24px rgba(36, 32, 26, 0.06)',
            padding: '2.5rem 2rem',
          }}
        >
          {/* Progress Indicator */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#e94f6b', textTransform: 'uppercase', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '0.5px' }}>
                Step {step} of 3
              </span>
              <span style={{ fontSize: '0.85rem', color: '#6b6151', fontWeight: '600', fontFamily: "'Space Grotesk', sans-serif" }}>
                {step === 1 ? 'Email Entry' : step === 2 ? 'Verification' : 'Profile'}
              </span>
            </div>
            <div style={{ height: '6px', backgroundColor: '#fdf9f2', border: '1px solid #ecdfc4', borderRadius: '3px', overflow: 'hidden', display: 'flex' }}>
              <div style={{ width: step === 1 ? '33.3%' : step === 2 ? '66.6%' : '100%', backgroundColor: '#e94f6b', transition: 'width 0.3s ease' }} />
            </div>
          </div>

          {/* STEP 1 FORM */}
          {step === 1 && (
            <form onSubmit={handleInitiate}>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.75rem', fontWeight: '700', color: '#24201a', margin: '0 0 0.5rem 0', textTransform: 'uppercase' }}>
                Create Your Account
              </h2>
              <p style={{ color: '#6b6151', fontSize: '0.92rem', margin: '0 0 1.75rem 0' }}>
                Enter your email address to receive your 6-digit verification code.
              </p>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#24201a', marginBottom: '0.5rem', fontFamily: "'Space Grotesk', sans-serif", textTransform: 'uppercase' }}>
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
                    borderRadius: '8px',
                    border: '1px solid #ecdfc4',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {step1Error && (
                <div style={{ padding: '0.85rem', backgroundColor: '#fde8eb', border: '1px solid #e94f6b', borderRadius: '8px', color: '#e94f6b', fontSize: '0.85rem', marginBottom: '1.5rem', fontWeight: '600' }}>
                  {step1Error}{' '}
                  {step1Error.includes('Log in') && (
                    <Link href={`/login${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`} style={{ color: '#e94f6b', fontWeight: 'bold', textDecoration: 'underline', marginLeft: '0.25rem' }}>
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
                  backgroundColor: '#e94f6b',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '0.95rem',
                  fontFamily: "'Space Grotesk', sans-serif",
                  cursor: step1Loading ? 'not-allowed' : 'pointer',
                  textTransform: 'uppercase',
                  boxShadow: '0 1px 2px rgba(36, 32, 26, 0.04)',
                  marginBottom: '1.5rem',
                }}
              >
                {step1Loading ? 'Sending Code...' : 'Send Verification Code'}
              </button>

              <div style={{ textAlign: 'center', fontSize: '0.88rem', color: '#6b6151' }}>
                Already have an account?{' '}
                <Link href={`/login${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`} style={{ color: '#e94f6b', fontWeight: 'bold', textDecoration: 'none' }}>
                  Log in
                </Link>
              </div>
            </form>
          )}

          {/* STEP 2 FORM */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp}>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.75rem', fontWeight: '700', color: '#24201a', margin: '0 0 0.5rem 0', textTransform: 'uppercase' }}>
                Verify Your Email
              </h2>
              <p style={{ color: '#6b6151', fontSize: '0.92rem', margin: '0 0 1.75rem 0' }}>
                We sent a 6-digit code to <strong>{email}</strong>. Enter it below to verify.
              </p>

              <div style={{ marginBottom: '1.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#24201a', marginBottom: '0.75rem', fontFamily: "'Space Grotesk', sans-serif", textTransform: 'uppercase', textAlign: 'center' }}>
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
                        fontSize: '1.3rem',
                        fontWeight: '700',
                        fontFamily: "'Space Grotesk', monospace",
                        borderRadius: '8px',
                        border: '1px solid #ecdfc4',
                        outline: 'none',
                        backgroundColor: '#fdf9f2',
                        color: '#24201a',
                      }}
                    />
                  ))}
                </div>
              </div>

              {resendMessage && (
                <div style={{ padding: '0.75rem', backgroundColor: '#e6f8f3', border: '1px solid #05b98a', borderRadius: '8px', color: '#05b98a', fontSize: '0.85rem', marginBottom: '1.5rem', textAlign: 'center', fontWeight: '600' }}>
                  {resendMessage}
                </div>
              )}

              {step2Error && (
                <div style={{ padding: '0.85rem', backgroundColor: '#fde8eb', border: '1px solid #e94f6b', borderRadius: '8px', color: '#e94f6b', fontSize: '0.85rem', marginBottom: '1.5rem', fontWeight: '600' }}>
                  {step2Error}
                </div>
              )}

              <button
                type="submit"
                disabled={step2Loading}
                style={{
                  width: '100%',
                  padding: '0.9rem',
                  backgroundColor: '#e94f6b',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '0.95rem',
                  fontFamily: "'Space Grotesk', sans-serif",
                  cursor: step2Loading ? 'not-allowed' : 'pointer',
                  textTransform: 'uppercase',
                  boxShadow: '0 1px 2px rgba(36, 32, 26, 0.04)',
                  marginBottom: '1.25rem',
                }}
              >
                {step2Loading ? 'Verifying...' : 'Verify Code'}
              </button>

              <div style={{ textAlign: 'center', fontSize: '0.88rem', color: '#6b6151' }}>
                Didn't receive code?{' '}
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendTimer > 0 || resending}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: resendTimer > 0 ? '#9a8e73' : '#e94f6b',
                    fontWeight: 'bold',
                    fontFamily: "'Space Grotesk', sans-serif",
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
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.75rem', fontWeight: '700', color: '#24201a', margin: '0 0 0.5rem 0', textTransform: 'uppercase' }}>
                Complete Profile
              </h2>
              <p style={{ color: '#6b6151', fontSize: '0.92rem', margin: '0 0 1.75rem 0' }}>
                Set your name and password to finalize your account.
              </p>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#24201a', marginBottom: '0.5rem', fontFamily: "'Space Grotesk', sans-serif", textTransform: 'uppercase' }}>
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
                    borderRadius: '8px',
                    border: '1px solid #ecdfc4',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#24201a', fontFamily: "'Space Grotesk', sans-serif", textTransform: 'uppercase' }}>
                    Password *
                  </label>
                  {strength.text && (
                    <span style={{ fontSize: '0.78rem', color: strength.color, fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif" }}>
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
                    borderRadius: '8px',
                    border: '1px solid #ecdfc4',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                {password && (
                  <div style={{ height: '4px', backgroundColor: '#ecdfc4', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${strength.percent}%`, backgroundColor: strength.color, transition: 'all 0.3s ease' }} />
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#24201a', marginBottom: '0.5rem', fontFamily: "'Space Grotesk', sans-serif", textTransform: 'uppercase' }}>
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
                    borderRadius: '8px',
                    border: '1px solid #ecdfc4',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {step3Error && (
                <div style={{ padding: '0.85rem', backgroundColor: '#fde8eb', border: '1px solid #e94f6b', borderRadius: '8px', color: '#e94f6b', fontSize: '0.85rem', marginBottom: '1.5rem', fontWeight: '600' }}>
                  {step3Error}
                </div>
              )}

              <button
                type="submit"
                disabled={step3Loading}
                style={{
                  width: '100%',
                  padding: '0.9rem',
                  backgroundColor: '#e94f6b',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '0.95rem',
                  fontFamily: "'Space Grotesk', sans-serif",
                  cursor: step3Loading ? 'not-allowed' : 'pointer',
                  textTransform: 'uppercase',
                  boxShadow: '0 1px 2px rgba(36, 32, 26, 0.04)',
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
    <Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center' }}>Loading signup...</div>}>
      <SignupForm />
    </Suspense>
  );
}
