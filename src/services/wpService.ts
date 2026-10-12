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
  baseUrl: 'https://villaggioprenestino.it',
  apiKey: 'vpq_app_secure_key_2026',
  useLiveApi: true, // Attivo di default per caricare sempre i dati reali di WordPress
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
      const parsed = JSON.parse(raw);
      let baseUrl = parsed.baseUrl || DEFAULT_CONFIG.baseUrl;
      if (baseUrl.includes('www.villaggioprenestino.it')) {
        baseUrl = baseUrl.replace('www.villaggioprenestino.it', 'villaggioprenestino.it');
      }
      return {
        ...DEFAULT_CONFIG,
        ...parsed,
        baseUrl,
        useLiveApi: parsed.useLiveApi !== undefined ? parsed.useLiveApi : true,
      };
    }
  } catch (e) {
    console.error('Error loading config', e);
  }
  return DEFAULT_CONFIG;
}

export function saveWpConfig(cfg: WpPluginConfig): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
}

/**
 * Calcola l'URL base ottimale per le API:
 * Se l'app è in esecuzione su villaggioprenestino.it (es. /app/), restituisce stringa vuota ""
 * così tutte le chiamate REST avvengono in modalità same-origin relativa (/wp-json/...)
 * evitando qualsiasi blocco CORS o redirect tra www e non-www.
 */
