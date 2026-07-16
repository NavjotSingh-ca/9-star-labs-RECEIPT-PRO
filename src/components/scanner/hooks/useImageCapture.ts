'use client';

import { useRef, useCallback, useState } from 'react';
import { readFileAsDataUrl, resizeImage } from '../utils';

interface UseImageCaptureOptions {
  onImageCaptured: (dataUrl: string, fileName: string, mimeType: string) => void;
  onError: (error: string) => void;
  maxDimension?: number;
  quality?: number;
}

export function useImageCapture({
  onImageCaptured,
  onError,
  maxDimension = 2048,
  quality = 0.92,
}: UseImageCaptureOptions) {
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const screenshotInputRef = useRef<HTMLInputElement>(null);

  const openCamera = useCallback(() => {
    cameraInputRef.current?.click();
  }, []);

  const openGallery = useCallback(() => {
    galleryInputRef.current?.click();
  }, []);

  const openScreenshot = useCallback(() => {
    screenshotInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        onError('Please select an image or PDF file');
        event.target.value = '';
        return;
      }

      // Check file size (max 20MB)
      if (file.size > 20 * 1024 * 1024) {
        onError('File size must be less than 20MB');
        event.target.value = '';
        return;
      }

      setIsProcessing(true);

      try {
        // For images, read as data URL then resize
        let dataUrl: string;

        if (file.type.startsWith('image/')) {
          // First read as data URL
          dataUrl = await readFileAsDataUrl(file);
          // Then resize if needed
          const resizedDataUrl = await resizeImage(dataUrl, maxDimension, quality);
          onImageCaptured(resizedDataUrl, file.name, 'image/jpeg');
        } else {
          dataUrl = await readFileAsDataUrl(file);
          onImageCaptured(dataUrl, file.name, file.type);
        }
      } catch (err) {
        onError(err instanceof Error ? err.message : 'Failed to process image');
      } finally {
        setIsProcessing(false);
        // Reset input so same file can be selected again
        if (event.target) event.target.value = '';
      }
    },
    [onImageCaptured, onError, maxDimension, quality]
  );

  const handleCameraCapture = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      handleFileSelect(event);
    },
    [handleFileSelect]
  );

  const handleGallerySelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      handleFileSelect(event);
    },
    [handleFileSelect]
  );

  const handleScreenshotSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      handleFileSelect(event);
    },
    [handleFileSelect]
  );

  return {
    // Refs for input elements
    cameraInputRef,
    galleryInputRef,
    screenshotInputRef,
    // Actions
    openCamera,
    openGallery,
    openScreenshot,
    // Event handlers
    handleCameraCapture,
    handleGallerySelect,
    handleScreenshotSelect,
    // State
    isProcessing,
  };
}