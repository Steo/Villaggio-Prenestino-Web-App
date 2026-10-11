import {
  WpArticle,
  EventoQuartiere,
  RichiestaVolontariato,
  SegnalazioneCittadina,
  PropostaCittadina,
  CandidaturaVolontario,
  UserInteractions,
  WpPluginConfig,
  StatoSegnalazione,
} from '../types';
import {
  INITIAL_NEWS,
  INITIAL_EVENTI,
  INITIAL_RICHIESTE,
  INITIAL_SEGNALAZIONI,
  INITIAL_PROPOSTE,
} from '../data/mockData';

const CONFIG_KEY = 'vp_config_v1';
const INTERACTIONS_KEY = 'vp_interactions_v1';
const LOCAL_STORE_KEY = 'vp_local_store_v1';

export const DEFAULT_CONFIG: WpPluginConfig = {
  baseUrl: 'https://www.villaggioprenestino.it',
  apiKey: 'vpq_app_secure_key_2026',
  useLiveApi: false, // Default to interactive offline/hybrid mode, easy to toggle
};

// Generatore token univoco per-device anonimo
function getOrCreateToken(): string {
  let token = localStorage.getItem('vp_device_token');
  if (!token) {
    token = 'vp_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now().toString(36);
    localStorage.setItem('vp_device_token', token);
  }
  return token;
}

export function getUserInteractions(): UserInteractions {
  try {
    const raw = localStorage.getItem(INTERACTIONS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error loading interactions', e);
  }
  return {
    eventiPartecipati: [],
    richiesteAderite: [],
    proposteVotate: [],
    puntiCivici: 15, // Punti di benvenuto
    token: getOrCreateToken(),
  };
}

export function saveUserInteractions(data: UserInteractions): void {
  try {
    localStorage.setItem(INTERACTIONS_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving interactions', e);
  }
}

export function getWpConfig(): WpPluginConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Error loading config', e);
  }
  return DEFAULT_CONFIG;
}

export function saveWpConfig(cfg: WpPluginConfig): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
}

// Store locale sincronizzato per mantenere le aggiunte dell'utente
interface LocalDataStore {
  eventi: EventoQuartiere[];
  richieste: RichiestaVolontariato[];
  segnalazioni: SegnalazioneCittadina[];
  proposte: PropostaCittadina[];
  news: WpArticle[];
}

function getLocalDataStore(): LocalDataStore {
  try {
    const raw = localStorage.getItem(LOCAL_STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Sincronizza INITIAL_EVENTI per includere nuovi eventi in programma ed eventi passati
      if (parsed.eventi) {
        const storedIds = new Set(parsed.eventi.map((e: any) => e.id));
        const missing = INITIAL_EVENTI.filter((e) => !storedIds.has(e.id));
        if (missing.length > 0) {
          parsed.eventi = [...parsed.eventi, ...missing];
          localStorage.setItem(LOCAL_STORE_KEY, JSON.stringify(parsed));
        }
      }
      return parsed;
    }
  } catch (e) {
    console.error('Error loading local store', e);
  }
  return {
    eventi: INITIAL_EVENTI,
    richieste: INITIAL_RICHIESTE,
    segnalazioni: INITIAL_SEGNALAZIONI,
    proposte: INITIAL_PROPOSTE,
    news: INITIAL_NEWS,
  };
}

function saveLocalDataStore(store: LocalDataStore): void {
  localStorage.setItem(LOCAL_STORE_KEY, JSON.stringify(store));
}

/**
 * Fetch Dati: prova prima le API WordPress reali, altrimenti usa il local store aggiornato
 */
