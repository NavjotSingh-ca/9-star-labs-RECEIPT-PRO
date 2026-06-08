'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
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

const gradients = [
  'from-[#BEA98E]/20 via-[#1a1a1a] to-[#0c0c0c]',
  'from-[#8B7355]/15 via-[#1a1a1a] to-[#0c0c0c]',
  'from-[#C4A882]/20 via-[#1a1a1a] to-[#0c0c0c]',
];

export default function AuthScreen() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [gradientIndex, setGradientIndex] = useState(0);
  const [inviteCode, setInviteCode] = useState('');

  const signinForm = useForm<SignInData>({
    resolver: zodResolver(signinSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  const signupForm = useForm<SignUpData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: '', password: '', inviteCode: '', accepted: false },
  });

  const password = signupForm.watch('password');
  const strength = usePasswordStrength(password);

  const rotateGradient = useCallback(() => {
    setGradientIndex((i) => (i + 1) % gradients.length);
  }, []);

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
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
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
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
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
    <div className="relative flex min-h-screen w-full overflow-hidden bg-obsidian">
      <div
        className={[
          'absolute inset-0 bg-gradient-to-br transition-all duration-[3000ms] ease-in-out',
          gradients[gradientIndex],
        ].join(' ')}
      />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(190,169,142,0.1),transparent)]" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full mix-blend-screen"
            style={{
              width: `${30 + i * 15}vw`,
              height: `${30 + i * 15}vw`,
              background: `radial-gradient(circle, rgba(190,169,142,${0.04 - i * 0.01}) 0%, transparent 70%)`,
            }}
            animate={{
              x: [-(10 + i * 5) + '%', (10 + i * 5) + '%', -(10 + i * 5) + '%'],
              y: [-(5 + i * 3) + '%', (5 + i * 3) + '%', -(5 + i * 3) + '%'],
            }}
            transition={{
              duration: 15 + i * 5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

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
