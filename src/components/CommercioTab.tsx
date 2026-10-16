import React, { useState, useMemo, useEffect } from 'react';
import { 
  AttivitaCommercio, 
  CategoriaCommercio, 
  EventoQuartiere,
  NuovaAttivitaForm 
} from '../types';
import { MappaQuartiere } from './MappaQuartiere';
import { 
  Store, 
  Search, 
  Tag, 
  MapPin, 
  Clock, 
  Phone, 
  MessageCircle, 
  Share2, 
  Sparkles, 
  PlusCircle, 
  Navigation, 
  CheckCircle2, 
  Star, 
  Map, 
  List, 
  ChevronRight, 
  ChevronLeft,
  ThumbsUp,
  Award,
  Filter,
  Layers,
  X,
  Send,
  AlertCircle,
  ShieldCheck,
  Hourglass,
  Check,
  Upload,
  Camera,
  Image as ImageIcon,
  Mail,
} from 'lucide-react';

interface CommercioTabProps {
  attivita: AttivitaCommercio[];
  eventi: EventoQuartiere[];
  votedAttivita?: number[];
  onVoteAttivita: (attivita: AttivitaCommercio) => void;
  onAggiungiAttivita: (nuova: AttivitaCommercio) => void;
  onApprovaAttivita?: (id: number) => void;
  darkMode?: boolean;
}

const CATEGORIA_CONFIG: Record<
  CategoriaCommercio,
  {
    label: string;
    emoji: string;
    dotBg: string;
    activeClass: string;
    inactiveClass: string;
    activeBadge: string;
    inactiveBadge: string;
  }
> = {
  tutti: {
    label: 'Tutte le Categorie',
    emoji: '🏪',
    dotBg: 'bg-[#781816]',
    activeClass: 'bg-[#781816] text-white shadow-sm border-[#781816] ring-2 ring-[#781816]/30',
    inactiveClass: 'bg-slate-100/90 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200/90 dark:border-slate-700 hover:bg-slate-200/80 dark:hover:bg-slate-700/80',
    activeBadge: 'bg-white/20 text-white',
    inactiveBadge: 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
  },
  alimentari: {
    label: 'Alimentari',
    emoji: '🍞',
    dotBg: 'bg-emerald-600',
    activeClass: 'bg-emerald-600 text-white shadow-sm border-emerald-600 ring-2 ring-emerald-500/30',
    inactiveClass: 'bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-300/80 dark:border-emerald-800 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/50',
    activeBadge: 'bg-white/20 text-white',
    inactiveBadge: 'bg-emerald-200/70 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200',
  },
  ristorazione: {
    label: 'Bar & Cucina',
    emoji: '🍕',
    dotBg: 'bg-amber-600',
    activeClass: 'bg-amber-600 text-white shadow-sm border-amber-600 ring-2 ring-amber-500/30',
    inactiveClass: 'bg-amber-50/80 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-amber-300/80 dark:border-amber-800 hover:bg-amber-100/80 dark:hover:bg-amber-900/50',
    activeBadge: 'bg-white/20 text-white',
    inactiveBadge: 'bg-amber-200/70 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200',
  },
  salute: {
    label: 'Farmacia & Salute',
    emoji: '💊',
    dotBg: 'bg-rose-600',
    activeClass: 'bg-rose-600 text-white shadow-sm border-rose-600 ring-2 ring-rose-500/30',
    inactiveClass: 'bg-rose-50/80 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border-rose-300/80 dark:border-rose-800 hover:bg-rose-100/80 dark:hover:bg-rose-900/50',
    activeBadge: 'bg-white/20 text-white',
    inactiveBadge: 'bg-rose-200/70 dark:bg-rose-900/60 text-rose-900 dark:text-rose-200',
  },
  servizi: {
    label: 'Artigiani & Servizi',
    emoji: '🔧',
    dotBg: 'bg-indigo-600',
    activeClass: 'bg-indigo-600 text-white shadow-sm border-indigo-600 ring-2 ring-indigo-500/30',
    inactiveClass: 'bg-indigo-50/80 dark:bg-indigo-950/30 text-indigo-800 dark:text-indigo-300 border-indigo-300/80 dark:border-indigo-800 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/50',
    activeBadge: 'bg-white/20 text-white',
    inactiveBadge: 'bg-indigo-200/70 dark:bg-indigo-900/60 text-indigo-900 dark:text-indigo-200',
  },
  casa: {
    label: 'Casa & Brico',
    emoji: '🏡',
    dotBg: 'bg-sky-600',
    activeClass: 'bg-sky-600 text-white shadow-sm border-sky-600 ring-2 ring-sky-500/30',
    inactiveClass: 'bg-sky-50/80 dark:bg-sky-950/30 text-sky-800 dark:text-sky-300 border-sky-300/80 dark:border-sky-800 hover:bg-sky-100/80 dark:hover:bg-sky-900/50',
    activeBadge: 'bg-white/20 text-white',
    inactiveBadge: 'bg-sky-200/70 dark:bg-sky-900/60 text-sky-900 dark:text-sky-200',
  },
};

const GIORNI_SETTIMANA = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

const TIME_SLOTS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
  '22:00', '22:30', '23:00', '23:30', '24:00'
];

