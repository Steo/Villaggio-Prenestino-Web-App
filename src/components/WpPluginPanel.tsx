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
  AttivitaCommercio,
  AppTabsConfig,
  DEFAULT_TABS_CONFIG,
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
  EyeOff,
  Sliders,
  ChevronRight,
  Sparkles,
  LogOut,
  Store,
  Phone,
  Tag,
  Percent,
  Mail,
  Code2,
  Map,
  Layers,
  Search,
} from 'lucide-react';
import { WpAdminLiveSummary } from './WpAdminLiveSummary';
import { recordVolunteerAction } from '../services/volunteerActionService';

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
  attivitaCommercio?: AttivitaCommercio[];
  onRefreshData?: () => void;
  onUpdateSegnalazioneStato?: (id: number, stato: StatoSegnalazione) => void;
  onCreateEvento?: (evento: Omit<EventoQuartiere, 'id'>) => void;
  onCreateRichiesta?: (richiesta: Omit<RichiestaVolontariato, 'id' | 'have'>) => void;
  onApprovaAttivita?: (id: number) => void;
  onUpdateSegnalazioneModerazione?: (id: number, stato: 'approvata' | 'rifiutata' | 'in_attesa', motivazione?: string) => void;
  onUpdatePropostaModerazione?: (id: number, stato: 'approvata' | 'rifiutata' | 'in_attesa', motivazione?: string) => void;
  onDeactivateAdmin?: () => void;
  tabsConfig?: AppTabsConfig;
  onToggleTab?: (tab: keyof AppTabsConfig) => void;
}

