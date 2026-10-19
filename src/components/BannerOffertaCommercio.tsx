import React from 'react';
import { Percent, Clock } from 'lucide-react';
import { OffertaCommercio } from '../types';

interface BannerOffertaCommercioProps {
  offerta: OffertaCommercio;
  isDark?: boolean;
  compact?: boolean;
  className?: string;
}

/**
 * Banner uniforme per le offerte dei commercianti di quartiere.
 * Utilizza un verde petrolio / teal brillante, nettamente distinto dal verde WhatsApp (#25D366),
 * con l'icona con simbolo percentuale (%) e perfetta leggibilità sia in modalità chiara che scura.
 */
export const BannerOffertaCommercio: React.FC<BannerOffertaCommercioProps> = ({
  offerta,
  isDark = false,
  compact = false,
  className = '',
}) => {
  return (
    <div
      className={`rounded-xl border-l-4 transition-all duration-200 ${
        compact ? 'p-2.5 space-y-1.5' : 'p-3 space-y-2'
      } ${
        isDark
          ? 'bg-gradient-to-br from-teal-950/85 via-teal-950/55 to-slate-900/90 border-teal-700/60 border-l-teal-400 text-teal-100'
          : 'bg-gradient-to-br from-teal-50/95 via-teal-50/60 to-emerald-50/40 border-teal-200/90 border-l-teal-600 text-teal-950 dark:bg-gradient-to-br dark:from-teal-950/85 dark:via-teal-950/55 dark:to-slate-900/90 dark:border-teal-700/60 dark:border-l-teal-400 dark:text-teal-100'
      } border shadow-2xs ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            className={`flex items-center justify-center shrink-0 rounded-md ${
              compact ? 'w-5 h-5' : 'w-5.5 h-5.5'
            } ${
              isDark
                ? 'bg-teal-400 text-teal-950'
                : 'bg-teal-600 text-white dark:bg-teal-400 dark:text-teal-950'
            } shadow-2xs`}
          >
            <Percent className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} stroke-[3]`} />
          </div>
          <span
            className={`font-black text-xs leading-tight truncate ${
              isDark ? 'text-teal-100' : 'text-teal-950 dark:text-teal-100'
            }`}
          >
            {offerta.titolo}
          </span>
        </div>

        {offerta.scontoPercentuale ? (
          <span
            className={`shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs flex items-center gap-0.5 ${
              isDark
                ? 'bg-teal-400 text-teal-950'
                : 'bg-teal-600 text-white dark:bg-teal-400 dark:text-teal-950'
            }`}
          >
            -{offerta.scontoPercentuale}%
          </span>
        ) : (
          <span
            className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
              isDark
                ? 'bg-teal-900/90 text-teal-200 border-teal-700/70'
                : 'bg-teal-100/90 text-teal-800 border-teal-200/80 dark:bg-teal-900/90 dark:text-teal-200 dark:border-teal-700/70'
            }`}
          >
            <Percent className="w-2.5 h-2.5 stroke-[2.5]" />
            <span>Offerta</span>
          </span>
        )}
      </div>

      <p
        className={`text-[11px] leading-snug ${
          compact ? 'line-clamp-2' : ''
        } ${
          isDark ? 'text-teal-100/90' : 'text-teal-900/90 dark:text-teal-200/90'
        }`}
      >
        {offerta.dettaglio}
      </p>

      {/* Footer info: scadenza o invito a mostrare l'app */}
      <div
        className={`flex items-center justify-between text-[10px] font-medium pt-0.5 border-t ${
          isDark
            ? 'border-teal-800/50 text-teal-300/80'
            : 'border-teal-200/60 text-teal-700/90 dark:border-teal-800/50 dark:text-teal-300/80'
        }`}
      >
        <span className="flex items-center gap-1 truncate">
          Mostra in cassa per applicare lo sconto
        </span>
        {offerta.scadenza && (
          <span className="flex items-center gap-1 shrink-0 ml-1.5 font-semibold">
            <Clock className="w-2.5 h-2.5" />
            <span>Scade: {offerta.scadenza}</span>
          </span>
        )}
      </div>
    </div>
  );
};
