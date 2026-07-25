/**
 * Toast — Lightweight notification system.
 * Uses a portal to render at the top level.
 */

import { forwardRef, type HTMLAttributes, type ReactNode, useEffect, useState, createContext, useContext } from 'react';
import { cn } from '../utils';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { Button } from './Button';

export type ToastVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

export interface ToastProps {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  duration?: number;
  action?: { label: string; onClick: () => void };
}

export interface ToastContainerProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  className?: string;
}

export interface ToastContextValue {
  toasts: ToastProps[];
  addToast: (toast: Omit<ToastProps, 'id'>) => string;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const variantIcons: Record<ToastVariant, ReactNode> = {
  default: <Info className="h-5 w-5" aria-hidden="true" />,
  success: <CheckCircle2 className="h-5 w-5" aria-hidden="true" />,
  warning: <AlertTriangle className="h-5 w-5" aria-hidden="true" />,
  danger: <AlertCircle className="h-5 w-5" aria-hidden="true" />,
  info: <Info className="h-5 w-5" aria-hidden="true" />,
};

const variantStyles: Record<ToastVariant, string> = {
  default: 'border-glass-border bg-surface-raised',
  success: 'border-success/30 bg-success-soft/50',
  warning: 'border-warning/30 bg-warning-soft/50',
  danger: 'border-danger/30 bg-danger-soft/50',
  info: 'border-info/30 bg-info-soft/50',
};

const variantIconColors: Record<ToastVariant, string> = {
  default: 'text-info',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  info: 'text-info',
};

interface ToastItemProps extends HTMLAttributes<HTMLDivElement> {
  toast: ToastProps;
  onClose: (id: string) => void;
}

const ToastItem = forwardRef<HTMLDivElement, ToastItemProps>(
  ({ toast, onClose, className, ...props }, ref) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
      if (toast.duration !== 0) {
        const timer = setTimeout(() => {
          setVisible(false);
          setTimeout(() => onClose(toast.id), 200);
        }, toast.duration ?? 5000);
        return () => clearTimeout(timer);
      }
    }, [toast, onClose]);

    if (!visible) return null;

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-start gap-3 p-4 rounded-xl shadow-lg border min-w-[300px] max-w-md',
          'animate-in slide-in-from-top-2 duration-300 ease-out',
          'data-[state=closed]:animate-out data-[state=closed]:slide-out-to-top-2 data-[state=closed]:fade-out data-[state=closed]:duration-200',
          variantStyles[toast.variant],
          className
        )}
        role="alert"
        aria-live="polite"
        {...props}
      >
        <div className={cn('flex-shrink-0 mt-0.5', variantIconColors[toast.variant])}>
          {variantIcons[toast.variant]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-text-primary">{toast.title}</p>
          {toast.description && (
            <p className="mt-1 text-sm text-text-muted">{toast.description}</p>
          )}
          {toast.action && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => {
                toast.action?.onClick();
                onClose(toast.id);
              }}
            >
              {toast.action.label}
            </Button>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0 text-text-muted hover:text-text-primary"
          onClick={() => onClose(toast.id)}
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    );
  }
);

ToastItem.displayName = 'ToastItem';

const positionStyles = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
} as const;

export const ToastContainer = ({ position = 'top-right', className }: ToastContainerProps) => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = (toast: Omit<ToastProps, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const newToast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);
    return id;
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      <div
        className={cn(
          'fixed z-[9999] flex flex-col gap-2 pointer-events-none',
          positionStyles[position],
          className
        )}
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onClose={removeToast}
            className="pointer-events-auto"
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

ToastContainer.displayName = 'ToastContainer';

/**
 * ToastProvider — Wrapper for app-level toast management.
 * Manages real toast state so children get working addToast/removeToast.
 */
export const ToastProvider = ({ children, position = 'top-right' }: { children: ReactNode; position?: ToastContainerProps['position'] }) => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = (toast: Omit<ToastProps, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    return id;
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div
        className={cn(
          'fixed z-[9999] flex flex-col gap-2 pointer-events-none',
          positionStyles[position],
        )}
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onClose={removeToast}
            className="pointer-events-auto"
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// Re-export for convenience
export { ToastContext };
export { ToastContainer as default };