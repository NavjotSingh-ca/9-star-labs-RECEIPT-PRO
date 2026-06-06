'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { Loader2, Eye, EyeOff, Mail, Lock, ReceiptText, AlertCircle, CheckCircle2, Sparkles, ArrowRight, ShieldCheck, Fingerprint, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { redeemAccessCode } from '@/lib/services/receipts';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const CAD = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 });

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
  inviteCode: z
    .string()
    .regex(/^\d{0,6}$/, '6-digit code')
    .optional()
    .or(z.literal('')),
  accepted: z.literal(true, { message: 'Accept the terms to continue' }),
});

type SignInData = z.infer<typeof signinSchema>;
type SignUpData = z.infer<typeof signupSchema>;

const brandFeatures = [
  { icon: ShieldCheck, label: 'SHA-256 Integrity', desc: 'Tamper-evident audit chain' },
  { icon: Fingerprint, label: 'AI-Powered', desc: 'Smart categorization & fraud detection' },
  { icon: TrendingUp, label: 'CRA-Ready', desc: 'One-click compliance exports' },
];

const passwordRequirements = [
  { label: '8+ characters', test: (p: string) => p.length >= 8 },
  { label: 'Uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Number', test: (p: string) => /[0-9]/.test(p) },
  { label: 'Special character', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

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
    defaultValues: { email: '', password: '', inviteCode: '', accepted: false as unknown as true },
  });

  const password = signupForm.watch('password');

  const strength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: '', width: '0%' };
    const passed = passwordRequirements.filter((r) => r.test(password)).length;
    if (passed <= 1) return { score: passed, label: 'Weak', color: 'bg-danger', width: '25%' };
    if (passed === 2) return { score: passed, label: 'Fair', color: 'bg-warning', width: '50%' };
    if (passed === 3) return { score: passed, label: 'Good', color: 'bg-champagne-dim', width: '75%' };
    return { score: passed, label: 'Strong', color: 'bg-emerald-light', width: '100%' };
  }, [password]);

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
        if (result.success) {
          toast.success(`Account created. Role assigned: ${result.role}. Check email to confirm.`);
        } else {
          toast.info(`Account created but invite code invalid. Check email.`);
        }
      } else if (authData.user) {
        try {
          await supabase.rpc('bootstrap_first_user_org', {
            p_user_id: authData.user.id,
            p_org_name: 'My Business',
          });
          toast.success('Account created. Check your email to confirm.');
        } catch (err: unknown) {
          console.error('Org creation failed:', err);
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
    if (!email) {
      toast.error('Enter your email first');
      return;
    }
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
        className={cn(
          'absolute inset-0 bg-gradient-to-br transition-all duration-[3000ms] ease-in-out',
          gradients[gradientIndex]
        )}
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
        <div className="hidden lg:flex w-1/2 min-h-screen flex-col justify-between p-12 xl:p-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-champagne/15 shadow-[0_0_20px_-4px_rgba(190,169,142,0.2)]">
              <ReceiptText className="h-6 w-6 text-champagne" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">9 Star Labs</h1>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-champagne">CRA-ready records</p>
            </div>
          </motion.div>

          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-4"
            >
              <h2 className="text-5xl xl:text-6xl font-bold tracking-tight text-white leading-[1.1]">
                Receipt intelligence
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-champagne to-champagne-dim">
                  built for Canada
                </span>
              </h2>
              <p className="text-lg text-text-secondary max-w-md leading-relaxed">
                Enterprise-grade receipt capture with SHA-256 integrity, CRA compliance scoring, and structured audit
                exports for Canadian businesses and their accountants.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid gap-3"
            >
              {brandFeatures.map((f, i) => (
                <motion.div
                  key={f.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 + i * 0.1 }}
                  className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 backdrop-blur-sm"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-champagne/10 text-champagne">
                    <f.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{f.label}</p>
                    <p className="text-xs text-text-muted">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-xs text-text-muted"
          >
            &copy; {new Date().getFullYear()} 9 Star Labs. All rights reserved.
          </motion.p>
        </div>

        <div className="flex w-full lg:w-1/2 min-h-screen items-center justify-center p-4 sm:p-8 lg:p-12 xl:p-16">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="w-full max-w-md"
          >
            <div className="lg:hidden mb-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-champagne/15 mb-4 shadow-[0_0_20px_-4px_rgba(190,169,142,0.2)]">
                <ReceiptText className="h-7 w-7 text-champagne" />
              </div>
              <h1 className="text-2xl font-bold text-white">9 Star Labs</h1>
              <p className="text-xs text-text-muted mt-1">CRA-Ready Receipt Intelligence</p>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-6 sm:p-8">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white">
                      {mode === 'signin' ? 'Welcome back' : 'Create account'}
                    </h2>
                    <p className="mt-1.5 text-sm text-text-secondary">
                      {mode === 'signin'
                        ? 'Sign in to access your workspace'
                        : 'Start capturing and organizing receipts securely'}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full h-11 rounded-xl border-white/10 bg-white/[0.02] hover:bg-white/[0.06] text-text-secondary hover:text-white font-medium"
                  >
                    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                  </Button>

                  <div className="relative my-5">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/[0.06]" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-[#0c0c0c] px-3 text-text-muted">or continue with email</span>
                    </div>
                  </div>

                  {mode === 'signin' ? (
                    <form onSubmit={signinForm.handleSubmit(handleSignIn)} className="space-y-4">
                      {signinForm.formState.errors.root && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-2 rounded-xl border border-danger/20 bg-danger/5 px-3 py-2.5 text-xs text-danger"
                        >
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          <span>{signinForm.formState.errors.root.message}</span>
                        </motion.div>
                      )}

                      <div className="space-y-1.5">
                        <label htmlFor="signin-email" className="text-xs font-semibold uppercase tracking-[0.12em] text-champagne-dim">
                          Email
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
                          <input
                            id="signin-email"
                            {...signinForm.register('email')}
                            type="email"
                            autoComplete="email"
                            placeholder="you@company.ca"
                            className={cn(
                              'w-full rounded-xl border bg-white/[0.03] pl-10 pr-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/15',
                              'focus:border-champagne/40 focus:ring-1 focus:ring-champagne/15',
                              signinForm.formState.errors.email
                                ? 'border-danger/40 focus:border-danger/40 focus:ring-danger/20'
                                : 'border-white/[0.08]'
                            )}
                          />
                        </div>
                        {signinForm.formState.errors.email && (
                          <p className="text-[11px] text-danger">{signinForm.formState.errors.email.message}</p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="signin-password" className="text-xs font-semibold uppercase tracking-[0.12em] text-champagne-dim">
                          Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
                          <input
                            id="signin-password"
                            {...signinForm.register('password')}
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            placeholder="••••••••"
                            className={cn(
                              'w-full rounded-xl border bg-white/[0.03] pl-10 pr-10 py-2.5 text-sm text-white outline-none transition placeholder:text-white/15',
                              'focus:border-champagne/40 focus:ring-1 focus:ring-champagne/15',
                              signinForm.formState.errors.password
                                ? 'border-danger/40'
                                : 'border-white/[0.08]'
                            )}
                          />
                          <button
                            type="button"
                            aria-label="Toggle password visibility"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {signinForm.formState.errors.password && (
                          <p className="text-[11px] text-danger">{signinForm.formState.errors.password.message}</p>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input
                            {...signinForm.register('rememberMe')}
                            type="checkbox"
                            className="h-4 w-4 rounded border-white/20 bg-white/[0.03] text-champagne focus:ring-champagne/20 focus:ring-offset-0 accent-champagne"
                          />
                          <span className="text-xs text-text-muted group-hover:text-text-secondary transition-colors">
                            Remember me
                          </span>
                        </label>
                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          disabled={forgotLoading}
                          className="text-xs text-champagne-dim hover:text-champagne transition-colors disabled:opacity-50"
                        >
                          Forgot password?
                        </button>
                      </div>

                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-11 rounded-xl bg-gradient-to-b from-champagne to-champagne-dim text-black font-bold shadow-[0_0_20px_-4px_rgba(190,169,142,0.3)] hover:opacity-90 transition-opacity"
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            Sign In
                            <ArrowRight className="h-4 w-4 ml-1" />
                          </>
                        )}
                      </Button>
                    </form>
                  ) : (
                    <form onSubmit={signupForm.handleSubmit(handleSignUp)} className="space-y-4">
                      <div className="space-y-1.5">
                        <label htmlFor="signup-email" className="text-xs font-semibold uppercase tracking-[0.12em] text-champagne-dim">
                          Email
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
                          <input
                            id="signup-email"
                            {...signupForm.register('email')}
                            type="email"
                            autoComplete="email"
                            placeholder="you@company.ca"
                            className={cn(
                              'w-full rounded-xl border bg-white/[0.03] pl-10 pr-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/15',
                              'focus:border-champagne/40 focus:ring-1 focus:ring-champagne/15',
                              signupForm.formState.errors.email
                                ? 'border-danger/40'
                                : 'border-white/[0.08]'
                            )}
                          />
                        </div>
                        {signupForm.formState.errors.email && (
                          <p className="text-[11px] text-danger">{signupForm.formState.errors.email.message}</p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="signup-password" className="text-xs font-semibold uppercase tracking-[0.12em] text-champagne-dim">
                          Create password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
                          <input
                            id="signup-password"
                            {...signupForm.register('password')}
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            placeholder="Create a strong password"
                            className={cn(
                              'w-full rounded-xl border bg-white/[0.03] pl-10 pr-10 py-2.5 text-sm text-white outline-none transition placeholder:text-white/15',
                              'focus:border-champagne/40 focus:ring-1 focus:ring-champagne/15',
                              signupForm.formState.errors.password
                                ? 'border-danger/40'
                                : 'border-white/[0.08]'
                            )}
                          />
                          <button
                            type="button"
                            aria-label="Toggle password visibility"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {signupForm.formState.errors.password && (
                          <p className="text-[11px] text-danger">{signupForm.formState.errors.password.message}</p>
                        )}
                        {password && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="space-y-2 pt-1"
                          >
                            <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                              <motion.div
                                className={cn('h-full rounded-full transition-all', strength.color)}
                                initial={{ width: '0%' }}
                                animate={{ width: strength.width }}
                                transition={{ duration: 0.3 }}
                              />
                            </div>
                            <p className={cn('text-[11px] font-medium', strength.score <= 1 ? 'text-danger' : strength.score === 2 ? 'text-warning' : strength.score === 3 ? 'text-champagne-dim' : 'text-emerald-light')}>
                              {strength.label}
                            </p>
                            <div className="grid grid-cols-2 gap-1">
                              {passwordRequirements.map((req) => {
                                const met = req.test(password);
                                return (
                                  <div key={req.label} className="flex items-center gap-1.5">
                                    {met ? (
                                      <CheckCircle2 className="h-3 w-3 text-emerald-light shrink-0" />
                                    ) : (
                                      <div className="h-3 w-3 rounded-full border border-white/20 shrink-0" />
                                    )}
                                    <span className={cn('text-[11px]', met ? 'text-text-secondary' : 'text-text-muted')}>
                                      {req.label}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="signup-invite" className="text-xs font-semibold uppercase tracking-[0.12em] text-champagne-dim">
                          Invite code <span className="text-white/20 normal-case font-normal">(optional)</span>
                        </label>
                        <input
                          id="signup-invite"
                          type="text"
                          value={inviteCode}
                          onChange={(e) => setInviteCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="000000"
                          maxLength={6}
                          className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/15 focus:border-champagne/40 focus:ring-1 focus:ring-champagne/15 font-mono tracking-[0.3em] text-center"
                        />
                        <p className="text-[11px] text-text-muted">
                          Enter the 6-digit code if you were invited by a workspace owner
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => signupForm.setValue('accepted', !signupForm.getValues('accepted') as unknown as true, { shouldValidate: true })}
                        className={cn(
                          'flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition',
                          signupForm.getValues('accepted')
                            ? 'border-champagne/30 bg-champagne/[0.04]'
                            : 'border-white/[0.06] bg-white/[0.02]'
                        )}
                      >
                        <div
                          className={cn(
                            'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors',
                            signupForm.getValues('accepted')
                              ? 'border-champagne bg-champagne text-black'
                              : 'border-white/20 bg-white/[0.03]'
                          )}
                        >
                          {signupForm.getValues('accepted') && <CheckCircle2 className="h-3.5 w-3.5" />}
                        </div>
                        <p className="text-xs leading-5 text-white/50">
                          I accept responsibility for reviewing exported tax and accounting data
                        </p>
                      </button>
                      {signupForm.formState.errors.accepted && (
                        <p className="text-[11px] text-danger">{signupForm.formState.errors.accepted.message}</p>
                      )}

                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-11 rounded-xl bg-gradient-to-b from-champagne to-champagne-dim text-black font-bold shadow-[0_0_20px_-4px_rgba(190,169,142,0.3)] hover:opacity-90 transition-opacity"
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            Create Account
                            <Sparkles className="h-4 w-4 ml-1.5" />
                          </>
                        )}
                      </Button>
                    </form>
                  )}

                  <div className="mt-6 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
                        setShowPassword(false);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-medium text-text-muted hover:text-champagne transition-colors"
                    >
                      {mode === 'signin' ? (
                        <>Don't have an account? <span className="text-champagne underline underline-offset-2">Sign up</span></>
                      ) : (
                        <>Already have an account? <span className="text-champagne underline underline-offset-2">Sign in</span></>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
