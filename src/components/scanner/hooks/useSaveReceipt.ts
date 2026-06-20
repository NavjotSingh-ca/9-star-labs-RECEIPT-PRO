'use client';

import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { generateDuplicateHash, generateIntegrityHash } from '@/lib/hash';
import { supabase } from '@/lib/supabase';
import { saveReceiptAction } from '@/app/actions/save-receipt';
import { logWarn } from '@/lib/logger';
import { handleSupabaseError, withRetry } from '@/lib/supabase-error-handler';
import { useAnalytics } from '@/hooks/use-analytics';
import type { ReceiptForm, ReceiptRow } from '@/components/scanner/types';

const STORAGE_BUCKET = 'receipt-images';

type DuplicateCandidate = ReceiptRow | null;

interface UseSaveReceiptDeps {
  user: { id: string } | null;
  orgId: string | null;
  imageSrc: string | null;
  formData: ReceiptForm;
  online: boolean;
  isBatchProcessing: boolean;
  onSaveSuccess: () => void;
  enqueue: (item: { payload: Record<string, unknown>; integrityHash: string; userId: string }) => Promise<string | undefined>;
}

export function useSaveReceipt(deps: UseSaveReceiptDeps) {
  const { user, orgId, imageSrc, formData, online, isBatchProcessing, onSaveSuccess, enqueue } = deps;
  const queryClient = useQueryClient();
  const savingRef = useRef(false);
  const { trackFeatureUsed } = useAnalytics();

  const [saving, setSaving] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [sqlError, setSqlError] = useState<string | null>(null);
  const [duplicateCandidate, setDuplicateCandidate] = useState<DuplicateCandidate>(null);
  const [, setPendingSave] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async ({ bypassCheck, localFormData }: { bypassCheck: boolean; localFormData: ReceiptForm }) => {
      if (!user) throw new Error('You must be logged in to save.');
      const computedHash = await generateDuplicateHash(
        localFormData.vendor_name,
        localFormData.transaction_date,
        localFormData.total_amount,
      );

      if (!bypassCheck && duplicateCandidate === null) {
        if (!orgId) throw new Error('Organization not loaded — cannot check for duplicates.');
        const { data: duplicates, error: dupCheckError } = await supabase
          .from('receipts')
          .select('id, created_at, vendor_name, total_amount')
          .eq('duplicate_hash', computedHash)
          .eq('org_id', orgId);

        if (dupCheckError) throw dupCheckError;
        if (duplicates && duplicates.length > 0) {
          setDuplicateCandidate(duplicates[0] as ReceiptRow);
          return { needsConfirmation: true };
        }
      }

      let imageUrl: string | null = null;
      let integrityHash = '';

      if (imageSrc) {
        try {
          const response = await fetch(imageSrc);
          const arrayBuffer = await response.arrayBuffer();
          const blob = new Blob([arrayBuffer], { type: 'image/jpeg' });
          integrityHash = await generateIntegrityHash(arrayBuffer);
          const filePath = `${user.id}/${Date.now()}-receipt.jpg`;

          const { error: uploadError } = await withRetry(
            () => supabase.storage.from(STORAGE_BUCKET).upload(filePath, blob, { contentType: 'image/jpeg' }),
            { maxRetries: 3, delayMs: 1000 },
          );

          if (!uploadError) {
            imageUrl = filePath;
          } else {
            const error = handleSupabaseError(uploadError);
            logWarn('Failed to upload image: ' + error.userMessage);
          }
        } catch (err) {
          const error = handleSupabaseError(err);
          logWarn('Image upload failed: ' + error.userMessage);
          toast.warning('Receipt image upload failed. The receipt will be saved without an image. Upload the image again later.');
        }
      }

      if (!integrityHash) {
        integrityHash = await generateIntegrityHash(new TextEncoder().encode(JSON.stringify(localFormData)).buffer);
      }

      const payload = {
        ...localFormData,
        user_id: user.id,
        duplicate_hash: computedHash,
        duplicate_warning: bypassCheck && Boolean(duplicateCandidate),
        image_url: imageUrl,
      } as Record<string, unknown>;

      if (!online) {
        await enqueue({ payload, integrityHash, userId: user.id });
        return { success: true, offline: true };
      }

      const result = await saveReceiptAction(payload, integrityHash);
      if (!result.ok) throw new Error(result.error);
      return { success: true };
    },
    onSuccess: async (result) => {
      if (result?.needsConfirmation) return;
      
      trackFeatureUsed('receipt_saved', {
        vendor: formData.vendor_name,
        amount: formData.total_amount,
        is_batch: isBatchProcessing,
        offline: Boolean(result?.offline)
      });

      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      setDuplicateCandidate(null);
      setPendingSave(false);

      if (!isBatchProcessing) {
        const scanCount = Number(sessionStorage.getItem('scan_confetti_count') ?? 0);
        if (scanCount < 5) {
          sessionStorage.setItem('scan_confetti_count', String(scanCount + 1));
          const confetti = (await import('canvas-confetti')).default;
          confetti({
            particleCount: 150 - scanCount * 25,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#bea98e', '#d4c5a9', '#10b981'],
            ticks: 200,
            gravity: 1.2,
          });
        }
        setShowSuccessOverlay(true);
        setTimeout(() => setShowSuccessOverlay(false), 600);
        onSaveSuccess();
        toast.success('Receipt saved successfully.');
      }
    },
    onError: (error: Error) => {
      setSqlError(error.message || 'A critical database error occurred.');
    },
    onSettled: () => {
      savingRef.current = false;
      setSaving(false);
    },
  });

  async function performSave(bypassCheck = false, finalFormData?: ReceiptForm) {
    if (savingRef.current || (!imageSrc)) return;
    savingRef.current = true;
    setSaving(true);
    saveMutation.mutate({ bypassCheck, localFormData: finalFormData || formData });
  }

  async function onSave() {
    await performSave(false);
  }

  async function onContinueDuplicateSave() {
    await performSave(true);
  }

  function cancelDuplicate() {
    setDuplicateCandidate(null);
    setPendingSave(false);
    setSaving(false);
    savingRef.current = false;
  }

  return {
    saving,
    setSaving,
    showSuccessOverlay,
    setShowSuccessOverlay,
    sqlError,
    setSqlError,
    duplicateCandidate,
    setDuplicateCandidate,
    performSave,
    onSave,
    onContinueDuplicateSave,
    cancelDuplicate,
    saveMutation,
  };
}
