import type { Meta, StoryObj } from '@storybook/nextjs';
import AuthForm from './AuthForm';
import { withProviders } from '../../../.storybook/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';

const signinSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional(),
});

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  inviteCode: z.string().optional().or(z.literal('')),
  accepted: z.boolean(),
});

function StorySignIn() {
  const signinForm = useForm({ resolver: zodResolver(signinSchema), defaultValues: { email: '', password: '', rememberMe: false } });
  const signupForm = useForm({ resolver: zodResolver(signupSchema), defaultValues: { email: '', password: '', inviteCode: '', accepted: false } });
  return (
    <div className="min-h-screen bg-obsidian">
      <AuthForm
        mode="signin" onModeChange={() => {}} showPassword={false}
        onTogglePassword={() => {}} loading={false} forgotLoading={false}
        signinForm={signinForm} signupForm={signupForm}
        inviteCode="" onInviteCodeChange={() => {}}
        password="" strength={{ width: '0%', color: 'bg-zinc-500', label: '', score: 0 }}
        onSignIn={() => {}} onSignUp={() => {}} onGoogleSignIn={() => {}} onForgotPassword={() => {}}
      />
    </div>
  );
}

function StorySignUpWeak() {
  const signinForm = useForm({ resolver: zodResolver(signinSchema), defaultValues: { email: '', password: '', rememberMe: false } });
  const signupForm = useForm({ resolver: zodResolver(signupSchema), defaultValues: { email: '', password: 'Weak1', inviteCode: '', accepted: false } });
  return (
    <div className="min-h-screen bg-obsidian">
      <AuthForm
        mode="signup" onModeChange={() => {}} showPassword={true}
        onTogglePassword={() => {}} loading={false} forgotLoading={false}
        signinForm={signinForm} signupForm={signupForm}
        inviteCode="" onInviteCodeChange={() => {}}
        password="Weak1" strength={{ width: '25%', color: 'bg-danger', label: 'Weak', score: 1 }}
        onSignIn={() => {}} onSignUp={() => {}} onGoogleSignIn={() => {}} onForgotPassword={() => {}}
      />
    </div>
  );
}

function StorySignUpStrong() {
  const signinForm = useForm({ resolver: zodResolver(signinSchema), defaultValues: { email: '', password: '', rememberMe: false } });
  const signupForm = useForm({ resolver: zodResolver(signupSchema), defaultValues: { email: '', password: 'StrongP@ss1', inviteCode: '', accepted: false } });
  return (
    <div className="min-h-screen bg-obsidian">
      <AuthForm
        mode="signup" onModeChange={() => {}} showPassword={true}
        onTogglePassword={() => {}} loading={false} forgotLoading={false}
        signinForm={signinForm} signupForm={signupForm}
        inviteCode="" onInviteCodeChange={() => {}}
        password="StrongP@ss1" strength={{ width: '100%', color: 'bg-emerald-light', label: 'Strong', score: 4 }}
        onSignIn={() => {}} onSignUp={() => {}} onGoogleSignIn={() => {}} onForgotPassword={() => {}}
      />
    </div>
  );
}

const meta: Meta<typeof AuthForm> = {
  title: 'Auth/AuthForm',
  component: AuthForm,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Right-side auth form for the split-screen layout. Supports sign-in and sign-up modes with email/password, Google OAuth, password strength meter with requirements checklist, show/hide toggle, invite code, and terms acceptance.' } },
    viewport: { defaultViewport: 'desktop' },
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof AuthForm>;

export const SignIn: Story = {
  render: () => <StorySignIn />,
};

export const SignUpWithWeakPassword: Story = {
  render: () => <StorySignUpWeak />,
};

export const SignUpWithStrongPassword: Story = {
  render: () => <StorySignUpStrong />,
};
