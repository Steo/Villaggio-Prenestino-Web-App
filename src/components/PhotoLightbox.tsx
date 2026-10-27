import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface PhotoLightboxProps {
  url: string | null;
  onClose: () => void;
}

export const PhotoLightbox: React.FC<PhotoLightboxProps> = ({ url, onClose }) => {
  useEffect(() => {
    if (!url) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [url, onClose]);

  if (!url) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Visualizzazione locandina a tutto schermo"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn cursor-zoom-out select-none"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Chiudi visualizzazione a tutto schermo"
        className="absolute top-4 right-4 p-2.5 rounded-full bg-slate-800/90 text-white hover:bg-slate-700 active:scale-95 transition shadow-lg cursor-pointer"
      >
        <X className="w-6 h-6" />
      </button>
      <img
        src={url}
        alt="Locandina / Immagine a tutto schermo"
        className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl animate-scaleUp cursor-default"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};

