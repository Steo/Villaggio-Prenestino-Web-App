import React, { useState } from 'react';
import { 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Sun, 
  Moon, 
  Sparkles,
  AlertCircle,
  Calendar,
  X as XIcon,
  CheckCircle2,
  Timer
} from 'lucide-react';
import { AttivitaCommercio } from '../types';
import { 
  getShopOpeningStatus, 
  getWeeklySchedule, 
  getRomeDateTime,
  DayScheduleItem,
  OpeningStatus,
  ScheduleShift
} from '../utils/openingHoursUtils';

interface GraficoOrariSettimanaProps {
  shop: Partial<AttivitaCommercio>;
  variant?: 'compact' | 'expanded';
  darkMode?: boolean;
}

/**
 * Calcola posizione percentuale orizzontale su un asse temporale dalle 07:00 alle 23:00 (16 ore = 960 min)
 */
function getTimelinePercentage(minutes: number): number {
  const minTime = 7 * 60;  // 07:00 (420 min)
  const maxTime = 23 * 60; // 23:00 (1380 min)
  const clamped = Math.max(minTime, Math.min(maxTime, minutes));
  return ((clamped - minTime) / (maxTime - minTime)) * 100;
}

export const GraficoOrariSettimana: React.FC<GraficoOrariSettimanaProps> = ({
  shop,
  variant = 'compact',
  darkMode = false,
}) => {
  const [viewMode, setViewMode] = useState<'griglia' | 'orologio'>('griglia');
  const [isExpanded, setIsExpanded] = useState<boolean>(variant === 'expanded');

  const openStatus: OpeningStatus = getShopOpeningStatus(shop);
  const weeklySchedule: DayScheduleItem[] = getWeeklySchedule(shop);
  const romeTime = getRomeDateTime();

  // Giorno attivo selezionato per la visualizzazione orologio
  const todayItem = weeklySchedule.find((d) => d.isToday) || weeklySchedule[0];
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(todayItem.dayIndex);
  const activeDay = weeklySchedule.find((d) => d.dayIndex === selectedDayIdx) || todayItem;

  // Calcolo posizione attuale della lancetta oraria "Adesso" (07:00 - 23:00)
  const currentNowPercent = getTimelinePercentage(romeTime.totalMinutes);
  const isNowWithinTimeline = romeTime.totalMinutes >= 7 * 60 && romeTime.totalMinutes <= 23 * 60;

  return (
    <div className="space-y-2 select-none font-sans">
      {/* 1. Header di Stato Dinamico */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
            {todayItem.isToday ? `Oggi (${todayItem.dayShort}):` : `${todayItem.dayShort}:`}
          </span>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
            {todayItem.isOpen ? todayItem.hoursText : 'Chiuso'}
          </span>
        </div>

        {/* Badge colorato di apertura ad alta leggibilità */}
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-black shrink-0 px-2.5 py-1 rounded-lg border shadow-2xs transition ${
            openStatus.badgeColor === 'emerald'
              ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700'
              : openStatus.badgeColor === 'amber'
              ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-950 dark:text-amber-200 border-amber-300 dark:border-amber-700'
              : 'bg-rose-100 dark:bg-rose-950/80 text-rose-900 dark:text-rose-200 border-rose-300 dark:border-rose-700'
          }`}
          title={`${openStatus.statusText}${openStatus.detailText ? ` • ${openStatus.detailText}` : ''}`}
        >
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              openStatus.isOpen
                ? 'bg-emerald-500 animate-pulse'
                : openStatus.isPaused
                ? 'bg-amber-500'
                : 'bg-rose-600 dark:bg-rose-400'
            }`}
          />
          <span className="font-black">{openStatus.statusText}</span>
          {openStatus.detailText && (
            <span className="font-semibold opacity-90 hidden sm:inline">({openStatus.detailText})</span>
          )}
        </span>
      </div>

      {/* 2. Anteprima Rapida Blocchi di Oggi (Compatta per Mobile) */}
      <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <Timer className="w-3.5 h-3.5 text-amber-500" />
            <span>Fasce orarie di oggi:</span>
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 transition cursor-pointer"
          >
            <span>{isExpanded ? 'Riduci' : 'Orari Settimana'}</span>
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Blocchi Visivi Orari di Oggi */}
        <div className="flex flex-wrap items-center gap-1.5">
          {!todayItem.isOpen ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-rose-50 text-rose-800 dark:bg-rose-950/70 dark:text-rose-200 border border-rose-200 dark:border-rose-800 shadow-2xs">
              <XIcon className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>Oggi: Riposo Settimanale (Chiuso)</span>
            </span>
          ) : todayItem.isH24 ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-50 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
              <Sparkles className="w-3.5 h-3.5 text-teal-500" />
              <span>Aperto Continuato 24h / 24</span>
            </span>
          ) : todayItem.isContinuous ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Orario continuato: {todayItem.hoursText}</span>
            </span>
          ) : (
            todayItem.shifts.map((shift, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/70 shadow-2xs"
              >
                {idx === 0 ? (
                  <Sun className="w-3 h-3 text-amber-500 shrink-0" />
                ) : (
                  <Moon className="w-3 h-3 text-indigo-400 shrink-0" />
                )}
                <span>
                  {idx === 0 ? 'Mattina:' : 'Pomeriggio:'} {shift.start} - {shift.end}
                </span>
              </span>
            ))
          )}
        </div>

        {/* Mini barra stile orologio per oggi */}
        {todayItem.isOpen && !todayItem.isH24 && todayItem.shifts.length > 0 && (
          <div className="pt-1">
            <div className="relative h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              {todayItem.shifts.map((shift, idx) => {
                const left = getTimelinePercentage(shift.startMinutes);
                const right = getTimelinePercentage(shift.endMinutes);
                const width = Math.max(3, right - left);
                return (
                  <div
                    key={idx}
                    style={{ left: `${left}%`, width: `${width}%` }}
                    className="absolute top-0 bottom-0 bg-emerald-500 rounded-full"
                    title={`Aperto: ${shift.start} - ${shift.end}`}
                  />
                );
              })}

              {/* Indicatore ora corrente */}
              {isNowWithinTimeline && (
                <div
                  style={{ left: `${currentNowPercent}%` }}
                  className="absolute top-0 bottom-0 w-1 bg-amber-500 ring-2 ring-amber-300/60 z-10"
                  title="Ora corrente"
                />
              )}
            </div>
            <div className="flex justify-between text-[9px] font-mono text-slate-400 dark:text-slate-500 mt-0.5 px-0.5">
              <span>08:00</span>
              <span>12:00</span>
              <span>16:00</span>
              <span>20:00</span>
            </div>
          </div>
        )}
      </div>

      {/* 3. Sezione Dettagliata Espansa: Griglia Settimanale a Blocchi & Tabella Orologio */}
      {isExpanded && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-3 animate-in fade-in duration-150"
        >
          {/* Selettore modalità di visualizzazione */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              <span>Programma Completo</span>
            </span>

            <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setViewMode('griglia')}
                className={`px-2 py-1 rounded-md transition cursor-pointer ${
                  viewMode === 'griglia'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                Griglia Blocchi
              </button>
              <button
                type="button"
                onClick={() => setViewMode('orologio')}
                className={`px-2 py-1 rounded-md transition cursor-pointer ${
                  viewMode === 'orologio'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                Stile Orologio 24h
              </button>
            </div>
          </div>

          {/* VISTA A: GRIGLIA SETTIMANALE A BLOCCHI VISIVI */}
          {viewMode === 'griglia' ? (
            <div className="space-y-1.5">
              {weeklySchedule.map((day) => (
                <div
                  key={day.dayIndex}
                  className={`p-2 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 transition ${
                    day.isToday
                      ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700/80 shadow-2xs'
                      : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800'
                  }`}
                >
                  {/* Nome Giorno con eventuale chip "Oggi" */}
                  <div className="flex items-center gap-1.5 min-w-[95px]">
                    <span className={`w-1.5 h-1.5 rounded-full ${day.isOpen ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                    <span className={`text-xs font-bold ${day.isToday ? 'text-amber-950 dark:text-amber-200' : 'text-slate-800 dark:text-slate-200'}`}>
                      {day.dayFull}
                    </span>
                    {day.isToday && (
                      <span className="px-1.5 py-0.2 rounded-md bg-amber-400 text-slate-950 text-[9px] font-black uppercase tracking-tight">
                        Oggi
                      </span>
                    )}
                  </div>

                  {/* Blocchi Visivi Apertura / Chiusura */}
                  <div className="flex flex-wrap items-center gap-1">
                    {!day.isOpen ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
                        <XIcon className="w-3 h-3 text-rose-500 shrink-0" />
                        <span>Chiuso per riposo</span>
                      </span>
                    ) : day.isH24 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-teal-50 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                        <Sparkles className="w-3 h-3 text-teal-500" />
                        <span>24h Continuato</span>
                      </span>
                    ) : day.isContinuous ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <Clock className="w-3 h-3 text-emerald-600" />
                        <span>Continuato {day.hoursText}</span>
                      </span>
                    ) : (
                      day.shifts.map((shift, sIdx) => (
                        <span
                          key={sIdx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                        >
                          {sIdx === 0 ? (
                            <Sun className="w-3 h-3 text-amber-500 shrink-0" />
                          ) : (
                            <Moon className="w-3 h-3 text-indigo-400 shrink-0" />
                          )}
                          <span>{shift.start} - {shift.end}</span>
                        </span>
                      ))
                    )}
                  </div>

                  {/* Micro-Timeline visiva sulla destra per ogni giorno */}
                  <div className="w-20 hidden md:block">
                    <div className="relative h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      {day.isOpen && day.shifts.map((shift, idx) => {
                        const left = getTimelinePercentage(shift.startMinutes);
                        const right = getTimelinePercentage(shift.endMinutes);
                        return (
                          <div
                            key={idx}
                            style={{ left: `${left}%`, width: `${Math.max(4, right - left)}%` }}
                            className="absolute top-0 bottom-0 bg-emerald-500 rounded-full"
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* VISTA B: TABELLA 'STILE OROLOGIO 24H' */
            <div className="space-y-3">
              {/* Selettore giorno orologio */}
              <div className="grid grid-cols-7 gap-1">
                {weeklySchedule.map((d) => (
                  <button
                    key={d.dayIndex}
                    type="button"
                    onClick={() => setSelectedDayIdx(d.dayIndex)}
                    className={`py-1.5 px-0.5 rounded-lg flex flex-col items-center justify-center transition cursor-pointer ${
                      d.dayIndex === selectedDayIdx
                        ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                        : d.isToday
                        ? 'bg-amber-50 dark:bg-amber-950/40 border border-amber-300 text-amber-900 dark:text-amber-200'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <span className="text-[10px] font-bold">{d.dayShort}</span>
                    <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                      d.dayIndex === selectedDayIdx
                        ? 'bg-slate-950'
                        : d.isOpen
                        ? 'bg-emerald-500'
                        : 'bg-slate-300 dark:bg-slate-600'
                    }`} />
                  </button>
                ))}
              </div>

              {/* Dettaglio Orologio del Giorno Selezionato */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>{activeDay.dayFull}</span>
                    {activeDay.isToday && (
                      <span className="px-1.5 py-0.2 rounded-md bg-amber-400 text-slate-950 text-[9px] font-black uppercase">
                        Oggi
                      </span>
                    )}
                  </span>
                  <span className={`text-xs font-bold ${activeDay.isOpen ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                    {activeDay.isOpen ? 'Aperto' : 'Chiuso'}
                  </span>
                </div>

                {/* Asse Orologio Grafico */}
                <div className="relative pt-3 pb-1">
                  <div className="relative h-4 w-full bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden border border-slate-300/60 dark:border-slate-600">
                    {/* Blocchi orari di apertura evidenziati in verde */}
                    {activeDay.isOpen && activeDay.shifts.map((shift, idx) => {
                      const left = getTimelinePercentage(shift.startMinutes);
                      const right = getTimelinePercentage(shift.endMinutes);
                      const width = Math.max(4, right - left);
                      return (
                        <div
                          key={idx}
                          style={{ left: `${left}%`, width: `${width}%` }}
                          className="absolute top-0 bottom-0 bg-emerald-500 flex items-center justify-center text-[9px] font-mono font-bold text-white shadow-xs"
                          title={`${shift.start} - ${shift.end}`}
                        >
                          <span className="truncate px-1 hidden sm:inline">{shift.start}-{shift.end}</span>
                        </div>
                      );
                    })}

                    {/* Ago lancetta ora attuale se stiamo visualizzando oggi */}
                    {activeDay.isToday && isNowWithinTimeline && (
                      <div
                        style={{ left: `${currentNowPercent}%` }}
                        className="absolute top-0 bottom-0 w-1 bg-rose-500 ring-2 ring-rose-400 z-20"
                        title="Ora attuale"
                      />
                    )}
                  </div>

                  {/* Marcatori orari stile orologio */}
                  <div className="flex justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-1">
                    <span>07:00</span>
                    <span>10:00</span>
                    <span>13:00</span>
                    <span>16:00</span>
                    <span>19:00</span>
                    <span>22:00</span>
                  </div>
                </div>

                {/* Scomposizione fasce del giorno */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-xs">
                  {activeDay.isOpen ? (
                    activeDay.shifts.map((shift, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-1.5">
                          {idx === 0 ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-indigo-400" />}
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {idx === 0 ? 'Fascia Mattina:' : 'Fascia Sera:'}
                          </span>
                        </div>
                        <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                          {shift.start} - {shift.end}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 flex items-center gap-1.5 col-span-2">
                      <XIcon className="w-4 h-4 text-rose-500" />
                      <span>Questo giorno l&apos;attività commerciale effettua riposo settimanale.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Avviso ferie o chiusure straordinarie */}
          {openStatus.isFerie && (
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300/70 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Chiusura estiva/ferie attiva fino al <strong>{shop.chiusoPerFerieFinoA}</strong></span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
