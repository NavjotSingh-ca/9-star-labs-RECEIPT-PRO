// LOCKED: NON-CORE

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(_params: SendEmailParams) {
  return { id: 'skipped', error: null };
}

export async function sendApprovalRequestEmail(_to: string, _receiptDetails: { vendor: string; amount: string; date: string; employee: string }) {
  return { id: 'skipped', error: null };
}

export async function sendReimbursementConfirmation(_to: string, _receiptDetails: { vendor: string; amount: string; date: string; method: string; reference: string }) {
  return { id: 'skipped', error: null };
}

export async function sendMonthlySummary(_to: string, _summary: { month: string; total: string; receiptCount: number; topCategory: string; topAmount: string }) {
  return { id: 'skipped', error: null };
}
