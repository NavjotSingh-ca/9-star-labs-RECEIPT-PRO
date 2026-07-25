'use client';

import { Input as DesignInput, type InputProps as DesignInputProps } from '@design/primitives';
import { cn } from '@design/utils';

/**
 * Input — Thin wrapper delegating to @design/primitives/Input.
 * The old API was a plain input with className and type.
 * The new Input wraps with label, error, helperText. We support both.
 */

function Input({
  className,
  type,
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  variant = 'default',
  fullWidth = true,
  onChange,
  disabled,
  required,
  id,
  ...props
}: React.ComponentProps<'input'> & {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: DesignInputProps['variant'];
  fullWidth?: boolean;
  // Support standard React ChangeEventHandler
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}) {
  // If it's a simple input without label/error/helper, use the design Input directly
  if (!label && !error && !helperText && !leftIcon && !rightIcon) {
    return (
      <DesignInput
        type={type}
        className={cn(fullWidth && 'w-full', className)}
        disabled={disabled}
        required={required}
        id={id}
        onChange={onChange}
        {...props}
      />
    );
  }

  // Otherwise use full featured Input
  return (
    <DesignInput
      type={type}
      label={label}
      error={error}
      helperText={helperText}
      leftIcon={leftIcon}
      rightIcon={rightIcon}
      variant={variant}
      fullWidth={fullWidth}
      disabled={disabled}
      required={required}
      id={id}
      onChange={onChange}
      className={className}
      {...props}
    />
  );
}

export { Input };