import { useState, useCallback } from 'react';
import { getCurrentLocale, Locale, t } from '@/lib/i18n/translations';

/**
 * useTranslations - Hook for internationalization
 * Provides translation function and locale switching
 */
export function useTranslations() {
  const [locale, setLocaleState] = useState<Locale>(() => getCurrentLocale());

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('locale', newLocale);
  }, []);

  const translate = useCallback(
    (key: string, params?: Record<string, unknown>) => t(key, locale, params),
    [locale]
  );

  return { t: translate, locale, setLocale };
}