export const CommercioTab: React.FC<CommercioTabProps> = ({
  attivita,
  eventi,
  votedAttivita = [],
  onVoteAttivita,
  onAggiungiAttivita,
  onApprovaAttivita,
  darkMode,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoriaCommercio>('tutti');
  const [onlyOffers, setOnlyOffers] = useState(false);
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [selectedAttivitaId, setSelectedAttivitaId] = useState<number | null>(null);
  const [mapFilterTipo, setMapFilterTipo] = useState<'tutti' | 'negozi' | 'eventi'>('tutti');
  
  // Paginazione: massimo 6 commercianti per pagina
  const ITEMS_PER_PAGE = 6;
  const [activePage, setActivePage] = useState(0);

  // Modalità di visualizzazione
  const [viewMode, setViewMode] = useState<'both' | 'map-only' | 'list-only'>('both');
  
  // Modale di registrazione commerciante & stato di conferma
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [submittedShop, setSubmittedShop] = useState<AttivitaCommercio | null>(null);
  const [copiedShareId, setCopiedShareId] = useState<number | null>(null);

  // Foto / Logo caricato dal commerciante in formato JPG
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('La dimensione dell\'immagine supera i 5MB. Scegli un file JPG o PNG più leggero.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const res = event.target?.result as string;
      if (res) {
        setUploadedImage(res);
      }
    };
    reader.readAsDataURL(file);
  };

  // Form stato nuova attività
  const [formData, setFormData] = useState<NuovaAttivitaForm>({
    nome: '',
    categoria: 'alimentari',
    indirizzo: '',
    telefono: '',
    whatsapp: '',
    orari: '',
    descrizione: '',
    offertaTitolo: '',
    offertaDettaglio: '',
    nomeReferente: '',
    emailReferente: '',
  });

  // Stati per la selezione standardizzata degli orari di apertura
  const [selectedDays, setSelectedDays] = useState<string[]>(['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']);
  const [orarioTipo, setOrarioTipo] = useState<'spezzato' | 'continuato' | 'h24'>('spezzato');
  const [oraAperturaMattina, setOraAperturaMattina] = useState('08:30');
  const [oraChiusuraMattina, setOraChiusuraMattina] = useState('13:00');
  const [oraAperturaPomeriggio, setOraAperturaPomeriggio] = useState('16:00');
  const [oraChiusuraPomeriggio, setOraChiusuraPomeriggio] = useState('20:00');
  const [oraAperturaContinuato, setOraAperturaContinuato] = useState('08:30');
  const [oraChiusuraContinuato, setOraChiusuraContinuato] = useState('19:30');

  // Sincronizzazione automatica degli orari standardizzati nel formData
  useEffect(() => {
    let giorniLabel = '';
    if (selectedDays.length === 7) {
      giorniLabel = 'Tutti i giorni';
    } else if (
      selectedDays.length === 6 &&
      selectedDays.includes('Lun') &&
      selectedDays.includes('Sab') &&
      !selectedDays.includes('Dom')
    ) {
      giorniLabel = 'Lun-Sab';
    } else if (
      selectedDays.length === 5 &&
      selectedDays.includes('Lun') &&
      selectedDays.includes('Ven') &&
      !selectedDays.includes('Sab') &&
      !selectedDays.includes('Dom')
    ) {
      giorniLabel = 'Lun-Ven';
    } else if (selectedDays.length === 0) {
      giorniLabel = 'Chiuso';
    } else {
      giorniLabel = selectedDays.join(', ');
    }

    let orarioFormattato = '';
    if (orarioTipo === 'h24') {
      orarioFormattato = `${giorniLabel}: 24h/24`;
    } else if (orarioTipo === 'continuato') {
      orarioFormattato = `${giorniLabel}: ${oraAperturaContinuato}-${oraChiusuraContinuato}`;
    } else {
      orarioFormattato = `${giorniLabel}: ${oraAperturaMattina}-${oraChiusuraMattina} / ${oraAperturaPomeriggio}-${oraChiusuraPomeriggio}`;
    }

    setFormData((prev) => ({ ...prev, orari: orarioFormattato }));
  }, [
    selectedDays,
    orarioTipo,
    oraAperturaMattina,
    oraChiusuraMattina,
    oraAperturaPomeriggio,
    oraChiusuraPomeriggio,
    oraAperturaContinuato,
    oraChiusuraContinuato,
  ]);

  // Reset pagina al variare dei filtri di ricerca
  useEffect(() => {
    setActivePage(0);
  }, [searchTerm, selectedCategory, onlyOffers, onlyOpen]);

  // Filtro attività commerciali pubbliche (approvate o inserite dall'utente)
  const filteredAttivita = useMemo(() => {
    return attivita
      .filter((shop) => shop.statoApprovazione !== 'in_attesa' || shop.inviataDaMe)
      .filter((shop) => {
        // Filtro categoria
        if (selectedCategory !== 'tutti' && shop.categoria !== selectedCategory) {
          return false;
        }
        // Solo offerte
        if (onlyOffers && !shop.offertaAttiva) {
          return false;
        }
        // Solo aperte ora
        if (onlyOpen && !shop.apertoOra) {
          return false;
        }
        // Ricerca testuale
        if (searchTerm.trim() !== '') {
          const query = searchTerm.toLowerCase();
          const matchName = shop.nome.toLowerCase().includes(query);
          const matchAddress = shop.indirizzo.toLowerCase().includes(query);
          const matchDesc = shop.descrizione.toLowerCase().includes(query);
          const matchOffer = shop.offertaAttiva?.titolo.toLowerCase().includes(query) || false;
          if (!matchName && !matchAddress && !matchDesc && !matchOffer) {
            return false;
          }
        }
        return true;
      });
  }, [attivita, selectedCategory, onlyOffers, onlyOpen, searchTerm]);

  // Ordinamento per numero di "Mi piace" decrescente (più votati per primi)
  const sortedAttivita = useMemo(() => {
    return [...filteredAttivita].sort((a, b) => (b.miPiace || 0) - (a.miPiace || 0));
  }, [filteredAttivita]);

  // Calcolo paginazione (massimo 6 commercianti per pagina)
  const totalPages = Math.ceil(sortedAttivita.length / ITEMS_PER_PAGE) || 1;
  const safeActivePage = Math.min(activePage, Math.max(0, totalPages - 1));

  const visibleAttivita = useMemo(() => {
    const start = safeActivePage * ITEMS_PER_PAGE;
    return sortedAttivita.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedAttivita, safeActivePage]);


  const handleShareShopOffer = (shop: AttivitaCommercio) => {
    const offerText = shop.offertaAttiva 
      ? `🔥 Promozione di quartiere: "${shop.offertaAttiva.titolo}" - ${shop.offertaAttiva.dettaglio}`
      : `Scopri ${shop.nome} a Villaggio Prenestino!`;
    
    const shareMessage = `🛍️ *${shop.nome}* (${shop.categoria.toUpperCase()}) a Villaggio Prenestino\n📍 ${shop.indirizzo}\n${offerText}\n\n📱 Trovalo e visualizza la mappa sulla Web App di Villaggio Prenestino:\n${window.location.origin}`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
    window.open(whatsappUrl, '_blank');

    setCopiedShareId(shop.id);
    setTimeout(() => setCopiedShareId(null), 3000);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim() || !formData.indirizzo.trim()) return;

    // Coordinate con lieve offset per evitare sovrapposizioni su Villaggio Prenestino
    const randomOffsetLat = (Math.random() - 0.5) * 0.008;
    const randomOffsetLng = (Math.random() - 0.5) * 0.008;

    const newShop: AttivitaCommercio = {
      id: Date.now(),
      nome: formData.nome.trim(),
      categoria: formData.categoria,
      indirizzo: formData.indirizzo.includes('Villaggio Prenestino') 
        ? formData.indirizzo.trim() 
        : `${formData.indirizzo.trim()}, Villaggio Prenestino, Roma`,
      lat: 41.8965 + randomOffsetLat,
      lng: 12.6710 + randomOffsetLng,
      telefono: formData.telefono.trim() || '06 2244 0000',
      whatsapp: formData.whatsapp.replace(/\D/g, ''),
      orari: formData.orari.trim() || 'Lun-Sab 09:00 - 19:30',
      apertoOra: true,
      verificato: false,
      recensioneVoto: 5.0,
      miPiace: 1,
      statoApprovazione: 'in_attesa', // Inviata in moderazione all'amministratore WordPress
      inviataDaMe: true,
      dataInserimento: new Date().toLocaleDateString('it-IT'),
      nomeReferente: formData.nomeReferente?.trim(),
      emailReferente: formData.emailReferente?.trim(),
      descrizione: formData.descrizione.trim() || 'Attività commerciale di prossimità a Villaggio Prenestino.',
      immagine: uploadedImage || (formData.categoria === 'alimentari' 
        ? 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80'
        : formData.categoria === 'ristorazione'
        ? 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80'
        : formData.categoria === 'salute'
        ? 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=800&q=80'
        : formData.categoria === 'casa'
        ? 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=800&q=80'
        : 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80'),
      logo: uploadedImage || undefined,
      offertaAttiva: formData.offertaTitolo.trim() ? {
        titolo: formData.offertaTitolo.trim(),
        dettaglio: formData.offertaDettaglio.trim() || 'Offerta esclusiva per i residenti del quartiere',
        scadenza: 'Promozione attiva',
      } : undefined,
    };

    onAggiungiAttivita(newShop);
    setSubmittedShop(newShop);
    setRegisterSuccess(true);
    // IMPORTANTE: nessun setTimeout! Il popup resta visibile finché l'utente non tocca la X
  };

  const handleCloseRegisterModal = () => {
    setIsRegisterModalOpen(false);
    setRegisterSuccess(false);
    setSubmittedShop(null);
    setUploadedImage(null);
    setFormData({
      nome: '',
      categoria: 'alimentari',
      indirizzo: '',
      telefono: '',
      whatsapp: '',
      orari: '',
      descrizione: '',
      offertaTitolo: '',
      offertaDettaglio: '',
      nomeReferente: '',
      emailReferente: '',
    });
    setSelectedDays(['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']);
    setOrarioTipo('spezzato');
    setOraAperturaMattina('08:30');
    setOraChiusuraMattina('13:00');
    setOraAperturaPomeriggio('16:00');
    setOraChiusuraPomeriggio('20:00');
    setOraAperturaContinuato('08:30');
    setOraChiusuraContinuato('19:30');
  };

  const scrollToVetrina = () => {
    const el = document.getElementById('commercianti-vetrina-heading');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-5 pb-20 animate-fadeIn">
      {/* HERO BANNER ROSSO (Layout e stile identico alla Home) */}
      <section
        className="rounded-3xl p-5 sm:p-7 text-white shadow-lg border border-black/10 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #781816 0%, #5a1210 100%)',
        }}
      >
        <div className="relative z-10 max-w-lg">
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider mb-2">
            Economia Locale & Negozi di Vicinato
          </span>
          <h2 className="text-xl sm:text-2xl font-black leading-tight text-white tracking-tight">
            Commercianti & Attività di Villaggio Prenestino
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-white/90 leading-relaxed">
            Scopri, contatta e sostieni i commercianti del quartiere. Trova promozioni esclusive, ordina via WhatsApp e visualizza le attività sulla mappa interattiva.
          </p>

          <div className="mt-4 flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={() => {
                setRegisterSuccess(false);
                setIsRegisterModalOpen(true);
              }}
              className="w-full sm:w-auto px-4 py-2.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-slate-950" />
              <span>Iscrivi la tua attività</span>
            </button>
          </div>
        </div>
      </section>

      {/* SELETTORE VISTA (MAPPA / ELENCO) */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-100 dark:bg-slate-800/60 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode('both')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'both'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Mappa & Vetrina</span>
          </button>
          <button
            onClick={() => setViewMode('map-only')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'map-only'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>Solo Mappa</span>
          </button>
          <button
            onClick={() => setViewMode('list-only')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'list-only'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Solo Vetrina</span>
          </button>
        </div>

        <button
          onClick={scrollToVetrina}
          className="text-xs font-semibold text-[#781816] dark:text-amber-400 hover:underline flex items-center gap-1 px-2 cursor-pointer"
        >
          <span>Vai ai commercianti ({sortedAttivita.length})</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* MAPPA INTERATTIVA GOOGLE MAPS */}
      {viewMode !== 'list-only' && (
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-600" />
              <span>Mappa Commerciale di Quartiere</span>
            </h3>
            <span className="text-xs text-slate-500">
              Tocca un'attività per info e orari
            </span>
          </div>

          <MappaQuartiere
            attivita={filteredAttivita}
            eventi={eventi}
            filterTipo={mapFilterTipo}
            onFilterChange={(t) => setMapFilterTipo(t)}
            selectedAttivitaId={selectedAttivitaId}
            onSelectAttivita={(id) => {
              setSelectedAttivitaId(id);
              if (id) {
                // Seleziona la pagina in cui si trova l'attività cliccata
                const index = sortedAttivita.findIndex(a => a.id === id);
                if (index !== -1) {
                  setActivePage(Math.floor(index / ITEMS_PER_PAGE));
                }
              }
            }}
            darkMode={darkMode}
          />
        </section>
      )}

      {/* VETRINA COMMERCIANTI CON FILTRI, ORDINAMENTO MI PIACE E PAGINAZIONE */}
      {viewMode !== 'map-only' && (
        <section className="space-y-4 pt-2" id="commercianti-vetrina-heading">
          {/* BARRA FILTRI E RICERCA */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row gap-2.5">
              {/* Ricerca per nome / prodotto */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cerca attività, via, pizza, farmacia, pane..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                  >
                    Cancella
                  </button>
                )}
              </div>

              {/* Toggles rapidi: Offerte attive & Aperto ora */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOnlyOffers(!onlyOffers)}
                  className={`px-3 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    onlyOffers
                      ? 'bg-amber-400 text-slate-950 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>Con Offerte</span>
                </button>
                <button
                  onClick={() => setOnlyOpen(!onlyOpen)}
                  className={`px-3 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    onlyOpen
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Aperti Ora</span>
                </button>
              </div>
            </div>

            {/* SEZIONE FILTRO PER CATEGORIA (RESPONSIVE, FULL VISIBILITY, ZERO TRONCAMENTI) */}
            <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Filtro Categoria</span>
                  </span>
                  {selectedCategory !== 'tutti' ? (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      Attivo: <span className="font-bold">{CATEGORIA_CONFIG[selectedCategory].label}</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400 hidden sm:inline">
                      (Tutte le 6 categorie visibili)
                    </span>
                  )}
                </div>

                {selectedCategory !== 'tutti' && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('tutti')}
                    className="text-xs font-bold text-[#781816] dark:text-amber-400 hover:underline cursor-pointer flex items-center gap-1 transition"
                  >
                    <span>Mostra tutte</span>
                    <span className="text-sm leading-none font-black">×</span>
                  </button>
                )}
              </div>

              {/* Grid responsive a 2 o 3 colonne su mobile/tablet e flex-wrap su desktop: NESSUN TRONCAMENTO */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-wrap gap-2">
                {(['tutti', 'alimentari', 'ristorazione', 'salute', 'servizi', 'casa'] as CategoriaCommercio[]).map((catId) => {
                  const conf = CATEGORIA_CONFIG[catId];
                  const isActive = selectedCategory === catId;
                  const count = catId === 'tutti' 
                    ? attivita.filter(a => a.statoApprovazione !== 'in_attesa' || a.inviataDaMe).length
                    : attivita.filter(a => a.categoria === catId && (a.statoApprovazione !== 'in_attesa' || a.inviataDaMe)).length;

                  return (
                    <button
                      key={catId}
                      type="button"
                      onClick={() => setSelectedCategory(catId)}
                      aria-pressed={isActive}
                      className={`px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-2xl font-bold transition-all duration-150 cursor-pointer flex items-center justify-between lg:justify-start gap-1.5 sm:gap-2 text-xs border min-h-[42px] ${
                        isActive ? conf.activeClass : conf.inactiveClass
                      }`}
                    >
                      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                        <span className={`w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full ${conf.dotBg} shrink-0 ring-1 sm:ring-2 ring-white/60 dark:ring-black/40`} />
                        <span className="hidden sm:inline text-sm shrink-0">{conf.emoji}</span>
                        <span className="truncate">{conf.label}</span>
                      </div>
                      <span className={`text-[11px] px-1.5 sm:px-2 py-0.5 rounded-full font-black shrink-0 transition ${
                        isActive ? conf.activeBadge : conf.inactiveBadge
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* INTESTAZIONE VETRINA & CONTROLLO PAGINAZIONE SUPERIORE */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>Commercianti & Attività di Quartiere</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                  {sortedAttivita.length} trovati
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-600" />
                <span>Ordinati per numero di "Mi piace" ricevuti dai residenti</span>
              </p>
            </div>

            {/* SELETTORE PAGINAZIONE SUPERIORE (se più di 6 elementi) */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-1 rounded-2xl shadow-xs self-start sm:self-auto">
                <button
                  type="button"
                  disabled={safeActivePage === 0}
                  onClick={() => setActivePage((p) => Math.max(0, p - 1))}
                  className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition"
                  title="Pagina precedente"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300 px-1">
                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActivePage(idx)}
                      className={`w-7 h-7 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center ${
                        safeActivePage === idx
                          ? 'bg-[#781816] text-white shadow-xs'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={safeActivePage >= totalPages - 1}
                  onClick={() => setActivePage((p) => Math.min(totalPages - 1, p + 1))}
                  className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition"
                  title="Pagina successiva"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* ELENCO COMMERCIANTI (PAGINATO A 6 PER PAGINA) */}
          {visibleAttivita.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-center border border-slate-200 dark:border-slate-800 space-y-3">
              <Store className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-800 dark:text-white text-base">
                Nessuna attività commerciale trovata
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Prova a cambiare categoria o a rimuovere i termini di ricerca inseriti.
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('tutti');
                  setOnlyOffers(false);
                  setOnlyOpen(false);
                }}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Reimposta tutti i filtri
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleAttivita.map((shop, indexOnPage) => {
                const globalIndex = safeActivePage * ITEMS_PER_PAGE + indexOnPage;
                const isTop1 = globalIndex === 0;
                const isTop3 = globalIndex < 3;
                const hasVoted = votedAttivita.includes(shop.id);

                return (
                  <div
                    key={shop.id}
                    className={`bg-white dark:bg-slate-900 rounded-3xl border transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
                      selectedAttivitaId === shop.id
                        ? 'border-amber-500 ring-2 ring-amber-500/20'
                        : isTop1
                        ? 'border-amber-300 dark:border-amber-700/50'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div>
                      {/* Immagine con badge classifica e categoria */}
                      <div className="relative h-44 overflow-hidden bg-slate-100 dark:bg-slate-800">
                        <img
                          src={shop.immagine}
                          alt={shop.nome}
                          className="w-full h-full object-cover transition duration-300 hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                        {/* Badge Posizione Classifica "Mi piace" */}
                        <div className="absolute top-3 left-3 flex items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black shadow-md ${
                            isTop1
                              ? 'bg-amber-400 text-slate-950 border border-amber-300'
                              : isTop3
                              ? 'bg-amber-100 text-amber-950 border border-amber-300'
                              : 'bg-black/60 backdrop-blur-xs text-white border border-white/20'
                          }`}>
                            <Award className="w-3.5 h-3.5" />
                            <span>#{globalIndex + 1} Più Consigliata</span>
                          </span>
                        </div>

                        {/* Categoria chip */}
                        <div className="absolute top-3 right-3">
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/90 text-slate-900 backdrop-blur-xs shadow-xs capitalize">
                            {shop.categoria}
                          </span>
                        </div>

                        {/* Titolo e indirizzo sovrapposti all'immagine */}
                        <div className="absolute bottom-3 left-3 right-3 text-white">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <h4 className="font-black text-base leading-tight drop-shadow-md text-white line-clamp-1">
                              {shop.nome}
                            </h4>
                            {shop.verificato ? (
                              <span title="Verificato dall'Associazione">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              </span>
                            ) : shop.statoApprovazione === 'in_attesa' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950 flex items-center gap-1 shrink-0" title="In attesa di approvazione moderatore WordPress">
                                <Clock className="w-3 h-3 text-slate-950" />
                                <span>In attesa</span>
                              </span>
                            ) : null}
                          </div>
                          <p className="text-[11px] text-slate-200 flex items-center gap-1 drop-shadow-xs truncate">
                            <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                            <span>{shop.indirizzo}</span>
                          </p>
                        </div>
                      </div>

                      {/* Corpo Scheda */}
                      <div className="p-4 space-y-3">
                        {/* Tasto Mi Piace compatto con icona e contatore like incorporato */}
                        <div>
                          <button
                            type="button"
                            onClick={() => {
                              if (hasVoted) return;
                              onVoteAttivita(shop);
                            }}
                            disabled={hasVoted}
                            className={`w-full py-2.5 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer ${
                              hasVoted
                                ? 'bg-amber-100/90 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300/80 dark:border-amber-700/60 cursor-default'
                                : 'bg-[#781816] hover:bg-[#5a1210] active:scale-[0.98] text-white hover:shadow-md'
                            }`}
                            title={hasVoted ? 'Hai già consigliato questa attività (+2 Punti Civici registrati)' : 'Esprimi Mi piace per consigliare questa attività ai vicini (+2 Punti Civici)'}
                          >
                            <ThumbsUp className={`w-4 h-4 shrink-0 transition-transform ${hasVoted ? 'fill-amber-800 dark:fill-amber-300' : ''}`} />
                            <span>{hasVoted ? 'Consigliato' : 'Mi piace'}</span>
                            <span className={`ml-1 px-2.5 py-0.5 rounded-full text-xs font-black shrink-0 ${
                              hasVoted
                                ? 'bg-amber-200/90 dark:bg-amber-900/80 text-amber-950 dark:text-amber-200'
                                : 'bg-white/20 text-white'
                            }`}>
                              {shop.miPiace ?? 0}
                            </span>
                          </button>
                        </div>

                        {/* Offerta attiva se presente */}
                        {shop.offertaAttiva && (
                          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/50 space-y-1">
                            <div className="flex items-center justify-between text-amber-900 dark:text-amber-200">
                              <span className="text-xs font-black flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                                {shop.offertaAttiva.titolo}
                              </span>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                                Coupon Quartiere
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                              {shop.offertaAttiva.dettaglio}
                            </p>
                          </div>
                        )}

                        {/* Descrizione sintetica */}
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                          {shop.descrizione}
                        </p>

                        {/* Dettagli orari e telefono */}
                        <div className="space-y-1 text-xs text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{shop.orari}</span>
                            </span>
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Aperto
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <a href={`tel:${shop.telefono}`} className="hover:text-slate-900 underline">
                              {shop.telefono}
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Scheda: Azioni (WhatsApp Ordini, Mappa, Condividi) */}
                    <div className="p-4 pt-0 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        {/* Tasto WhatsApp diretto */}
                        {shop.whatsapp ? (
                          <a
                            href={`https://wa.me/${shop.whatsapp}?text=${encodeURIComponent(
                              `Salve ${shop.nome}, vi ho trovato sulla Web App di Villaggio Prenestino! Vorrei informazioni sul vostro servizio o promozioni.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2 px-3 bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1da850] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        ) : (
                          <a
                            href={`tel:${shop.telefono}`}
                            className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>Chiama</span>
                          </a>
                        )}

                        {/* Tasto Mostra su Mappa / Indicazioni Google */}
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            `${shop.nome}, ${shop.indirizzo}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                        >
                          <Navigation className="w-3.5 h-3.5 text-amber-600" />
                          <span>Percorso</span>
                        </a>
                      </div>

                      {/* Tasto Condividi Offerta */}
                      <button
                        type="button"
                        onClick={() => handleShareShopOffer(shop)}
                        className="w-full py-1.5 px-3 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Share2 className="w-3 h-3 text-slate-500" />
                        <span>
                          {copiedShareId === shop.id ? 'Aperto WhatsApp!' : 'Condividi attività con i residenti'}
                        </span>
                      </button>

                      {/* Box di simulazione approvazione WordPress se la scheda è in attesa */}
                      {shop.statoApprovazione === 'in_attesa' && (
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                          <span className="text-[10px] font-medium text-amber-700 dark:text-amber-300 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>In moderazione WP</span>
                          </span>
                          {onApprovaAttivita && (
                            <button
                              type="button"
                              onClick={() => onApprovaAttivita(shop.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
                              title="Simula approvazione immediata dal pannello admin WordPress"
                            >
                              <Check className="w-3 h-3" />
                              <span>Approva (Admin)</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* CONTROLLO PAGINAZIONE INFERIORE (se più di 6 commercianti) */}
          {totalPages > 1 && (
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500">
                Visualizzati da {safeActivePage * ITEMS_PER_PAGE + 1} a {Math.min((safeActivePage + 1) * ITEMS_PER_PAGE, sortedAttivita.length)} di {sortedAttivita.length} commercianti
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safeActivePage === 0}
                  onClick={() => {
                    setActivePage((p) => Math.max(0, p - 1));
                    scrollToVetrina();
                  }}
                  className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Prec.</span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setActivePage(idx);
                        scrollToVetrina();
                      }}
                      className={`w-8 h-8 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center ${
                        safeActivePage === idx
                          ? 'bg-[#781816] text-white shadow-xs'
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={safeActivePage >= totalPages - 1}
                  onClick={() => {
                    setActivePage((p) => Math.min(totalPages - 1, p + 1));
                    scrollToVetrina();
                  }}
                  className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer flex items-center gap-1"
                >
                  <span>Succ.</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* RICHIESTA RIMOZIONE ATTIVITÀ COMMERCIALE */}
      <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-center">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Vuoi rimuovere la tua attività?{' '}
          <a
            href="mailto:associazione@villaggioprenestino.it?subject=Richiesta%20rimozione%20attivit%C3%A0%20commerciale&body=Salve,%20vorrei%20richiedere%20la%20rimozione%20della%20mia%20attivit%C3%A0%20commerciale%20dalla%20vetrina%20di%20Villaggio%20Prenestino:%0A%0ANome%20Attivit%C3%A0:%20%0AIndirizzo:%20%0AEmail%20/%20Telefono%20di%20riferimento:%20%0AMotivazione:%20"
            className="font-bold text-[#781816] dark:text-amber-400 underline hover:text-[#5a1210] dark:hover:text-amber-300 transition"
          >
            Scrivici una email
          </a>{' '}
          e provvederemo.
        </p>
      </div>

      {/* MODALE REGISTRAZIONE COMMERCIANTE CON GESTIONE APPROVAZIONE WORDPRESS */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4 my-auto relative animate-scaleUp">
            
            {/* Tasto X di chiusura SEMPRE visibile e accessibile in alto a destra */}
            <button
              type="button"
              onClick={handleCloseRegisterModal}
              className="absolute top-4 right-4 p-2 rounded-2xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer z-20"
              aria-label="Chiudi"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>

            {/* SE L'ATTIVITÀ È STATA INVIATA: POPUP PERSISTENTE DI CONFERMA & MODERAZIONE */}
            {registerSuccess ? (
              <div className="py-2 space-y-4 text-center">
                {/* Icona & Badge Stato */}
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/80 border-2 border-amber-300 dark:border-amber-700 rounded-3xl flex items-center justify-center mx-auto text-amber-800 dark:text-amber-300 shadow-md">
                  <Hourglass className="w-8 h-8 text-amber-700 animate-pulse" />
                </div>

                <div>
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 mb-2">
                    🟡 In Attesa di Approvazione Amministratore
                  </span>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                    Attività Inviata con Successo!
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-md mx-auto">
                    La richiesta è stata inoltrata al sistema WordPress di Villaggio Prenestino. Un amministratore del portale verificherà i dati prima della pubblicazione pubblica.
                  </p>
                </div>

                {/* PROCEDURA DI APPROVAZIONE IN 3 PASSI (Come per le Segnalazioni) */}
                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-700 text-left space-y-2.5">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                    Stato dell'Iter di Pubblicazione:
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {/* Passo 1 */}
                    <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 rounded-xl p-2.5 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 font-bold text-[11px]">
                        <span>1. Inviata</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      </div>
                      <p className="text-[10px] text-emerald-700 dark:text-emerald-300 mt-1">
                        Ricevuta dal database WordPress.
                      </p>
                    </div>

                    {/* Passo 2 */}
                    <div className="bg-amber-50 dark:bg-amber-950/60 border-2 border-amber-400 rounded-xl p-2.5 flex flex-col justify-between shadow-xs">
                      <div className="flex items-center justify-between text-amber-900 dark:text-amber-200 font-black text-[11px]">
                        <span>2. Verifica Admin</span>
                        <Hourglass className="w-4 h-4 text-amber-600 animate-spin" />
                      </div>
                      <p className="text-[10px] text-amber-800 dark:text-amber-300 mt-1 font-medium">
                        Controllo recapiti e sede in corso.
                      </p>
                    </div>

                    {/* Passo 3 */}
                    <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 flex flex-col justify-between opacity-75">
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 font-bold text-[11px]">
                        <span>3. Pubblicazione</span>
                        <Store className="w-4 h-4 text-slate-400" />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Visibile a tutti su Google Maps e vetrina.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Riepilogo scheda inviata */}
                {submittedShop && (
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-left text-xs space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Riepilogo dati attività:</span>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">
                      {submittedShop.nome}
                    </p>
                    <p className="text-slate-600 dark:text-slate-300 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-600" />
                      <span>{submittedShop.indirizzo}</span>
                    </p>
                    <p className="text-slate-600 dark:text-slate-300 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{submittedShop.telefono}</span>
                    </p>
                  </div>
                )}

                {/* Avviso rassicurante per il commerciante */}
                <div className="p-3 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-2xl text-left text-xs text-sky-900 dark:text-sky-200 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertCircle className="w-4 h-4 text-sky-600 shrink-0" />
                    <span>Cosa accade ora?</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-sky-800 dark:text-sky-300">
                    Non preoccuparti se non la vedi subito nella vetrina pubblica: la tua attività è memorizzata come <em>"In attesa di approvazione"</em> nella sezione superiore. Non appena l'amministratore approverà la scheda in WordPress, diventerà visibile a tutti i residenti di Villaggio Prenestino e riceverà la spunta di verifica.
                  </p>
                </div>

                {/* Tasto di Chiusura Persistente */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleCloseRegisterModal}
                    className="w-full py-3 px-6 bg-[#781816] hover:bg-[#5a1210] active:scale-98 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    <span>Ho Capito, Chiudi Finestra (X)</span>
                  </button>
                </div>
              </div>
            ) : (
              /* FORM DI INSERIMENTO NUOVA ATTIVITÀ */
              <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1">
                    <Store className="w-3.5 h-3.5" />
                    Commercio di Prossimità
                  </span>
                  <h3 className="text-xl font-bold text-slate-950 dark:text-white">
                    Iscrivi la tua Attività Commerciale
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Inserisci la tua attività per promuoverla a Km 0 a tutti i residenti di Villaggio Prenestino.
                  </p>
                </div>

                {/* AVVISO DI MODERAZIONE CHIARA */}
                <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 rounded-2xl flex items-start gap-2.5 text-amber-900 dark:text-amber-200">
                  <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <strong className="block text-xs font-bold">
                      Procedura di approvazione dell'amministratore
                    </strong>
                    <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                      Tutte le nuove attività inserite vengono verificate dall'amministratore del sito prima della pubblicazione. Questo assicura annunci autentici e recapiti verificati per il quartiere.
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Nome dell'Attività Commerciale *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="es. Panificio & Pasticceria Dal 1980"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Categoria Merceologica *
                    </label>
                    <select
                      value={formData.categoria}
                      onChange={(e) => setFormData({ ...formData, categoria: e.target.value as any })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-900 dark:text-white"
                    >
                      <option value="alimentari">Alimentari & Gastronomia</option>
                      <option value="ristorazione">Bar & Ristorazione</option>
                      <option value="salute">Salute & Farmacia</option>
                      <option value="servizi">Artigiani & Servizi</option>
                      <option value="casa">Casa, Giardino & Hobby</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Telefono Fisso o Mobile *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="es. 06 2244 1234"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* CARICAMENTO LOGO O FOTO IN FORMATO JPG */}
                <div className="space-y-2 p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-amber-600" />
                      <span>Logo o Foto del Negozio (Formato JPG)</span>
                    </label>
                    <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold bg-amber-100 dark:bg-amber-950/70 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
                      Formato JPG / JPEG
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Carica il logo aziendale o una foto della facciata/vetrina del negozio: verrà presentata in primo piano nella scheda dell'attività.
                  </p>

                  {uploadedImage ? (
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 h-36 bg-slate-100 dark:bg-slate-900 group">
                      <img
                        src={uploadedImage}
                        alt="Anteprima Foto/Logo Negozio"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/45 flex items-center justify-center gap-2">
                        <label className="px-3 py-1.5 bg-white text-slate-900 rounded-xl text-xs font-bold shadow-md cursor-pointer hover:bg-slate-100 flex items-center gap-1">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Cambia JPG</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,.jpg,.jpeg,image/png,image/webp"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setUploadedImage(null)}
                          className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer hover:bg-rose-700 flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Rimuovi</span>
                        </button>
                      </div>
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/75 text-white text-[10px] font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Immagine JPG pronta per la scheda</span>
                      </div>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-amber-300 dark:border-amber-700/60 hover:border-amber-500 rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-amber-50/50 dark:bg-amber-950/20 transition text-center group">
                      <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Carica Logo o Foto del Negozio (.JPG)
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Tocca per selezionare una foto JPG dalla galleria o dai file
                      </div>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,.jpg,.jpeg,image/png,image/webp"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Numero WhatsApp per Ordini e Contatto Rapido
                  </label>
                  <input
                    type="tel"
                    placeholder="es. 393401234567"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-900 dark:text-white"
                  />
                  <p className="text-[10px] text-slate-400">Inserisci il prefisso 39 per avviare la chat diretta con i clienti</p>
                </div>

                {/* SELETTORE STANDARDIZZATO ORARI DI APERTURA (NESSUN TESTO DA SCRIVERE) */}
                <div className="space-y-3 p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span>Orari di Apertura (Seleziona Giorni e Orari) *</span>
                    </label>
                    <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold bg-amber-100 dark:bg-amber-950/70 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
                      Standardizzato
                    </span>
                  </div>

                  {/* 1. Selezione Giorni con Preset e Bottoni */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">1. Giorni di Apertura:</span>
                      {/* Preset rapidi */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedDays(['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'])}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition cursor-pointer ${
                            selectedDays.length === 6 && !selectedDays.includes('Dom')
                              ? 'bg-[#781816] text-white border-[#781816]'
                              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          Lun-Sab
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedDays(['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'])}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition cursor-pointer ${
                            selectedDays.length === 7
                              ? 'bg-[#781816] text-white border-[#781816]'
                              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          Tutti i giorni
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedDays(['Lun', 'Mar', 'Mer', 'Gio', 'Ven'])}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition cursor-pointer ${
                            selectedDays.length === 5 && !selectedDays.includes('Sab') && !selectedDays.includes('Dom')
                              ? 'bg-[#781816] text-white border-[#781816]'
                              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          Lun-Ven
                        </button>
                      </div>
                    </div>

                    {/* Chips singoli giorni cliccabili */}
                    <div className="grid grid-cols-7 gap-1">
                      {GIORNI_SETTIMANA.map((giorno) => {
                        const isDaySelected = selectedDays.includes(giorno);
                        return (
                          <button
                            key={giorno}
                            type="button"
                            onClick={() => {
                              if (isDaySelected) {
                                setSelectedDays(selectedDays.filter((d) => d !== giorno));
                              } else {
                                setSelectedDays([...selectedDays, giorno]);
                              }
                            }}
                            className={`py-1.5 text-center text-xs font-bold rounded-xl border transition cursor-pointer ${
                              isDaySelected
                                ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-xs'
                                : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {giorno}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Tipo di Orario */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">
                      2. Modalità Orario:
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setOrarioTipo('spezzato')}
                        className={`py-1.5 px-2 rounded-xl text-xs font-bold border text-center transition cursor-pointer ${
                          orarioTipo === 'spezzato'
                            ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        Pausa Pranzo
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrarioTipo('continuato')}
                        className={`py-1.5 px-2 rounded-xl text-xs font-bold border text-center transition cursor-pointer ${
                          orarioTipo === 'continuato'
                            ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        Continuato
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrarioTipo('h24')}
                        className={`py-1.5 px-2 rounded-xl text-xs font-bold border text-center transition cursor-pointer ${
                          orarioTipo === 'h24'
                            ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        H24 (24h/24)
                      </button>
                    </div>
                  </div>

                  {/* 3. Selettori Fasce Orarie (Dropdown a tendina senza digitazione) */}
                  {orarioTipo === 'spezzato' && (
                    <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-700/80">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 block">Mattina: Apertura</label>
                          <select
                            value={oraAperturaMattina}
                            onChange={(e) => setOraAperturaMattina(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                          >
                            {TIME_SLOTS.map((t) => (
                              <option key={`am-in-${t}`} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 block">Mattina: Chiusura</label>
                          <select
                            value={oraChiusuraMattina}
                            onChange={(e) => setOraChiusuraMattina(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                          >
                            {TIME_SLOTS.map((t) => (
                              <option key={`am-out-${t}`} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 block">Pomeriggio: Riapertura</label>
                          <select
                            value={oraAperturaPomeriggio}
                            onChange={(e) => setOraAperturaPomeriggio(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                          >
                            {TIME_SLOTS.map((t) => (
                              <option key={`pm-in-${t}`} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 block">Sera: Chiusura</label>
                          <select
                            value={oraChiusuraPomeriggio}
                            onChange={(e) => setOraChiusuraPomeriggio(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                          >
                            {TIME_SLOTS.map((t) => (
                              <option key={`pm-out-${t}`} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {orarioTipo === 'continuato' && (
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200 dark:border-slate-700/80">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 block">Apertura</label>
                        <select
                          value={oraAperturaContinuato}
                          onChange={(e) => setOraAperturaContinuato(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                        >
                          {TIME_SLOTS.map((t) => (
                            <option key={`cont-in-${t}`} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 block">Chiusura</label>
                        <select
                          value={oraChiusuraContinuato}
                          onChange={(e) => setOraChiusuraContinuato(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                        >
                          {TIME_SLOTS.map((t) => (
                            <option key={`cont-out-${t}`} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Risultato orario generato */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-[11px]">
                    <span className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Orario inserito:</span>
                    </span>
                    <span className="font-black text-amber-950 dark:text-amber-100 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-amber-300 dark:border-amber-700">
                      {formData.orari || 'Non specificato'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Indirizzo a Villaggio Prenestino *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="es. Via Fosso dell'Osa 120"
                    value={formData.indirizzo}
                    onChange={(e) => setFormData({ ...formData, indirizzo: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Descrizione Attività e Specialità
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Descrivi cosa offri ai residenti del quartiere..."
                    value={formData.descrizione}
                    onChange={(e) => setFormData({ ...formData, descrizione: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Dati Referente per la verifica admin */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                    Recapito Titolare / Referente per Notifica Approvazione
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Nome e Cognome titolare"
                      value={formData.nomeReferente || ''}
                      onChange={(e) => setFormData({ ...formData, nomeReferente: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                    <input
                      type="email"
                      placeholder="Email o cellulare referente"
                      value={formData.emailReferente || ''}
                      onChange={(e) => setFormData({ ...formData, emailReferente: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Sezione Offerta Speciale Opzionale */}
                <div className="p-3.5 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 rounded-2xl space-y-2.5">
                  <div className="flex items-center gap-1.5 font-bold text-amber-950 dark:text-amber-200">
                    <Tag className="w-4 h-4 text-amber-600" />
                    <span>Offerta Speciale per i Residenti (Opzionale)</span>
                  </div>

                  {/* Chiarimento vincolante: non modificabile, valida sempre e solo per chi mostra l'app in negozio */}
                  <div className="p-2.5 bg-amber-100/80 dark:bg-amber-900/40 rounded-xl border border-amber-300/80 dark:border-amber-700/60 text-[11px] text-amber-950 dark:text-amber-200 leading-relaxed space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-300">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Condizioni dell'Offerta Speciale:</span>
                    </div>
                    <p>
                      L'offerta speciale <strong>non potrà essere modificata</strong> successivamente, quindi dovrà essere <strong>valida sempre e solo per chi mostra l'app in negozio</strong>.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Titolo dell'Offerta
                    </label>
                    <input
                      type="text"
                      placeholder="es. Sconto 10% sulla spesa per chi mostra l'App"
                      value={formData.offertaTitolo}
                      onChange={(e) => setFormData({ ...formData, offertaTitolo: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Dettaglio dell'Offerta
                    </label>
                    <input
                      type="text"
                      placeholder="es. Valido sempre alla cassa mostrando l'app su smartphone (non cumulabile)"
                      value={formData.offertaDettaglio}
                      onChange={(e) => setFormData({ ...formData, offertaDettaglio: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleCloseRegisterModal}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold cursor-pointer"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#781816] hover:bg-[#5a1210] active:scale-95 text-white rounded-xl font-bold flex items-center gap-2 shadow-md cursor-pointer transition"
                  >
                    <Send className="w-4 h-4" />
                    <span>Invia Richiesta per Approvazione</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
