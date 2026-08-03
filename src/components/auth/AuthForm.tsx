'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, Eye, EyeOff, Mail, Lock, ReceiptText, AlertCircle, CheckCircle2,
  Sparkles, ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { APP_NAME } from '@/lib/constants';
import { passwordRequirements } from '@/hooks/usePasswordStrength';
import { fadeUp } from '@/lib/animations';
import type { UseFormReturn } from 'react-hook-form';

interface SignInData { email: string; password: string; rememberMe?: boolean }
interface SignUpData { email: string; password: string; inviteCode?: string; accepted: boolean }

interface AuthFormProps {
  mode: 'signin' | 'signup';
  onModeChange: (mode: 'signin' | 'signup') => void;
  showPassword: boolean;
  onTogglePassword: () => void;
  loading: boolean;
  forgotLoading: boolean;
  signinForm: UseFormReturn<SignInData>;
  signupForm: UseFormReturn<SignUpData>;
  inviteCode: string;
  onInviteCodeChange: (code: string) => void;
  password: string;
  strength: { width: string; color: string; label: string; score: number };
  onSignIn: (data: SignInData) => void;
  onSignUp: (data: SignUpData) => void;
  onGoogleSignIn: () => void;
  onForgotPassword: () => void;
}

const inputBase =
  'w-full rounded-xl border bg-white/[0.03] px-4 py-2.5 text-sm text-white outline-none transition-all duration-200 ' +
  'placeholder:text-white/20 focus:border-champagne/50 focus:ring-2 focus:ring-champagne/20 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

const inputError = 'border-danger/40 focus:border-danger/40 focus:ring-danger/20';
const inputNormal = 'border-white/[0.08]';

const labelBase = 'text-xs font-semibold uppercase tracking-[0.12em] text-champagne-dim/80';

/* ─── Staggered field entrance via CSS (avoids framer-motion overhead per field) ─── */
/* Keyframes in globals.css: @keyframes fadeSlideIn and @keyframes fadeIn */

/* ─── Glass card wrapper with gradient border effect ─── */
function GlassCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('relative group', className)}>
      {/* Gradient border glow — visible on hover */}
      <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-b from-champagne/15 via-white/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      {/* Main glass surface — blur-md (not xl): 24px backdrop blur over the
          continuously-animating orb background forces a full backdrop re-sample
          every frame; 12px is visually equivalent here but ~half the cost */}
      <div className="relative rounded-2xl border border-white/[0.06] bg-black/40 backdrop-blur-md shadow-xl shadow-black/20">
        {children}
      </div>
    </div>
  );
}