export function getEffectiveBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.includes('villaggioprenestino.it')) {
      return '';
    }
  }
  const cfg = getWpConfig();
  let base = (cfg.baseUrl || 'https://villaggioprenestino.it').replace(/\/+$/, '');
  if (base.includes('www.villaggioprenestino.it')) {
    base = base.replace('www.villaggioprenestino.it', 'villaggioprenestino.it');
  }
  return base;
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
      // Sincronizza INITIAL_PROPOSTE per includere la lista completa di proposte per la paginazione a schede
      if (parsed.proposte) {
        const storedPropIds = new Set(parsed.proposte.map((p: any) => p.id));
        const missingProp = INITIAL_PROPOSTE.filter((p) => !storedPropIds.has(p.id));
        if (missingProp.length > 0) {
          parsed.proposte = [...parsed.proposte, ...missingProp];
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
 * Fetch Dati: interroga le API WordPress live (plugin VP + WP Core REST API)
 * e aggiorna lo store locale per garantire continuità anche offline.
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
  const apiBase = getEffectiveBaseUrl();

  let liveEventi = localStore.eventi;
  let liveRichieste = localStore.richieste;
  let liveSegnalazioni = localStore.segnalazioni;
  let liveProposte = localStore.proposte;
  let liveNews = localStore.news;
  let connected = false;

  // 1. Prova a interrogare l'endpoint del plugin personalizzato VP Quartiere (/wp-json/vp/v1/dati)
  if (cfg.useLiveApi) {
    try {
      const resp = await fetch(`${apiBase}/wp-json/vp/v1/dati`, {
        headers: {
          'X-VP-Key': cfg.apiKey,
          'X-VP-Token': getOrCreateToken(),
        },
      });

      if (resp.ok) {
        const json = await resp.json();
        if (json.success) {
          connected = true;
          if (Array.isArray(json.eventi)) {
            const today = new Date().toISOString().slice(0, 10);
            const mapM: Record<string, string> = {
              'GEN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04', 'MAG': '05', 'GIU': '06',
              'LUG': '07', 'AGO': '08', 'SET': '09', 'OTT': '10', 'NOV': '11', 'DIC': '12',
              'JAN': '01', 'MAY': '05', 'JUN': '06', 'JUL': '07', 'AUG': '08', 'SEP': '09', 'OCT': '10', 'DEC': '12'
            };
            liveEventi = json.eventi.map((ev: any) => {
              const y = ev.anno ? String(ev.anno).trim() : '2026';
              const mNum = mapM[String(ev.m || '').toUpperCase()] || '10';
              const dNum = String(parseInt(ev.d || '1', 10)).padStart(2, '0');
              const iso = ev.dataCompleta || `${y}-${mNum}-${dNum}`;
              const isPassato = Boolean(ev.passato || (iso && iso < today));
              return {
                ...ev,
                anno: y,
                dataCompleta: iso,
                passato: isPassato,
              };
            });
          }
          if (Array.isArray(json.richieste)) {
            liveRichieste = json.richieste;
          }
          if (Array.isArray(json.segnalazioni)) {
            liveSegnalazioni = json.segnalazioni;
          }
          if (Array.isArray(json.proposte)) {
            liveProposte = json.proposte;
          }
          if (Array.isArray(json.news) && json.news.length > 0) {
            liveNews = json.news.map((item: any) => ({
              id: item.id,
              titolo: decodeHtmlEntities(item.titolo || ''),
              estratto: cleanExcerpt(item.estratto || ''),
              data: item.data || '',
              link: item.link || 'https://villaggioprenestino.it',
              img: item.img || 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=700&q=80',
              autore: 'Associazione Villaggio Prenestino',
            }));
          }
        }
      }
    } catch (err) {
      console.warn('Connessione al plugin VP non riuscita, provo endpoint WP standard:', err);
    }
  }

  // 2. Prova sempre a sincronizzare gli ULTIMI ARTICOLI REALI dal blog WordPress (/wp-json/wp/v2/posts)
  // Questo garantisce che le notizie siano SEMPRE quelle reali pubblicate sul sito web
  try {
    const newsResp = await fetch(`${apiBase}/wp-json/wp/v2/posts?per_page=3&_embed`, {
      headers: { 'Accept': 'application/json' },
    });
    if (newsResp.ok) {
      const wpPosts = await newsResp.json();
      if (Array.isArray(wpPosts) && wpPosts.length > 0) {
        const parsedNews: WpArticle[] = wpPosts.map((p: any) => {
          let img = 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=700&q=80';
          if (p._embedded && p._embedded['wp:featuredmedia'] && p._embedded['wp:featuredmedia'][0]) {
            const media = p._embedded['wp:featuredmedia'][0];
            img = media.source_url || media.media_details?.sizes?.medium_large?.source_url || media.media_details?.sizes?.full?.source_url || img;
          }
          const rawExcerpt = p.excerpt?.rendered ? stripTags(p.excerpt.rendered) : '';
          return {
            id: p.id,
            titolo: p.title?.rendered ? decodeHtmlEntities(p.title.rendered) : 'Notizia dal quartiere',
            estratto: cleanExcerpt(rawExcerpt),
            data: new Date(p.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }),
            link: p.link || 'https://villaggioprenestino.it',
            img,
            autore: 'Associazione Villaggio Prenestino',
          };
        });
        liveNews = parsedNews;
        connected = true;
      }
    }
  } catch (e) {
    console.warn('Sincronizzazione news WP standard fallita:', e);
  }

  // Salva nello store locale così la Web App funziona all'istante anche offline
  localStore.eventi = liveEventi;
  localStore.richieste = liveRichieste;
  localStore.segnalazioni = liveSegnalazioni;
  localStore.proposte = liveProposte;
  localStore.news = liveNews;
  saveLocalDataStore(localStore);

  return {
    eventi: liveEventi,
    richieste: liveRichieste,
    segnalazioni: liveSegnalazioni,
    proposte: liveProposte,
    news: liveNews,
    isLive: connected,
  };
}

export function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  if (typeof document !== 'undefined') {
    const txt = document.createElement('textarea');
    txt.innerHTML = str;
    return txt.value;
  }
  return str
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&hellip;/g, '...')
    .replace(/&nbsp;/g, ' ');
}

export function stripTags(html: string): string {
  if (!html) return '';
  if (typeof document !== 'undefined') {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }
  return html.replace(/<[^>]*>/g, '');
}

