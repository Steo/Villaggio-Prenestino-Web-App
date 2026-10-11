import React, { useState, useRef } from 'react';
import { Award, Moon, Sun, ShieldCheck } from 'lucide-react';
import { UserInteractions } from '../types';
import { LogoCdq } from './LogoCdq';
import { PuntiCiviciModal } from './PuntiCiviciModal';

interface HeaderProps {
  interactions: UserInteractions;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenWpPanel?: () => void;
  isAdmin?: boolean;
  onOpenAdminAccessModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  interactions,
  darkMode,
  onToggleDarkMode,
  onOpenWpPanel,
  isAdmin = false,
  onOpenAdminAccessModal,
}) => {
  const [isPuntiModalOpen, setIsPuntiModalOpen] = useState(false);
  const logoTapCountRef = useRef(0);
  const logoTapTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogoTap = () => {
    logoTapCountRef.current += 1;
    if (logoTapTimerRef.current) clearTimeout(logoTapTimerRef.current);

    if (logoTapCountRef.current >= 5) {
      logoTapCountRef.current = 0;
      if (onOpenAdminAccessModal) {
        onOpenAdminAccessModal();
      }
    } else {
      logoTapTimerRef.current = setTimeout(() => {
        logoTapCountRef.current = 0;
      }, 2500);
    }
  };

  const getLivello = (pts: number) => {
    if (pts < 30) return 'Nuovo Vicino';
    if (pts < 80) return 'Vicino Attivo';
    if (pts < 150) return 'Pilastro';
    return 'Custode';
  };

  return (
    <>
      <header
        className="sticky top-0 z-30 text-white shadow-md border-b border-black/10 transition-colors duration-200"
        style={{ backgroundColor: darkMode ? '#4a0e0c' : '#781816' }}
      >
        <div className="max-w-4xl mx-auto px-3.5 sm:px-4 py-2.5 flex items-center justify-between gap-2.5">
          {/* Logo ufficiale bianco dell'associazione con tap counter segreto */}
          <div
            className="min-w-0 flex items-center cursor-pointer select-none"
            onClick={handleLogoTap}
            title="CdQ Villaggio Prenestino"
          >
            <LogoCdq className="h-10 sm:h-11" />
          </div>

          {/* Azioni testata: Dashboard WP Insight (solo Admin), Punti Civici e Toggle Modalità Scura */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Tasto Pannello WordPress & Insight: VISIBILE SOLO SE AMMINISTRATORE */}
            {isAdmin && onOpenWpPanel && (
              <button
                type="button"
                onClick={onOpenWpPanel}
                title="Pannello Gestione WordPress & Insight (Modalità Admin Attiva)"
                aria-label="Apri pannello di gestione WordPress e statistiche Insight"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/35 active:scale-95 border border-amber-400/50 text-white text-xs font-semibold cursor-pointer transition shadow-xs group focus:outline-none focus:ring-2 focus:ring-amber-400/50"
              >
                <span className="w-4 h-4 rounded-md bg-[#0073aa] text-white flex items-center justify-center font-black text-[10px] leading-none shrink-0 shadow-xs">
                  W
                </span>
                <span className="hidden sm:inline font-bold text-[11px] text-amber-200">Insight WP</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              </button>
            )}

            {/* Tasto Contatore Punti Civici - Apre il popup esplicativo */}
            <button
              type="button"
              onClick={() => setIsPuntiModalOpen(true)}
              title={`Hai ${interactions.puntiCivici} punti civici (${getLivello(interactions.puntiCivici)}) - Clicca per vedere come funziona`}
              aria-label={`Punti Civici: ${interactions.puntiCivici}. Livello: ${getLivello(interactions.puntiCivici)}. Tocca per aprire la guida al sistema punti`}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-black/20 hover:bg-black/35 active:scale-95 border border-white/20 hover:border-amber-400/50 text-amber-300 text-xs font-semibold cursor-pointer transition shadow-xs group focus:outline-none focus:ring-2 focus:ring-amber-400/50"
            >
              <Award className="w-4 h-4 text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
              <span className="font-bold tracking-tight">{interactions.puntiCivici}</span>
              <span className="text-white/80 font-normal text-[11px]">pts</span>
            </button>

            {/* Tasto toggle a destra del contatore punti */}
            <button
              type="button"
              onClick={onToggleDarkMode}
              title={darkMode ? 'Passa alla modalità chiara' : 'Passa alla modalità a sfondo scuro'}
              aria-label={darkMode ? 'Passa alla modalità chiara' : 'Passa alla modalità a sfondo scuro'}
              className="flex items-center justify-center w-8 h-8 rounded-xl bg-black/20 hover:bg-black/35 border border-white/15 text-white transition-all active:scale-95 shadow-xs cursor-pointer"
            >
              {darkMode ? (
                <Sun className="w-4 h-4 text-amber-300 transition-transform rotate-0" />
              ) : (
                <Moon className="w-4 h-4 text-white/90 transition-transform" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Modal esplicativo sul sistema punti civici */}
      <PuntiCiviciModal
        isOpen={isPuntiModalOpen}
        onClose={() => setIsPuntiModalOpen(false)}
        puntiCivici={interactions.puntiCivici}
        darkMode={darkMode}
      />
    </>
  );
};
