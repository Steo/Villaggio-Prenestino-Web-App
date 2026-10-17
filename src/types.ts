export interface WpArticle {
  id: number;
  titolo: string;
  estratto: string;
  data: string;
  link: string;
  img: string;
  autore?: string;
}

export type TipoEvento = 'volontariato' | 'pagamento' | 'gratuito';

export interface EventoQuartiere {
  id: number;
  t: string;           // Titolo
  p: string;           // Descrizione / Dettagli
  d: string;           // Giorno (es. "18")
  m: string;           // Mese (es. "OTT")
  anno?: string;       // Anno (es. "2026")
  dataCompleta?: string; // Data formato ISO YYYY-MM-DD (es. "2026-10-10")
  ora: string;         // Orario (es. "10:30")
  luogo: string;       // Indirizzo / Luogo
  n: number;           // Numero partecipanti / volontari attuali
  target: number;      // Obiettivo partecipanti
  tipo?: TipoEvento;   // 'volontariato' | 'pagamento' | 'gratuito' (default: 'volontariato')
  passato?: boolean;   // true se evento terminato/passato
  quota?: string;      // eventuale quota per eventi a pagamento (es. "15€")
  lat?: number;        // Coordinate georeferenziate per Google Maps
  lng?: number;
}

export type CategoriaCommercio = 
  | 'tutti' 
  | 'alimentari' 
  | 'ristorazione' 
  | 'salute' 
  | 'servizi' 
  | 'casa';

export interface OffertaCommercio {
  titolo: string;
  dettaglio: string;
  scadenza?: string;
  scontoPercentuale?: number;
}

export interface AttivitaCommercio {
  id: number;
  nome: string;
  categoria: 'alimentari' | 'ristorazione' | 'salute' | 'servizi' | 'casa';
  descrizione: string;
  indirizzo: string;
  lat: number;
  lng: number;
  telefono: string;
  whatsapp?: string; // Numero WhatsApp senza spazi (es. "393331234567")
  orari: string;
  orarioDettagliato?: { [giorno: string]: string };
  apertoOra?: boolean;
  offertaAttiva?: OffertaCommercio;
  immagine: string;
  logo?: string;
  sitoWeb?: string;
  recensioneVoto?: number;
  verificato?: boolean;
  miPiace?: number; // Numero di "Mi piace" ricevuti dai residenti
  statoApprovazione?: 'in_attesa' | 'approvata' | 'rifiutata'; // Moderazione WordPress
  inviataDaMe?: boolean;
  dataInserimento?: string;
  nomeReferente?: string;
  emailReferente?: string;
  pinGestione?: string; // Codice PIN univoco (es. 4 cifre) per la modifica dei dati da parte del titolare senza registrazione
}

export interface NuovaAttivitaForm {
  nome: string;
  categoria: 'alimentari' | 'ristorazione' | 'salute' | 'servizi' | 'casa';
  indirizzo: string;
  telefono: string;
  whatsapp: string;
  orari: string;
  descrizione: string;
  offertaTitolo: string;
  offertaDettaglio: string;
  immagine?: string; // Foto del negozio o copertina (JPG/PNG/URL)
  logo?: string;     // Logo del negozio in formato JPG
  nomeReferente?: string;
  emailReferente?: string;
  pinGestione?: string; // Codice PIN a 4 cifre a scelta del titolare
}

export interface RichiestaVolontariato {
  id: number;
  t: string;           // Titolo attività (es. "Pulizia Parco Via Fosso dell'Osa")
  w: string;           // Dove
  desc: string;        // Descrizione di cosa serve fare
  have: number;        // Volontari attualmente aderiti
  need: number;        // Volontari necessari
  urgente?: boolean;
}

export type StatoSegnalazione = 1 | 2 | 3; // 1: Ricevuta, 2: Inoltrata all'ente preposto, 3: Risolta

export interface SegnalazioneCittadina {
  id: number;
  t: string;           // Titolo / Tipo problema
  w: string;           // Luogo / Indirizzo esatto
  desc: string;        // Descrizione
  s: StatoSegnalazione;// Stato
  ph: string[];        // Foto (URL o base64)
  data: string;        // Data
  cittadinoNome?: string;
  cittadinoTel?: string;
}

export interface PropostaCittadina {
  id: number;
  t: string;           // Titolo proposta
  v: number;           // Numero voti "Mi piace"
}

export interface CandidaturaVolontario {
  nome: string;
  telefono: string;
  attivita: string[];
  note?: string;
}

export interface AppNotification {
  id: string;
  tipo: 'proposta_voti' | 'segnalazione_stato' | 'sistema';
  titolo: string;
  messaggio: string;
  timestamp: number;
  dataOra: string;
  letta: boolean;
  targetId?: number;
}

export interface UserInteractions {
  eventiPartecipati: number[];   // IDs degli eventi a cui ha aderito
  richiesteAderite: number[];    // IDs delle richieste a cui ha fatto "Ci sono"
  proposteVotate: number[];      // IDs delle proposte a cui ha messo like
  negoziVotati?: number[];       // IDs dei commercianti/attività a cui ha messo like
  puntiCivici: number;           // Gamification punti
  token: string;                 // Token anonimo univoco per-device
  contattiSalvati?: {
    nome: string;
    telefono: string;
  };
  mieProposte?: number[];        // IDs delle proposte create dall'utente
  mieSegnalazioni?: number[];    // IDs delle segnalazioni inviate dall'utente
  mieAttivita?: number[];        // IDs delle attività commerciali inserite dall'utente
  notificheAbilitate?: boolean;  // Preferenza abilitazione notifiche
}

export interface WpPluginConfig {
  baseUrl: string;
  apiKey: string;
  useLiveApi: boolean;
}

export interface TrendMese {
  mese: string;
  inviate: number;
  risolte: number;
  volontari: number;
}

export interface CategoriaInsight {
  nome: string;
  count: number;
  perc: number;
  color: string;
}

export interface AttivitaVolontariInsight {
  nome: string;
  count: number;
  perc: number;
}

export interface PropostaInsight {
  id: number;
  titolo: string;
  voti: number;
  stato: 'In votazione' | 'In istruttoria' | 'Approvata' | 'Inoltrata';
}

export interface InsightData {
  totaleSegnalazioni: number;
  segnalazioniRisolte: number;
  segnalazioniInoltrate: number;
  segnalazioniRicevute: number;
  tassoRisoluzione: number;
  trendMese: TrendMese[];
  categorieSegnalazioni: CategoriaInsight[];
  volontariTotali: number;
  volontariAttivi: number;
  oreCivicheStimate: number;
  volontariPerAttivita: AttivitaVolontariInsight[];
  ideeTotali: number;
  votiTotali: number;
  topProposte: PropostaInsight[];
  eventiTotali: number;
  partecipantiEventi: number;
  tassoRiempimentoEventi: number;
}
