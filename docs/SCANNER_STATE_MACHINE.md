# Scanner State Machine

> State machine for `src/components/scanner/hooks/useScannerState.ts` (518 lines)

## Architecture

```
Component (Scanner.tsx)
  └─ useScannerState(user, onSaveSuccess, refs)
       ├─ useImageProcessor()      — Image capture, resize, blur detection, crop
       ├─ useBatchProcessor()      — Batch queue management
       ├─ useSaveReceipt()         — Save logic, duplicate detection, offline queue
       ├─ useNetworkStatus()       — Online/offline detection
       ├─ useOfflineQueue()        — IndexedDB offline queue
       └─ useAnalytics()           — Event tracking
```

**Key Rule:** Refs (`cameraInputRef`, `galleryInputRef`, etc.) are created in the component and passed to the hook — never returned from the hook. This avoids React Compiler `react-hooks/refs` errors.

---

## State Variables

| Variable | Type | Purpose |
|----------|------|---------|
| `imageSrc` | `string \| null` | Current image data URL or null |
| `formData` | `ReceiptForm` | Receipt form fields |
| `processingAI` | `boolean` | True while Gemini AI processes image |
| `saving` | `boolean` | True while saving to DB |
| `hasAnalyzed` | `boolean` | True after AI extraction completes |
| `showCropper` | `boolean` | Manual crop dialog open |
| `showCameraEngine` | `boolean` | Live camera viewfinder open |
| `duplicateCandidate` | `ReceiptRow \| null` | Potential duplicate found during save |
| `showBlurWarning` | `boolean` | Blur detection warning dialog |
| `showSuccessOverlay` | `boolean` | Confetti success overlay |
| `sqlError` | `string \| null` | DB error message to display |
| `orgId` | `string \| null` | Current org ID |
| `vendorPrefillSource` | `'history' \| null` | Source of vendor defaults |
| `blurScore` | `number \| null` | Blur metric (0-100, higher = blurrier) |
| `batchQueue` | `File[]` | Files waiting in batch |
| `batchTotal` | `number` | Total files in current batch |
| `batchProgress` | `number` | Files processed so far |
| `isBatchProcessing` | `boolean` | Batch mode active |
| `online` | `boolean` | Network connected |
| `cancelledRef` | `boolean` (ref) | Flag for cancel processing |

---

## Flow States

### Idle
```
Scanner ready, no image loaded
→ User captures/gallery-selects/screenshots file
→ onCapture() → IdleWithImage
```

### IdleWithImage
```
Image loaded, awaiting user action
→ User clicks "Process AI" → ProcessingAI
→ User clicks "Manual Entry" → ManualEdit
→ User clicks "Crop" → Cropping
```

### ProcessingAI (async)
```
Image sent to Gemini AI
→ Success + no batch → ManualEdit (formData populated)
→ Success + batch → Save (auto-triggered)
→ Failure → IdleWithImage (error toast)
→ Cancel clicked → Idle
→ Offline → ManualEdit (offline message)
```

### ManualEdit
```
Form populated (AI or manual), user reviews/edits
→ User clicks "Save" → Saving + DuplicateCheck
→ User clicks "Cancel" → Idle
```

### Cropping
```
Crop dialog open
→ User confirms crop → ProcessingAI (with cropped image)
→ User cancels → IdleWithImage
```

### Saving (async)
```
Saving receipt to DB
→ Duplicate detected → DuplicateWarning
→ Success → SuccessAnimation (then → Idle after timeout)
→ Error → ErrorDisplay (then → ManualEdit)
```

### DuplicateWarning
```
Modal asking user to confirm or cancel
→ "Continue saving" → Saving (bypasses duplicate check)
→ "Cancel" → IdleWithImage
```

### BatchProcessing
```
Multi-file mode active
→ For each file: IdleWithImage → ProcessingAI → Save (auto) → next file
→ All done → SuccessAnimation → Idle
→ Error → continues to next file
```

### SuccessAnimation
```
Confetti overlay (only first 5 scans per session via sessionStorage)
→ 2 second timeout → Idle (with onSaveSuccess callback)
```

### ErrorDisplay
```
SQL error modal with details
→ User dismisses → ManualEdit
```

---

## Event Handlers

| Handler | Trigger | State Transition |
|---------|---------|-----------------|
| `onCapture(file)` | User picks file | Idle → IdleWithImage |
| `onProcessAI(src)` | User clicks "Process AI" | IdleWithImage → ProcessingAI |
| `onApplyCroppedImage(cropped)` | User confirms crop | Cropping → ProcessingAI |
| `performSave()` | User clicks "Save" | ManualEdit → Saving |
| `onContinueDuplicateSave()` | User confirms duplicate | DuplicateWarning → Saving |
| `cancelDuplicate()` | User rejects duplicate | DuplicateWarning → IdleWithImage |
| `cancelProcessing()` | User cancels AI | ProcessingAI → Idle |
| `resetScanner()` | User resets | Any → Idle |
| `handleFilesSelected(files)` | Gallery/batch upload | Idle → IdleWithImage or BatchProcessing |

---

## Key Edge Cases

1. **Offline:** If `!online`, AI processing is skipped. User enters data manually. Receipt queued in IndexedDB for Background Sync.
2. **Cancel during AI:** `cancelledRef.current = true` immediately stops processing. Hook checks `cancelledRef.current` at multiple points in the flow.
3. **Batch continuation:** After each file in batch, `handleProcessAI` calls `performSave(true)` (bypassing duplicate check) after 1 second delay. Errors on one file don't stop the batch.
4. **Duplicate detection:** Happens during save. If found, `duplicateCandidate` is set and state transitions to DuplicateWarning.
5. **Blur detection:** After capture, `useImageProcessor` computes `blurScore`. If score > 40, `showBlurWarning` is set. User can proceed or retake.
6. **File validation:** 20MB max size, 600px min resolution, JPEG max 1600px at quality 0.6.
7. **ZIP upload:** If `handleFilesSelected` receives a ZIP, it dynamically imports JSZip and extracts images.
8. **Vendor defaults:** After AI processing, if vendor_name is found, `getVendorDefaults()` populates category/job_code/use_percent from history.
