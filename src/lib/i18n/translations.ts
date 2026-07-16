/**
 * Internationalization translations for Leduc Receipt Pro
 * Supports English (default) and French (Quebec compliance)
 */

export type Locale = 'en' | 'fr';

interface Translations {
  [key: string]: string | ((params?: Record<string, unknown>) => string);
}

export const translations: Record<Locale, Translations> = {
  en: {
    // Common
    home: 'Home',
    scan: 'Scan',
    records: 'Records',
    settings: 'Settings',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    delete: 'Delete',
    edit: 'Edit',
    loading: 'Loading...',
    error: 'Error',
    retry: 'Retry',

    // Scanner
    scannerTitle: 'Smart Receipt Scanner',
    scannerSubtitle: 'AI-powered receipt processing for CRA compliance',
    captureReceipt: 'Capture Receipt',
    processing: 'Processing receipt...',
    confirmData: 'Confirm Extracted Data',
    vendorName: 'Vendor Name',
    transactionDate: 'Transaction Date',
    totalAmount: 'Total Amount',
    gstAmount: 'GST Amount',
    pstAmount: 'PST Amount',
    category: 'Category',
    notes: 'Notes',
    iConfirmDataAccurate: 'I confirm the data above is accurate',

    // Budget
    budget: 'Budget',
    spendingInsights: 'Spending Insights',
    predictedSpend: 'Predicted Spend',
    remainingBudget: 'Remaining Budget',
    budgetExceeded: 'Budget Exceeded',

    // Audit
    auditTrail: 'Audit Trail',
    integrityVerified: 'Integrity Verified',
    integrityBroken: 'Integrity Compromised',
    chainIntegrity: 'Chain Integrity',

    // Navigation
    dashboard: 'Dashboard',
    smartSearch: 'Smart Search',
    bankReconciliation: 'Bank Reconciliation',
    mileage: 'Mileage',
    exportData: 'Export',
    auditLog: 'Audit Log',
    team: 'Team',
    taxForms: 'Tax Forms',
  },

  fr: {
    // Common
    home: 'Accueil',
    scan: 'Numériser',
    records: 'Reçus',
    settings: 'Paramètres',
    save: 'Sauvegarder',
    cancel: 'Annuler',
    confirm: 'Confirmer',
    delete: 'Supprimer',
    edit: 'Modifier',
    loading: 'Chargement...',
    error: 'Erreur',
    retry: 'Réessayer',

    // Scanner
    scannerTitle: 'Scanner de Reçus Intelligent',
    scannerSubtitle: 'Traitement de reçus alimenté par IA pour la conformité CRA',
    captureReceipt: 'Capturer le Reçu',
    processing: 'Traitement du reçu...',
    confirmData: 'Confirmer les Données Extraites',
    vendorName: 'Nom du Fournisseur',
    transactionDate: 'Date de Transaction',
    totalAmount: 'Montant Total',
    gstAmount: 'Montant TPS',
    pstAmount: 'Montant TVP',
    category: 'Catégorie',
    notes: 'Notes',
    iConfirmDataAccurate: 'Je confirme que les données ci-dessus sont exactes',

    // Budget
    budget: 'Budget',
    spendingInsights: 'Aperçu des Dépenses',
    predictedSpend: 'Dépense Prévue',
    remainingBudget: 'Budget Restant',
    budgetExceeded: 'Budget Dépassé',

    // Audit
    auditTrail: 'Journal d\'Audit',
    integrityVerified: 'Intégrité Vérifiée',
    integrityBroken: 'Intégrité Compromise',
    chainIntegrity: 'Intégrité de Chaîne',

    // Navigation
    dashboard: 'Tableau de Bord',
    smartSearch: 'Recherche Intelligente',
    bankReconciliation: 'Rapprochement Bancaire',
    mileage: 'Kilométrage',
    exportData: 'Exporter',
    auditLog: 'Journal d\'Audit',
    team: 'Équipe',
    taxForms: 'Formulaires Fiscaux',
  },
};

/**
 * Get current locale based on user preference or browser settings
 */
export function getCurrentLocale(): Locale {
  if (typeof window === 'undefined') return 'en';

  // Check user preference first
  const stored = localStorage.getItem('locale') as Locale | null;
  if (stored) return stored;

  // Check browser language
  const browserLang = navigator.language.split('-')[0];
  return browserLang === 'fr' ? 'fr' : 'en';
}

/**
 * Translation function
 */
export function t(key: string, locale: Locale = 'en', params?: Record<string, unknown>): string {
  const lang = translations[locale];
  const value = lang[key];

  if (typeof value === 'function') {
    return value(params);
  }

  return value || key;
}