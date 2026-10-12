import React, { useState, useEffect } from 'react';
import {
  WpPluginConfig,
  EventoQuartiere,
  SegnalazioneCittadina,
  RichiestaVolontariato,
  PropostaCittadina,
  StatoSegnalazione,
  InsightData,
  TipoEvento,
} from '../types';
import { adminGetInsightStats } from '../services/wpService';
import {
  Download,
  Copy,
  Check,
  Globe,
  Key,
  Server,
  X,
  BookOpen,
  RefreshCw,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  HeartHandshake,
  Lightbulb,
  Calendar,
  Plus,
  CheckCircle2,
  Clock,
  MapPin,
  FileSpreadsheet,
  Users,
  Eye,
  Sliders,
  ChevronRight,
  Sparkles,
  LogOut,
} from 'lucide-react';

interface WpPluginPanelProps {
  isOpen: boolean;
  onClose: () => void;
  config: WpPluginConfig;
  onSaveConfig: (cfg: WpPluginConfig) => void;
  isLiveConnected: boolean;
  onTestConnection: () => Promise<boolean>;
  eventi?: EventoQuartiere[];
  segnalazioni?: SegnalazioneCittadina[];
  richieste?: RichiestaVolontariato[];
  proposte?: PropostaCittadina[];
  onRefreshData?: () => void;
  onUpdateSegnalazioneStato?: (id: number, stato: StatoSegnalazione) => void;
  onCreateEvento?: (evento: Omit<EventoQuartiere, 'id'>) => void;
  onCreateRichiesta?: (richiesta: Omit<RichiestaVolontariato, 'id' | 'have'>) => void;
  onDeactivateAdmin?: () => void;
}

