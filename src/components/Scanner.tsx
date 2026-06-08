'use client';

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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { ScannerProps } from '@/components/scanner/types';
import { useScannerState } from '@/components/scanner/hooks/useScannerState';

export default function Scanner({ user, onSaveSuccess }: ScannerProps) {
  const s = useScannerState(user, onSaveSuccess);

  return (
    <div className="space-y-4 fade-in">
      <input
        ref={s.cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
        onChange={async (event) => {
          await s.handleFilesSelected(event.target.files);
          if (s.cameraInputRef.current) s.cameraInputRef.current.value = '';
        }}
      />
      <input
        ref={s.galleryInputRef}
        type="file"
        multiple
        accept="image/*,.zip,application/pdf"
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
        onChange={async (event) => {
          await s.handleFilesSelected(event.target.files);
          if (s.galleryInputRef.current) s.galleryInputRef.current.value = '';
        }}
      />
      <input
        ref={s.screenshotInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (file) {
            await s.onCapture(file);
            s.setFormData(prev => ({ ...prev, capture_source: 'email_screenshot' }));
            setTimeout(() => s.onProcessAI(undefined, 'email_screenshot'), 500);
          }
          if (s.screenshotInputRef.current) s.screenshotInputRef.current.value = '';
        }}
      />

      <AnimatePresence>
        {s.showBlurWarning && (
          <BlurWarning
            blurScore={s.blurScore}
            onRetake={() => { s.setShowBlurWarning(false); s.cameraInputRef.current?.click(); }}
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
        <Card className="border bg-card text-card-foreground shadow-sm">
          <CardHeader className="px-5 py-4 border-b">
            <CardTitle className="text-lg font-bold">{APP_NAME} Scanner</CardTitle>
            <CardDescription className="mt-1 text-sm">
              Capture, crop, extract, verify, and save a CRA-ready receipt record. Up to {s.BATCH_LIMIT} files per batch.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 p-5">
            <CaptureControls
              onCameraClick={() => s.cameraInputRef.current?.click()}
              onUploadClick={() => s.galleryInputRef.current?.click()}
              onScreenshotClick={() => s.screenshotInputRef.current?.click()}
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
                <button
                  type="button"
                  onClick={s.cancelProcessing}
                  className="rounded-full border border-danger/30 bg-danger/10 px-4 py-1.5 text-xs font-semibold text-danger transition hover:bg-danger/20"
                >
                  Cancel Processing
                </button>
              </div>
            )}
            <ImagePreview
              imageSrc={s.imageSrc}
              originalFileName={s.originalFileName}
              processingAI={s.processingAI}
              hasAnalyzed={s.hasAnalyzed}
              canProcess={s.canProcess}
              formContainerRef={s.formContainerRef}
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
                    onSave={() => s.performSave(false, s.formData)}
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

      {s.duplicateCandidate && (
        <DuplicateModal
          candidate={s.duplicateCandidate}
          onCancel={s.cancelDuplicate}
          onContinue={s.onContinueDuplicateSave}
        />
      )}

      <AnimatePresence>
        {s.sqlError && (
          <ErrorModal message={s.sqlError} onDismiss={() => s.setSqlError(null)} />
        )}
      </AnimatePresence>

      {s.showCameraEngine && (
        <CameraEngine
          onCapture={(file) => {
            s.onCapture(file);
            s.setShowCameraEngine(false);
          }}
          onClose={() => s.setShowCameraEngine(false)}
        />
      )}

      <AnimatePresence>
        <SuccessOverlay visible={s.showSuccessOverlay} />
      </AnimatePresence>
    </div>
  );
}
