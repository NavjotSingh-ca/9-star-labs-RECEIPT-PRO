import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { ReceiptRow } from '@/lib/types';

const QBO_CLIENT_ID = process.env.QBO_CLIENT_ID || 'placeholder_qbo_client_id';
const QBO_CLIENT_SECRET = process.env.QBO_CLIENT_SECRET || 'placeholder_qbo_client_secret';
const QBO_REDIRECT_URI = process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/integrations/qbo/callback` : 'http://localhost:3000/api/integrations/qbo/callback';

// Circuit Breaker State
interface CircuitBreakerState {
  isOpen: boolean;
  failureCount: number;
  lastFailureTime: number | null;
  nextAttemptTime: number | null;
}

const circuitBreakerState: CircuitBreakerState = {
  isOpen: false,
  failureCount: 0,
  lastFailureTime: null,
  nextAttemptTime: null,
};

const CIRCUIT_BREAKER_THRESHOLD = 3;
const CIRCUIT_BREAKER_TIMEOUT = 60000; // 1 minute

function checkCircuitBreaker(): { isOpen: boolean; canProceed: boolean } {
  const now = Date.now();

  // Reset if timeout has passed
  if (circuitBreakerState.nextAttemptTime && now >= circuitBreakerState.nextAttemptTime) {
    circuitBreakerState.isOpen = false;
    circuitBreakerState.failureCount = 0;
    circuitBreakerState.nextAttemptTime = null;
  }

  return {
    isOpen: circuitBreakerState.isOpen,
    canProceed: !circuitBreakerState.isOpen,
  };
}

function recordFailure(): void {
  circuitBreakerState.failureCount++;
  circuitBreakerState.lastFailureTime = Date.now();

  if (circuitBreakerState.failureCount >= CIRCUIT_BREAKER_THRESHOLD) {
    circuitBreakerState.isOpen = true;
    circuitBreakerState.nextAttemptTime = Date.now() + CIRCUIT_BREAKER_TIMEOUT;
  }
}

function recordSuccess(): void {
  circuitBreakerState.failureCount = 0;
  circuitBreakerState.lastFailureTime = null;
  circuitBreakerState.nextAttemptTime = null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'connect') {
    // Initiate OAuth2 Handshake
    const authUrl = `https://appcenter.intuit.com/connect/oauth2?client_id=${QBO_CLIENT_ID}&response_type=code&scope=com.intuit.quickbooks.accounting&redirect_uri=${encodeURIComponent(QBO_REDIRECT_URI)}&state=security_token`;
    return NextResponse.redirect(authUrl);
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { receiptId, action } = body;

    if (action === 'sync') {
      // Check circuit breaker
      const { isOpen, canProceed } = checkCircuitBreaker();
      if (!canProceed) {
        return NextResponse.json({
          error: 'Service temporarily unavailable',
          message: 'Sync is temporarily unavailable due to repeated failures. Please try again later.',
          status: 'pending'
        }, { status: 503 });
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

      const { data: receipt, error } = await supabase
        .from('receipts')
        .select('*')
        .eq('id', receiptId)
        .single();

      if (error || !receipt) {
        recordFailure();
        return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
      }

      // Foundational mapping logic to QBO "Purchase" entity
      const qboPurchaseEntity = mapReceiptToQBOPurchase(receipt as ReceiptRow);

      // Simulated Sync Success
      recordSuccess();
      return NextResponse.json({
        success: true,
        message: `Receipt #${receiptId.slice(0, 8)} successfully mapped to QBO Purchase entity and queued for synchronization.`,
        integration: 'QuickBooks Online',
        payload: qboPurchaseEntity
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    recordFailure();
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

// Map our ReceiptRow to QBO Purchase Entity
function mapReceiptToQBOPurchase(receipt: ReceiptRow) {
  return {
    AccountRef: {
      value: "FIXME_ACCOUNT_ID", // Needs to be mapped from category
      name: receipt.category || "Uncategorized"
    },
    PaymentType: receipt.payment_method === 'credit_card' ? 'CreditCard' : 'Cash',
    EntityRef: {
      value: "FIXME_VENDOR_ID", // Needs to be matched with QBO Vendor
      name: receipt.vendor_name,
      type: "Vendor"
    },
    TotalAmt: receipt.total_amount,
    TxnDate: receipt.transaction_date,
    PrivateNote: receipt.notes || `Receipt ID: ${receipt.id}`,
    Line: [
      {
        Amount: receipt.subtotal || receipt.total_amount,
        DetailType: "AccountBasedExpenseLineDetail",
        AccountBasedExpenseLineDetail: {
          AccountRef: {
            value: "FIXME_EXPENSE_ACCOUNT_ID"
          },
          TaxAmount: receipt.tax_amount || 0,
          TaxCodeRef: {
            value: "TAX"
          }
        },
        Description: `Purchase from ${receipt.vendor_name}`
      }
    ]
  };
}
