'use client';

import * as React from 'react';
import { cn, generateId } from '../utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, leftIcon, rightIcon, loading, id, disabled, required, ...props }, ref) => {
    const inputId = id || `input-${generateId()}`;
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helperText ? `${inputId}-helper` : undefined;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-text-secondary mb-1.5">
            {label}
            {required && <span className="text-danger ml-0.5" aria-hidden="true">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-text-muted/50" aria-hidden="true">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled || loading}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={cn(
              'flex h-10 w-full rounded-xl border bg-surface-raised px-4 py-2 text-sm text-text-primary',
              'placeholder:text-text-muted/50',
              'transition-all duration-200 ease-[0.32,0.72,0,1]',
              'focus:outline-none focus:ring-2 focus:ring-champagne/40 focus:border-transparent',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-hover',
              'aria-invalid:border-danger/50 aria-invalid:focus:ring-danger/40',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              loading && 'pr-10',
              className
            )}
            {...props}
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2" aria-hidden="true">
              <svg className="animate-spin h-4 w-4 text-champagne" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          )}
          {rightIcon && !loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted/50" aria-hidden="true">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p id={errorId} className="mt-1.5 text-xs font-medium text-danger" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className="mt-1.5 text-xs text-text-muted/70">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string; helperText?: string }>(
  ({ className, label, error, helperText, id, disabled, required, ...props }, ref) => {
    const textareaId = id || `textarea-${generateId()}`;
    const errorId = error ? `${textareaId}-error` : undefined;
    const helperId = helperText ? `${textareaId}-helper` : undefined;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="block text-xs font-medium text-text-secondary mb-1.5">
            {label}
            {required && <span className="text-danger ml-0.5" aria-hidden="true">*</span>}
          </label>
        )}
        <div className="relative">
          <textarea
            ref={ref}
            id={textareaId}
            disabled={disabled}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={cn(
              'flex min-h-[100px] w-full rounded-xl border bg-surface-raised px-4 py-3 text-sm text-text-primary resize-none',
              'placeholder:text-text-muted/50',
              'transition-all duration-200 ease-[0.32,0.72,0,1]',
              'focus:outline-none focus:ring-2 focus:ring-champagne/40 focus:border-champagne/30',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-hover',
              'aria-invalid:border-danger/50 aria-invalid:focus:ring-danger/40',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p id={errorId} className="mt-1.5 text-xs font-medium text-danger" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className="mt-1.5 text-xs text-text-muted/70">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn('block text-xs font-medium text-text-secondary mb-1.5', className)}
        {...props}
      >
        {children}
      </label>
    );
  }
);
Label.displayName = 'Label';

export { Input, Textarea, Label };