const TabActiveToggleButton: React.FC<{
  feature: keyof AppTabsConfig;
  title: string;
  tabsConfig: AppTabsConfig;
  onToggleTab?: (tab: keyof AppTabsConfig) => void;
  description: string;
}> = ({ feature, title, tabsConfig, onToggleTab, description }) => {
  const isActive = tabsConfig[feature] !== false;
  return (
    <div
      className={`p-4 rounded-2xl border transition-all mb-4 ${
        isActive
          ? 'bg-emerald-50/80 border-emerald-200'
          : 'bg-rose-50/80 border-rose-200'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isActive ? 'bg-emerald-600 text-white shadow-xs' : 'bg-rose-600 text-white shadow-xs'
            }`}
          >
            {isActive ? <Check className="w-5 h-5 stroke-[2.5]" /> : <EyeOff className="w-5 h-5 stroke-[2.5]" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-800">Stato Funzionalità nell'App:</span>
              <span
                className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isActive ? 'bg-emerald-600 animate-pulse' : 'bg-rose-600'
                  }`}
                />
                {isActive ? 'SCHEDA ATTIVA' : 'SCHEDA DISATTIVATA'}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              {isActive
                ? `La scheda "${title}" è attiva e visibile a tutti gli utilizzatori dell'app nella barra di navigazione.`
                : `La scheda "${title}" è disattivata e nascosta nella barra di navigazione dell'app (ad eccezione della Home).`}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onToggleTab?.(feature)}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shrink-0 shadow-xs ${
            isActive
              ? 'bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 hover:border-rose-400'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>{isActive ? 'Disattiva nell\'App' : 'Attiva nell\'App'}</span>
        </button>
      </div>
    </div>
  );
};

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
  attivitaCommercio = [],
  onRefreshData,
  onUpdateSegnalazioneStato,
  onCreateEvento,
  onCreateRichiesta,
  onApprovaAttivita,
  onUpdateSegnalazioneModerazione,
  onUpdatePropostaModerazione,
  onDeactivateAdmin,
  tabsConfig = DEFAULT_TABS_CONFIG,
  onToggleTab,
}) => {
  const [activeTab, setActiveTab] = useState<
    'insights' | 'commercianti' | 'shortcodes' | 'eventi' | 'segnalazioni' | 'volontari' | 'proposte' | 'config'
  >('insights');
  const [commercioStatoFiltro, setCommercioStatoFiltro] = useState<'tutti' | 'pending' | 'publish'>('tutti');
  const [segnalazioniStatoFiltro, setSegnalazioniStatoFiltro] = useState<'tutti' | 'in_attesa' | 'approvata' | 'rifiutata'>('tutti');
  const [proposteStatoFiltro, setProposteStatoFiltro] = useState<'tutti' | 'in_attesa' | 'approvata' | 'rifiutata'>('tutti');

  // Shortcode Generator State
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [scProvider, setScProvider] = useState<'osm' | 'google'>('osm');
  const [scCategoria, setScCategoria] = useState<string>('tutte');
  const [scSchede, setScSchede] = useState<'si' | 'no'>('si');
  const [scRicerca, setScRicerca] = useState<'si' | 'no'>('si');
  const [scFiltroCat, setScFiltroCat] = useState<'si' | 'no'>('si');
  const [scColonne, setScColonne] = useState<'1' | '2' | '3' | '4'>('3');
  const [scAltezza, setScAltezza] = useState<string>('420px');
  const [scOfferteSolo, setScOfferteSolo] = useState<'si' | 'no'>('no');
  const [scLimite, setScLimite] = useState<string>('-1');

  const copyShortcodeText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(text);
    setTimeout(() => setCopiedSnippet(null), 2500);
  };

  const generateCurrentShortcode = (): string => {
    const parts = ['vp_negozi_mappa'];
    if (scProvider !== 'osm') parts.push(`provider="${scProvider}"`);
    if (scCategoria !== 'tutte') parts.push(`categoria="${scCategoria}"`);
    if (scSchede !== 'si') parts.push(`schede="${scSchede}"`);
    if (scRicerca !== 'si') parts.push(`ricerca="${scRicerca}"`);
    if (scFiltroCat !== 'si') parts.push(`filtro_categoria="${scFiltroCat}"`);
    if (scColonne !== '3') parts.push(`colonne="${scColonne}"`);
    if (scAltezza !== '420px') parts.push(`altezza="${scAltezza}"`);
    if (scOfferteSolo !== 'no') parts.push(`offerte_solo="${scOfferteSolo}"`);
    if (scLimite !== '-1') parts.push(`limite="${scLimite}"`);
    return `[${parts.join(' ')}]`;
  };

  // Modale per inserire la motivazione del rifiuto
  const [rejectionModalItem, setRejectionModalItem] = useState<{
    type: 'segnalazione' | 'proposta' | 'commercio';
    id: number;
    titolo: string;
  } | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [rejectionError, setRejectionError] = useState<string | null>(null);

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
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
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
    locandina: '',
    featured_media_url: '',
  });

  // Volunteer request form state
  const [showNewRichiestaModal, setShowNewRichiestaModal] = useState(false);
  const [newRichiesta, setNewRichiesta] = useState({
    t: '',
    w: 'Parco di Via Fosso dell\'Osa',
    desc: '',
    need: 6,
    urgente: false,
    locandina: '',
    featured_media_url: '',
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
      ['Segnalazioni in Lavorazione', insights.segnalazioniRicevute.toString(), 'Presa in carico Associazione'],
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
      const poster = newEvent.featured_media_url || newEvent.locandina || '';
      onCreateEvento({
        t: newEvent.t.trim(),
        p: newEvent.p.trim() || 'Evento organizzato dall\'Associazione di Quartiere Villaggio Prenestino.',
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
        locandina: poster,
        featured_media_url: poster,
        immagine_in_evidenza: poster,
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
        locandina: '',
        featured_media_url: '',
      });
      loadInsights();
    }
  };

  const handleCreaNuovaRichiesta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRichiesta.t.trim()) return;
    if (onCreateRichiesta) {
      const poster = newRichiesta.featured_media_url || newRichiesta.locandina || '';
      onCreateRichiesta({
        t: newRichiesta.t.trim(),
        w: newRichiesta.w.trim(),
        desc: newRichiesta.desc.trim() || 'Attività di volontariato sul territorio.',
        need: Number(newRichiesta.need) || 6,
        urgente: newRichiesta.urgente,
        locandina: poster,
        featured_media_url: poster,
        immagine_in_evidenza: poster,
      });
      recordVolunteerAction({
        tipo: 'nuova_iniziativa',
        titolo: newRichiesta.t.trim(),
        luogo: newRichiesta.w.trim(),
        volontarioNome: 'Amministratore WP',
        dettaglio: `Aperta ricerca per ${newRichiesta.need} volontari`,
      });
      setShowNewRichiestaModal(false);
      setNewRichiesta({
        t: '',
        w: 'Parco di Via Fosso dell\'Osa',
        desc: '',
        need: 6,
        urgente: false,
        locandina: '',
        featured_media_url: '',
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
                villaggioprenestino.it • Plugin VP Quartiere v1.6.0 (Moderazione Commercianti & Negozi)
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
            onClick={() => setActiveTab('commercianti')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'commercianti'
                ? 'border-[#0073aa] text-[#0073aa] bg-white -mb-px rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Store className="w-4 h-4 text-amber-600" />
            <span>Commercianti ({attivitaCommercio.length})</span>
            <span
              className={`w-2 h-2 rounded-full ${tabsConfig.commercio !== false ? 'bg-emerald-500' : 'bg-rose-500'}`}
              title={tabsConfig.commercio !== false ? "Scheda Attiva nell'App" : "Scheda Disattivata nell'App"}
            />
            {attivitaCommercio.filter(a => a.statoApprovazione === 'in_attesa').length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-rose-500 text-white font-bold animate-pulse">
                {attivitaCommercio.filter(a => a.statoApprovazione === 'in_attesa').length} in attesa
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('shortcodes')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'shortcodes'
                ? 'border-[#0073aa] text-[#0073aa] bg-white -mb-px rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Code2 className="w-4 h-4 text-indigo-600" />
            <span>Shortcode Mappa</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-indigo-100 text-indigo-800 font-bold uppercase">
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
            <span
              className={`w-2 h-2 rounded-full ${tabsConfig.eventi !== false ? 'bg-emerald-500' : 'bg-rose-500'}`}
              title={tabsConfig.eventi !== false ? "Scheda Attiva nell'App" : "Scheda Disattivata nell'App"}
            />
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
            <span
              className={`w-2 h-2 rounded-full ${tabsConfig.segnalazioni !== false ? 'bg-emerald-500' : 'bg-rose-500'}`}
              title={tabsConfig.segnalazioni !== false ? "Scheda Attiva nell'App" : "Scheda Disattivata nell'App"}
            />
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
            <span
              className={`w-2 h-2 rounded-full ${tabsConfig.volontariato !== false ? 'bg-emerald-500' : 'bg-rose-500'}`}
              title={tabsConfig.volontariato !== false ? "Scheda Attiva nell'App" : "Scheda Disattivata nell'App"}
            />
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
            <span
              className={`w-2 h-2 rounded-full ${tabsConfig.proposte !== false ? 'bg-emerald-500' : 'bg-rose-500'}`}
              title={tabsConfig.proposte !== false ? "Scheda Attiva nell'App" : "Scheda Disattivata nell'App"}
            />
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

              {/* Componente di Riepilogo in Tempo Reale (Attività Mappate, Segnalazioni in Attesa, Ultime 5 Azioni Volontariato) */}
              <WpAdminLiveSummary
                attivitaCommercio={attivitaCommercio}
                segnalazioni={segnalazioni}
                richieste={richieste}
                onNavigateTab={(tab) => {
                  setActiveTab(tab);
                  if (tab === 'segnalazioni') {
                    setSegnalazioniStatoFiltro('in_attesa');
                  }
                }}
                onRefreshData={() => {
                  loadInsights();
                  if (onRefreshData) onRefreshData();
                }}
              />

              {/* Riquadro Attivazione Schede Web App */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[#0073aa]" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Controllo Attivazione Schede nella Web App
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    La scheda Home è sempre attiva • Attiva/disattiva le singole sezioni per gli utenti
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                  {[
                    { key: 'commercio' as const, label: 'Commercianti', tab: 'commercianti' as const, icon: Store, color: 'text-amber-600' },
                    { key: 'eventi' as const, label: 'Eventi', tab: 'eventi' as const, icon: Calendar, color: 'text-blue-600' },
                    { key: 'segnalazioni' as const, label: 'Segnalazioni', tab: 'segnalazioni' as const, icon: AlertTriangle, color: 'text-rose-600' },
                    { key: 'volontariato' as const, label: 'Volontari', tab: 'volontari' as const, icon: HeartHandshake, color: 'text-emerald-600' },
                    { key: 'proposte' as const, label: 'Idee', tab: 'proposte' as const, icon: Lightbulb, color: 'text-purple-600' },
                  ].map((item) => {
                    const active = tabsConfig[item.key] !== false;
                    const IconComp = item.icon;
                    return (
                      <div
                        key={item.key}
                        className={`p-3 rounded-xl border flex flex-col justify-between transition ${
                          active
                            ? 'bg-slate-50/80 border-slate-200'
                            : 'bg-rose-50/50 border-rose-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-2">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <IconComp className={`w-3.5 h-3.5 ${item.color}`} />
                            {item.label}
                          </span>
                          <span
                            className={`w-2 h-2 rounded-full ${
                              active ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <button
                            type="button"
                            onClick={() => onToggleTab?.(item.key)}
                            className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-bold transition cursor-pointer text-center ${
                              active
                                ? 'bg-rose-100 hover:bg-rose-200 text-rose-800'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            }`}
                          >
                            {active ? 'Disattiva' : 'Attiva'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTab(item.tab)}
                            className="p-1 rounded-lg bg-slate-200/80 hover:bg-slate-300 text-slate-700 text-[10px] font-bold transition cursor-pointer"
                            title={`Vai alla scheda ${item.label}`}
                          >
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
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

          {/* TAB: GESTIONE & APPROVAZIONE COMMERCIANTI */}
          {activeTab === 'commercianti' && (
            <div className="space-y-4 animate-fadeIn">
              <TabActiveToggleButton
                feature="commercio"
                title="Commercianti & Negozi"
                tabsConfig={tabsConfig}
                onToggleTab={onToggleTab}
                description="Mostra la vetrina e la mappa dei commercianti di quartiere agli utenti dell'app."
              />

              {/* Banner Shortcode Mappa per Pagine/Articoli WordPress */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border border-indigo-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-600 text-white shrink-0 shadow-xs">
                    <Code2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-indigo-950 uppercase tracking-wider">
                        Novità v1.6.0: Shortcode WordPress
                      </span>
                      <code className="text-xs font-mono font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-indigo-200">
                        [vp_negozi_mappa]
                      </code>
                    </div>
                    <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                      Puoi incorporare questa mappa e l'elenco delle schede commercianti in <strong>qualsiasi pagina o articolo del tuo sito WordPress</strong> con OpenStreetMap (gratuito) o Google Maps, filtri di categoria e ricerca!
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => copyShortcodeText('[vp_negozi_mappa]')}
                    className="flex-1 sm:flex-none px-3 py-2 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    {copiedSnippet === '[vp_negozi_mappa]' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                    <span>{copiedSnippet === '[vp_negozi_mappa]' ? 'Copiato!' : 'Copia Base'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('shortcodes')}
                    className="flex-1 sm:flex-none px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>Configura & Guida</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Store className="w-5 h-5 text-amber-600" />
                    Gestione & Approvazione Commercianti
                  </h3>
                  <p className="text-xs text-slate-500">
                    Controlla le richieste di inserimento attività, visualizza la foto/logo JPG e approva la pubblicazione su Google Maps e nella vetrina.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">
                    Totale: {attivitaCommercio.length}
                  </span>
                  {attivitaCommercio.filter(a => a.statoApprovazione === 'in_attesa').length > 0 && (
                    <span className="px-2.5 py-1 bg-amber-100 border border-amber-300 text-amber-900 rounded-xl text-xs font-bold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>{attivitaCommercio.filter(a => a.statoApprovazione === 'in_attesa').length} in attesa</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Grafico a Barre: Distribuzione Attività Commerciali per Categoria */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-amber-100 text-amber-800 border border-amber-200">
                      <BarChart3 className="w-5 h-5 text-amber-700" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                        Varietà dell'Offerta Commerciale Locale per Categoria
                      </h4>
                      <p className="text-xs text-slate-500">
                        Analisi della distribuzione delle {attivitaCommercio.length} attività commerciali registrate nel quartiere.
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200 self-start sm:self-auto">
                    {[
                      'alimentari',
                      'ristorazione',
                      'salute',
                      'artigiani',
                      'servizi_persona',
                      'servizi_animali',
                      'casa',
                    ].filter((c) => attivitaCommercio.some((a) => a.categoria === c)).length} di 7 Categorie Attive
                  </span>
                </div>

                {/* Lista Barre per Categoria */}
                <div className="space-y-3 pt-1">
                  {[
                    { key: 'alimentari', label: 'Alimentari', icon: '🍞', color: 'bg-emerald-500' },
                    { key: 'ristorazione', label: 'Ristorazione', icon: '🍕', color: 'bg-amber-500' },
                    { key: 'salute', label: 'Farmacie & salute', icon: '💊', color: 'bg-rose-500' },
                    { key: 'artigiani', label: 'Artigiani', icon: '🔨', color: 'bg-purple-500' },
                    { key: 'servizi_persona', label: 'Servizi alla persona', icon: '💇', color: 'bg-indigo-500' },
                    { key: 'servizi_animali', label: 'Servizi per animali', icon: '🐾', color: 'bg-teal-500' },
                    { key: 'casa', label: 'Casa, fai da te & hobby', icon: '🏡', color: 'bg-sky-500' },
                  ].map((cat) => {
                    const count = attivitaCommercio.filter((a) => a.categoria === cat.key).length;
                    const totalShops = attivitaCommercio.length;
                    const perc = totalShops > 0 ? Math.round((count / totalShops) * 100) : 0;

                    return (
                      <div key={cat.key} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-800 flex items-center gap-1.5">
                            <span className="text-sm">{cat.icon}</span>
                            <span>{cat.label}</span>
                          </span>
                          <span className="text-slate-600 font-mono">
                            <strong>{count}</strong> {count === 1 ? 'attività' : 'attività'} ({perc}%)
                          </span>
                        </div>

                        {/* Barra Visiva */}
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/80">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${cat.color}`}
                            style={{ width: `${Math.max(perc, count > 0 ? 5 : 0)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Barra Stacked Cumulativa */}
                {attivitaCommercio.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                      Composizione percentuale complessiva dell'offerta locale:
                    </span>
                    <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-slate-100 border border-slate-200/60">
                      {[
                        { key: 'alimentari', label: 'Alimentari', color: 'bg-emerald-500' },
                        { key: 'ristorazione', label: 'Ristorazione', color: 'bg-amber-500' },
                        { key: 'salute', label: 'Farmacie & salute', color: 'bg-rose-500' },
                        { key: 'artigiani', label: 'Artigiani', color: 'bg-purple-500' },
                        { key: 'servizi_persona', label: 'Servizi alla persona', color: 'bg-indigo-500' },
                        { key: 'servizi_animali', label: 'Servizi per animali', color: 'bg-teal-500' },
                        { key: 'casa', label: 'Casa, fai da te & hobby', color: 'bg-sky-500' },
                      ].map((cat) => {
                        const count = attivitaCommercio.filter((a) => a.categoria === cat.key).length;
                        const perc = (count / attivitaCommercio.length) * 100;
                        if (perc <= 0) return null;
                        return (
                          <div
                            key={cat.key}
                            className={`h-full ${cat.color}`}
                            style={{ width: `${perc}%` }}
                            title={`${cat.label}: ${count} (${Math.round(perc)}%)`}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Filtri rapidi stato */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <button
                  type="button"
                  onClick={() => setCommercioStatoFiltro('tutti')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    commercioStatoFiltro === 'tutti'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Tutti ({attivitaCommercio.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCommercioStatoFiltro('pending')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    commercioStatoFiltro === 'pending'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  <span>In Attesa di Approvazione</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-200 text-amber-900 font-black">
                    {attivitaCommercio.filter(a => a.statoApprovazione === 'in_attesa').length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setCommercioStatoFiltro('publish')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    commercioStatoFiltro === 'publish'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  <span>Pubblicati su App</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-200 text-emerald-900 font-black">
                    {attivitaCommercio.filter(a => a.statoApprovazione !== 'in_attesa').length}
                  </span>
                </button>
              </div>

              {/* Elenco Attività Commerciali */}
              <div className="space-y-3">
                {attivitaCommercio
                  .filter((shop) => {
                    if (commercioStatoFiltro === 'pending') return shop.statoApprovazione === 'in_attesa';
                    if (commercioStatoFiltro === 'publish') return shop.statoApprovazione !== 'in_attesa';
                    return true;
                  })
                  .length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6 space-y-2">
                    <Store className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-sm font-bold text-slate-700">Nessuna attività commerciale trovata</p>
                    <p className="text-xs text-slate-500">I commercianti possono inserire la propria attività direttamente dalla scheda dell'app.</p>
                  </div>
                ) : (
                  attivitaCommercio
                    .filter((shop) => {
                      if (commercioStatoFiltro === 'pending') return shop.statoApprovazione === 'in_attesa';
                      if (commercioStatoFiltro === 'publish') return shop.statoApprovazione !== 'in_attesa';
                      return true;
                    })
                    .map((shop) => {
                      const isPending = shop.statoApprovazione === 'in_attesa';
                      return (
                        <div
                          key={shop.id}
                          className={`bg-white rounded-2xl border p-4 shadow-xs transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                            isPending
                              ? 'border-amber-300 bg-amber-50/30'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start gap-3.5 flex-1 min-w-0">
                            {/* Foto o Logo JPG */}
                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 relative">
                              {shop.immagine || shop.logo ? (
                                <img
                                  src={shop.logo || shop.immagine}
                                  alt={shop.nome}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400 font-black text-xl">
                                  🏪
                                </div>
                              )}
                              {shop.logo && (
                                <span className="absolute bottom-0.5 right-0.5 px-1 rounded bg-black/70 text-[9px] text-white font-bold">
                                  JPG
                                </span>
                              )}
                            </div>

                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                                  {shop.nome}
                                </h4>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 capitalize border border-slate-200">
                                  {shop.categoria}
                                </span>
                                {isPending ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-amber-600" />
                                    <span>In Attesa di Approvazione</span>
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>Pubblicata ({shop.miPiace || 0} 👍)</span>
                                  </span>
                                )}
                              </div>

                              <p className="text-xs text-slate-600 flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span className="truncate">{shop.indirizzo}</span>
                              </p>

                              <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                                {shop.telefono && <span>📞 {shop.telefono}</span>}
                                {shop.whatsapp && (
                                  <a
                                    href={`https://wa.me/${shop.whatsapp}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-emerald-700 font-semibold hover:underline"
                                  >
                                    💬 WhatsApp ({shop.whatsapp})
                                  </a>
                                )}
                                {shop.nomeReferente && (
                                  <span className="text-slate-600">
                                    👤 Referente: <strong>{shop.nomeReferente}</strong>
                                    {shop.emailReferente ? ` (${shop.emailReferente})` : ''}
                                  </span>
                                )}
                              </div>

                              {shop.offertaAttiva && (
                                <div className="text-[11px] text-teal-800 bg-teal-50 rounded-lg px-2 py-1 border border-teal-200 mt-1 inline-flex items-center gap-1 font-medium">
                                  <Percent className="w-3 h-3 text-teal-600 stroke-[2.5]" />
                                  <span>Offerta %: <strong>{shop.offertaAttiva.titolo}</strong> - {shop.offertaAttiva.dettaglio}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Azioni amministratore */}
                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                            {isPending && onApprovaAttivita && (
                              <button
                                type="button"
                                onClick={() => onApprovaAttivita(shop.id)}
                                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Approva e Pubblica</span>
                              </button>
                            )}
                            {!isPending && (
                              <span className="text-xs text-emerald-700 font-semibold px-2.5 py-1 bg-emerald-50 rounded-lg border border-emerald-200">
                                Visibile su Mappa e App
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          )}

          {/* TAB: SHORTCODE WORDPRESS MAPPA & NEGOZI */}
          {activeTab === 'shortcodes' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Header Box */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                      Modulo WordPress v1.6.0
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      Zero API Key Obbligatoria (OpenStreetMap)
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                    <Code2 className="w-5 h-5 text-indigo-400" />
                    Shortcode WordPress: Mappa & Schede Negozi
                  </h3>
                  <p className="text-xs text-indigo-200 max-w-2xl leading-relaxed">
                    Incorpora la mappa interattiva dei commercianti e la vetrina con schede dettagliate in qualsiasi articolo, pagina o widget del sito WordPress. Supporta ricerca dal vivo, filtri categoria, Leaflet OpenStreetMap e Google Maps.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => downloadBlobFile('/vp-quartiere.zip', 'vp-quartiere.zip')}
                    className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Scarica Plugin v1.6.0</span>
                  </button>
                </div>
              </div>

              {/* Box 1: Esempi Rapidi Pronti da Copiare */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      Esempi Rapidi Pronti all'Uso (1-Click Copy)
                    </h4>
                    <p className="text-xs text-slate-500">
                      Clicca su un pulsante per copiare immediatamente il codice shortcode da incollare nelle tue pagine.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    {
                      titolo: 'Mappa Completa Standard',
                      desc: 'Mappa OpenStreetMap + ricerca + filtri + schede su 3 colonne',
                      code: '[vp_negozi_mappa]',
                      tag: 'Consigliato',
                      tagColor: 'bg-emerald-100 text-emerald-800',
                    },
                    {
                      titolo: 'Solo Mappa (No Schede)',
                      desc: 'Ideale per una sezione panoramica a piena larghezza con popup',
                      code: '[vp_negozi_mappa schede="no" altezza="500px"]',
                      tag: 'Panoramica',
                      tagColor: 'bg-blue-100 text-blue-800',
                    },
                    {
                      titolo: 'Con Google Maps',
                      desc: 'Usa le mappe Google ufficiali (con o senza API Key in admin)',
                      code: '[vp_negozi_mappa provider="google"]',
                      tag: 'Google Maps',
                      tagColor: 'bg-purple-100 text-purple-800',
                    },
                    {
                      titolo: 'Solo Pizzerie & Ristoranti',
                      desc: 'Filtra solo le attività di ristorazione su 2 colonne',
                      code: '[vp_negozi_mappa categoria="ristorazione" colonne="2"]',
                      tag: 'Tematico',
                      tagColor: 'bg-amber-100 text-amber-800',
                    },
                    {
                      titolo: 'Negozi con Offerte Residenti',
                      desc: 'Mostra solo le attività che offrono promozioni speciali',
                      code: '[vp_negozi_mappa offerte_solo="si" limite="6"]',
                      tag: 'Promozioni',
                      tagColor: 'bg-teal-100 text-teal-800',
                    },
                    {
                      titolo: 'Widget Compatto / Sidebar',
                      desc: 'Mappa compatta a 300px per colonne laterali del tema',
                      code: '[vp_negozi_mappa schede="no" ricerca="no" filtro_categoria="no" altezza="300px"]',
                      tag: 'Compatto',
                      tagColor: 'bg-slate-100 text-slate-800',
                    },
                  ].map((preset, idx) => {
                    const isCopied = copiedSnippet === preset.code;
                    return (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-300 transition flex flex-col justify-between gap-2.5"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-slate-900">{preset.titolo}</span>
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${preset.tagColor}`}>
                              {preset.tag}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-snug">{preset.desc}</p>
                        </div>

                        <div className="space-y-2 pt-1 border-t border-slate-200/60">
                          <div className="bg-slate-900 text-emerald-400 font-mono text-[11px] px-2.5 py-1.5 rounded-lg overflow-x-auto select-all">
                            {preset.code}
                          </div>
                          <button
                            type="button"
                            onClick={() => copyShortcodeText(preset.code)}
                            className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                              isCopied
                                ? 'bg-emerald-600 text-white'
                                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs'
                            }`}
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                            <span>{isCopied ? 'Copiato negli appunti!' : 'Copia Shortcode'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Box 2: Configuratore Interattivo Personalizzato */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-indigo-600" />
                      Configuratore Interattivo Shortcode
                    </h4>
                    <p className="text-xs text-slate-500">
                      Seleziona i parametri desiderati: lo shortcode viene generato in tempo reale pronto da copiare.
                    </p>
                  </div>

                  <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-200 self-start sm:self-auto">
                    Generatore Visuale
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {/* Provider */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      1. Motore Cartografico (provider):
                    </label>
                    <select
                      value={scProvider}
                      onChange={(e) => setScProvider(e.target.value as 'osm' | 'google')}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white font-medium"
                    >
                      <option value="osm">OpenStreetMap / Leaflet (Gratuito, Zero API Key)</option>
                      <option value="google">Google Maps (Usa la chiave del plugin o del parametro)</option>
                    </select>
                  </div>

                  {/* Categoria */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      2. Filtro Categoria (categoria):
                    </label>
                    <select
                      value={scCategoria}
                      onChange={(e) => setScCategoria(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white font-medium"
                    >
                      <option value="tutte">Tutte le Categorie (Nessun filtro iniziale)</option>
                      <option value="alimentari">Alimentari (Supermercati, Forni, Macellerie)</option>
                      <option value="ristorazione">Ristorazione (Pizzerie, Bar, Ristoranti)</option>
                      <option value="salute">Farmacie & Salute</option>
                      <option value="artigiani">Artigiani & Riparazioni</option>
                      <option value="servizi_persona">Servizi alla Persona (Parrucchieri, Estetica)</option>
                      <option value="servizi_animali">Servizi per Animali (Toelettatura, Veterinari)</option>
                      <option value="casa">Casa, Fai da te & Hobby</option>
                    </select>
                  </div>

                  {/* Mostra Schede */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      3. Mostra Schede Negozi (schede):
                    </label>
                    <select
                      value={scSchede}
                      onChange={(e) => setScSchede(e.target.value as 'si' | 'no')}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white font-medium"
                    >
                      <option value="si">Sì (Mappa in alto + Griglia schede sotto)</option>
                      <option value="no">No (Mostra unicamente la mappa con popup)</option>
                    </select>
                  </div>

                  {/* Ricerca dal Vivo */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      4. Ricerca Istantanea (ricerca):
                    </label>
                    <select
                      value={scRicerca}
                      onChange={(e) => setScRicerca(e.target.value as 'si' | 'no')}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white font-medium"
                    >
                      <option value="si">Sì (Input di ricerca testuale dal vivo)</option>
                      <option value="no">No (Disattiva barra di ricerca)</option>
                    </select>
                  </div>

                  {/* Filtro Categoria Dinamico */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      5. Pulsanti Filtro Categoria (filtro_categoria):
                    </label>
                    <select
                      value={scFiltroCat}
                      onChange={(e) => setScFiltroCat(e.target.value as 'si' | 'no')}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white font-medium"
                    >
                      <option value="si">Sì (Mostra i bottoni per filtrare categorie)</option>
                      <option value="no">No (Nascondi barra dei pulsanti)</option>
                    </select>
                  </div>

                  {/* Colonne Schede */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      6. Colonne Griglia (colonne):
                    </label>
                    <select
                      value={scColonne}
                      onChange={(e) => setScColonne(e.target.value as '1' | '2' | '3' | '4')}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white font-medium"
                    >
                      <option value="1">1 Colonna (Verticale)</option>
                      <option value="2">2 Colonne</option>
                      <option value="3">3 Colonne (Consigliato per desktop)</option>
                      <option value="4">4 Colonne (Compatto)</option>
                    </select>
                  </div>

                  {/* Altezza Mappa */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      7. Altezza Riquadro Mappa (altezza):
                    </label>
                    <select
                      value={scAltezza}
                      onChange={(e) => setScAltezza(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white font-medium"
                    >
                      <option value="320px">320px (Compatta)</option>
                      <option value="420px">420px (Standard consigliata)</option>
                      <option value="520px">520px (Media)</option>
                      <option value="650px">650px (Grande a pieno schermo)</option>
                      <option value="0">0 (Nessuna mappa, solo schede)</option>
                    </select>
                  </div>

                  {/* Offerte Solo */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      8. Solo con Offerte Attive (offerte_solo):
                    </label>
                    <select
                      value={scOfferteSolo}
                      onChange={(e) => setScOfferteSolo(e.target.value as 'si' | 'no')}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white font-medium"
                    >
                      <option value="no">No (Mostra tutti i negozi)</option>
                      <option value="si">Sì (Filtra solo attività con sconti residenti)</option>
                    </select>
                  </div>

                  {/* Limite Negozi */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      9. Limite Negozi Visibili (limite):
                    </label>
                    <select
                      value={scLimite}
                      onChange={(e) => setScLimite(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white font-medium"
                    >
                      <option value="-1">Tutti (-1)</option>
                      <option value="3">Massimo 3</option>
                      <option value="6">Massimo 6</option>
                      <option value="9">Massimo 9</option>
                      <option value="12">Massimo 12</option>
                    </select>
                  </div>
                </div>

                {/* Box Risultato del Configuratore */}
                <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Code2 className="w-4 h-4 text-emerald-400" />
                      Shortcode Generato Pronto da Incollare:
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Alias supportati: [vp_negozi_mappa], [vp_commercianti], [vp_negozi]
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-black/60 border border-slate-700/80 text-emerald-400 font-mono text-xs sm:text-sm font-bold break-all select-all">
                    {generateCurrentShortcode()}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
                    <p className="text-[11px] text-slate-400">
                      Incolla questa stringa in qualsiasi blocco Shortcode o campo testo di WordPress.
                    </p>
                    <button
                      type="button"
                      onClick={() => copyShortcodeText(generateCurrentShortcode())}
                      className={`py-2 px-5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer shadow-md ${
                        copiedSnippet === generateCurrentShortcode()
                          ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                          : 'bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white shadow-indigo-600/30'
                      }`}
                    >
                      {copiedSnippet === generateCurrentShortcode() ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Copiato negli Appunti!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copia Shortcode Configurato</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Box 3: Come usarlo con i Page Builder più diffusi */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-[#0073aa]" />
                  Come Inserirlo nei Principali Editor di WordPress:
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-600">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                      <span>🧱</span> WordPress Block Editor (Gutenberg)
                    </span>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Clicca sul <strong>+</strong> per aggiungere un blocco, cerca <strong>"Shortcode"</strong> (oppure "HTML personalizzato") e incolla il codice <code>[vp_negozi_mappa]</code>. Salva o pubblica la pagina.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                      <span>🎨</span> Elementor Page Builder
                    </span>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Nella colonna sinistra di Elementor, trascina il widget <strong>"Shortcode"</strong> all'interno della sezione desiderata, incolla il codice nell'apposito campo e clicca su "Aggiorna".
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                      <span>✨</span> Divi Theme & Builder
                    </span>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Aggiungi un modulo <strong>"Codice"</strong> o <strong>"Testo"</strong>, inserisci <code>[vp_negozi_mappa]</code> e conferma con la spunta verde.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                      <span>📝</span> Editor Classico / Widget Barra Laterale
                    </span>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Incolla direttamente lo shortcode all'interno del testo della pagina o in un widget di tipo <strong>"Testo"</strong> in <em>Aspetto &gt; Widget</em>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Box 4: Tabella Completa dei Parametri Disponibili */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      Tabella di Riferimento di Tutti i Parametri Supportati
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Tutti i parametri sono opzionali. Se omessi, il plugin applica i valori predefiniti indicati qui sotto.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Parametro</th>
                        <th className="py-2.5 px-3">Valore Default</th>
                        <th className="py-2.5 px-3">Valori Supportati</th>
                        <th className="py-2.5 px-3">Descrizione</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600">
                      <tr>
                        <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">provider</td>
                        <td className="py-2.5 px-3 font-mono text-slate-700">"osm"</td>
                        <td className="py-2.5 px-3 font-mono text-[11px]">"osm", "google"</td>
                        <td className="py-2.5 px-3">Sceglie OpenStreetMap (nessuna API key richiesta) o Google Maps.</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">categoria</td>
                        <td className="py-2.5 px-3 font-mono text-slate-700">"tutte"</td>
                        <td className="py-2.5 px-3 font-mono text-[11px]">"alimentari", "ristorazione", "salute", "artigiani", "servizi_persona", "servizi_animali", "casa"</td>
                        <td className="py-2.5 px-3">Filtra per mostrare solo i negozi della categoria selezionata.</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">schede</td>
                        <td className="py-2.5 px-3 font-mono text-slate-700">"si"</td>
                        <td className="py-2.5 px-3 font-mono text-[11px]">"si", "no"</td>
                        <td className="py-2.5 px-3">Mostra o nasconde la griglia con le schede dei negozi sotto alla mappa.</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">ricerca</td>
                        <td className="py-2.5 px-3 font-mono text-slate-700">"si"</td>
                        <td className="py-2.5 px-3 font-mono text-[11px]">"si", "no"</td>
                        <td className="py-2.5 px-3">Abilita o disabilita il campo di ricerca testuale dal vivo.</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">filtro_categoria</td>
                        <td className="py-2.5 px-3 font-mono text-slate-700">"si"</td>
                        <td className="py-2.5 px-3 font-mono text-[11px]">"si", "no"</td>
                        <td className="py-2.5 px-3">Mostra o nasconde i pulsanti di filtraggio rapido per categoria.</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">colonne</td>
                        <td className="py-2.5 px-3 font-mono text-slate-700">"3"</td>
                        <td className="py-2.5 px-3 font-mono text-[11px]">"1", "2", "3", "4"</td>
                        <td className="py-2.5 px-3">Numero di colonne per la griglia delle schede su schermi desktop.</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">altezza</td>
                        <td className="py-2.5 px-3 font-mono text-slate-700">"420px"</td>
                        <td className="py-2.5 px-3 font-mono text-[11px]">Es. "350px", "500px", "0"</td>
                        <td className="py-2.5 px-3">Altezza CSS della mappa. Con "0" nasconde la mappa mostrando solo le schede.</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">offerte_solo</td>
                        <td className="py-2.5 px-3 font-mono text-slate-700">"no"</td>
                        <td className="py-2.5 px-3 font-mono text-[11px]">"si", "no"</td>
                        <td className="py-2.5 px-3">Se "si", mostra unicamente i negozi che hanno un'offerta attiva per i residenti.</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">limite</td>
                        <td className="py-2.5 px-3 font-mono text-slate-700">"-1"</td>
                        <td className="py-2.5 px-3 font-mono text-[11px]">"-1" (tutti) o numero positivo</td>
                        <td className="py-2.5 px-3">Numero massimo di negozi caricati dalla query.</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">zoom</td>
                        <td className="py-2.5 px-3 font-mono text-slate-700">"14"</td>
                        <td className="py-2.5 px-3 font-mono text-[11px]">Da 10 a 19</td>
                        <td className="py-2.5 px-3">Livello iniziale di zoom della mappa (14 inquadra l'intero quartiere).</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">google_api_key</td>
                        <td className="py-2.5 px-3 font-mono text-slate-700">""</td>
                        <td className="py-2.5 px-3 font-mono text-[11px]">Stringa chiave Google Maps</td>
                        <td className="py-2.5 px-3">Chiave specifica per pagina; sovrascrive quella salvata nelle impostazioni plugin.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GESTIONE EVENTI */}
          {activeTab === 'eventi' && (
            <div className="space-y-4 animate-fadeIn">
              <TabActiveToggleButton
                feature="eventi"
                title="Eventi del Quartiere"
                tabsConfig={tabsConfig}
                onToggleTab={onToggleTab}
                description="Gestisce la visibilità del calendario eventi e iscrizioni per gli utenti dell'app."
              />

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
                        URL Locandina / Immagine in evidenza (Opzionale):
                      </label>
                      <input
                        type="url"
                        value={newEvent.locandina || ''}
                        onChange={(e) =>
                          setNewEvent({
                            ...newEvent,
                            locandina: e.target.value,
                            featured_media_url: e.target.value,
                          })
                        }
                        placeholder="https://.../locandina.jpg (caricata nella Libreria Media WordPress)"
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                      />
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Nell'App verrà mostrato il pulsante <strong>"Vedi locandina"</strong> con visualizzazione a schermo intero (Lightbox).
                      </p>
                    </div>

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
              <TabActiveToggleButton
                feature="segnalazioni"
                title="Segnalazioni Cittadine"
                tabsConfig={tabsConfig}
                onToggleTab={onToggleTab}
                description="Permette ai cittadini di inviare segnalazioni geolocalizzate con foto dal quartiere."
              />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    Gestione & Moderazione Segnalazioni Territoriali
                  </h3>
                  <p className="text-xs text-slate-500">
                    Esamina, approva o rifiuta le segnalazioni inviate dai residenti. In caso di rifiuto, l'utente riceverà una notifica con la tua motivazione.
                  </p>
                </div>

                {/* Filtri Stato Moderazione */}
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl shrink-0 self-start sm:self-center">
                  {(['tutti', 'in_attesa', 'approvata', 'rifiutata'] as const).map((f) => {
                    const count = segnalazioni.filter((s) => {
                      if (f === 'tutti') return true;
                      const st = s.statoApprovazione || 'approvata';
                      return st === f;
                    }).length;
                    const labels = {
                      tutti: 'Tutte',
                      in_attesa: 'In Attesa',
                      approvata: 'Approvate',
                      rifiutata: 'Rifiutate',
                    };
                    return (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setSegnalazioniStatoFiltro(f)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1 ${
                          segnalazioniStatoFiltro === f
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <span>{labels[f]}</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tabella di Amministrazione Segnalazioni con Colonna Azioni */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        <th className="py-3 px-4">Segnalazione & Foto</th>
                        <th className="py-3 px-4">Luogo & Cittadino</th>
                        <th className="py-3 px-4">Stato Moderazione</th>
                        <th className="py-3 px-4">Avanzamento</th>
                        <th className="py-3 px-4 text-right">Azioni</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {segnalazioni
                        .filter((seg) => {
                          if (segnalazioniStatoFiltro === 'tutti') return true;
                          const st = seg.statoApprovazione || 'approvata';
                          return st === segnalazioniStatoFiltro;
                        })
                        .map((seg) => {
                          const stMod = seg.statoApprovazione || 'approvata';
                          const isPending = stMod === 'in_attesa';
                          const isRejected = stMod === 'rifiutata';
                          const isApproved = stMod === 'approvata';

                          return (
                            <tr
                              key={seg.id}
                              className={`transition-colors ${
                                isPending
                                  ? 'bg-amber-50/40 hover:bg-amber-50/70'
                                  : isRejected
                                  ? 'bg-rose-50/30 hover:bg-rose-50/50'
                                  : 'hover:bg-slate-50/80'
                              }`}
                            >
                              {/* Colonna 1: Segnalazione & Foto */}
                              <td className="py-3.5 px-4 align-top">
                                <div className="flex items-start gap-3 min-w-[200px]">
                                  {seg.ph && seg.ph[0] ? (
                                    <img
                                      src={seg.ph[0]}
                                      alt={seg.t}
                                      className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200 shadow-2xs"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                                      <Eye className="w-5 h-5" />
                                    </div>
                                  )}
                                  <div className="space-y-0.5">
                                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug">{seg.t}</h4>
                                    {seg.desc && (
                                      <p className="text-[11px] text-slate-600 line-clamp-2">{seg.desc}</p>
                                    )}
                                    {isRejected && seg.motivazioneRifiuto && (
                                      <div className="p-2 rounded-lg bg-rose-100/80 border border-rose-200 text-rose-900 text-[11px] mt-1">
                                        <strong>Motivazione Rifiuto:</strong> "{seg.motivazioneRifiuto}"
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* Colonna 2: Luogo & Cittadino */}
                              <td className="py-3.5 px-4 align-top shrink-0 min-w-[150px]">
                                <div className="space-y-1">
                                  <p className="text-[11px] font-medium text-slate-700 flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                    <span>{seg.w}</span>
                                  </p>
                                  <p className="text-[10px] text-slate-500">
                                    Data: <strong>{seg.data}</strong>
                                  </p>
                                  {seg.cittadinoNome && (
                                    <p className="text-[10px] text-slate-500">
                                      Da: <strong>{seg.cittadinoNome}</strong> {seg.cittadinoTel ? `(${seg.cittadinoTel})` : ''}
                                    </p>
                                  )}
                                </div>
                              </td>

                              {/* Colonna 3: Stato Moderazione */}
                              <td className="py-3.5 px-4 align-top whitespace-nowrap">
                                {isPending && (
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-amber-600" />
                                    <span>In Attesa di Moderazione</span>
                                  </span>
                                )}
                                {isApproved && (
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>Approvata e Pubblicata</span>
                                  </span>
                                )}
                                {isRejected && (
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300 inline-flex items-center gap-1">
                                    <X className="w-3 h-3 text-rose-600 stroke-[3]" />
                                    <span>Rifiutata</span>
                                  </span>
                                )}
                              </td>

                              {/* Colonna 4: Avanzamento Risoluzione */}
                              <td className="py-3.5 px-4 align-top whitespace-nowrap">
                                <select
                                  value={seg.s}
                                  onChange={(e) => {
                                    const newStato = Number(e.target.value) as StatoSegnalazione;
                                    if (onUpdateSegnalazioneStato) {
                                      onUpdateSegnalazioneStato(seg.id, newStato);
                                      loadInsights();
                                    }
                                  }}
                                  className={`px-2.5 py-1 text-[11px] font-bold rounded-xl border transition cursor-pointer ${
                                    seg.s === 3
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                      : seg.s === 2
                                      ? 'bg-blue-50 text-blue-800 border-blue-300'
                                      : 'bg-amber-50 text-amber-800 border-amber-300'
                                  }`}
                                >
                                  <option value={1}>🟡 Ricevuta</option>
                                  <option value={2}>🔵 Inoltrata Municipio VI</option>
                                  <option value={3}>🟢 Risolta</option>
                                </select>
                              </td>

                              {/* Colonna 5: Azioni */}
                              <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* Bottone Approva */}
                                  {!isApproved && onUpdateSegnalazioneModerazione && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onUpdateSegnalazioneModerazione(seg.id, 'approvata');
                                        loadInsights();
                                      }}
                                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-2xs transition inline-flex items-center gap-1 cursor-pointer"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>Approva</span>
                                    </button>
                                  )}

                                  {/* Bottone Rifiuta */}
                                  {!isRejected && onUpdateSegnalazioneModerazione && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setRejectionModalItem({
                                          type: 'segnalazione',
                                          id: seg.id,
                                          titolo: seg.t,
                                        });
                                        setRejectionReasonInput('');
                                        setRejectionError(null);
                                      }}
                                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-2xs transition inline-flex items-center gap-1 cursor-pointer"
                                    >
                                      <X className="w-3.5 h-3.5 stroke-[2.5]" />
                                      <span>Rifiuta</span>
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: VOLONTARIATO ("Serve una mano") */}
          {activeTab === 'volontari' && (
            <div className="space-y-4 animate-fadeIn">
              <TabActiveToggleButton
                feature="volontariato"
                title="Volontariato Civico"
                tabsConfig={tabsConfig}
                onToggleTab={onToggleTab}
                description="Mostra le iniziative civiche 'Serve una mano' e l'iscrizione all'albo volontari."
              />

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

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        URL Locandina / Immagine Attività (Opzionale):
                      </label>
                      <input
                        type="url"
                        value={newRichiesta.locandina || ''}
                        onChange={(e) =>
                          setNewRichiesta({
                            ...newRichiesta,
                            locandina: e.target.value,
                            featured_media_url: e.target.value,
                          })
                        }
                        placeholder="https://.../volontariato.jpg (caricata nella Libreria Media WordPress)"
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                      />
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Nell'App verrà mostrato il pulsante <strong>"Vedi locandina"</strong> con apertura della foto ingrandita a schermo intero (Lightbox).
                      </p>
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
          {/* TAB 5: PROPOSTE CITTADINI */}
          {activeTab === 'proposte' && (
            <div className="space-y-4 animate-fadeIn">
              <TabActiveToggleButton
                feature="proposte"
                title="Idee & Proposte"
                tabsConfig={tabsConfig}
                onToggleTab={onToggleTab}
                description="Consente ai residenti di proporre idee per il quartiere e votare le proposte comunitarie."
              />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-amber-500" />
                    Idee & Proposte Avanzate dai Residenti
                  </h3>
                  <p className="text-xs text-slate-500">
                    Esamina e modera le idee e proposte civiche dei residenti con conteggio voti e stato approvazione.
                  </p>
                </div>

                {/* Filtri Stato Moderazione Proposte */}
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl shrink-0 self-start sm:self-center">
                  {(['tutti', 'in_attesa', 'approvata', 'rifiutata'] as const).map((f) => {
                    const count = proposte.filter((p) => {
                      if (f === 'tutti') return true;
                      const st = p.statoApprovazione || 'approvata';
                      return st === f;
                    }).length;
                    const labels = {
                      tutti: 'Tutte',
                      in_attesa: 'In Attesa',
                      approvata: 'Approvate',
                      rifiutata: 'Rifiutate',
                    };
                    return (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setProposteStatoFiltro(f)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1 ${
                          proposteStatoFiltro === f
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <span>{labels[f]}</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tabella di Amministrazione Proposte con Colonna Azioni */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        <th className="py-3 px-4"># Posizione & Titolo Proposta</th>
                        <th className="py-3 px-4">Proponente & Data</th>
                        <th className="py-3 px-4">Voti Community</th>
                        <th className="py-3 px-4">Stato Moderazione</th>
                        <th className="py-3 px-4 text-right">Azioni</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {[...proposte]
                        .filter((p) => {
                          if (proposteStatoFiltro === 'tutti') return true;
                          const st = p.statoApprovazione || 'approvata';
                          return st === proposteStatoFiltro;
                        })
                        .sort((a, b) => b.v - a.v)
                        .map((p, idx) => {
                          const stMod = p.statoApprovazione || 'approvata';
                          const isPending = stMod === 'in_attesa';
                          const isRejected = stMod === 'rifiutata';
                          const isApproved = stMod === 'approvata';

                          return (
                            <tr
                              key={p.id}
                              className={`transition-colors ${
                                isPending
                                  ? 'bg-amber-50/40 hover:bg-amber-50/70'
                                  : isRejected
                                  ? 'bg-rose-50/30 hover:bg-rose-50/50'
                                  : 'hover:bg-slate-50/80'
                              }`}
                            >
                              {/* Colonna 1: # Posizione & Titolo Proposta */}
                              <td className="py-3.5 px-4 align-top">
                                <div className="space-y-1 min-w-[200px]">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                      #{idx + 1}
                                    </span>
                                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug">{p.t}</h4>
                                  </div>
                                  {isRejected && p.motivazioneRifiuto && (
                                    <div className="p-2 rounded-lg bg-rose-100/80 border border-rose-200 text-rose-900 text-[11px] mt-1">
                                      <strong>Motivazione Rifiuto:</strong> "{p.motivazioneRifiuto}"
                                    </div>
                                  )}
                                </div>
                              </td>

                              {/* Colonna 2: Proponente & Data */}
                              <td className="py-3.5 px-4 align-top shrink-0 min-w-[140px]">
                                <div className="space-y-0.5">
                                  <p className="text-[11px] font-medium text-slate-700">
                                    {p.cittadinoNome ? <strong>{p.cittadinoNome}</strong> : <span className="text-slate-400">Anonimo</span>}
                                  </p>
                                  <p className="text-[10px] text-slate-400">
                                    ID #{p.id} {p.data ? `• ${p.data}` : ''}
                                  </p>
                                </div>
                              </td>

                              {/* Colonna 3: Voti Community */}
                              <td className="py-3.5 px-4 align-top whitespace-nowrap">
                                <span className="px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold inline-flex items-center gap-1">
                                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                                  {p.v} voti
                                </span>
                              </td>

                              {/* Colonna 4: Stato Moderazione */}
                              <td className="py-3.5 px-4 align-top whitespace-nowrap">
                                {isPending && (
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-amber-600" />
                                    <span>In Attesa di Approvazione</span>
                                  </span>
                                )}
                                {isApproved && (
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>Approvata</span>
                                  </span>
                                )}
                                {isRejected && (
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300 inline-flex items-center gap-1">
                                    <X className="w-3 h-3 text-rose-600 stroke-[3]" />
                                    <span>Rifiutata</span>
                                  </span>
                                )}
                              </td>

                              {/* Colonna 5: Azioni */}
                              <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* Bottone Approva */}
                                  {!isApproved && onUpdatePropostaModerazione && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onUpdatePropostaModerazione(p.id, 'approvata');
                                        loadInsights();
                                      }}
                                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-2xs transition inline-flex items-center gap-1 cursor-pointer"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>Approva</span>
                                    </button>
                                  )}

                                  {/* Bottone Rifiuta */}
                                  {!isRejected && onUpdatePropostaModerazione && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setRejectionModalItem({
                                          type: 'proposta',
                                          id: p.id,
                                          titolo: p.t,
                                        });
                                        setRejectionReasonInput('');
                                        setRejectionError(null);
                                      }}
                                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-2xs transition inline-flex items-center gap-1 cursor-pointer"
                                    >
                                      <X className="w-3.5 h-3.5 stroke-[2.5]" />
                                      <span>Rifiuta</span>
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: CONFIGURAZIONE & PLUGIN ZIP */}
          {activeTab === 'config' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Notifiche Email Attive ad associazione@villaggioprenestino.it */}
              <div className="p-4 rounded-2xl bg-teal-50 border-2 border-teal-300 text-teal-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-teal-900 flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-teal-600" />
                      Notifiche Email Automatiche Attive
                    </h4>
                  </div>
                  <p className="text-xs text-teal-900 leading-relaxed max-w-xl">
                    Ogni qualvolta viene inserita una <strong>nuova segnalazione</strong> o una <strong>nuova attività commerciale</strong>, viene recapitata automaticamente un'email di avviso a <strong>associazione@villaggioprenestino.it</strong> con tutti i dettagli e il link diretto alla moderazione.
                  </p>
                </div>
                <div className="shrink-0 bg-white/95 border border-teal-200 rounded-xl px-3 py-2 text-center text-xs font-bold text-teal-800 shadow-2xs">
                  <span>Destinatario:</span>
                  <div className="font-mono text-[11px] text-teal-950">associazione@villaggioprenestino.it</div>
                </div>
              </div>

              {/* Box Download ZIP */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-amber-50/50 border-2 border-emerald-300 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white uppercase tracking-wider mb-1.5">
                    Versione 1.6.0: Shortcode Mappa [vp_negozi_mappa] & Notifiche
                  </span>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    Scarica il Plugin WordPress: <code className="text-emerald-800">vp-quartiere.zip</code>
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 max-w-md">
                    Include il nuovo shortcode <code>[vp_negozi_mappa]</code> con supporto OpenStreetMap e Google Maps, schede responsive, ricerca live, filtri di categoria, più il modulo di moderazione e le notifiche email.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => downloadBlobFile('/vp-quartiere.zip', 'vp-quartiere.zip')}
                    className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-700/20 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Scarica ZIP (v1.6.0)</span>
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

        {/* Modale Pop-Up Motivazione Rifiuto Admin (Obbligatoria) */}
        {rejectionModalItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-rose-200 space-y-4">
              <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-2xl bg-rose-100 text-rose-700 border border-rose-200">
                    <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                      Campo Obbligatorio
                    </span>
                    <h4 className="font-black text-slate-900 text-base leading-tight mt-0.5">
                      Motivazione Rifiuto
                    </h4>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setRejectionModalItem(null);
                    setRejectionError(null);
                  }}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Stai rifiutando la {rejectionModalItem.type === 'segnalazione' ? 'segnalazione' : rejectionModalItem.type === 'proposta' ? 'proposta' : 'attività'}:
                  <strong className="block text-slate-900 font-bold mt-0.5 text-xs sm:text-sm bg-slate-50 p-2 rounded-xl border border-slate-200">
                    "{rejectionModalItem.titolo}"
                  </strong>
                </p>
                <p className="text-[11px] text-slate-500 italic">
                  Per procedere con il rifiuto è <strong>obbligatorio</strong> specificare una motivazione. Il testo inserito verrà salvato e recapitato direttamente al cittadino via notifica e pop-up all'avvio dell'app.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                  <span>Motivazione del Rifiuto <span className="text-rose-600 font-black">*</span></span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {rejectionReasonInput.length} caratteri
                  </span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={rejectionReasonInput}
                  onChange={(e) => {
                    setRejectionReasonInput(e.target.value);
                    if (rejectionError) setRejectionError(null);
                  }}
                  placeholder="Scrivi qui la motivazione dettagliata (es. 'La proposta riguarda un'area privata non di competenza comunale' oppure 'Segnalazione già presa in carico dal Dipartimento Lavori Pubblici')..."
                  className={`w-full px-3.5 py-2.5 text-xs bg-slate-50 border rounded-2xl text-slate-900 focus:outline-none focus:ring-2 transition ${
                    rejectionError
                      ? 'border-rose-500 focus:ring-rose-500 bg-rose-50/50'
                      : 'border-slate-300 focus:ring-rose-500 focus:bg-white'
                  }`}
                />
                {rejectionError && (
                  <p className="text-[11px] font-bold text-rose-600 mt-1.5 flex items-center gap-1 animate-fadeIn">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {rejectionError}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setRejectionModalItem(null);
                    setRejectionError(null);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const cleanReason = rejectionReasonInput.trim();
                    if (!cleanReason) {
                      setRejectionError('La motivazione del rifiuto è obbligatoria. Inserisci un testo per inviare la notifica.');
                      return;
                    }

                    if (rejectionModalItem.type === 'segnalazione' && onUpdateSegnalazioneModerazione) {
                      onUpdateSegnalazioneModerazione(
                        rejectionModalItem.id,
                        'rifiutata',
                        cleanReason
                      );
                    } else if (rejectionModalItem.type === 'proposta' && onUpdatePropostaModerazione) {
                      onUpdatePropostaModerazione(
                        rejectionModalItem.id,
                        'rifiutata',
                        cleanReason
                      );
                    }

                    setRejectionModalItem(null);
                    setRejectionReasonInput('');
                    setRejectionError(null);
                    if (typeof loadInsights === 'function') loadInsights();
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer shadow-md shadow-rose-600/25 transition flex items-center gap-1.5"
                >
                  <X className="w-4 h-4 stroke-[3]" />
                  <span>Conferma Rifiuto e Invia Notifica</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Plugin WordPress VP Quartiere v1.6.0</span>
            <span className="text-slate-300">•</span>
            <span>Associazione di Quartiere Villaggio Prenestino</span>
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
