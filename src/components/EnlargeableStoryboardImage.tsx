import { useEffect, useState } from 'react';
import { X, ZoomIn } from 'lucide-react';

type EnlargeableStoryboardImageProps = {
  src: string;
  alt: string;
  imgClassName?: string;
  onError?: () => void;
};

export function EnlargeableStoryboardImage({
  src,
  alt,
  imgClassName,
  onError
}: EnlargeableStoryboardImageProps) {
  const [open, setOpen] = useState(false);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const handleImageError = () => {
    setErrored(true);
    setOpen(false);
    onError?.();
  };

  return (
    <>
      <div className="relative">
        <img
          src={src}
          alt={alt}
          onError={handleImageError}
          className={imgClassName}
        />
        {!errored && (
          <button
            type="button"
            aria-label="View full size"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(true);
            }}
            className="absolute top-2 right-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-md border border-gray-200 hover:bg-white transition"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && !errored && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            aria-label="Close full size view"
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-md border border-gray-200 hover:bg-white transition"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={src}
            alt={alt}
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </>
  );
}