export async function fetchAllData(): Promise<{
  eventi: EventoQuartiere[];
  richieste: RichiestaVolontariato[];
  segnalazioni: SegnalazioneCittadina[];
  proposte: PropostaCittadina[];
  news: WpArticle[];
  isLive: boolean;
}> {
  const cfg = getWpConfig();
  const localStore = getLocalDataStore();

  if (cfg.useLiveApi && cfg.baseUrl) {
    try {
      const cleanBase = cfg.baseUrl.replace(/\/+$/, '');
      const resp = await fetch(`${cleanBase}/wp-json/vp/v1/dati`, {
        headers: {
          'X-VP-Key': cfg.apiKey,
          'X-VP-Token': getOrCreateToken(),
        },
      });

      if (resp.ok) {
        const json = await resp.json();
        if (json.success) {
          return {
            eventi: json.eventi?.length ? json.eventi : localStore.eventi,
            richieste: json.richieste?.length ? json.richieste : localStore.richieste,
            segnalazioni: json.segnalazioni?.length ? json.segnalazioni : localStore.segnalazioni,
            proposte: json.proposte?.length ? json.proposte : localStore.proposte,
            news: json.news?.length ? json.news : localStore.news,
            isLive: true,
          };
        }
      }
    } catch (err) {
      console.warn('Connessione alle WP REST API non riuscita, uso dati di fallback/locali:', err);
    }
  }

  // Fallback: prova comunque a caricare le ultime news reali tramite WP REST API pubblica standard
  try {
    const cleanBase = cfg.baseUrl.replace(/\/+$/, '');
    const newsResp = await fetch(`${cleanBase}/wp-json/wp/v2/posts?per_page=3&_embed`, {
      headers: { 'Accept': 'application/json' },
    });
    if (newsResp.ok) {
      const wpPosts = await newsResp.json();
      if (Array.isArray(wpPosts) && wpPosts.length > 0) {
        const parsedNews: WpArticle[] = wpPosts.map((p: any) => {
          let img = 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=700&q=80';
          if (p._embedded && p._embedded['wp:featuredmedia'] && p._embedded['wp:featuredmedia'][0]) {
            img = p._embedded['wp:featuredmedia'][0].source_url || img;
          }
          return {
            id: p.id,
            titolo: p.title?.rendered ? decodeHtmlEntities(p.title.rendered) : 'Notizia dal quartiere',
            estratto: p.excerpt?.rendered ? stripTags(p.excerpt.rendered) : '',
            data: new Date(p.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }),
            link: p.link || 'https://www.villaggioprenestino.it',
            img,
            autore: 'Associazione Villaggio Prenestino',
          };
        });
        localStore.news = parsedNews;
        saveLocalDataStore(localStore);
      }
    }
  } catch (e) {
    // Silenzioso: continua con localStore
  }

  return {
    ...localStore,
    isLive: false,
  };
}

function decodeHtmlEntities(str: string): string {
  const txt = document.createElement('textarea');
  txt.innerHTML = str;
  return txt.value;
}

function stripTags(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

/**
 * Registra o annulla interazione (Adesione evento, Volontariato "Ci sono", Like proposta)
 */
export async function submitInteraction(params: {
  tipo: 'evento_vengo' | 'cisono' | 'proposta_vota';
  postId: number;
  nome?: string;
  telefono?: string;
  annulla?: boolean;
}): Promise<{ success: boolean; newCount?: number }> {
  const cfg = getWpConfig();
  const token = getOrCreateToken();

  // 1. Aggiorna lo store locale immediatamente (UI reattiva)
  const store = getLocalDataStore();
  let countResult = 0;

  if (params.tipo === 'evento_vengo') {
    const ev = store.eventi.find((e) => e.id === params.postId);
    if (ev) {
      if (params.annulla) {
        ev.n = Math.max(0, ev.n - 1);
      } else {
        ev.n += 1;
      }
      countResult = ev.n;
    }
  } else if (params.tipo === 'cisono') {
    const r = store.richieste.find((rq) => rq.id === params.postId);
    if (r) {
      if (params.annulla) {
        r.have = Math.max(0, r.have - 1);
      } else {
        r.have += 1;
      }
      countResult = r.have;
    }
  } else if (params.tipo === 'proposta_vota') {
    const p = store.proposte.find((pr) => pr.id === params.postId);
    if (p) {
      if (params.annulla) {
        p.v = Math.max(0, p.v - 1);
      } else {
        p.v += 1;
      }
      countResult = p.v;
    }
  }
  saveLocalDataStore(store);

  // 2. Se connesso alle API live, invia la richiesta al server WordPress
  if (cfg.useLiveApi && cfg.baseUrl) {
    try {
      const cleanBase = cfg.baseUrl.replace(/\/+$/, '');
      const resp = await fetch(`${cleanBase}/wp-json/vp/v1/interazione`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-VP-Key': cfg.apiKey,
          'X-VP-Token': token,
        },
        body: JSON.stringify({
          tipo: params.tipo,
          id: params.postId,
          token,
          nome: params.nome || '',
          telefono: params.telefono || '',
          annulla: params.annulla || false,
        }),
      });

      if (resp.ok) {
        const json = await resp.json();
        if (json.conteggio !== undefined) {
          countResult = json.conteggio;
        }
      }
    } catch (e) {
      console.warn('Invio live fallito, mantenuto stato locale:', e);
    }
  }

  return { success: true, newCount: countResult };
}

