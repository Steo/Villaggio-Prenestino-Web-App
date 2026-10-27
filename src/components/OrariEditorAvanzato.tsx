import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Clock,
  Calendar,
  AlertCircle,
  Plus,
  Trash2,
  Check,
  Sun,
  Moon,
  Coffee,
  Sparkles,
  ChevronDown,
  X,
  HelpCircle,
} from 'lucide-react';
import { GraficoOrariSettimana } from './GraficoOrariSettimana';

export interface DayException {
  tipo: 'chiuso' | 'solo_mattina' | 'solo_pomeriggio' | 'continuato' | 'spezzato';
  aperturaMattina?: string;
  chiusuraMattina?: string;
  aperturaPomeriggio?: string;
  chiusuraPomeriggio?: string;
  aperturaContinuato?: string;
  chiusuraContinuato?: string;
}

export interface OrariEditorResult {
  orariText: string;
  orarioDettagliato: { [giornoKey: string]: string };
}

interface OrariEditorAvanzatoProps {
  initialOrari?: string;
  initialOrarioDettagliato?: { [giornoKey: string]: string };
  onChange: (result: OrariEditorResult) => void;
  darkMode?: boolean;
  showPreview?: boolean;
}

export const GIORNI_CONFIG = [
  { key: 'lunedi', short: 'Lun', full: 'Lunedì', index: 1 },
  { key: 'martedi', short: 'Mar', full: 'Martedì', index: 2 },
  { key: 'mercoledi', short: 'Mer', full: 'Mercoledì', index: 3 },
  { key: 'giovedi', short: 'Gio', full: 'Giovedì', index: 4 },
  { key: 'venerdi', short: 'Ven', full: 'Venerdì', index: 5 },
  { key: 'sabato', short: 'Sab', full: 'Sabato', index: 6 },
  { key: 'domenica', short: 'Dom', full: 'Domenica', index: 0 },
] as const;

export const TIME_SLOTS: string[] = [];
for (let h = 5; h < 24; h++) {
  const hh = h < 10 ? `0${h}` : `${h}`;
  TIME_SLOTS.push(`${hh}:00`);
  TIME_SLOTS.push(`${hh}:30`);
}
TIME_SLOTS.push('24:00');

