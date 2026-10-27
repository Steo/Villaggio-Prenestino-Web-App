import React, { useState, useMemo } from 'react';
import { EventoQuartiere, UserInteractions, TipoEvento } from '../types';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  Share2,
  PlusCircle,
  CalendarDays,
  Sparkles,
  Info,
  CalendarCheck,
  Tag,
  ExternalLink,
  Image,
  CalendarPlus,
} from 'lucide-react';
import { EventDescription } from './EventDescription';
import { getGoogleCalendarUrl } from '../utils/calendarUtils';

interface CalendarioMensileEventiProps {
  eventi: EventoQuartiere[];
  interactions: UserInteractions;
  onRequestJoinEvento: (evento: EventoQuartiere) => void;
  onShareEvento: (evento: EventoQuartiere) => void;
  renderTipoTag: (tipo?: TipoEvento, passato?: boolean, quota?: string) => React.ReactNode;
  onOpenPhoto?: (url: string) => void;
}

const NOMI_MESI = [
  'Gennaio',
  'Febbraio',
  'Marzo',
  'Aprile',
  'Maggio',
  'Giugno',
  'Luglio',
  'Agosto',
  'Settembre',
  'Ottobre',
  'Novembre',
  'Dicembre',
];

const GIORNI_SETTIMANA = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

const MONTH_LOOKUP: Record<string, number> = {
  'GEN': 0, 'GENNAIO': 0, '01': 0, '1': 0,
  'FEB': 1, 'FEBBRAIO': 1, '02': 1, '2': 1,
  'MAR': 2, 'MARZO': 2, '03': 2, '3': 2,
  'APR': 3, 'APRILE': 3, '04': 3, '4': 3,
  'MAG': 4, 'MAGGIO': 4, '05': 4, '5': 4,
  'GIU': 5, 'GIUGNO': 5, '06': 5, '6': 5,
  'LUG': 6, 'LUGLIO': 6, '07': 6, '7': 6,
  'AGO': 7, 'AGOSTO': 7, '08': 7, '8': 7,
  'SET': 8, 'SETTEMBRE': 8, '09': 8, '9': 8,
  'OTT': 9, 'OTTOBRE': 9, '10': 9,
  'NOV': 10, 'NOVEMBRE': 10, '11': 10,
  'DIC': 11, 'DICEMBRE': 11, '12': 11,
};

/**
 * Estrae data normalizzata per un evento (supporta sia dataCompleta YYYY-MM-DD sia d/m/anno)
 */
