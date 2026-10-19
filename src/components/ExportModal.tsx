import React, { useState } from 'react';
import {
  Download,
  Copy,
  Check,
  Globe,
  Server,
  X,
  BookOpen,
  CheckCircle2,
  FileCode,
  ShieldCheck,
  FolderArchive,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode?: boolean;
  onOpenWpPanel?: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  darkMode = false,
  onOpenWpPanel,
}) => {
  const [copiatoPhp, setCopiatoPhp] = useState(false);
  const [copiatoIframe, setCopiatoIframe] = useState(false);
  const [downloadingApp, setDownloadingApp] = useState(false);
  const [downloadingPlugin, setDownloadingPlugin] = useState(false);

  if (!isOpen) return null;

  const handleDownload = async (url: string, filename: string, isApp = true) => {
    if (isApp) setDownloadingApp(true);
    else setDownloadingPlugin(true);

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('File non trovato');
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 2000);
    } catch {
      // Fallback: direct anchor trigger
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      setTimeout(() => {
        if (isApp) setDownloadingApp(false);
        else setDownloadingPlugin(false);
      }, 1000);
    }
  };

  const handleCopyIframe = () => {
    const code = `<iframe\n  src="https://www.villaggioprenestino.it/app"\n  width="100%"\n  height="900"\n  style="border:none; border-radius:16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);"\n  allow="geolocation; notifications"\n  title="Web App Associazione di Quartiere Villaggio Prenestino"\n></iframe>`;
    navigator.clipboard.writeText(code);
    setCopiatoIframe(true);
    setTimeout(() => setCopiatoIframe(false), 2500);
  };

  const handleCopyPhp = async () => {
    try {
      const res = await fetch('/vp-quartiere/vp-quartiere.php');
      if (res.ok) {
        const text = await res.text();
        await navigator.clipboard.writeText(text);
        setCopiatoPhp(true);
        setTimeout(() => setCopiatoPhp(false), 2500);
      } else {
        // Fallback info text
        await navigator.clipboard.writeText('Scarica il file completo vp-quartiere.zip per WordPress');
        setCopiatoPhp(true);
        setTimeout(() => setCopiatoPhp(false), 2500);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-2xl my-auto rounded-2xl shadow-2xl overflow-hidden border transition-all ${
          darkMode
            ? 'bg-slate-900 border-slate-700/80 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Intestazione */}
        <div
          className="p-5 text-white flex items-start justify-between gap-4 border-b"
          style={{
            backgroundColor: darkMode ? '#4a0e0c' : '#781816',
            borderColor: darkMode ? '#6a1816' : '#90201d',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/20 shrink-0">
              <FolderArchive className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-lg text-white leading-tight">
                  Esporta per il tuo Sito Web
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide uppercase bg-amber-400 text-slate-950">
                  Pronto all'Uso
                </span>
              </div>
              <p className="text-xs text-white/80 mt-0.5">
                Scarica il Plugin WordPress e lo ZIP compilato della Web App per testarli sul tuo hosting
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi finestra"
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo modale */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Card 1: Plugin WordPress */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border transition-all ${
              darkMode
                ? 'bg-slate-800/80 border-emerald-500/30 shadow-xs'
                : 'bg-emerald-50/60 border-emerald-200 shadow-xs'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-500/20">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                  <span className="font-serif">W</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                      Plugin WordPress Ufficiale
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                      v1.5.0
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    Nome file: <code className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold">vp-quartiere.zip</code>
                  </p>
                </div>
              </div>

              {/* Bottoni azione Plugin */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDownload('/vp-quartiere.zip', 'vp-quartiere.zip', false)}
                  disabled={downloadingPlugin}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{downloadingPlugin ? 'Scaricamento...' : 'Scarica Plugin (.zip)'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyPhp}
                  title="Copia codice sorgente vp-quartiere.php"
                  className="px-3 py-2 rounded-xl bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600 font-semibold text-xs flex items-center gap-1 transition cursor-pointer"
                >
                  {copiatoPhp ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  <span>{copiatoPhp ? 'Copiato!' : 'Copia PHP'}</span>
                </button>
              </div>
            </div>

            {/* Dettagli Plugin */}
            <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Menu ordinato sotto <strong>"🏡 VP Quartiere"</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Dashboard con Insight & statistiche</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>API REST integrate (Notizie, Eventi, Segnalazioni)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Installazione pulita (zero dati fittizi)</span>
              </div>
            </div>
          </div>

          {/* Card 2: Web App ZIP compilata */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border transition-all ${
              darkMode
                ? 'bg-slate-800/80 border-blue-500/30 shadow-xs'
                : 'bg-blue-50/60 border-blue-200 shadow-xs'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-blue-500/20">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                      Web App Completa Compilata
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-600/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                      Build Produzione
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    Nome file: <code className="font-mono text-blue-700 dark:text-blue-400 font-semibold">villaggioprenestino-app.zip</code>
                  </p>
                </div>
              </div>

              {/* Bottone Scarica Web App */}
              <button
                type="button"
                onClick={() => handleDownload('/villaggioprenestino-app.zip', 'villaggioprenestino-app.zip', true)}
                disabled={downloadingApp}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>{downloadingApp ? 'Scaricamento...' : 'Scarica Web App (.zip)'}</span>
              </button>
            </div>

            {/* Dettagli Web App */}
            <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Include Notifiche Browser, Calendario e Gamification</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Configurazione Apache con <code className="font-mono text-[11px]">.htaccess</code></span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Percorsi relativi pronti per sottocartella <code className="font-mono text-[11px]">/app</code></span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Guida rapida <code className="font-mono text-[11px]">LEGGIMI-INSTALLAZIONE.txt</code></span>
              </div>
            </div>
          </div>

          {/* Card 3: Codice Embed Iframe */}
          <div
            className={`p-4 rounded-xl border ${
              darkMode
                ? 'bg-slate-800/50 border-slate-700'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-amber-500" />
                <h5 className="font-bold text-xs uppercase tracking-wide text-slate-700 dark:text-slate-300">
                  Embed rapido in qualsiasi pagina WordPress:
                </h5>
              </div>
              <button
                type="button"
                onClick={handleCopyIframe}
                className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiatoIframe ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiatoIframe ? 'Copiato!' : 'Copia codice'}</span>
              </button>
            </div>
            <pre className="text-[11px] font-mono p-2.5 rounded-lg bg-slate-900 text-slate-100 overflow-x-auto leading-relaxed">
{`<iframe src="https://www.villaggioprenestino.it/app" width="100%" height="900" style="border:none; border-radius:16px;" allow="geolocation; notifications"></iframe>`}
            </pre>
          </div>

          {/* Card 4: Guida all'installazione in 4 passaggi */}
          <div
            className={`p-4 rounded-xl border space-y-2.5 ${
              darkMode
                ? 'bg-slate-800/50 border-slate-700'
                : 'bg-amber-50/50 border-amber-200'
            }`}
          >
            <h5 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-amber-600" />
              Guida Rapida all'Installazione (Hosting Ergonet / cPanel / FTP):
            </h5>
            <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-1">
              <li>
                <strong>Installa il Plugin WordPress:</strong> Da <code>wp-admin &gt; Plugin &gt; Aggiungi nuovo &gt; Carica plugin</code>, carica <code>vp-quartiere.zip</code> e attivalo.
              </li>
              <li>
                <strong>Crea la cartella /app sull'hosting:</strong> Apri cPanel &gt; "Gestione File" (oppure collegati con FileZilla) dentro <code>public_html</code> e crea la cartella <code>app</code>.
              </li>
              <li>
                <strong>Carica ed estrai la Web App:</strong> Carica <code>villaggioprenestino-app.zip</code> dentro la cartella <code>public_html/app</code> ed estrailo.
              </li>
              <li>
                <strong>Testa online:</strong> Apri nel browser <code>https://www.villaggioprenestino.it/app</code>. La web app comunicherà direttamente con il plugin WordPress!
              </li>
            </ol>

            {/* Box Risoluzione Automatica Schermata Bianca */}
            <div className="mt-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-900 dark:text-emerald-200">
              <div className="font-bold flex items-center gap-1 mb-1 text-emerald-800 dark:text-emerald-300">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Nuovo ZIP con Protezione Automatica "Schermata Bianca"</span>
              </div>
              <p className="leading-relaxed">
                Se su <code className="font-mono">villaggioprenestino.it/app/</code> vedevi una pagina vuota, era perché i file <code>.js</code> e <code>.css</code> sono stati estratti direttamente dentro <code>/app/</code> senza la cartella <code>assets/</code>.
                Il nuovo archivio ZIP include ora la <strong>doppia compatibilità</strong> (file sia in root che in <code>assets/</code> + recupero intelligente in <code>index.html</code>) per funzionare con qualsiasi metodo di estrazione cPanel o FTP.
              </p>
            </div>
          </div>
        </div>

        {/* Footer modale con scorciatoia a console admin */}
        <div
          className={`p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs ${
            darkMode
              ? 'bg-slate-800/90 border-slate-700 text-slate-300'
              : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>
              Tutti i file sono ottimizzati, sicuri e pronti per il server di produzione.
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {onOpenWpPanel && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenWpPanel();
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <Server className="w-3.5 h-3.5" />
                <span>Pannello WordPress & Insight</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 font-bold transition cursor-pointer"
            >
              Chiudi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
