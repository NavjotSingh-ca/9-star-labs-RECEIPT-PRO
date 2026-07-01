'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { scanReceipt } from '@/app/actions/scan-receipt';
import { supabase, getOrgIdString } from '@/lib/supabase';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { saveReceipt } from '@/lib/services/receipts';
import { handleSupabaseError, withRetry } from '@/lib/supabase-error-handler';
import { getVendorDefaults } from '@/lib/services/vendor-defaults';
import { logError, logWarn } from '@/lib/logger';
import { useAnalytics } from '@/hooks/use-analytics';
import {
  getImageDimensions,
  readFileAsDataUrl,
  resizeImage,
} from '@/components/scanner/utils';
import { createBlankReceiptForm } from '@/components/scanner/types';
import { useSaveReceipt } from './useSaveReceipt';
import { useImageProcessor, MAX_DIMENSION, JPEG_QUALITY, MIN_DIMENSION, MAX_FILE_SIZE } from './useImageProcessor';
import { useBatchProcessor, BATCH_LIMIT } from './useBatchProcessor';
import type { ReceiptForm, ReceiptRow, BusinessUnit } from '@/components/scanner/types';
import type { User } from '@supabase/supabase-js';

type DuplicateCandidate = ReceiptRow | null;

export interface ScannerRefs {
  cameraInputRef: React.RefObject<HTMLInputElement | null>;
  galleryInputRef: React.RefObject<HTMLInputElement | null>;
  screenshotInputRef: React.RefObject<HTMLInputElement | null>;
  formContainerRef: React.RefObject<HTMLDivElement | null>;
}

export interface ScannerState {
  imageSrc: string | null;
  originalFileName: string;
  mimeType: string;
  formData: ReceiptForm;
  setFormData: React.Dispatch<React.SetStateAction<ReceiptForm>>;
  businessUnits: BusinessUnit[];
  loadingBusinessUnits: boolean;
  processingAI: boolean;
  saving: boolean;
  showCropper: boolean;
  setShowCropper: React.Dispatch<React.SetStateAction<boolean>>;
  showCameraEngine: boolean;
  setShowCameraEngine: (v: boolean) => void;
  duplicateCandidate: DuplicateCandidate;
  hasAnalyzed: boolean;
  batchQueue: File[];
  batchTotal: number;
  batchProgress: number;
  isBatchProcessing: boolean;
  blurScore: number | null;
  showBlurWarning: boolean;
  setShowBlurWarning: React.Dispatch<React.SetStateAction<boolean>>;
  vendorPrefillSource: 'history' | null;
  setVendorPrefillSource: React.Dispatch<React.SetStateAction<'history' | null>>;
  orgId: string | null;
  showSuccessOverlay: boolean;
  sqlError: string | null;
  setSqlError: React.Dispatch<React.SetStateAction<string | null>>;
  online: boolean;
  canProcess: boolean;
  BATCH_LIMIT: number;
  MAX_DIMENSION: number;
  JPEG_QUALITY: number;
  resetScanner: () => void;
  onCapture: (file: File) => Promise<void>;
  onApplyCroppedImage: (cropped: string) => Promise<void>;
  onProcessAI: (explicitSrc?: string, source?: string) => Promise<void>;
  performSave: (bypassCheck?: boolean, finalFormData?: ReceiptForm) => Promise<void>;
  onSave: () => Promise<void>;
  onContinueDuplicateSave: () => Promise<void>;
  handleFilesSelected: (filesList: FileList | null) => Promise<void>;
  handleCameraChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleGalleryChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleScreenshotChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  cancelDuplicate: () => void;
  cancelProcessing: () => void;
  setDuplicateCandidate: React.Dispatch<React.SetStateAction<DuplicateCandidate>>;
}

