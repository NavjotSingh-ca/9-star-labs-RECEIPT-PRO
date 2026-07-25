/**
 * Avatar — User avatar with image and fallback support.
 * Supports sizes: sm (32px), md (40px), lg (64px).
 */

'use client';

import { forwardRef, useState, type HTMLAttributes } from 'react';
import { cn } from '../utils';

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-16 text-base',
} as const;

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ size = 'md', className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="avatar"
        data-size={size}
        className={cn(
          'relative flex shrink-0 overflow-hidden rounded-full',
          'bg-champagne/10',
          sizeStyles[size],
          className
        )}
        role={props.role ?? 'img'}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Avatar.displayName = 'Avatar';

export interface AvatarImageProps extends HTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
}

export const AvatarImage = forwardRef<HTMLImageElement, AvatarImageProps>(
  ({ className, alt, ...props }, ref) => {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);

    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        ref={ref}
        data-slot="avatar-image"
        alt={alt}
        className={cn(
          'aspect-square h-full w-full object-cover',
          !loaded && !error && 'opacity-0',
          className
        )}
        style={{ transition: 'opacity 200ms ease-in' }}
        onLoad={() => setLoaded(true)}
        onError={() => {
          setError(true);
          setLoaded(false);
        }}
        {...props}
      />
    );
  }
);
AvatarImage.displayName = 'AvatarImage';

export interface AvatarFallbackProps extends HTMLAttributes<HTMLSpanElement> {
  children: string;
}

export const AvatarFallback = forwardRef<HTMLSpanElement, AvatarFallbackProps>(
  ({ className, children, ...props }, ref) => {
    const initials = children
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    return (
      <span
        ref={ref}
        data-slot="avatar-fallback"
        aria-hidden="true"
        className={cn(
          'flex h-full w-full items-center justify-center rounded-full',
          'bg-champagne/10 text-xs font-medium text-champagne',
          className
        )}
        {...props}
      >
        {initials}
      </span>
    );
  }
);
AvatarFallback.displayName = 'AvatarFallback';

export default Avatar;