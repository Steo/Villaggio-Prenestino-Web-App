import React from 'react';
import {
  Bell,
  BellRing,
  CheckCircle2,
  AlertTriangle,
  Info,
  Trash2,
  CheckCheck,
  X,
  Vote,
  ClipboardList,
  Sparkles,
  ExternalLink,
  Store,
} from 'lucide-react';
import { AppNotification } from '../types';
import {
  getNotificationPermission,
  requestBrowserNotificationPermission,
  isNotificationSupported,
} from '../services/notificationService';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onTestNotification: () => void;
  onSimulateProposalVote: () => void;
  onSimulateReportStatusChange: () => void;
  onSimulateShopApproval?: () => void;
  darkMode: boolean;
  onPermissionChange?: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onClearAll,
  onTestNotification,
  onSimulateProposalVote,
  onSimulateReportStatusChange,
  onSimulateShopApproval,
  darkMode,
  onPermissionChange,
}) => {
  const [permission, setPermission] = React.useState<NotificationPermission | 'unsupported'>(
    getNotificationPermission()
  );
  const [requesting, setRequesting] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setPermission(getNotificationPermission());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    setRequesting(true);
    try {
      const res = await requestBrowserNotificationPermission();
      setPermission(res);
      if (onPermissionChange) onPermissionChange();
    } finally {
      setRequesting(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.letta).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div
        className={`w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl shadow-2xl border overflow-hidden transition-all duration-200 ${
          darkMode
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header Modal */}
        <div
          className="p-4 sm:p-5 flex items-center justify-between text-white border-b border-black/10 shrink-0"
          style={{
            background: 'linear-gradient(135deg, #781816 0%, #5a1210 100%)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20">
              <BellRing className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight leading-tight">
                  Centro Notifiche Quartiere
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-amber-400 text-slate-950">
                    {unreadCount} nuove
                  </span>
                )}
              </div>
              <p className="text-[11px] text-white/80">
                Avvisi su voti alle proposte, stato segnalazioni e approvazione attività commerciali
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/15 text-white/80 hover:text-white transition cursor-pointer"
            title="Chiudi"
            aria-label="Chiudi finestra notifiche"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo Modal con scroll */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* Banner Stato Notifiche Browser */}
          <div
            className={`p-3.5 rounded-2xl border transition-all ${
              permission === 'granted'
                ? darkMode
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : permission === 'denied'
                ? darkMode
                  ? 'bg-amber-950/40 border-amber-800/60 text-amber-300'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
                : darkMode
                ? 'bg-slate-800/80 border-slate-700 text-slate-200'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                {permission === 'granted' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                ) : permission === 'denied' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                ) : (
                  <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold flex items-center gap-1.5">
                    Notifiche di sistema del Browser
                    {permission === 'granted' && (
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-600 text-white font-black">
                        Attive
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] mt-0.5 opacity-90 leading-relaxed">
                    {permission === 'granted'
                      ? 'Riceverai avvisi desktop/browser in tempo reale quando una tua proposta riceve nuovi voti o una segnalazione cambia stato.'
                      : permission === 'denied'
                      ? 'Notifiche di sistema bloccate nelle impostazioni del browser. Puoi riattivarle cliccando sull\'icona del lucchetto nella barra degli indirizzi.'
                      : isNotificationSupported()
                      ? 'Attiva le notifiche del browser per non perderti nessun aggiornamento sulle tue proposte o segnalazioni.'
                      : 'Il browser corrente non supporta le notifiche push di sistema, ma vedrai sempre i badge e avvisi interni nell\'app.'}
                  </p>
                </div>
              </div>

              {permission === 'default' && isNotificationSupported() && (
                <button
                  type="button"
                  onClick={handleRequestPermission}
                  disabled={requesting}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold text-xs shrink-0 transition shadow-xs cursor-pointer"
                >
                  {requesting ? 'Attesa...' : 'Abilita'}
                </button>
              )}
            </div>
          </div>



          {/* Elenco Storico Notifiche */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-black text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">
                Storico Notifiche ({notifications.length})
              </span>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={onMarkAllAsRead}
                    className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Segna lette
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={onClearAll}
                    className="text-[11px] font-semibold text-slate-400 hover:text-rose-500 flex items-center gap-1 transition cursor-pointer"
                    title="Cancella storico"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Svuota
                  </button>
                )}
              </div>
            </div>

            {notifications.length === 0 ? (
              <div
                className={`p-8 text-center rounded-2xl border text-slate-400 ${
                  darkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50/50'
                }`}
              >
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                <p className="font-medium text-xs">Nessuna notifica ricevuta al momento.</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Appena un residente voterà una tua proposta o un funzionario aggiornerà lo stato di una tua segnalazione, riceverai subito un avviso.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 rounded-2xl border transition-all flex items-start gap-3 ${
                      !n.letta
                        ? darkMode
                          ? 'bg-amber-950/20 border-amber-500/40'
                          : 'bg-amber-50/70 border-amber-300'
                        : darkMode
                        ? 'bg-slate-800/40 border-slate-800'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                        n.tipo === 'proposta_voti'
                          ? 'bg-amber-500/20 text-amber-500'
                          : n.tipo === 'commercio_approvato'
                          ? 'bg-emerald-500/20 text-emerald-500'
                          : n.tipo === 'segnalazione_stato'
                          ? 'bg-sky-500/20 text-sky-500'
                          : 'bg-slate-500/20 text-slate-400'
                      }`}
                    >
                      {n.tipo === 'proposta_voti' ? (
                        <Vote className="w-4 h-4" />
                      ) : n.tipo === 'commercio_approvato' ? (
                        <Store className="w-4 h-4" />
                      ) : (
                        <ClipboardList className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                          {n.titolo}
                        </h4>
                        <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                          {n.dataOra}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                        {n.messaggio}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className={`p-3 sm:p-4 border-t flex items-center justify-between shrink-0 ${
            darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <span className="text-[11px] text-slate-400 font-medium">
            Notifiche Villaggio Prenestino
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white text-xs font-bold transition cursor-pointer"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