export function cleanExcerpt(html: string): string {
  if (!html) return 'Leggi l\'articolo completo dal sito di Villaggio Prenestino.';
  let text = stripTags(html);
  // Elimina shortcode Divi tipo [et_pb_section ...] e [/et_pb_section]
  text = text.replace(/\[\/?et_pb_[^\]]*\]/gi, ' ');
  // Elimina qualsiasi altro shortcode residuo
  text = text.replace(/\[[^\]]+\]/g, ' ');
  text = decodeHtmlEntities(text);
  text = text.replace(/\s+/g, ' ').trim();
  if (text.length < 5) {
    return 'Leggi l\'articolo completo e tutti i dettagli su Villaggio Prenestino.';
  }
  return text;
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
  if (cfg.useLiveApi) {
    try {
      const apiBase = getEffectiveBaseUrl();
      const resp = await fetch(`${apiBase}/wp-json/vp/v1/interazione`, {
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

  if (cfg.useLiveApi) {
    try {
      const apiBase = getEffectiveBaseUrl();
      await fetch(`${apiBase}/wp-json/vp/v1/segnalazione`, {
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

  if (cfg.useLiveApi) {
    try {
      const apiBase = getEffectiveBaseUrl();
      const resp = await fetch(`${apiBase}/wp-json/vp/v1/volontario`, {
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

  if (cfg.useLiveApi) {
    try {
      const apiBase = getEffectiveBaseUrl();
      await fetch(`${apiBase}/wp-json/vp/v1/proposta`, {
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

  // Sincronizza anche con WordPress in live
  const cfg = getWpConfig();
  if (cfg.useLiveApi) {
    try {
      const apiBase = getEffectiveBaseUrl();
      const resp = await fetch(`${apiBase}/wp-json/vp/v1/evento`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-VP-Key': cfg.apiKey,
          'X-VP-Token': getOrCreateToken(),
        },
        body: JSON.stringify(eventoData),
      });
      if (resp.ok) {
        const json = await resp.json();
        if (json.id) {
          nuovoEvento.id = json.id;
          saveLocalDataStore(store);
        }
      }
    } catch (e) {
      console.warn('Salvataggio evento su WordPress non riuscito:', e);
    }
  }

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
  }

  // Sincronizza anche con WordPress in live
  const cfg = getWpConfig();
  if (cfg.useLiveApi) {
    try {
      const apiBase = getEffectiveBaseUrl();
      await fetch(`${apiBase}/wp-json/vp/v1/segnalazione/stato`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-VP-Key': cfg.apiKey,
          'X-VP-Token': getOrCreateToken(),
        },
        body: JSON.stringify({ id, stato: nuovoStato.toString() }),
      });
    } catch (e) {
      console.warn('Aggiornamento stato segnalazione su WordPress fallito:', e);
    }
  }

  return true;
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

  // Sincronizza anche con WordPress in live
  const cfg = getWpConfig();
  if (cfg.useLiveApi) {
    try {
      const apiBase = getEffectiveBaseUrl();
      const resp = await fetch(`${apiBase}/wp-json/vp/v1/richiesta`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-VP-Key': cfg.apiKey,
          'X-VP-Token': getOrCreateToken(),
        },
        body: JSON.stringify(richiestaData),
      });
      if (resp.ok) {
        const json = await resp.json();
        if (json.id) {
          nuovaRichiesta.id = json.id;
          saveLocalDataStore(store);
        }
      }
    } catch (e) {
      console.warn('Salvataggio richiesta su WordPress non riuscito:', e);
    }
  }

  return nuovaRichiesta;
}

export async function adminGetInsightStats(): Promise<import('../types').InsightData> {
  const cfg = getWpConfig();
  const apiBase = getEffectiveBaseUrl();

  // Se la sincronizzazione live è attiva, interroga l'endpoint reale di WordPress
  if (cfg.useLiveApi) {
    try {
      const resp = await fetch(`${apiBase}/wp-json/vp/v1/insights`, {
        headers: {
          'X-VP-Key': cfg.apiKey,
        },
      });
      if (resp.ok) {
        const json = await resp.json();
        if (json.success) {
          const totSegnalazioni = Number(json.totaleSegnalazioni) || 0;
          const ris = Number(json.segnalazioniRisolte) || 0;
          const inoltr = Number(json.segnalazioniInoltrate) || 0;
          const ric = Number(json.segnalazioniRicevute) || 0;
          const tasso = totSegnalazioni > 0 ? Math.round((ris / totSegnalazioni) * 100) : 0;
          const vol = Number(json.volontariTotali) || 0;
          const id = Number(json.ideeTotali) || 0;
          const vot = Number(json.votiTotali) || 0;
          const ev = Number(json.eventiTotali) || 0;
          const part = Number(json.partecipantiEventi) || 0;

          return {
            totaleSegnalazioni: totSegnalazioni,
            segnalazioniRisolte: ris,
            segnalazioniInoltrate: inoltr,
            segnalazioniRicevute: ric,
            tassoRisoluzione: tasso,
            trendMese: [],
            categorieSegnalazioni: [],
            volontariTotali: vol,
            volontariAttivi: vol,
            oreCivicheStimate: vol * 3,
            volontariPerAttivita: [],
            ideeTotali: id,
            votiTotali: vot,
            topProposte: [],
            eventiTotali: ev,
            partecipantiEventi: part,
            tassoRiempimentoEventi: ev > 0 ? Math.round((part / Math.max(1, ev * 15)) * 100) : 0,
          };
        }
      }
    } catch (e) {
      console.warn('Recupero insight live non riuscito, uso dati locali reali:', e);
    }
  }

  const store = getLocalDataStore();

  const totaleSegnalazioni = store.segnalazioni.length;
  const segnalazioniRisolte = store.segnalazioni.filter((s) => s.s === 3).length;
  const segnalazioniInoltrate = store.segnalazioni.filter((s) => s.s === 2).length;
  const segnalazioniRicevute = Math.max(0, totaleSegnalazioni - segnalazioniRisolte - segnalazioniInoltrate);
  const tassoRisoluzione = totaleSegnalazioni > 0 ? Math.round((segnalazioniRisolte / totaleSegnalazioni) * 100) : 0;

  // Volontari reali dalle adesioni
  const volontariTotali = store.richieste.reduce((acc, r) => acc + (r.have || 0), 0);
  const volontariAttivi = volontariTotali;
  const oreCivicheStimate = volontariTotali * 3;

  // Proposte e voti reali
  const ideeTotali = store.proposte.length;
  const votiTotali = store.proposte.reduce((acc, p) => acc + (p.v || 0), 0);
  const topProposte: import('../types').PropostaInsight[] = [...store.proposte]
    .sort((a, b) => b.v - a.v)
    .slice(0, 5)
    .map((p) => ({
      id: p.id,
      titolo: p.t,
      voti: p.v,
      stato: 'In votazione',
    }));

  // Eventi reali
  const eventiTotali = store.eventi.length;
  const partecipantiEventi = store.eventi.reduce((acc, e) => acc + (e.n || 0), 0);
  const targetTotale = store.eventi.reduce((acc, e) => acc + (e.target || 10), 0);
  const tassoRiempimentoEventi = targetTotale > 0 ? Math.round((partecipantiEventi / targetTotale) * 100) : 0;

  return {
    totaleSegnalazioni,
    segnalazioniRisolte,
    segnalazioniInoltrate,
    segnalazioniRicevute,
    tassoRisoluzione,
    trendMese: [],
    categorieSegnalazioni: [],
    volontariTotali,
    volontariAttivi,
    oreCivicheStimate,
    volontariPerAttivita: [],
    ideeTotali,
    votiTotali,
    topProposte,
    eventiTotali,
    partecipantiEventi,
    tassoRiempimentoEventi,
  };
}

