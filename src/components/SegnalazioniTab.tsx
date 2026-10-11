import React, { useState } from 'react';
import { SegnalazioneCittadina, StatoSegnalazione } from '../types';
import {
  Camera,
  MapPin,
  X,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Filter,
  Image as ImageIcon,
  Info,
} from 'lucide-react';

interface SegnalazioniTabProps {
  segnalazioni: SegnalazioneCittadina[];
  onSubmitSegnalazione: (data: {
    titolo: string;
    luogo: string;
    descrizione: string;
    foto: string[];
    nome?: string;
    telefono?: string;
  }) => Promise<void>;
  onOpenPhoto: (url: string) => void;
}

export const SegnalazioniTab: React.FC<SegnalazioniTabProps> = ({
  segnalazioni,
  onSubmitSegnalazione,
  onOpenPhoto,
}) => {
  const [mostraForm, setMostraForm] = useState(false);
  const [filtroStato, setFiltroStato] = useState<number>(0);

  // Form State
  const [titolo, setTitolo] = useState('');
  const [luogo, setLuogo] = useState('');
  const [descrizione, setDescrizione] = useState('');
  const [nome, setNome] = useState('');
  const [telefono, setTelefono] = useState('');
  const [foto, setFoto] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviataSuccesso, setInviataSuccesso] = useState(false);

  const categorieRapide = [
    'Buca stradale',
    'Lampione spento',
    'Rifiuti abbandonati',
    'Erba alta / Verde',
    'Segnaletica',
    'Altro',
  ];

  const handleFotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (foto.length + files.length > 3) {
      alert('Massimo 3 foto.');
      return;
    }

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFoto((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRimuoviFoto = (index: number) => {
    setFoto((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titolo.trim() || !luogo.trim()) return;

    setLoading(true);
    try {
      await onSubmitSegnalazione({
        titolo: titolo.trim(),
        luogo: luogo.trim(),
        descrizione: descrizione.trim(),
        foto,
        nome: nome.trim(),
        telefono: telefono.trim(),
      });
      setInviataSuccesso(true);
      setTitolo('');
      setLuogo('');
      setDescrizione('');
      setNome('');
      setTelefono('');
      setFoto([]);
      setTimeout(() => {
        setInviataSuccesso(false);
        setMostraForm(false);
      }, 3000);
    } catch {
      alert('Errore nell\'invio. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  const segnalazioniFiltrate = segnalazioni.filter((s) => {
    if (filtroStato === 0) return true;
    return s.s === filtroStato;
  });

  const getStatoBadge = (s: StatoSegnalazione) => {
    switch (s) {
      case 1:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-700" />
            1. Ricevuta
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-900 border border-sky-300">
            <AlertCircle className="w-3 h-3 text-sky-700" />
            2. Inoltrata all'ente preposto
          </span>
        );
      case 3:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
            3. Risolta
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 pb-20 animate-fadeIn">
      {/* Banner informativo con stesso schema colori, sfondo e font di "Il quartiere siamo noi" + Tasto Invia segnalazione + Infografica 3 stati */}
      <section
        className="rounded-3xl p-5 sm:p-7 text-white shadow-lg border border-black/10 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #781816 0%, #5a1210 100%)',
        }}
      >
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3.5">
            <div className="max-w-xl">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider mb-2">
                Segnalazioni e Territorio
              </span>
              <h2 className="text-xl sm:text-2xl font-black leading-tight text-white tracking-tight">
                Come gestiamo l'inoltro delle segnalazioni
              </h2>
            </div>

            <button
              onClick={() => setMostraForm(!mostraForm)}
              className="w-full sm:w-auto px-4 py-2.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 shrink-0 cursor-pointer self-stretch sm:self-start"
            >
              {mostraForm ? <X className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
              {mostraForm ? 'Chiudi modulo' : 'Invia segnalazione con foto'}
            </button>
          </div>

          <p className="mt-2 text-xs sm:text-sm text-white/90 leading-relaxed max-w-2xl">
            I guasti puntuali e urgenti (es. lampione spento o pericolo) vengono inoltrati subito. Gli interventi strutturali (es. rifacimento strada), invece, richiedono la raccolta di più segnalazioni dalla zona prima dell'invio.
          </p>

          {/* Infografica: I 3 stati delle Segnalazioni (Giallo, Azzurro, Verde) */}
          <div className="mt-5 pt-4 border-t border-white/15">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-3 flex items-center gap-1.5">
              <span>I 3 stati della segnalazione:</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Stato 1: Giallo */}
              <div className="bg-black/25 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 border border-amber-400/40 flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-400 text-slate-950">
                    <Clock className="w-3 h-3 text-slate-950" />
                    1. Ricevuta
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                </div>
                <p className="text-[11px] sm:text-xs text-white/90 leading-relaxed">
                  L'Associazione riceve e archivia la segnalazione inviata dal cittadino.
                </p>
              </div>

              {/* Stato 2: Azzurro */}
              <div className="bg-black/25 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 border border-sky-400/40 flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-sky-400 text-slate-950">
                    <AlertCircle className="w-3 h-3 text-slate-950" />
                    2. Inoltrata all'ente preposto
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                </div>
                <p className="text-[11px] sm:text-xs text-white/90 leading-relaxed">
                  Trasmessa formalmente agli organi competenti per la presa in carico dell'intervento.
                </p>
              </div>

              {/* Stato 3: Verde */}
              <div className="bg-black/25 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 border border-emerald-400/40 flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-400 text-slate-950">
                    <CheckCircle2 className="w-3 h-3 text-slate-950" />
                    3. Risolta
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>
                <p className="text-[11px] sm:text-xs text-white/90 leading-relaxed">
                  Intervento eseguito o problema risolto con esito positivo confermato.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FORM DI INSERIMENTO */}
      {mostraForm && (
        <div className="bg-white rounded-2xl border-2 border-amber-500 p-4 sm:p-5 shadow-lg animate-scaleUp">
          {inviataSuccesso ? (
            <div className="py-6 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">
                Segnalazione inviata! (+5 pts)
              </h3>
              <p className="text-xs text-slate-600">
                L'Associazione la verificherà e la inoltrerà agli uffici competenti.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-amber-600" />
                  Nuova segnalazione
                </h3>
                <span className="text-[11px] text-slate-400">Max 3 foto</span>
              </div>

              {/* Categoria rapida */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tipo di problema:
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {categorieRapide.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setTitolo(cat)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                        titolo === cat
                          ? 'bg-amber-100 text-amber-950 border-amber-400 font-bold'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  required
                  value={titolo}
                  onChange={(e) => setTitolo(e.target.value)}
                  placeholder="Descrivi brevemente il problema"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Luogo */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  Via / Indirizzo esatto *:
                </label>
                <input
                  type="text"
                  required
                  value={luogo}
                  onChange={(e) => setLuogo(e.target.value)}
                  placeholder="es. Via Fosso dell'Osa 120"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Dettagli */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Note aggiuntive (facoltativo):
                </label>
                <textarea
                  rows={2}
                  value={descrizione}
                  onChange={(e) => setDescrizione(e.target.value)}
                  placeholder="Dettagli utili per l'intervento"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Foto */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex justify-between">
                  <span>Foto ({foto.length}/3):</span>
                  <span className="text-[11px] text-slate-400 font-normal">Scatta o allega</span>
                </label>

                <div className="flex flex-wrap items-center gap-2">
                  {foto.map((url, idx) => (
                    <div
                      key={idx}
                      className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-slate-300"
                    >
                      <img src={url} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRimuoviFoto(idx)}
                        className="absolute top-1 right-1 p-1 rounded-full bg-slate-900/80 text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {foto.length < 3 && (
                    <label className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 border-dashed border-slate-300 hover:border-amber-500 flex flex-col items-center justify-center text-slate-400 cursor-pointer bg-slate-50 hover:bg-amber-50/50">
                      <Camera className="w-4 h-4 mb-0.5" />
                      <span className="text-[10px] font-bold">+ Foto</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        multiple
                        onChange={handleFotoUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Recapito facoltativo */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                <div>
                  <label className="block text-[11px] text-slate-600 mb-0.5">Nome (facoltativo):</label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Il tuo nome"
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-0.5">Telefono (facoltativo):</label>
                  <input
                    type="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="Per aggiornamenti"
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setMostraForm(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 rounded-xl"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition flex items-center gap-1.5 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  {loading ? 'Invio...' : 'Invia segnalazione'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* FILTRI STATO */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold">
        <button
          onClick={() => setFiltroStato(0)}
          className={`px-3 py-1.5 rounded-full transition shrink-0 ${
            filtroStato === 0
              ? 'bg-slate-950 text-white'
              : 'bg-white border border-slate-200 text-slate-600'
          }`}
        >
          Tutte ({segnalazioni.length})
        </button>
        <button
          onClick={() => setFiltroStato(1)}
          className={`px-3 py-1.5 rounded-full transition shrink-0 ${
            filtroStato === 1
              ? 'bg-amber-500 text-slate-950'
              : 'bg-white border border-slate-200 text-slate-600'
          }`}
        >
          Ricevute ({segnalazioni.filter((s) => s.s === 1).length})
        </button>
        <button
          onClick={() => setFiltroStato(2)}
          className={`px-3 py-1.5 rounded-full transition shrink-0 ${
            filtroStato === 2
              ? 'bg-sky-600 text-white'
              : 'bg-white border border-slate-200 text-slate-600'
          }`}
        >
          Inoltrate ({segnalazioni.filter((s) => s.s === 2).length})
        </button>
        <button
          onClick={() => setFiltroStato(3)}
          className={`px-3 py-1.5 rounded-full transition shrink-0 ${
            filtroStato === 3
              ? 'bg-emerald-600 text-white'
              : 'bg-white border border-slate-200 text-slate-600'
          }`}
        >
          Risolte ({segnalazioni.filter((s) => s.s === 3).length})
        </button>
      </div>

      {/* LISTA SEGNALAZIONI */}
      <div className="space-y-3">
        {segnalazioniFiltrate.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-500 text-xs">
            Nessuna segnalazione in questa sezione.
          </div>
        ) : (
          segnalazioniFiltrate.map((seg) => (
            <div
              key={seg.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-2.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                {getStatoBadge(seg.s)}
                <span className="text-[11px] text-slate-400">{seg.data}</span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                  {seg.t}
                </h3>
                <p className="text-xs text-amber-800 font-semibold flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                  {seg.w}
                </p>
              </div>

              {seg.desc && (
                <p className="text-xs text-slate-600 leading-relaxed">
                  {seg.desc}
                </p>
              )}

              {/* Foto allegate */}
              {seg.ph && seg.ph.length > 0 && (
                <div className="flex items-center gap-2 pt-1">
                  {seg.ph.map((fotoUrl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => onOpenPhoto(fotoUrl)}
                      className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shrink-0 cursor-zoom-in"
                    >
                      <img src={fotoUrl} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
