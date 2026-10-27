import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { geocodeAndValidateAddress } from '../utils/geocodingUtils';
import { getShopOpeningStatus } from '../utils/openingHoursUtils';
import { 
  AttivitaCommercio, 
  CategoriaCommercio, 
  EventoQuartiere,
  NuovaAttivitaForm 
} from '../types';
import { MappaQuartiere } from './MappaQuartiere';
import { GestioneTitolareModal } from './GestioneTitolareModal';
import { GraficoOrariSettimana } from './GraficoOrariSettimana';
import { OrariEditorAvanzato } from './OrariEditorAvanzato';
import { compressImage } from '../utils/imageCompressor';
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
  ChevronDown,
  KeyRound,
  Info,
  Percent,
  Loader2,
} from 'lucide-react';
import { CommercioSkeletonGrid } from './SkeletonLoaders';
import { BannerOffertaCommercio } from './BannerOffertaCommercio';
import { ProgressiveImage } from './common/ProgressiveImage';

interface CommercioTabProps {
  attivita: AttivitaCommercio[];
  eventi: EventoQuartiere[];
  votedAttivita?: number[];
  onVoteAttivita: (attivita: AttivitaCommercio) => void;
  onAggiungiAttivita: (nuova: AttivitaCommercio) => void;
  onUpdateAttivita?: (id: number, updatedData: Partial<AttivitaCommercio>) => void;
  onApprovaAttivita?: (id: number) => void;
  darkMode?: boolean;
  loading?: boolean;
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
    label: 'Ristorazione',
    emoji: '🍕',
    dotBg: 'bg-amber-600',
    activeClass: 'bg-amber-600 text-white shadow-sm border-amber-600 ring-2 ring-amber-500/30',
    inactiveClass: 'bg-amber-50/80 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-amber-300/80 dark:border-amber-800 hover:bg-amber-100/80 dark:hover:bg-amber-900/50',
    activeBadge: 'bg-white/20 text-white',
    inactiveBadge: 'bg-amber-200/70 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200',
  },
  salute: {
    label: 'Farmacie & salute',
    emoji: '💊',
    dotBg: 'bg-rose-600',
    activeClass: 'bg-rose-600 text-white shadow-sm border-rose-600 ring-2 ring-rose-500/30',
    inactiveClass: 'bg-rose-50/80 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border-rose-300/80 dark:border-rose-800 hover:bg-rose-100/80 dark:hover:bg-rose-900/50',
    activeBadge: 'bg-white/20 text-white',
    inactiveBadge: 'bg-rose-200/70 dark:bg-rose-900/60 text-rose-900 dark:text-rose-200',
  },
  artigiani: {
    label: 'Artigiani',
    emoji: '🔨',
    dotBg: 'bg-purple-600',
    activeClass: 'bg-purple-600 text-white shadow-sm border-purple-600 ring-2 ring-purple-500/30',
    inactiveClass: 'bg-purple-50/80 dark:bg-purple-950/30 text-purple-800 dark:text-purple-300 border-purple-300/80 dark:border-purple-800 hover:bg-purple-100/80 dark:hover:bg-purple-900/50',
    activeBadge: 'bg-white/20 text-white',
    inactiveBadge: 'bg-purple-200/70 dark:bg-purple-900/60 text-purple-900 dark:text-purple-200',
  },
  servizi_persona: {
    label: 'Servizi alla persona',
    emoji: '💇',
    dotBg: 'bg-indigo-600',
    activeClass: 'bg-indigo-600 text-white shadow-sm border-indigo-600 ring-2 ring-indigo-500/30',
    inactiveClass: 'bg-indigo-50/80 dark:bg-indigo-950/30 text-indigo-800 dark:text-indigo-300 border-indigo-300/80 dark:border-indigo-800 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/50',
    activeBadge: 'bg-white/20 text-white',
    inactiveBadge: 'bg-indigo-200/70 dark:bg-indigo-900/60 text-indigo-900 dark:text-indigo-200',
  },
  servizi_animali: {
    label: 'Servizi per animali',
    emoji: '🐾',
    dotBg: 'bg-teal-600',
    activeClass: 'bg-teal-600 text-white shadow-sm border-teal-600 ring-2 ring-teal-500/30',
    inactiveClass: 'bg-teal-50/80 dark:bg-teal-950/30 text-teal-800 dark:text-teal-300 border-teal-300/80 dark:border-teal-800 hover:bg-teal-100/80 dark:hover:bg-teal-900/50',
    activeBadge: 'bg-white/20 text-white',
    inactiveBadge: 'bg-teal-200/70 dark:bg-teal-900/60 text-teal-900 dark:text-teal-200',
  },
  casa: {
    label: 'Casa, fai da te & hobby',
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
  onUpdateAttivita,
  onApprovaAttivita,
  darkMode,
  loading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoriaCommercio>('tutti');
  const [onlyOffers, setOnlyOffers] = useState(false);
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [selectedAttivitaId, setSelectedAttivitaId] = useState<number | null>(null);
  const [mapCategoryFilter, setMapCategoryFilter] = useState<CategoriaCommercio | 'tutti'>('tutti');
  
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

  // Progressive disclosure: banner informativo espandibile e card accordion dettagli
  const [showHeroDetails, setShowHeroDetails] = useState(false);
  const [expandedShopIds, setExpandedShopIds] = useState<number[]>([]);

  const toggleShopExpanded = (shopId: number) => {
    setExpandedShopIds((prev) =>
      prev.includes(shopId) ? prev.filter((id) => id !== shopId) : [...prev, shopId]
    );
  };

  // Modale di gestione riservata per il titolare (con PIN)
  const [shopForManagement, setShopForManagement] = useState<AttivitaCommercio | null>(null);
  const [isManagementOpen, setIsManagementOpen] = useState(false);

  // Foto / Logo caricato dal commerciante in formato JPG
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.8,
        mimeType: 'image/jpeg',
      });
      setUploadedImage(compressed);
    } catch {
      // Fallback
      const reader = new FileReader();
      reader.onload = (event) => {
        const res = event.target?.result as string;
        if (res) {
          setUploadedImage(res);
        }
      };
      reader.readAsDataURL(file);
    }
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

  // Geocoding & Indirizzo 3km validation states
  const [regAddressChecking, setRegAddressChecking] = useState(false);
  const [regAddressValid, setRegAddressValid] = useState(true);
  const [regAddressError, setRegAddressError] = useState<string | null>(null);
  const [regAddressDistance, setRegAddressDistance] = useState<number | null>(null);
  const [regGeocodedLat, setRegGeocodedLat] = useState<number>(41.8985);
  const [regGeocodedLng, setRegGeocodedLng] = useState<number>(12.6865);

  useEffect(() => {
    if (!formData.indirizzo.trim()) {
      setRegAddressValid(true);
      setRegAddressError(null);
      setRegAddressChecking(false);
      return;
    }

    setRegAddressChecking(true);
    const timer = setTimeout(async () => {
      const result = await geocodeAndValidateAddress(formData.indirizzo);
      setRegAddressChecking(false);
      if (result.isValid) {
        setRegAddressValid(true);
        setRegAddressError(null);
        setRegAddressDistance(result.distanceKm);
        setRegGeocodedLat(result.lat);
        setRegGeocodedLng(result.lng);
      } else {
        setRegAddressValid(false);
        setRegAddressError(result.errorMsg || "L'indirizzo deve trovarsi entro 3 km da Via Fosso dell'Osa 507, Roma.");
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [formData.indirizzo]);

  // Stato per gli orari strutturati e dettagliati giorno per giorno
  const [regOrarioDettagliato, setRegOrarioDettagliato] = useState<{ [giornoKey: string]: string }>({});

  const handleRegOrariChange = useCallback((result: { orariText: string; orarioDettagliato: { [key: string]: string } }) => {
    setFormData((prev) => (prev.orari === result.orariText ? prev : { ...prev, orari: result.orariText }));
    setRegOrarioDettagliato((prev) => {
      const prevKeys = Object.keys(prev || {});
      const nextKeys = Object.keys(result.orarioDettagliato || {});
      if (prevKeys.length === nextKeys.length && prevKeys.every((k) => prev[k] === result.orarioDettagliato[k])) {
        return prev;
      }
      return result.orarioDettagliato;
    });
  }, []);

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
          if (!(selectedCategory === 'servizi_persona' && (shop.categoria as string) === 'servizi')) {
            return false;
          }
        }
        // Solo offerte
        if (onlyOffers && !shop.offertaAttiva) {
          return false;
        }
        // Solo aperte ora (calcolato dinamicamente sugli orari e giorni reali)
        if (onlyOpen && !getShopOpeningStatus(shop).isOpen) {
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

    if (!regAddressValid) {
      alert(regAddressError || 'L\'indirizzo specificato dev\'essere entro 3 km da Via Fosso dell\'Osa 507, Roma.');
      return;
    }

    const newShop: AttivitaCommercio = {
      id: Date.now(),
      nome: formData.nome.trim(),
      categoria: formData.categoria,
      indirizzo: formData.indirizzo.includes('Villaggio Prenestino') 
        ? formData.indirizzo.trim() 
        : `${formData.indirizzo.trim()}, Villaggio Prenestino, Roma`,
      lat: regGeocodedLat,
      lng: regGeocodedLng,
      telefono: formData.telefono.trim() || '06 2244 0000',
      whatsapp: formData.whatsapp.replace(/\D/g, ''),
      orari: formData.orari.trim() || 'Lun-Sab 09:00 - 19:30',
      orarioDettagliato: regOrarioDettagliato,
      apertoOra: true,
      verificato: false,
      recensioneVoto: 5.0,
      miPiace: 1,
      statoApprovazione: 'in_attesa', // Inviata in moderazione all'amministratore WordPress
      inviataDaMe: true,
      pinGestione: formData.pinGestione?.trim() || '1234',
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
    setRegOrarioDettagliato({});
  };

  const scrollToVetrina = () => {
    const el = document.getElementById('commercianti-vetrina-heading');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-5 pb-20 animate-fadeIn">
      {/* HERO BANNER ROSSO (Uniforme a tutte le schede) */}
      <section
        className="rounded-3xl p-5 sm:p-7 text-white shadow-lg border border-black/10 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #781816 0%, #5a1210 100%)',
        }}
      >
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="max-w-xl">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider mb-2">
                Economia Locale
              </span>
              <h2 className="text-xl sm:text-2xl font-black leading-tight text-white tracking-tight">
                Commercio di Quartiere
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-white/90 leading-relaxed">
                Sostieni le attività e i negozi di vicinato di Villaggio Prenestino.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto shrink-0 mt-3 sm:mt-0">
              <button
                type="button"
                onClick={() => {
                  setRegisterSuccess(false);
                  setIsRegisterModalOpen(true);
                }}
                className="w-full sm:w-auto px-4 py-2.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-slate-950" />
                <span>Iscrivi attività</span>
              </button>

              <button
                type="button"
                onClick={() => setShowHeroDetails((prev) => !prev)}
                className="w-full sm:w-auto px-4 py-2.5 bg-white/15 hover:bg-white/25 active:bg-white/30 text-white font-bold text-xs sm:text-sm rounded-xl border border-white/25 transition flex items-center justify-center gap-1.5 cursor-pointer"
                aria-expanded={showHeroDetails}
              >
                <span>Come funziona</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showHeroDetails ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Dettagli espandibili a richiesta (Progressive Disclosure) */}
          {showHeroDetails && (
            <div className="mt-3.5 pt-3.5 border-t border-white/15 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-white/90 animate-fadeIn">
              <div className="p-2.5 rounded-xl bg-black/20 border border-white/10">
                <strong className="block text-amber-300 font-bold mb-0.5">Iscrizione Gratuita</strong>
                <span>Registra la tua vetrina in pochi passi per farti trovare dai residenti del quartiere.</span>
              </div>
              <div className="p-2.5 rounded-xl bg-black/20 border border-white/10">
                <strong className="block text-amber-300 font-bold mb-0.5">Contatto Diretto</strong>
                <span>Pulsanti rapidi WhatsApp, telefono e mappa su Google Maps senza intermediari.</span>
              </div>
              <div className="p-2.5 rounded-xl bg-black/20 border border-white/10">
                <strong className="block text-amber-300 font-bold mb-0.5">Gestione con PIN</strong>
                <span>Aggiorna offerte e orari quando vuoi inserendo il tuo codice PIN personale.</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SELETTORE VISTA (MAPPA / ELENCO) - Ingombro compatto */}
      <div className="flex items-center justify-center p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs max-w-fit mx-auto">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setViewMode('both')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'both'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Mappa & Vetrina</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('map-only')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'map-only'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Map className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Solo Mappa</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list-only')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'list-only'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <List className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Solo Vetrina</span>
          </button>
        </div>
      </div>

      {/* MAPPA INTERATTIVA GOOGLE MAPS */}
      {viewMode !== 'list-only' && (
        <section className="space-y-2.5">

          <MappaQuartiere
            attivita={attivita}
            categoriaFilter={mapCategoryFilter}
            onCategoriaFilterChange={(cat) => setMapCategoryFilter(cat)}
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
            onOpenManagement={(shop) => {
              setShopForManagement(shop);
              setIsManagementOpen(true);
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

              {/* Toggles rapidi: Offerte attive & Aperto ora (su mobile verticale: griglia a 2 colonne full-width allineata alle categorie) */}
              <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setOnlyOffers(!onlyOffers)}
                  aria-pressed={onlyOffers}
                  className={`w-full px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 min-h-[42px] border transition-all duration-150 cursor-pointer select-none ${
                    onlyOffers
                      ? 'bg-teal-600 text-white dark:bg-teal-500 dark:text-slate-950 border-teal-600 dark:border-teal-400 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750'
                  }`}
                >
                  <Percent className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
                  <span className="truncate">Con Offerte</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOnlyOpen(!onlyOpen)}
                  aria-pressed={onlyOpen}
                  className={`w-full px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 min-h-[42px] border transition-all duration-150 cursor-pointer select-none ${
                    onlyOpen
                      ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950 border-emerald-600 dark:border-emerald-400 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Aperti Ora</span>
                </button>
              </div>
            </div>

            {/* SEZIONE FILTRO PER CATEGORIA (RESPONSIVE, FULL VISIBILITY, ZERO TRONCAMENTI) */}
            <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Categoria</span>
                  </span>
                  {selectedCategory !== 'tutti' ? (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      Attivo: <span className="font-bold">{CATEGORIA_CONFIG[selectedCategory]?.label || selectedCategory}</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400 hidden sm:inline">
                      (Tutte le 7 categorie visibili)
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
                {(Object.keys(CATEGORIA_CONFIG) as CategoriaCommercio[]).map((catId) => {
                  const conf = CATEGORIA_CONFIG[catId] || CATEGORIA_CONFIG.tutti;
                  const isActive = selectedCategory === catId;
                  const count = catId === 'tutti' 
                    ? attivita.filter(a => a.statoApprovazione !== 'in_attesa' || a.inviataDaMe).length
                    : attivita.filter(a => (a.categoria === catId || (catId === 'servizi_persona' && (a.categoria as string) === 'servizi')) && (a.statoApprovazione !== 'in_attesa' || a.inviataDaMe)).length;

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
          {loading ? (
            <CommercioSkeletonGrid count={6} />
          ) : visibleAttivita.length === 0 ? (
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
                const isExpanded = expandedShopIds.includes(shop.id);
                const openStatus = getShopOpeningStatus(shop);

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
                      {/* Immagine con badge classifica e categoria - Cliccabile per aprire il popup della mappa */}
                      <div 
                        onClick={() => {
                          setSelectedAttivitaId(shop.id);
                          // Se la mappa è nascosta (solo vetrina), attivala o scrolla in alto
                          if (viewMode === 'list-only') {
                            setViewMode('both');
                          }
                          const mapEl = document.getElementById('commercio-mappa-sezione');
                          if (mapEl) {
                            mapEl.scrollIntoView({ behavior: 'smooth' });
                          } else {
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }
                        }}
                        className="relative h-44 overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer group"
                        title="Clicca per aprire la scheda dettagliata sulla mappa"
                      >
                        <ProgressiveImage
                          src={shop.immagine}
                          alt={shop.nome}
                          className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                          containerClassName="w-full h-full"
                        />
                        {/* Sfumatura leggera non invasiva che mantiene logo e foto nitidi e luminosi */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/15 pointer-events-none" />

                        {/* Badge Posizione Classifica "Mi piace" */}
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 pointer-events-none">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black shadow-md ${
                            isTop1
                              ? 'bg-amber-400 text-slate-950 border border-amber-300'
                              : isTop3
                              ? 'bg-amber-100 text-amber-950 border border-amber-300'
                              : 'bg-black/75 backdrop-blur-xs text-white border border-white/20'
                          }`}>
                            <Award className="w-3.5 h-3.5" />
                            <span>#{globalIndex + 1} Più Consigliata</span>
                          </span>
                        </div>

                        {/* Stato apertura in tempo reale ad alta leggibilità */}
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 pointer-events-none">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black shadow-md border backdrop-blur-md transition-all select-none ${
                              openStatus.isOpen
                                ? 'bg-emerald-600/95 text-white border-emerald-400/50 ring-1 ring-emerald-500/30'
                                : openStatus.isPaused
                                ? 'bg-amber-500 text-slate-950 border-amber-300 ring-1 ring-amber-400/40'
                                : openStatus.isFerie
                                ? 'bg-amber-600 text-white border-amber-400/50 ring-1 ring-amber-500/30'
                                : 'bg-rose-600 text-white border-rose-400/60 ring-2 ring-rose-500/40 shadow-rose-950/40'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                openStatus.isOpen
                                  ? 'bg-emerald-200 animate-pulse'
                                  : openStatus.isPaused
                                  ? 'bg-slate-950'
                                  : openStatus.isFerie
                                  ? 'bg-amber-200'
                                  : 'bg-white'
                              }`}
                            />
                            <span className="tracking-tight">{openStatus.statusText}</span>
                          </span>
                        </div>

                        {/* Targhetta Titolo e Indirizzo in vetro satinato ad alto contrasto protetto */}
                        <div className="absolute bottom-2 left-2 right-2 p-2 sm:p-2.5 rounded-2xl bg-black/60 dark:bg-black/75 backdrop-blur-md border border-white/20 text-white pointer-events-none shadow-lg transition-colors group-hover:bg-black/70">
                          <div className="flex items-center justify-between gap-1.5 mb-0.5">
                            <h4 className="font-black text-sm sm:text-base leading-tight text-white drop-shadow-sm line-clamp-1 group-hover:underline">
                              {shop.nome}
                            </h4>
                            {shop.verificato ? (
                              <span title="Verificato dall'Associazione" className="shrink-0">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              </span>
                            ) : shop.statoApprovazione === 'in_attesa' ? (
                              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-amber-400 text-slate-950 flex items-center gap-0.5 shrink-0" title="In attesa di approvazione">
                                <Clock className="w-2.5 h-2.5 text-slate-950" />
                                <span>In attesa</span>
                              </span>
                            ) : null}
                          </div>
                          <p className="text-[11px] sm:text-xs font-semibold text-slate-200 flex items-center gap-1 drop-shadow-xs truncate">
                            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
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
                              try {
                                if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                                  navigator.vibrate([35]);
                                }
                              } catch {}
                              onVoteAttivita(shop);
                            }}
                            disabled={hasVoted}
                            className={`w-full py-2.5 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all duration-150 select-none shadow-xs cursor-pointer ${
                              hasVoted
                                ? 'bg-amber-100/90 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300/80 dark:border-amber-700/60 cursor-default animate-heartbeat'
                                : 'bg-[#781816] hover:bg-[#5a1210] active:scale-90 text-white hover:shadow-md'
                            }`}
                            title={hasVoted ? 'Hai già consigliato questa attività (+2 Punti Civici registrati)' : 'Esprimi Mi piace per consigliare questa attività ai vicini (+2 Punti Civici)'}
                          >
                            <ThumbsUp className={`w-4 h-4 shrink-0 transition-transform ${hasVoted ? 'fill-amber-800 dark:fill-amber-300 scale-110' : ''}`} />
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

                        {/* Offerta attiva visibile se presente */}
                        {shop.offertaAttiva && (
                          <BannerOffertaCommercio
                            offerta={shop.offertaAttiva}
                            isDark={darkMode}
                          />
                        )}

                        {/* COMPONENTE ACCORDION / COLLAPSIBLE PER DETTAGLI, ORARI E CONTATTI */}
                        <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => toggleShopExpanded(shop.id)}
                            className="w-full py-2.5 px-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold transition flex items-center justify-between cursor-pointer border border-slate-200/90 dark:border-slate-700/80 shadow-2xs"
                            aria-expanded={isExpanded}
                          >
                            <span className="flex items-center gap-1.5">
                              <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                              <span>{isExpanded ? 'Nascondi dettagli e contatti' : 'Dettagli, orari e contatti'}</span>
                            </span>
                            <ChevronDown
                              className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                                isExpanded ? 'rotate-180 text-amber-600 dark:text-amber-400' : ''
                              }`}
                            />
                          </button>

                          {/* Sezione Espandibile Collapsible */}
                          {isExpanded && (
                            <div className="mt-3 space-y-3 pt-1 animate-fadeIn">
                              {/* Descrizione completa */}
                              {shop.descrizione && (
                                <div className="space-y-1">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                    Chi siamo & Descrizione:
                                  </span>
                                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                    {shop.descrizione}
                                  </p>
                                </div>
                              )}

                              {/* Presentazione grafica intuitiva di orari e giorni della settimana */}
                              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                                <GraficoOrariSettimana shop={shop} darkMode={darkMode} />
                                <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <a href={`tel:${shop.telefono}`} className="hover:text-slate-900 dark:hover:text-white underline font-semibold">
                                      {shop.telefono}
                                    </a>
                                  </div>
                                </div>
                              </div>

                              {/* Azioni contatti: WhatsApp / Chiama e Percorso */}
                              <div className="grid grid-cols-2 gap-2">
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

                              {/* Tasto Condividi Attività */}
                              <button
                                type="button"
                                onClick={() => handleShareShopOffer(shop)}
                                className="w-full py-1.5 px-3 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center justify-center gap-1.5 transition cursor-pointer"
                              >
                                <Share2 className="w-3 h-3 text-slate-500" />
                                <span>
                                  {copiedShareId === shop.id ? 'Aperto WhatsApp!' : 'Condividi con i residenti'}
                                </span>
                              </button>

                              {/* Box simulazione approvazione WordPress se in attesa */}
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

                              {/* Gestione con PIN per il titolare */}
                              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShopForManagement(shop);
                                    setIsManagementOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1.5 text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer group"
                                  title="Sei il titolare? Inserisci il tuo PIN per aggiornare orari, contatti e promozioni in corso"
                                >
                                  <KeyRound className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-500 transition-colors shrink-0" />
                                  <span className="underline decoration-slate-300 dark:decoration-slate-700 group-hover:decoration-amber-500 underline-offset-2">
                                    Sei il titolare? Gestisci scheda
                                  </span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
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


      {/* MODALE REGISTRAZIONE COMMERCIANTE CON GESTIONE APPROVAZIONE WORDPRESS */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-20 pb-6 px-3 sm:px-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full max-h-[85vh] sm:max-h-[88vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4 relative animate-scaleUp">
            
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
              <div className="py-2 space-y-3.5 text-center">
                {/* Icona & Badge Stato */}
                <div className="w-14 h-14 bg-amber-100 dark:bg-amber-950/80 border-2 border-amber-300 dark:border-amber-700 rounded-2xl flex items-center justify-center mx-auto text-amber-800 dark:text-amber-300 shadow-md">
                  <Hourglass className="w-7 h-7 text-amber-700 animate-pulse" />
                </div>

                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 mb-1.5">
                    In Attesa di Approvazione
                  </span>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                    Attività Inviata con Successo!
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-sm mx-auto">
                    La scheda verrà verificata dall'amministratore prima della pubblicazione nella vetrina e sulla mappa.
                  </p>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 mt-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-[11px] font-semibold text-teal-800 dark:text-teal-200 shadow-2xs">
                    <Mail className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span>Notifica email recapitata a <strong>associazione@villaggioprenestino.it</strong></span>
                  </div>
                </div>

                {/* PROCEDURA DI APPROVAZIONE IN 3 PASSI */}
                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3 border border-slate-200 dark:border-slate-700 text-left space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    {/* Passo 1 */}
                    <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 rounded-xl p-2 text-center">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto mb-0.5" />
                      <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 block">1. Inviata</span>
                    </div>

                    {/* Passo 2 */}
                    <div className="bg-amber-50 dark:bg-amber-950/60 border-2 border-amber-400 rounded-xl p-2 text-center shadow-2xs">
                      <Hourglass className="w-4 h-4 text-amber-600 animate-spin mx-auto mb-0.5" />
                      <span className="text-[11px] font-black text-amber-900 dark:text-amber-200 block">2. In Verifica</span>
                    </div>

                    {/* Passo 3 */}
                    <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-center opacity-70">
                      <Store className="w-4 h-4 text-slate-400 mx-auto mb-0.5" />
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">3. Online</span>
                    </div>
                  </div>
                </div>

                {/* Riepilogo scheda inviata */}
                {submittedShop && (
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-left text-xs space-y-0.5">
                    <p className="font-bold text-slate-900 dark:text-white text-sm">
                      {submittedShop.nome}
                    </p>
                    <p className="text-slate-600 dark:text-slate-300 flex items-center gap-1 text-[11px]">
                      <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                      <span>{submittedShop.indirizzo}</span>
                    </p>
                  </div>
                )}

                {/* Tasto di Chiusura */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleCloseRegisterModal}
                    className="w-full py-2.5 px-4 bg-[#781816] hover:bg-[#5a1210] active:scale-98 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Ho capito, Chiudi</span>
                  </button>
                </div>
              </div>
            ) : (
              /* FORM DI INSERIMENTO NUOVA ATTIVITÀ */
              <form onSubmit={handleFormSubmit} className="space-y-3.5 text-xs">
                {/* Intestazione essenziale con badge compatto */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-950 dark:text-white">
                      Iscrivi la tua Attività
                    </h3>
                    <p className="text-xs text-slate-500">
                      Vetrina gratuita per i negozi e le attività di Villaggio Prenestino.
                    </p>
                  </div>
                  <span className="self-start sm:self-auto px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 whitespace-nowrap">
                    Iscrizione Gratuita • Moderazione Rapida
                  </span>
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
                      <option value="alimentari">🍞 Alimentari</option>
                      <option value="ristorazione">🍕 Ristorazione</option>
                      <option value="salute">💊 Farmacie & salute</option>
                      <option value="artigiani">🔨 Artigiani</option>
                      <option value="servizi_persona">💇 Servizi alla persona</option>
                      <option value="servizi_animali">🐾 Servizi per animali</option>
                      <option value="casa">🏡 Casa, fai da te & hobby</option>
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

                {/* CARICAMENTO LOGO O FOTO (COMPATTO) */}
                <div className="space-y-1.5 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs">
                      <Camera className="w-3.5 h-3.5 text-amber-600" />
                      <span>Foto o Logo del Negozio</span>
                    </label>
                    <span className="text-[10px] text-slate-400">JPG, PNG (max 5MB)</span>
                  </div>

                  {uploadedImage ? (
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 h-28 bg-slate-100 dark:bg-slate-900 group">
                      <img
                        src={uploadedImage}
                        alt="Anteprima Foto/Logo Negozio"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/45 flex items-center justify-center gap-2">
                        <label className="px-2.5 py-1 bg-white text-slate-900 rounded-lg text-xs font-bold shadow-md cursor-pointer hover:bg-slate-100 flex items-center gap-1">
                          <Upload className="w-3 h-3" />
                          <span>Cambia</span>
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
                          className="px-2.5 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer hover:bg-rose-700 flex items-center gap-1"
                        >
                          <X className="w-3 h-3" />
                          <span>Rimuovi</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-amber-300 dark:border-amber-700/60 hover:border-amber-500 rounded-xl p-3 flex items-center justify-center gap-2.5 cursor-pointer bg-amber-50/40 dark:bg-amber-950/20 transition group">
                      <Upload className="w-4 h-4 text-amber-600 shrink-0 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Carica foto facciata o logo (.jpg, .png)
                      </span>
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
                    Numero WhatsApp per contatto diretto (Opzionale)
                  </label>
                  <input
                    type="tel"
                    placeholder="es. 393401234567"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-900 dark:text-white"
                  />
                </div>

                {/* SELETTORE AVANZATO ORARI DI APERTURA & ECCEZIONI GIORNALIERE */}
                <div className="space-y-1">
                  <OrariEditorAvanzato
                    key="reg-orari-editor"
                    initialOrari={formData.orari}
                    initialOrarioDettagliato={regOrarioDettagliato}
                    onChange={handleRegOrariChange}
                    darkMode={darkMode}
                    showPreview={true}
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Indirizzo a Villaggio Prenestino *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="es. Via Fosso dell'Osa 507, Roma"
                    value={formData.indirizzo}
                    onChange={(e) => setFormData({ ...formData, indirizzo: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-900 dark:text-white"
                  />

                  {/* Feedback geolocalizzazione in tempo reale */}
                  {regAddressChecking && (
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-300 font-semibold pt-1">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                      <span>Verifica indirizzo e geolocalizzazione sulla mappa...</span>
                    </div>
                  )}

                  {!regAddressChecking && regAddressValid && formData.indirizzo.trim() && (
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-50 dark:bg-emerald-950/50 p-2 rounded-xl border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>
                        Indirizzo verificato a Villaggio Prenestino. Il pin verrà posizionato esattamente a questo indirizzo sulla mappa!
                      </span>
                    </div>
                  )}

                  {!regAddressChecking && !regAddressValid && (
                    <div className="flex items-start gap-1.5 text-[11px] text-rose-700 dark:text-rose-300 font-semibold bg-rose-50 dark:bg-rose-950/50 p-2 rounded-xl border border-rose-200 dark:border-rose-800">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                      <span>{regAddressError}</span>
                    </div>
                  )}
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
                      type="text"
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

                  {/* Chiarimento offerta e gestione con PIN */}
                  <div className="p-2.5 bg-teal-50 dark:bg-teal-950/40 rounded-xl border border-teal-200 dark:border-teal-700/60 text-[11px] text-teal-950 dark:text-teal-200 leading-relaxed space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-teal-900 dark:text-teal-300">
                      <Percent className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0 stroke-[2.5]" />
                      <span>Promozione di prossimità (%):</span>
                    </div>
                    <p>
                      L&apos;offerta sarà visibile a tutti i residenti di Villaggio Prenestino che mostrano l&apos;app in negozio. Potrai aggiornarla o modificarla in qualsiasi momento con il tuo PIN di gestione.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Titolo dell&apos;Offerta
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
                      Dettaglio dell&apos;Offerta
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

                {/* Sezione PIN di Gestione Riservato (Senza Registrazione) */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-xs">
                    <KeyRound className="w-4 h-4 text-amber-500" />
                    <span>PIN di Gestione Personale (Senza Registrazione Account)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    Scegli un codice PIN a 4 cifre per poter modificare in futuro la tua scheda, offerte, orari e contatti senza doverti registrare.
                  </p>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={8}
                    placeholder="Scegli un PIN a 4 cifre (es. 1234)"
                    value={formData.pinGestione || ''}
                    onChange={(e) => setFormData({ ...formData, pinGestione: e.target.value })}
                    className="w-full text-xs py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono tracking-widest focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                  <p className="text-[10px] text-slate-400">
                    Se lasciato vuoto, verrà impostato il PIN predefinito <strong>1234</strong>.
                  </p>
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

      {/* Modal di Gestione Riservata per il Titolare con PIN segreto */}
      <GestioneTitolareModal
        shop={shopForManagement}
        isOpen={isManagementOpen}
        onClose={() => setIsManagementOpen(false)}
        onSave={(id, updatedData) => {
          if (onUpdateAttivita) {
            onUpdateAttivita(id, updatedData);
          }
        }}
      />
    </div>
  );
};
