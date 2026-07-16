'use client';

import { useRef, useState, useCallback } from 'react';
import { getImageDimensions, readFileAsDataUrl, resizeImage } from '@/components/scanner/utils';

export const MAX_DIMENSION = 2048;
export const JPEG_QUALITY = 0.92;
export const MIN_DIMENSION = 600;
export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

export interface UseImageProcessorOptions<TForm = Record<string, unknown>> {
  isBatchProcessing: boolean;
  setFormData: React.Dispatch<React.SetStateAction<TForm>>;
}

export interface ImageProcessorResult {
  imageSrc: string | null;
  originalFileName: string;
  mimeType: string;
  showCropper: boolean;
  setShowCropper: React.Dispatch<React.SetStateAction<boolean>>;
  blurScore: number | null;
  showBlurWarning: boolean;
  setShowBlurWarning: React.Dispatch<React.SetStateAction<boolean>>;
  isProcessing: boolean;
  error: string | null;
  processFile: (file: File) => Promise<{ dataUrl: string; fileName: string; mimeType: string } | null>;
  reset: () => void;
  setImageSrc: (src: string | null) => void;
  onCapture: (file: File) => Promise<void>;
  onApplyCroppedImage: (cropped: string) => Promise<string>;
}

export function useImageProcessor<TForm = Record<string, unknown>>({
  isBatchProcessing: _isBatchProcessing,
  setFormData,
}: UseImageProcessorOptions<TForm>): ImageProcessorResult {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [originalFileName, setOriginalFileName] = useState<string>('');
  const [mimeType, setMimeType] = useState<string>('');
  const [showCropper, setShowCropper] = useState(false);
  const [blurScore, setBlurScore] = useState<number | null>(null);
  const [showBlurWarning, setShowBlurWarning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const processedRef = useRef(new Set<string>());

  const processFile = useCallback(async (file: File): Promise<{ dataUrl: string; fileName: string; mimeType: string } | null> => {
    const key = `${file.name}-${file.size}`;
    if (processedRef.current.has(key)) return null;

    setIsProcessing(true);
    setError(null);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const { width, height } = await getImageDimensions(dataUrl);
      const longest = Math.max(width, height);
      if (longest < MIN_DIMENSION) {
        setBlurScore(longest);
        setShowBlurWarning(true);
      }

      const resized = await resizeImage(dataUrl, MAX_DIMENSION, JPEG_QUALITY);
      const result = { dataUrl: resized, fileName: file.name, mimeType: file.type };
      processedRef.current.add(key);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image processing failed');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setImageSrc(null);
    setOriginalFileName('');
    setMimeType('');
    setShowCropper(false);
    setBlurScore(null);
    setShowBlurWarning(false);
    setError(null);
    processedRef.current.clear();
  }, []);

  const onCapture = useCallback(async (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      setError(`File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`);
      return;
    }

    setOriginalFileName(file.name);
    setMimeType(file.type);
    setShowCropper(false);
    setBlurScore(null);
    setShowBlurWarning(false);
    setError(null);

    const dataUrl = await readFileAsDataUrl(file);
    const { width, height } = await getImageDimensions(dataUrl);
    const longest = Math.max(width, height);
    if (longest < MIN_DIMENSION) {
      setBlurScore(longest);
      setShowBlurWarning(true);
    }

    const resized = await resizeImage(dataUrl, MAX_DIMENSION, JPEG_QUALITY);
    setImageSrc(resized);
    setShowCropper(true);

    setFormData((prev: TForm) => ({
      ...prev,
      capture_source: 'camera',
    }));
  }, [setFormData]);

  const onApplyCroppedImage = useCallback(async (cropped: string): Promise<string> => {
    const resized = await resizeImage(cropped, MAX_DIMENSION, JPEG_QUALITY);
    setImageSrc(resized);
    setShowCropper(false);
    return resized;
  }, []);

  return {
    imageSrc,
    originalFileName,
    mimeType,
    showCropper,
    setShowCropper,
    blurScore,
    showBlurWarning,
    setShowBlurWarning,
    isProcessing,
    error,
    processFile,
    reset,
    setImageSrc,
    onCapture,
    onApplyCroppedImage,
  };
}