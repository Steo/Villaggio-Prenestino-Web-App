import React, { useEffect } from 'react';
import {
  Award,
  X,
  Sparkles,
  HeartHandshake,
  UserCheck,
  Camera,
  Lightbulb,
  CalendarCheck,
  ThumbsUp,
  Gift,
  Shield,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';

interface PuntiCiviciModalProps {
  isOpen: boolean;
  onClose: () => void;
  puntiCivici: number;
  darkMode?: boolean;
  onPreviewLevel?: (livello: 'Nuovo Vicino' | 'Vicino Attivo' | 'Pilastro' | 'Custode') => void;
}

interface LivelloInfo {
  nome: string;
  min: number;
  max: number | null;
  descrizione: string;
  badge: string;
  badgeBg: string;
  cardBorder: string;
  cardBg: string;
}

const LIVELLI: LivelloInfo[] = [
  {
    nome: 'Nuovo Vicino',
    min: 0,
    max: 29,
    descrizione: 'Hai appena mosso i primi passi nella comunità di quartiere.',
    badge: '🌱',
    badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800',
    cardBorder: 'border-emerald-300 dark:border-emerald-800',
    cardBg: 'bg-emerald-50/90 dark:bg-emerald-950/30',
  },
  {
    nome: 'Vicino Attivo',
    min: 30,
    max: 79,
    descrizione: 'Partecipi con regolarità a segnalazioni, votazioni o eventi.',
    badge: '🤝',
    badgeBg: 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800',
    cardBorder: 'border-blue-300 dark:border-blue-800',
    cardBg: 'bg-blue-50/90 dark:bg-blue-950/30',
  },
  {
    nome: 'Pilastro',
    min: 80,
    max: 149,
    descrizione: 'Un punto di riferimento costante per la cura di Villaggio Prenestino.',
    badge: '🏛️',
    badgeBg: 'bg-amber-100 text-amber-950 border-amber-400 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800',
    cardBorder: 'border-amber-400 dark:border-amber-800',
    cardBg: 'bg-amber-50/95 dark:bg-amber-950/30',
  },
  {
    nome: 'Custode',
    min: 150,
    max: null,
    descrizione: 'Massima onorificenza civica: dedizione esemplare alla comunità.',
    badge: '⭐',
    badgeBg: 'bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800',
    cardBorder: 'border-rose-300 dark:border-rose-800',
    cardBg: 'bg-rose-50/90 dark:bg-rose-950/30',
  },
];

const ATTIVITA = [
  {
    icon: UserCheck,
    titolo: 'Candidatura Volontario',
    descrizione: 'Iscriviti all’albo volontari dell’Associazione',
    punti: '+15',
    tag: 'Una tantum',
  },
  {
    icon: HeartHandshake,
    titolo: 'Adesione a "Serve una mano"',
    descrizione: 'Offri il tuo supporto per richieste concrete',
    punti: '+10',
    tag: 'Per adesione',
  },
  {
    icon: Camera,
    titolo: 'Invio Segnalazione con foto',
    descrizione: 'Segnala buche, guasti o pericoli stradali',
    punti: '+5',
    tag: 'Per segnalazione',
  },
  {
    icon: Lightbulb,
    titolo: 'Proposta di una nuova Idea',
    descrizione: 'Condividi un progetto migliorativo',
    punti: '+5',
    tag: 'Per idea',
  },
  {
    icon: CalendarCheck,
    titolo: 'Partecipazione a un Evento',
    descrizione: 'Unisciti a giornate civiche e iniziative',
    punti: '+5',
    tag: 'Per evento',
  },
  {
    icon: ThumbsUp,
    titolo: 'Voto a un’idea o proposta',
    descrizione: 'Sostieni le proposte dei tuoi vicini',
    punti: '+2',
    tag: 'Per voto',
  },
  {
    icon: Gift,
    titolo: 'Bonus di Benvenuto',
    descrizione: 'Assegnato al primo accesso all’app',
    punti: '15',
    tag: 'Iniziali',
  },
];

export const PuntiCiviciModal: React.FC<PuntiCiviciModalProps> = ({
  isOpen,
  onClose,
  puntiCivici,
  darkMode = false,
  onPreviewLevel,
}) => {
  // Chiudi con il tasto ESC
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Calcolo livello attuale
  const currentLivelloIndex = LIVELLI.findIndex((liv) => {
    if (liv.max === null) return puntiCivici >= liv.min;
    return puntiCivici >= liv.min && puntiCivici <= liv.max;
  });
  const livelloAttuale = LIVELLI[currentLivelloIndex] || LIVELLI[0];
  const prossimoLivello = currentLivelloIndex < LIVELLI.length - 1 ? LIVELLI[currentLivelloIndex + 1] : null;

  const puntiMancanti = prossimoLivello ? Math.max(0, prossimoLivello.min - puntiCivici) : 0;
  const progressPercent = prossimoLivello
    ? Math.min(100, Math.max(0, Math.round(((puntiCivici - livelloAttuale.min) / (prossimoLivello.min - livelloAttuale.min)) * 100)))
    : 100;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs transition-opacity animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="punti-modal-title"
    >
      <div
        className={`relative w-full max-w-lg max-h-[92vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden border ${
          darkMode
            ? 'bg-slate-900 text-slate-100 border-slate-700'
            : 'bg-white text-slate-950 border-slate-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con gradiente rosso bordeaux coordinato al quartiere */}
        <div
          className="p-5 text-white relative shrink-0 shadow-md"
          style={{
            background: 'linear-gradient(135deg, #781816 0%, #a32420 50%, #5a1210 100%)',
          }}
        >
          {/* Tasto chiudi */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-white hover:bg-black/25 active:scale-95 transition cursor-pointer"
            aria-label="Chiudi popup"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* Badge superiore */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black uppercase tracking-wider mb-2.5 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-slate-950" />
            <span>Sistema Punti Civici</span>
          </div>

          <h2 id="punti-modal-title" className="text-xl sm:text-2xl font-black tracking-tight leading-tight text-white">
            Come funzionano i Punti Civici
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-white font-medium leading-relaxed">
            Premiano la partecipazione e l'impegno per migliorare insieme Villaggio Prenestino.
          </p>

          {/* Box Stato Utente Attuale */}
          <div className="mt-4 p-3.5 rounded-2xl bg-black/35 border border-white/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex flex-col items-center justify-center font-black shadow-md shrink-0">
                <span className="text-xl leading-none font-black">{puntiCivici}</span>
                <span className="text-[9px] uppercase tracking-wider font-extrabold leading-none mt-0.5">Punti</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg leading-none">{livelloAttuale.badge}</span>
                  <span className="text-sm font-extrabold text-amber-300">
                    Livello: {livelloAttuale.nome}
                  </span>
                </div>
                <p className="text-xs text-white font-normal mt-0.5 leading-snug">
                  {livelloAttuale.descrizione}
                </p>
              </div>
            </div>

            {prossimoLivello ? (
              <div className="text-left sm:text-right text-xs shrink-0 bg-white/15 sm:bg-black/25 px-3 py-2 rounded-xl border border-white/15">
                <div className="text-xs text-white font-medium">
                  Mancano <strong className="text-amber-300 font-black">{puntiMancanti} pts</strong> a
                </div>
                <div className="font-extrabold text-white text-xs mt-0.5">
                  {prossimoLivello.badge} {prossimoLivello.nome}
                </div>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 text-xs font-black">
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                <span>Massimo livello raggiunto!</span>
              </div>
            )}
          </div>

          {/* Barra di avanzamento al prossimo livello */}
          {prossimoLivello && (
            <div className="mt-3">
              <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden border border-white/20">
                <div
                  className="bg-amber-400 h-2 rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Corpo scrollabile del popup: sfondo chiaro in giorno (bg-white), scuro solo se darkMode */}
        <div
          className={`p-4 sm:p-5 overflow-y-auto space-y-5 text-sm ${
            darkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-950'
          }`}
        >
          {/* Sezione: Come guadagnare punti */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                  darkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-800'
                }`}
              >
                <Award className="w-4 h-4" />
              </div>
              <h3
                className={`font-extrabold text-xs sm:text-sm tracking-wide uppercase ${
                  darkMode ? 'text-white' : 'text-slate-950'
                }`}
              >
                Come accumulare punti civici
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {ATTIVITA.map((att, idx) => {
                const IconComponent = att.icon;
                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between gap-3 p-3 rounded-2xl border transition-colors shadow-2xs ${
                      darkMode
                        ? 'bg-slate-800/90 border-slate-700 hover:bg-slate-800'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                          darkMode
                            ? 'bg-amber-950/70 text-amber-300 border-amber-800'
                            : 'bg-amber-100 text-amber-900 border-amber-300'
                        }`}
                      >
                        <IconComponent className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <div
                          className={`font-bold text-sm leading-snug ${
                            darkMode ? 'text-white' : 'text-slate-950'
                          }`}
                        >
                          {att.titolo}
                        </div>
                        <div
                          className={`text-xs leading-normal mt-0.5 ${
                            darkMode ? 'text-slate-300' : 'text-slate-700'
                          }`}
                        >
                          {att.descrizione}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-black text-xs shadow-2xs">
                        {att.punti} pts
                      </span>
                      <div
                        className={`text-[11px] font-semibold mt-0.5 ${
                          darkMode ? 'text-slate-400' : 'text-slate-600'
                        }`}
                      >
                        {att.tag}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Sezione: I Livelli Civici con testo nitido e scuro in modalità giorno */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                  darkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-800'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
              </div>
              <h3
                className={`font-extrabold text-xs sm:text-sm tracking-wide uppercase ${
                  darkMode ? 'text-white' : 'text-slate-950'
                }`}
              >
                I Livelli della Community
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {LIVELLI.map((liv, idx) => {
                const isCurrent = liv.nome === livelloAttuale.nome;
                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-2xl border transition relative shadow-2xs ${liv.cardBg} ${liv.cardBorder} ${
                      isCurrent
                        ? darkMode
                          ? 'ring-2 ring-amber-400 shadow-sm'
                          : 'ring-2 ring-amber-500 shadow-sm'
                        : ''
                    }`}
                  >
                    {isCurrent && (
                      <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-2xs">
                        Tuo livello
                      </span>
                    )}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl leading-none">{liv.badge}</span>
                        <div>
                          <div
                            className={`font-extrabold text-sm ${
                              darkMode ? 'text-white' : 'text-slate-950'
                            }`}
                          >
                            {liv.nome}
                          </div>
                          <div className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold mt-0.5 border ${liv.badgeBg}`}>
                            {liv.max === null ? `${liv.min}+ punti` : `${liv.min} - ${liv.max} punti`}
                          </div>
                        </div>
                      </div>

                      {onPreviewLevel && (
                        <button
                          type="button"
                          onClick={() => onPreviewLevel(liv.nome as any)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer shrink-0 border ${
                            darkMode
                              ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs'
                          }`}
                          title={`Visualizza popup congratulazioni per il livello ${liv.nome}`}
                        >
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          <span>Vedi popup</span>
                        </button>
                      )}
                    </div>
                    <p
                      className={`mt-2 text-xs leading-relaxed font-medium ${
                        darkMode ? 'text-slate-200' : 'text-slate-800'
                      }`}
                    >
                      {liv.descrizione}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Nota chiarimento e spirito civico */}
          <div
            className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
              darkMode
                ? 'border-amber-750 bg-amber-950/30'
                : 'border-amber-300 bg-amber-50/90'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                darkMode
                  ? 'bg-amber-900/60 text-amber-200'
                  : 'bg-amber-200 text-amber-950'
              }`}
            >
              <Shield className="w-4 h-4" />
            </div>
            <p
              className={`text-xs font-medium leading-relaxed ${
                darkMode ? 'text-amber-100' : 'text-slate-800'
              }`}
            >
              <strong className={darkMode ? 'text-white font-bold' : 'text-slate-950 font-bold'}>
                Nota civica:
              </strong>{' '}
              I punti civici sono un riconoscimento simbolico per premiare la partecipazione attiva e la cura del nostro quartiere. Non hanno valore monetario né fini commerciali.
            </p>
          </div>
        </div>

        {/* Footer con pulsante di chiusura ad alto contrasto */}
        <div
          className={`p-3.5 sm:p-4 border-t shrink-0 flex items-center justify-end ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs active:scale-95 transition shadow-sm cursor-pointer text-center ${
              darkMode
                ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                : 'bg-[#781816] hover:bg-[#601311] text-white shadow-xs'
            }`}
          >
            Ho capito, chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
