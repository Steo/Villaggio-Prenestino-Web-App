import React from 'react';

/**
 * Skeleton Loader per le Notizie dell'Associazione (HomeTab)
 */
export const NewsSkeletonCard: React.FC = () => {
  return (
    <article className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs flex flex-col justify-between animate-pulse">
      <div>
        {/* Immagine segnaposto con shimmer */}
        <div className="relative aspect-[16/9] bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent" />
          <div className="absolute bottom-2 left-2 w-16 h-4 rounded-md bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Titolo ed estratto segnaposto */}
        <div className="p-3.5 space-y-2">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-11/12" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4" />
          <div className="pt-1.5 space-y-1">
            <div className="h-3 bg-slate-150 dark:bg-slate-800/80 rounded-md w-full" />
            <div className="h-3 bg-slate-150 dark:bg-slate-800/80 rounded-md w-4/5" />
          </div>
        </div>
      </div>

      {/* Pulsanti azione segnaposto */}
      <div className="px-3.5 pb-3.5 pt-1 flex items-center gap-2">
        <div className="h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex-1" />
        <div className="h-8 w-24 rounded-lg bg-slate-100 dark:bg-slate-800" />
      </div>
    </article>
  );
};

export const NewsSkeletonList: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5" aria-busy="true" aria-label="Caricamento notizie in corso...">
      {Array.from({ length: count }).map((_, idx) => (
        <NewsSkeletonCard key={idx} />
      ))}
    </div>
  );
};

/**
 * Skeleton Loader per le Segnalazioni dei Cittadini (SegnalazioniTab)
 */
export const SegnalazioneSkeletonCard: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-xs space-y-3 animate-pulse" aria-busy="true">
      {/* Header card: badge stato e data */}
      <div className="flex items-center justify-between">
        <div className="h-6 w-28 rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-16 rounded-md bg-slate-100 dark:bg-slate-800" />
      </div>

      {/* Titolo e indirizzo */}
      <div className="space-y-1.5">
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-2/3" />
        <div className="h-3.5 bg-slate-150 dark:bg-slate-800/80 rounded-md w-1/2" />
      </div>

      {/* Descrizione segnalazione */}
      <div className="space-y-1 pt-0.5">
        <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded-md w-full" />
        <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded-md w-4/5" />
      </div>

      {/* Miniature foto segnaposto */}
      <div className="flex items-center gap-2 pt-1">
        <div className="w-18 h-18 rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="w-18 h-18 rounded-xl bg-slate-150 dark:bg-slate-800/80" />
      </div>
    </div>
  );
};

export const SegnalazioniSkeletonList: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Caricamento segnalazioni in corso...">
      {Array.from({ length: count }).map((_, idx) => (
        <SegnalazioneSkeletonCard key={idx} />
      ))}
    </div>
  );
};

/**
 * Skeleton Loader per la Vetrina Commercianti e Negozi (CommercioTab)
 */
export const CommercioSkeletonCard: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs animate-pulse flex flex-col justify-between" aria-busy="true">
      <div>
        {/* Immagine vetrina segnaposto */}
        <div className="relative h-44 bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <div className="absolute top-3 left-3 w-32 h-6 rounded-full bg-slate-300 dark:bg-slate-700" />
          <div className="absolute top-3 right-3 w-20 h-5 rounded-full bg-slate-300 dark:bg-slate-700" />
          <div className="absolute bottom-3 left-3 right-3 space-y-1.5">
            <div className="h-5 rounded-md bg-slate-300 dark:bg-slate-700 w-3/4" />
            <div className="h-3.5 rounded-md bg-slate-300 dark:bg-slate-700 w-1/2" />
          </div>
        </div>

        {/* Corpo scheda */}
        <div className="p-4 space-y-3">
          {/* Tasto Mi Piace placeholder */}
          <div className="h-10 rounded-2xl bg-slate-200 dark:bg-slate-800 w-full" />

          {/* Box promozione placeholder */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1.5">
            <div className="h-4 rounded-md bg-slate-200 dark:bg-slate-800 w-2/3" />
            <div className="h-3 rounded-md bg-slate-150 dark:bg-slate-800/70 w-full" />
          </div>

          {/* Tasto Accordion placeholder */}
          <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
            <div className="h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

export const CommercioSkeletonGrid: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" aria-busy="true" aria-label="Caricamento commercianti in corso...">
      {Array.from({ length: count }).map((_, idx) => (
        <CommercioSkeletonCard key={idx} />
      ))}
    </div>
  );
};
