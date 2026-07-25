'use client';

import { useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { APP_NAME } from '@/lib/constants';

import BatchOverlay from '@/components/scanner/BatchOverlay';
import CaptureControls from '@/components/scanner/CaptureControls';
import CameraEngine from '@/components/scanner/CameraEngine';
import ManualCropper from '@/components/scanner/ManualCropper';
import DuplicateModal from '@/components/scanner/DuplicateModal';
import ScannerForm from '@/components/scanner/ScannerForm';
import BlurWarning from '@/components/scanner/BlurWarning';
import ImagePreview from '@/components/scanner/ImagePreview';
import ErrorModal from '@/components/scanner/ErrorModal';
import SuccessOverlay from '@/components/scanner/SuccessOverlay';
import { ScanSuccessBurst } from '@/components/ui/ScanSuccessBurst';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@design/primitives';
import type { ScannerProps } from '@/components/scanner/types';
import { useScannerState } from '@/components/scanner/hooks/useScannerState';
import { Button } from '@design/primitives';

/**
 * Scanner component — camera capture, gallery upload, manual crop, AI extraction, duplicate detection.
 * All state managed by `useScannerState` hook for clean separation of concerns.
 */
export default function Scanner({ user, onSaveSuccess }: ScannerProps) {
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const screenshotInputRef = useRef<HTMLInputElement | null>(null);
  const formContainerRef = useRef<HTMLDivElement | null>(null);
  const s = useScannerState(user, onSaveSuccess, { cameraInputRef, galleryInputRef, screenshotInputRef, formContainerRef });

  return (
    <div className="space-y-4 fade-in" role="region" aria-label="Receipt scanner">
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
        onChange={s.handleCameraChange}
      />
      <input
        ref={galleryInputRef}
        type="file"
        multiple
        accept="image/*,.zip,application/pdf"
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
        onChange={s.handleGalleryChange}
      />
      <input
        ref={screenshotInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
        onChange={s.handleScreenshotChange}
      />

      <AnimatePresence>
        {s.showBlurWarning && (
          <BlurWarning
            blurScore={s.blurScore}
            onRetake={() => { s.setShowBlurWarning(false); cameraInputRef.current?.click(); }}
            onUseAnyway={() => {
              s.setShowBlurWarning(false);
              s.setFormData(prev => ({
                ...prev,
                capture_source: prev.capture_source,
                usage_type: prev.usage_type,
                business_use_percent: prev.business_use_percent,
                business_unit_id: prev.business_unit_id,
              }));
              s.setShowCropper(true);
            }}
          />
        )}
      </AnimatePresence>

      {!s.imageSrc ? (
        <Card className="border bg-surface text-text-primary shadow-sm" variant="default">
          <CardHeader className="px-5 py-4 border-b">
            <CardTitle className="text-lg font-bold">{APP_NAME} Scanner</CardTitle>
            <CardDescription className="mt-1 text-sm">
              Capture, crop, extract, verify, and save a CRA-ready receipt record. Up to {s.BATCH_LIMIT} files per batch.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 p-5">
            <CaptureControls
              onCameraClick={() => cameraInputRef.current?.click()}
              onUploadClick={() => galleryInputRef.current?.click()}
              onScreenshotClick={() => screenshotInputRef.current?.click()}
              batchLimit={s.BATCH_LIMIT}
              maxDimension={s.MAX_DIMENSION}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {s.isBatchProcessing && (
            <BatchOverlay progress={s.batchProgress} total={s.batchTotal} />
          )}

          {!s.showCropper && (
            <>
            {s.processingAI && (
              <div className="flex justify-center pb-3">
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={s.cancelProcessing}
                  className="rounded-full border border-danger/30 bg-danger/10 px-4 py-1.5 text-xs font-semibold text-danger transition hover:bg-danger/20"
                >
                  Cancel Processing
                </Button>
              </div>
            )}
            <ImagePreview
              imageSrc={s.imageSrc}
              originalFileName={s.originalFileName}
              processingAI={s.processingAI}
              hasAnalyzed={s.hasAnalyzed}
              canProcess={s.canProcess}
              fileName="receipt.jpg"
              onCrop={() => s.setShowCropper(true)}
              onReset={s.resetScanner}
              onProcessAI={() => s.onProcessAI()}
              formContent={
                s.hasAnalyzed && (
                  <ScannerForm
                    formData={s.formData}
                    setFormData={s.setFormData}
                    businessUnits={s.businessUnits}
                    saving={s.saving || s.processingAI || s.loadingBusinessUnits}
                    onSave={(data) => s.performSave(false, data || s.formData)}
                    hasAnalyzed={s.hasAnalyzed}
                    vendorPrefillSource={s.vendorPrefillSource}
                    onDismissPrefill={() => s.setVendorPrefillSource(null)}
                  />
                )
              }
            />
            </>
          )}
        </div>
      )}

      {s.showCropper && s.imageSrc && (
        <ManualCropper
          imageSrc={s.imageSrc}
          fileName={s.originalFileName || 'receipt.jpg'}
          onCancel={() => s.setShowCropper(false)}
          onApply={s.onApplyCroppedImage}
        />
      )}

      <AnimatePresence>
        {s.duplicateCandidate && (
          <DuplicateModal
            candidate={s.duplicateCandidate}
            onCancel={s.cancelDuplicate}
            onContinue={s.onContinueDuplicateSave}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {s.sqlError && (
          <ErrorModal message={s.sqlError} onDismiss={() => s.setSqlError(null)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {s.showCameraEngine && (
          <CameraEngine
            onCapture={async (file) => {
              await s.onCapture(file);
              s.setShowCameraEngine(false);
            }}
            onClose={() => s.setShowCameraEngine(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        <SuccessOverlay visible={s.showSuccessOverlay} />
      </AnimatePresence>

      <ScanSuccessBurst
        trigger={s.showSuccessOverlay}
        duration={1800}
        particleCount={16}
      />
    </div>
  );
}