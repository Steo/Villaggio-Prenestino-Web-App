import React, { useEffect } from 'react';
import {
  X,
  Sparkles,
  Award,
  HeartHandshake,
  Trophy,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export type LivelloCommunity = 'Nuovo Vicino' | 'Vicino Attivo' | 'Pilastro' | 'Custode';

export interface NuovoLivelloModalProps {
  isOpen: boolean;
  onClose: () => void;
  livello: LivelloCommunity;
  punti: number;
  darkMode?: boolean;
}

interface LivelloThemeConfig {
  badge: string;
  titoloCongratulazioni: string;
  sottotitolo: string;
  descrizione: string;
  privilegi: string[];
  gradientHeader: string;
  badgeRingColor: string;
  badgeBg: string;
  badgeText: string;
  accentPillBg: string;
  accentPillBorder: string;
  accentPillText: string;
  buttonGradient: string;
  buttonShadow: string;
  iconColor: string;
  prossimoTraguardo?: {
    nome: string;
    puntiMancanti: number;
  };
}

export const LIVELLO_RANKS: Record<LivelloCommunity, number> = {
  'Nuovo Vicino': 0,
  'Vicino Attivo': 1,
  'Pilastro': 2,
  'Custode': 3,
};

export function getLivelloFromPunti(pts: number): LivelloCommunity {
  if (pts >= 150) return 'Custode';
  if (pts >= 80) return 'Pilastro';
  if (pts >= 30) return 'Vicino Attivo';
  return 'Nuovo Vicino';
}

const LIVELLO_CONFIGS: Record<LivelloCommunity, LivelloThemeConfig> = {
  'Vicino Attivo': {
    badge: '🤝',
    titoloCongratulazioni: 'Complimenti!',
    sottotitolo: 'Hai raggiunto il livello Vicino Attivo',
    descrizione:
      'Grazie alla tua partecipazione costante hai compiuto un grande passo avanti! La tua presenza attiva tra segnalazioni, eventi e volontariato rende la nostra comunità più unita e vivibile.',
    privilegi: [
      'Badge ufficiale 🤝 Vicino Attivo visibile nella Classifica di Quartiere',
      'Partecipazione riconosciuta con priorità agli eventi della community',
      'Contributo al raggiungimento degli obiettivi civici condivisi',
    ],
    // Colori tema BLU / AZZURRO
    gradientHeader: 'linear-gradient(135deg, #0284c7 0%, #2563eb 50%, #1e40af 100%)',
    badgeRingColor: 'ring-sky-300/50',
    badgeBg: 'bg-white',
    badgeText: 'text-sky-950',
    accentPillBg: 'bg-sky-50 dark:bg-sky-950/60',
    accentPillBorder: 'border-sky-300 dark:border-sky-800',
    accentPillText: 'text-sky-900 dark:text-sky-300',
    buttonGradient: 'bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-blue-500 text-white',
    buttonShadow: 'shadow-sky-500/30',
    iconColor: 'text-sky-400',
    prossimoTraguardo: {
      nome: 'Pilastro',
      puntiMancanti: 80,
    },
  },
  'Pilastro': {
    badge: '🏛️',
    titoloCongratulazioni: 'Traguardo Straordinario!',
    sottotitolo: 'Sei diventato un Pilastro della Comunità',
    descrizione:
      'Un sincero ringraziamento per la tua straordinaria dedizione civica! Sei ormai un solido punto di riferimento per i vicini di Villaggio Prenestino, contribuendo attivamente alla cura e alla valorizzazione del quartiere.',
    privilegi: [
      'Distintivo onorario 🏛️ Pilastro in cima alla Classifica dei Cittadini Attivi',
      'Voce autorevole nelle consultazioni e proposte per il Municipio VI',
      'Riconoscimento speciale e ringraziamento pubblico nelle assemblee dell\'Associazione',
    ],
    // Colori tema ORO / AMBRA CALDA
    gradientHeader: 'linear-gradient(135deg, #d97706 0%, #b45309 50%, #78350f 100%)',
    badgeRingColor: 'ring-amber-300/50',
    badgeBg: 'bg-white',
    badgeText: 'text-amber-950',
    accentPillBg: 'bg-amber-50 dark:bg-amber-950/60',
    accentPillBorder: 'border-amber-300 dark:border-amber-800',
    accentPillText: 'text-amber-950 dark:text-amber-300',
    buttonGradient: 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black',
    buttonShadow: 'shadow-amber-500/30',
    iconColor: 'text-amber-300',
    prossimoTraguardo: {
      nome: 'Custode',
      puntiMancanti: 150,
    },
  },
  'Custode': {
    badge: '⭐',
    titoloCongratulazioni: 'Massima Onorificenza Civica!',
    sottotitolo: 'Sei il Custode di Villaggio Prenestino',
    descrizione:
      'Un traguardo storico ed esemplare! Hai ottenuto il massimo riconoscimento civico della nostra comunità. Il tuo impegno continuo è il cuore pulsante del quartiere e ispira tutti i cittadini a prendersene cura.',
    privilegi: [
      'Stella d’oro ⭐ Custode e primo piano assoluto nella Classifica Cittadini',
      'Massimo credito civico per il coordinamento delle iniziative di volontariato',
      'Attestato simbolico di benemerenza civica da parte dell’Associazione di Quartiere',
    ],
    // Colori tema BORDEAUX VILLAGGIO PRENESTINO / RUBINO (#781816)
    gradientHeader: 'linear-gradient(135deg, #781816 0%, #9f1239 50%, #4c0519 100%)',
    badgeRingColor: 'ring-rose-300/50',
    badgeBg: 'bg-white',
    badgeText: 'text-rose-950',
    accentPillBg: 'bg-rose-50 dark:bg-rose-950/60',
    accentPillBorder: 'border-rose-300 dark:border-rose-800',
    accentPillText: 'text-rose-950 dark:text-rose-300',
    buttonGradient: 'bg-gradient-to-r from-[#781816] via-rose-700 to-rose-600 hover:from-[#901d1a] hover:to-rose-500 text-white font-black',
    buttonShadow: 'shadow-rose-900/40',
    iconColor: 'text-rose-300',
  },
  'Nuovo Vicino': {
    badge: '🌱',
    titoloCongratulazioni: 'Benvenuto a Bordo!',
    sottotitolo: 'Hai iniziato il tuo cammino come Nuovo Vicino',
    descrizione:
      'Benvenuto nella nostra rete di vicinato attivo! Ogni tua segnalazione, adesione o proposta per il quartiere ti aiuterà ad accumulare punti civici e sbloccare nuovi livelli.',
    privilegi: [
      'Badge 🌱 Nuovo Vicino per iniziare a farti conoscere nella community',
      'Accesso completo a votazioni, segnalazioni con foto e richieste d’aiuto',
      'Accumulo punti immediato per ogni azione civica completata',
    ],
    // Colori tema SMERALDO / VERDE
    gradientHeader: 'linear-gradient(135deg, #059669 0%, #0d9488 50%, #064e3b 100%)',
    badgeRingColor: 'ring-emerald-300/50',
    badgeBg: 'bg-white',
    badgeText: 'text-emerald-950',
    accentPillBg: 'bg-emerald-50 dark:bg-emerald-950/60',
    accentPillBorder: 'border-emerald-300 dark:border-emerald-800',
    accentPillText: 'text-emerald-950 dark:text-emerald-300',
    buttonGradient: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-bold',
    buttonShadow: 'shadow-emerald-600/30',
    iconColor: 'text-emerald-300',
    prossimoTraguardo: {
      nome: 'Vicino Attivo',
      puntiMancanti: 30,
    },
  },
};

export const NuovoLivelloModal: React.FC<NuovoLivelloModalProps> = ({
  isOpen,
  onClose,
  livello,
  punti,
  darkMode = false,
}) => {
  // Gestione tasto Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cfg = LIVELLO_CONFIGS[livello] || LIVELLO_CONFIGS['Vicino Attivo'];
  const puntiMancantiAlProssimo = cfg.prossimoTraguardo
    ? Math.max(0, cfg.prossimoTraguardo.puntiMancanti - punti)
    : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="livello-modal-title"
    >
      {/* Scheda principale del popup: adatta i colori al livello sbloccato */}
      <div
        className={`relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border animate-scaleUp transition-colors ${
          darkMode
            ? 'bg-slate-900 border-slate-700 text-slate-100'
            : 'bg-white border-slate-100 text-slate-900'
        }`}
      >
        {/* Testata festosa con gradiente dinamico specifico del livello raggiunto */}
        <div
          className="relative p-6 pt-7 text-white text-center overflow-hidden"
          style={{ background: cfg.gradientHeader }}
        >
          {/* Cerchi decorativi sfumati */}
          <div className="absolute -top-12 -left-12 w-36 h-36 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-white/15 blur-xl pointer-events-none" />

          {/* Pulsante 'X' in alto a destra richiesto per chiudere il popup */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full flex items-center justify-center text-white/80 hover:text-white bg-black/20 hover:bg-black/35 active:scale-95 transition-all cursor-pointer z-10"
            aria-label="Chiudi popup"
            title="Chiudi congratulazioni"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Badge superiore con scintillio */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs border border-white/30 text-white text-[11px] font-black uppercase tracking-wider mb-3 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>Nuovo Livello Raggiunto!</span>
          </div>

          {/* Icona/Badge gigante del livello al centro con anello e animazione */}
          <div className="flex justify-center my-2">
            <div
              className={`w-20 h-20 rounded-3xl ${cfg.badgeBg} ${cfg.badgeText} flex items-center justify-center text-4xl shadow-xl ring-4 ${cfg.badgeRingColor} transform hover:rotate-6 transition-transform select-none`}
            >
              {cfg.badge}
            </div>
          </div>

          {/* Titoli festosi */}
          <h2
            id="livello-modal-title"
            className="text-xl sm:text-2xl font-black tracking-tight leading-tight mt-2 text-white"
          >
            {cfg.titoloCongratulazioni}
          </h2>
          <p className="text-sm font-extrabold text-white/95 mt-1">
            {cfg.sottotitolo}
          </p>

          {/* Pill con punteggio civico attuale */}
          <div className="mt-3 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/25 backdrop-blur-xs border border-white/25 text-xs font-bold text-white shadow-inner">
            <Award className="w-4 h-4 text-amber-300 shrink-0" />
            <span>
              Hai totalizzato <strong>{punti} Punti Civici</strong>
            </span>
          </div>
        </div>

        {/* Corpo informativo del pop up */}
        <div className="p-5 sm:p-6 space-y-4 text-left">
          {/* Messaggio personalizzato di congratulazioni */}
          <p
            className={`text-xs sm:text-sm leading-relaxed ${
              darkMode ? 'text-slate-300' : 'text-slate-700'
            }`}
          >
            {cfg.descrizione}
          </p>

          {/* Traguardi e vantaggi civici del nuovo livello */}
          <div
            className={`p-3.5 sm:p-4 rounded-2xl border space-y-2.5 ${cfg.accentPillBg} ${cfg.accentPillBorder}`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <h3 className={`text-xs font-black uppercase tracking-wider ${cfg.accentPillText}`}>
                Traguardi & Riconoscimenti Sbloccati
              </h3>
            </div>
            <ul className="space-y-1.5 text-xs font-medium">
              {cfg.privilegi.map((priv, idx) => (
                <li
                  key={idx}
                  className={`flex items-start gap-2 leading-snug ${
                    darkMode ? 'text-slate-200' : 'text-slate-800'
                  }`}
                >
                  <span className="text-amber-500 font-bold shrink-0 mt-0.5">•</span>
                  <span>{priv}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Prossimo traguardo (se applicabile) */}
          {cfg.prossimoTraguardo && puntiMancantiAlProssimo > 0 && (
            <div
              className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                darkMode
                  ? 'bg-slate-800/80 border-slate-700 text-slate-300'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <TrendingUp className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="truncate">
                  Prossimo livello: <strong>{cfg.prossimoTraguardo.nome}</strong>
                </span>
              </div>
              <span
                className={`font-black shrink-0 px-2 py-0.5 rounded-md text-[11px] ${
                  darkMode ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-900'
                }`}
              >
                -{puntiMancantiAlProssimo} pts
              </span>
            </div>
          )}

          {/* Bottone di chiusura coordinato ai colori del livello */}
          <div className="pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`w-full py-3 px-4 rounded-2xl text-xs sm:text-sm font-black active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${cfg.buttonGradient} ${cfg.buttonShadow}`}
            >
              <span>Continua a partecipare</span>
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
