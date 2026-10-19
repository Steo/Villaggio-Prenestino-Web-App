import React from 'react';
import { ShieldAlert, X, AlertTriangle, MessageSquare, Check } from 'lucide-react';

export interface RejectedItemNotice {
  id: number;
  type: 'segnalazione' | 'proposta';
  titolo: string;
  motivazione: string;
  data?: string;
}

interface RejectionNoticeModalProps {
  isOpen: boolean;
  item: RejectedItemNotice | null;
  onAcknowledge: (id: number) => void;
  darkMode?: boolean;
}

export const RejectionNoticeModal: React.FC<RejectionNoticeModalProps> = ({
  isOpen,
  item,
  onAcknowledge,
  darkMode = false,
}) => {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fadeIn">
      <div
        className={`w-full max-w-md rounded-3xl shadow-2xl border overflow-hidden transition-all duration-200 ${
          darkMode
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header Modal */}
        <div
          className="p-5 flex items-center justify-between text-white border-b border-black/10 shrink-0"
          style={{
            background: 'linear-gradient(135deg, #9f1239 0%, #881337 100%)',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20">
              <ShieldAlert className="w-6 h-6 text-rose-200 animate-pulse" />
            </div>
            <div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-200 text-rose-950 uppercase tracking-wider">
                Avviso Moderazione
              </span>
              <h3 className="text-base sm:text-lg font-black tracking-tight leading-tight mt-0.5">
                Messaggio dall'Amministratore
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onAcknowledge(item.id)}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            La tua {item.type === 'segnalazione' ? 'segnalazione' : 'proposta'} è stata esaminata dall'amministratore del quartiere ma non è stata approvata.
          </p>

          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                {item.type === 'segnalazione' ? 'Segnalazione' : 'Proposta'}:
              </span>
              {item.data && (
                <span className="text-[10px] text-rose-700/80 dark:text-rose-300/70 font-semibold">
                  {item.data}
                </span>
              )}
            </div>

            <h4 className="text-xs sm:text-sm font-bold text-rose-950 dark:text-rose-100">
              "{item.titolo}"
            </h4>

            {item.motivazione && (
              <div className="pt-2 border-t border-rose-200/60 dark:border-rose-800/60">
                <div className="text-[11px] font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5 mb-1">
                  <MessageSquare className="w-3.5 h-3.5 text-rose-700 dark:text-rose-300" />
                  Motivazione dell'Amministratore:
                </div>
                <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-rose-200/80 dark:border-rose-900/80 text-xs italic text-slate-800 dark:text-slate-200 leading-relaxed">
                  "{item.motivazione}"
                </div>
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
            Nota: Trovi questo avviso salvato anche nel tuo Centro Notifiche.
          </p>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={() => onAcknowledge(item.id)}
            className="w-full sm:w-auto px-5 py-2.5 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-extrabold rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Ho Capito</span>
          </button>
        </div>
      </div>
    </div>
  );
};