export function useScannerState(
  user: User | null,
  onSaveSuccess: () => void,
  refs: ScannerRefs,
): ScannerState {
  const { cameraInputRef, galleryInputRef, screenshotInputRef, formContainerRef } = refs;
  const { online } = useNetworkStatus();
  const { enqueue, getQueue, clearProcessed } = useOfflineQueue();
  const queryClient = useQueryClient();
  const cancelledRef = useRef(false);

  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [formData, setFormData] = useState<ReceiptForm>(createBlankReceiptForm());
  const [loadingBusinessUnits, setLoadingBusinessUnits] = useState(true);
  const [processingAI, setProcessingAI] = useState(false);
  const [showCameraEngine, setShowCameraEngine] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [vendorPrefillSource, setVendorPrefillSource] = useState<'history' | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);

  const { trackReceiptScan } = useAnalytics();
  const batchProc = useBatchProcessor();
  const imgProc = useImageProcessor({ isBatchProcessing: batchProc.isBatchProcessing, formData, setFormData });
  const saveHook = useSaveReceipt({
    user,
    orgId,
    imageSrc: imgProc.imageSrc,
    formData,
    online,
    isBatchProcessing: batchProc.isBatchProcessing,
    onSaveSuccess,
    enqueue,
  });

  useEffect(() => {
    let active = true;
    async function loadBusinessUnits() {
      setLoadingBusinessUnits(true);
      try {
        const { data, error } = await withRetry(
          () => supabase.from('business_units').select('id, name').order('name', { ascending: true }),
          { maxRetries: 2, delayMs: 500 },
        );
        if (!active) return;
        if (error) {
          const supabaseError = handleSupabaseError(error);
          toast.error(supabaseError.userMessage);
        } else {
          setBusinessUnits((data ?? []) as BusinessUnit[]);
        }
      } catch (err) {
        const supabaseError = handleSupabaseError(err);
        toast.error(supabaseError.userMessage);
      } finally {
        setLoadingBusinessUnits(false);
      }
    }
    loadBusinessUnits();
    getOrgIdString().then((id) => {
      if (id) setOrgId(id);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!navigator.serviceWorker) return;
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PROCESS_OFFLINE_QUEUE') {
        const items = event.data.items;
        if (!items || items.length === 0) return;
        toast.info(`${items.length} receipt(s) saved offline. Syncing now...`);
        (async () => {
          let successCount = 0;
          const processedIds: string[] = [];
          for (const item of items) {
            const locked = await getQueue();
            const stillExists = locked.some(i => i.id === item.id);
            if (!stillExists) continue;
            try {
              await saveReceipt(item.payload, item.integrityHash, item.userId);
              processedIds.push(item.id);
              successCount++;
            } catch (err) {
              logError(err, { action: 'sync_offline_receipt' });
              toast.error('Failed to sync an offline receipt. It will be retried on next sync.');
            }
          }
          if (processedIds.length > 0) {
            await clearProcessed(processedIds);
          }
          if (successCount > 0) {
            queryClient.invalidateQueries({ queryKey: ['receipts'] });
            toast.success(`${successCount} receipt(s) synced successfully!`);
          }
        })();
      }
      if (event.data?.type === 'SYNC_COMPLETE') {
        if (event.data.count > 0) {
          toast.success(`${event.data.count} receipt(s) synced successfully!`);
        }
      }
    };
    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
  }, [clearProcessed, getQueue, queryClient]);

  const canProcess = useMemo(() => Boolean(imgProc.imageSrc) && !processingAI && !cancelledRef.current, [imgProc.imageSrc, processingAI]);

  function resetScanner() {
    imgProc.setImageSrc(null);
    setFormData(createBlankReceiptForm());
    saveHook.setDuplicateCandidate(null);
    setHasAnalyzed(false);
    batchProc.resetBatchState();
    setVendorPrefillSource(null);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  }

  function mergeScanData(result: Record<string, unknown>) {
    const businessNumber = String(result.business_number ?? '').trim();
    const paymentMethod = String(result.payment_method ?? formData.payment_method ?? 'Unknown').trim();
    const totalAmount = Number(result.total_amount ?? 0);
    const subtotal = Number(result.subtotal ?? 0);
    const taxAmount = Number(result.tax_amount ?? 0);
    const pstAmount = Number(result.pst_amount ?? 0);
    const confidenceScore = Number(result.confidence_score ?? 0);
    const detectedCurrency = String(result.currency ?? 'CAD').toUpperCase();
    const missingBnWarning = businessNumber.length === 0;
    const mathMismatchWarning = Math.abs(Number((subtotal + taxAmount + pstAmount - totalAmount).toFixed(2))) > 0.02;
    const readinessScore = Math.max(0, Math.min(100, [
      result.vendor_name ? 18 : 0,
      result.transaction_date ? 16 : 0,
      totalAmount > 0 ? 18 : 0,
      subtotal >= 0 ? 10 : 0,
      taxAmount >= 0 ? 8 : 0,
      paymentMethod ? 8 : 0,
      businessNumber ? 14 : 0,
      confidenceScore >= 70 ? 8 : confidenceScore >= 40 ? 4 : 0,
    ].reduce((sum, val) => sum + val, 0) - (mathMismatchWarning ? 10 : 0)));

    const lineItemsRaw = result.line_items;
    const lineItems = Array.isArray(lineItemsRaw)
      ? lineItemsRaw.map((item: Record<string, unknown>) => ({
          description: String(item.description ?? ''),
          quantity: Number(item.quantity ?? 1),
          unit_price: Number(item.unit_price ?? item.price ?? 0),
          tax_rate: Number(item.tax_rate ?? 0),
          tax_amount: Number(item.tax_amount ?? 0),
          category: String(item.category ?? ''),
          line_total: Number(item.line_total ?? 0),
        }))
      : formData.line_items;

    setFormData((prev) => ({
      ...prev,
      vendor_name: String(result.vendor_name ?? ''),
      vendor_address: String(result.vendor_address ?? ''),
      business_number: businessNumber,
      total_amount: totalAmount,
      subtotal,
      tax_amount: taxAmount,
      pst_amount: pstAmount,
      transaction_date: String(result.transaction_date ?? prev.transaction_date),
      transaction_time: String(result.transaction_time ?? ''),
      payment_method: paymentMethod || 'Unknown',
      payment_reference: prev.payment_reference,
      card_last_four: String(result.card_last_four ?? ''),
      category: String(result.category ?? prev.category ?? 'Office/Admin'),
      notes: String(result.notes ?? ''),
      currency: detectedCurrency,
      confidence_score: confidenceScore,
      cra_readiness_score: readinessScore,
      thermal_warning: Boolean(result.thermal_warning),
      document_type: 'receipt',
      duplicate_hash: '',
      math_mismatch_warning: mathMismatchWarning,
      missing_bn_warning: missingBnWarning,
      fraud_suspicion: Boolean(result.fraud_suspicion),
      fraud_reason: String(result.fraud_reason ?? ''),
      capture_source: prev.capture_source,
      usage_type: prev.usage_type,
      business_use_percent: prev.business_use_percent,
      job_code: prev.job_code,
      vehicle_id: prev.vehicle_id,
      business_unit_id: prev.business_unit_id,
      paid_by: prev.paid_by,
      reimbursement_status: prev.reimbursement_status,
      approval_status: prev.approval_status,
      exchange_rate: detectedCurrency !== 'CAD' ? prev.exchange_rate : 1.0,
      line_items: lineItems,
    }));
  }

  async function handleProcessAI(explicitSrc?: string, source: string = 'camera') {
    const srcToUse = explicitSrc || imgProc.imageSrc;
    if (!srcToUse) {
      toast.error('Please capture a receipt first.');
      return;
    }

    cancelledRef.current = false;
    setProcessingAI(true);
    try {
      if (cancelledRef.current) { setProcessingAI(false); return; }

      if (!online) {
        setHasAnalyzed(true);
        setProcessingAI(false);
        toast.info('Offline — enter receipt details manually. It will sync when connection returns.');
        setTimeout(() => {
          formContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
        return;
      }

      const result = await scanReceipt(srcToUse, source);
      if (cancelledRef.current) { setProcessingAI(false); return; }
      if (!result.success) {
        trackReceiptScan('failure', { error: result.error, source });
        toast.error(result.error);
        return;
      }
      
      trackReceiptScan('success', { 
        vendor: result.data.vendor_name, 
        amount: result.data.total_amount, 
        confidence: result.data.confidence_score,
        source 
      });

      mergeScanData(result.data as unknown as Record<string, unknown>);
      setHasAnalyzed(true);
      toast.success('Receipt processed successfully. Please review the details below.');

      if (result.data.vendor_name && orgId) {
        getVendorDefaults(orgId, result.data.vendor_name).then((defaults) => {
          if (defaults) {
            setFormData((prev) => ({
              ...prev,
              ...(defaults.category ? { category: defaults.category } : {}),
              ...(defaults.job_code ? { job_code: defaults.job_code } : {}),
              business_use_percent: defaults.business_use_percent,
            }));
            setVendorPrefillSource('history');
          }
        }).catch(() => {
          logWarn('Vendor defaults lookup failed — using AI result as-is');
        });
      }

      setTimeout(() => {
        formContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);

      if (batchProc.isBatchProcessing) {
        await saveHook.performSave(true);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'AI processing failed.';
      toast.error(msg);
    } finally {
      setProcessingAI(false);
    }
  }

  async function handleApplyCroppedImage(cropped: string) {
    const resized = await imgProc.onApplyCroppedImage(cropped);
    toast.info('AI Extraction starting...');
    await handleProcessAI(resized);
  }

  async function handleFilesSelected(filesList: FileList | null) {
    if (!filesList || filesList.length === 0) return;
    let processedFiles: File[] = [];

    for (let i = 0; i < filesList.length; i++) {
      const file = filesList[i];
      if (file.name.toLowerCase().endsWith('.zip')) {
        try {
          const JSZip = (await import('jszip')).default;
          const zip = new JSZip();
          const contents = await zip.loadAsync(file);
          for (const [relativePath, zipEntry] of Object.entries(contents.files)) {
            if (!zipEntry.dir && relativePath.match(/\.(jpe?g|png)$/i)) {
              const blob = await zipEntry.async('blob');
              processedFiles.push(new File([blob], zipEntry.name, { type: blob.type || 'image/jpeg' }));
            }
          }
        } catch {
          toast.error('Failed to parse ZIP file: ' + file.name);
        }
      } else if (file.type.startsWith('image/')) {
        processedFiles.push(file);
      }
    }

    if (processedFiles.length > BATCH_LIMIT) {
      toast.info(`Batch limit is ${BATCH_LIMIT} files. Only the first ${BATCH_LIMIT} will be processed.`);
      processedFiles = processedFiles.slice(0, BATCH_LIMIT);
    }

    if (processedFiles.length === 0) {
      toast.error('No valid image files found to process.');
      return;
    }

    if (processedFiles.length === 1) {
      await imgProc.onCapture(processedFiles[0]);
    } else {
      batchProc.setIsBatchProcessing(true);
      batchProc.setBatchTotal(processedFiles.length);
      batchProc.setBatchProgress(1);
      batchProc.setBatchQueue(processedFiles.slice(1));
      await handleProcessNextBatchItem(processedFiles, processedFiles.length);
    }
  }

  async function handleProcessNextBatchItem(queue: File[], total: number) {
    if (queue.length === 0) {
      batchProc.resetBatchState();
      toast.success('Batch processing completed.');
      onSaveSuccess();
      return;
    }

    const [nextFile, ...remaining] = queue;
    try {
      if (nextFile.size > MAX_FILE_SIZE) {
        toast.warning(`Skipping ${nextFile.name}: too large (${(nextFile.size / 1024 / 1024).toFixed(1)}MB)`);
        setTimeout(() => handleProcessNextBatchItem(remaining, total), 500);
        return;
      }

      const rawDataUrl = await readFileAsDataUrl(nextFile);
      const { width, height } = await getImageDimensions(rawDataUrl);
      const longest = Math.max(width, height);
      if (longest < MIN_DIMENSION) {
        toast.warning(`${nextFile.name}: image is only ${longest}px — consider a clearer photo`);
      }

      const resized = await resizeImage(rawDataUrl, MAX_DIMENSION, JPEG_QUALITY);
      imgProc.setImageSrc(resized);
      setFormData((prev) => ({
        ...createBlankReceiptForm(),
        capture_source: prev.capture_source,
        usage_type: prev.usage_type,
        business_use_percent: prev.business_use_percent,
        business_unit_id: prev.business_unit_id,
      }));

      batchProc.advanceBatch(remaining, total);

      await handleProcessAI(resized);
    } catch {
      toast.error('Failed to read file: ' + nextFile.name);
    }

    setTimeout(() => handleProcessNextBatchItem(remaining, total), 1000);
  }

  function cancelProcessing() {
    cancelledRef.current = true;
    setProcessingAI(false);
    batchProc.resetBatchState();
    toast.info('Processing cancelled.');
  }

  return {
    imageSrc: imgProc.imageSrc,
    originalFileName: imgProc.originalFileName,
    mimeType: imgProc.mimeType,
    formData,
    setFormData,
    businessUnits,
    loadingBusinessUnits,
    processingAI,
    saving: saveHook.saving,
    showCropper: imgProc.showCropper,
    setShowCropper: imgProc.setShowCropper,
    showCameraEngine,
    setShowCameraEngine,
    duplicateCandidate: saveHook.duplicateCandidate,
    hasAnalyzed,
    batchQueue: batchProc.batchQueue,
    batchTotal: batchProc.batchTotal,
    batchProgress: batchProc.batchProgress,
    isBatchProcessing: batchProc.isBatchProcessing,
    blurScore: imgProc.blurScore,
    showBlurWarning: imgProc.showBlurWarning,
    setShowBlurWarning: imgProc.setShowBlurWarning,
    vendorPrefillSource,
    setVendorPrefillSource,
    orgId,
    showSuccessOverlay: saveHook.showSuccessOverlay,
    sqlError: saveHook.sqlError,
    setSqlError: saveHook.setSqlError,
    online,
    canProcess,
    BATCH_LIMIT,
    MAX_DIMENSION,
    JPEG_QUALITY,
    resetScanner,
    onCapture: imgProc.onCapture,
    onApplyCroppedImage: handleApplyCroppedImage,
    onProcessAI: handleProcessAI,
    performSave: saveHook.performSave,
    onSave: saveHook.onSave,
    onContinueDuplicateSave: saveHook.onContinueDuplicateSave,
    handleFilesSelected,
    handleCameraChange: async (e: React.ChangeEvent<HTMLInputElement>) => {
      await handleFilesSelected(e.target.files);
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    },
    handleGalleryChange: async (e: React.ChangeEvent<HTMLInputElement>) => {
      await handleFilesSelected(e.target.files);
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    },
    handleScreenshotChange: async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        await imgProc.onCapture(file);
        setFormData(prev => ({ ...prev, capture_source: 'email_screenshot' }));
        setTimeout(() => handleProcessAI(undefined, 'email_screenshot'), 500);
      }
      if (screenshotInputRef.current) screenshotInputRef.current.value = '';
    },
    cancelDuplicate: saveHook.cancelDuplicate,
    cancelProcessing,
    setDuplicateCandidate: saveHook.setDuplicateCandidate,
  };
}
