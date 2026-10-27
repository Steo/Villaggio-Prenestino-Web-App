import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import {
  Clock,
  HeartHandshake,
  Award,
  TrendingUp,
  PlusCircle,
  X,
  CheckCircle2,
  Calendar,
  Sparkles,
  TreePine,
  Layers,
} from 'lucide-react';
import { RichiestaVolontariato } from '../types';

export interface AttivitaVolontarioRegistrata {
  id: string;
  titolo: string;
  categoria: 'verde' | 'solidarieta' | 'eventi' | 'decoro' | 'altro';
  ore: number;
  data: string; // YYYY-MM-DD
  note?: string;
  timestamp: number;
}

interface PannelloImpattoVolontariatoProps {
  richieste: RichiestaVolontariato[];
  joinedRichieste: number[];
  darkMode?: boolean;
  onAddPunti?: (punti: number, motivo: string) => void;
}

const STORAGE_KEY_ORE_VOLONTARIATO = 'vp_volontariato_ore_donate_v2';

const CATEGORIE_VOLONTARIATO = [
  { id: 'verde', label: 'Cura del Verde', icon: '🌿', color: '#10b981' },
  { id: 'solidarieta', label: 'Solidarietà & Spesa', icon: '🤲', color: '#f59e0b' },
  { id: 'eventi', label: 'Eventi di Quartiere', icon: '🎉', color: '#6366f1' },
  { id: 'decoro', label: 'Decoro & Manutenzione', icon: '🧹', color: '#781816' },
  { id: 'altro', label: 'Altro Aiuto', icon: '🤝', color: '#0284c7' },
] as const;

