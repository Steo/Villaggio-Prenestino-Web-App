import React, { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, InfoWindow, ColorScheme, useMap } from '@vis.gl/react-google-maps';
import { CustomMapPin } from './CustomMapPin';
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
  Filter
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
  darkMode?: boolean;
}

// Centro geografico esatto di Villaggio Prenestino lungo Via Fosso dell'Osa
const VILLAGGIO_PRENESTINO_CENTER = {
  lat: 41.8985,
  lng: 12.6865
};

// Stile cartografico notturno avanzato per Google Maps
const DARK_MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#1e293b' }] }, // slate-800
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] }, // slate-900
  { elementType: 'labels.text.fill', stylers: [{ color: '#cbd5e1' }] }, // slate-300
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f8fafc' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#94a3b8' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#14382c' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#34d399' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#334155' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1e293b' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#e2e8f0' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#475569' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1e293b' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#fbbf24' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#334155' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#cbd5e1' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#091528' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#64748b' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#091528' }],
  },
];

// Componente child per sincronizzare reattivamente le opzioni notte su Google Maps instance
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
        styles: isDark ? DARK_MAP_STYLES : [],
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
        {/* Toggle Filters & Dropdown Tipologia */}
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

          {/* Menù a tendina integrato per tipologia attività */}
          {onCategoriaFilterChange && filterTipo !== 'eventi' && (
            <div className="flex items-center gap-1 pl-1.5 border-l border-slate-200 dark:border-slate-700">
              <Filter className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
              <select
                value={categoriaFilter || 'tutti'}
                onChange={(e) => onCategoriaFilterChange(e.target.value as CategoriaCommercio | 'tutti')}
                className="text-[11px] font-bold bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer py-1 pr-1"
                title="Filtra i pin sulla mappa per tipologia di attività"
              >
                <option value="tutti" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Tutte le tipologie</option>
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
              mapId="DEMO_MAP_ID"
              colorScheme={isDark ? ColorScheme.DARK : ColorScheme.LIGHT}
              styles={isDark ? DARK_MAP_STYLES : undefined}
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
                <AdvancedMarker
                  position={userLocation}
                  title="La tua posizione attuale"
                >
                  <div className="relative flex items-center justify-center">
                    <div className="w-6 h-6 bg-blue-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-[10px] animate-pulse">
                      📍
                    </div>
                    <div className="absolute w-8 h-8 rounded-full bg-blue-400 opacity-40 animate-ping -z-10" />
                  </div>
                </AdvancedMarker>
              )}

              {/* Business Markers con Pin Sagomato Personalizzato per Categoria e animazione bounce/scale */}
              {visibleShops.map((shop) => {
                const isSelected = selectedItem?.negozio?.id === shop.id;
                const isBouncingPin = Boolean(bouncingCategory && (bouncingCategory === 'tutti' || bouncingCategory === shop.categoria));

                return (
                  <AdvancedMarker
                    key={`shop-${shop.id}`}
                    position={{ lat: shop.lat, lng: shop.lng }}
                    title={shop.nome}
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
                  </AdvancedMarker>
                );
              })}

              {/* Event Markers con Pin Sagomato Personalizzato per Eventi */}
              {visibleEvents.map((evento) => {
                if (!evento.lat || !evento.lng) return null;
                const isSelected = selectedItem?.evento?.id === evento.id;

                return (
                  <AdvancedMarker
                    key={`event-${evento.id}`}
                    position={{ lat: evento.lat, lng: evento.lng }}
                    title={evento.t}
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
                  </AdvancedMarker>
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
                  <div className="p-1 max-w-[280px] bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl">
                    {selectedItem.tipo === 'negozio' && selectedItem.negozio && (
                      <div className="space-y-2">
                        {selectedItem.negozio.immagine && (
                          <div className="relative h-28 w-full rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                            <img
                              src={selectedItem.negozio.immagine}
                              alt={selectedItem.negozio.nome}
                              className="w-full h-full object-cover"
                            />
                            {selectedItem.negozio.offertaAttiva && (
                              <div className="absolute top-1.5 left-1.5 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5" />
                                Offerta Attiva
                              </div>
                            )}
                          </div>
                        )}

                        <div>
                          <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wider">
                            {selectedItem.negozio.categoria}
                          </span>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-tight mt-0.5">
                            {selectedItem.negozio.nome}
                          </h4>
                          <p className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            {selectedItem.negozio.indirizzo}
                          </p>
                        </div>

                        {selectedItem.negozio.offertaAttiva && (
                          <div className="bg-amber-50 dark:bg-amber-950/70 border border-amber-200/80 dark:border-amber-800/80 rounded-lg p-2 text-xs">
                            <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1">
                              <Tag className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                              {selectedItem.negozio.offertaAttiva.titolo}
                            </div>
                            <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5 line-clamp-2">
                              {selectedItem.negozio.offertaAttiva.dettaglio}
                            </p>
                          </div>
                        )}

                        <div className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{selectedItem.negozio.orari}</span>
                        </div>

                        {/* Action buttons */}
                        <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                          {selectedItem.negozio.whatsapp ? (
                            <a
                              href={`https://wa.me/${selectedItem.negozio.whatsapp}?text=${encodeURIComponent(
                                `Buongiorno! Vi contatto tramite l'App di Quartiere di Villaggio Prenestino per informazioni su: ${selectedItem.negozio.nome}`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1 text-center"
                            >
                              <MessageCircle className="w-3 h-3" />
                              WhatsApp
                            </a>
                          ) : (
                            <a
                              href={`tel:${selectedItem.negozio.telefono.replace(/\s+/g, '')}`}
                              className="px-2 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1 text-center"
                            >
                              <Phone className="w-3 h-3" />
                              Chiama
                            </a>
                          )}

                          <button
                            onClick={() =>
                              handleOpenDirections(
                                selectedItem.negozio!.indirizzo,
                                selectedItem.negozio!.lat,
                                selectedItem.negozio!.lng
                              )
                            }
                            className="px-2 py-1.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Navigation className="w-3 h-3 text-amber-400" />
                            Indicazioni
                          </button>
                        </div>
                      </div>
                    )}

                    {selectedItem.tipo === 'evento' && selectedItem.evento && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-transparent dark:border-purple-800 text-[10px] font-bold rounded-md uppercase">
                            Evento Associazione
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            {selectedItem.evento.d} {selectedItem.evento.m} • {selectedItem.evento.ora}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-tight mt-0.5">
                          {selectedItem.evento.t}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                          {selectedItem.evento.p}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          {selectedItem.evento.luogo}
                        </p>
                        <button
                          onClick={() =>
                            handleOpenDirections(
                              selectedItem.evento!.luogo,
                              selectedItem.evento!.lat,
                              selectedItem.evento!.lng
                            )
                          }
                          className="w-full py-1.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 mt-1 cursor-pointer"
                        >
                          <Navigation className="w-3 h-3 text-white" />
                          Indicazioni per l'evento
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
      </div>
    </div>
  );
};