/**
 * Invia nuova segnalazione con foto
 */
export async function submitSegnalazione(data: {
  titolo: string;
  luogo: string;
  descrizione: string;
  foto: string[]; // base64
  nome?: string;
  telefono?: string;
}): Promise<{ success: boolean; newId: number }> {
  const cfg = getWpConfig();
  const token = getOrCreateToken();
  const store = getLocalDataStore();

  const newId = Date.now();
  const newSegnalazione: SegnalazioneCittadina = {
    id: newId,
    t: data.titolo,
    w: data.luogo,
    desc: data.descrizione,
    s: 1, // Ricevuta
    ph: data.foto,
    data: new Date().toLocaleDateString('it-IT'),
    cittadinoNome: data.nome,
    cittadinoTel: data.telefono,
  };

  store.segnalazioni.unshift(newSegnalazione);
  saveLocalDataStore(store);

  if (cfg.useLiveApi && cfg.baseUrl) {
    try {
      const cleanBase = cfg.baseUrl.replace(/\/+$/, '');
      await fetch(`${cleanBase}/wp-json/vp/v1/segnalazione`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-VP-Key': cfg.apiKey,
          'X-VP-Token': token,
        },
        body: JSON.stringify({
          titolo: data.titolo,
          luogo: data.luogo,
          descrizione: data.descrizione,
          nome: data.nome || '',
          telefono: data.telefono || '',
          foto: data.foto,
        }),
      });
    } catch (e) {
      console.warn('Salvataggio segnalazione su WP fallito, salvata localmente:', e);
    }
  }

  return { success: true, newId };
}

/**
 * Invia candidatura volontario (Partecipa)
 */
export async function submitCandidaturaVolontario(data: CandidaturaVolontario): Promise<{ success: boolean }> {
  const cfg = getWpConfig();
  const token = getOrCreateToken();

  if (cfg.useLiveApi && cfg.baseUrl) {
    try {
      const cleanBase = cfg.baseUrl.replace(/\/+$/, '');
      const resp = await fetch(`${cleanBase}/wp-json/vp/v1/volontario`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-VP-Key': cfg.apiKey,
          'X-VP-Token': token,
        },
        body: JSON.stringify(data),
      });
      if (resp.ok) return { success: true };
    } catch (e) {
      console.warn('Invio volontario a WP fallito:', e);
    }
  }

  return { success: true };
}

/**
 * Invia nuova proposta
 */
export async function submitProposta(titolo: string): Promise<{ success: boolean; newId: number }> {
  const cfg = getWpConfig();
  const token = getOrCreateToken();
  const store = getLocalDataStore();

  const newId = Date.now();
  store.proposte.unshift({
    id: newId,
    t: titolo,
    v: 1, // Voto iniziale di chi propone
  });
  saveLocalDataStore(store);

  if (cfg.useLiveApi && cfg.baseUrl) {
    try {
      const cleanBase = cfg.baseUrl.replace(/\/+$/, '');
      await fetch(`${cleanBase}/wp-json/vp/v1/proposta`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-VP-Key': cfg.apiKey,
          'X-VP-Token': token,
        },
        body: JSON.stringify({ titolo }),
      });
    } catch (e) {
      console.warn('Invio proposta su WP fallito, salvata localmente:', e);
    }
  }

  return { success: true, newId };
}

/**
 * Funzioni amministrative simulate / live per il pannello WordPress
 */
export async function adminCreateEvento(
  eventoData: Omit<EventoQuartiere, 'id'>
): Promise<EventoQuartiere> {
  const store = getLocalDataStore();
  const newId = Date.now();
  const nuovoEvento: EventoQuartiere = {
    ...eventoData,
    id: newId,
    n: 0,
  };
  store.eventi.unshift(nuovoEvento);
  saveLocalDataStore(store);
  return nuovoEvento;
}

export async function adminUpdateSegnalazioneStato(
  id: number,
  nuovoStato: StatoSegnalazione
): Promise<boolean> {
  const store = getLocalDataStore();
  const seg = store.segnalazioni.find((s) => s.id === id);
  if (seg) {
    seg.s = nuovoStato;
    saveLocalDataStore(store);
    return true;
  }
  return false;
}

