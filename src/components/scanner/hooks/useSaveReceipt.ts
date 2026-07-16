'use client';

import { useState, useCallback } from 'react';
import type { ReceiptForm, ReceiptRow } from '@/components/scanner/types';
import type { User } from '@supabase/supabase-js';

type DuplicateCandidate = ReceiptRow | null;

interface QueueItem {
  payload: Record<string, unknown>;
  integrityHash: string;
  userId: string;
}

interface UseSaveReceiptOptions {
  user: User | null;
  orgId: string | null;
  imageSrc: string | null;
  formData: ReceiptForm | null;
  online: boolean;
  isBatchProcessing: boolean;
  onSaveSuccess: (receiptId: string) => void;
  enqueue: (item: QueueItem) => Promise<string | undefined>;
}

interface SaveReceiptHookResult {
  performSave: (bypassCheck?: boolean, finalFormData?: ReceiptForm) => Promise<void>;
  saving: boolean;
  setSaving: React.Dispatch<React.SetStateAction<boolean>>;
  duplicateCandidate: DuplicateCandidate;
  setDuplicateCandidate: React.Dispatch<React.SetStateAction<DuplicateCandidate>>;
  showSuccessOverlay: boolean;
  setShowSuccessOverlay: React.Dispatch<React.SetStateAction<boolean>>;
  sqlError: string | null;
  setSqlError: React.Dispatch<React.SetStateAction<string | null>>;
  onSave: () => void;
  onContinueDuplicateSave: () => void;
  cancelDuplicate: () => void;
}

export function useSaveReceipt({
  user,
  orgId,
  imageSrc,
  formData,
  online,
  isBatchProcessing: _isBatchProcessing,
  onSaveSuccess,
  enqueue,
}: UseSaveReceiptOptions): SaveReceiptHookResult {
  const [saving, setSaving] = useState(false);
  const [duplicateCandidate, setDuplicateCandidate] = useState<DuplicateCandidate>(null);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [sqlError, setSqlError] = useState<string | null>(null);

  const performSave = useCallback(async (bypassCheck = false, finalFormData?: ReceiptForm) => {
    const dataToSave = finalFormData ?? formData;
    if (!dataToSave || !user || !orgId) return;

    let integrityHash = '';
    try {
      const { saveReceiptAction } = await import('@/app/actions/save-receipt');
      // Safely get integrity_hash from dataToSave if it exists, otherwise compute a basic one
      integrityHash = ('integrity_hash' in dataToSave && dataToSave.integrity_hash !== null && dataToSave.integrity_hash !== undefined)
        ? String(dataToSave.integrity_hash)
        : '';
      const result = await saveReceiptAction(
        { ...dataToSave, image_url: imageSrc },
        integrityHash
      );

      if (result.ok) {
        onSaveSuccess(result.id);
        setShowSuccessOverlay(true);
        setTimeout(() => setShowSuccessOverlay(false), 3000);
      } else {
        setSqlError(result.error || 'Save failed');
        throw new Error(result.error || 'Save failed');
      }
    } catch (err) {
      if (!online && bypassCheck && user) {
        // Queue for offline sync
        await enqueue({
          payload: { ...dataToSave, image_url: imageSrc },
          integrityHash,
          userId: user.id,
        });
      } else {
        setSqlError(err instanceof Error ? err.message : 'Save error');
      }
    } finally {
      setSaving(false);
    }
  }, [formData, user, orgId, imageSrc, online, onSaveSuccess, enqueue]);

  const onSave = useCallback(() => {
    performSave(true);
  }, [performSave]);

  const onContinueDuplicateSave = useCallback(() => setDuplicateCandidate(null), []);

  const cancelDuplicate = useCallback(() => setDuplicateCandidate(null), []);

  return {
    performSave,
    saving,
    setSaving,
    duplicateCandidate,
    setDuplicateCandidate,
    showSuccessOverlay,
    setShowSuccessOverlay,
    sqlError,
    setSqlError,
    onSave,
    onContinueDuplicateSave,
    cancelDuplicate,
  };
}