export default function AuthForm({
  mode, onModeChange, showPassword, onTogglePassword, loading, forgotLoading,
  signinForm, signupForm, inviteCode, onInviteCodeChange,
  password, strength, onSignIn, onSignUp, onGoogleSignIn, onForgotPassword,
}: AuthFormProps) {
  return (
    <div className="flex w-full lg:w-1/2 min-h-screen items-center justify-center p-4 sm:p-8 lg:p-12 xl:p-16">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="w-full max-w-md"
      >
        {/* ── Mobile logo (visible only below lg) ── */}
        <div style={{ animation: 'fadeSlideIn 0.4s ease-out 0.1s both' }} className="lg:hidden mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-champagne/[0.12] mb-4 shadow-[0_0_25px_-6px_rgba(190,169,142,0.25)] ring-1 ring-champagne/20 ring-inset">
            <ReceiptText className="h-7 w-7 text-champagne" />
          </div>
          <h1 className="text-2xl font-bold text-white">{APP_NAME}</h1>
          <p className="text-xs text-text-muted mt-1">CRA-Ready Receipt Intelligence</p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <GlassCard>
              <div className="p-6 sm:p-8">
                {/* ── Header ── */}
                <div style={{ animation: 'fadeSlideIn 0.35s ease-out 0.05s both' }} className="mb-6">
                  <h2 className="text-[22px] font-bold tracking-tight text-white">
                    {mode === 'signin' ? 'Welcome back' : 'Create account'}
                  </h2>
                  <p className="mt-1.5 text-sm text-text-secondary/70 leading-relaxed">
                    {mode === 'signin'
                      ? 'Sign in to access your workspace'
                      : 'Start capturing and organizing receipts securely'}
                  </p>
                </div>

                {/* ── Google OAuth ── */}
                <div style={{ animation: 'fadeSlideIn 0.35s ease-out 0.1s both' }}>
                  <button
                    type="button"
                    onClick={onGoogleSignIn}
                    disabled={loading}
                    className={cn(
                      'group relative w-full h-11 rounded-xl overflow-hidden transition-all duration-300',
                      'border border-white/[0.08] bg-white/[0.03]',
                      'hover:border-champagne/25 hover:bg-white/[0.06]',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne/30 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
                    )}
                  >
                    {/* Hover glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-champagne/0 via-champagne/[0.03] to-champagne/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <span className="relative z-10 flex items-center justify-center gap-2.5 text-sm font-medium text-text-secondary group-hover:text-white transition-colors duration-200">
                      <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                      Continue with Google
                    </span>
                  </button>
                </div>

                {/* ── Divider ── */}
                <div style={{ animation: 'fadeSlideIn 0.35s ease-out 0.15s both' }} className="relative my-5 ">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/[0.06]" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-[var(--obsidian)] px-3 text-white/50">or continue with email</span>
                  </div>
                </div>

                {/* ── Sign In Form ── */}
                {mode === 'signin' ? (
                  <form onSubmit={signinForm.handleSubmit(onSignIn)} className="space-y-4">
                    {/* Root error — keep AnimatePresence for error appear/disappear */}
                    <AnimatePresence>
                      {signinForm.formState.errors.root && (
                        <motion.div
                          initial={{ opacity: 0, y: -6, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: 'auto' }}
                          exit={{ opacity: 0, y: -6, height: 0 }}
                          className="flex items-center gap-2 rounded-xl border border-danger/20 bg-danger/[0.06] px-3.5 py-2.5 text-xs text-danger/90"
                        >
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          <span>{signinForm.formState.errors.root.message}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Email field */}
                    <div style={{ animation: 'fadeSlideIn 0.35s ease-out 0.2s both' }} className="space-y-1.5 ">
                      <label htmlFor="signin-email" className={labelBase}>Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 pointer-events-none" />
                        <input
                          id="signin-email"
                          {...signinForm.register('email')}
                          type="email"
                          autoComplete="email"
                          placeholder="you@company.ca"
                          className={cn(
                            inputBase, 'pl-10',
                            signinForm.formState.errors.email ? inputError : inputNormal,
                          )}
                        />
                      </div>
                      {signinForm.formState.errors.email && (
                        <p className="text-[11px] text-danger animate-[fadeIn_0.2s_ease-out]">{signinForm.formState.errors.email.message}</p>
                      )}
                    </div>

                    {/* Password field */}
                    <div style={{ animation: 'fadeSlideIn 0.35s ease-out 0.25s both' }} className="space-y-1.5 ">
                      <label htmlFor="signin-password" className={labelBase}>Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 pointer-events-none" />
                        <input
                          id="signin-password"
                          {...signinForm.register('password')}
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          placeholder="••••••••"
                          className={cn(
                            inputBase, 'pl-10 pr-10',
                            signinForm.formState.errors.password ? inputError : inputNormal,
                          )}
                        />
                        <button
                          type="button"
                          aria-label="Toggle password visibility"
                          onClick={onTogglePassword}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-text-secondary transition-colors duration-200 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {signinForm.formState.errors.password && (
                        <p className="text-[11px] text-danger animate-[fadeIn_0.2s_ease-out]">{signinForm.formState.errors.password.message}</p>
                      )}
                    </div>

                    {/* Remember me + Forgot password */}
                    <div style={{ animation: 'fadeSlideIn 0.35s ease-out 0.3s both' }} className="flex items-center justify-between ">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                          {...signinForm.register('rememberMe')}
                          type="checkbox"
                          className="h-4 w-4 rounded border-white/20 bg-white/[0.03] text-champagne focus:ring-champagne/20 focus:ring-offset-0 accent-champagne"
                        />
                        <span className="text-xs text-white/50 group-hover:text-text-secondary transition-colors duration-200">Remember me</span>
                      </label>
                      <button
                        type="button"
                        onClick={onForgotPassword}
                        disabled={forgotLoading}
                        className="text-xs text-champagne-dim/70 hover:text-champagne transition-colors duration-200 disabled:opacity-50"
                      >
                        {forgotLoading ? 'Sending…' : 'Forgot password?'}
                      </button>
                    </div>

                    {/* Submit button */}
                    <div style={{ animation: 'fadeSlideIn 0.35s ease-out 0.35s both' }}>
                      <button
                        type="submit"
                        disabled={loading}
                        className={cn(
                          'shimmer-auth relative w-full h-11 rounded-xl overflow-hidden font-bold text-sm transition-all duration-300',
                          'border border-champagne/20',
                          'disabled:opacity-50 disabled:cursor-not-allowed',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne/30 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
                          'hover:shadow-[0_0_25px_-6px_rgba(190,169,142,0.35)]',
                        )}
                      >
                        <span className="relative z-10 flex items-center justify-center gap-1.5 text-black">
                          {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <><ArrowRight className="h-4 w-4" /> Sign In</>
                          )}
                        </span>
                      </button>
                    </div>
                  </form>
                ) : (
                  /* ── Sign Up Form ── */
                  <form onSubmit={signupForm.handleSubmit(onSignUp)} className="space-y-4">
                    {/* Root error */}
                    <AnimatePresence>
                      {signupForm.formState.errors.root && (
                        <motion.div
                          initial={{ opacity: 0, y: -6, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: 'auto' }}
                          exit={{ opacity: 0, y: -6, height: 0 }}
                          className="flex items-center gap-2 rounded-xl border border-danger/20 bg-danger/[0.06] px-3.5 py-2.5 text-xs text-danger/90"
                        >
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          <span>{signupForm.formState.errors.root.message}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Email field */}
                    <div style={{ animation: 'fadeSlideIn 0.35s ease-out 0.2s both' }} className="space-y-1.5 ">
                      <label htmlFor="signup-email" className={labelBase}>Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 pointer-events-none" />
                        <input
                          id="signup-email"
                          {...signupForm.register('email')}
                          type="email"
                          autoComplete="email"
                          placeholder="you@company.ca"
                          className={cn(
                            inputBase, 'pl-10',
                            signupForm.formState.errors.email ? inputError : inputNormal,
                          )}
                        />
                      </div>
                      {signupForm.formState.errors.email && (
                        <p className="text-[11px] text-danger animate-[fadeIn_0.2s_ease-out]">{signupForm.formState.errors.email.message}</p>
                      )}
                    </div>

                    {/* Password field */}
                    <div style={{ animation: 'fadeSlideIn 0.35s ease-out 0.25s both' }} className="space-y-1.5 ">
                      <label htmlFor="signup-password" className={labelBase}>Create password</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 pointer-events-none" />
                        <input
                          id="signup-password"
                          {...signupForm.register('password')}
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          placeholder="Create a strong password"
                          className={cn(
                            inputBase, 'pl-10 pr-10',
                            signupForm.formState.errors.password ? inputError : inputNormal,
                          )}
                        />
                        <button
                          type="button"
                          aria-label="Toggle password visibility"
                          onClick={onTogglePassword}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-text-secondary transition-colors duration-200 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {signupForm.formState.errors.password && (
                        <p className="text-[11px] text-danger animate-[fadeIn_0.2s_ease-out]">{signupForm.formState.errors.password.message}</p>
                      )}

                      {/* Password strength */}
                      {password && (
                        <div className="space-y-2 pt-1 animate-[fadeSlideIn_0.3s_ease-out]">
                          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden ring-1 ring-white/5 ring-inset">
                            <div
                              className={cn('h-full rounded-full transition-all duration-400 ease-out', strength.color)}
                              style={{ width: strength.width }}
                            />
                          </div>
                          <p className={cn(
                            'text-[11px] font-medium',
                            strength.score <= 1 ? 'text-danger' :
                            strength.score === 2 ? 'text-warning' :
                            strength.score === 3 ? 'text-champagne-dim' : 'text-emerald-light',
                          )}>
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
                                  <span className={cn('text-[11px]', met ? 'text-text-secondary' : 'text-white/50')}>
                                    {req.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Invite code */}
                    <div style={{ animation: 'fadeSlideIn 0.35s ease-out 0.3s both' }} className="space-y-1.5 ">
                      <label htmlFor="signup-invite" className={labelBase}>
                        Invite code <span className="text-white/20 normal-case font-normal">(optional)</span>
                      </label>
                      <input
                        id="signup-invite"
                        type="text"
                        value={inviteCode}
                        onChange={(e) => onInviteCodeChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        maxLength={6}
                        className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white outline-none transition-all duration-200 placeholder:text-white/20 focus:border-champagne/50 focus:ring-2 focus:ring-champagne/20 font-mono tracking-[0.3em] text-center"
                      />
                      <p className="text-[11px] text-white/50">Enter the 6-digit code if you were invited by a workspace owner</p>
                    </div>

                    {/* Terms acceptance */}
                    <div style={{ animation: 'fadeSlideIn 0.35s ease-out 0.35s both' }}>
                      <button
                        type="button"
                        onClick={() => signupForm.setValue('accepted', !signupForm.getValues('accepted'), { shouldValidate: true })}
                        className={cn(
                          'flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-all duration-200 cursor-pointer',
                          signupForm.getValues('accepted')
                            ? 'border-champagne/30 bg-champagne/[0.05]'
                            : 'border-white/[0.06] bg-white/[0.02] hover:border-white/10',
                        )}
                      >
                        <div
                          className={cn(
                            'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all duration-200',
                            signupForm.getValues('accepted')
                              ? 'border-champagne bg-champagne text-black'
                              : 'border-white/20 bg-white/[0.03]',
                          )}
                        >
                          {signupForm.getValues('accepted') && (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          )}
                        </div>
                        <p className="text-xs leading-5 text-white/50">I accept responsibility for reviewing exported tax and accounting data</p>
                      </button>
                      {signupForm.formState.errors.accepted && (
                        <p className="text-[11px] text-danger mt-1 animate-[fadeIn_0.2s_ease-out]">{signupForm.formState.errors.accepted.message}</p>
                      )}
                    </div>

                    {/* Submit button */}
                    <div style={{ animation: 'fadeSlideIn 0.35s ease-out 0.4s both' }}>
                      <button
                        type="submit"
                        disabled={loading}
                        className={cn(
                          'shimmer-auth relative w-full h-11 rounded-xl overflow-hidden font-bold text-sm transition-all duration-300',
                          'border border-champagne/20',
                          'disabled:opacity-50 disabled:cursor-not-allowed',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne/30 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
                          'hover:shadow-[0_0_25px_-6px_rgba(190,169,142,0.35)]',
                        )}
                      >
                        <span className="relative z-10 flex items-center justify-center gap-1.5 text-black">
                          {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <><Sparkles className="h-4 w-4" /> Create Account</>
                          )}
                        </span>
                      </button>
                    </div>
                  </form>
                )}

                {/* ── Mode switch ── */}
                <div style={{ animation: 'fadeSlideIn 0.35s ease-out 0.45s both' }} className="mt-6 text-center ">
                  <button
                    type="button"
                    onClick={() => onModeChange(mode === 'signin' ? 'signup' : 'signin')}
                    className="inline-flex items-center gap-1 text-xs font-medium text-white/50 hover:text-champagne transition-colors duration-200 cursor-pointer"
                  >
                    {mode === 'signin' ? (
                      <>Don&apos;t have an account? <span className="text-champagne hover:text-champagne/80 underline underline-offset-2 transition-colors">Sign up</span></>
                    ) : (
                      <>Already have an account? <span className="text-champagne hover:text-champagne/80 underline underline-offset-2 transition-colors">Sign in</span></>
                    )}
                  </button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
