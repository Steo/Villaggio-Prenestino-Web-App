import { EventoQuartiere } from '../types';

/**
 * Mappa abbreviazioni mese italiano in numeri a 2 cifre
 */
const MESE_MAP: Record<string, string> = {
  GEN: '01',
  FEB: '02',
  MAR: '03',
  APR: '04',
  MAG: '05',
  GIU: '06',
  LUG: '07',
  AGO: '08',
  SET: '09',
  OTT: '10',
  NOV: '11',
  DIC: '12',
  JAN: '01',
  MAY: '05',
  JUN: '06',
  JUL: '07',
  AUG: '08',
  SEP: '09',
  OCT: '10',
  DEC: '12',
};

/**
 * Genera l'URL universale per Google Calendar Web & App Intent (1-click template)
 * Permette all'utente di aggiungere l'evento direttamente al proprio Google Calendar personale
 */
export function getGoogleCalendarUrl(ev: EventoQuartiere): string {
  let y = ev.anno ? String(ev.anno).trim() : '2026';
  let m = '10';
  if (ev.m) {
    const mStr = String(ev.m).toUpperCase().slice(0, 3);
    if (MESE_MAP[mStr]) {
      m = MESE_MAP[mStr];
    }
  }
  let d = ev.d ? String(parseInt(ev.d, 10)).padStart(2, '0') : '01';

  if (ev.dataCompleta && ev.dataCompleta.includes('-')) {
    const parts = ev.dataCompleta.split('-');
    if (parts.length === 3) {
      y = parts[0];
      m = parts[1].padStart(2, '0');
      d = parts[2].padStart(2, '0');
    }
  }

  // Estrazione ora e minuti di inizio (default: 10:00)
  let h = 10;
  let min = 0;
  if (ev.ora) {
    const match = String(ev.ora).match(/(\d{1,2})[:.]?(\d{2})?/);
    if (match) {
      h = parseInt(match[1], 10);
      if (match[2]) {
        min = parseInt(match[2], 10);
      }
    }
  }

  const startHStr = String(h).padStart(2, '0');
  const startMinStr = String(min).padStart(2, '0');

  // Calcolo ora di fine: durata predefinita stimata di 2 ore
  const endH = (h + 2) % 24;
  const endHStr = String(endH).padStart(2, '0');
  const endMinStr = startMinStr;

  const startDateStr = `${y}${m}${d}T${startHStr}${startMinStr}00`;
  const endDateStr = `${y}${m}${d}T${endHStr}${endMinStr}00`;
  const dates = `${startDateStr}/${endDateStr}`;

  const title = ev.t || 'Evento a Villaggio Prenestino';
  const details = `${ev.p || ''}\n\n📍 Luogo: ${ev.luogo || 'Villaggio Prenestino, Roma'}\n🕒 Orario: ${ev.ora || 'Orario da definire'}\n\nAssociazione di Quartiere Villaggio Prenestino\nhttps://villaggioprenestino.it`.trim();
  const location = ev.luogo || 'Villaggio Prenestino, Roma';

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: dates,
    details: details,
    location: location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
