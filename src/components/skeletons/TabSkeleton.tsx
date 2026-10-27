import React from 'react';

interface TabSkeletonProps {
  type?: 'home' | 'eventi' | 'commercio' | 'segnalazioni' | 'volontariato' | 'proposte';
}

export const TabSkeleton: React.FC<TabSkeletonProps> = ({ type = 'home' }) => {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 space-y-6 animate-pulse">
      {/* Header bar skeleton */}
      <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-2xl w-full" />

      {/* Quick metrics / filter row */}
      <div className="flex gap-3 overflow-hidden py-1">
        <div className="h-10 w-28 bg-slate-200 dark:bg-slate-800 rounded-xl shrink-0" />
        <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded-xl shrink-0" />
        <div className="h-10 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl shrink-0" />
        <div className="h-10 w-36 bg-slate-200 dark:bg-slate-800 rounded-xl shrink-0" />
      </div>

      {type === 'commercio' ? (
        <>
          {/* Map canvas skeleton */}
          <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl w-full flex items-center justify-center">
            <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase">
              Caricamento mappa interattiva...
            </span>
          </div>
          {/* Grid cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
            ))}
          </div>
        </>
      ) : (
        /* Standard card list skeleton */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-52 bg-slate-200 dark:bg-slate-800 rounded-2xl p-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="h-5 bg-slate-300 dark:bg-slate-700 rounded w-3/4" />
                <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-1/2" />
                <div className="h-12 bg-slate-300 dark:bg-slate-700 rounded w-full" />
              </div>
              <div className="flex justify-between items-center pt-2">
                <div className="h-8 bg-slate-300 dark:bg-slate-700 rounded-xl w-24" />
                <div className="h-8 bg-slate-300 dark:bg-slate-700 rounded-xl w-20" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
