'use client';

import Link from 'next/link';
import { Mail, ReceiptText } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';

export function Footer() {
  return (
    <footer className="border-t border-glass-border py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-champagne/15">
              <ReceiptText className="h-3.5 w-3.5 text-champagne" />
            </div>
            <span className="text-xs font-bold tracking-tight text-text-primary">{APP_NAME}</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-text-muted/70">
            <Link href="/terms" className="hover:text-text-primary transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-text-primary transition-colors">Privacy</Link>
            <a href="mailto:security@9starlabs.ca" className="hover:text-text-primary transition-colors inline-flex items-center gap-1">
              <Mail className="h-3 w-3" /> Contact
            </a>
            <span>&copy; {new Date().getFullYear()} 9 Star Labs. All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;