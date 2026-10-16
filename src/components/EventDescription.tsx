import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface EventDescriptionProps {
  text: string;
  className?: string;
  textColor?: string;
}

export const EventDescription: React.FC<EventDescriptionProps> = ({
  text,
  className = '',
  textColor = 'text-slate-600 dark:text-slate-300',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const pRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = pRef.current;
    if (!el) return;

    const checkOverflow = () => {
      const computed = window.getComputedStyle(el);
      const lineHeight = parseFloat(computed.lineHeight) || 18;
      // Quando non è espanso con line-clamp-3, scrollHeight > clientHeight indica overflow oltre 3 righe.
      // Quando è espanso, scrollHeight > lineHeight * 3.1 verifica se supera ancora 3 righe.
      const exceedsThreeLines = isExpanded
        ? el.scrollHeight > lineHeight * 3.1
        : el.scrollHeight > el.clientHeight + 2 || el.scrollHeight > lineHeight * 3.1;

      setCanExpand(exceedsThreeLines);
      if (!exceedsThreeLines && isExpanded) {
        setIsExpanded(false);
      }
    };

    checkOverflow();

    const observer = new ResizeObserver(() => {
      checkOverflow();
    });
    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [text, isExpanded]);

  return (
    <div className={`space-y-1 ${className}`}>
      <p
        ref={pRef}
        className={`text-xs ${textColor} leading-relaxed transition-all ${
          !isExpanded ? 'line-clamp-3' : ''
        }`}
      >
        {text}
      </p>

      {canExpand && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded((prev) => !prev);
          }}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 cursor-pointer transition select-none pt-0.5"
          aria-expanded={isExpanded}
        >
          <span>{isExpanded ? 'Mostra meno' : 'Leggi tutta la descrizione'}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </button>
      )}
    </div>
  );
};
