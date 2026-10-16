import React, { useState } from 'react';
import { CandidaturaVolontario, RichiestaVolontariato } from '../types';
import { TAGS_ATTIVITA_VOLONTARIATO } from '../data/mockData';
import {
  HeartHandshake,
  Phone,
  User,
  CheckCircle2,
  ShieldCheck,
  Send,
  MapPin,
  Share2,
} from 'lucide-react';
import { shareToWhatsApp } from '../utils/shareUtils';

interface VolontariatoTabProps {
  richieste: RichiestaVolontariato[];
  joinedRichieste: number[];
  onRequestJoinVolunteer: (richiesta: RichiestaVolontariato) => void;
  onSubmitCandidatura: (candidatura: CandidaturaVolontario) => Promise<void>;
  defaultName?: string;
  defaultPhone?: string;
}

export const VolontariatoTab: React.FC<VolontariatoTabProps> = ({
  richieste,
  joinedRichieste,
  onRequestJoinVolunteer,
  onSubmitCandidatura,
  defaultName = '',
  defaultPhone = '',
}) => {
  const [nome, setNome] = useState(defaultName);
  const [telefono, setTelefono] = useState(defaultPhone);
  const [attivitaScelte, setAttivitaScelte] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [inviatoSuccesso, setInviatoSuccesso] = useState(false);

  const toggleAttivita = (tag: string) => {
    setAttivitaScelte((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!telefono.trim() || attivitaScelte.length === 0) {
      alert('Inserisci il telefono e seleziona almeno un\'attività.');
      return;
    }

    setLoading(true);
    try {
      await onSubmitCandidatura({
        nome: nome.trim() || 'Volontario',
        telefono: telefono.trim(),
        attivita: attivitaScelte,
        note: note.trim(),
      });
      setInviatoSuccesso(true);
      setAttivitaScelte([]);
      setNote('');
      setTimeout(() => setInviatoSuccesso(false), 4500);
    } catch {
      alert('Errore nel salvataggio. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 pb-20 animate-fadeIn">
      {/* Banner Rosso Uniforme alla Home Page */}
      <section
        className="rounded-3xl p-5 sm:p-7 text-white shadow-lg border border-black/10 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #781816 0%, #5a1210 100%)',
        }}
      >
        <div className="relative z-10 max-w-xl">
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider mb-2">
            Volontariato di Quartiere
          </span>
          <h2 className="text-xl sm:text-2xl font-black leading-tight text-white tracking-tight">
            Unisciti ai volontari di Villaggio Prenestino
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-white/90 leading-relaxed">
            Basta anche un'ora ogni tanto per parchi, eventi o aiuto alla comunità.
          </p>
        </div>
      </section>

      {/* RICHIESTE IN CORSO */}
      <section className="space-y-2.5">
        <h3 className="text-sm sm:text-base font-black text-slate-900 px-1">
          Attività aperte in cerca di persone
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {richieste.map((r) => {
            const hasJoined = joinedRichieste.includes(r.id);
            const percentage = Math.min(100, Math.round((r.have / Math.max(1, r.need)) * 100));

            return (
              <div
                key={r.id}
                className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-1.5">
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {r.t}
                    </h4>
                    {r.urgente && (
                      <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950">
                        Urgente
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-amber-800 font-semibold flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                    {r.w}
                  </p>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    {r.desc}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-1 font-semibold text-slate-700">
                    <span>
                      Aderiti: <strong>{r.have}</strong> su {r.need}
                    </span>
                    <span className="text-amber-800 font-bold">{percentage}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden mb-2.5">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%`, backgroundColor: '#781816' }}
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const msg = `🤝 *Appello Volontari a Villaggio Prenestino*:\n"${r.t}"\n📍 Luogo: ${r.w}\n👥 Mancano ${Math.max(1, r.need - r.have)} volontari!\n\n${r.desc}`;
                        shareToWhatsApp(msg, 'https://www.villaggioprenestino.it');
                      }}
                      title="Condividi appello sui gruppi WhatsApp"
                      className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition cursor-pointer shrink-0"
                    >
                      <Share2 className="w-4 h-4 text-emerald-700" />
                    </button>
                    <button
                      onClick={() => onRequestJoinVolunteer(r)}
                      className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        hasJoined
                          ? 'bg-amber-100 text-amber-950 border border-amber-300'
                          : 'bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 shadow-xs'
                      }`}
                    >
                      {hasJoined ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                          Hai aderito (Annulla)
                        </>
                      ) : (
                        <>
                          <HeartHandshake className="w-4 h-4" />
                          Ci sono anche io (+10 pts)
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* FORM: REGISTRAZIONE VOLONTARIO */}
      <section className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3.5">
        <div>
          <h3 className="text-base font-black text-slate-900">
            Modulo volontari
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Lascia i tuoi recapiti: ti contatteremo quando organizziamo le attività.
          </p>
        </div>

        {inviatoSuccesso ? (
          <div className="p-5 rounded-xl bg-amber-50 border border-amber-300 text-center space-y-1.5">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h4 className="text-sm font-bold text-slate-900">
              Grazie per la disponibilità! (+15 pts)
            </h4>
            <p className="text-xs text-slate-600">
              I tuoi recapiti sono stati salvati: ti contatteremo per le attività di quartiere.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Nome o Soprannome:
                </label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Il tuo nome"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-amber-600" />
                  Numero di Telefono *:
                </label>
                <input
                  type="tel"
                  required
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Numero cellulare"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Tag attività */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Cosa ti piacerebbe fare?
              </label>
              <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2 sm:gap-1.5">
                {TAGS_ATTIVITA_VOLONTARIATO.map((tag) => {
                  const selected = attivitaScelte.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleAttivita(tag)}
                      className={`w-full sm:w-auto text-xs py-2.5 sm:py-1 px-3.5 sm:px-2.5 rounded-xl sm:rounded-lg border transition text-center flex items-center justify-center ${
                        selected
                          ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Disponibilità o orari (facoltativo):
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="es. Sabato mattina o pomeriggi"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-start gap-1.5 text-[11px] text-slate-500 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Il tuo numero viene usato solo dall'Associazione per coordinare le attività.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              {loading ? 'Invio...' : 'Invia candidatura (+15 pts)'}
            </button>
          </form>
        )}
      </section>
    </div>
  );
};
