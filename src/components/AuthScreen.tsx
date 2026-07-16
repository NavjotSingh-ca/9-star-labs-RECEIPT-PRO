'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { getSiteUrl } from '@/lib/env';
import { redeemAccessCode } from '@/lib/services/receipts';
import { bootstrapOrgAction } from '@/app/actions/bootstrap-org';
import { usePasswordStrength } from '@/hooks/usePasswordStrength';
import BrandPanel from '@/components/auth/BrandPanel';
import AuthForm from '@/components/auth/AuthForm';

const signinSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

const signupSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'One uppercase letter')
    .regex(/[0-9]/, 'One number')
    .regex(/[^A-Za-z0-9]/, 'One special character'),
  inviteCode: z.string().regex(/^\d{0,6}$/, '6-digit code').optional().or(z.literal('')),
  accepted: z.boolean().refine(v => v === true, 'Accept the terms to continue'),
});

type SignInData = z.infer<typeof signinSchema>;
type SignUpData = z.infer<typeof signupSchema>;

/* ─── Gradient orbs for ambient background ─── */
const orbs = [
  { size: 55, x: 20, y: 10, duration: 18, color: 'rgba(190,169,142,0.04)' },
  { size: 40, x: 70, y: 20, duration: 22, color: 'rgba(139,115,85,0.06)' },
  { size: 35, x: 10, y: 60, duration: 25, color: 'rgba(190,169,142,0.03)' },
  { size: 50, x: 80, y: 70, duration: 20, color: 'rgba(120,100,180,0.03)' },
  { size: 30, x: 45, y: 40, duration: 28, color: 'rgba(139,115,85,0.04)' },
];

/**
 * AuthScreen — Split-screen authentication with sign-in/sign-up modes,
 * Google OAuth, forgot-password flow, password strength meter, and invite code support.
 * Features split layout with BrandPanel + AuthForm, animated ambient orbs, and grid texture.
 */
export default function AuthScreen({ onBackToLanding }: { onBackToLanding?: () => void }) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState('');

  const signinForm = useForm<SignInData>({
    resolver: zodResolver(signinSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
    mode: 'onBlur',
  });

  const signupForm = useForm<SignUpData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: '', password: '', inviteCode: '', accepted: false },
    mode: 'onBlur',
  });

  const password = signupForm.watch('password');
  const strength = usePasswordStrength(password);

  const handleSignIn = async (data: SignInData) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: data.email, password: data.password });
      if (error) throw error;
      toast.success('Signed in successfully');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Authentication failed';
      toast.error(msg);
      signinForm.setError('root', { message: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (data: SignUpData) => {
    setLoading(true);
    try {
      const { data: authData, error } = await supabase.auth.signUp({ email: data.email, password: data.password });
      if (error) throw error;

      if (inviteCode.trim() && authData.user) {
        const result = await redeemAccessCode(inviteCode.trim(), authData.user.id);
        toast.success(result.success
          ? `Account created. Role assigned: ${result.role}. Check email to confirm.`
          : 'Account created but invite code invalid. Check email.');
      } else if (authData.user) {
        try {
          const { ok } = await bootstrapOrgAction(authData.user.id);
          toast.success(ok
            ? 'Account created. Check your email to confirm.'
            : 'Account created. Please contact support if org setup fails.');
        } catch {
          toast.info('Account created. Please contact support if org setup fails.');
        }
      } else {
        toast.success('Account created. Check your email to confirm.');
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Registration failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const redirectTo = `${getSiteUrl()}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
      if (error) throw error;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Google sign-in failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const email = signinForm.getValues('email');
    if (!email) { toast.error('Enter your email first'); return; }
    setForgotLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${getSiteUrl()}/auth/callback?type=recovery`,
      });
      if (error) throw error;
      toast.success('Password reset email sent');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to send reset email');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full overflow-hidden bg-[#08080a] selection:bg-champagne/20">
      {/* Base gradient layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-champagne/[0.03] via-transparent to-[#08080a]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(190,169,142,0.08),transparent)]" />

      {/* Back to landing */}
      {onBackToLanding && (
        <button
          type="button"
          onClick={onBackToLanding}
          className="absolute left-4 top-4 z-20 flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-text-muted hover:bg-white/10 hover:text-text-primary transition backdrop-blur-sm"
        >
          ← Back
        </button>
      )}

      {/* Subtle grid texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.012]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Floating ambient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {orbs.map((orb, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${orb.size}vw`,
              height: `${orb.size}vw`,
              background: `radial-gradient(circle at center, ${orb.color} 0%, transparent 70%)`,
            }}
            animate={{
              x: [
                `${orb.x - 8 + Math.sin(i * 1.5) * 12}vw`,
                `${orb.x + 8 + Math.cos(i * 1.2) * 12}vw`,
                `${orb.x - 8 + Math.sin(i * 1.5) * 12}vw`,
              ],
              y: [
                `${orb.y - 5 + Math.cos(i * 1.8) * 8}vw`,
                `${orb.y + 5 + Math.sin(i * 1.3) * 8}vw`,
                `${orb.y - 5 + Math.cos(i * 1.8) * 8}vw`,
              ],
            }}
            transition={{
              duration: orb.duration,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 2,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col lg:flex-row">
        <BrandPanel />
        <AuthForm
          mode={mode}
          onModeChange={setMode}
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword(v => !v)}
          loading={loading}
          forgotLoading={forgotLoading}
          signinForm={signinForm}
          signupForm={signupForm}
          inviteCode={inviteCode}
          onInviteCodeChange={setInviteCode}
          password={password}
          strength={strength}
          onSignIn={handleSignIn}
          onSignUp={handleSignUp}
          onGoogleSignIn={handleGoogleSignIn}
          onForgotPassword={handleForgotPassword}
        />
      </div>
    </div>
  );
}
