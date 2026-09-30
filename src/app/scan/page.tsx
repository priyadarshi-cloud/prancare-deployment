'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useApp } from '@/components/AppContext';
import { Camera, Upload, CheckCircle2, AlertTriangle, Sparkles, RefreshCw, X, ArrowRight, ShieldCheck } from 'lucide-react';

interface CapturedImage {
  id: string;
  dataUrl: string;
  label: string;
}

const DEMO_SAMPLES = [
  {
    id: 'sample-verified',
    title: 'Paracetamol 500mg',
    subtitle: 'Standard pack with registered batch & valid dates',
    badge: 'Expected: 🟢 Verified',
    image: '/demo/sample-verified.png'
  },
  {
    id: 'sample-needs-review',
    title: 'Amoxicillin 250mg',
    subtitle: 'Missing manufacturer imprint & smudged batch',
    badge: 'Expected: 🟡 Needs Verification',
    image: '/demo/sample-needs-review.png'
  },
  {
    id: 'sample-suspicious',
    title: 'Cough Relief Syrup (RC998877)',
    subtitle: 'Batch matches active regulator recall alert',
    badge: 'Expected: 🔴 Suspicious (Recall)',
    image: '/demo/sample-suspicious.png'
  },
  {
    id: 'sample-expired',
    title: 'Cetirizine 10mg (Exp: 2023)',
    subtitle: 'Valid packaging format but expired past safety date',
    badge: 'Expected: 🔴 Suspicious (Expired)',
    image: '/demo/sample-expired.png'
  }
];

