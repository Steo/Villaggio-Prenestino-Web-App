import React, { useState, useEffect } from 'react';
import { APIProvider, Map, InfoWindow, ColorScheme, useMap } from '@vis.gl/react-google-maps';
import { CustomMapPin } from './CustomMapPin';
import { CustomMapMarker } from './CustomMapMarker';
import { AttivitaCommercio, EventoQuartiere, CategoriaCommercio } from '../types';
import { 
  Store, 
  Calendar, 
  MapPin, 
  Navigation, 
  Crosshair, 
  Phone, 
  MessageCircle, 
  Clock, 
  Tag, 
  ExternalLink, 
  Layers, 
  Sparkles,
  Filter,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';

interface MappaQuartiereProps {
  attivita: AttivitaCommercio[];
  eventi: EventoQuartiere[];
  selectedAttivitaId: number | null;
  onSelectAttivita: (id: number | null) => void;
  filterTipo: 'tutti' | 'negozi' | 'eventi';
  onFilterChange: (tipo: 'tutti' | 'negozi' | 'eventi') => void;
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
    label: 'Bar & Cucina',
    text: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/60',
    border: 'border-amber-300 dark:border-amber-700/80',
  },
  salute: {
    label: 'Farmacia & Salute',
    text: 'text-rose-700 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-950/60',
    border: 'border-rose-300 dark:border-rose-700/80',
  },
  servizi: {
    label: 'Artigiani & Servizi',
    text: 'text-indigo-700 dark:text-indigo-400',
    bg: 'bg-indigo-50 dark:bg-indigo-950/60',
    border: 'border-indigo-300 dark:border-indigo-700/80',
  },
  casa: {
    label: 'Casa & Brico',
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
    tipo: 'negozio' | 'evento';
    negozio?: AttivitaCommercio;
    evento?: EventoQuartiere;
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

  const visibleShops = (filterTipo === 'tutti' || filterTipo === 'negozi') ? shopsByCategory : [];
  const visibleEvents = (filterTipo === 'tutti' || filterTipo === 'eventi') ? eventi.filter(e => !e.passato && e.lat && e.lng) : [];

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 shadow-sm transition-all">
      {/* Top Controls Overlay */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Toggle Filters & Dropdown Categoria */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl shadow-md border border-slate-200 dark:border-slate-800 pointer-events-auto">
          <button
            onClick={() => onFilterChange('tutti')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              filterTipo === 'tutti'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Tutti ({attivita.length + visibleEvents.length})
          </button>
          <button
            onClick={() => onFilterChange('negozi')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              filterTipo === 'negozi'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            Commercianti ({shopsByCategory.length})
          </button>
          <button
            onClick={() => onFilterChange('eventi')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              filterTipo === 'eventi'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Eventi ({visibleEvents.length})
          </button>

          {/* Menù a tendina integrato per categoria */}
          {onCategoriaFilterChange && filterTipo !== 'eventi' && (
            <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-200 dark:border-slate-700">
              <Filter className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                Categoria
              </span>
              <select
                value={categoriaFilter || 'tutti'}
                onChange={(e) => onCategoriaFilterChange(e.target.value as CategoriaCommercio | 'tutti')}
                className="text-[11px] font-bold bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer py-1 pr-1"
                title="Filtra i pin sulla mappa per categoria"
                aria-label="Categoria"
              >
                <option value="tutti" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Tutte ({attivita.length})</option>
                <option value="alimentari" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">🛒 Alimentari</option>
                <option value="ristorazione" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">🍽️ Ristorazione & Bar</option>
                <option value="salute" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">💊 Farmacia & Salute</option>
                <option value="servizi" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">🔧 Artigiani & Servizi</option>
                <option value="casa" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">🏡 Casa & Brico</option>
              </select>
            </div>
          )}
        </div>

        {/* Locate me button & Centra su Villaggio Prenestino Via Fosso dell'Osa */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={handleLocateMe}
            disabled={geoLoading}
            title="Centra sulla mia posizione"
            className="flex items-center gap-1.5 px-3 py-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl shadow-md border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-all disabled:opacity-50"
          >
            <Crosshair className={`w-3.5 h-3.5 text-blue-600 dark:text-blue-400 ${geoLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Vicino a me</span>
          </button>

          <button
            onClick={() => {
              setMapCenter(VILLAGGIO_PRENESTINO_CENTER);
              setMapZoom(15);
            }}
            title="Centra su Villaggio Prenestino (Via Fosso dell'Osa)"
            className="flex items-center gap-1.5 px-3 py-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl shadow-md border border-slate-200 dark:border-slate-800 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-all cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Via Fosso dell'Osa</span>
            <span className="sm:hidden">Centro</span>
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

              {/* Event Markers con Pin Sagomato Personalizzato per Eventi */}
              {visibleEvents.map((evento) => {
                if (!evento.lat || !evento.lng) return null;
                const isSelected = selectedItem?.evento?.id === evento.id;

                return (
                  <CustomMapMarker
                    key={`event-${evento.id}`}
                    position={{ lat: evento.lat, lng: evento.lng }}
                    zIndex={isSelected ? 45 : 15}
                    onClick={() => {
                      setSelectedItem({ tipo: 'evento', evento });
                      onSelectAttivita(null);
                    }}
                  >
                    <CustomMapPin
                      tipo="evento"
                      isSelected={isSelected}
                      label={evento.t}
                    />
                  </CustomMapMarker>
                );
              })}

              {/* InfoWindow for Selected Item */}
              {selectedItem && (
                <InfoWindow
                  position={{
                    lat: selectedItem.negozio?.lat || selectedItem.evento?.lat || VILLAGGIO_PRENESTINO_CENTER.lat,
                    lng: selectedItem.negozio?.lng || selectedItem.evento?.lng || VILLAGGIO_PRENESTINO_CENTER.lng,
                  }}
                  onCloseClick={() => {
                    setSelectedItem(null);
                    onSelectAttivita(null);
                  }}
                  maxWidth={320}
                  className={isDark ? 'gm-dark-infowindow' : 'gm-light-infowindow'}
                >
                  <div className={`p-1.5 max-w-[285px] rounded-2xl transition-colors ${
                    isDark ? 'bg-[#0b1329] text-slate-100' : 'bg-white text-slate-900'
                  }`}>
                    {selectedItem.tipo === 'negozio' && selectedItem.negozio && (
                      <div className="space-y-2.5">
                        {selectedItem.negozio.immagine && (
                          <div className="relative h-28 w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-800/80">
                            <img
                              src={selectedItem.negozio.immagine}
                              alt={selectedItem.negozio.nome}
                              className="w-full h-full object-cover"
                              style={{ filter: 'none' }}
                            />
                            {selectedItem.negozio.offertaAttiva && (
                              <div className="absolute top-1.5 left-1.5 bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5" />
                                <span>Offerta Attiva</span>
                              </div>
                            )}
                          </div>
                        )}

                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] uppercase font-black tracking-wider border ${
                              CATEGORIA_BADGE_STYLE[selectedItem.negozio.categoria]?.text || 'text-amber-600 dark:text-amber-400'
                            } ${
                              CATEGORIA_BADGE_STYLE[selectedItem.negozio.categoria]?.bg || 'bg-amber-50 dark:bg-amber-950/60'
                            } ${
                              CATEGORIA_BADGE_STYLE[selectedItem.negozio.categoria]?.border || 'border-amber-200 dark:border-amber-800'
                            }`}>
                              {selectedItem.negozio.categoria}
                            </span>
                            {selectedItem.negozio.verificato && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Verificato</span>
                              </span>
                            )}
                          </div>
                          <h4 className={`font-extrabold text-sm leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {selectedItem.negozio.nome}
                          </h4>
                          <p className={`text-xs flex items-center gap-1 mt-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                            <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>{selectedItem.negozio.indirizzo}</span>
                          </p>
                        </div>

                        {selectedItem.negozio.offertaAttiva && (
                          <div className={`border rounded-xl p-2.5 text-xs space-y-1 ${
                            isDark
                              ? 'bg-amber-950/40 border-amber-600/40 text-amber-200'
                              : 'bg-amber-50 border-amber-200 text-amber-950'
                          }`}>
                            <div className={`font-bold flex items-center gap-1.5 ${isDark ? 'text-amber-300' : 'text-amber-900'}`}>
                              <Tag className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              <span>{selectedItem.negozio.offertaAttiva.titolo}</span>
                            </div>
                            <p className={`text-[11px] leading-relaxed line-clamp-2 ${isDark ? 'text-amber-200/90' : 'text-amber-800'}`}>
                              {selectedItem.negozio.offertaAttiva.dettaglio}
                            </p>
                          </div>
                        )}

                        <div className={`text-[11px] flex items-center gap-1.5 px-0.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                          <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>{selectedItem.negozio.orari}</span>
                        </div>

                        {/* Action buttons */}
                        <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-200/80 dark:border-slate-800">
                          {selectedItem.negozio.whatsapp ? (
                            <a
                              href={`https://wa.me/${selectedItem.negozio.whatsapp}?text=${encodeURIComponent(
                                `Buongiorno! Vi contatto tramite l'App di Quartiere di Villaggio Prenestino per informazioni su: ${selectedItem.negozio.nome}`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-2 bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1da850] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 text-center shadow-xs transition"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </a>
                          ) : (
                            <a
                              href={`tel:${selectedItem.negozio.telefono.replace(/\s+/g, '')}`}
                              className="px-2 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 text-center shadow-xs transition"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>Chiama</span>
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              handleOpenDirections(
                                selectedItem.negozio!.indirizzo,
                                selectedItem.negozio!.lat,
                                selectedItem.negozio!.lng
                              )
                            }
                            className={`px-2 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
                              isDark
                                ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700'
                                : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
                            }`}
                          >
                            <Navigation className="w-3.5 h-3.5 text-amber-400" />
                            <span>Indicazioni</span>
                          </button>
                        </div>

                        {onOpenManagement && (
                          <div className="pt-1.5 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-[10px]">
                            <button
                              type="button"
                              onClick={() => onOpenManagement(selectedItem.negozio!)}
                              className="inline-flex items-center gap-1 text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer group"
                            >
                              <KeyRound className="w-3 h-3 text-slate-400 group-hover:text-amber-500" />
                              <span className="underline decoration-slate-300 dark:decoration-slate-700 underline-offset-2">
                                Sei il titolare? Gestisci scheda
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedItem.tipo === 'evento' && selectedItem.evento && (
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-[#781816]/15 dark:bg-[#781816]/30 text-[#781816] dark:text-rose-300 border border-[#781816]/30 text-[10px] font-black rounded-md uppercase">
                            Evento Associazione
                          </span>
                          <span className={`text-[11px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {selectedItem.evento.d} {selectedItem.evento.m} • {selectedItem.evento.ora}
                          </span>
                        </div>
                        <h4 className={`font-extrabold text-sm leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {selectedItem.evento.t}
                        </h4>
                        <p className={`text-xs leading-relaxed line-clamp-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                          {selectedItem.evento.p}
                        </p>
                        <p className={`text-xs flex items-center gap-1.5 font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                          <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>{selectedItem.evento.luogo}</span>
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            handleOpenDirections(
                              selectedItem.evento!.luogo,
                              selectedItem.evento!.lat,
                              selectedItem.evento!.lng
                            )
                          }
                          className="w-full py-2 bg-[#781816] hover:bg-[#5a1210] active:scale-[0.98] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 mt-1 cursor-pointer shadow-xs transition"
                        >
                          <Navigation className="w-3.5 h-3.5 text-white" />
                          <span>Indicazioni per l'evento</span>
                        </button>
                      </div>
                    )}
                  </div>
                </InfoWindow>
              )}
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
    </div>
  );
};
