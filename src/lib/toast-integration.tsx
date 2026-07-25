/**
 * Toast Integration — Unified toast system
 * Wraps design system Toast with sonner-compatible API
 */

'use client';

import { useContext, createContext, ReactNode } from 'react';
import { ToastProvider as DesignToastProvider, useToast as useDesignToast } from '@design/primitives/Toast';

interface ToastOptions {
  description?: string;
  action?: { label: string; onClick: () => void };
  duration?: number;
  id?: string;
}

interface ToastContextValue {
  toast: (message: string, options?: ToastOptions) => string;
  dismiss: (id: string) => void;
  success: (message: string, options?: ToastOptions) => string;
  error: (message: string, options?: ToastOptions) => string;
  warning: (message: string, options?: ToastOptions) => string;
  info: (message: string, options?: ToastOptions) => string;
  loading: (message: string, options?: ToastOptions) => string;
  dismissAll: () => void;
}

// Create context
const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Custom ToastProvider that integrates design system with sonner-like API
 */
export function ToastProvider({ children, position = 'top-right' }: { children: ReactNode; position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center' }) {
  return (
    <DesignToastProvider position={position}>
      <ToastContextBridge>
        {children}
      </ToastContextBridge>
    </DesignToastProvider>
  );
}

/**
 * Bridge component that provides sonner-compatible API
 */
function ToastContextBridge({ children }: { children: ReactNode }) {
  const designToast = useDesignToast();

  const value: ToastContextValue = {
    toast: (message, options) => {
      return designToast.addToast({
        title: message,
        description: options?.description,
        variant: 'default',
        duration: options?.duration,
        action: options?.action ? {
          label: options.action.label,
          onClick: options.action.onClick,
        } : undefined,
      });
    },
    dismiss: (id) => designToast.removeToast(id),
    success: (message, options) => designToast.addToast({
      title: message,
      description: options?.description,
      variant: 'success',
      duration: options?.duration,
      action: options?.action ? { label: options.action.label, onClick: options.action.onClick } : undefined,
    }),
    error: (message, options) => designToast.addToast({
      title: message,
      description: options?.description,
      variant: 'danger',
      duration: options?.duration,
      action: options?.action ? { label: options.action.label, onClick: options.action.onClick } : undefined,
    }),
    warning: (message, options) => designToast.addToast({
      title: message,
      description: options?.description,
      variant: 'warning',
      duration: options?.duration,
      action: options?.action ? { label: options.action.label, onClick: options.action.onClick } : undefined,
    }),
    info: (message, options) => designToast.addToast({
      title: message,
      description: options?.description,
      variant: 'info',
      duration: options?.duration,
      action: options?.action ? { label: options.action.label, onClick: options.action.onClick } : undefined,
    }),
    loading: (message, options) => designToast.addToast({
      title: message,
      description: options?.description,
      variant: 'default', // loading not directly supported, use default
      duration: 0, // Don't auto-dismiss
      action: options?.action ? { label: options.action.label, onClick: options.action.onClick } : undefined,
    }),
    dismissAll: () => {
      // Clear all toasts - design system doesn't have this, we'd need to track IDs
      // For now, we'll just remove all via the internal state if exposed
    },
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
}

/**
 * Hook to use toast with sonner-compatible API
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

/**
 * Compatibility layer for sonner users
 * Provides the exact same API as sonner's useToast
 */
export function useSonnerToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  // Return sonner-compatible API
  return {
    toast: context.toast,
    dismiss: context.dismiss,
    success: context.success,
    error: context.error,
    warning: context.warning,
    info: context.info,
    loading: context.loading,
    dismissAll: context.dismissAll,
    // Sonner-specific
    promise: (promise: Promise<unknown>, messages: { loading: string; success: string | ((data: unknown) => string); error: string | ((err: unknown) => string) }) => {
      const id = context.loading(messages.loading);
      promise.then(
        (data) => {
          context.dismiss(id);
          const msg = typeof messages.success === 'function' ? messages.success(data) : messages.success;
          context.success(msg);
        },
        (err) => {
          context.dismiss(id);
          const msg = typeof messages.error === 'function' ? messages.error(err) : messages.error;
          context.error(msg);
        }
      );
      return id;
    },
  };
}

// Re-export design system toast sub-components
export { ToastContainer, useToast as useDesignToast } from '@design/primitives/Toast';
export type { ToastProps, ToastVariant } from '@design/primitives/Toast';