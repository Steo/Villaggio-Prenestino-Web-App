import React from 'react';
import { 
  ShoppingBag, 
  UtensilsCrossed, 
  HeartPulse, 
  Hammer, 
  Sparkles, 
  Dog, 
  Home, 
  Calendar,
  Percent,
  Store,
  Wrench,
  UserCheck
} from 'lucide-react';
import { CategoriaCommercio } from '../types';

export type PinTipo = CategoriaCommercio | 'evento';

interface CustomMapPinProps {
  tipo: PinTipo;
  isSelected?: boolean;
  hasOffer?: boolean;
  label?: string;
  className?: string;
  isBouncing?: boolean;
}

interface PinConfig {
  bg: string;
  border: string;
  iconColor: string;
  label: string;
  renderIcon: () => React.ReactNode;
}

const PIN_CONFIGS: Record<PinTipo, PinConfig> = {
  alimentari: {
    bg: '#059669', // Smeraldo
    border: '#047857',
    iconColor: '#059669',
    label: 'Alimentari',
    renderIcon: () => <ShoppingBag className="w-3.5 h-3.5 stroke-[2.5]" />,
  },
  ristorazione: {
    bg: '#d97706', // Ambra / Arancio
    border: '#b45309',
    iconColor: '#d97706',
    label: 'Ristorazione',
    renderIcon: () => <UtensilsCrossed className="w-3.5 h-3.5 stroke-[2.5]" />,
  },
  salute: {
    bg: '#e11d48', // Rubino / Rosa scuro
    border: '#be123c',
    iconColor: '#e11d48',
    label: 'Farmacie & salute',
    renderIcon: () => <HeartPulse className="w-3.5 h-3.5 stroke-[2.5]" />,
  },
  artigiani: {
    bg: '#7c3aed', // Viola / Purple
    border: '#6d28d9',
    iconColor: '#7c3aed',
    label: 'Artigiani',
    renderIcon: () => <Hammer className="w-3.5 h-3.5 stroke-[2.5]" />,
  },
  servizi_persona: {
    bg: '#4f46e5', // Indaco / Blu reale
    border: '#4338ca',
    iconColor: '#4f46e5',
    label: 'Servizi alla persona',
    renderIcon: () => <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />,
  },
  servizi_animali: {
    bg: '#0d9488', // Teal / Ottanio
    border: '#0f766e',
    iconColor: '#0d9488',
    label: 'Servizi per animali',
    renderIcon: () => <Dog className="w-3.5 h-3.5 stroke-[2.5]" />,
  },
  casa: {
    bg: '#0284c7', // Celeste / Sky
    border: '#0369a1',
    iconColor: '#0284c7',
    label: 'Casa, fai da te & hobby',
    renderIcon: () => <Home className="w-3.5 h-3.5 stroke-[2.5]" />,
  },
  evento: {
    bg: '#781816', // Bordeaux Villaggio Prenestino
    border: '#53100e',
    iconColor: '#781816',
    label: 'Evento',
    renderIcon: () => <Calendar className="w-3.5 h-3.5 stroke-[2.5]" />,
  },
  tutti: {
    bg: '#781816',
    border: '#53100e',
    iconColor: '#781816',
    label: 'Tutte le Categorie',
    renderIcon: () => <Store className="w-3.5 h-3.5 stroke-[2.5]" />,
  },
};

export const CustomMapPin: React.FC<CustomMapPinProps> = ({
  tipo,
  isSelected = false,
  hasOffer = false,
  label,
  className = '',
  isBouncing = false,
}) => {
  const config = PIN_CONFIGS[tipo] || PIN_CONFIGS.alimentari;
  const width = isSelected ? 42 : 34;
  const height = isSelected ? 52 : 44;

  return (
    <div
      className={`relative inline-flex flex-col items-center select-none cursor-pointer transition-all duration-300 transform -translate-x-1/2 -translate-y-full group ${
        isSelected ? 'scale-115 z-50' : 'hover:scale-110 z-10'
      } ${className}`}
      title={label || config.label}
    >
      {/* Contenitore Pin Sagomato SVG con animazione bounce/scale */}
      <div className={`relative filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.35)] transition-transform duration-200 ${isBouncing ? 'animate-pin-bounce' : ''}`}>
        <svg
          width={width}
          height={height}
          viewBox="0 0 36 46"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-all duration-200"
        >
          {/* Sagoma a goccia (Teardrop) con punta inferiore orientata sul punto esatto */}
          <path
            d="M 18 45.5 C 18 45.5, 3 26.5, 3 18 A 15 15 0 1 1 33 18 C 33 26.5, 18 45.5, 18 45.5 Z"
            fill={config.bg}
            stroke={isSelected ? '#ffffff' : config.border}
            strokeWidth={isSelected ? '2.5' : '1.5'}
            strokeLinejoin="round"
          />

          {/* Cerchio bianco centrale per contrasto perfetto */}
          <circle
            cx="18"
            cy="18"
            r="11"
            fill="#ffffff"
            stroke={isSelected ? config.bg : 'rgba(0,0,0,0.06)'}
            strokeWidth="1.5"
          />
        </svg>

        {/* Icona vettoriale centrata nel disco bianco */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{
            color: config.iconColor,
            top: 0,
            bottom: isSelected ? '18%' : '20%',
          }}
        >
          {config.renderIcon()}
        </div>

        {/* Badge speciale Offerta Attiva % */}
        {hasOffer && (
          <div
            className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 rounded-full bg-teal-500 text-white shadow-md ring-2 ring-white dark:ring-slate-900 animate-pulse"
            title="Offerta speciale attiva per chi mostra l'app"
          >
            <Percent className="w-3 h-3 text-white stroke-[3]" />
          </div>
        )}

        {/* Alone / Anello pulsante quando selezionato */}
        {isSelected && (
          <div
            className="absolute -inset-1 rounded-full border-2 border-amber-400 pointer-events-none animate-ping opacity-75"
            style={{ width: width + 8, height: width + 8, top: -4, left: -4 }}
          />
        )}
      </div>

      {/* Ombra di ancoraggio sul terreno */}
      <div
        className={`rounded-full bg-black/30 blur-[2px] transition-all duration-200 ${
          isSelected ? 'w-4 h-1.5 mt-[-1px]' : 'w-3 h-1 mt-[-1px]'
        }`}
      />
    </div>
  );
};