export default function ScanPage() {
  const router = useRouter();
  const { t } = useApp();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<CapturedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Resize and strip EXIF using HTML Canvas
  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1600;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          const label = images.length === 0 ? 'Front Side' : `Side ${images.length + 1}`;
          setImages((prev) => [...prev, { id: `img_${Date.now()}`, dataUrl: resizedDataUrl, label }]);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach((file) => processFile(file));
      e.target.value = '';
    }
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleCapturePhoto = async () => {
    setErrorMessage(null);

    // Check camera permission if supported
    if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'camera' as any });
        if (permissionStatus.state === 'denied') {
          setErrorMessage("Camera permission is denied in your browser settings. You can use 'Upload Image' instead.");
          return;
        }
      } catch {
        // Fall back directly to camera input if permission query unsupported
      }
    }

    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
      cameraInputRef.current.click();
    }
  };

  const handleUploadImage = () => {
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const runVerification = async (selectedImages: string[], demoHint?: string) => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      setProcessingStep('Extracting printed text via Gemini Vision...');
      const extractRes = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: selectedImages,
          demoHint
        })
      });

      if (!extractRes.ok) {
        throw new Error('Failed to read text from packaging photo');
      }

      const { extraction } = await extractRes.json();

      setProcessingStep('Comparing against catalog & recall registers...');
      const verifyRes = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          extraction,
          images: selectedImages.length ? ['user-upload'] : ['demo-pack']
        })
      });

      if (!verifyRes.ok) {
        throw new Error('Verification classification failed');
      }

      const { result } = await verifyRes.json();
      router.push(`/result/${result.scanId}`);
    } catch (err: any) {
      console.error('Scan error:', err);
      setErrorMessage(err.message || 'Verification could not be completed.');
      setIsProcessing(false);
    }
  };

  const handleStartScan = () => {
    if (images.length === 0) {
      setErrorMessage('Please capture or upload at least one photograph of the packaging.');
      return;
    }
    const base64List = images.map((i) => i.dataUrl);
    runVerification(base64List);
  };

  const handleSelectDemo = (demoId: string) => {
    runVerification([], demoId);
  };

  return (
    <div className="space-y-5">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          {t('btn_scan', 'Scan Medicine')}
        </h1>
        <p className="text-sm text-slate-600 font-medium">
          Capture front and back labels to verify batch, manufacturer, and dates.
        </p>
      </div>

      {/* Camera / Upload Viewport */}
      <div className="pran-card p-5 border-2 border-dashed border-teal-300/80 bg-white relative overflow-hidden">
        {/* Frame guidelines */}
        <div className="border-2 border-pran-teal/40 rounded-2xl p-4 bg-teal-50/40 text-center flex flex-col items-center justify-center min-h-[200px]">
          <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center text-pran-teal mb-3 shadow-sm">
            <Camera className="w-7 h-7 stroke-[2]" />
          </div>
          <p className="text-sm font-bold text-slate-900">
            Position medicine packaging within frame
          </p>
          <p className="text-xs text-slate-500 max-w-xs mt-1">
            Ensure good lighting. Make sure batch number and expiry dates are clearly visible.
          </p>

          {/* Checklist */}
          <div className="grid grid-cols-2 gap-2 mt-4 text-[11px] font-semibold text-slate-700 w-full max-w-xs text-left">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Medicine Name
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Batch Number
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Expiry Date
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Manufacturer
            </span>
          </div>
        </div>

        {/* Dedicated Camera Input (Mobile Rear Camera) */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileInput}
          className="hidden"
        />

        {/* Dedicated Upload Input (Gallery / File Picker) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
        />

        {/* Action Buttons: Take Photo & Upload */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <button
            type="button"
            onClick={handleCapturePhoto}
            className="min-h-[52px] bg-pran-dark hover:bg-pran-deep text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <Camera className="w-4 h-4" />
            <span>Capture Photo</span>
          </button>
          <button
            type="button"
            onClick={handleUploadImage}
            className="min-h-[52px] bg-teal-50 hover:bg-teal-100 text-pran-dark border border-teal-200 font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            <Upload className="w-4 h-4 text-pran-teal" />
            <span>Upload Image</span>
          </button>
        </div>
      </div>

      {/* Captured Image Gallery */}
      {images.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Captured Sides ({images.length})</span>
            <button
              onClick={handleCapturePhoto}
              className="text-pran-teal underline hover:text-pran-dark"
            >
              + Add another side
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {images.map((img) => (
              <div
                key={img.id}
                className="relative rounded-xl border border-teal-200 overflow-hidden bg-slate-900 group"
              >
                <img
                  src={img.dataUrl}
                  alt={img.label}
                  className="w-full h-28 object-cover opacity-90"
                />
                <span className="absolute bottom-1 left-2 text-[10px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded">
                  {img.label}
                </span>
                <button
                  onClick={() => removeImage(img.id)}
                  aria-label="Remove image"
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={handleStartScan}
            disabled={isProcessing}
            className="w-full min-h-[56px] btn-primary text-base font-extrabold mt-3"
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin" />
                {processingStep}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
                <span>Verify Packaging Now</span>
              </span>
            )}
          </button>
        </div>
      )}

      {/* Error display */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="p-4 rounded-2xl bg-teal-900 text-white shadow-xl flex items-center gap-4">
          <RefreshCw className="w-8 h-8 text-pran-turquoise animate-spin flex-shrink-0" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-teal-100">Verification in progress</h4>
            <p className="text-xs text-teal-200/90">{processingStep}</p>
          </div>
        </div>
      )}

      {/* TRY DEMO MEDICINE FOR JUDGES */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              {t('btn_try_demo', 'Try a Demo Medicine (For Evaluation)')}
            </h3>
          </div>
        </div>

        <div className="space-y-2.5">
          {DEMO_SAMPLES.map((demo) => (
            <button
              key={demo.id}
              onClick={() => handleSelectDemo(demo.id)}
              disabled={isProcessing}
              className="w-full text-left p-3.5 rounded-2xl border border-teal-100 bg-white hover:border-pran-teal hover:shadow-sm transition-all flex items-center justify-between group active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                  <Image
                    src={demo.image}
                    alt={demo.title}
                    width={48}
                    height={48}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-slate-900">
                      {demo.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium line-clamp-1">
                    {demo.subtitle}
                  </p>
                  <span className="text-[10px] font-bold text-pran-dark/80 bg-teal-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                    {demo.badge}
                  </span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-pran-teal group-hover:translate-x-1 transition-all flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
