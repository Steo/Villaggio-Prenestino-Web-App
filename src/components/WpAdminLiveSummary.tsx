import React, { useState, useEffect } from 'react';
import {
  Store,
  AlertTriangle,
  HeartHandshake,
  Clock,
  ArrowRight,
  Sparkles,
  MapPin,
  RefreshCw,
  Phone,
  CheckCircle2,
} from 'lucide-react';
import { AttivitaCommercio, SegnalazioneCittadina, RichiestaVolontariato } from '../types';
import { getRecentVolunteerActions, AzioneVolontariato } from '../services/volunteerActionService';

interface WpAdminLiveSummaryProps {
  attivitaCommercio: AttivitaCommercio[];
  segnalazioni: SegnalazioneCittadina[];
  richieste?: RichiestaVolontariato[];
  onNavigateTab: (tab: 'commercianti' | 'segnalazioni' | 'volontari') => void;
  onRefreshData?: () => void;
  className?: string;
}

export const WpAdminLiveSummary: React.FC<WpAdminLiveSummaryProps> = ({
  attivitaCommercio,
  segnalazioni,
  richieste = [],
  onNavigateTab,
  onRefreshData,
  className = '',
}) => {
  const [azioniVolontariato, setAzioniVolontariato] = useState<AzioneVolontariato[]>(() =>
    getRecentVolunteerActions(5)
  );
  const [lastUpdated, setLastUpdated] = useState<string>(() =>
    new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Ascolta nuovi eventi di volontariato in tempo reale
  useEffect(() => {
    const handleNewAction = () => {
      setAzioniVolontariato(getRecentVolunteerActions(5));
      setLastUpdated(
        new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };

    window.addEventListener('cdq:new-volunteer-action', handleNewAction);
    return () => {
      window.removeEventListener('cdq:new-volunteer-action', handleNewAction);
    };
  }, []);

  // Aggiorna quando cambiano le richieste passate come props
  useEffect(() => {
    setAzioniVolontariato(getRecentVolunteerActions(5));
  }, [richieste]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setAzioniVolontariato(getRecentVolunteerActions(5));
    setLastUpdated(
      new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    );
    if (onRefreshData) {
      onRefreshData();
    }
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // 1. Calcolo Attività Mappate
  const totaleAttivita = attivitaCommercio.length;
  const geolocalizzate = attivitaCommercio.filter(
    (a) => typeof a.lat === 'number' && typeof a.lng === 'number' && a.lat !== 0 && a.lng !== 0
  ).length;
  const approvate = attivitaCommercio.filter((a) => a.statoApprovazione !== 'in_attesa').length;
  const inAttesaCommercio = attivitaCommercio.filter((a) => a.statoApprovazione === 'in_attesa').length;

  // 2. Calcolo Segnalazioni in Attesa di Moderazione
  const segnalazioniInAttesa = segnalazioni.filter(
    (s) => (s.statoApprovazione || 'approvata') === 'in_attesa'
  ).length;
  const totaleSegnalazioni = segnalazioni.length;
  const segnalazioniRisolte = segnalazioni.filter((s) => s.s === 3).length;

  return (
    <section
      aria-label="Riepilogo in tempo reale del pannello amministrativo"
      className={`rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-4 ${className}`}
    >
      {/* Header Widget */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" aria-hidden="true" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                Riepilogo Operativo in Tempo Reale
              </h3>
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Live WordPress & App
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Stato sincronizzato di negozi mappati, coda moderazione segnalazioni e recenti azioni di volontariato.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-xs text-slate-500">
          <span className="text-[11px] text-slate-400">Aggiornato alle {lastUpdated}</span>
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
            title="Aggiorna dati in tempo reale"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Le 2 Stat Cards Principali (Attività Mappate + Segnalazioni in Attesa) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* CARD 1: Attività Mappate */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 transition-all hover:border-slate-300 flex flex-col justify-between gap-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Store className="w-4 h-4 text-amber-600" />
                Attività Mappate
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-slate-900 tracking-tight">
                  {totaleAttivita}
                </span>
                <span className="text-xs font-semibold text-slate-600">
                  {totaleAttivita === 1 ? 'attività registrata' : 'attività registrate'}
                </span>
              </div>
            </div>

            <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
          </div>

          <div className="text-xs text-slate-600 border-t border-slate-200/80 pt-2.5 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Geolocalizzate su mappa:</span>
              <span className="font-bold text-slate-800">{geolocalizzate} su {totaleAttivita}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Stato approvazione:</span>
              <span className="font-bold text-slate-800">
                {approvate} approvate
                {inAttesaCommercio > 0 ? ` · ${inAttesaCommercio} in attesa` : ''}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('commercianti')}
            className="w-full py-2 px-3 rounded-lg bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs border border-slate-300 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <span>Gestisci Commercianti e Mappa</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </div>

        {/* CARD 2: Segnalazioni in Attesa di Moderazione */}
        <div
          className={`rounded-xl border p-4 transition-all flex flex-col justify-between gap-3 ${
            segnalazioniInAttesa > 0
              ? 'border-amber-300 bg-amber-50/50'
              : 'border-slate-200 bg-slate-50/70'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <AlertTriangle className={`w-4 h-4 ${segnalazioniInAttesa > 0 ? 'text-amber-600' : 'text-slate-500'}`} />
                Segnalazioni in Attesa
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span
                  className={`text-3xl font-black tracking-tight ${
                    segnalazioniInAttesa > 0 ? 'text-amber-900' : 'text-slate-900'
                  }`}
                >
                  {segnalazioniInAttesa}
                </span>
                <span className="text-xs font-semibold text-slate-600">
                  {segnalazioniInAttesa === 1 ? 'istanza da moderare' : 'istanze da moderare'}
                </span>
              </div>
            </div>

            <div
              className={`p-2 rounded-xl shrink-0 ${
                segnalazioniInAttesa > 0
                  ? 'bg-amber-200/80 text-amber-900'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {segnalazioniInAttesa > 0 ? (
                <Clock className="w-4 h-4 animate-pulse" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
            </div>
          </div>

          <div className="text-xs text-slate-600 border-t border-slate-200/80 pt-2.5 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Stato coda moderazione:</span>
              <span className={`font-bold ${segnalazioniInAttesa > 0 ? 'text-amber-800' : 'text-emerald-700'}`}>
                {segnalazioniInAttesa > 0 ? 'Richiede verifica del moderatore' : 'Coda pulita, nessuna attesa'}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Storico segnalazioni:</span>
              <span className="font-bold text-slate-800">
                {totaleSegnalazioni} totali · {segnalazioniRisolte} risolte
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('segnalazioni')}
            className={`w-full py-2 px-3 rounded-lg font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs ${
              segnalazioniInAttesa > 0
                ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
                : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300'
            }`}
          >
            <span>{segnalazioniInAttesa > 0 ? 'Revisiona Segnalazioni in Attesa' : 'Vedi Tutte le Segnalazioni'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* CARD 3: Ultime 5 Azioni di Volontariato Avvenute nell'App */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">
              Ultime 5 Azioni di Volontariato Avvenute nell'App
            </h4>
          </div>
          <span className="text-[11px] text-slate-500">
            Monitoraggio adesioni civiche "Serve una mano" & Albo
          </span>
        </div>

        {azioniVolontariato.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500">
            Nessuna azione di volontariato registrata finora.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 text-xs">
            {azioniVolontariato.slice(0, 5).map((azione, idx) => {
              const isAdesione = azione.tipo === 'adesione';
              const isAlbo = azione.tipo === 'candidatura_albo';

              return (
                <li
                  key={azione.id || idx}
                  className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/80 px-2 rounded-lg transition"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                        isAdesione
                          ? 'bg-emerald-100 text-emerald-800'
                          : isAlbo
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                      aria-hidden="true"
                    >
                      {isAdesione ? '🤝' : isAlbo ? '📋' : '✨'}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-slate-900 font-bold truncate">
                          {azione.volontarioNome}
                        </strong>
                        <span className="text-slate-400" aria-hidden="true">·</span>
                        <span className="text-slate-700 font-medium">
                          {isAdesione
                            ? 'Adesione iniziativa'
                            : isAlbo
                            ? 'Iscrizione Albo Volontari'
                            : 'Nuova attività'}
                        </span>
                        {azione.telefono && (
                          <>
                            <span className="text-slate-400" aria-hidden="true">·</span>
                            <span className="text-slate-500 flex items-center gap-1 font-mono text-[11px]">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {azione.telefono}
                            </span>
                          </>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-600 truncate mt-0.5">
                        <span className="font-semibold text-slate-800">{azione.titolo}</span>
                        {azione.luogo && ` — ${azione.luogo}`}
                        {azione.dettaglio && ` (${azione.dettaglio})`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 shrink-0 self-end sm:self-center">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{azione.dataOra}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-500">
            Dati registrati direttamente dalle interazioni dei residenti nella Web App.
          </span>
          <button
            type="button"
            onClick={() => onNavigateTab('volontari')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
          >
            <span>Apri Gestione Volontari</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
};
