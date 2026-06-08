'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import {
  computeBlurScore,
  getImageDimensions,
  readFileAsDataUrl,
  resizeImage,
} from '@/components/scanner/utils';
import { createBlankReceiptForm } from '@/components/scanner/types';
import type { ReceiptForm } from '@/components/scanner/types';

export const MAX_DIMENSION = 1600;
export const MIN_DIMENSION = 600;
export const MAX_FILE_SIZE = 20 * 1024 * 1024;
export const JPEG_QUALITY = 0.6;
const DEFAULT_BLUR_THRESHOLD = 40;

interface UseImageProcessorDeps {
  isBatchProcessing: boolean;
  formData: ReceiptForm;
  setFormData: React.Dispatch<React.SetStateAction<ReceiptForm>>;
  blurThreshold?: number;
}

export function useImageProcessor(deps: UseImageProcessorDeps) {
  const { isBatchProcessing, formData, setFormData, blurThreshold = DEFAULT_BLUR_THRESHOLD } = deps;

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [originalFileName, setOriginalFileName] = useState('');
  const [mimeType, setMimeType] = useState('image/jpeg');
  const [blurScore, setBlurScore] = useState<number | null>(null);
  const [showBlurWarning, setShowBlurWarning] = useState(false);
  const [showCropper, setShowCropper] = useState(false);

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

      if (score < blurThreshold && !isBatchProcessing) {
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

  async function onApplyCroppedImage(cropped: string): Promise<string> {
    const resized = await resizeImage(cropped, MAX_DIMENSION, JPEG_QUALITY);
    setImageSrc(resized);
    setShowCropper(false);
    return resized;
  }

  return {
    imageSrc,
    setImageSrc,
    originalFileName,
    mimeType,
    blurScore,
    showBlurWarning,
    setShowBlurWarning,
    showCropper,
    setShowCropper,
    onCapture,
    onApplyCroppedImage,
    MAX_DIMENSION,
    JPEG_QUALITY,
  };
}
