import React, { useState, useMemo } from 'react';
import { PropostaCittadina } from '../types';
import { NUMERI_UTILI } from '../data/mockData';
import {
  Lightbulb,
  ThumbsUp,
  Send,
  PhoneCall,
  ShieldAlert,
  CheckCircle2,
  Trophy,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Sparkles,
  BellRing,
} from 'lucide-react';

interface ProposteAltroTabProps {
  proposte: PropostaCittadina[];
  votedProposte: number[];
  mieProposte?: number[];
  onVoteProposta: (proposta: PropostaCittadina) => void;
  onSubmitProposta: (titolo: string) => Promise<void>;
  onSimulateVoteForProposal?: (id: number) => void;
}

export const ProposteAltroTab: React.FC<ProposteAltroTabProps> = ({
  proposte,
  votedProposte,
  mieProposte = [],
  onVoteProposta,
  onSubmitProposta,
  onSimulateVoteForProposal,
}) => {
  const [nuovaIdea, setNuovaIdea] = useState('');
  const [loading, setLoading] = useState(false);
  const [inviataSuccesso, setInviataSuccesso] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const ITEMS_PER_PAGE = 3;

  // Ordina le proposte per numero di "Mi piace" decrescente (più votate per prime)
  const sortedProposte = useMemo(() => {
    return [...proposte].sort((a, b) => b.v - a.v);
  }, [proposte]);

  const totalPages = Math.ceil(sortedProposte.length / ITEMS_PER_PAGE) || 1;
  const safeActiveTab = Math.min(activeTab, Math.max(0, totalPages - 1));

  const visibleProposte = useMemo(() => {
    const start = safeActiveTab * ITEMS_PER_PAGE;
    return sortedProposte.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedProposte, safeActiveTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuovaIdea.trim()) return;

    setLoading(true);
    try {
      await onSubmitProposta(nuovaIdea.trim());
      setInviataSuccesso(true);
      setNuovaIdea('');
      setTimeout(() => setInviataSuccesso(false), 3500);
    } catch {
      alert('Errore nell\'invio. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 pb-20 animate-fadeIn">
      {/* BOX 1: HERO BANNER ROSSO - Proponi la tua idea (uniforme a Home e Segnalazioni) */}
      <section
        className="rounded-3xl p-5 sm:p-7 text-white shadow-lg border border-black/10 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #781816 0%, #5a1210 100%)',
        }}
      >
        <div className="relative z-10 max-w-xl">
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider mb-2">
            Idee e Proposte
          </span>
          <h2 className="text-xl sm:text-2xl font-black leading-tight text-white tracking-tight">
            Proponi un'idea per il quartiere
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-white/90 leading-relaxed">
            Hai un suggerimento o un'iniziativa per Villaggio Prenestino? Condividila con la comunità: dopo una rapida verifica verrà pubblicata e potrà essere votata da tutti i residenti.
          </p>

          {/* Form Nuova Proposta */}
          <form onSubmit={handleSubmit} className="mt-4 p-4 rounded-2xl bg-black/20 border border-white/15 backdrop-blur-xs space-y-3">
            <label className="block text-xs font-bold text-white flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              Cosa vorresti realizzare o migliorare a Villaggio Prenestino?
            </label>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                required
                value={nuovaIdea}
                onChange={(e) => setNuovaIdea(e.target.value)}
                placeholder="es. Scambio libri al parco o piantumazione nuovi alberi"
                className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm bg-white text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-sm"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-4 py-2.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-50 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                {loading ? 'Invio in corso...' : 'Proponi (+5 pts)'}
              </button>
            </div>
            {inviataSuccesso && (
              <div className="p-2.5 rounded-xl bg-emerald-500/25 border border-emerald-400/50 text-emerald-100 text-xs font-semibold flex items-center gap-1.5 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                Proposta inviata con successo! Verrà pubblicata dopo una rapida verifica.
              </div>
            )}
          </form>
        </div>
      </section>

      {/* BOX 2: IDEE DA VOTARE CON NAVIGAZIONE A TAB (3 IDEE PER PAGINA ORDINATE PER MI PIACE) */}
      <section className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#781816' }} />
              Idee dei cittadini
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-600" />
                Ordinate per "Mi piace"
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Sostieni le proposte che ritieni prioritarie per la crescita del quartiere
            </p>
          </div>
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
              {sortedProposte.length} idee totali
            </span>
          </div>
        </div>

        {/* BARRA DI NAVIGAZIONE A TAB (3 Idee per Scheda/Pagina) */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-slate-50/80 p-2 rounded-xl border border-slate-200/80">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1 shrink-0 hidden sm:inline">
                Schede:
              </span>
              {Array.from({ length: totalPages }, (_, idx) => {
                const isActive = idx === safeActiveTab;
                const startNum = idx * ITEMS_PER_PAGE + 1;
                const endNum = Math.min((idx + 1) * ITEMS_PER_PAGE, sortedProposte.length);

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveTab(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-[#781816] text-white shadow-xs'
                        : 'bg-white hover:bg-slate-200/80 text-slate-700 border border-slate-200/80'
                    }`}
                  >
                    {idx === 0 && <Trophy className={`w-3 h-3 ${isActive ? 'text-amber-300' : 'text-amber-500'}`} />}
                    <span>
                      {idx === 0 ? `Top ${startNum}-${endNum}` : `${startNum} - ${endNum}`}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Frecce Rapide Precedente / Successiva */}
            <div className="flex items-center justify-between sm:justify-end gap-1.5 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-200">
              <button
                type="button"
                disabled={safeActiveTab === 0}
                onClick={() => setActiveTab((prev) => Math.max(0, prev - 1))}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition cursor-pointer"
                title="Scheda precedente"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Prec.</span>
              </button>

              <span className="text-[11px] font-bold text-slate-500 px-1">
                {safeActiveTab + 1} / {totalPages}
              </span>

              <button
                type="button"
                disabled={safeActiveTab >= totalPages - 1}
                onClick={() => setActiveTab((prev) => Math.min(totalPages - 1, prev + 1))}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition cursor-pointer"
                title="Scheda successiva"
              >
                <span className="hidden sm:inline">Succ.</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Elenco Proposte (3 per pagina / tab ordinate per Mi piace) */}
        <div className="space-y-2.5 pt-0.5">
          {sortedProposte.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 sm:p-8 text-center border border-slate-200 text-slate-500 text-xs space-y-2">
              <Lightbulb className="w-8 h-8 text-amber-500 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">Nessuna proposta ancora inserita</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Sii il primo residente a lanciare una proposta per il quartiere! Usa il box in alto per inviare la tua idea.
              </p>
            </div>
          ) : (
            visibleProposte.map((p) => {
            const hasVoted = votedProposte.includes(p.id);
            // Posizione in classifica generale
            const rank = sortedProposte.findIndex((item) => item.id === p.id) + 1;

            return (
              <div
                key={p.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-white transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 shadow-2xs"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Badge Posizione Classifica */}
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                        rank === 1
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : rank === 2
                          ? 'bg-slate-100 text-slate-800 border border-slate-300'
                          : rank === 3
                          ? 'bg-orange-100 text-orange-900 border border-orange-300'
                          : 'bg-slate-50 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {rank === 1 && <Trophy className="w-3 h-3 text-amber-600" />}
                      #{rank} {rank === 1 ? 'Più votata' : 'Classifica'}
                    </span>

                    {mieProposte.includes(p.id) && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300">
                        <Sparkles className="w-3 h-3 text-rose-600" />
                        La tua proposta
                      </span>
                    )}

                    <span className="text-[11px] text-slate-500 font-semibold inline-block">
                      <strong className="text-slate-900 font-bold">{p.v}</strong> {p.v === 1 ? 'cittadino d\'accordo' : 'cittadini d\'accordo'}
                    </span>
                  </div>

                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                    {p.t}
                  </h4>

                  {/* Pulsante rapido di simulazione nuovo voto (per testare la notifica) se è una proposta dell'utente */}
                  {mieProposte.includes(p.id) && onSimulateVoteForProposal && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => onSimulateVoteForProposal(p.id)}
                        title="Simula un voto da parte di un altro residente per testare la notifica del browser"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 transition active:scale-95 shadow-2xs cursor-pointer"
                      >
                        <BellRing className="w-3 h-3 text-amber-600" />
                        <span>Simula ricezione nuovo voto (+1)</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Pulsante Mi Piace (Il contatore si ferma al primo click) */}
                <div className="shrink-0 flex items-center justify-between sm:justify-end gap-2 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <button
                    type="button"
                    disabled={hasVoted}
                    onClick={() => onVoteProposta(p)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                      hasVoted
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 cursor-default opacity-95 shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 cursor-pointer shadow-2xs'
                    }`}
                    title={
                      hasVoted
                        ? 'Hai già votato questa idea (il tuo voto è registrato)'
                        : 'Clicca per votare con un "Mi piace"'
                    }
                  >
                    {hasVoted ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Votato ✓</span>
                      </>
                    ) : (
                      <>
                        <ThumbsUp className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                        <span>Mi piace</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
          )}
        </div>

        {/* Dettaglio footer con indicazione paginazione */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium pt-1 px-1">
          <span>
            Visualizzate {visibleProposte.length} di {sortedProposte.length} proposte (3 per scheda)
          </span>
          {totalPages > 1 && (
            <span className="text-slate-500 font-semibold">
              Scheda {safeActiveTab + 1} di {totalPages}
            </span>
          )}
        </div>
      </section>

      {/* SEZIONE 2: NUMERI UTILI */}
      <section className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3">
        <div>
          <h3 className="text-base sm:text-lg font-black text-slate-900">
            Numeri utili ed emergenze
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Tocca per chiamare subito
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {NUMERI_UTILI.map((item, idx) => {
            const cleanNumber = item.numero.replace(/\s+/g, '');

            return (
              <div
                key={idx}
                className={`p-3 rounded-xl border flex items-center justify-between gap-2.5 ${
                  item.tipo === 'urgente'
                    ? 'bg-rose-50/50 border-rose-200'
                    : 'bg-slate-50/70 border-slate-200'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-slate-900 leading-snug">
                    {item.nome}
                  </h4>
                  {item.descr && (
                    <p className="text-[11px] text-slate-500 leading-tight mt-0.5 line-clamp-1">
                      {item.descr}
                    </p>
                  )}
                  <span className="font-mono text-xs font-bold text-slate-700 block mt-0.5">
                    {item.numero}
                  </span>
                </div>

                <a
                  href={`tel:${cleanNumber}`}
                  className={`p-2 rounded-xl text-white font-bold text-xs shrink-0 transition flex items-center justify-center ${
                    item.tipo === 'urgente'
                      ? 'bg-rose-600 hover:bg-rose-500'
                      : 'bg-slate-900 hover:bg-slate-800'
                  }`}
                  title={`Chiama ${item.nome}`}
                >
                  <PhoneCall className="w-4 h-4" />
                </a>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
