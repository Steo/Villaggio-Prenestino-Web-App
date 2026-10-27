import React, { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface ProgressiveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  fallbackIcon?: React.ReactNode;
}

export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  alt,
  className = '',
  containerClassName = '',
  fallbackIcon,
  ...imgProps
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <div className={`relative overflow-hidden ${containerClassName}`}>
      {/* Skeleton Shimmer Placeholder while loading */}
      {!isLoaded && !hasError && (
        <div 
          className="absolute inset-0 bg-slate-200 dark:bg-slate-800 animate-pulse flex items-center justify-center pointer-events-none z-10"
          aria-hidden="true"
        >
          <div className="w-8 h-8 rounded-full bg-slate-300/60 dark:bg-slate-700/60 flex items-center justify-center opacity-40">
            <ImageIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          </div>
        </div>
      )}

      {/* Fallback container if the image fails to load */}
      {hasError ? (
        <div 
          className="absolute inset-0 bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center p-3 text-center text-slate-400 dark:text-slate-500"
          role="img"
          aria-label={alt}
        >
          {fallbackIcon || <ImageIcon className="w-8 h-8 opacity-60 mb-1" />}
          <span className="text-[11px] font-medium leading-tight max-w-[180px] truncate opacity-80">
            {alt}
          </span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            setHasError(true);
            setIsLoaded(true);
          }}
          className={`transition-opacity duration-300 ease-out ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          {...imgProps}
        />
      )}
    </div>
  );
};
