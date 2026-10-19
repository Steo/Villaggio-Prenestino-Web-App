import React, { useState, useEffect } from 'react';
import { APIProvider, Map, ColorScheme, useMap } from '@vis.gl/react-google-maps';
import { CustomMapPin } from './CustomMapPin';
import { CustomMapMarker } from './CustomMapMarker';
import { AttivitaCommercio, EventoQuartiere, CategoriaCommercio } from '../types';
import { 
  MapPin, 
  Navigation, 
  Crosshair, 
  Phone, 
  MessageCircle, 
  Clock, 
  Tag, 
  ExternalLink, 
  Filter, 
  KeyRound, 
  ShieldCheck, 
  Percent, 
  X,
} from 'lucide-react';

interface MappaQuartiereProps {
  attivita: AttivitaCommercio[];
  eventi?: EventoQuartiere[];
  selectedAttivitaId: number | null;
  onSelectAttivita: (id: number | null) => void;
  filterTipo?: 'tutti' | 'negozi' | 'eventi';
  onFilterChange?: (tipo: 'tutti' | 'negozi' | 'eventi') => void;
  categoriaFilter?: CategoriaCommercio | 'tutti';
  onCategoriaFilterChange?: (cat: CategoriaCommercio | 'tutti') => void;
  onOpenManagement?: (shop: AttivitaCommercio) => void;
  darkMode?: boolean;
}

// Centro geografico esatto di Villaggio Prenestino lungo Via Fosso dell'Osa
const VILLAGGIO_PRENESTINO_CENTER = {
  lat: 41.8985,
  lng: 12.6865
};