export const PannelloImpattoVolontariato: React.FC<PannelloImpattoVolontariatoProps> = ({
  richieste,
  joinedRichieste,
  darkMode = false,
  onAddPunti,
}) => {
  const [metricView, setMetricView] = useState<'ore' | 'attivita'>('ore');
  const [groupView, setGroupView] = useState<'mesi' | 'categorie'>('mesi');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Form stato registrazione ore
  const [formOre, setFormOre] = useState<number>(2);
  const [formCategoria, setFormCategoria] = useState<string>('verde');
  const [formTitolo, setFormTitolo] = useState<string>('');
  const [formNote, setFormNote] = useState<string>('');

  // Caricamento ore salvate da localStorage
  const [attivitaRegistrate, setAttivitaRegistrate] = useState<AttivitaVolontarioRegistrata[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ORE_VOLONTARIATO);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  // Salva ogni volta che cambia
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ORE_VOLONTARIATO, JSON.stringify(attivitaRegistrate));
    } catch {
      // ignore
    }
  }, [attivitaRegistrate]);

  // Ascolta eventi globali di adesione per aggiornare i conteggi
  useEffect(() => {
    const handleAction = () => {
      // Forza ricalcolo
      try {
        const raw = localStorage.getItem(STORAGE_KEY_ORE_VOLONTARIATO);
        if (raw) setAttivitaRegistrate(JSON.parse(raw));
      } catch {}
    };
    window.addEventListener('cdq:new-volunteer-action', handleAction);
    return () => window.removeEventListener('cdq:new-volunteer-action', handleAction);
  }, []);

  // Calcolo statistiche totali
  // Ciascuna richiesta a cui l'utente ha aderito in "Serve una mano" conta per default 3 ore di servizio civico
  const oreDaRichiesteAderite = joinedRichieste.length * 3;
  const oreDaAttivitaRegistrate = attivitaRegistrate.reduce((acc, a) => acc + (a.ore || 0), 0);
  const totaleOreDonate = oreDaRichiesteAderite + oreDaAttivitaRegistrate;
  const totaleAttivita = joinedRichieste.length + attivitaRegistrate.length;
  const puntiVolontariato = (joinedRichieste.length * 10) + (attivitaRegistrate.length * 10);

  // Obiettivo del mese: 10 ore
  const OBIETTIVO_MESE = 10;
  const progressoPercentuale = Math.min(100, Math.round((totaleOreDonate / OBIETTIVO_MESE) * 100));

  // Generazione dati raggruppati per Mesi (ultimi 6 mesi)
  const datiMesi = useMemo(() => {
    const mesiLabels = ['Nov', 'Dic', 'Gen', 'Feb', 'Mar', 'Apr'];
    // Calcoliamo una distribuzione realistica basata sulle attività effettive dell'utente
    return mesiLabels.map((mese, idx) => {
      // Base per i mesi correnti
      let oreMese = 0;
      let attMese = 0;

      // Assegna le attività registrate dell'utente all'ultimo mese o al mese corrispondente
      if (idx === mesiLabels.length - 1) {
        oreMese += oreDaRichiesteAderite;
        attMese += joinedRichieste.length;
      }

      attivitaRegistrate.forEach((item) => {
        const d = new Date(item.timestamp || Date.now());
        const m = d.getMonth(); // 0..11
        // Se il mese corrisponde
        const monthNames = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
        if (monthNames[m] === mese) {
          oreMese += item.ore;
          attMese += 1;
        } else if (idx === mesiLabels.length - 1 && !monthNames.includes(mese)) {
          oreMese += item.ore;
          attMese += 1;
        }
      });

      // Se l'utente ha 0 attività in generale, mostriamo un indicatore di riferimento del quartiere
      return {
        name: mese,
        ore: oreMese,
        attivita: attMese,
      };
    });
  }, [oreDaRichiesteAderite, joinedRichieste.length, attivitaRegistrate]);

  // Generazione dati raggruppati per Categoria
  const datiCategorie = useMemo(() => {
    const mapCatOre: Record<string, number> = {
      verde: 0,
      solidarieta: 0,
      eventi: 0,
      decoro: 0,
      altro: 0,
    };
    const mapCatAtt: Record<string, number> = {
      verde: 0,
      solidarieta: 0,
      eventi: 0,
      decoro: 0,
      altro: 0,
    };

    // Assegna le richieste ufficiali in base al titolo
    joinedRichieste.forEach((id) => {
      const r = richieste.find((item) => item.id === id);
      const titolo = (r?.t || '').toLowerCase();
      let cat = 'altro';
      if (titolo.includes('parco') || titolo.includes('verde') || titolo.includes('alberi') || titolo.includes('erba') || titolo.includes('pulizia')) {
        cat = 'verde';
      } else if (titolo.includes('spesa') || titolo.includes('alimentare') || titolo.includes('farmaco') || titolo.includes('anziani')) {
        cat = 'solidarieta';
      } else if (titolo.includes('festa') || titolo.includes('evento') || titolo.includes('giochi') || titolo.includes('mercatino')) {
        cat = 'eventi';
      } else if (titolo.includes('buca') || titolo.includes('panchine') || titolo.includes('verniciatura') || titolo.includes('muro')) {
        cat = 'decoro';
      }
      mapCatOre[cat] = (mapCatOre[cat] || 0) + 3;
      mapCatAtt[cat] = (mapCatAtt[cat] || 0) + 1;
    });

    // Assegna le ore registrate manualmente
    attivitaRegistrate.forEach((item) => {
      const cat = item.categoria || 'altro';
      mapCatOre[cat] = (mapCatOre[cat] || 0) + item.ore;
      mapCatAtt[cat] = (mapCatAtt[cat] || 0) + 1;
    });

    return CATEGORIE_VOLONTARIATO.map((c) => ({
      name: c.label,
      shortName: c.label.split(' ')[0],
      icon: c.icon,
      color: c.color,
      ore: mapCatOre[c.id] || 0,
      attivita: mapCatAtt[c.id] || 0,
    }));
  }, [joinedRichieste, richieste, attivitaRegistrate]);

  // Gestione aggiunta manuale ore
  const handleSaveOre = (e: React.FormEvent) => {
    e.preventDefault();
    const nuova: AttivitaVolontarioRegistrata = {
      id: 'vol_act_' + Date.now(),
      titolo: formTitolo.trim() || `Attività di ${CATEGORIE_VOLONTARIATO.find((c) => c.id === formCategoria)?.label}`,
      categoria: formCategoria as any,
      ore: Math.max(1, formOre),
      data: new Date().toISOString().slice(0, 10),
      note: formNote.trim(),
      timestamp: Date.now(),
    };

    setAttivitaRegistrate((prev) => [nuova, ...prev]);
    setIsModalOpen(false);
    setFormTitolo('');
    setFormNote('');
    setFormOre(2);

    if (onAddPunti) {
      onAddPunti(nuova.ore * 5, `Registrazione ${nuova.ore}h di volontariato`);
    }

    setFeedbackMsg(`Registrate con successo ${nuova.ore} ore di volontariato! (+${nuova.ore * 5} pts)`);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Custom Tooltip per Recharts
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md text-white p-2.5 rounded-xl border border-slate-700 shadow-xl text-xs space-y-1">
          <p className="font-black text-amber-300">{label}</p>
          <p className="flex items-center gap-1.5 font-bold">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>
              {metricView === 'ore'
                ? `${data.value} ${data.value === 1 ? 'ora donata' : 'ore donate'}`
                : `${data.value} ${data.value === 1 ? 'attività completata' : 'attività completate'}`}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  const chartData = groupView === 'mesi' ? datiMesi : datiCategorie;

  return (
    <section className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      {/* Intestazione Sezione con Badge e Tasto Registra Ore */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-900 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              Impatto & Partecipazione
            </span>
            {totaleOreDonate > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Volontario Attivo</span>
              </span>
            )}
          </div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-1.5">
            <HeartHandshake className="w-5 h-5 text-[#781816] dark:text-amber-400" />
            <span>Il Tuo Contributo alla Comunità</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Monitora le ore dedicate alla cura di Villaggio Prenestino e raggiungi il tuo obiettivo civico.
          </p>
        </div>

        {/* Tasto Registra Ore Aggiuntive */}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Registra ore donate</span>
        </button>
      </div>

      {/* Messaggio toast feedback */}
      {feedbackMsg && (
        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* 4 Card Metriche Chiave */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Card 1: Ore Donate */}
        <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 space-y-1">
          <div className="flex items-center justify-between text-amber-800 dark:text-amber-300 text-xs font-bold">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Ore Donate</span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-tight">Totale</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {totaleOreDonate}
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">h</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            {oreDaRichiesteAderite > 0
              ? `${oreDaRichiesteAderite}h da appelli + ${oreDaAttivitaRegistrate}h autonome`
              : 'Dona il tuo tempo al quartiere'}
          </p>
        </div>

        {/* Card 2: Attività Completate */}
        <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 space-y-1">
          <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 text-xs font-bold">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Attività</span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-tight">Completate</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {totaleAttivita}
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            {joinedRichieste.length > 0 ? `${joinedRichieste.length} adesioni a bandi` : 'Nessuna adesione ancora'}
          </p>
        </div>

        {/* Card 3: Punti Civici Riconosciuti */}
        <div className="p-3.5 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-800/60 space-y-1">
          <div className="flex items-center justify-between text-rose-800 dark:text-rose-300 text-xs font-bold">
            <span className="flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-[#781816]" />
              <span>Punti Guadagnati</span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-tight">+10/att</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#781816] dark:text-amber-400">
            +{puntiVolontariato}
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">pts</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            Accreditati al tuo profilo civico
          </p>
        </div>

        {/* Card 4: Obiettivo Mensile */}
        <div className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60 space-y-1.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-indigo-800 dark:text-indigo-300 text-xs font-bold">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                <span>Traguardo Mese</span>
              </span>
              <span className="text-[10px] font-black">{progressoPercentuale}%</span>
            </div>
            <div className="text-xs font-extrabold text-slate-800 dark:text-white mt-1">
              {totaleOreDonate} di {OBIETTIVO_MESE} ore
            </div>
          </div>

          {/* Barra progresso traguardo */}
          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-amber-500 transition-all duration-500"
              style={{ width: `${progressoPercentuale}%` }}
            />
          </div>
        </div>
      </div>

      {/* GRAFICO A BARRE RECHARTS */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-3">
        {/* Controlli Vista Grafico (Toggle Ore/Attività e Mesi/Categorie) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-200/70 dark:border-slate-700/60">
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
            <button
              type="button"
              onClick={() => setMetricView('ore')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                metricView === 'ore'
                  ? 'bg-[#781816] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Ore Donate (h)
            </button>
            <button
              type="button"
              onClick={() => setMetricView('attivita')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                metricView === 'attivita'
                  ? 'bg-[#781816] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Attività (n)
            </button>
          </div>

          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
            <button
              type="button"
              onClick={() => setGroupView('mesi')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                groupView === 'mesi'
                  ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Ultimi 6 Mesi</span>
            </button>
            <button
              type="button"
              onClick={() => setGroupView('categorie')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                groupView === 'categorie'
                  ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Per Categoria</span>
            </button>
          </div>
        </div>

        {/* Grafico Recharts effettivo */}
        <div className="w-full h-56 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={darkMode ? '#334155' : '#e2e8f0'}
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 11, fontWeight: 700 }}
                axisLine={{ stroke: darkMode ? '#475569' : '#cbd5e1' }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 11, fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar
                dataKey={metricView === 'ore' ? 'ore' : 'attivita'}
                radius={[6, 6, 0, 0]}
                maxBarSize={45}
              >
                {chartData.map((entry: any, index: number) => {
                  const barColor = entry.color || (index % 2 === 0 ? '#781816' : '#f59e0b');
                  return <Cell key={`cell-${index}`} fill={barColor} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Messaggio motivazionale dinamico sotto il grafico */}
        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1.5 font-medium">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              {totaleOreDonate === 0
                ? 'Partecipa a una delle attività sotto riportate o registra le tue ore per vedere crescere il grafico!'
                : `Ottimo lavoro! Con ${totaleOreDonate} ore hai aiutato concretamente il decoro e la coesione di Villaggio Prenestino.`}
            </span>
          </div>

          <span className="hidden md:inline-block font-bold text-slate-500">
            Dati aggiornati in tempo reale
          </span>
        </div>
      </div>

      {/* MODAL REGISTRAZIONE ORE DONATE AUTONOME */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl relative animate-scaleUp text-slate-900 dark:text-white">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                Aggiungi Impegno Civico
              </span>
              <h3 className="text-lg font-black">Registra Ore di Volontariato</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hai svolto un'attività civica di persona nel quartiere? Registrala per aggiornare il tuo grafico e guadagnare Punti Civici.
              </p>
            </div>

            <form onSubmit={handleSaveOre} className="space-y-3 pt-1">
              {/* Categoria */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Ambito di intervento:
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {CATEGORIE_VOLONTARIATO.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setFormCategoria(c.id)}
                      className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                        formCategoria === c.id
                          ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <span>{c.icon}</span>
                      <span className="truncate">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Titolo Attività */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Cosa hai fatto?
                </label>
                <input
                  type="text"
                  required
                  placeholder="es. Taglio erba parco, verniciatura panchina, aiuto spesa..."
                  value={formTitolo}
                  onChange={(e) => setFormTitolo(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Ore Dedicate (Selettore rapido a pulsanti) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Ore dedicate:
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setFormOre(num)}
                      className={`py-2 rounded-xl font-black text-xs transition cursor-pointer border ${
                        formOre === num
                          ? 'bg-[#781816] text-white border-[#781816] shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {num} {num === 1 ? 'ora' : 'ore'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note facoltative */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Dettagli o luogo (facoltativo):
                </label>
                <input
                  type="text"
                  placeholder="es. Via Fosso dell'Osa, area giochi..."
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs transition shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Salva nel grafico (+{formOre * 5} pts)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
