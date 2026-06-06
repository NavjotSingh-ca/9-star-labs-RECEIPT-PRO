'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

import { scanReceipt } from '@/app/actions/scan-receipt';
import { generateDuplicateHash, generateIntegrityHash } from '@/lib/hash';
import { supabase } from '@/lib/supabase';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { saveReceipt } from '@/lib/services/receipts';
import { handleSupabaseError, withRetry } from '@/lib/supabase-error-handler';
import { getVendorDefaults } from '@/lib/services/vendor-defaults';
import {
  computeBlurScore,
  getImageDimensions,
  readFileAsDataUrl,
  resizeImage,
} from '@/components/scanner/utils';
import { createBlankReceiptForm } from '@/components/scanner/types';
import type { ReceiptForm, ReceiptRow, BusinessUnit } from '@/components/scanner/types';

type DuplicateCandidate = ReceiptRow | null;
const MAX_DIMENSION = 1600;
const MIN_DIMENSION = 600;
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const JPEG_QUALITY = 0.6;
const STORAGE_BUCKET = 'receipt-images';
const BATCH_LIMIT = 50;
const BLUR_THRESHOLD = 40;

export interface ScannerState {
  cameraInputRef: React.RefObject<HTMLInputElement | null>;
  galleryInputRef: React.RefObject<HTMLInputElement | null>;
  screenshotInputRef: React.RefObject<HTMLInputElement | null>;
  formContainerRef: React.RefObject<HTMLDivElement | null>;
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
  cancelDuplicate: () => void;
  cancelProcessing: () => void;
  setDuplicateCandidate: React.Dispatch<React.SetStateAction<DuplicateCandidate>>;
}

