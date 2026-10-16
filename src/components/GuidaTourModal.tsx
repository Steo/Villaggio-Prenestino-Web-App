import React, { useState, useEffect } from 'react';
import { 
  Store, 
  Camera, 
  HeartHandshake, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Sparkles, 
  CheckCircle2, 
  MapPin, 
  Tag, 
  MessageCircle, 
  ThumbsUp, 
  Award,
  HelpCircle
} from 'lucide-react';
import { TabType } from '../App';

interface GuidaTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: TabType) => void;
  onAddWelcomePoints?: () => void;
  darkMode?: boolean;
}

interface TourStep {
  id: string;
  tabTarget?: TabType;
  badge: string;
  badgeColor: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  highlights: {
    icon: React.ReactNode;
    title: string;
    desc: string;
  }[];
  actionLabel?: string;
}

export const GuidaTourModal: React.FC<GuidaTourModalProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onAddWelcomePoints,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const steps: TourStep[] = [
    {
      id: 'welcome',
      badge: 'Benvenuto a Villaggio Prenestino',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-700',
      title: 'La Web App del Tuo Quartiere',
      subtitle: 'Uno strumento civico semplice e veloce per partecipare attivamente, sostenere l\'economia locale e migliorare la vita quotidiana nella nostra comunità.',
      icon: <Sparkles className="w-8 h-8 text-amber-600 animate-pulse" />,
      iconBg: 'bg-amber-100 dark:bg-amber-950 border-amber-300 dark:border-amber-800 text-amber-800',
      highlights: [
        {
          icon: <Store className="w-4 h-4 text-amber-600" />,
          title: 'Commercianti & Attività a Km 0',
          desc: 'Mappa interattiva, offerte esclusive con l\'app e contatti WhatsApp diretti.',
        },
        {
          icon: <Camera className="w-4 h-4 text-emerald-600" />,
          title: 'Segnalazioni all\'Associazione',
          desc: 'Foto, geolocalizzazione e monitoraggio trasparente dei problemi urbani.',
        },
        {
          icon: <HeartHandshake className="w-4 h-4 text-indigo-600" />,
          title: 'Volontariato & Punti Civici',
          desc: 'Partecipa alle iniziative solidali e accumula punti per il tuo impegno.',
        },
      ],
      actionLabel: 'Inizia il Tour Guidato',
    },
    {
      id: 'commercio',
      tabTarget: 'commercio',
      badge: 'Tappa 1 di 3 · Economia di Prossimità',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-700',
      title: 'Sezione Commercianti',
      subtitle: 'Scopri e sostieni i negozi e gli artigiani di Villaggio Prenestino, visualizzando orari, promozioni e posizioni sulla mappa interattiva.',
      icon: <Store className="w-8 h-8 text-amber-600" />,
      iconBg: 'bg-amber-100 dark:bg-amber-950 border-amber-300 dark:border-amber-800 text-amber-800',
      highlights: [
        {
          icon: <MapPin className="w-4 h-4 text-amber-600" />,
          title: 'Mappa & Filtri Categoria a Colori',
          desc: 'Alimentari, Bar & Cucina, Farmacia & Salute, Artigiani & Servizi, Casa.',
        },
        {
          icon: <Tag className="w-4 h-4 text-amber-600" />,
          title: 'Offerte Esclusive per Chi Mostra l\'App',
          desc: 'Sconti e promozioni riservate ai residenti mostrando la Web App in negozio.',
        },
        {
          icon: <MessageCircle className="w-4 h-4 text-emerald-600" />,
          title: 'Ordini & Contatti WhatsApp',
          desc: 'Invia messaggi diretti per prenotare o richiedere informazioni ai negozianti.',
        },
        {
          icon: <ThumbsUp className="w-4 h-4 text-[#781816]" />,
          title: 'Tasto "Mi piace" & Consigli',
          desc: 'Esprimi il tuo gradimento (+2 punti civici) e premia le attività migliori.',
        },
      ],
      actionLabel: 'Vai alla scheda Segnalazioni',
    },
    {
      id: 'segnalazioni',
      tabTarget: 'segnalazioni',
      badge: 'Tappa 2 di 3 · Partecipazione Attiva',
      badgeColor: 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-700',
      title: 'Sezione Segnalazioni',
      subtitle: 'Segnala disservizi, buche stradali, illuminazione o degrado urbano direttamente all\'Associazione di Quartiere con tracciamento trasparente.',
      icon: <Camera className="w-8 h-8 text-rose-600" />,
      iconBg: 'bg-rose-100 dark:bg-rose-950 border-rose-300 dark:border-rose-800 text-rose-800',
      highlights: [
        {
          icon: <Camera className="w-4 h-4 text-rose-600" />,
          title: 'Foto & Localizzazione GPS',
          desc: 'Allega una foto dal cellulare e rileva automaticamente l\'indirizzo della segnalazione.',
        },
        {
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
          title: 'Iter Trasparente in 3 Fasi',
          desc: 'Monitora la presa in carico: Inviata → Presa in carico dall\'Associazione → Risolta.',
        },
        {
          icon: <Award className="w-4 h-4 text-amber-600" />,
          title: 'Guadagna Punti per la Comunità',
          desc: 'Ogni segnalazione verificata assegna Punti Civici per valorizzare il tuo contributo.',
        },
      ],
      actionLabel: 'Vai alla scheda Volontariato',
    },
    {
      id: 'volontariato',
      tabTarget: 'volontariato',
      badge: 'Tappa 3 di 3 · Solidarietà & Territorio',
      badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-200 dark:border-indigo-700',
      title: 'Sezione Volontariato',
      subtitle: 'Partecipa alle iniziative civiche per la cura del verde, l\'assistenza ai vicini e l\'organizzazione degli eventi di Villaggio Prenestino.',
      icon: <HeartHandshake className="w-8 h-8 text-indigo-600" />,
      iconBg: 'bg-indigo-100 dark:bg-indigo-950 border-indigo-300 dark:border-indigo-800 text-indigo-800',
      highlights: [
        {
          icon: <HeartHandshake className="w-4 h-4 text-indigo-600" />,
          title: 'Bandi Civici & Raccolta Adesioni',
          desc: 'Visualizza quante persone servono e tocca "Ci sono anch\'io!" per partecipare.',
        },
        {
          icon: <Award className="w-4 h-4 text-amber-600" />,
          title: 'Sistema Punti Civici & Livelli',
          desc: 'Sali di livello da "Nuovo Vicino" fino a "Custode del Quartiere".',
        },
        {
          icon: <Sparkles className="w-4 h-4 text-amber-600" />,
          title: 'Candidatura Volontario',
          desc: 'Metti a disposizione il tuo tempo e le tue competenze per il bene comune.',
        },
      ],
      actionLabel: 'Concludi la Guida',
    },
    {
      id: 'finish',
      badge: 'Tour Completato 🎉',
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-700',
      title: 'Sei Pronto a Vivere il Quartiere!',
      subtitle: 'Ora hai tutti gli strumenti per utilizzare al meglio l\'app. Potrai riaprire questo tour in qualsiasi momento cliccando sull\'icona ? in alto.',
      icon: <Award className="w-9 h-9 text-emerald-600" />,
      iconBg: 'bg-emerald-100 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-800 text-emerald-800',
      highlights: [
        {
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
          title: 'Navigazione rapida',
          desc: 'Usa la barra in basso per passare rapidamente tra Home, Eventi, Commercianti, Segnalazioni e Volontariato.',
        },
        {
          icon: <Sparkles className="w-4 h-4 text-amber-500" />,
          title: 'Bonus di Benvenuto',
          desc: 'Hai ricevuto i primi Punti Civici di benvenuto nel tuo profilo!',
        },
      ],
      actionLabel: 'Inizia a Esplorare l\'App',
    },
  ];

  // Seleziona la tab associata alla tappa in background
  useEffect(() => {
    if (isOpen) {
      const step = steps[currentStepIndex];
      if (step?.tabTarget) {
        onSelectTab(step.tabTarget);
      }
    }
  }, [currentStepIndex, isOpen]);

  // Gestione tastiera (Esc per chiudere, Frecce per scorrere)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleFinish();
      } else if (e.key === 'ArrowRight' && currentStepIndex < steps.length - 1) {
        handleNext();
      } else if (e.key === 'ArrowLeft' && currentStepIndex > 0) {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex]);

  if (!isOpen) return null;

  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleFinish = () => {
    if (onAddWelcomePoints) {
      onAddWelcomePoints();
    }
    try {
      localStorage.setItem('vp_tour_completato', 'true');
    } catch {
      // ignore
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4 my-auto relative animate-scaleUp text-slate-900 dark:text-white"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-modal-title"
      >
        {/* Tasto Chiudi / Salta Tour sempre accessibile in alto a destra */}
        <button
          type="button"
          onClick={handleFinish}
          className="absolute top-4 right-4 p-2 rounded-2xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer z-10"
          aria-label="Chiudi guida"
          title="Salta o chiudi il tour"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Intestazione Tappa con Icona e Badge */}
        <div className="flex items-start gap-3.5 pr-8">
          <div className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center shrink-0 shadow-sm ${currentStep.iconBg}`}>
            {currentStep.icon}
          </div>
          <div className="space-y-1">
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider border ${currentStep.badgeColor}`}>
              {currentStep.badge}
            </span>
            <h3 id="tour-modal-title" className="text-lg sm:text-xl font-black leading-tight">
              {currentStep.title}
            </h3>
          </div>
        </div>

        {/* Sottotitolo descrittivo */}
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {currentStep.subtitle}
        </p>

        {/* Punti Chiave della Sezione */}
        <div className="space-y-2 py-1">
          {currentStep.highlights.map((item, idx) => (
            <div 
              key={idx}
              className="p-2.5 sm:p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-2.5"
            >
              <div className="p-1.5 rounded-xl bg-white dark:bg-slate-900 shadow-xs shrink-0 mt-0.5 border border-slate-200 dark:border-slate-700">
                {item.icon}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  {item.title}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Indicatori di Avanzamento (Punti Progress) */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            {steps.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setCurrentStepIndex(index)}
                aria-label={`Vai al passaggio ${index + 1}`}
                className={`h-2 rounded-full transition-all duration-200 cursor-pointer ${
                  currentStepIndex === index
                    ? 'w-6 bg-[#781816] dark:bg-amber-400'
                    : 'w-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300'
                }`}
              />
            ))}
          </div>

          <span className="text-[11px] font-bold text-slate-400">
            {currentStepIndex + 1} di {steps.length}
          </span>
        </div>

        {/* Pulsanti di Azione e Navigazione */}
        <div className="flex items-center justify-between gap-2.5 pt-1">
          {!isFirstStep ? (
            <button
              type="button"
              onClick={handlePrev}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Indietro</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition py-2 px-1 cursor-pointer"
            >
              Salta tour
            </button>
          )}

          <div className="flex items-center gap-2">
            {!isLastStep && (
              <button
                type="button"
                onClick={handleFinish}
                className="hidden sm:inline-block text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition px-2 py-2 cursor-pointer"
              >
                Chiudi
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2.5 bg-[#781816] hover:bg-[#5a1210] active:scale-95 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>{isLastStep ? 'Inizia a Esplorare' : (currentStep.actionLabel || 'Avanti')}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
