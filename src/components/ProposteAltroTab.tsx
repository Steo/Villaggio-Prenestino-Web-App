import React, { useState } from 'react';
import { PropostaCittadina } from '../types';
import { NUMERI_UTILI } from '../data/mockData';
import {
  Lightbulb,
  ThumbsUp,
  Send,
  PhoneCall,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';

interface ProposteAltroTabProps {
  proposte: PropostaCittadina[];
  votedProposte: number[];
  onVoteProposta: (proposta: PropostaCittadina) => void;
  onSubmitProposta: (titolo: string) => Promise<void>;
}

export const ProposteAltroTab: React.FC<ProposteAltroTabProps> = ({
  proposte,
  votedProposte,
  onVoteProposta,
  onSubmitProposta,
}) => {
  const [nuovaIdea, setNuovaIdea] = useState('');
  const [loading, setLoading] = useState(false);
  const [inviataSuccesso, setInviataSuccesso] = useState(false);

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
        <div className="relative z-10 max-w-2xl">
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
            <div className="flex flex-col sm:flex-row gap-2">
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

      {/* BOX 2: IDEE DA VOTARE (Mantiene lo stile card attuale con votazione) */}
      <section className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#781816' }} />
              Idee già proposte dai cittadini
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Vota con un "Mi piace" per sostenere le proposte che ritieni più utili
            </p>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
            {proposte.length} idee
          </span>
        </div>

        {/* Elenco Proposte */}
        <div className="space-y-2 pt-1">
          {proposte.map((p) => {
            const hasVoted = votedProposte.includes(p.id);

            return (
              <div
                key={p.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-white transition flex items-center justify-between gap-3 hover:border-slate-300"
              >
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                    {p.t}
                  </h4>
                  <span className="text-[11px] text-slate-500 font-semibold mt-0.5 inline-block">
                    <strong className="text-slate-800">{p.v}</strong> cittadini d'accordo
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onVoteProposta(p)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    hasVoted
                      ? 'bg-amber-100 text-amber-950 border border-amber-300'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <ThumbsUp className={`w-3.5 h-3.5 ${hasVoted ? 'fill-amber-600 text-amber-600' : ''}`} />
                  {hasVoted ? 'Votato ✓' : 'Mi piace'}
                </button>
              </div>
            );
          })}
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

      {/* Info Associazione */}
      <footer className="text-center text-xs text-slate-500 py-2">
        <p>Comunità di Quartiere Villaggio Prenestino (Roma Municipio VI)</p>
        <p className="text-[11px] text-slate-400 mt-0.5">www.villaggioprenestino.it</p>
      </footer>
    </div>
  );
};
