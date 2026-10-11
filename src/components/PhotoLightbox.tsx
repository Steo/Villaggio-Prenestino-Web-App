import React from 'react';
import { X } from 'lucide-react';

interface PhotoLightboxProps {
  url: string | null;
  onClose: () => void;
}

export const PhotoLightbox: React.FC<PhotoLightboxProps> = ({ url, onClose }) => {
  if (!url) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn cursor-zoom-out"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 text-white hover:bg-slate-700 transition"
      >
        <X className="w-6 h-6" />
      </button>
      <img
        src={url}
        alt="Foto segnalazione ingrandita"
        className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};
