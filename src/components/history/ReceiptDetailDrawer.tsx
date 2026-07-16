'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { AlertCircle, BrainCircuit, DollarSign, Loader2, MessageSquare, Send, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { updateReceiptApproval, deleteReceipt } from '@/lib/services/receipts';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { getReceiptImageUrl } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';
import type { ReceiptRow, UserRole } from '@/lib/types';
import { toNumber, formatCurrency, formatDate, categoryColor, confidenceTone, approvalBadge } from '@/lib/ui-utils';
import { Lightbox } from '@/components/ui/lightbox';

interface ReceiptDetailModalProps {
  /** The receipt to display */
  receipt: ReceiptRow;
  /** Callback when the drawer should close */
  onClose: () => void;
  /** Current user's role for permission gating */
  role?: UserRole;
  /** Called after any mutation (approve/delete) completes */
  onUpdate?: () => Promise<void> | void;
}

export default function ReceiptDetailDrawer({ receipt, onClose, role = 'Owner', onUpdate }: ReceiptDetailModalProps) {
  const score = toNumber(receipt.confidence_score);
  const tone = confidenceTone(score);
  const [localApproval, setLocalApproval] = useState(receipt.approval_status ?? 'submitted');
  const [, setApprovalLoading] = useState(false);
  const [, setEditError] = useState('');

  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<{ id: string; comment: string; created_at: string; user_id?: string; user?: { email: string } }[]>([]);
  const [commentLoading, setCommentLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/receipts/comments?receiptId=${receipt.id}`)
      .then(res => res.json())
      .then(data => { if (data.data) setComments(data.data) })
      .catch(() => toast.error('Failed to load comments.'));
  }, [receipt.id]);

  async function handlePostComment() {
    if (!commentText.trim()) return;
    setCommentLoading(true);
    try {
      const res = await fetch('/api/receipts/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiptId: receipt.id, comment: commentText })
      });
      if (res.ok) {
        setCommentText('');
        const { data } = await res.json();
        setComments(prev => [...prev, data]);
        if (role === 'Accountant' && localApproval !== 'needs_clarification') {
          handleApproval('needs_clarification' as 'approved' | 'rejected');
        }
      }
    } finally {
      setCommentLoading(false);
    }
  }

  const approval = approvalBadge(localApproval);
  const needsReimburse = receipt.paid_by === 'employee_cash';

  async function handleApproval(status: 'approved' | 'rejected') {
    setApprovalLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      await updateReceiptApproval(
        receipt.id, status, user.id,
        needsReimburse, receipt.vendor_name || 'Unknown', receipt.transaction_date || ''
      );

      setLocalApproval(status);
      if (onUpdate) await onUpdate();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Approval failed.';
      setEditError(message);
      toast.error(message);
    } finally {
      setApprovalLoading(false);
    }
  }

  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      await deleteReceipt(receipt.id, user.id);
      
      onClose();
      if (onUpdate) await onUpdate();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Delete failed.';
      setEditError(message);
      toast.error(message);
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  }

  const [displayUrl, setDisplayUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    async function getFreshUrl() {
      if (!receipt.image_url) { setImageLoading(false); return; }
      setImageLoading(true);
      setImageError(false);
      try {
        const freshUrl = await getReceiptImageUrl(receipt.image_url);
        setDisplayUrl(freshUrl);
      } catch {
        setImageError(true);
      } finally {
        setImageLoading(false);
      }
    }
    getFreshUrl();
  }, [receipt.image_url]);

  const handleRetryImage = useCallback(async () => {
    if (!receipt.image_url) return;
    setImageLoading(true);
    setImageError(false);
    try {
      const freshUrl = await getReceiptImageUrl(receipt.image_url);
      setDisplayUrl(freshUrl);
    } catch {
      setImageError(true);
    } finally {
      setImageLoading(false);
    }
  }, [receipt.image_url]);

  const imageUrl = displayUrl ?? '';

  return (
      <div className="flex w-full flex-col overflow-hidden pb-12">
        <div className="flex items-center justify-between gap-3 px-5 py-6">
          <div className="min-w-0">
            <h3 className="truncate text-2xl font-black text-text-primary tracking-tight">
              {receipt.vendor_name ?? 'Unknown Vendor'}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <p className="text-xs font-bold text-text-muted uppercase tracking-widest">{formatDate(receipt.transaction_date)}</p>
              <Badge variant="outline" className={cn("rounded-full px-3 py-1 font-black uppercase tracking-widest", approval.cls)}>
                {approval.label}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleteLoading}
              className="h-12 w-12 rounded-[2rem] bg-danger/10 text-danger border-danger/20 hover:bg-danger/20"
              aria-label="Delete receipt"
            >
              {deleteLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-12 w-12 rounded-[2rem] bg-surface-raised"
              aria-label="Close receipt details"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 space-y-8">
          {imageLoading ? (
            <div className="relative min-h-[300px] rounded-[3rem] border border-glass-border bg-obsidian/20 overflow-hidden shadow-2xl flex items-center justify-center" role="status" aria-live="polite" aria-label="Loading receipt image">
              <Loader2 className="h-8 w-8 animate-spin text-champagne" />
            </div>
          ) : imageError ? (
            <div className="relative min-h-[300px] rounded-[3rem] border border-danger/20 bg-danger/5 overflow-hidden shadow-2xl flex flex-col items-center justify-center gap-2" role="alert">
              <AlertCircle className="h-8 w-8 text-danger" />
              <p className="text-sm text-text-muted">Failed to load receipt image</p>
              <button
                type="button"
                onClick={handleRetryImage}
                className="rounded-[2rem] border border-danger/30 px-4 py-1.5 text-xs font-semibold text-danger hover:bg-danger/10"
              >
                Retry
              </button>
            </div>
          ) : imageUrl ? (
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="relative min-h-[300px] w-full rounded-[3rem] border border-glass-border bg-obsidian/20 overflow-hidden shadow-2xl cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne"
              aria-label="View receipt image full-screen"
            >
              <Image
                src={imageUrl}
                alt={`Receipt from ${receipt.vendor_name ?? 'Unknown'} on ${formatDate(receipt.transaction_date)}`}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </button>
          ) : null}

          <div className="grid gap-6 sm:grid-cols-2">
            <Card className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <BrainCircuit className="h-4 w-4 text-primary" />
                AI Analysis
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">Confidence Score</span>
                <span className={cn("text-xl font-bold tabular-nums", tone.label.includes('High') ? 'text-emerald-light' : 'text-warning')}>
                  {score}%
                </span>
              </div>
              <div className="mt-4 h-2 w-full bg-muted rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${score}%` }}
                  className={cn("h-full", tone.label.includes('High') ? 'bg-emerald-success' : 'bg-warning')}
                />
              </div>
            </Card>

            <Card className="rounded-xl border bg-primary/10 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4 text-xs font-bold uppercase tracking-widest text-primary/80">
                <DollarSign className="h-4 w-4" />
                Gross Total
              </div>
              <p className="text-4xl font-bold tracking-tight tabular-nums text-primary">
                {formatCurrency(toNumber(receipt.total_amount), receipt.currency ?? 'CAD')}
              </p>
            </Card>
          </div>

          <Card className="rounded-xl border bg-card overflow-hidden shadow-sm">
            <div className="border-b bg-muted/20 px-6 py-4">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Compliance Records</p>
            </div>
            <div className="grid gap-x-8 gap-y-6 p-6 sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Vendor Entity</p>
                <p className="text-sm font-bold">{receipt.vendor_name || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Tax Identification (BN)</p>
                <p className="text-sm font-bold">{receipt.vendor_tax_number || receipt.business_number || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Transaction Date</p>
                <p className="text-sm font-bold">{formatDate(receipt.transaction_date)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Ledger Category</p>
                <Badge variant="outline" className={cn("mt-1 rounded-full px-3 py-1 font-bold uppercase tracking-widest", categoryColor(receipt.category ?? ''))}>
                  {receipt.category || 'Uncategorized'}
                </Badge>
              </div>
            </div>
          </Card>

          <Card className="rounded-xl border bg-card overflow-hidden shadow-sm">
            <div className="border-b bg-muted/20 px-6 py-4 flex items-center gap-3">
              <MessageSquare className="h-4 w-4 text-primary" />
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Clarification & Comments</p>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="space-y-4 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                {comments.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No comments yet.</p>
                ) : (
                  comments.map(c => (
                    <div key={c.id} className="rounded-lg bg-muted/30 p-3 text-sm">
                      <p className="text-xs font-bold text-muted-foreground mb-1">{c.user?.email || 'User'} <span className="font-normal opacity-70 ml-2">{new Date(c.created_at).toLocaleString()}</span></p>
                      <p>{c.comment}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="text"
                  placeholder="Ask for clarification or add a note..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                  aria-label="Add a comment"
                  className="flex-1 rounded-lg border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
                <Button
                  onClick={handlePostComment}
                  disabled={commentLoading || !commentText.trim()}
                  size="icon"
                  aria-label="Send comment"
                >
                  {commentLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </Card>
        </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Receipt Record</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this receipt from the ledger. The original data will be preserved in the audit trail, but this entry will no longer appear in reports or searches.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              render={<Button variant="outline" className="rounded-xl font-semibold" />}
            />
            <AlertDialogAction
              disabled={deleteLoading}
              render={<Button variant="destructive" className="rounded-xl font-semibold" />}
              onClick={handleDelete}
            >
              {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete Record
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {lightboxOpen && imageUrl && (
        <Lightbox
          images={[{ src: imageUrl, alt: `Receipt from ${receipt.vendor_name ?? 'Unknown'}` }]}
          initialIndex={0}
          onClose={() => setLightboxOpen(false)}
        />
      )}
      </div>
  );
}