export async function adminCreateRichiesta(
  richiestaData: Omit<RichiestaVolontariato, 'id' | 'have'>
): Promise<RichiestaVolontariato> {
  const store = getLocalDataStore();
  const newId = Date.now();
  const nuovaRichiesta: RichiestaVolontariato = {
    ...richiestaData,
    id: newId,
    have: 0,
  };
  store.richieste.unshift(nuovaRichiesta);
  saveLocalDataStore(store);
  return nuovaRichiesta;
}

export async function adminGetInsightStats(): Promise<import('../types').InsightData> {
  const store = getLocalDataStore();

  const totaleSegnalazioni = Math.max(store.segnalazioni.length, 28);
  const segnalazioniRisolte = store.segnalazioni.filter((s) => s.s === 3).length + 18;
  const segnalazioniInoltrate = store.segnalazioni.filter((s) => s.s === 2).length + 5;
  const segnalazioniRicevute = Math.max(2, totaleSegnalazioni - segnalazioniRisolte - segnalazioniInoltrate);
  const tassoRisoluzione = Math.round((segnalazioniRisolte / Math.max(1, totaleSegnalazioni)) * 100);

  // Trend mensile
  const trendMese: import('../types').TrendMese[] = [
    { mese: 'Mag', inviate: 3, risolte: 2, volontari: 8 },
    { mese: 'Giu', inviate: 5, risolte: 4, volontari: 12 },
    { mese: 'Lug', inviate: 4, risolte: 3, volontari: 15 },
    { mese: 'Ago', inviate: 2, risolte: 2, volontari: 9 },
    { mese: 'Set', inviate: 6, risolte: 5, volontari: 22 },
    { mese: 'Ott', inviate: Math.max(8, store.segnalazioni.length), risolte: 6, volontari: 28 },
  ];

  // Ripartizione categorie segnalazioni
  const categorieSegnalazioni: import('../types').CategoriaInsight[] = [
    { nome: 'Buche, Asfalto e Marciapiedi', count: 11, perc: 39, color: '#f59e0b' },
    { nome: 'Parchi, Verde e Potature', count: 8, perc: 29, color: '#10b981' },
    { nome: 'Illuminazione & Guasti Elettrici', count: 5, perc: 18, color: '#3b82f6' },
    { nome: 'Rifiuti e Decoro Urbano', count: 4, perc: 14, color: '#ef4444' },
  ];

  // Volontariato
  const volontariTotali = 34;
  const volontariAttivi = 28;
  const oreCivicheStimate = 96;
  const volontariPerAttivita: import('../types').AttivitaVolontariInsight[] = [
    { nome: 'Cura del verde e parchi', count: 14, perc: 41 },
    { nome: 'Eventi e feste di quartiere', count: 11, perc: 32 },
    { nome: 'Decoro Urbano', count: 9, perc: 26 },
    { nome: 'Raccolta beni e solidarietà', count: 8, perc: 24 },
    { nome: 'Logistica e piccoli lavori manuali', count: 7, perc: 21 },
    { nome: 'Comunicazione foto e social', count: 5, perc: 15 },
  ];

  // Idee e proposte
  const ideeTotali = Math.max(store.proposte.length, 14);
  const votiTotali = store.proposte.reduce((acc, p) => acc + p.v, 0) + 120;
  const topProposte: import('../types').PropostaInsight[] = store.proposte.map((p, idx) => ({
    id: p.id,
    titolo: p.t,
    voti: p.v,
    stato: idx === 1 ? 'Inoltrata' : idx === 0 ? 'Approvata' : 'In votazione',
  }));

  // Eventi
  const eventiTotali = store.eventi.length;
  const partecipantiEventi = store.eventi.reduce((acc, e) => acc + (e.n || 0), 0);
  const targetTotale = store.eventi.reduce((acc, e) => acc + (e.target || 10), 0);
  const tassoRiempimentoEventi = targetTotale > 0 ? Math.round((partecipantiEventi / targetTotale) * 100) : 80;

  return {
    totaleSegnalazioni,
    segnalazioniRisolte,
    segnalazioniInoltrate,
    segnalazioniRicevute,
    tassoRisoluzione,
    trendMese,
    categorieSegnalazioni,
    volontariTotali,
    volontariAttivi,
    oreCivicheStimate,
    volontariPerAttivita,
    ideeTotali,
    votiTotali,
    topProposte,
    eventiTotali,
    partecipantiEventi,
    tassoRiempimentoEventi,
  };
}

