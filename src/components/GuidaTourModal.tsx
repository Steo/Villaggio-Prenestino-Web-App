import React, { useState, useEffect } from 'react';
import { 
  Home,
  Calendar,
  Store, 
  Camera, 
  HeartHandshake, 
  Lightbulb,
  Search,
  WifiOff,
  Smartphone,
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
  Bell,
  Clock,
  Compass
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
  shortLabel: string;
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
    tag?: string;
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
      shortLabel: 'Inizio',
      badge: 'Benvenuto a Villaggio Prenestino',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-700',
      title: 'Il Portale Civico del Tuo Quartiere',
      subtitle: 'La piattaforma digitale pensata per i residenti di Villaggio Prenestino: resta informato, sostieni le attività commerciali a Km 0 e partecipa attivamente alla vita comunitaria.',
      icon: <Sparkles className="w-8 h-8 text-amber-600 dark:text-amber-400 animate-pulse" />,
      iconBg: 'bg-amber-100 dark:bg-amber-950/80 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300',
      highlights: [
        {
          icon: <Home className="w-4 h-4 text-[#781816] dark:text-rose-400" />,
          title: 'Bacheca & Notizie Verificate',
          desc: 'Comunicazioni ufficiali del Comitato di Quartiere, numeri utili d\'emergenza e avvisi.',
          tag: 'Informazione'
        },
        {
          icon: <Store className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
          title: 'Commercio & Servizi di Prossimità',
          desc: 'Mappa GPS interattiva dei negozi, orari settimanali aggiornati, promozioni e WhatsApp diretto.',
          tag: 'Km 0'
        },
        {
          icon: <Camera className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
          title: 'Segnalazioni & Democrazia Partecipata',
          desc: 'Segnala buche o disservizi con foto, proponi idee per il bilancio di quartiere e fai volontariato.',
          tag: 'Partecipazione'
        },
      ],
      actionLabel: 'Inizia il Tour Guidato',
    },
    {
      id: 'home',
      shortLabel: 'Home',
      tabTarget: 'home',
      badge: 'Tappa 1 di 7 · Notizie & Servizi',
      badgeColor: 'bg-rose-100 text-[#781816] border-rose-300 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-700',
      title: 'Sezione Home: La Voce del Quartiere',
      subtitle: 'Il punto di partenza quotidiano con gli annunci dell\'Associazione, i contatti d\'emergenza e la classifica dei residenti più attivi.',
      icon: <Home className="w-8 h-8 text-[#781816] dark:text-rose-400" />,
      iconBg: 'bg-rose-100 dark:bg-rose-950/80 border-rose-300 dark:border-rose-700 text-[#781816] dark:text-rose-300',
      highlights: [
        {
          icon: <Bell className="w-4 h-4 text-[#781816] dark:text-rose-400" />,
          title: 'Notizie & Comunicati Ufficiali',
          desc: 'Aggiornamenti in tempo reale su trasporti, viabilità, lavori stradali e iniziative del CdQ.',
        },
        {
          icon: <Compass className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />,
          title: 'Numeri Utili per Emergenze',
          desc: 'Farmacia di turno, Polizia Locale Municipio VI, Pronto Soccorso e Carabinieri a portata di tocco.',
        },
        {
          icon: <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
          title: 'Punti Civici & Livelli Comunitari',
          desc: 'Accumula punti per ogni contributo civico e scala i livelli, da "Nuovo Vicino" a "Custode del Quartiere".',
        },
      ],
      actionLabel: 'Vai alla scheda Eventi',
    },
    {
      id: 'eventi',
      shortLabel: 'Eventi',
      tabTarget: 'eventi',
      badge: 'Tappa 2 di 7 · Comunità & Iniziative',
      badgeColor: 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/80 dark:text-blue-200 dark:border-blue-700',
      title: 'Sezione Eventi: Vivi il Tuo Quartiere',
      subtitle: 'Calendario sempre aggiornato con le feste di piazza, le assemblee civiche, i mercatini e le giornate ecologiche.',
      icon: <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400" />,
      iconBg: 'bg-blue-100 dark:bg-blue-950/80 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300',
      highlights: [
        {
          icon: <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
          title: 'Programma & Dettagli Luogo',
          desc: 'Data, ora, indirizzo esatto con navigatore e mappa per non perdere nessun appuntamento.',
        },
        {
          icon: <ThumbsUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
          title: 'Partecipazione con un Clic ("Ci sarò!")',
          desc: 'Conferma la presenza per aiutare gli organizzatori a gestire gli spazi e guadagna +3 Punti Civici.',
        },
        {
          icon: <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
          title: 'Notifiche Automatiche',
          desc: 'Ricevi un avviso sul tuo dispositivo quando si avvicina un evento a cui hai aderito.',
        },
      ],
      actionLabel: 'Vai alla scheda Negozi',
    },
    {
      id: 'commercio',
      shortLabel: 'Negozi',
      tabTarget: 'commercio',
      badge: 'Tappa 3 di 7 · Economia di Prossimità',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-700',
      title: 'Sezione Negozi & Commercio Locale',
      subtitle: 'La mappa dei commercianti, artigiani e botteghe di Villaggio Prenestino con orari settimanali precisi, promozioni e contatti WhatsApp.',
      icon: <Store className="w-8 h-8 text-amber-600 dark:text-amber-400" />,
      iconBg: 'bg-amber-100 dark:bg-amber-950/80 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300',
      highlights: [
        {
          icon: <MapPin className="w-4 h-4 text-rose-600 dark:text-rose-400" />,
          title: 'Mappa Google Maps & Categorie a Colori',
          desc: 'Filtra facilmente tra Alimentari, Bar & Ristoranti, Farmacie, Servizi & Artigiani, Casa.',
        },
        {
          icon: <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
          title: 'Orari Dettagliati & Eccezioni Giornaliere',
          desc: 'Verifica subito se l\'attività è aperta adesso, con orari per ciascun giorno e chiusure straordinarie.',
        },
        {
          icon: <Tag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
          title: 'Sconti Esclusivi con l\'App & Ordini WhatsApp',
          desc: 'Offerte speciali per i residenti mostrando l\'app e messaggi WhatsApp con un solo tocco.',
        },
        {
          icon: <Store className="w-4 h-4 text-[#781816] dark:text-amber-400" />,
          title: 'Sei un Commerciante? Iscrivi il Tuo Negozio',
          desc: 'I commercianti possono inserire la propria attività e gestire autonomamente orari e promozioni con un PIN.',
        },
      ],
      actionLabel: 'Vai alla scheda Segnalazioni',
    },
    {
      id: 'segnalazioni',
      shortLabel: 'Segnala',
      tabTarget: 'segnalazioni',
      badge: 'Tappa 4 di 7 · Decoro & Territorio',
      badgeColor: 'bg-red-100 text-red-900 border-red-300 dark:bg-red-950/80 dark:text-red-200 dark:border-red-700',
      title: 'Sezione Segnalazioni Civiche',
      subtitle: 'Invia segnalazioni su buche stradali, illuminazione guasta, perdite d\'acqua o degrado urbano direttamente al Comitato di Quartiere.',
      icon: <Camera className="w-8 h-8 text-red-600 dark:text-red-400" />,
      iconBg: 'bg-red-100 dark:bg-red-950/80 border-red-300 dark:border-red-700 text-red-800 dark:text-red-300',
      highlights: [
        {
          icon: <Camera className="w-4 h-4 text-red-600 dark:text-red-400" />,
          title: 'Foto & Rilevamento GPS Automatico',
          desc: 'Scatta una foto dal telefono: l\'app compilerà via e coordinate GPS per localizzare con precisione il problema.',
        },
        {
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
          title: 'Tracciamento Trasparente in 3 Stati',
          desc: 'Monitora il percorso: Inviata → Presa in carico dall\'Associazione / Municipio VI → Risolta.',
        },
        {
          icon: <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
          title: 'Contributo Premiato',
          desc: 'Ogni segnalazione approvata aggiunge +5 Punti Civici al tuo profilo civico.',
        },
      ],
      actionLabel: 'Vai alla scheda Volontariato',
    },
    {
      id: 'volontariato',
      shortLabel: 'Volontari',
      tabTarget: 'volontariato',
      badge: 'Tappa 5 di 7 · Solidarietà Civica',
      badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-300 dark:bg-indigo-950/80 dark:text-indigo-200 dark:border-indigo-700',
      title: 'Sezione Volontariato: "Serve una mano"',
      subtitle: 'Unisciti ai progetti di cura del verde pubblico, assistenza ai vicini in difficoltà o supporto nell\'organizzazione delle iniziative.',
      icon: <HeartHandshake className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />,
      iconBg: 'bg-indigo-100 dark:bg-indigo-950/80 border-indigo-300 dark:border-indigo-700 text-indigo-800 dark:text-indigo-300',
      highlights: [
        {
          icon: <HeartHandshake className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />,
          title: 'Appelli & Obiettivi Partecipativi',
          desc: 'Visualizza quante persone servono (es. "3 volontari su 5") e offri la tua disponibilità.',
        },
        {
          icon: <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
          title: 'Albo dei Volontari di Quartiere',
          desc: 'Compila la candidatura indicando le tue competenze (giardinaggio, supporto informatico, artigianato).',
        },
        {
          icon: <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
          title: '+10 Punti per Ogni Intervento',
          desc: 'Il tuo tempo dedicato alla comunità riceve il massimo riconoscimento civico.',
        },
      ],
      actionLabel: 'Vai alla scheda Idee & Proposte',
    },
    {
      id: 'proposte',
      shortLabel: 'Idee',
      tabTarget: 'proposte',
      badge: 'Tappa 6 di 7 · Democrazia Partecipata',
      badgeColor: 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/80 dark:text-purple-200 dark:border-purple-700',
      title: 'Sezione Idee: Bilancio Partecipativo',
      subtitle: 'Invia le tue proposte per migliorare Villaggio Prenestino e vota le idee presentate dagli altri residenti per trasformarle in progetti concreti.',
      icon: <Lightbulb className="w-8 h-8 text-purple-600 dark:text-purple-400" />,
      iconBg: 'bg-purple-100 dark:bg-purple-950/80 border-purple-300 dark:border-purple-700 text-purple-800 dark:text-purple-300',
      highlights: [
        {
          icon: <Lightbulb className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
          title: 'Proponi un\'Iniziativa',
          desc: 'Piste ciclabili, nuove panchine, aree cani, alberature o sicurezza pedonale: ogni idea conta.',
        },
        {
          icon: <ThumbsUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
          title: 'Votazione Democratica ("Mi piace")',
          desc: 'Esprimi il tuo voto (+2 punti civici) per dare visibilità alle proposte più urgenti.',
        },
        {
          icon: <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
          title: 'Dialogo con le Istituzioni',
          desc: 'Le idee con più consensi vengono portate dal CdQ ai tavoli tecnici del Municipio VI.',
        },
      ],
      actionLabel: 'Funzionalità Smart & Offline',
    },
    {
      id: 'smart-features',
      shortLabel: 'Extra',
      badge: 'Tappa 7 di 7 · Strumenti Intelligenti',
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-700',
      title: 'Ricerca Universale, Notifiche & Offline',
      subtitle: 'L\'app è progettata come una Progressive Web App (PWA) moderna, veloce e utilizzabile anche senza rete internet.',
      icon: <Smartphone className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />,
      iconBg: 'bg-emerald-100 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300',
      highlights: [
        {
          icon: <Search className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
          title: 'Ricerca Globale Rapida (Ctrl+K)',
          desc: 'Tocca l\'icona lente nella barra superiore o premi Ctrl+K per trovare all\'istante notizie, negozi ed eventi.',
        },
        {
          icon: <WifiOff className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
          title: 'Modalità Offline con Sincronizzazione',
          desc: 'Puoi inviare segnalazioni e voti anche se perdi la connessione: verranno spediti appena torna la rete.',
        },
        {
          icon: <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
          title: 'Installabile come App Mobile',
          desc: 'Tocca "Aggiungi a schermata Home" nel browser per usarla a tutto schermo senza barre d\'indirizzo.',
        },
      ],
      actionLabel: 'Completa il Tour',
    },
    {
      id: 'finish',
      shortLabel: 'Fine 🎉',
      badge: 'Tour Concluso con Successo!',
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-700',
      title: 'Tutto Pronto! Benvenuto a Bordo',
      subtitle: 'Ora hai tutte le informazioni per vivere al meglio Villaggio Prenestino. Per festeggiare il tuo arrivo, abbiamo accreditato un bonus di benvenuto nel tuo profilo!',
      icon: <Award className="w-9 h-9 text-amber-500 animate-bounce" />,
      iconBg: 'bg-amber-100 dark:bg-amber-950/80 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300',
      highlights: [
        {
          icon: <Sparkles className="w-4 h-4 text-amber-500" />,
          title: '+10 Punti Civici di Benvenuto Assegnati',
          desc: 'Il tuo punteggio è già attivo: consultalo toccando la medaglia d\'oro in alto a destra.',
        },
        {
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
          title: 'Riapri la Guida in Qualsiasi Momento',
          desc: 'Se hai dubbi, tocca l\'icona con il punto interrogativo (?) nella testata dell\'app.',
        },
      ],
      actionLabel: 'Inizia a Esplorare l\'App',
    },
  ];

  // Seleziona la tab associata alla tappa in background per mostrare il contesto reale all'utente
  useEffect(() => {
    if (isOpen) {
      const step = steps[currentStepIndex];
      if (step?.tabTarget) {
        onSelectTab(step.tabTarget);
      }
    }
  }, [currentStepIndex, isOpen]);

  // Gestione tastiera (Esc per chiudere, Frecce sinistra/destra per scorrere i passaggi)
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

  const progressPercent = Math.round(((currentStepIndex + 1) / steps.length) * 100);

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn"
      style={{ animationDuration: '200ms' }}
    >
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4 my-auto relative animate-scaleUp text-slate-900 dark:text-white"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-modal-title"
      >
        {/* Barra di avanzamento superiore */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-t-3xl overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#781816] via-amber-500 to-emerald-500 transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Tasto Chiudi / Salta Tour sempre accessibile in alto a destra */}
        <button
          type="button"
          onClick={handleFinish}
          className="absolute top-4 right-4 p-2 rounded-2xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition cursor-pointer z-10 focus:outline-none focus:ring-2 focus:ring-[#781816]/50"
          aria-label="Chiudi guida"
          title="Salta o chiudi il tour"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Barra di navigazione rapida tra passaggi (Tabs pillole scorrevoli) */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 pt-1 no-scrollbar border-b border-slate-100 dark:border-slate-800/80 -mx-1 px-1">
          {steps.map((st, idx) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setCurrentStepIndex(idx)}
              aria-label={`Passa a ${st.shortLabel}`}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-tight whitespace-nowrap transition cursor-pointer ${
                currentStepIndex === idx
                  ? 'bg-[#781816] text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {st.shortLabel}
            </button>
          ))}
        </div>

        {/* Intestazione Tappa con Icona e Badge */}
        <div className="flex items-start gap-3.5 pr-8 pt-1">
          <div className={`w-13 h-13 sm:w-14 sm:h-14 rounded-2xl border-2 flex items-center justify-center shrink-0 shadow-sm ${currentStep.iconBg}`}>
            {currentStep.icon}
          </div>
          <div className="space-y-1 min-w-0">
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-wider border ${currentStep.badgeColor}`}>
              {currentStep.badge}
            </span>
            <h3 id="tour-modal-title" className="text-lg sm:text-xl font-black leading-tight text-slate-900 dark:text-white">
              {currentStep.title}
            </h3>
          </div>
        </div>

        {/* Sottotitolo descrittivo */}
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {currentStep.subtitle}
        </p>

        {/* Punti Chiave della Sezione */}
        <div className="space-y-2 py-1 max-h-[38vh] overflow-y-auto pr-1">
          {currentStep.highlights.map((item, idx) => (
            <div 
              key={idx}
              className="p-2.5 sm:p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-2.5 transition hover:border-slate-300 dark:hover:border-slate-700"
            >
              <div className="p-1.5 rounded-xl bg-white dark:bg-slate-900 shadow-xs shrink-0 mt-0.5 border border-slate-200 dark:border-slate-700">
                {item.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    {item.title}
                  </h4>
                  {item.tag && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 shrink-0">
                      {item.tag}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Indicatori di Avanzamento e Contatore */}
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
                    : 'w-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              Passaggio {currentStepIndex + 1} di {steps.length}
            </span>
          </div>
        </div>

        {/* Pulsanti di Azione e Navigazione */}
        <div className="flex items-center justify-between gap-2.5 pt-1">
          {!isFirstStep ? (
            <button
              type="button"
              onClick={handlePrev}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-1 active:scale-95"
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
              Salta introduzione
            </button>
          )}

          <div className="flex items-center gap-2">
            {!isLastStep && (
              <button
                type="button"
                onClick={handleFinish}
                className="hidden sm:inline-block text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition px-2 py-2 cursor-pointer"
              >
                Salta e chiudi
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="px-4 sm:px-5 py-2.5 bg-[#781816] hover:bg-[#5a1210] active:scale-95 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
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
