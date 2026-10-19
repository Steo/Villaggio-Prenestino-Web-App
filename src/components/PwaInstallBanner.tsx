import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share, CheckCircle2 } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const PwaInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // 1. Rileva se l'app è già installata o aperta come standalone
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandaloneMode) {
      setIsStandalone(true);
      return;
    }

    // 2. Rileva se è un dispositivo iOS (iPhone / iPad)
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIos(isIosDevice);

    // Controlla se l'utente ha già chiuso temporaneamente il banner in questa sessione
    const wasDismissed = sessionStorage.getItem('cdq_pwa_dismissed') === 'true';
    if (wasDismissed) {
      setDismissed(true);
    }

    // 3. Intercetta evento beforeinstallprompt per Android / Chrome Desktop
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosGuide(true);
      return;
    }

    if (!deferredPrompt) {
      // Fallback guida generica se il browser non supporta il prompt nativo
      setShowIosGuide(true);
      return;
    }

    // Mostra il prompt nativo Android/Chrome
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('cdq_pwa_dismissed', 'true');
  };

  // Se già installata in standalone o chiusa dall'utente, non mostrare nulla
  if (isStandalone || dismissed) {
    return null;
  }

  return (
    <>
      {/* Banner discreto ancorato in basso o in cima */}
      <aside
        aria-label="Installazione Web App"
        className="mx-3.5 sm:mx-auto max-w-4xl my-3 p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700/60 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 relative animate-fadeIn"
      >
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <img
            src="/pwa-192x192.png"
            alt="Icona CdQ"
            className="w-11 h-11 rounded-xl shadow-md shrink-0 border border-amber-400/30 object-cover"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-400">
                Installazione Rapida
              </span>
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded-md font-bold">
                Nessuno Store
              </span>
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
              Aggiungi l'App di Quartiere alla schermata Home
            </h4>
            <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 leading-tight">
              Accesso immediato con un tocco, funziona anche offline.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
          <button
            type="button"
            onClick={handleInstallClick}
            className="flex-1 sm:flex-initial min-h-[44px] px-4 py-2 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Installa sul Telefono</span>
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Chiudi avviso installazione"
            className="min-h-[44px] min-w-[44px] p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Modal Guida Installazione (specialmente per iOS Safari o browser senza prompt automatico) */}
      {showIosGuide && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setShowIosGuide(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src="/pwa-192x192.png"
                  alt="Icona CdQ"
                  className="w-9 h-9 rounded-xl shadow-xs shrink-0 object-cover"
                />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Installa su iPhone o Android
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Installa l'app ufficiale dell'Associazione sulla schermata Home del tuo dispositivo:
            </p>

            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
              <div className="border-b border-slate-200 dark:border-slate-700 pb-2">
                <p className="text-[11px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wide mb-1">
                  Metodo più semplice (In-App)
                </p>
                <p className="text-xs text-slate-800 dark:text-slate-200">
                  Tocca il pulsante giallo <strong>"Installa sul Telefono"</strong> in cima alla schermata per avviare l'installazione automatica della Web App con icona dedicata.
                </p>
              </div>

              <div>
                <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">
                  Android (Chrome)
                </p>
                <p className="text-xs text-slate-800 dark:text-slate-200">
                  1. Apri il menu in alto a destra (3 pallini verticali).<br />
                  2. Tocca <strong>"Installa app"</strong> oppure <strong>"Aggiungi a schermata Home"</strong>.<br />
                  3. Conferma con <strong>Installa</strong> per scaricare la Web App ufficiale con logo.
                </p>
              </div>

              <div>
                <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">
                  iPhone / iPad (Safari)
                </p>
                <p className="text-xs text-slate-800 dark:text-slate-200">
                  1. Tocca l'icona <strong>Condividi</strong> <Share className="w-3.5 h-3.5 inline text-amber-600" /> in basso su Safari.<br />
                  2. Seleziona <strong>"Aggiungi alla schermata Home"</strong>.
                </p>
              </div>

              <div className="flex items-start gap-2 pt-1 border-t border-slate-200 dark:border-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  L'app apparirà sulla tua Home con il logo dell'Associazione e funzionerà anche offline!
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="w-full min-h-[44px] py-2.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-amber-500 dark:text-slate-950 font-bold text-xs rounded-xl transition"
            >
              Ho capito, grazie!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