// Stile cartografico diurno per Google Maps:
// Nasconde specificamente i negozi e attività commerciali di Google Maps (poi.business)
// preservando invece fermate autobus (transit.station), linee e presidi civici/scolastici/sanitari
const LIGHT_MAP_STYLES = [
  // Disabilita tutte le attività commerciali terze di Google Maps
  {
    featureType: 'poi.business',
    stylers: [{ visibility: 'off' }],
  },
  // Disabilita le icone dei POI generici per evitare pin di negozi non categorizzati
  {
    featureType: 'poi',
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }],
  },
  // Mantieni e valorizza le fermate dei trasporti pubblici (autobus ATAC, tram, metro)
  {
    featureType: 'transit.station',
    stylers: [{ visibility: 'on' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.icon',
    stylers: [{ visibility: 'on' }],
  },
  {
    featureType: 'transit.line',
    stylers: [{ visibility: 'on' }],
  },
  // Mantieni parchi pubblici e presidi civici/scuole/ospedali
  {
    featureType: 'poi.park',
    stylers: [{ visibility: 'on' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.icon',
    stylers: [{ visibility: 'on' }],
  },
  {
    featureType: 'poi.government',
    stylers: [{ visibility: 'on' }],
  },
  {
    featureType: 'poi.medical',
    stylers: [{ visibility: 'on' }],
  },
  {
    featureType: 'poi.school',
    stylers: [{ visibility: 'on' }],
  },
];

// Stile cartografico notturno avanzato per Google Maps:
// Colori scuri della mappa (blu notte / slate profondo) in perfetta linea con il tema dark dell'app
const DARK_MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#0b1329' }] }, // Base blu notte scuro profondo
  { elementType: 'labels.text.stroke', stylers: [{ color: '#060a14' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f8fafc' }],
  },
  {
    featureType: 'administrative.neighborhood',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#cbd5e1' }],
  },
  // Esclusione mirata attività commerciali predefinite di Google Maps
  {
    featureType: 'poi.business',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#64748b' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#0c231a' }], // Verde smeraldo scuro notturno
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#34d399' }],
  },
  {
    featureType: 'poi.government',
    stylers: [{ visibility: 'on' }],
  },
  {
    featureType: 'poi.medical',
    stylers: [{ visibility: 'on' }],
  },
  {
    featureType: 'poi.school',
    stylers: [{ visibility: 'on' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#162238' }], // Strade in tonalità ardesia / blu notte
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#0b1329' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#cbd5e1' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#253754' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#111c2e' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#fbbf24' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#162238' }],
  },
  {
    featureType: 'transit.station',
    stylers: [{ visibility: 'on' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#cbd5e1' }],
  },
  {
    featureType: 'transit.line',
    stylers: [{ visibility: 'on' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#060e1d' }], // Acqua blu notte oceanica
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#475569' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#060e1d' }],
  },
];

// Mappatura colori categorie per popup mappa: mantengono gli stessi colori del tema chiaro e dei pin SVG
const CATEGORIA_BADGE_STYLE: Record<
  CategoriaCommercio,
  { label: string; text: string; bg: string; border: string }
> = {
  alimentari: {
    label: 'Alimentari',
    text: 'text-emerald-700 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/60',
    border: 'border-emerald-300 dark:border-emerald-700/80',
  },
  ristorazione: {
    label: 'Ristorazione',
    text: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/60',
    border: 'border-amber-300 dark:border-amber-700/80',
  },
  salute: {
    label: 'Farmacie & salute',
    text: 'text-rose-700 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-950/60',
    border: 'border-rose-300 dark:border-rose-700/80',
  },
  artigiani: {
    label: 'Artigiani',
    text: 'text-purple-700 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-950/60',
    border: 'border-purple-300 dark:border-purple-700/80',
  },
  servizi_persona: {
    label: 'Servizi alla persona',
    text: 'text-indigo-700 dark:text-indigo-400',
    bg: 'bg-indigo-50 dark:bg-indigo-950/60',
    border: 'border-indigo-300 dark:border-indigo-700/80',
  },
  servizi_animali: {
    label: 'Servizi per animali',
    text: 'text-teal-700 dark:text-teal-400',
    bg: 'bg-teal-50 dark:bg-teal-950/60',
    border: 'border-teal-300 dark:border-teal-700/80',
  },
  casa: {
    label: 'Casa, fai da te & hobby',
    text: 'text-sky-700 dark:text-sky-400',
    bg: 'bg-sky-50 dark:bg-sky-950/60',
    border: 'border-sky-300 dark:border-sky-700/80',
  },
  tutti: {
    label: 'Tutte',
    text: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/60',
    border: 'border-amber-300 dark:border-amber-700/80',
  },
};

// Componente child per sincronizzare reattivamente le opzioni notte e stili su Google Maps instance
const MapNightThemeSync: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    try {
      // In Google Maps JS API v3.55+:
      // @ts-ignore
      if (window.google?.maps?.ColorScheme) {
        // @ts-ignore
        map.setOptions({
          // @ts-ignore
          colorScheme: isDark ? window.google.maps.ColorScheme.DARK : window.google.maps.ColorScheme.LIGHT,
        });
      }
      map.setOptions({
        styles: isDark ? DARK_MAP_STYLES : LIGHT_MAP_STYLES,
      });
    } catch (e) {
      console.warn('Map night theme sync error:', e);
    }
  }, [map, isDark]);

  return null;
};

export const MappaQuartiere: React.FC<MappaQuartiereProps> = ({
  attivita,
  eventi,
  selectedAttivitaId,
  onSelectAttivita,
  filterTipo,
  onFilterChange,
  categoriaFilter = 'tutti',
  onCategoriaFilterChange,
  onOpenManagement,
  darkMode,
}) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const [selectedItem, setSelectedItem] = useState<{
    tipo: 'negozio';
    negozio: AttivitaCommercio;
  } | null>(null);

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState(VILLAGGIO_PRENESTINO_CENTER);
  const [mapZoom, setMapZoom] = useState(15);

  // Animazione 'bounce' e 'scale' all'attivazione o cambio categoria filtro
  const [bouncingCategory, setBouncingCategory] = useState<string | null>(null);

  useEffect(() => {
    if (categoriaFilter) {
      setBouncingCategory(categoriaFilter);
      const timer = setTimeout(() => {
        setBouncingCategory(null);
      }, 850);
      return () => clearTimeout(timer);
    }
  }, [categoriaFilter]);

  // Rileva Dark Mode sia dalla prop darkMode sia dalla classe 'dark' sul document root
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof darkMode === 'boolean') return darkMode;
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    if (typeof darkMode === 'boolean') {
      setIsDark(darkMode);
      return;
    }

    const checkDark = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkDark();

    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, [darkMode]);

  // Sync external selected shop with map
  useEffect(() => {
    if (selectedAttivitaId) {
      const shop = attivita.find(a => a.id === selectedAttivitaId);
      if (shop) {
        setSelectedItem({ tipo: 'negozio', negozio: shop });
        setMapCenter({ lat: shop.lat, lng: shop.lng });
        setMapZoom(17);
      }
    }
  }, [selectedAttivitaId, attivita]);

  // Gestione tasto ESC per chiusura comoda del popup modale
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedItem) {
        setSelectedItem(null);
        onSelectAttivita(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItem, onSelectAttivita]);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocalizzazione non supportata dal tuo browser');
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
        setUserLocation(coords);
        setMapCenter(coords);
        setMapZoom(16);
        setGeoLoading(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setGeoError('Impossibile rilevare la posizione GPS. Verifica i permessi.');
        setGeoLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleOpenDirections = (address: string, lat?: number, lng?: number) => {
    const query = lat && lng ? `${lat},${lng}` : encodeURIComponent(address);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${query}`, '_blank');
  };

  const shopsByCategory = (categoriaFilter && categoriaFilter !== 'tutti')
    ? attivita.filter(a => a.categoria === categoriaFilter)
    : attivita;

  const visibleShops = shopsByCategory;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 shadow-sm transition-all">
      {/* Top Controls Overlay */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between gap-1.5 pointer-events-none">
        {/* Solo Filtro Categorie a ingombro minimo */}
        {onCategoriaFilterChange ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl shadow-md border border-slate-200/90 dark:border-slate-800 pointer-events-auto">
            <Filter className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <select
              value={categoriaFilter || 'tutti'}
              onChange={(e) => onCategoriaFilterChange(e.target.value as CategoriaCommercio | 'tutti')}
              className="text-xs font-bold bg-transparent text-slate-800 dark:text-slate-100 focus:outline-hidden cursor-pointer py-0.5 pr-1 max-w-[155px] sm:max-w-none truncate"
              title="Filtra i pin sulla mappa per categoria"
              aria-label="Filtra per categoria"
            >
              <option value="tutti" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Tutte le attività ({attivita.length})</option>
              <option value="alimentari" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">🍞 Alimentari ({attivita.filter(a => a.categoria === 'alimentari').length})</option>
              <option value="ristorazione" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">🍕 Ristorazione ({attivita.filter(a => a.categoria === 'ristorazione').length})</option>
              <option value="salute" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">💊 Farmacie & salute ({attivita.filter(a => a.categoria === 'salute').length})</option>
              <option value="artigiani" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">🔨 Artigiani ({attivita.filter(a => a.categoria === 'artigiani').length})</option>
              <option value="servizi_persona" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">💇 Servizi alla persona ({attivita.filter(a => a.categoria === 'servizi_persona').length})</option>
              <option value="servizi_animali" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">🐾 Servizi per animali ({attivita.filter(a => a.categoria === 'servizi_animali').length})</option>
              <option value="casa" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">🏡 Casa, fai da te & hobby ({attivita.filter(a => a.categoria === 'casa').length})</option>
            </select>
          </div>
        ) : <div />}

        {/* Locate me button & Centra su Villaggio Prenestino Via Fosso dell'Osa */}
        <div className="flex items-center gap-1.5 pointer-events-auto shrink-0">
          <button
            type="button"
            onClick={handleLocateMe}
            disabled={geoLoading}
            title="Centra sulla mia posizione"
            className="flex items-center gap-1 px-2.5 py-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl shadow-md border border-slate-200/90 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Crosshair className={`w-3.5 h-3.5 text-blue-600 dark:text-blue-400 ${geoLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Vicino a me</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMapCenter(VILLAGGIO_PRENESTINO_CENTER);
              setMapZoom(15);
            }}
            title="Centra su Villaggio Prenestino (Via Fosso dell'Osa)"
            className="flex items-center gap-1 px-2.5 py-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl shadow-md border border-slate-200/90 dark:border-slate-800 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-all cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Via Fosso dell'Osa</span>
            <span className="sm:hidden text-[11px] font-bold">Centro</span>
          </button>
        </div>
      </div>

      {geoError && (
        <div className="absolute top-16 left-3 right-3 z-10 p-2 bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-200 shadow-md flex items-center justify-between">
          <span>{geoError}</span>
          <button onClick={() => setGeoError(null)} className="text-amber-900 dark:text-amber-200 font-bold ml-2">×</button>
        </div>
      )}

      {/* Google Maps Container */}
      <div className={`w-full h-[460px] sm:h-[520px] relative ${isDark ? 'map-night-theme' : 'map-light-theme'}`}>
        {apiKey ? (
          <APIProvider apiKey={apiKey} libraries={['marker']} version="weekly">
            <Map
              key={isDark ? 'dark-map' : 'light-map'}
              center={mapCenter}
              zoom={mapZoom}
              colorScheme={isDark ? ColorScheme.DARK : ColorScheme.LIGHT}
              styles={isDark ? DARK_MAP_STYLES : LIGHT_MAP_STYLES}
              clickableIcons={false}
              internalUsageAttributionIds={['gmp_git_agentskills_v1']}
              style={{ width: '100%', height: '100%' }}
              gestureHandling="greedy"
              disableDefaultUI={false}
              zoomControl={true}
              mapTypeControl={false}
              streetViewControl={false}
              fullscreenControl={true}
              onCameraChanged={(ev) => {
                setMapCenter(ev.detail.center);
                setMapZoom(ev.detail.zoom);
              }}
            >
              <MapNightThemeSync isDark={isDark} />

              {/* User Location Marker */}
              {userLocation && (
                <CustomMapMarker
                  position={userLocation}
                  zIndex={100}
                >
                  <div className="relative flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-6 h-6 bg-blue-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-[10px] animate-pulse">
                      📍
                    </div>
                    <div className="absolute w-8 h-8 rounded-full bg-blue-400 opacity-40 animate-ping -z-10" />
                  </div>
                </CustomMapMarker>
              )}

              {/* Business Markers con Pin Sagomato Personalizzato per Categoria e animazione bounce/scale */}
              {visibleShops.map((shop) => {
                const isSelected = selectedItem?.negozio?.id === shop.id;
                const isBouncingPin = Boolean(bouncingCategory && (bouncingCategory === 'tutti' || bouncingCategory === shop.categoria));

                return (
                  <CustomMapMarker
                    key={`shop-${shop.id}`}
                    position={{ lat: shop.lat, lng: shop.lng }}
                    zIndex={isSelected ? 50 : 20}
                    onClick={() => {
                      setSelectedItem({ tipo: 'negozio', negozio: shop });
                      onSelectAttivita(shop.id);
                    }}
                  >
                    <CustomMapPin
                      tipo={shop.categoria}
                      isSelected={isSelected}
                      hasOffer={Boolean(shop.offertaAttiva)}
                      label={shop.nome}
                      isBouncing={isBouncingPin}
                    />
                  </CustomMapMarker>
                );
              })}

            </Map>
          </APIProvider>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
            <MapPin className="w-12 h-12 text-slate-400 mb-2" />
            <h3 className="font-bold text-slate-800 dark:text-white text-base">Mappa di Quartiere</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
              Visualizza i commercianti, i negozi e i luoghi di ritrovo di Villaggio Prenestino.
            </p>
          </div>
        )}

        {/* Badge informativo discreto: solo attività locali e fermate */}
        <div className="absolute bottom-2.5 left-3 z-10 hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-lg shadow-xs border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="font-medium">Mappa quartiere: negozi Google nascosti • Solo commercianti locali & fermate ATAC</span>
        </div>
      </div>

      {/* POPUP MODALE CENTRATO AD ALTA LEGGIBILITÀ (Sostituisce il vecchio fumetto InfoWindow compresso) */}
      {selectedItem?.negozio && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs animate-fadeIn"
          onClick={() => {
            setSelectedItem(null);
            onSelectAttivita(null);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-shop-title"
        >
          <div
            className={`relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border transition-all flex flex-col max-h-[90vh] animate-scaleUp ${
              isDark 
                ? 'bg-[#0b1329] text-slate-100 border-slate-700/80' 
                : 'bg-white text-slate-900 border-slate-200'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Tasto X Chiudi in primo piano chiaro, luminoso e ad alto contrasto */}
            <button
              type="button"
              onClick={() => {
                setSelectedItem(null);
                onSelectAttivita(null);
              }}
              className="absolute top-3 right-3 z-30 p-2.5 rounded-full bg-white text-slate-900 shadow-xl border border-slate-200 hover:bg-slate-100 active:scale-90 transition cursor-pointer"
              title="Chiudi scheda"
              aria-label="Chiudi scheda attività"
            >
              <X className="w-5 h-5 stroke-[2.8]" />
            </button>

            {/* Immagine di copertina */}
            <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
              <img
                src={selectedItem.negozio.immagine || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80'}
                alt={selectedItem.negozio.nome}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

              {/* Badge Categoria ed eventuale Offerta Attiva */}
              <div className="absolute bottom-3 left-3 right-16 flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs uppercase font-black tracking-wider border shadow-sm ${
                  CATEGORIA_BADGE_STYLE[selectedItem.negozio.categoria]?.text || 'text-amber-300'
                } ${
                  CATEGORIA_BADGE_STYLE[selectedItem.negozio.categoria]?.bg || 'bg-black/60'
                } ${
                  CATEGORIA_BADGE_STYLE[selectedItem.negozio.categoria]?.border || 'border-amber-400/50'
                }`}>
                  {selectedItem.negozio.categoria}
                </span>

                {selectedItem.negozio.verificato && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-950/85 text-emerald-300 border border-emerald-500/50 shadow-sm backdrop-blur-xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Verificato</span>
                  </span>
                )}
              </div>
            </div>

            {/* Corpo con scroll interno fluido */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
              {/* Titolo e indirizzo */}
              <div>
                <h3 id="modal-shop-title" className={`text-xl sm:text-2xl font-black leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {selectedItem.negozio.nome}
                </h3>
                <div className="flex items-center gap-2 mt-1.5 text-xs sm:text-sm font-semibold">
                  <span className={`flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>{selectedItem.negozio.indirizzo}</span>
                  </span>
                </div>
              </div>

              {/* Box Offerta Esclusiva Residenti (se presente) */}
              {selectedItem.negozio.offertaAttiva && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-amber-500/15 border border-amber-500/40 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-black uppercase text-amber-600 dark:text-amber-400">
                    <Percent className="w-4 h-4" />
                    <span>Promozione Riservata ai Residenti</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {selectedItem.negozio.offertaAttiva.titolo}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {selectedItem.negozio.offertaAttiva.dettaglio}
                  </p>
                </div>
              )}

              {/* Orari di apertura */}
              <div className={`p-3 rounded-2xl border text-xs sm:text-sm flex items-start gap-2.5 ${
                isDark ? 'bg-slate-800/40 border-slate-700/80 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="block font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">Orari di Apertura</span>
                  <span className="font-semibold leading-relaxed">{selectedItem.negozio.orari}</span>
                </div>
              </div>

              {/* Descrizione dell'attività */}
              {selectedItem.negozio.descrizione && (
                <div className="space-y-1">
                  <span className="block font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">Presentazione</span>
                  <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {selectedItem.negozio.descrizione}
                  </p>
                </div>
              )}

              {/* Contatti Rapidi e Azioni */}
              <div className="pt-2 space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Chiama ora */}
                  {selectedItem.negozio.telefono && (
                    <a
                      href={`tel:${selectedItem.negozio.telefono.replace(/\s+/g, '')}`}
                      className="py-2.5 px-3.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition"
                    >
                      <Phone className="w-4 h-4" />
                      <span>Chiama: {selectedItem.negozio.telefono}</span>
                    </a>
                  )}

                  {/* Scrivi su WhatsApp */}
                  {selectedItem.negozio.whatsapp && (
                    <a
                      href={`https://wa.me/${selectedItem.negozio.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                        `Buongiorno! Vi contatto tramite la Web App di Villaggio Prenestino per informazioni su: ${selectedItem.negozio.nome}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 px-3.5 bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1da850] text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                </div>

                {/* Calcola percorso su Google Maps */}
                <button
                  type="button"
                  onClick={() => handleOpenDirections(selectedItem.negozio.indirizzo, selectedItem.negozio.lat, selectedItem.negozio.lng)}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs ${
                    isDark
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  <Navigation className="w-4 h-4" />
                  <span>Apri percorso su Google Maps</span>
                </button>

                {/* Sei il titolare? */}
                {onOpenManagement && (
                  <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        const shop = selectedItem.negozio;
                        setSelectedItem(null);
                        onOpenManagement(shop);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 font-semibold cursor-pointer py-1"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                      <span className="underline decoration-slate-300 dark:decoration-slate-700 underline-offset-2">
                        Sei il titolare? Gestisci scheda e offerte con PIN
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
