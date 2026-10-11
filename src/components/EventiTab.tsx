import React, { useState } from 'react';
import { EventoQuartiere, UserInteractions, TipoEvento } from '../types';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  Share2,
  PlusCircle,
  CreditCard,
  Ticket,
  HeartHandshake,
  History,
} from 'lucide-react';

interface EventiTabProps {
  eventi: EventoQuartiere[];
  interactions: UserInteractions;
  onRequestJoinEvento: (evento: EventoQuartiere) => void;
}

export const EventiTab: React.FC<EventiTabProps> = ({
  eventi,
  interactions,
  onRequestJoinEvento,
}) => {
  const [filtro, setFiltro] = useState<'tutti' | 'miei'>('tutti');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Suddivisione tra eventi in programma ed eventi passati
  const eventiInProgramma = eventi.filter((ev) => !ev.passato);
  const eventiPassati = eventi.filter((ev) => ev.passato);

  const eventiInProgrammaFiltrati = eventiInProgramma.filter((ev) => {
    if (filtro === 'miei') {
      return interactions.eventiPartecipati.includes(ev.id);
    }
    return true;
  });

  const handleShare = async (ev: EventoQuartiere) => {
    const title = `Evento: ${ev.t}`;
    const text = `📅 Partecipa a "${ev.t}"!\n🗓️ Data: ${ev.d} ${ev.m} alle ore ${ev.ora}\n📍 Luogo: ${ev.luogo}\n\nUnisciti ai residenti di Villaggio Prenestino!`;
    const url = 'https://www.villaggioprenestino.it';

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url,
        });
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          copyToClipboard(`${text}\n${url}`);
        }
      }
    } else {
      copyToClipboard(`${text}\n${url}`);
    }
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard?.writeText(content);
    setToastMsg('Dettagli copiati! Incollali su WhatsApp o altre app.');
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Helper per renderizzare il badge tag tipologia
  const renderTipoTag = (tipo?: TipoEvento, passato = false, quota?: string) => {
    if (passato) {
      const label =
        tipo === 'pagamento'
          ? 'Iscrizione a pagamento'
          : tipo === 'gratuito'
          ? 'Gratuito'
          : 'Volontariato';
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
          {label}
        </span>
      );
    }

    if (tipo === 'pagamento') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-950 border border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800 shadow-2xs">
          <CreditCard className="w-3 h-3 text-amber-700 dark:text-amber-400 shrink-0" />
          <span>Iscrizione a pagamento{quota ? ` (${quota})` : ''}</span>
        </span>
      );
    }

    if (tipo === 'gratuito') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-sky-100 text-sky-950 border border-sky-300 dark:bg-sky-950/70 dark:text-sky-300 dark:border-sky-800 shadow-2xs">
          <Ticket className="w-3 h-3 text-sky-700 dark:text-sky-400 shrink-0" />
          <span>Gratuito</span>
        </span>
      );
    }

    // Default: volontariato
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-950 border border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800 shadow-2xs">
        <HeartHandshake className="w-3 h-3 text-emerald-700 dark:text-emerald-400 shrink-0" />
        <span>Volontariato</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-20 animate-fadeIn">
      {toastMsg && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2 rounded-xl shadow-xl text-xs font-bold animate-bounce text-center max-w-[90vw]">
          {toastMsg}
        </div>
      )}

      {/* Hero Banner Rosso - Eventi in programma (uniforme alla Home Page) */}
      <section
        className="rounded-3xl p-5 sm:p-7 text-white shadow-lg border border-black/10 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #781816 0%, #5a1210 100%)',
        }}
      >
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="max-w-xl">
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider mb-2">
              Iniziative del Quartiere
            </span>
            <h2 className="text-xl sm:text-2xl font-black leading-tight text-white tracking-tight">
              Eventi in programma
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-white/90 leading-relaxed">
              Scopri le prossime iniziative a Villaggio Prenestino, conferma la tua presenza o partecipa alle attività della comunità.
            </p>
          </div>

          {/* Filtri con stesso stile dei bottoni del banner Home */}
          <div className="flex items-center gap-2 self-start sm:self-center shrink-0 w-full sm:w-auto">
            <button
              onClick={() => setFiltro('tutti')}
              className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs sm:text-sm transition cursor-pointer flex items-center justify-center gap-1.5 ${
                filtro === 'tutti'
                  ? 'bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black shadow-md'
                  : 'bg-white/15 hover:bg-white/25 active:bg-white/30 text-white font-bold border border-white/25'
              }`}
            >
              Tutti ({eventiInProgramma.length})
            </button>
            <button
              onClick={() => setFiltro('miei')}
              className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs sm:text-sm transition cursor-pointer flex items-center justify-center gap-1.5 ${
                filtro === 'miei'
                  ? 'bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black shadow-md'
                  : 'bg-white/15 hover:bg-white/25 active:bg-white/30 text-white font-bold border border-white/25'
              }`}
            >
              I miei ({interactions.eventiPartecipati.length})
            </button>
          </div>
        </div>
      </section>

      {/* Lista Eventi in programma */}
      {eventiInProgrammaFiltrati.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-500 text-xs">
          Nessun evento in programma corrispondente al filtro.
        </div>
      ) : (
        <div className="space-y-3.5">
          {eventiInProgrammaFiltrati.map((ev) => {
            const isAttending = interactions.eventiPartecipati.includes(ev.id);
            const isPagamento = ev.tipo === 'pagamento';

            return (
              <div
                key={ev.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs hover:shadow-sm transition flex flex-col sm:flex-row gap-3 sm:gap-4 items-start"
              >
                {/* Visualizzazione Mobile Verticale (< sm): icona data ridotta del 20% affiancata al titolo dell'evento */}
                <div className="flex sm:hidden items-center gap-3 w-full">
                  <div
                    className="w-11 rounded-xl text-white text-center py-1.5 px-0.5 shadow-xs shrink-0"
                    style={{ backgroundColor: '#781816' }}
                  >
                    <span className="block text-lg font-black text-amber-300 leading-none">
                      {ev.d}
                    </span>
                    <span className="block text-[9px] font-bold tracking-wider uppercase text-white/90 mt-0.5">
                      {ev.m}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug flex-1">
                    {ev.t}
                  </h3>
                </div>

                {/* Data Calendario per visualizzazione Desktop / Tablet (sm e superiori) */}
                <div
                  className="hidden sm:block sm:w-16 rounded-xl text-white text-center sm:py-2.5 sm:px-1 shadow-xs shrink-0"
                  style={{ backgroundColor: '#781816' }}
                >
                  <span className="block text-2xl font-black text-amber-300 leading-none">
                    {ev.d}
                  </span>
                  <span className="block text-[11px] font-bold tracking-wider uppercase text-white/90 mt-0.5">
                    {ev.m}
                  </span>
                </div>

                <div className="flex-1 min-w-0 space-y-1.5 w-full">
                  {/* Titolo desktop (nascosto su mobile verticale perché già affiancato alla data) */}
                  <h3 className="hidden sm:block text-base font-bold text-slate-900 leading-snug">
                    {ev.t}
                  </h3>

                  {/* Tag tipologia accanto a ora e luogo sotto al titolo */}
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs text-slate-600 font-semibold pt-0.5">
                    {renderTipoTag(ev.tipo, false, ev.quota)}
                    <span className="flex items-center gap-1 text-amber-800 dark:text-amber-300">
                      <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      Ore {ev.ora}
                    </span>
                    <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      {ev.luogo}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed pt-1">
                    {ev.p}
                  </p>

                  <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
                    {/* Prima riga: numero volontari confermati e tasto "ci sarò" */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-amber-600 shrink-0" />
                        <span><strong>{ev.n}</strong> {isPagamento ? 'iscritti' : 'confermati'}</span>
                      </span>

                      {/* Tasto Iscriviti (a pagamento) oppure Ci sarò (volontariato e gratuiti) */}
                      <button
                        onClick={() => onRequestJoinEvento(ev)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                          isAttending
                            ? 'bg-amber-100 text-amber-950 border border-amber-300'
                            : 'bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 shadow-xs'
                        }`}
                      >
                        {isAttending ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                            {isPagamento ? 'Iscritto ✓ (Annulla)' : 'Ci sarai ✓ (Annulla)'}
                          </>
                        ) : (
                          <>
                            <PlusCircle className="w-4 h-4" />
                            {isPagamento ? 'Iscriviti' : 'Ci sarò (+5 pts)'}
                          </>
                        )}
                      </button>
                    </div>

                    {/* Seconda riga: prendendo tutto lo spazio, tasto "condividi" */}
                    <button
                      type="button"
                      onClick={() => handleShare(ev)}
                      className="w-full py-2.5 px-3.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 shadow-xs hover:shadow transition flex items-center justify-center gap-2 cursor-pointer"
                      title="Condividi evento su WhatsApp o altre app"
                      aria-label="Condividi evento su WhatsApp o altre app"
                    >
                      <Share2 className="w-3.5 h-3.5 text-white stroke-[2.3]" />
                      <span>Condividi</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SEZIONE 2: EVENTI PASSATI (Stessa grafica ma colori grigiati, spenti e link disabilitati) */}
      <section className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3.5">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <History className="w-5 h-5 text-slate-400" />
              Eventi passati
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Iniziative e incontri già conclusi nel quartiere
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-200/80 dark:bg-slate-800/80 px-2.5 py-1 rounded-full">
            {eventiPassati.length} conclusi
          </span>
        </div>

        {eventiPassati.length === 0 ? (
          <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 text-center text-slate-400 text-xs border border-dashed border-slate-200">
            Nessun evento passato archiviato.
          </div>
        ) : (
          <div className="space-y-3">
            {eventiPassati.map((ev) => (
              <div
                key={ev.id}
                className="bg-slate-100/70 dark:bg-slate-900/40 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-4 sm:p-5 transition flex flex-col sm:flex-row gap-3 sm:gap-4 items-start opacity-70 grayscale-[25%]"
              >
                {/* Visualizzazione Mobile Verticale (< sm): icona data ridotta del 20% affiancata al titolo */}
                <div className="flex sm:hidden items-center gap-3 w-full">
                  <div className="w-11 rounded-xl text-slate-300 text-center py-1.5 px-0.5 shrink-0 bg-slate-500/80 dark:bg-slate-700">
                    <span className="block text-lg font-black text-slate-200 leading-none">
                      {ev.d}
                    </span>
                    <span className="block text-[9px] font-bold tracking-wider uppercase text-slate-300/80 mt-0.5">
                      {ev.m}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-snug">
                      {ev.t}
                    </h4>
                    <span className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      Concluso
                    </span>
                  </div>
                </div>

                {/* Data Calendario spenta in grigio per Desktop / Tablet */}
                <div className="hidden sm:block sm:w-16 rounded-xl text-slate-300 text-center sm:py-2.5 sm:px-1 shrink-0 bg-slate-500/80 dark:bg-slate-700">
                  <span className="block text-2xl font-black text-slate-200 leading-none">
                    {ev.d}
                  </span>
                  <span className="block text-[11px] font-bold tracking-wider uppercase text-slate-300/80 mt-0.5">
                    {ev.m}
                  </span>
                </div>

                <div className="flex-1 min-w-0 space-y-1.5 w-full">
                  {/* Titolo desktop (nascosto su mobile) */}
                  <div className="hidden sm:flex items-start justify-between gap-2">
                    <h4 className="text-base font-bold text-slate-700 dark:text-slate-300 leading-snug">
                      {ev.t}
                    </h4>
                    <span className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      Concluso
                    </span>
                  </div>

                  {/* Tag tipologia e info orario/luogo spente */}
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500 font-medium pt-0.5">
                    {renderTipoTag(ev.tipo, true, ev.quota)}
                    <span className="flex items-center gap-1 text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      Ore {ev.ora}
                    </span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {ev.luogo}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed pt-1">
                    {ev.p}
                  </p>

                  <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-slate-400" />
                      <strong>{ev.n}</strong> partecipanti registrati
                    </span>

                    {/* Tasti disabilitati per evento passato */}
                    <div className="flex items-center gap-2">
                      <button
                        disabled
                        aria-disabled="true"
                        className="py-1.5 px-3 rounded-xl text-xs font-semibold text-slate-400 bg-slate-200/60 dark:bg-slate-800 border border-slate-300/40 dark:border-slate-700 cursor-not-allowed select-none"
                      >
                        Evento concluso
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