export const OrariEditorAvanzato: React.FC<OrariEditorAvanzatoProps> = ({
  initialOrari = '',
  initialOrarioDettagliato,
  onChange,
  darkMode = false,
  showPreview = true,
}) => {
  // 1. Stato Orario Base
  const [orarioTipo, setOrarioTipo] = useState<'spezzato' | 'continuato' | 'h24'>('spezzato');
  const [oraAperturaMattina, setOraAperturaMattina] = useState<string>('08:30');
  const [oraChiusuraMattina, setOraChiusuraMattina] = useState<string>('13:00');
  const [oraAperturaPomeriggio, setOraAperturaPomeriggio] = useState<string>('16:30');
  const [oraChiusuraPomeriggio, setOraChiusuraPomeriggio] = useState<string>('20:00');
  const [oraAperturaContinuato, setOraAperturaContinuato] = useState<string>('08:00');
  const [oraChiusuraContinuato, setOraChiusuraContinuato] = useState<string>('20:00');

  // Giorni di base (predefinito Lun-Sab)
  const [selectedBaseDays, setSelectedBaseDays] = useState<string[]>(['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']);

  // 2. Stato Eccezioni per giorni specifici
  const [eccezioni, setEccezioni] = useState<{ [giornoKey: string]: DayException }>({});

  // Menu rapido per aggiungere un giorno alle eccezioni
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  // Inizializzazione reverse da dati preesistenti
  const isInitialized = useRef(false);
  useEffect(() => {
    if (isInitialized.current) return;
    if (!initialOrari && (!initialOrarioDettagliato || Object.keys(initialOrarioDettagliato).length === 0)) {
      return;
    }
    isInitialized.current = true;

    // Se esiste initialOrarioDettagliato
    if (initialOrarioDettagliato && typeof initialOrarioDettagliato === 'object') {
      const keys = Object.keys(initialOrarioDettagliato);
      if (keys.length > 0) {
        const newEccezioni: { [giornoKey: string]: DayException } = {};
        for (const [gKey, val] of Object.entries(initialOrarioDettagliato)) {
          const lower = (val || '').toLowerCase().trim();
          if (lower === 'chiuso' || lower === 'chiusa') {
            newEccezioni[gKey] = { tipo: 'chiuso' };
          } else if (lower.includes('/') || lower.includes('e')) {
            // Spezzato
            const matches = lower.match(/(\d{1,2}[:.]\d{2})\s*[-–]\s*(\d{1,2}[:.]\d{2})/g);
            if (matches && matches.length >= 2) {
              const m1 = matches[0].split(/[-–]/).map((s) => s.trim().replace('.', ':'));
              const m2 = matches[1].split(/[-–]/).map((s) => s.trim().replace('.', ':'));
              newEccezioni[gKey] = {
                tipo: 'spezzato',
                aperturaMattina: m1[0] || '08:30',
                chiusuraMattina: m1[1] || '13:00',
                aperturaPomeriggio: m2[0] || '16:30',
                chiusuraPomeriggio: m2[1] || '20:00',
              };
            }
          } else if (lower.match(/(\d{1,2}[:.]\d{2})\s*[-–]\s*(\d{1,2}[:.]\d{2})/)) {
            // Singola fascia
            const match = lower.match(/(\d{1,2}[:.]\d{2})\s*[-–]\s*(\d{1,2}[:.]\d{2})/);
            if (match) {
              const start = match[1].replace('.', ':');
              const end = match[2].replace('.', ':');
              const startH = parseInt(start.split(':')[0], 10);
              if (startH < 13) {
                newEccezioni[gKey] = {
                  tipo: 'solo_mattina',
                  aperturaMattina: start,
                  chiusuraMattina: end,
                };
              } else {
                newEccezioni[gKey] = {
                  tipo: 'solo_pomeriggio',
                  aperturaPomeriggio: start,
                  chiusuraPomeriggio: end,
                };
              }
            }
          }
        }
        if (Object.keys(newEccezioni).length > 0) {
          setEccezioni(newEccezioni);
        }
        return;
      }
    }

    // Altrimenti analizza initialOrari (stringa)
    if (initialOrari) {
      const lower = initialOrari.toLowerCase();
      if (lower.includes('h24') || lower.includes('24h') || lower.includes('sempre aperto')) {
        setOrarioTipo('h24');
        setSelectedBaseDays(['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']);
      } else if (lower.includes('continuato')) {
        setOrarioTipo('continuato');
      }

      // Estrai orari se presenti
      const times = lower.match(/(\d{1,2}[:.]\d{2})\s*[-–]\s*(\d{1,2}[:.]\d{2})/g);
      if (times && times.length >= 2) {
        const m1 = times[0].split(/[-–]/).map((s) => s.trim().replace('.', ':'));
        const m2 = times[1].split(/[-–]/).map((s) => s.trim().replace('.', ':'));
        if (m1[0]) setOraAperturaMattina(m1[0]);
        if (m1[1]) setOraChiusuraMattina(m1[1]);
        if (m2[0]) setOraAperturaPomeriggio(m2[0]);
        if (m2[1]) setOraChiusuraPomeriggio(m2[1]);
      } else if (times && times.length === 1) {
        const m = times[0].split(/[-–]/).map((s) => s.trim().replace('.', ':'));
        if (m[0]) setOraAperturaContinuato(m[0]);
        if (m[1]) setOraChiusuraContinuato(m[1]);
      }

      // Riconosci chiusura domenica predefinita se menzionata
      if (lower.includes('dom chiuso') || lower.includes('domenica chiuso') || lower.includes('chiuso la domenica')) {
        setEccezioni((prev) => ({
          ...prev,
          domenica: { tipo: 'chiuso' },
        }));
      }
    }
  }, [initialOrari, initialOrarioDettagliato]);

  // Costruzione in tempo reale di orarioDettagliato e orariText
  const compiledData = useMemo<OrariEditorResult>(() => {
    const detailed: { [giornoKey: string]: string } = {};

    // 1. Calcola la stringa orario per ciascuno dei 7 giorni
    GIORNI_CONFIG.forEach((g) => {
      const exc = eccezioni[g.key];
      if (exc) {
        if (exc.tipo === 'chiuso') {
          detailed[g.key] = 'Chiuso';
        } else if (exc.tipo === 'solo_mattina') {
          const amIn = exc.aperturaMattina || oraAperturaMattina;
          const amOut = exc.chiusuraMattina || oraChiusuraMattina;
          detailed[g.key] = `${amIn} - ${amOut}`;
        } else if (exc.tipo === 'solo_pomeriggio') {
          const pmIn = exc.aperturaPomeriggio || oraAperturaPomeriggio;
          const pmOut = exc.chiusuraPomeriggio || oraChiusuraPomeriggio;
          detailed[g.key] = `${pmIn} - ${pmOut}`;
        } else if (exc.tipo === 'continuato') {
          const cIn = exc.aperturaContinuato || oraAperturaContinuato;
          const cOut = exc.chiusuraContinuato || oraChiusuraContinuato;
          detailed[g.key] = `${cIn} - ${cOut}`;
        } else if (exc.tipo === 'spezzato') {
          const amIn = exc.aperturaMattina || oraAperturaMattina;
          const amOut = exc.chiusuraMattina || oraChiusuraMattina;
          const pmIn = exc.aperturaPomeriggio || oraAperturaPomeriggio;
          const pmOut = exc.chiusuraPomeriggio || oraChiusuraPomeriggio;
          detailed[g.key] = `${amIn} - ${amOut} / ${pmIn} - ${pmOut}`;
        }
      } else if (selectedBaseDays.includes(g.short)) {
        if (orarioTipo === 'h24') {
          detailed[g.key] = 'H24 (Sempre Aperto)';
        } else if (orarioTipo === 'continuato') {
          detailed[g.key] = `${oraAperturaContinuato} - ${oraChiusuraContinuato}`;
        } else {
          detailed[g.key] = `${oraAperturaMattina} - ${oraChiusuraMattina} / ${oraAperturaPomeriggio} - ${oraChiusuraPomeriggio}`;
        }
      } else {
        detailed[g.key] = 'Chiuso';
      }
    });

    // 2. Genera stringa descrittiva human-readable (per WordPress, WhatsApp e schede riassuntive)
    let orariText = '';

    if (orarioTipo === 'h24' && Object.keys(eccezioni).length === 0 && selectedBaseDays.length === 7) {
      orariText = 'Tutti i giorni H24 (Sempre Aperto)';
    } else {
      // Determina il prefisso dei giorni di base
      let baseDaysPrefix = 'Lun-Sab';
      if (selectedBaseDays.length === 7) baseDaysPrefix = 'Tutti i giorni';
      else if (selectedBaseDays.length === 5 && !selectedBaseDays.includes('Sab') && !selectedBaseDays.includes('Dom')) {
        baseDaysPrefix = 'Lun-Ven';
      } else if (selectedBaseDays.length === 6 && !selectedBaseDays.includes('Dom')) {
        baseDaysPrefix = 'Lun-Sab';
      } else if (selectedBaseDays.length > 0) {
        baseDaysPrefix = selectedBaseDays.join(', ');
      }

      let baseHoursStr = '';
      if (orarioTipo === 'h24') baseHoursStr = 'H24';
      else if (orarioTipo === 'continuato') baseHoursStr = `${oraAperturaContinuato} - ${oraChiusuraContinuato}`;
      else baseHoursStr = `${oraAperturaMattina} - ${oraChiusuraMattina} / ${oraAperturaPomeriggio} - ${oraChiusuraPomeriggio}`;

      const parts: string[] = [];
      if (selectedBaseDays.length > 0) {
        parts.push(`${baseDaysPrefix} ${baseHoursStr}`);
      }

      // Aggiungi le eccezioni
      GIORNI_CONFIG.forEach((g) => {
        const exc = eccezioni[g.key];
        if (exc) {
          if (exc.tipo === 'chiuso') {
            parts.push(`(${g.short} Chiuso)`);
          } else if (exc.tipo === 'solo_mattina') {
            parts.push(`${g.short} ${exc.aperturaMattina || oraAperturaMattina} - ${exc.chiusuraMattina || oraChiusuraMattina}`);
          } else if (exc.tipo === 'solo_pomeriggio') {
            parts.push(`${g.short} ${exc.aperturaPomeriggio || oraAperturaPomeriggio} - ${exc.chiusuraPomeriggio || oraChiusuraPomeriggio}`);
          } else if (exc.tipo === 'continuato') {
            parts.push(`${g.short} ${exc.aperturaContinuato || oraAperturaContinuato} - ${exc.chiusuraContinuato || oraChiusuraContinuato}`);
          } else if (exc.tipo === 'spezzato') {
            parts.push(`${g.short} ${exc.aperturaMattina || oraAperturaMattina} - ${exc.chiusuraMattina || oraChiusuraMattina} / ${exc.aperturaPomeriggio || oraAperturaPomeriggio} - ${exc.chiusuraPomeriggio || oraChiusuraPomeriggio}`);
          }
        } else if (!selectedBaseDays.includes(g.short) && g.short === 'Dom' && !parts.some((p) => p.includes('Dom Chiuso'))) {
          parts.push('(Dom Chiuso)');
        }
      });

      orariText = parts.join(', ').replace(', (', ' (');
    }

    return { orariText, orarioDettagliato: detailed };
  }, [
    orarioTipo,
    oraAperturaMattina,
    oraChiusuraMattina,
    oraAperturaPomeriggio,
    oraChiusuraPomeriggio,
    oraAperturaContinuato,
    oraChiusuraContinuato,
    selectedBaseDays,
    eccezioni,
  ]);

  // Mantiene l'ultimo puntatore a onChange senza invalidare gli effect
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Memorizza l'ultimo valore emesso per evitare chiamate duplicate e loop infiniti
  const lastEmittedRef = useRef<string>('');

  // Notifica padre SOLO quando compiledData varia effettivamente
  useEffect(() => {
    const serialized = JSON.stringify(compiledData);
    if (lastEmittedRef.current === serialized) {
      return;
    }
    lastEmittedRef.current = serialized;
    onChangeRef.current(compiledData);
  }, [compiledData]);

  // Helper per aggiungere/rimuovere eccezioni
  const handleAddException = (giornoKey: string) => {
    setEccezioni((prev) => ({
      ...prev,
      [giornoKey]: giornoKey === 'domenica' ? { tipo: 'chiuso' } : { tipo: 'solo_mattina', aperturaMattina: '08:30', chiusuraMattina: '13:00' },
    }));
    setIsAddMenuOpen(false);
  };

  const handleRemoveException = (giornoKey: string) => {
    setEccezioni((prev) => {
      const next = { ...prev };
      delete next[giornoKey];
      return next;
    });
  };

  const handleUpdateException = (giornoKey: string, updates: Partial<DayException>) => {
    setEccezioni((prev) => ({
      ...prev,
      [giornoKey]: { ...prev[giornoKey], ...updates },
    }));
  };

  // Giorni non ancora presenti nelle eccezioni
  const availableDaysForException = GIORNI_CONFIG.filter((g) => !eccezioni[g.key]);

  return (
    <div className="space-y-4">
      {/* SEZIONE 1: ORARIO BASE PREVALENTE */}
      <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
        <div className="flex items-center justify-between">
          <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs sm:text-sm">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>1. Orario Base Prevalente</span>
          </label>
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
            Applicato ai giorni ordinari
          </span>
        </div>

        {/* Modalità Orario Base */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setOrarioTipo('spezzato')}
            className={`py-2 px-2 rounded-xl text-xs font-bold border text-center transition cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
              orarioTipo === 'spezzato'
                ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-1">
              <Sun className="w-3.5 h-3.5 text-amber-950" />
              <span>Pausa Pranzo</span>
            </div>
            <span className="text-[10px] font-normal opacity-85">Mattina + Sera</span>
          </button>

          <button
            type="button"
            onClick={() => setOrarioTipo('continuato')}
            className={`py-2 px-2 rounded-xl text-xs font-bold border text-center transition cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
              orarioTipo === 'continuato'
                ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Continuato</span>
            </div>
            <span className="text-[10px] font-normal opacity-85">Zero interruzioni</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setOrarioTipo('h24');
              setSelectedBaseDays(['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']);
            }}
            className={`py-2 px-2 rounded-xl text-xs font-bold border text-center transition cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
              orarioTipo === 'h24'
                ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>H24</span>
            </div>
            <span className="text-[10px] font-normal opacity-85">Sempre aperto</span>
          </button>
        </div>

        {/* Fasce Selezionabili Orario Base */}
        {orarioTipo === 'spezzato' && (
          <div className="space-y-2.5 pt-1.5 border-t border-slate-200 dark:border-slate-700/80">
            {/* Fascia Mattina */}
            <div className="p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-900 dark:text-amber-300 mb-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-600" />
                <span>Mattina</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                    Apertura
                  </label>
                  <select
                    value={oraAperturaMattina}
                    onChange={(e) => setOraAperturaMattina(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
                  >
                    {TIME_SLOTS.map((t) => (
                      <option key={`base-am-in-${t}`} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                    Chiusura Pausa
                  </label>
                  <select
                    value={oraChiusuraMattina}
                    onChange={(e) => setOraChiusuraMattina(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
                  >
                    {TIME_SLOTS.map((t) => (
                      <option key={`base-am-out-${t}`} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Fascia Pomeriggio / Sera */}
            <div className="p-2.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/40">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-900 dark:text-blue-300 mb-1.5">
                <Moon className="w-3.5 h-3.5 text-blue-600" />
                <span>Pomeriggio / Sera</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                    Riapertura
                  </label>
                  <select
                    value={oraAperturaPomeriggio}
                    onChange={(e) => setOraAperturaPomeriggio(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
                  >
                    {TIME_SLOTS.map((t) => (
                      <option key={`base-pm-in-${t}`} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                    Chiusura Serale
                  </label>
                  <select
                    value={oraChiusuraPomeriggio}
                    onChange={(e) => setOraChiusuraPomeriggio(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
                  >
                    {TIME_SLOTS.map((t) => (
                      <option key={`base-pm-out-${t}`} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {orarioTipo === 'continuato' && (
          <div className="p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 pt-1.5">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                  Ora Apertura
                </label>
                <select
                  value={oraAperturaContinuato}
                  onChange={(e) => setOraAperturaContinuato(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
                >
                  {TIME_SLOTS.map((t) => (
                    <option key={`base-cont-in-${t}`} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                  Ora Chiusura
                </label>
                <select
                  value={oraChiusuraContinuato}
                  onChange={(e) => setOraChiusuraContinuato(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
                >
                  {TIME_SLOTS.map((t) => (
                    <option key={`base-cont-out-${t}`} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* 2. Giorni ai quali applicare l'orario base */}
        <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-700/80">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Giorni con questo orario base:
            </span>
            {/* Preset rapidi */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSelectedBaseDays(['Lun', 'Mar', 'Mer', 'Gio', 'Ven'])}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition cursor-pointer ${
                  selectedBaseDays.length === 5 && !selectedBaseDays.includes('Sab') && !selectedBaseDays.includes('Dom')
                    ? 'bg-[#781816] text-white border-[#781816]'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                Lun-Ven
              </button>
              <button
                type="button"
                onClick={() => setSelectedBaseDays(['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'])}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition cursor-pointer ${
                  selectedBaseDays.length === 6 && !selectedBaseDays.includes('Dom')
                    ? 'bg-[#781816] text-white border-[#781816]'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                Lun-Sab
              </button>
              <button
                type="button"
                onClick={() => setSelectedBaseDays(['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'])}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition cursor-pointer ${
                  selectedBaseDays.length === 7
                    ? 'bg-[#781816] text-white border-[#781816]'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                Tutti i giorni
              </button>
            </div>
          </div>

          {/* Chips singoli giorni cliccabili */}
          <div className="grid grid-cols-7 gap-1">
            {GIORNI_CONFIG.map((g) => {
              const isBaseSelected = selectedBaseDays.includes(g.short);
              const hasException = !!eccezioni[g.key];
              return (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => {
                    if (isBaseSelected) {
                      setSelectedBaseDays(selectedBaseDays.filter((d) => d !== g.short));
                    } else {
                      setSelectedBaseDays([...selectedBaseDays, g.short]);
                    }
                  }}
                  className={`py-1.5 text-center text-xs font-bold rounded-xl border transition cursor-pointer relative ${
                    hasException
                      ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border-amber-400'
                      : isBaseSelected
                      ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span>{g.short}</span>
                  {hasException && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 border border-white dark:border-slate-900" title="Orario personalizzato attivo" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* SEZIONE 2: ECCEZIONI E ORARI DIVERSI PER GIORNI SPECIFICI */}
      <div className="p-3.5 sm:p-4 bg-amber-50/50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800/50 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span>2. Orari Diversi o Chiusure in Giorni Specifici</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
              Personalizza il Sabato, la Domenica o un giorno di riposo infrasettimanale
            </p>
          </div>

          {/* Bottone Aggiungi Eccezione Giorno */}
          {availableDaysForException.length > 0 && (
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Aggiungi Giorno Diverso</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {isAddMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-52 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-1.5 z-30 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">
                    Scegli giorno da personalizzare:
                  </div>
                  {availableDaysForException.map((g) => (
                    <button
                      key={`add-${g.key}`}
                      type="button"
                      onClick={() => handleAddException(g.key)}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-900 dark:hover:text-amber-200 transition flex items-center justify-between cursor-pointer"
                    >
                      <span>{g.full}</span>
                      <span className="text-[10px] text-slate-400">{g.short}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Elenco Eccezioni Attive */}
        {Object.keys(eccezioni).length === 0 ? (
          <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-dashed border-amber-300 dark:border-amber-800 text-xs text-slate-600 dark:text-slate-400 text-center space-y-1">
            <p>Nessun orario differenziato impostato: tutti i giorni seguono l'orario base standard.</p>
            <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
              💡 Clicca su <strong>"+ Aggiungi Giorno Diverso"</strong> per impostare ad esempio la mezza giornata del Giovedì, la chiusura domenicale o l'apertura speciale del Sabato.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {GIORNI_CONFIG.map((g) => {
              const exc = eccezioni[g.key];
              if (!exc) return null;

              return (
                <div
                  key={`exc-card-${g.key}`}
                  className="p-3 sm:p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-800/80 shadow-xs space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-800 dark:text-amber-200 font-black text-xs flex items-center justify-center">
                        {g.short}
                      </span>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                        {g.full}
                      </h4>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveException(g.key)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                      title={`Rimuovi eccezione per ${g.full} (torna a orario base)`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Pulsanti Rapidi 1-Tap: Chiuso / Solo Mattina / Solo Pomeriggio / Continuato / Spezzato */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleUpdateException(g.key, { tipo: 'chiuso' })}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition cursor-pointer text-center ${
                        exc.tipo === 'chiuso'
                          ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      🚫 Chiuso
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUpdateException(g.key, {
                        tipo: 'solo_mattina',
                        aperturaMattina: exc.aperturaMattina || oraAperturaMattina,
                        chiusuraMattina: exc.chiusuraMattina || oraChiusuraMattina,
                      })}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition cursor-pointer text-center ${
                        exc.tipo === 'solo_mattina'
                          ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      ☀️ Solo Mattina
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUpdateException(g.key, {
                        tipo: 'solo_pomeriggio',
                        aperturaPomeriggio: exc.aperturaPomeriggio || oraAperturaPomeriggio,
                        chiusuraPomeriggio: exc.chiusuraPomeriggio || oraChiusuraPomeriggio,
                      })}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition cursor-pointer text-center ${
                        exc.tipo === 'solo_pomeriggio'
                          ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      🌙 Solo Pom.
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUpdateException(g.key, {
                        tipo: 'continuato',
                        aperturaContinuato: exc.aperturaContinuato || oraAperturaContinuato,
                        chiusuraContinuato: exc.chiusuraContinuato || oraChiusuraContinuato,
                      })}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition cursor-pointer text-center ${
                        exc.tipo === 'continuato'
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      🔄 Continuato
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUpdateException(g.key, {
                        tipo: 'spezzato',
                        aperturaMattina: exc.aperturaMattina || oraAperturaMattina,
                        chiusuraMattina: exc.chiusuraMattina || oraChiusuraMattina,
                        aperturaPomeriggio: exc.aperturaPomeriggio || oraAperturaPomeriggio,
                        chiusuraPomeriggio: exc.chiusuraPomeriggio || oraChiusuraPomeriggio,
                      })}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition cursor-pointer text-center col-span-2 sm:col-span-1 ${
                        exc.tipo === 'spezzato'
                          ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      ⏱️ Spezzato
                    </button>
                  </div>

                  {/* Selettori specifici per la modalità dell'eccezione */}
                  {exc.tipo === 'chiuso' && (
                    <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-[11px] text-rose-800 dark:text-rose-300 flex items-center gap-1.5 font-medium">
                      <span>Attività chiusa per l'intera giornata di {g.full}.</span>
                    </div>
                  )}

                  {exc.tipo === 'solo_mattina' && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                          Apertura Mattina
                        </label>
                        <select
                          value={exc.aperturaMattina || oraAperturaMattina}
                          onChange={(e) => handleUpdateException(g.key, { aperturaMattina: e.target.value })}
                          className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                        >
                          {TIME_SLOTS.map((t) => (
                            <option key={`exc-am-in-${g.key}-${t}`} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                          Chiusura Pomeridiana
                        </label>
                        <select
                          value={exc.chiusuraMattina || oraChiusuraMattina}
                          onChange={(e) => handleUpdateException(g.key, { chiusuraMattina: e.target.value })}
                          className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                        >
                          {TIME_SLOTS.map((t) => (
                            <option key={`exc-am-out-${g.key}-${t}`} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {exc.tipo === 'solo_pomeriggio' && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                          Apertura Pomeridiana
                        </label>
                        <select
                          value={exc.aperturaPomeriggio || oraAperturaPomeriggio}
                          onChange={(e) => handleUpdateException(g.key, { aperturaPomeriggio: e.target.value })}
                          className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                        >
                          {TIME_SLOTS.map((t) => (
                            <option key={`exc-pm-in-${g.key}-${t}`} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                          Chiusura Notturna / Serale
                        </label>
                        <select
                          value={exc.chiusuraPomeriggio || oraChiusuraPomeriggio}
                          onChange={(e) => handleUpdateException(g.key, { chiusuraPomeriggio: e.target.value })}
                          className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                        >
                          {TIME_SLOTS.map((t) => (
                            <option key={`exc-pm-out-${g.key}-${t}`} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {exc.tipo === 'continuato' && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                          Apertura
                        </label>
                        <select
                          value={exc.aperturaContinuato || oraAperturaContinuato}
                          onChange={(e) => handleUpdateException(g.key, { aperturaContinuato: e.target.value })}
                          className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                        >
                          {TIME_SLOTS.map((t) => (
                            <option key={`exc-cont-in-${g.key}-${t}`} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                          Chiusura
                        </label>
                        <select
                          value={exc.chiusuraContinuato || oraChiusuraContinuato}
                          onChange={(e) => handleUpdateException(g.key, { chiusuraContinuato: e.target.value })}
                          className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                        >
                          {TIME_SLOTS.map((t) => (
                            <option key={`exc-cont-out-${g.key}-${t}`} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {exc.tipo === 'spezzato' && (
                    <div className="space-y-2 pt-1">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">
                            Mattina In
                          </label>
                          <select
                            value={exc.aperturaMattina || oraAperturaMattina}
                            onChange={(e) => handleUpdateException(g.key, { aperturaMattina: e.target.value })}
                            className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                          >
                            {TIME_SLOTS.map((t) => (
                              <option key={`exc-sp-am-in-${g.key}-${t}`} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">
                            Mattina Out
                          </label>
                          <select
                            value={exc.chiusuraMattina || oraChiusuraMattina}
                            onChange={(e) => handleUpdateException(g.key, { chiusuraMattina: e.target.value })}
                            className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                          >
                            {TIME_SLOTS.map((t) => (
                              <option key={`exc-sp-am-out-${g.key}-${t}`} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">
                            Pomeriggio In
                          </label>
                          <select
                            value={exc.aperturaPomeriggio || oraAperturaPomeriggio}
                            onChange={(e) => handleUpdateException(g.key, { aperturaPomeriggio: e.target.value })}
                            className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                          >
                            {TIME_SLOTS.map((t) => (
                              <option key={`exc-sp-pm-in-${g.key}-${t}`} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">
                            Sera Out
                          </label>
                          <select
                            value={exc.chiusuraPomeriggio || oraChiusuraPomeriggio}
                            onChange={(e) => handleUpdateException(g.key, { chiusuraPomeriggio: e.target.value })}
                            className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                          >
                            {TIME_SLOTS.map((t) => (
                              <option key={`exc-sp-pm-out-${g.key}-${t}`} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SEZIONE 3: ANTEPRIMA GRAFICA SETTIMANALE & STRINGA RISULTANTE */}
      {showPreview && (
        <div className="p-3.5 bg-slate-100/80 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Anteprima Grafica Settimanale per i Residenti:</span>
            </span>
            <span className="text-[10px] text-slate-400">Tempo Reale</span>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl p-2.5 border border-slate-200 dark:border-slate-700">
            <GraficoOrariSettimana
              shop={{
                orari: compiledData.orariText,
                orarioDettagliato: compiledData.orarioDettagliato,
              }}
              darkMode={darkMode}
            />
          </div>

          {/* Dettaglio sintetico stringa generata */}
          <div className="text-[11px] text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-200/80 dark:border-slate-700/80 font-medium">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Riepilogo generato per la scheda:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{compiledData.orariText}</span>
          </div>
        </div>
      )}
    </div>
  );
};