export function parseEventoDate(ev: EventoQuartiere): {
  year: number;
  month: number;
  day: number;
  key: string;
} {
  if (ev.dataCompleta && /^\d{4}-\d{2}-\d{2}/.test(ev.dataCompleta)) {
    const parts = ev.dataCompleta.split('-');
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return {
      year: y,
      month: m,
      day: d,
      key: `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    };
  }

  const cleanMonth = (ev.m || '').toUpperCase().trim();
  const m = MONTH_LOOKUP[cleanMonth] ?? 9; // Default ottobre se non specificato
  const d = parseInt(ev.d, 10) || 1;
  const y = ev.anno ? parseInt(ev.anno, 10) : 2026;
  return {
    year: y,
    month: m,
    day: d,
    key: `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
  };
}

export const CalendarioMensileEventi: React.FC<CalendarioMensileEventiProps> = ({
  eventi,
  interactions,
  onRequestJoinEvento,
  onShareEvento,
  renderTipoTag,
  onOpenPhoto,
}) => {
  // Data odierna di riferimento (Ottobre 2026)
  const today = useMemo(() => new Date(2026, 9, 12), []);
  const todayKey = useMemo(
    () =>
      `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
        today.getDate()
      ).padStart(2, '0')}`,
    [today]
  );

  // Mese e anno visualizzati attualmente nel calendario
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(9); // 0-indexed: 9 = Ottobre

  // Filtro tipologia opzionale dentro il calendario
  const [tipoFiltro, setTipoFiltro] = useState<'tutti' | TipoEvento>('tutti');

  // Mappatura eventi per chiave data (YYYY-MM-DD)
  const eventiByDate = useMemo(() => {
    const map = new Map<string, EventoQuartiere[]>();
    for (const ev of eventi) {
      if (tipoFiltro !== 'tutti' && (ev.tipo || 'volontariato') !== tipoFiltro) {
        continue;
      }
      const parsed = parseEventoDate(ev);
      const list = map.get(parsed.key) || [];
      list.push(ev);
      map.set(parsed.key, list);
    }
    return map;
  }, [eventi, tipoFiltro]);

  // Eventi del mese correntemente selezionato
  const eventiDelMese = useMemo(() => {
    return eventi
      .filter((ev) => {
        if (tipoFiltro !== 'tutti' && (ev.tipo || 'volontariato') !== tipoFiltro) {
          return false;
        }
        const parsed = parseEventoDate(ev);
        return parsed.year === currentYear && parsed.month === currentMonth;
      })
      .sort((a, b) => {
        const da = parseEventoDate(a);
        const db = parseEventoDate(b);
        return da.day - db.day;
      });
  }, [eventi, currentYear, currentMonth, tipoFiltro]);

  // Seleziona come data iniziale del mese la data del primo evento presente, oppure il giorno 12
  const defaultSelectedDate = useMemo(() => {
    if (eventiDelMese.length > 0) {
      return parseEventoDate(eventiDelMese[0]).key;
    }
    return `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
  }, [eventiDelMese, currentYear, currentMonth]);

  const [selectedDateKey, setSelectedDateKey] = useState<string>(defaultSelectedDate);

  // Aggiorna la selezione quando si cambia mese se la data precedente non è del nuovo mese
  const handleMonthChange = (offset: number) => {
    let newMonth = currentMonth + offset;
    let newYear = currentYear;
    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }
    setCurrentYear(newYear);
    setCurrentMonth(newMonth);

    // Trova eventi nel nuovo mese per selezionare subito una data utile
    const eventsInNewMonth = eventi.filter((ev) => {
      const p = parseEventoDate(ev);
      return p.year === newYear && p.month === newMonth;
    });

    if (eventsInNewMonth.length > 0) {
      setSelectedDateKey(parseEventoDate(eventsInNewMonth[0]).key);
    } else {
      setSelectedDateKey(`${newYear}-${String(newMonth + 1).padStart(2, '0')}-01`);
    }
  };

  const handleGoToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDateKey(todayKey);
  };

  // Costruzione della griglia mensile (giorni del mese precedente, giorni attuali, giorni mese successivo)
  const calendarCells = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayDow = new Date(currentYear, currentMonth, 1).getDay();
    // In Italia la settimana inizia di Lunedì (0: Lunedì, ..., 6: Domenica)
    const startOffset = (firstDayDow + 6) % 7;

    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

    interface CellData {
      day: number;
      month: number;
      year: number;
      key: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      events: EventoQuartiere[];
    }

    const cells: CellData[] = [];

    // Giorni mese precedente
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const m = currentMonth === 0 ? 11 : currentMonth - 1;
      const y = currentMonth === 0 ? currentYear - 1 : currentYear;
      const key = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        day: d,
        month: m,
        year: y,
        key,
        isCurrentMonth: false,
        isToday: key === todayKey,
        isSelected: key === selectedDateKey,
        events: eventiByDate.get(key) || [],
      });
    }

    // Giorni del mese corrente
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        day: d,
        month: currentMonth,
        year: currentYear,
        key,
        isCurrentMonth: true,
        isToday: key === todayKey,
        isSelected: key === selectedDateKey,
        events: eventiByDate.get(key) || [],
      });
    }

    // Riempimento giorni mese successivo per completare le righe (multiplo di 7)
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const m = currentMonth === 11 ? 0 : currentMonth + 1;
      const y = currentMonth === 11 ? currentYear + 1 : currentYear;
      const key = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        day: d,
        month: m,
        year: y,
        key,
        isCurrentMonth: false,
        isToday: key === todayKey,
        isSelected: key === selectedDateKey,
        events: eventiByDate.get(key) || [],
      });
    }

    return cells;
  }, [currentYear, currentMonth, todayKey, selectedDateKey, eventiByDate]);

  // Eventi della data selezionata
  const eventiSelezionati = eventiByDate.get(selectedDateKey) || [];

  // Formatta data selezionata per il titolo del dettaglio
  const dataSelezionataFormattata = useMemo(() => {
    if (!selectedDateKey) return '';
    const [y, m, d] = selectedDateKey.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const giorniCompleti = [
      'Domenica',
      'Lunedì',
      'Martedì',
      'Mercoledì',
      'Giovedì',
      'Venerdì',
      'Sabato',
    ];
    const giornoNome = giorniCompleti[dateObj.getDay()];
    const meseNome = NOMI_MESI[m - 1];
    return `${giornoNome} ${d} ${meseNome} ${y}`;
  }, [selectedDateKey]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Contenitore principale del Calendario Mensile */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Header di navigazione del mese */}
        <div className="p-4 sm:p-6 border-b border-slate-200/80 dark:border-slate-800 bg-linear-to-r from-slate-50 via-white to-amber-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-850">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Titolo Mese ed Anno con tasti cambio mese */}
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-xs shrink-0"
                style={{ backgroundColor: '#781816' }}
              >
                <CalendarDays className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {NOMI_MESI[currentMonth]} {currentYear}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-950 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                    {eventiDelMese.length} {eventiDelMese.length === 1 ? 'evento' : 'eventi'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tocca un giorno con indicatori per consultare gli appuntamenti del quartiere
                </p>
              </div>
            </div>

            {/* Controlli di navigazione (Mese precedente / Oggi / Mese successivo) */}
            <div className="flex items-center gap-2 self-start sm:self-center">
              <button
                type="button"
                onClick={() => handleMonthChange(-1)}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition cursor-pointer active:scale-95 shadow-2xs"
                title="Mese precedente"
                aria-label="Mese precedente"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleGoToToday}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer active:scale-95"
              >
                Oggi
              </button>

              <button
                type="button"
                onClick={() => handleMonthChange(1)}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition cursor-pointer active:scale-95 shadow-2xs"
                title="Mese successivo"
                aria-label="Mese successivo"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filtro per tipologia di evento all'interno del calendario */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
                <Tag className="w-3 h-3 text-slate-400" />
                Tipologia:
              </span>
              <button
                type="button"
                onClick={() => setTipoFiltro('tutti')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  tipoFiltro === 'tutti'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Tutti
              </button>
              <button
                type="button"
                onClick={() => setTipoFiltro('volontariato')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  tipoFiltro === 'volontariato'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 hover:bg-emerald-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Volontariato
              </button>
              <button
                type="button"
                onClick={() => setTipoFiltro('pagamento')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  tipoFiltro === 'pagamento'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-amber-50 text-amber-900 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 hover:bg-amber-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                A Pagamento
              </button>
              <button
                type="button"
                onClick={() => setTipoFiltro('gratuito')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  tipoFiltro === 'gratuito'
                    ? 'bg-sky-600 text-white shadow-2xs'
                    : 'bg-sky-50 text-sky-900 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800 hover:bg-sky-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                Gratuiti
              </button>
            </div>

            {/* Legenda rapida icone */}
            <div className="hidden lg:flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Volontariato (+5 pts)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span> Con Quota
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-sky-500"></span> Gratuito
              </span>
            </div>
          </div>
        </div>

        {/* Intestazione giorni della settimana (Lun - Dom) */}
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/60 text-center">
          {GIORNI_SETTIMANA.map((g, idx) => (
            <div
              key={g}
              className={`py-2 text-[11px] sm:text-xs font-black uppercase tracking-wider ${
                idx >= 5
                  ? 'text-amber-700 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {g}
            </div>
          ))}
        </div>

        {/* Griglia giorni del mese */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800/80 bg-slate-100/30 dark:bg-slate-950/20">
          {calendarCells.map((cell) => {
            const hasEvents = cell.events.length > 0;
            const isAttendingAny = cell.events.some((ev) =>
              interactions.eventiPartecipati.includes(ev.id)
            );

            return (
              <div
                key={cell.key}
                onClick={() => setSelectedDateKey(cell.key)}
                className={`min-h-[72px] sm:min-h-[105px] p-1.5 sm:p-2 transition relative flex flex-col justify-between cursor-pointer select-none group ${
                  cell.isCurrentMonth
                    ? cell.isSelected
                      ? 'bg-amber-50/90 dark:bg-amber-950/40 ring-2 ring-inset ring-amber-500'
                      : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/70'
                    : 'bg-slate-50/40 dark:bg-slate-950/50 opacity-40 hover:opacity-75'
                }`}
              >
                {/* Intestazione cella: numero giorno ed indicatori */}
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`inline-flex items-center justify-center text-xs sm:text-sm font-black rounded-lg w-6 h-6 sm:w-7 sm:h-7 transition ${
                      cell.isToday
                        ? 'bg-[#781816] text-white shadow-xs'
                        : cell.isSelected
                        ? 'bg-amber-500 text-slate-950'
                        : cell.isCurrentMonth
                        ? 'text-slate-900 dark:text-slate-100'
                        : 'text-slate-400 dark:text-slate-600'
                    }`}
                  >
                    {cell.day}
                  </span>

                  {/* Badge partecipato o conteggio mobile */}
                  {hasEvents && (
                    <div className="flex items-center gap-1">
                      {isAttendingAny && (
                        <span
                          className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] shadow-2xs"
                          title="Hai confermato la tua presenza a un evento di oggi!"
                        >
                          ✓
                        </span>
                      )}
                      <span className="sm:hidden px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-900 dark:text-amber-300 text-[10px] font-black">
                        {cell.events.length}
                      </span>
                    </div>
                  )}
                </div>

                {/* Contenuto Eventi dentro la cella */}
                {hasEvents ? (
                  <div className="mt-1 space-y-1 w-full">
                    {/* Visualizzazione Mobile: pallini colorati per tipo */}
                    <div className="flex sm:hidden items-center gap-1 flex-wrap pt-0.5">
                      {cell.events.map((ev) => {
                        const dotColor =
                          ev.tipo === 'pagamento'
                            ? 'bg-amber-500'
                            : ev.tipo === 'gratuito'
                            ? 'bg-sky-500'
                            : 'bg-emerald-500';
                        return (
                          <span
                            key={ev.id}
                            className={`w-2 h-2 rounded-full ${dotColor} ring-1 ring-white dark:ring-slate-900`}
                          />
                        );
                      })}
                    </div>

                    {/* Visualizzazione Desktop (sm+): badge con ora e titolo troncato */}
                    <div className="hidden sm:block space-y-1">
                      {cell.events.slice(0, 2).map((ev) => {
                        const isPart = interactions.eventiPartecipati.includes(ev.id);
                        const pillBg =
                          ev.tipo === 'pagamento'
                            ? 'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300'
                            : ev.tipo === 'gratuito'
                            ? 'bg-sky-100 text-sky-950 border-sky-300 dark:bg-sky-950/80 dark:text-sky-300'
                            : 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300';

                        return (
                          <div
                            key={ev.id}
                            className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold border truncate transition flex items-center gap-1 shadow-2xs ${pillBg} ${
                              cell.isSelected ? 'ring-1 ring-amber-400' : ''
                            }`}
                            title={`${ev.ora} - ${ev.t}`}
                          >
                            <span className="font-mono text-[9px] opacity-80 shrink-0">
                              {ev.ora}
                            </span>
                            <span className="truncate">{ev.t}</span>
                            {isPart && (
                              <span className="text-emerald-700 dark:text-emerald-300 shrink-0 font-black">
                                ✓
                              </span>
                            )}
                          </div>
                        );
                      })}
                      {cell.events.length > 2 && (
                        <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 pl-1">
                          +{cell.events.length - 2} altri
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="hidden sm:block h-3"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* DETTAGLIO: Appuntamenti della data selezionata */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Giorno Selezionato
            </span>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white capitalize">
              {dataSelezionataFormattata}
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
            {eventiSelezionati.length}{' '}
            {eventiSelezionati.length === 1 ? 'evento in questa data' : 'eventi in questa data'}
          </span>
        </div>

        {eventiSelezionati.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 text-center border border-slate-200/90 dark:border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Nessun evento in programma per questa data
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Tocca un giorno della griglia contrassegnato dagli indicatori colorati oppure
                consulta la lista completa degli appuntamenti di {NOMI_MESI[currentMonth]} qui sotto.
              </p>
            </div>
            {eventiDelMese.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedDateKey(parseEventoDate(eventiDelMese[0]).key)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 shadow-xs cursor-pointer transition"
              >
                Vai al prossimo appuntamento ({eventiDelMese[0].d} {eventiDelMese[0].m})
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3.5">
            {eventiSelezionati.map((ev) => {
              const isAttending = interactions.eventiPartecipati.includes(ev.id);
              const isPagamento = ev.tipo === 'pagamento';
              const posterUrl = ev.featured_media_url || ev.immagine_in_evidenza || ev.locandina;

              return (
                <div
                  key={ev.id}
                  className={`bg-white dark:bg-slate-900 rounded-2xl border p-4 sm:p-5 shadow-xs transition flex flex-col sm:flex-row gap-3 sm:gap-4 items-start ${
                    ev.passato
                      ? 'border-slate-200/60 dark:border-slate-800 opacity-75 grayscale-[20%]'
                      : 'border-slate-200/90 dark:border-slate-800 hover:shadow-sm ring-1 ring-amber-400/30'
                  }`}
                >
                  {/* Badge data stile cartolina */}
                  <div
                    className="w-12 sm:w-16 rounded-xl text-white text-center py-2 px-1 shadow-xs shrink-0 self-start"
                    style={{ backgroundColor: ev.passato ? '#64748b' : '#781816' }}
                  >
                    <span className="block text-xl sm:text-2xl font-black text-amber-300 leading-none">
                      {ev.d}
                    </span>
                    <span className="block text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-white/90 mt-0.5">
                      {ev.m}
                    </span>
                    {ev.anno && (
                      <span className="block text-[9px] font-bold text-amber-200/80 mt-0.5">
                        {ev.anno}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-2 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                        {ev.t}
                      </h3>
                      {ev.passato && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 shrink-0 self-start">
                          Concluso
                        </span>
                      )}
                    </div>

                    {/* Tag tipologia, orario e luogo */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-600 dark:text-slate-300 font-semibold">
                      {renderTipoTag(ev.tipo, ev.passato, ev.quota)}
                      <span className="flex items-center gap-1 text-amber-800 dark:text-amber-300 font-bold">
                        <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        Ore {ev.ora}
                      </span>
                      <a
                        href={ev.lat && ev.lng ? `https://www.google.com/maps/search/?api=1&query=${ev.lat},${ev.lng}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ev.luogo + (ev.luogo.toLowerCase().includes('villaggio prenestino') ? '' : ', Villaggio Prenestino, Roma'))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors group/calmap"
                        title="Visualizza questo indirizzo su Google Maps"
                      >
                        <MapPin className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 group-hover/calmap:scale-110 transition-transform" />
                        <span className="underline decoration-slate-300 dark:decoration-slate-600 underline-offset-2">{ev.luogo}</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover/calmap:opacity-100 shrink-0" />
                      </a>
                    </div>

                    <EventDescription
                      text={ev.p}
                      textColor="text-slate-600 dark:text-slate-300"
                      className="pt-1"
                    />

                    {/* Barra inferiore con partecipanti e bottoni azione */}
                    {!ev.passato && (
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2.5">
                        {/* Prima riga: contatore e tasti secondari (Vedi Locandina, Condividi) */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>
                              <strong>{ev.n}</strong> {isPagamento ? 'iscritti' : 'confermati'}
                            </span>
                          </span>

                          {posterUrl && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenPhoto?.(posterUrl);
                              }}
                              className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 active:bg-amber-200 border border-amber-200 dark:border-amber-800/80 shadow-2xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
                              title="Apri e visualizza la locandina a tutto schermo"
                              aria-label="Apri locandina dell'evento"
                            >
                              <Image className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 stroke-[2.3]" />
                              <span>Apri locandina</span>
                            </button>
                          )}
                        </div>

                        {/* Seconda riga: AZIONE PRINCIPALE - Tasto Iscriviti con Tasto Condividi alla sua destra (solo icona) */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onRequestJoinEvento(ev)}
                            className={`flex-1 min-h-[42px] sm:min-h-[44px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-xs hover:shadow-sm active:scale-[0.99] ${
                              isAttending
                                ? 'bg-amber-100 text-amber-950 border border-amber-300 hover:bg-amber-200 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-700'
                                : 'bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 shadow-md'
                            }`}
                          >
                            {isAttending ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                                <span>{isPagamento ? "Iscritto all'evento ✓ (Tocca per annullare)" : "Ci sarai ✓ (Tocca per annullare)"}</span>
                              </>
                            ) : (
                              <>
                                <PlusCircle className="w-4 h-4" />
                                <span>{isPagamento ? "Iscriviti all'evento" : "Iscriviti / Ci sarò (+5 pts civici)"}</span>
                              </>
                            )}
                          </button>

                          <a
                            href={getGoogleCalendarUrl(ev)}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Aggiungi al tuo calendario Google Calendar"
                            aria-label="Aggiungi al tuo calendario"
                            className="w-[42px] h-[42px] sm:w-[44px] sm:h-[44px] rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white shadow-xs hover:shadow transition flex items-center justify-center cursor-pointer shrink-0"
                          >
                            <CalendarPlus className="w-4 h-4 text-white stroke-[2.3]" />
                          </a>

                          <button
                            type="button"
                            onClick={() => onShareEvento(ev)}
                            title="Condividi evento su WhatsApp o altre app"
                            aria-label="Condividi evento su WhatsApp o altre app"
                            className="w-[42px] h-[42px] sm:w-[44px] sm:h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white shadow-xs hover:shadow transition flex items-center justify-center cursor-pointer shrink-0"
                          >
                            <Share2 className="w-4 h-4 text-white stroke-[2.3]" />
                          </button>
                        </div>
                      </div>
                    )}

                    {ev.passato && (
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-slate-400" />
                          <strong>{ev.n}</strong> partecipanti registrati
                        </span>
                        {posterUrl && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenPhoto?.(posterUrl);
                            }}
                            className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 shadow-2xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
                            title="Apri e visualizza la locandina a tutto schermo"
                            aria-label="Apri locandina dell'evento concluso"
                          >
                            <Image className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 stroke-[2.3]" />
                            <span>Apri locandina</span>
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
      </section>

      {/* AGENDA COMPLETA DEL MESE (Lista cronologica rapida per navigare a colpo d'occhio) */}
      <section className="bg-slate-50 dark:bg-slate-900/60 rounded-3xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              Tutti gli appuntamenti di {NOMI_MESI[currentMonth]} {currentYear}
            </h4>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {eventiDelMese.length} in programma
          </span>
        </div>

        {eventiDelMese.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 italic">
            Nessun evento registrato per questo mese. Usa le frecce per consultare i mesi successivi.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {eventiDelMese.map((ev) => {
              const parsed = parseEventoDate(ev);
              const isSelected = selectedDateKey === parsed.key;
              const isAttending = interactions.eventiPartecipati.includes(ev.id);

              return (
                <div
                  key={ev.id}
                  onClick={() => setSelectedDateKey(parsed.key)}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 text-left ${
                    isSelected
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 dark:border-amber-600 ring-1 ring-amber-400 shadow-2xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-amber-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 rounded-xl text-white text-center py-1 px-0.5 shrink-0"
                      style={{ backgroundColor: ev.passato ? '#64748b' : '#781816' }}
                    >
                      <span className="block text-base font-black text-amber-300 leading-none">
                        {ev.d}
                      </span>
                      <span className="block text-[8px] font-bold tracking-wider uppercase text-white/90">
                        {ev.m}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {ev.t}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>•</span>
                        <a
                          href={ev.lat && ev.lng ? `https://www.google.com/maps/search/?api=1&query=${ev.lat},${ev.lng}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ev.luogo + (ev.luogo.toLowerCase().includes('villaggio prenestino') ? '' : ', Villaggio Prenestino, Roma'))}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="truncate hover:text-blue-600 dark:hover:text-blue-400 underline decoration-slate-300 dark:decoration-slate-600 underline-offset-2 flex items-center gap-0.5"
                          title="Visualizza questo indirizzo su Google Maps"
                        >
                          <span className="truncate">{ev.luogo}</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-60 shrink-0" />
                        </a>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isAttending && (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                        Iscritto ✓
                      </span>
                    )}
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400 group-hover:translate-x-0.5 transition">
                      Visualizza →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