export function useScannerState(
  user: NonNullable<ReturnType<typeof Object>> | null,
  onSaveSuccess: () => void,
): ScannerState {
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const screenshotInputRef = useRef<HTMLInputElement | null>(null);
  const formContainerRef = useRef<HTMLDivElement | null>(null);
  const { online } = useNetworkStatus();
  const { enqueue, getQueue, clearProcessed } = useOfflineQueue();
  const queryClient = useQueryClient();
  const savingRef = useRef(false);
  const cancelledRef = useRef(false);

  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [originalFileName, setOriginalFileName] = useState('');
  const [mimeType, setMimeType] = useState('image/jpeg');
  const [formData, setFormData] = useState<ReceiptForm>(createBlankReceiptForm());
  const [loadingBusinessUnits, setLoadingBusinessUnits] = useState(true);
  const [processingAI, setProcessingAI] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [showCameraEngine, setShowCameraEngine] = useState(false);
  const [duplicateCandidate, setDuplicateCandidate] = useState<DuplicateCandidate>(null);
  const [pendingSave, setPendingSave] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [batchQueue, setBatchQueue] = useState<File[]>([]);
  const [batchTotal, setBatchTotal] = useState(0);
  const [batchProgress, setBatchProgress] = useState(0);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [blurScore, setBlurScore] = useState<number | null>(null);
  const [showBlurWarning, setShowBlurWarning] = useState(false);
  const [vendorPrefillSource, setVendorPrefillSource] = useState<'history' | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [sqlError, setSqlError] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: async ({ bypassCheck, localFormData }: { bypassCheck: boolean; localFormData: ReceiptForm }) => {
      if (!user) throw new Error('You must be logged in to save.');
      const computedHash = await generateDuplicateHash(localFormData.vendor_name, localFormData.transaction_date, localFormData.total_amount);

      if (!bypassCheck && duplicateCandidate === null) {
        const { data: duplicates, error: dupCheckError } = await supabase
          .from('receipts')
          .select('id, created_at, vendor_name, total_amount')
          .eq('duplicate_hash', computedHash)
          .eq('user_id', user.id);

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
            console.warn('Failed to upload image:', error.userMessage);
          }
          } catch (err) {
            const error = handleSupabaseError(err);
            console.warn('Image upload failed:', error.userMessage);
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

      await saveReceipt(payload, integrityHash, user.id);
      return { success: true };
    },
    onSuccess: (result) => {
      if (result?.needsConfirmation) return;
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      setDuplicateCandidate(null);
      setPendingSave(false);

      if (!isBatchProcessing) {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#bea98e', '#d4c5a9', '#10b981'],
          ticks: 200,
          gravity: 1.2,
        });
        setShowSuccessOverlay(true);
        setTimeout(() => setShowSuccessOverlay(false), 600);
        resetScanner();
        onSaveSuccess();
        toast.success(result.offline ? 'Receipt queued offline. Will sync when connection returns.' : 'Receipt saved successfully.');
      } else {
        setImageSrc(null);
        setFormData(createBlankReceiptForm());
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
    supabase.rpc('get_user_org').then(({ data }) => {
      if (data) setOrgId(data as unknown as string);
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
              console.error('Failed to sync offline receipt', err);
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
  }, []);

  const canProcess = useMemo(() => Boolean(imageSrc) && !processingAI && !cancelledRef.current, [imageSrc, processingAI]);

  function resetScanner() {
    setImageSrc(null);
    setOriginalFileName('');
    setMimeType('image/jpeg');
    setFormData(createBlankReceiptForm());
    setDuplicateCandidate(null);
    setPendingSave(false);
    setHasAnalyzed(false);
    setIsBatchProcessing(false);
    setBatchQueue([]);
    setBatchTotal(0);
    setBatchProgress(0);
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

  async function onCapture(file: File) {
    try {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max is 20MB.`);
        return;
      }

      setShowBlurWarning(false);
      const rawDataUrl = await readFileAsDataUrl(file);
      const { width, height } = await getImageDimensions(rawDataUrl);
      const longest = Math.max(width, height);
      if (longest < MIN_DIMENSION) {
        toast.warning(`Image is only ${longest}px — CRA recommends at least ${MIN_DIMENSION}px for legible records. Consider a clearer photo.`);
      }

      const resizedDataUrl = await resizeImage(rawDataUrl, MAX_DIMENSION, JPEG_QUALITY);
      const score = await computeBlurScore(resizedDataUrl);
      setBlurScore(score);

      if (score < BLUR_THRESHOLD && !isBatchProcessing) {
        setShowBlurWarning(true);
        setImageSrc(resizedDataUrl);
        setOriginalFileName(file.name);
        setMimeType(file.type || 'image/jpeg');
        return;
      }

      setOriginalFileName(file.name);
      setMimeType(file.type || 'image/jpeg');
      setImageSrc(resizedDataUrl);
      setFormData((prev) => ({
        ...createBlankReceiptForm(),
        capture_source: prev.capture_source,
        usage_type: prev.usage_type,
        business_use_percent: prev.business_use_percent,
        business_unit_id: prev.business_unit_id,
      }));
      setShowCropper(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to capture receipt.');
    }
  }

  async function onApplyCroppedImage(cropped: string) {
    try {
      const resized = await resizeImage(cropped, MAX_DIMENSION, JPEG_QUALITY);
      setImageSrc(resized);
      setShowCropper(false);
      toast.info('AI Extraction starting...');
      await onProcessAI(resized);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to apply crop.');
    }
  }

  async function onProcessAI(explicitSrc?: string, source: string = 'camera') {
    const srcToUse = explicitSrc || imageSrc;
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
        toast.error(result.error);
        if (isBatchProcessing) setTimeout(processNextBatchItem, 1000);
        return;
      }
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
          console.warn('Vendor defaults lookup failed — using AI result as-is');
        });
      }

      setTimeout(() => {
        formContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);

      if (isBatchProcessing) {
        await performSave(true);
        setTimeout(processNextBatchItem, 1000);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'AI processing failed.';
      toast.error(msg);
    } finally {
      setProcessingAI(false);
    }
  }

  async function performSave(bypassCheck = false, finalFormData?: ReceiptForm) {
    if (savingRef.current || (!imageSrc && batchQueue.length === 0)) return;
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

  function cancelProcessing() {
    cancelledRef.current = true;
    setProcessingAI(false);
    setIsBatchProcessing(false);
    setBatchQueue([]);
    toast.info('Processing cancelled.');
  }

  async function processNextBatchItem(queue?: File[], total?: number) {
    const currentQueue = queue || batchQueue;
    const currentTotal = total || batchTotal;
    if (currentQueue.length === 0) {
      setIsBatchProcessing(false);
      setBatchTotal(0);
      setBatchProgress(0);
      toast.success('Batch processing completed.');
      onSaveSuccess();
      return;
    }
    const [nextFile, ...remaining] = currentQueue;
    setBatchQueue(remaining);
    setBatchProgress(currentTotal - remaining.length);
    try {
      if (nextFile.size > MAX_FILE_SIZE) {
        toast.warning(`Skipping ${nextFile.name}: too large (${(nextFile.size / 1024 / 1024).toFixed(1)}MB)`);
        setTimeout(() => processNextBatchItem(remaining, currentTotal), 500);
        return;
      }
      const rawDataUrl = await readFileAsDataUrl(nextFile);
      const { width, height } = await getImageDimensions(rawDataUrl);
      const longest = Math.max(width, height);
      if (longest < MIN_DIMENSION) {
        toast.warning(`${nextFile.name}: image is only ${longest}px — consider a clearer photo`);
      }
      const resized = await resizeImage(rawDataUrl, MAX_DIMENSION, JPEG_QUALITY);
      setImageSrc(resized);
      setOriginalFileName(nextFile.name);
      setMimeType(nextFile.type || 'image/jpeg');
      setFormData((prev) => ({
        ...createBlankReceiptForm(),
        capture_source: prev.capture_source,
        usage_type: prev.usage_type,
        business_use_percent: prev.business_use_percent,
        business_unit_id: prev.business_unit_id,
      }));
      await onProcessAI(resized);
    } catch (err) {
      toast.error('Failed to read file: ' + nextFile.name);
      setTimeout(() => processNextBatchItem(remaining, currentTotal), 1000);
    }
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
      await onCapture(processedFiles[0]);
    } else {
      setBatchTotal(processedFiles.length);
      setBatchProgress(1);
      setIsBatchProcessing(true);
      setBatchQueue(processedFiles.slice(1));
      processNextBatchItem(processedFiles, processedFiles.length);
    }
  }

  return {
    cameraInputRef,
    galleryInputRef,
    screenshotInputRef,
    formContainerRef,
    imageSrc,
    originalFileName,
    mimeType,
    formData,
    setFormData,
    businessUnits,
    loadingBusinessUnits,
    processingAI,
    saving,
    showCropper,
    setShowCropper,
    showCameraEngine,
    setShowCameraEngine,
    duplicateCandidate,
    hasAnalyzed,
    batchQueue,
    batchTotal,
    batchProgress,
    isBatchProcessing,
    blurScore,
    showBlurWarning,
    setShowBlurWarning,
    vendorPrefillSource,
    setVendorPrefillSource,
    orgId,
    showSuccessOverlay,
    sqlError,
    setSqlError,
    online,
    canProcess,
    BATCH_LIMIT,
    MAX_DIMENSION,
    JPEG_QUALITY,
    resetScanner,
    onCapture,
    onApplyCroppedImage,
    onProcessAI,
    performSave,
    onSave,
    onContinueDuplicateSave,
    cancelDuplicate,
    cancelProcessing,
    handleFilesSelected,
    setDuplicateCandidate,
  };
}
