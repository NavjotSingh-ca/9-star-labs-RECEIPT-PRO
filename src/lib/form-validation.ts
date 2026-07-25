/**
 * Form Validation — React Hook Form + Zod integration
 * Type-safe form validation with server and client-side validation.
 */

'use client';

import { useForm, useFieldArray, UseFormProps, UseFormReturn, FieldValues, Path, PathValue, Resolver } from 'react-hook-form';
import { z, ZodSchema } from 'zod';
import { useMemo, useState, useEffect } from 'react';

/**
 * Create a type-safe form hook with Zod schema
 */
export function createFormHook<T extends FieldValues>(schema: ZodSchema<T>) {
  return function useFormHook(options?: Omit<UseFormProps<T>, 'resolver'>) {
    return useForm<T>({
      // Manual resolver wrapper to bridge @hookform/resolvers v5 ↔ Zod v4 type gap
      resolver: ((data: unknown) => {
        const result = schema.safeParse(data);
        if (result.success) {
          return { values: result.data, errors: {} };
        }
        const errors: Record<string, { type: string; message: string }> = {};
        for (const issue of result.error.issues) {
          const path = issue.path.join('.') || 'root';
          if (!errors[path]) {
            errors[path] = { type: issue.code, message: issue.message };
          }
        }
        return { values: data as T, errors: errors };
      }) as unknown as Resolver<T>,
      mode: 'onChange',
      reValidateMode: 'onBlur',
      ...options,
    });
  };
}

/**
 * Common validation patterns
 */
export const validationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[1-9]\d{1,14}$/,
  postalCode: /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/,
  businessNumber: /^\d{9}$/,
  currency: /^\d+(\.\d{1,2})?$/,
  percentage: /^(100|\d{1,2})(\.\d{1,2})?$/,
  url: /^https?:\/\/.+/,
  alphanumeric: /^[a-zA-Z0-9\s\-_']+$/,
} as const;

/**
 * Common Zod schemas
 */
export const commonSchemas = {
  email: z.string().email('Invalid email address'),
  requiredString: (min = 1, max = 255) => z.string().min(min, `Must be at least ${min} characters`).max(max, `Must be no more than ${max} characters`),
  optionalString: (max = 255) => z.string().max(max, `Must be no more than ${max} characters`).optional().or(z.literal('')),
  currency: z.string().regex(validationPatterns.currency, 'Invalid currency amount').transform(Number),
  percentage: z.string().regex(validationPatterns.percentage, 'Invalid percentage').transform(Number),
  positiveNumber: z.number().positive('Must be a positive number'),
  nonNegativeNumber: z.number().nonnegative('Must be zero or positive'),
  integer: z.number().int('Must be a whole number'),
  url: z.string().url('Invalid URL'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
} as const;

/**
 * Form field validation helpers
 */
export const fieldValidation = {
  required: (message = 'This field is required') => (value: unknown) => 
    value === undefined || value === null || value === '' ? message : undefined,
  
  minLength: (min: number, message?: string) => (value: string) => 
    value && value.length < min ? message || `Must be at least ${min} characters` : undefined,
  
  maxLength: (max: number, message?: string) => (value: string) => 
    value && value.length > max ? message || `Must be no more than ${max} characters` : undefined,
  
  pattern: (regex: RegExp, message: string) => (value: string) => 
    value && !regex.test(value) ? message : undefined,
  
  min: (min: number, message?: string) => (value: number) => 
    value !== undefined && value < min ? message || `Must be at least ${min}` : undefined,
  
  max: (max: number, message?: string) => (value: number) => 
    value !== undefined && value > max ? message || `Must be no more than ${max}` : undefined,
  
  email: (message = 'Invalid email address') => (value: string) => 
    value && !validationPatterns.email.test(value) ? message : undefined,
  
  url: (message = 'Invalid URL') => (value: string) => 
    value && !validationPatterns.url.test(value) ? message : undefined,
  
  match: (otherField: string, message = 'Fields do not match') => (value: unknown, allValues: Record<string, unknown>) => 
    value !== allValues[otherField] ? message : undefined,
  
  oneOf: (values: unknown[], message = 'Invalid value') => (value: unknown) => 
    !values.includes(value) ? message : undefined,
  
  custom: <T>(validator: (value: T, allValues?: Record<string, unknown>) => string | undefined) => validator,
};

/**
 * Form submission helpers
 */
export interface SubmitOptions<T> {
  onSubmit: (data: T) => Promise<void>;
  onError?: (error: Error) => void;
  onSuccess?: (data: T) => void;
  resetOnSuccess?: boolean;
}

export function createFormSubmitHandler<T extends FieldValues>(
  form: UseFormReturn<T>,
  options: SubmitOptions<T>
) {
  return form.handleSubmit(async (data) => {
    try {
      await options.onSubmit(data);
      options.onSuccess?.(data);
      if (options.resetOnSuccess) {
        form.reset();
      }
    } catch (error) {
      options.onError?.(error as Error);
    }
  });
}

/**
 * Re-export useFieldArray for convenience
 */
export { useFieldArray };

/**
 * Watch field changes with debouncing
 */
export function useWatchField<T extends FieldValues>(
  form: UseFormReturn<T>,
  name: Path<T>,
  _debounceMs = 300
) {
  const [value, setValue] = useState(form.watch(name));
  
  useEffect(() => {
    const sub = form.watch((values) => {
      const fieldValue = (values as Record<string, unknown>)[name as string] as PathValue<T, Path<T>>;
      setValue(fieldValue);
    });
    return () => sub.unsubscribe();
  }, [form, name]);
  
  return value;
}

/**
 * Conditional field display
 */
export function useFieldVisibility<T extends FieldValues>(
  form: UseFormReturn<T>,
  conditions: Array<{ field: Path<T>; value: unknown; operator?: 'equals' | 'notEquals' | 'contains' | 'notContains' }>
) {
  const watchedValues = form.watch(conditions.map(c => c.field));
  
  return useMemo(() => {
    return conditions.every(({ field, value, operator = 'equals' }) => {
      const fieldValue = watchedValues[field as keyof typeof watchedValues];
      
      switch (operator) {
        case 'equals':
          return fieldValue === value;
        case 'notEquals':
          return fieldValue !== value;
        case 'contains':
          return Array.isArray(fieldValue) ? fieldValue.includes(value) : fieldValue === value;
        case 'notContains':
          return Array.isArray(fieldValue) ? !fieldValue.includes(value) : fieldValue !== value;
        default:
          return false;
      }
    });
  }, [watchedValues, conditions]);
}

/**
 * Async validation hook
 */
export function useAsyncValidation<T extends FieldValues>(
  form: UseFormReturn<T>,
  field: Path<T>,
  validator: (value: unknown) => Promise<string | undefined>,
  _debounceMs = 500
) {
  const [isValidating, setIsValidating] = useState(false);
  
  useEffect(() => {
    const sub = form.watch(async (values) => {
      const fieldValue = (values as Record<string, unknown>)[field as string];
      if (fieldValue === undefined || fieldValue === null || fieldValue === '') return;
      
      setIsValidating(true);
      
      try {
        const error = await validator(fieldValue);
        if (error) {
          form.setError(field, { type: 'async', message: error });
        } else {
          form.clearErrors(field);
        }
      } catch {
        form.setError(field, { type: 'async', message: 'Validation failed' });
      } finally {
        setIsValidating(false);
      }
    });
    
    return () => sub.unsubscribe();
  }, [form, field, validator]);
  
  return { isValidating };
}