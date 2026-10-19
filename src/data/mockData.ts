import { WpArticle, EventoQuartiere, RichiestaVolontariato, SegnalazioneCittadina, PropostaCittadina, AttivitaCommercio } from '../types';

/**
 * Array iniziali azzerati per l'installazione in produzione:
 * Tutti i dati relativi ad eventi, commercianti, volontari, segnalazioni, idee e news
 * provengono esclusivamente dal database del sito WordPress tramite le API REST.
 * Nessun dato riempitivo o fittizio presente nel bundle o nello zip scaricabile.
 */
export const INITIAL_NEWS: WpArticle[] = [];
export const INITIAL_EVENTI: EventoQuartiere[] = [];
export const INITIAL_RICHIESTE: RichiestaVolontariato[] = [];
export const INITIAL_SEGNALAZIONI: SegnalazioneCittadina[] = [];
export const INITIAL_PROPOSTE: PropostaCittadina[] = [];
export const INITIAL_ATTIVITA_COMMERCIO: AttivitaCommercio[] = [];

export const TAGS_ATTIVITA_VOLONTARIATO = [
  'Cura del verde e parchi',
  'Eventi e feste di quartiere',
  'Raccolta beni e solidarietà',
  'Decoro Urbano',
  'Comunicazione foto e social',
  'Logistica e piccoli lavori manuali',
];

export const NUMERI_UTILI = [
  {
    nome: 'Numero Unico Emergenze',
    numero: '112',
    descr: 'Carabinieri, Polizia, Vigili del Fuoco, Emergenza Sanitaria',
    tipo: 'urgente',
  },
  {
    nome: 'Polizia Locale Roma Capitale - Municipio VI',
    numero: '06 6769 5100',
    descr: 'Gruppo VI Tor Bella Monaca - Viabilità, soste, pronto intervento',
    tipo: 'locale',
  },
  {
    nome: 'Stazione Carabinieri Tor Bella Monaca',
    numero: '06 2043 1400',
    descr: 'Presidio territoriale Arma dei Carabinieri',
    tipo: 'locale',
  },
  {
    nome: 'Segnalazione Discariche Abusive',
    numero: '800 867 035',
    descr: 'Numero verde gratuito per segnalare discariche abusive e rifiuti abbandonati',
    tipo: 'servizi',
  },
  {
    nome: 'Ritiro Rifiuti Ingombranti (ChiamaRoma)',
    numero: '060606',
    descr: 'ChiamaRoma 060606 per prenotazione ritiro ingombranti a domicilio e informazioni AMA',
    tipo: 'servizi',
  },
  {
    nome: 'Guardia Medica Notturna e Festivi',
    numero: '06 58526811',
    descr: 'Continuità assistenziale ASL Roma 2',
    tipo: 'sanita',
  },
];