export const WpPluginPanel: React.FC<WpPluginPanelProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  isLiveConnected,
  onTestConnection,
  eventi = [],
  segnalazioni = [],
  richieste = [],
  proposte = [],
  onRefreshData,
  onUpdateSegnalazioneStato,
  onCreateEvento,
  onCreateRichiesta,
  onDeactivateAdmin,
}) => {
  const [activeTab, setActiveTab] = useState<
    'insights' | 'eventi' | 'segnalazioni' | 'volontari' | 'proposte' | 'config'
  >('insights');

  // Config fields
  const [baseUrl, setBaseUrl] = useState(config.baseUrl);
  const [apiKey, setApiKey] = useState(config.apiKey);
  const [useLiveApi, setUseLiveApi] = useState(config.useLiveApi);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [copiato, setCopiato] = useState(false);

  const downloadBlobFile = async (url: string, filename: string) => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('File non trovato');
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1500);
    } catch {
      window.open(url, '_blank');
    }
  };

  // Insights State
  const [insights, setInsights] = useState<InsightData | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [periodoFiltro, setPeriodoFiltro] = useState<'anno' | '90g' | '30g'>('anno');

  // Event creation form state
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    t: '',
    p: '',
    dataCompleta: '2026-11-25',
    d: '25',
    m: 'NOV',
    anno: '2026',
    ora: '10:00',
    luogo: 'Piazza Villaggio Prenestino',
    target: 20,
    tipo: 'volontariato' as TipoEvento,
    quota: '',
  });

  // Volunteer request form state
  const [showNewRichiestaModal, setShowNewRichiestaModal] = useState(false);
  const [newRichiesta, setNewRichiesta] = useState({
    t: '',
    w: 'Parco di Via Fosso dell\'Osa',
    desc: '',
    need: 6,
    urgente: false,
  });

  // Caricamento Insights
  const loadInsights = async () => {
    setLoadingInsights(true);
    try {
      const data = await adminGetInsightStats();
      setInsights(data);
    } catch (e) {
      console.error('Errore caricamento insight:', e);
    } finally {
      setLoadingInsights(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadInsights();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveConfig = () => {
    onSaveConfig({
      baseUrl: baseUrl.trim(),
      apiKey: apiKey.trim(),
      useLiveApi,
    });
    setTestResult('Impostazioni salvate con successo!');
    setTimeout(() => setTestResult(null), 3000);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const ok = await onTestConnection();
      if (ok) {
        setTestResult('✅ Connessione riuscita con il plugin WordPress!');
      } else {
        setTestResult(
          '⚠️ Server raggiungibile ma il plugin non è ancora attivo su WordPress, oppure CORS da verificare. Usa la modalità simulata o installa il plugin ZIP.'
        );
      }
    } catch {
      setTestResult('❌ Impossibile connettersi alle REST API. Verifica che il plugin sia attivo.');
    } finally {
      setTesting(false);
    }
  };

  const handleCopiaCodice = () => {
    fetch('/vp-quartiere/vp-quartiere.php')
      .then((r) => r.text())
      .then((txt) => {
        navigator.clipboard.writeText(txt);
        setCopiato(true);
        setTimeout(() => setCopiato(false), 3000);
      })
      .catch(() => {
        alert('Copia il file dal pacchetto ZIP scaricato.');
      });
  };

  const handleExportCsv = () => {
    if (!insights) return;
    const rows = [
      ['REPORT INSIGHT & PARTECIPAZIONE CIVICA - VILLAGGIO PRENESTINO'],
      ['Generato il:', new Date().toLocaleDateString('it-IT')],
      ['Periodo:', periodoFiltro === 'anno' ? 'Tutto il 2026' : periodoFiltro === '90g' ? 'Ultimi 90 giorni' : 'Ultimi 30 giorni'],
      [],
      ['INDICATORE', 'VALORE', 'NOTE'],
      ['Segnalazioni Totali', insights.totaleSegnalazioni.toString(), 'Territorio e Manutenzione'],
      ['Segnalazioni Risolte', insights.segnalazioniRisolte.toString(), `${insights.tassoRisoluzione}% del totale`],
      ['Segnalazioni Inoltrate Municipio VI', insights.segnalazioniInoltrate.toString(), 'Pratiche aperte'],
      ['Segnalazioni in Lavorazione', insights.segnalazioniRicevute.toString(), 'Presa in carico CdQ'],
      ['Volontari Registrati', insights.volontariTotali.toString(), 'Cittadini disponibili'],
      ['Ore Civiche Donate Stimate', insights.oreCivicheStimate.toString(), 'Lavori di quartiere'],
      ['Idee & Proposte Cittadini', insights.ideeTotali.toString(), 'Democrazia partecipata'],
      ['Voti Espressi dalla Comunità', insights.votiTotali.toString(), 'Preferenze su idee'],
      ['Presenze Complessive Eventi', insights.partecipantiEventi.toString(), `${insights.tassoRiempimentoEventi}% di affluenza media`],
      [],
      ['TREND SEGNALAZIONI PER MESE'],
      ['Mese', 'Segnalazioni Ricevute', 'Segnalazioni Risolte', 'Volontari Attivi'],
      ...insights.trendMese.map((t) => [t.mese, t.inviate.toString(), t.risolte.toString(), t.volontari.toString()]),
      [],
      ['VOLONTARI PER CATEGORIA DI ATTIVITA'],
      ['Area Attività', 'Disponibili', 'Percentuale'],
      ...insights.volontariPerAttivita.map((v) => [v.nome, v.count.toString(), `${v.perc}%`]),
      [],
      ['TOP PROPOSTE DEI CITTADINI'],
      ['Titolo Proposta', 'Voti Favorevoli', 'Stato Iter'],
      ...insights.topProposte.map((p) => [p.titolo, p.voti.toString(), p.stato]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.map((val) => `"${val.replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `insight-villaggio-prenestino-${periodoFiltro}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreaNuovoEvento = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.t.trim()) return;

    // Se la data completa è nel passato, contrassegna automaticamente l'evento come passato
    const today = new Date().toISOString().slice(0, 10);
    const isPassato = Boolean(newEvent.dataCompleta && newEvent.dataCompleta < today);

    if (onCreateEvento) {
      onCreateEvento({
        t: newEvent.t.trim(),
        p: newEvent.p.trim() || 'Evento organizzato dal Comitato di Quartiere Villaggio Prenestino.',
        d: newEvent.d.trim(),
        m: newEvent.m.trim().toUpperCase(),
        anno: newEvent.anno.trim(),
        dataCompleta: newEvent.dataCompleta,
        ora: newEvent.ora.trim(),
        luogo: newEvent.luogo.trim(),
        target: Number(newEvent.target) || 20,
        tipo: newEvent.tipo,
        quota: newEvent.tipo === 'pagamento' ? newEvent.quota : undefined,
        passato: isPassato,
        n: 0,
      });
      setShowNewEventModal(false);
      setNewEvent({
        t: '',
        p: '',
        dataCompleta: '2026-11-25',
        d: '25',
        m: 'NOV',
        anno: '2026',
        ora: '10:00',
        luogo: 'Piazza Villaggio Prenestino',
        target: 20,
        tipo: 'volontariato',
        quota: '',
      });
      loadInsights();
    }
  };

  const handleCreaNuovaRichiesta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRichiesta.t.trim()) return;
    if (onCreateRichiesta) {
      onCreateRichiesta({
        t: newRichiesta.t.trim(),
        w: newRichiesta.w.trim(),
        desc: newRichiesta.desc.trim() || 'Attività di volontariato sul territorio.',
        need: Number(newRichiesta.need) || 6,
        urgente: newRichiesta.urgente,
      });
      setShowNewRichiestaModal(false);
      setNewRichiesta({
        t: '',
        w: 'Parco di Via Fosso dell\'Osa',
        desc: '',
        need: 6,
        urgente: false,
      });
      loadInsights();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[94vh] bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-300 flex flex-col">
        {/* Top Header con stile WordPress Bar */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 shrink-0 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0073aa] text-white flex items-center justify-center font-black text-lg shadow-sm border border-white/10">
              W
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white leading-tight">
                  Backend WordPress & Gestione Web App
                </h2>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  {useLiveApi ? 'Live API' : 'Simulatore Attivo'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                villaggioprenestino.it • Plugin VP Quartiere v1.3.2
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onDeactivateAdmin && (
              <button
                type="button"
                onClick={onDeactivateAdmin}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 active:scale-95 border border-rose-500/30 text-rose-300 text-xs font-semibold cursor-pointer transition"
                title="Disattiva modalità Amministratore e torna alla vista normale da cittadino"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Esci da Admin</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Chiudi pannello"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Menu stile WordPress Admin */}
        <div className="bg-slate-100 border-b border-slate-200 px-3 sm:px-5 flex items-center gap-1 overflow-x-auto scrollbar-none shrink-0">
          <button
            onClick={() => setActiveTab('insights')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'insights'
                ? 'border-[#0073aa] text-[#0073aa] bg-white -mb-px rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-[#0073aa]" />
            <span>Insight & Dati</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-100 text-emerald-800 font-bold uppercase">
              Nuovo
            </span>
          </button>

          <button
            onClick={() => setActiveTab('eventi')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'eventi'
                ? 'border-[#0073aa] text-[#0073aa] bg-white -mb-px rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Calendar className="w-4 h-4 text-amber-600" />
            <span>Eventi ({eventi.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('segnalazioni')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'segnalazioni'
                ? 'border-[#0073aa] text-[#0073aa] bg-white -mb-px rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Segnalazioni ({segnalazioni.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('volontari')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'volontari'
                ? 'border-[#0073aa] text-[#0073aa] bg-white -mb-px rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <HeartHandshake className="w-4 h-4 text-emerald-600" />
            <span>Volontariato ({richieste.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('proposte')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'proposte'
                ? 'border-[#0073aa] text-[#0073aa] bg-white -mb-px rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span>Idee ({proposte.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'config'
                ? 'border-[#0073aa] text-[#0073aa] bg-white -mb-px rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Sliders className="w-4 h-4 text-slate-500" />
            <span>Plugin ZIP & API</span>
          </button>
        </div>

        {/* Contenuto scrollabile */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-sm text-slate-700 flex-1 bg-slate-50/50">
          {/* TAB 1: INSIGHT & STATISTICHE */}
          {activeTab === 'insights' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Header Insight con controlli */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-[#0073aa]" />
                    Insight & Statistiche della Community
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Monitoraggio visivo dell'impatto civico, andamento segnalazioni, volontari e proposte a Villaggio Prenestino.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-semibold">
                    <button
                      onClick={() => setPeriodoFiltro('anno')}
                      className={`px-2.5 py-1 rounded-lg transition ${
                        periodoFiltro === 'anno' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Anno 2026
                    </button>
                    <button
                      onClick={() => setPeriodoFiltro('90g')}
                      className={`px-2.5 py-1 rounded-lg transition ${
                        periodoFiltro === '90g' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      90 gg
                    </button>
                    <button
                      onClick={() => setPeriodoFiltro('30g')}
                      className={`px-2.5 py-1 rounded-lg transition ${
                        periodoFiltro === '30g' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      30 gg
                    </button>
                  </div>

                  <button
                    onClick={handleExportCsv}
                    title="Scarica dati in formato CSV per reportistica"
                    className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Esporta CSV</span>
                  </button>

                  <button
                    onClick={loadInsights}
                    disabled={loadingInsights}
                    className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer"
                    title="Aggiorna statistiche"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingInsights ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* KPI Cards Griglia */}
              {insights && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {/* Card 1: Segnalazioni */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-300 transition">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span className="font-semibold uppercase tracking-wider text-[10px]">Segnalazioni</span>
                      <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-slate-900">
                      {insights.totaleSegnalazioni}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                      <span className="font-bold text-emerald-600">{insights.tassoRisoluzione}%</span>
                      <span>risolte con successo</span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Inoltrate: {insights.segnalazioniInoltrate}</span>
                      <span>In attesa: {insights.segnalazioniRicevute}</span>
                    </div>
                  </div>

                  {/* Card 2: Volontari */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span className="font-semibold uppercase tracking-wider text-[10px]">Volontari Mobilitati</span>
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                        <HeartHandshake className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-slate-900">
                      {insights.volontariTotali}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                      <span className="font-bold text-emerald-600">~{insights.oreCivicheStimate}h</span>
                      <span>donate al quartiere</span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Attivi: {insights.volontariAttivi}</span>
                      <span>Albo permanente</span>
                    </div>
                  </div>

                  {/* Card 3: Idee & Proposte */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 transition">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span className="font-semibold uppercase tracking-wider text-[10px]">Idee Cittadini</span>
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
                        <Lightbulb className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-slate-900">
                      {insights.ideeTotali}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                      <span className="font-bold text-indigo-600">{insights.votiTotali}</span>
                      <span>voti civici raccolti</span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Coinvolgimento alto</span>
                      <span>+1 in istruttoria</span>
                    </div>
                  </div>

                  {/* Card 4: Partecipazione Eventi */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-rose-300 transition">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span className="font-semibold uppercase tracking-wider text-[10px]">Eventi & Comunità</span>
                      <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold">
                        <Users className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-slate-900">
                      {insights.partecipantiEventi}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                      <span className="font-bold text-rose-600">{insights.tassoRiempimentoEventi}%</span>
                      <span>affluenza su target</span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Eventi: {insights.eventiTotali}</span>
                      <span>Solidali & Culturali</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Sezione Grafici: Andamento Segnalazioni + Distribuzione */}
              {insights && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Grafico 1: Andamento nel tempo (Bar chart comparativo) */}
                  <div className="lg:col-span-2 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                          <TrendingUp className="w-4 h-4 text-emerald-600" />
                          Andamento Segnalazioni & Risoluzioni nel Tempo
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Confronto tra segnalazioni inviate e risolte per mese (2026)
                        </p>
                      </div>

                      <div className="flex items-center gap-3 text-[10px] font-semibold text-slate-600 shrink-0">
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" /> Inviate
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600 inline-block" /> Risolte
                        </span>
                      </div>
                    </div>

                    {/* Visualizzatore Grafico a Barre SVG/HTML */}
                    <div className="pt-2">
                      <div className="h-44 flex items-end gap-3 sm:gap-6 justify-between px-2 border-b border-slate-200 pb-2">
                        {insights.trendMese.map((t, idx) => {
                          const maxVal = 10;
                          const heightInviate = Math.round((t.inviate / maxVal) * 130);
                          const heightRisolte = Math.round((t.risolte / maxVal) * 130);
                          return (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                              <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-36">
                                {/* Barra Inviate */}
                                <div className="relative flex flex-col items-center">
                                  <span className="text-[9px] font-bold text-amber-700 opacity-0 group-hover:opacity-100 transition-opacity mb-0.5">
                                    {t.inviate}
                                  </span>
                                  <div
                                    className="w-3 sm:w-5 bg-gradient-to-t from-amber-500 to-amber-400 rounded-t-md transition-all group-hover:brightness-110 shadow-xs"
                                    style={{ height: `${Math.max(12, heightInviate)}px` }}
                                  />
                                </div>

                                {/* Barra Risolte */}
                                <div className="relative flex flex-col items-center">
                                  <span className="text-[9px] font-bold text-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity mb-0.5">
                                    {t.risolte}
                                  </span>
                                  <div
                                    className="w-3 sm:w-5 bg-gradient-to-t from-emerald-600 to-emerald-500 rounded-t-md transition-all group-hover:brightness-110 shadow-xs"
                                    style={{ height: `${Math.max(10, heightRisolte)}px` }}
                                  />
                                </div>
                              </div>
                              <span className="text-[11px] font-bold text-slate-600">{t.mese}</span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Tempo medio prima presa in carico: <strong>&lt; 24 ore</strong>
                        </span>
                        <span className="font-semibold text-slate-700">
                          Tasso di chiusura pratiche: <span className="text-emerald-700 font-bold">{insights.tassoRisoluzione}%</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Grafico 2: Categorie Segnalazioni */}
                  <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        Criticità per Settore
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Ripartizione tematica delle richieste dei residenti
                      </p>
                    </div>

                    <div className="space-y-3 py-1">
                      {insights.categorieSegnalazioni.map((cat, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-700 truncate">{cat.nome}</span>
                            <span className="font-bold text-slate-900 shrink-0 ml-2">{cat.perc}% ({cat.count})</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${cat.perc}%`, backgroundColor: cat.color }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                      I dati vengono inoltrati automaticamente agli uffici tecnici del Municipio VI di Roma Capitale.
                    </div>
                  </div>
                </div>
              )}

              {/* Sezione Volontari per Competenze e Idee Popolari */}
              {insights && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Card Volontari per Attività */}
                  <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                          <HeartHandshake className="w-4 h-4 text-emerald-600" />
                          Volontari per Ambito di Disponibilità
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Disponibilità indicate dai cittadini nel form "Partecipa"
                        </p>
                      </div>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                        {insights.volontariTotali} iscritti
                      </span>
                    </div>

                    <div className="space-y-2.5 pt-1">
                      {insights.volontariPerAttivita.map((att, idx) => {
                        const colors = ['#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#06b6d4'];
                        const col = colors[idx % colors.length];
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium text-slate-700">{att.nome}</span>
                              <span className="font-bold text-slate-900">
                                {att.count} volontari <span className="text-slate-400 font-normal">({att.perc}%)</span>
                              </span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${att.perc * 2}%`, backgroundColor: col }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Card Barometro Idee dei Cittadini */}
                  <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                          <Lightbulb className="w-4 h-4 text-amber-500" />
                          Barometro Partecipazione & Idee Più Votate
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Proposte civiche ordinate per preferenze dei residenti
                        </p>
                      </div>
                      <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                        {insights.votiTotali} voti totali
                      </span>
                    </div>

                    <div className="space-y-3 pt-1">
                      {insights.topProposte.map((prop, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold text-slate-800 line-clamp-2">
                              {prop.titolo}
                            </span>
                            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              prop.stato === 'Approvata'
                                ? 'bg-emerald-100 text-emerald-800'
                                : prop.stato === 'Inoltrata'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {prop.stato}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span className="flex items-center gap-1">
                              <strong>{prop.voti}</strong> voti favorevoli
                            </span>
                            <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-amber-500 rounded-full"
                                style={{ width: `${Math.min(100, (prop.voti / 90) * 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: GESTIONE EVENTI */}
          {activeTab === 'eventi' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-amber-600" />
                    Gestione Eventi del Quartiere
                  </h3>
                  <p className="text-xs text-slate-500">
                    Crea nuovi eventi o visualizza i partecipanti registrati sull'app.
                  </p>
                </div>

                <button
                  onClick={() => setShowNewEventModal(true)}
                  className="py-2 px-3.5 bg-[#0073aa] hover:bg-[#005177] text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Aggiungi Evento</span>
                </button>
              </div>

              {/* Form Aggiunta Nuovo Evento (espanso se cliccato) */}
              {showNewEventModal && (
                <form
                  onSubmit={handleCreaNuovoEvento}
                  className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-[#0073aa]/30 shadow-md space-y-3"
                >
                  <div className="flex items-center justify-between border-b pb-2">
                    <h4 className="text-xs font-bold text-[#0073aa] uppercase tracking-wider">
                      Nuovo Evento per la Web App
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowNewEventModal(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Titolo Evento:
                      </label>
                      <input
                        type="text"
                        required
                        value={newEvent.t}
                        onChange={(e) => setNewEvent({ ...newEvent, t: e.target.value })}
                        placeholder="Es. Festa di Quartiere di Primavera"
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0073aa]"
                      />
                    </div>

                    <div className="sm:col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        📅 Data Completa Evento (Seleziona Giorno, Mese e Anno):
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                        <div className="sm:col-span-2">
                          <input
                            type="date"
                            required
                            value={newEvent.dataCompleta}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (!val) return;
                              const parts = val.split('-');
                              if (parts.length === 3) {
                                const mapM: Record<string, string> = {
                                  '01': 'GEN', '02': 'FEB', '03': 'MAR', '04': 'APR',
                                  '05': 'MAG', '06': 'GIU', '07': 'LUG', '08': 'AGO',
                                  '09': 'SET', '10': 'OTT', '11': 'NOV', '12': 'DIC',
                                };
                                setNewEvent({
                                  ...newEvent,
                                  dataCompleta: val,
                                  anno: parts[0],
                                  m: mapM[parts[1]] || 'OTT',
                                  d: String(parseInt(parts[2], 10)),
                                });
                              }
                            }}
                            className="w-full px-3 py-2 text-xs font-bold bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0073aa]"
                          />
                        </div>
                        <div className="flex items-center gap-1 sm:col-span-2 text-xs text-slate-500">
                          <span className="font-semibold text-slate-700">
                            {newEvent.d} {newEvent.m} {newEvent.anno}
                          </span>
                          {newEvent.dataCompleta && newEvent.dataCompleta < new Date().toISOString().slice(0, 10) && (
                            <span className="ml-auto px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                              Passato (Archivio)
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1.5">
                        Se imposti una data passata (es. ieri o anno precedente), l'evento verrà inserito automaticamente nella sezione <strong>"Eventi Passati"</strong>.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Orario (es. 10:30):
                      </label>
                      <input
                        type="text"
                        required
                        value={newEvent.ora}
                        onChange={(e) => setNewEvent({ ...newEvent, ora: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Luogo / Indirizzo:
                      </label>
                      <input
                        type="text"
                        required
                        value={newEvent.luogo}
                        onChange={(e) => setNewEvent({ ...newEvent, luogo: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Tipologia di Evento:
                      </label>
                      <select
                        value={newEvent.tipo}
                        onChange={(e) => setNewEvent({ ...newEvent, tipo: e.target.value as TipoEvento })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                      >
                        <option value="volontariato">Volontariato civico</option>
                        <option value="gratuito">Gratuito (Partecipazione aperta)</option>
                        <option value="pagamento">Con Quota d'iscrizione</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Obiettivo / Posti target:
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={newEvent.target}
                        onChange={(e) => setNewEvent({ ...newEvent, target: Number(e.target.value) })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                      />
                    </div>

                    {newEvent.tipo === 'pagamento' && (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Quota richiesta (es. 10€):
                        </label>
                        <input
                          type="text"
                          value={newEvent.quota}
                          onChange={(e) => setNewEvent({ ...newEvent, quota: e.target.value })}
                          placeholder="10€"
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                        />
                      </div>
                    )}

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Descrizione dettagliata:
                      </label>
                      <textarea
                        rows={2}
                        value={newEvent.p}
                        onChange={(e) => setNewEvent({ ...newEvent, p: e.target.value })}
                        placeholder="Dettagli per i partecipanti..."
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <button
                      type="button"
                      onClick={() => setShowNewEventModal(false)}
                      className="py-1.5 px-3 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg"
                    >
                      Annulla
                    </button>
                    <button
                      type="submit"
                      className="py-1.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg"
                    >
                      Pubblica Evento
                    </button>
                  </div>
                </form>
              )}

              {/* Lista Eventi */}
              <div className="space-y-2.5">
                {eventi.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex flex-col items-center justify-center shrink-0">
                        <span className="text-sm font-black leading-none">{ev.d}</span>
                        <span className="text-[9px] font-bold text-amber-400">{ev.m}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900">{ev.t}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            ev.passato ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {ev.passato ? 'Concluso' : 'In programma'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                          <span>{ev.ora} • {ev.luogo}</span>
                          {ev.quota && <span className="font-bold text-emerald-700">• Quota: {ev.quota}</span>}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      <div className="text-right">
                        <span className="block text-xs font-bold text-slate-900">
                          {ev.n} / {ev.target}
                        </span>
                        <span className="block text-[10px] text-slate-500">partecipanti</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: GESTIONE SEGNALAZIONI */}
          {activeTab === 'segnalazioni' && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Gestione & Avanzamento Segnalazioni Territoriali
                </h3>
                <p className="text-xs text-slate-500">
                  Aggiorna lo stato delle segnalazioni inviate dai cittadini. Lo stato viene sincronizzato in tempo reale con l'app.
                </p>
              </div>

              <div className="space-y-3">
                {segnalazioni.map((seg) => (
                  <div
                    key={seg.id}
                    className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      {seg.ph && seg.ph[0] ? (
                        <img
                          src={seg.ph[0]}
                          alt={seg.t}
                          className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                          <Eye className="w-5 h-5" />
                        </div>
                      )}

                      <div className="space-y-1">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900">{seg.t}</h4>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" /> {seg.w} • Data: {seg.data}
                        </p>
                        {seg.desc && (
                          <p className="text-[11px] text-slate-600 line-clamp-1">{seg.desc}</p>
                        )}
                        {seg.cittadinoNome && (
                          <p className="text-[10px] text-slate-400">
                            Inviata da: <strong>{seg.cittadinoNome}</strong>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                      <label className="text-xs font-semibold text-slate-600 sm:sr-only">
                        Cambia Stato:
                      </label>
                      <select
                        value={seg.s}
                        onChange={(e) => {
                          const newStato = Number(e.target.value) as StatoSegnalazione;
                          if (onUpdateSegnalazioneStato) {
                            onUpdateSegnalazioneStato(seg.id, newStato);
                            loadInsights();
                          }
                        }}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition cursor-pointer ${
                          seg.s === 3
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : seg.s === 2
                            ? 'bg-blue-50 text-blue-800 border-blue-300'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}
                      >
                        <option value={1}>🟡 Ricevuta (Presa in carico)</option>
                        <option value={2}>🔵 Inoltrata al Municipio VI</option>
                        <option value={3}>🟢 Risolta con successo</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: VOLONTARIATO ("Serve una mano") */}
          {activeTab === 'volontari' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <HeartHandshake className="w-5 h-5 text-emerald-600" />
                    Attività di Volontariato ("Serve una mano")
                  </h3>
                  <p className="text-xs text-slate-500">
                    Richieste d'aiuto per interventi nel quartiere e monitoraggio adesioni con contatti dei residenti.
                  </p>
                </div>

                <button
                  onClick={() => setShowNewRichiestaModal(true)}
                  className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nuova Attività</span>
                </button>
              </div>

              {/* Form Nuova Richiesta Volontari */}
              {showNewRichiestaModal && (
                <form
                  onSubmit={handleCreaNuovaRichiesta}
                  className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-emerald-400/40 shadow-md space-y-3"
                >
                  <div className="flex items-center justify-between border-b pb-2">
                    <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                      Nuova Richiesta di Volontariato
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowNewRichiestaModal(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Titolo Attività:
                      </label>
                      <input
                        type="text"
                        required
                        value={newRichiesta.t}
                        onChange={(e) => setNewRichiesta({ ...newRichiesta, t: e.target.value })}
                        placeholder="Es. Pulizia sentiero e potatura rami al Parco"
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Luogo / Zona:
                      </label>
                      <input
                        type="text"
                        required
                        value={newRichiesta.w}
                        onChange={(e) => setNewRichiesta({ ...newRichiesta, w: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Volontari Necessari (Target):
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={newRichiesta.need}
                        onChange={(e) => setNewRichiesta({ ...newRichiesta, need: Number(e.target.value) })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Cosa c'è da fare (Descrizione):
                      </label>
                      <textarea
                        rows={2}
                        value={newRichiesta.desc}
                        onChange={(e) => setNewRichiesta({ ...newRichiesta, desc: e.target.value })}
                        placeholder="Descrivi l'azione necessaria..."
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                      />
                    </div>

                    <div className="sm:col-span-2 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="urgenteCheck"
                        checked={newRichiesta.urgente}
                        onChange={(e) => setNewRichiesta({ ...newRichiesta, urgente: e.target.checked })}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <label htmlFor="urgenteCheck" className="text-xs font-semibold text-slate-700 cursor-pointer">
                        Contrassegna come <strong>Urgente</strong> nell'app
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <button
                      type="button"
                      onClick={() => setShowNewRichiestaModal(false)}
                      className="py-1.5 px-3 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg"
                    >
                      Annulla
                    </button>
                    <button
                      type="submit"
                      className="py-1.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg"
                    >
                      Salva Attività
                    </button>
                  </div>
                </form>
              )}

              {/* Lista Richieste Volontari */}
              <div className="space-y-3">
                {richieste.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900">{req.t}</h4>
                        {req.urgente && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-100 text-rose-800">
                            Urgente
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" /> {req.w}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">{req.desc}</p>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className="block text-xs font-bold text-slate-900">
                        {req.have} / {req.need} volontari
                      </span>
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${Math.min(100, (req.have / Math.max(1, req.need)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: PROPOSTE CITTADINI */}
          {activeTab === 'proposte' && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  Idee & Proposte Avanzate dai Residenti
                </h3>
                <p className="text-xs text-slate-500">
                  Idee civiche proposte per migliorare Villaggio Prenestino con il conteggio dei voti "Mi piace".
                </p>
              </div>

              <div className="space-y-2.5">
                {[...proposte].sort((a, b) => b.v - a.v).map((p, idx) => (
                  <div
                    key={p.id}
                    className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          #{idx + 1}
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900">{p.t}</h4>
                      </div>
                      <span className="text-[10px] text-slate-400">ID #{p.id}</span>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-1">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                        {p.v} voti
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: CONFIGURAZIONE & PLUGIN ZIP */}
          {activeTab === 'config' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Box Download ZIP */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-amber-50/50 border-2 border-emerald-300 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white uppercase tracking-wider mb-1.5">
                    Versione 1.3.2: Dashboard & Tab Hub (Zero Dati Fittizi)
                  </span>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    Scarica il Plugin WordPress: <code className="text-emerald-800">vp-quartiere.zip</code>
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 max-w-md">
                    Menu verticale di WordPress ordinato sotto l'unica voce <strong>"🏡 VP Quartiere"</strong>: apre come prima scheda la <strong>"Dashboard & Tab Hub"</strong> con statistiche immediate, schede ordinate e installazione pulita azzerata senza dati fittizi, pronta per caricare i dati reali dalla Web App.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => downloadBlobFile('/vp-quartiere.zip', 'vp-quartiere.zip')}
                    className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-700/20 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Scarica ZIP (v1.3.2)</span>
                  </button>
                  <button
                    onClick={handleCopiaCodice}
                    className="py-2.5 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copiato ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    {copiato ? 'Copiato!' : 'Copia PHP'}
                  </button>
                </div>
              </div>

              {/* Guida Ergonet */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-[#0073aa]" />
                  Installazione rapida su WordPress Ergonet (3 minuti):
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-xs text-slate-600 leading-relaxed">
                  <li>
                    Accedi all'amministrazione su{' '}
                    <a
                      href="https://www.villaggioprenestino.it/wp-admin"
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-[#0073aa] underline"
                    >
                      www.villaggioprenestino.it/wp-admin
                    </a>
                  </li>
                  <li>
                    Nel menu a sinistra vai su <strong>Plugin &gt; Aggiungi nuovo &gt; Carica plugin</strong>.
                  </li>
                  <li>
                    Carica il file <strong>vp-quartiere.zip</strong> scaricato qui sopra e clicca su <strong>Installa adesso</strong>, poi su <strong>Attiva plugin</strong> (sostituisci la versione precedente se richiesta).
                  </li>
                  <li>
                    Troverai nel menu verticale una <strong>sola voce ordinata: "🏡 VP Quartiere"</strong>. Tutte le sezioni (Eventi con anno, Serve una Mano, Segnalazioni, Proposte, Albo Volontari e Impostazioni) sono raggruppate lì dentro e navigabili anche tramite le comode <strong>Schede (Tab) interne</strong>!
                  </li>
                </ol>
              </div>

              {/* Pubblicazione della Web App su /app */}
              <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-amber-50/40 p-5 rounded-2xl border-2 border-blue-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white uppercase tracking-wider mb-1">
                      Pubblicazione Web App
                    </span>
                    <h4 className="text-base font-bold text-slate-900 leading-tight">
                      Come pubblicare l'app su <code className="text-blue-700 bg-blue-100/80 px-1.5 py-0.5 rounded">www.villaggioprenestino.it/app</code>
                    </h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Pacchetto già compilato e configurato con percorsi relativi e file <code>.htaccess</code> ottimizzato per Apache.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => downloadBlobFile('/villaggioprenestino-app.zip', 'villaggioprenestino-app.zip')}
                    className="py-2.5 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-blue-700/20 transition flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Scarica Web App ZIP (Pronta)</span>
                  </button>
                </div>

                <div className="bg-white/90 p-4 rounded-xl border border-blue-100 space-y-2 text-xs text-slate-700">
                  <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    I 4 passaggi per pubblicarla nel tuo hosting (Ergonet):
                  </h5>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-600 leading-relaxed pl-1">
                    <li>
                      Scarica il file <strong>villaggioprenestino-app.zip</strong> con il pulsante qui sopra.
                    </li>
                    <li>
                      Accedi al pannello di controllo del tuo hosting (es. <strong>cPanel &gt; Gestione File</strong> o tramite <strong>FTP / FileZilla</strong>).
                    </li>
                    <li>
                      Entra nella cartella radice del sito (di solito <code>public_html</code>) e crea una nuova cartella denominata <code>app</code>.
                    </li>
                    <li>
                      Carica ed estrai il contenuto dello zip dentro la cartella <code>app</code> (ci saranno <code>index.html</code>, <code>assets</code>, <code>.htaccess</code> e le icone).
                    </li>
                  </ol>
                  <p className="pt-1 text-[11px] text-emerald-700 font-semibold">
                    ✓ Fatto! Aprendo <code>https://www.villaggioprenestino.it/app</code> la Web App sarà subito online per tutti i cittadini!
                  </p>
                </div>
              </div>

              {/* Connessione API */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-[#0073aa]" />
                  Modalità di Collegamento & Endpoint REST
                </h4>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <span className="block text-xs font-bold text-slate-900">
                      {useLiveApi ? '🟢 Modalità Online (Chiamate a WordPress)' : '🟡 Modalità Simulatore (Locale & Offline)'}
                    </span>
                    <span className="block text-[11px] text-slate-500 mt-0.5">
                      {useLiveApi
                        ? 'L\'app invia e riceve i dati direttamente dalle API del tuo sito.'
                        : 'Usa i dati di memoria locale con salvataggio nel browser per testare ogni funzione.'}
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={useLiveApi}
                      onChange={(e) => setUseLiveApi(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      URL Sito WordPress:
                    </label>
                    <input
                      type="url"
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      placeholder="https://www.villaggioprenestino.it"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                      <Key className="w-3.5 h-3.5 text-slate-400" />
                      Chiave API:
                    </label>
                    <input
                      type="text"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Chiave generata dal plugin"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white font-mono"
                    />
                  </div>
                </div>

                {testResult && (
                  <div className="p-3 rounded-xl bg-slate-100 text-xs text-slate-800 border border-slate-200">
                    {testResult}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleTest}
                    disabled={testing}
                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl border border-slate-200 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                    {testing ? 'Verifica in corso...' : 'Test Connessione API'}
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveConfig}
                    className="py-2 px-4 bg-[#0073aa] hover:bg-[#005177] text-white text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Salva Configurazione
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Plugin WordPress VP Quartiere v1.3.2</span>
            <span className="text-slate-300">•</span>
            <span>Comitato di Quartiere Villaggio Prenestino</span>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
