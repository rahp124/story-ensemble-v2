import { useEffect, useRef, useState } from 'react';
import { Loader, Modal } from '@mantine/core';
import type { CharacterCreationCopy } from '@/content/onboardingCopy';

type View = 'choose' | 'camera' | 'preview';

interface PhotoCaptureModalProps {
  copy: CharacterCreationCopy['upload'];
  isProcessing: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: (dataUrl: string) => void;
}

function primaryButtonClass(disabled: boolean) {
  return `w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
    disabled ? 'cursor-not-allowed' : ''
  }`;
}

function secondaryButtonClass() {
  return 'w-full py-3 px-6 bg-white hover:bg-gray-50 text-gray-800 font-semibold rounded-xl border border-gray-300 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
}

export function PhotoCaptureModal({
  copy,
  isProcessing,
  error,
  onCancel,
  onConfirm
}: PhotoCaptureModalProps) {
  const [view, setView] = useState<View>('choose');
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoSource, setPhotoSource] = useState<'camera' | 'upload' | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    if (view !== 'camera') return;

    let cancelled = false;
    setCameraError(null);

    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'user' } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(() => {
        if (!cancelled) setCameraError(copy.cameraError);
      });

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [view, copy.cameraError]);

  useEffect(() => stopCamera, []);

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth || !video.videoHeight) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/png');
    stopCamera();
    setPhoto(dataUrl);
    setPhotoSource('camera');
    setView('preview');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhoto(reader.result as string);
      setPhotoSource('upload');
      setView('preview');
    };
    reader.readAsDataURL(file);
  };

  const handleBack = () => {
    stopCamera();
    setCameraError(null);
    setView('choose');
  };

  const handleRetake = () => {
    setPhoto(null);
    setPhotoSource(null);
    setView('choose');
  };

  const handleCancel = () => {
    stopCamera();
    onCancel();
  };

  return (
    <Modal
      opened
      onClose={handleCancel}
      title={
        <div>
          <span className="text-lg font-bold">{copy.modalTitle}</span>
          <p className="mt-1 text-sm font-normal text-gray-500">{copy.modalDescription}</p>
        </div>
      }
      centered
    >
      {view === 'choose' && (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            className={primaryButtonClass(false)}
            onClick={() => fileInputRef.current?.click()}
          >
            {copy.chooseFileButton}
          </button>
          <button
            type="button"
            className={secondaryButtonClass()}
            onClick={() => setView('camera')}>
            {copy.takeSelfieButton}
          </button>          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <button type="button" className="text-sm text-gray-500 hover:text-gray-700 mt-1" onClick={handleCancel}>
            {copy.cancelButton}
          </button>
        </div>
      )}

      {view === 'camera' && (
        <div className="flex flex-col gap-3">
          <div className="w-full aspect-square bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
            {cameraError ? (
              <p className="text-sm text-red-300 text-center px-6">{cameraError}</p>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />
          {!cameraError && (
            <button type="button" className={primaryButtonClass(false)} onClick={handleCapture}>
              {copy.captureButton}
            </button>
          )}
          <button type="button" className={secondaryButtonClass()} onClick={handleBack}>
            {copy.backButton}
          </button>
        </div>
      )}

      {view === 'preview' && photo && (
        <div className="flex flex-col gap-3">
          <div className="w-full aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
            <img src={photo} alt="Captured preview" className="w-full h-full object-cover" />
          </div>

          {isProcessing ? (
            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Loader size="sm" color="blue" />
              <p className="text-sm font-medium text-blue-700">{copy.processing}</p>
            </div>
          ) : (
            <>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button type="button" className={primaryButtonClass(false)} onClick={() => onConfirm(photo)}>
                {copy.continueButton}
              </button>
              <button type="button" className={secondaryButtonClass()} onClick={handleRetake}>
                {photoSource === 'camera' ? copy.retakeButton : copy.chooseDifferentButton}
              </button>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}
