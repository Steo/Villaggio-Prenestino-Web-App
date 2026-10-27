import { AttivitaCommercio } from '../types';

export interface OpeningStatus {
  isOpen: boolean;
  isPaused: boolean; // In pausa pranzo tra due fasce
  statusText: string; // "Aperto adesso", "In pausa", "Chiuso oggi", "Chiuso adesso", "Chiuso per ferie", "Chiusura straordinaria"
  detailText: string; // "Fino alle 13:00", "Riapre alle 16:30", "Riapre Lunedì alle 08:30"
  badgeColor: 'emerald' | 'amber' | 'slate' | 'rose';
  isFerie?: boolean;
  isExtraordinary?: boolean;
  nextTransition?: string;
}

export const GIORNI_SETTIMANA = [
  'domenica',
  'lunedi',
  'martedi',
  'mercoledi',
  'giovedi',
  'venerdi',
  'sabato',
] as const;

export const NOMI_GIORNI_LABEL = [
  'Domenica',
  'Lunedì',
  'Martedì',
  'Mercoledì',
  'Giovedì',
  'Venerdì',
  'Sabato',
];

export const DAY_TOKENS: Record<number, string[]> = {
  0: ['dom', 'domenica'],
  1: ['lun', 'lunedì', 'lunedi'],
  2: ['mar', 'martedì', 'martedi'],
  3: ['mer', 'mercoledì', 'mercoledi'],
  4: ['gio', 'giovedì', 'giovedi'],
  5: ['ven', 'venerdì', 'venerdi'],
  6: ['sab', 'sabato'],
};

/**
 * Converte HH:MM in minuti totali dalla mezzanotte
 */
function timeToMinutes(h: number, m: number): number {
  return h * 60 + m;
}

function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

interface TimeInterval {
  start: number; // minuti
  end: number;   // minuti
}

/**
 * Estrae fasce orarie da una stringa (es. "08:30 - 13:00 / 16:30 - 20:00")
 */
function extractIntervals(str: string): TimeInterval[] {
  const intervals: TimeInterval[] = [];
  // Match formati come 08:30 - 13:00, 8.30-13.00, 08:00 - 20:00
  const regex = /(\d{1,2})[:.](\d{2})\s*[-–]\s*(\d{1,2})[:.](\d{2})/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(str)) !== null) {
    const startH = parseInt(match[1], 10);
    const startM = parseInt(match[2], 10);
    const endH = parseInt(match[3], 10);
    const endM = parseInt(match[4], 10);

    const startMin = timeToMinutes(startH, startM);
    let endMin = timeToMinutes(endH, endM);

    // Se l'orario di chiusura supera la mezzanotte (es. 19:00 - 02:00 per locali/pizzerie)
    if (endMin < startMin) {
      endMin += 24 * 60;
    }

    if (!isNaN(startMin) && !isNaN(endMin)) {
      intervals.push({ start: startMin, end: endMin });
    }
  }

  // Ordina le fasce cronologicamente
  intervals.sort((a, b) => a.start - b.start);
  return intervals;
}

/**
 * Ricava la data e l'ora locale in Italia (fuso Europe/Rome)
 */
export function getRomeDateTime(customDate?: Date): {
  dayIndex: number; // 0 = Dom, 1 = Lun ... 6 = Sab
  hours: number;
  minutes: number;
  totalMinutes: number;
  dayName: string;
} {
  const d = customDate || new Date();
  try {
    const formatter = new Intl.DateTimeFormat('it-IT', {
      timeZone: 'Europe/Rome',
      weekday: 'short',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    });
    const parts = formatter.formatToParts(d);
    let hours = d.getHours();
    let minutes = d.getMinutes();
    let weekdayStr = '';
    for (const part of parts) {
      if (part.type === 'hour') hours = parseInt(part.value, 10);
      if (part.type === 'minute') minutes = parseInt(part.value, 10);
      if (part.type === 'weekday') weekdayStr = part.value.toLowerCase().replace('.', '').trim();
    }
    const dayMap: Record<string, number> = {
      dom: 0,
      lun: 1,
      mar: 2,
      mer: 3,
      gio: 4,
      ven: 5,
      sab: 6,
    };
    const prefix = weekdayStr.slice(0, 3);
    const dayIndex = prefix in dayMap ? dayMap[prefix] : d.getDay();
    return {
      dayIndex,
      hours,
      minutes,
      totalMinutes: hours * 60 + minutes,
      dayName: NOMI_GIORNI_LABEL[dayIndex],
    };
  } catch {
    const dayIndex = d.getDay();
    const hours = d.getHours();
    const minutes = d.getMinutes();
    return {
      dayIndex,
      hours,
      minutes,
      totalMinutes: hours * 60 + minutes,
      dayName: NOMI_GIORNI_LABEL[dayIndex],
    };
  }
}

/**
 * Verifica se un giorno specifico della settimana è esplicitamente indicato come chiuso
 */
function isDayExplicitlyClosed(textLower: string, dayIndex: number): boolean {
  const aliases = DAY_TOKENS[dayIndex] || [];
  
  for (const alias of aliases) {
    if (
      textLower.includes(`${alias} chiuso`) ||
      textLower.includes(`${alias}. chiuso`) ||
      textLower.includes(`${alias}: chiuso`) ||
      textLower.includes(`${alias} chiusa`) ||
      textLower.includes(`${alias}: chiusa`) ||
      textLower.includes(`chiuso ${alias}`) ||
      textLower.includes(`chiuso il ${alias}`) ||
      textLower.includes(`chiuso la ${alias}`) ||
      textLower.includes(`chiusa la ${alias}`) ||
      textLower.includes(`chiusa ${alias}`) ||
      textLower.includes(`chiuso: ${alias}`) ||
      textLower.includes(`chiusura: ${alias}`) ||
      textLower.includes(`(${alias} chiuso)`) ||
      textLower.includes(`(${alias}: chiuso)`) ||
      textLower.includes(`(${alias} chiusa)`)
    ) {
      return true;
    }
  }

  // Verifica chiusura weekend (Sabato e Domenica)
  if (dayIndex === 0 || dayIndex === 6) {
    if (
      textLower.includes('sabato e domenica chiuso') ||
      textLower.includes('sabato e domenica chiusi') ||
      textLower.includes('sab e dom chiuso') ||
      textLower.includes('sab e dom chiusi') ||
      textLower.includes('weekend chiuso')
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Trova il primo giorno successivo in cui l'attività riapre
 */
function findNextOpenDay(
  textLower: string,
  currentDayIndex: number,
  firstTime?: string
): { nextDayName: string; detail: string } {
  // Scandisce i prossimi 7 giorni
  for (let offset = 1; offset <= 7; offset++) {
    const nextIndex = (currentDayIndex + offset) % 7;
    const isClosed = isDayExplicitlyClosed(textLower, nextIndex);
    if (!isClosed) {
      const dayName = NOMI_GIORNI_LABEL[nextIndex];
      const detail = firstTime ? `Riapre ${dayName} alle ${firstTime}` : `Riapre ${dayName}`;
      return { nextDayName: dayName, detail };
    }
  }
  return { nextDayName: 'domani', detail: firstTime ? `Riapre domani alle ${firstTime}` : 'Riapre presto' };
}

/**
 * Calcola se oggi è un giorno attivo di apertura in base ai pattern di giorni
 * (es. "Lun-Sab", "Lun-Ven", "Mar-Dom", "Lun, Mar, Mer, Gio, Ven, Sab", "Tutti i giorni")
 */
function checkDayScheduleValidity(
  textLower: string,
  currentDayIndex: number
): { isDayOpen: boolean; reason?: string } {
  // 1. Se oggi è esplicitamente chiuso nel testo
  if (isDayExplicitlyClosed(textLower, currentDayIndex)) {
    return { isDayOpen: false, reason: 'explicit_closed' };
  }

  // 2. Se è specificato "Tutti i giorni" o "7 su 7" o "Sempre aperto"
  if (
    textLower.includes('tutti i giorni') ||
    textLower.includes('7/7') ||
    textLower.includes('7 su 7') ||
    textLower.includes('ogni giorno') ||
    textLower.includes('sempre aperto')
  ) {
    return { isDayOpen: true };
  }

  // 3. Controlla se oggi ha una fascia oraria specifica dedicata nel testo
  // Es: "Lun-Ven 08:30-13:00; Sab 08:30-12:30; Dom 09:00-13:00"
  const aliases = DAY_TOKENS[currentDayIndex] || [];
  const hasSpecificDayOpening = aliases.some((alias) => {
    // Cerca pattern come "dom 09:00", "dom: 09:00", "domenica 08.30"
    const regex = new RegExp(`(?:^|[;,•\\s])${alias}[:\\s]+(?:dalle\\s+)?\\d{1,2}[:.]\\d{2}`, 'i');
    return regex.test(textLower);
  });
  if (hasSpecificDayOpening) {
    return { isDayOpen: true };
  }

  // 4. Analisi degli intervalli di giorni (es. "Lun-Sab", "Lun-Ven", "Mar-Dom")
  // Formati: "Lun-Sab", "Lun - Sab", "Lunedì - Sabato", "da Lun a Sab"
  const isLunSab =
    textLower.includes('lun-sab') ||
    textLower.includes('lun - sab') ||
    textLower.includes('lunedì - sabato') ||
    textLower.includes('lunedi - sabato') ||
    textLower.includes('lunedì-sabato') ||
    textLower.includes('lunedi-sabato') ||
    textLower.includes('da lun a sab') ||
    textLower.includes('dal lun al sab');

  if (isLunSab) {
    // Lun-Sab: aperto da Lunedì (1) a Sabato (6). Domenica (0) è CHIUSA.
    if (currentDayIndex === 0) {
      return { isDayOpen: false, reason: 'sunday_outside_lun_sab' };
    }
    return { isDayOpen: true };
  }

  const isLunVen =
    textLower.includes('lun-ven') ||
    textLower.includes('lun - ven') ||
    textLower.includes('lunedì - venerdì') ||
    textLower.includes('lunedi - venerdi') ||
    textLower.includes('lunedì-venerdì') ||
    textLower.includes('lunedi-venerdi') ||
    textLower.includes('da lun a ven') ||
    textLower.includes('dal lun al ven');

  if (isLunVen) {
    // Lun-Ven: aperto da Lunedì (1) a Venerdì (5). Sabato (6) e Domenica (0) sono CHIUSI.
    if (currentDayIndex === 0 || currentDayIndex === 6) {
      return { isDayOpen: false, reason: 'weekend_outside_lun_ven' };
    }
    return { isDayOpen: true };
  }

  const isMarDom =
    textLower.includes('mar-dom') ||
    textLower.includes('mar - dom') ||
    textLower.includes('martedì - domenica') ||
    textLower.includes('martedi - domenica') ||
    textLower.includes('martedì-domenica') ||
    textLower.includes('martedi-domenica');

  if (isMarDom) {
    // Mar-Dom: aperto da Martedì (2) a Domenica (0). Lunedì (1) è CHIUSO.
    if (currentDayIndex === 1) {
      return { isDayOpen: false, reason: 'monday_outside_mar_dom' };
    }
    return { isDayOpen: true };
  }

  const isMarSab =
    textLower.includes('mar-sab') ||
    textLower.includes('mar - sab') ||
    textLower.includes('martedì - sabato') ||
    textLower.includes('martedi - sabato') ||
    textLower.includes('martedì-sabato');

  if (isMarSab) {
    // Mar-Sab: aperto da Martedì (2) a Sabato (6). Domenica (0) e Lunedì (1) sono CHIUSI.
    if (currentDayIndex === 0 || currentDayIndex === 1) {
      return { isDayOpen: false, reason: 'outside_mar_sab' };
    }
    return { isDayOpen: true };
  }

  // 5. Elenco esplicito di giorni separati da virgola prima di ':' o dell'orario
  // Es: "Lun, Mar, Mer, Gio, Ven, Sab: 08:30-13:00"
  const prefixMatch = textLower.match(/^([a-zàèéìòù,\s-]+):/);
  if (prefixMatch) {
    const prefix = prefixMatch[1];
    // Controlla se il prefisso contiene nomi di giorni
    const daysInPrefix: number[] = [];
    for (let d = 0; d < 7; d++) {
      if (DAY_TOKENS[d].some((token) => prefix.includes(token))) {
        daysInPrefix.push(d);
      }
    }
    if (daysInPrefix.length > 0) {
      if (!daysInPrefix.includes(currentDayIndex)) {
        return { isDayOpen: false, reason: 'not_in_day_list' };
      }
      return { isDayOpen: true };
    }
  }

  // Se nessun vincolo restrittivo di giorni è presente, si considerano gli orari validi
  return { isDayOpen: true };
}

/**
 * Calcola lo stato di apertura in tempo reale in base a orari e giorno
 */
export function getShopOpeningStatus(
  shop: Partial<AttivitaCommercio>,
  customDate?: Date
): OpeningStatus {
  // 1. Chiusura straordinaria manuale del negoziante
  if (shop.chiusuraStraordinaria === true) {
    return {
      isOpen: false,
      isPaused: false,
      statusText: 'Chiusura straordinaria',
      detailText: 'Attualmente non disponibile',
      badgeColor: 'rose',
      isExtraordinary: true,
    };
  }

  // 2. Chiusura per ferie fino a una determinata data
  if (shop.chiusoPerFerieFinoA && shop.chiusoPerFerieFinoA.trim()) {
    try {
      const todayIso = (customDate || new Date()).toISOString().slice(0, 10);
      if (todayIso <= shop.chiusoPerFerieFinoA) {
        const parts = shop.chiusoPerFerieFinoA.split('-');
        const dateStr = parts.length === 3 ? `${parts[2]}/${parts[1]}` : shop.chiusoPerFerieFinoA;
        return {
          isOpen: false,
          isPaused: false,
          statusText: 'Chiuso per ferie',
          detailText: `Riapre il ${dateStr}`,
          badgeColor: 'amber',
          isFerie: true,
        };
      }
    } catch {}
  }

  const rawOrari = (shop.orari || '').trim();
  const lowerOrari = rawOrari.toLowerCase();

  // 3. Verifica formati speciali H24
  if (
    lowerOrari.includes('h24') ||
    lowerOrari.includes('24h') ||
    lowerOrari.includes('24/7') ||
    lowerOrari.includes('sempre aperto')
  ) {
    return {
      isOpen: true,
      isPaused: false,
      statusText: 'Aperto adesso',
      detailText: 'Servizio H24 continuato',
      badgeColor: 'emerald',
    };
  }

  // Se non ci sono orari specificati, affidati all'eventuale flag manuale o stato neutro
  if (!rawOrari) {
    const isManuallyOpen = shop.apertoOra ?? true;
    return {
      isOpen: isManuallyOpen,
      isPaused: false,
      statusText: isManuallyOpen ? 'Aperto' : 'Chiuso',
      detailText: 'Orario non specificato',
      badgeColor: isManuallyOpen ? 'emerald' : 'slate',
    };
  }

  // Calcola giorno della settimana e minuti esatti nel fuso orario di Roma (Europe/Rome)
  const romeTime = getRomeDateTime(customDate);
  const currentDayIndex = romeTime.dayIndex; // 0 = Domenica, 1 = Lunedì...
  const currentMinutes = romeTime.totalMinutes;

  // 4. Se è presente un orario dettagliato giorno per giorno (JSON o mappa giorni)
  if (shop.orarioDettagliato && typeof shop.orarioDettagliato === 'object') {
    const dayKey = GIORNI_SETTIMANA[currentDayIndex];
    const todayDetailed = (shop.orarioDettagliato[dayKey] || '').trim();

    if (todayDetailed) {
      const todayLower = todayDetailed.toLowerCase();
      if (todayLower.includes('chiuso')) {
        const nextDayName = NOMI_GIORNI_LABEL[(currentDayIndex + 1) % 7];
        return {
          isOpen: false,
          isPaused: false,
          statusText: 'Chiuso oggi',
          detailText: `Riapre ${nextDayName}`,
          badgeColor: 'rose',
        };
      }

      const detailedIntervals = extractIntervals(todayDetailed);
      if (detailedIntervals.length > 0) {
        return evaluateIntervals(detailedIntervals, currentMinutes, currentDayIndex);
      }
    }
  }

  // Estrai tutte le fasce orarie presenti nella stringa
  const allIntervals = extractIntervals(rawOrari);
  const firstMorningTime = allIntervals.length > 0 ? minutesToTimeString(allIntervals[0].start) : undefined;

  // 5. Verifica se OGGI è un giorno consentito dall'orario settimanale
  const dayValidity = checkDayScheduleValidity(lowerOrari, currentDayIndex);

  if (!dayValidity.isDayOpen) {
    const { detail } = findNextOpenDay(lowerOrari, currentDayIndex, firstMorningTime);
    const isWeekendClosure = dayValidity.reason === 'weekend_outside_lun_ven';
    return {
      isOpen: false,
      isPaused: false,
      statusText: isWeekendClosure ? 'Chiuso nel weekend' : 'Chiuso oggi',
      detailText: detail,
      badgeColor: 'rose',
      nextTransition: firstMorningTime,
    };
  }

  // 6. Se oggi ha una specifica sezione oraria separata nel testo (es: "Sab 08:30-13:00")
  const aliases = DAY_TOKENS[currentDayIndex] || [];
  for (const alias of aliases) {
    const regex = new RegExp(`(?:^|[;,•\\s])${alias}[:\\s]+((?:dalle\\s+)?\\d{1,2}[:.]\\d{2}[^;•,]+)`, 'i');
    const match = lowerOrari.match(regex);
    if (match) {
      const specificIntervals = extractIntervals(match[1]);
      if (specificIntervals.length > 0) {
        return evaluateIntervals(specificIntervals, currentMinutes, currentDayIndex);
      }
    }
  }

  // 7. Valuta le fasce orarie standard
  if (allIntervals.length > 0) {
    return evaluateIntervals(allIntervals, currentMinutes, currentDayIndex);
  }

  // 8. Fallback qualora il formato orario non sia identificabile numericamente
  const fallbackOpen = shop.apertoOra ?? true;
  return {
    isOpen: fallbackOpen,
    isPaused: false,
    statusText: fallbackOpen ? 'Aperto' : 'Chiuso',
    detailText: rawOrari,
    badgeColor: fallbackOpen ? 'emerald' : 'rose',
  };
}

/**
 * Valuta un insieme di fasce orarie rispetto ai minuti attuali
 */
function evaluateIntervals(
  intervals: TimeInterval[],
  currentMinutes: number,
  currentDayIndex: number
): OpeningStatus {
  // Controlla se siamo all'interno di una delle fasce aperte
  for (let i = 0; i < intervals.length; i++) {
    const interval = intervals[i];
    if (currentMinutes >= interval.start && currentMinutes < interval.end) {
      const closeTime = minutesToTimeString(interval.end);
      return {
        isOpen: true,
        isPaused: false,
        statusText: 'Aperto adesso',
        detailText: `Fino alle ${closeTime}`,
        badgeColor: 'emerald',
        nextTransition: closeTime,
      };
    }
  }

  // Se siamo prima dell'inizio della prima fascia
  if (currentMinutes < intervals[0].start) {
    const openTime = minutesToTimeString(intervals[0].start);
    return {
      isOpen: false,
      isPaused: false,
      statusText: 'Chiuso adesso',
      detailText: `Apre alle ${openTime}`,
      badgeColor: 'rose',
      nextTransition: openTime,
    };
  }

  // Se siamo tra due fasce (pausa pranzo)
  for (let i = 0; i < intervals.length - 1; i++) {
    const prev = intervals[i];
    const next = intervals[i + 1];
    if (currentMinutes >= prev.end && currentMinutes < next.start) {
      const reopenTime = minutesToTimeString(next.start);
      return {
        isOpen: false,
        isPaused: true,
        statusText: 'In pausa',
        detailText: `Riapre alle ${reopenTime}`,
        badgeColor: 'amber',
        nextTransition: reopenTime,
      };
    }
  }

  // Se siamo dopo l'ultima fascia di chiusura
  const nextDayName = currentDayIndex === 6 ? 'Lunedì' : 'domani';
  const firstMorningTime = minutesToTimeString(intervals[0].start);
  return {
    isOpen: false,
    isPaused: false,
    statusText: 'Chiuso adesso',
    detailText: `Riapre ${nextDayName} alle ${firstMorningTime}`,
    badgeColor: 'rose',
    nextTransition: firstMorningTime,
  };
}

export interface ScheduleShift {
  start: string;
  end: string;
  startMinutes: number;
  endMinutes: number;
  isMorning?: boolean;
  isAfternoon?: boolean;
}

export interface DayScheduleItem {
  dayIndex: number; // 0 = Dom, 1 = Lun ... 6 = Sab
  dayShort: string; // 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'
  dayLetter: string; // 'L', 'M', 'M', 'G', 'V', 'S', 'D'
  dayFull: string; // 'Lunedì', 'Martedì', ...
  isOpen: boolean;
  isH24?: boolean;
  isContinuous?: boolean;
  hoursText: string; // es. "08:30 - 13:00 / 16:00 - 20:00" o "Chiuso"
  shifts: ScheduleShift[];
  isToday: boolean;
}

/**
 * Restituisce la griglia settimanale ordinata Lunedì -> Domenica
 * con indicazione per ogni giorno di stato aperto/chiuso, fasce orarie e giorno corrente
 */
export function getWeeklySchedule(
  shop: Partial<AttivitaCommercio>,
  customDate?: Date
): DayScheduleItem[] {
  const romeTime = getRomeDateTime(customDate);
  const currentDayIndex = romeTime.dayIndex;
  const rawOrari = (shop.orari || '').trim();
  const lowerOrari = rawOrari.toLowerCase();

  // Ordine standard settimana lavorativa italiana: Lunedì (1) -> Domenica (0)
  const weekDaysOrder = [1, 2, 3, 4, 5, 6, 0];
  const shortNames = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
  const letters = ['D', 'L', 'M', 'M', 'G', 'V', 'S'];

  // Fasce orarie generali
  const generalIntervals = extractIntervals(rawOrari);

  return weekDaysOrder.map((dayIdx) => {
    const isToday = dayIdx === currentDayIndex;
    const dayKey = GIORNI_SETTIMANA[dayIdx];

    // Se c'è un orario dettagliato esplicito per questo giorno
    if (shop.orarioDettagliato && typeof shop.orarioDettagliato === 'object') {
      const detailed = (shop.orarioDettagliato[dayKey] || '').trim();
      if (detailed) {
        if (detailed.toLowerCase().includes('chiuso')) {
          return {
            dayIndex: dayIdx,
            dayShort: shortNames[dayIdx],
            dayLetter: letters[dayIdx],
            dayFull: NOMI_GIORNI_LABEL[dayIdx],
            isOpen: false,
            hoursText: 'Chiuso',
            shifts: [],
            isToday,
          };
        }
        const detailedIntervals = extractIntervals(detailed);
        if (detailedIntervals.length > 0) {
          const shifts: ScheduleShift[] = detailedIntervals.map((i) => ({
            start: minutesToTimeString(i.start),
            end: minutesToTimeString(i.end),
            startMinutes: i.start,
            endMinutes: i.end,
            isMorning: i.start < 13 * 60,
            isAfternoon: i.start >= 13 * 60,
          }));
          const hoursText = shifts.map((s) => `${s.start} - ${s.end}`).join(' / ');
          return {
            dayIndex: dayIdx,
            dayShort: shortNames[dayIdx],
            dayLetter: letters[dayIdx],
            dayFull: NOMI_GIORNI_LABEL[dayIdx],
            isOpen: true,
            isContinuous: shifts.length === 1,
            hoursText,
            shifts,
            isToday,
          };
        }
      }
    }

    // Verifica validità giorno in base ai pattern
    const dayValidity = checkDayScheduleValidity(lowerOrari, dayIdx);
    if (!dayValidity.isDayOpen) {
      return {
        dayIndex: dayIdx,
        dayShort: shortNames[dayIdx],
        dayLetter: letters[dayIdx],
        dayFull: NOMI_GIORNI_LABEL[dayIdx],
        isOpen: false,
        hoursText: 'Chiuso',
        shifts: [],
        isToday,
      };
    }

    // Controlla se il giorno ha una fascia oraria specifica nel testo (es: "Sab 08:30-13:00")
    const aliases = DAY_TOKENS[dayIdx] || [];
    let dayIntervals = generalIntervals;
    for (const alias of aliases) {
      const regex = new RegExp(`(?:^|[;,•\\s])${alias}[:\\s]+((?:dalle\\s+)?\\d{1,2}[:.]\\d{2}[^;•,]+)`, 'i');
      const match = lowerOrari.match(regex);
      if (match) {
        const specific = extractIntervals(match[1]);
        if (specific.length > 0) {
          dayIntervals = specific;
          break;
        }
      }
    }

    if (dayIntervals.length === 0) {
      // Formati H24 o generici
      if (
        lowerOrari.includes('h24') ||
        lowerOrari.includes('24h') ||
        lowerOrari.includes('sempre aperto')
      ) {
        return {
          dayIndex: dayIdx,
          dayShort: shortNames[dayIdx],
          dayLetter: letters[dayIdx],
          dayFull: NOMI_GIORNI_LABEL[dayIdx],
          isOpen: true,
          isH24: true,
          hoursText: 'H24 (24h/24)',
          shifts: [{ start: '00:00', end: '24:00', startMinutes: 0, endMinutes: 1440 }],
          isToday,
        };
      }
      return {
        dayIndex: dayIdx,
        dayShort: shortNames[dayIdx],
        dayLetter: letters[dayIdx],
        dayFull: NOMI_GIORNI_LABEL[dayIdx],
        isOpen: true,
        hoursText: rawOrari || 'Orario continuato',
        shifts: [],
        isToday,
      };
    }

    const shifts: ScheduleShift[] = dayIntervals.map((i) => ({
      start: minutesToTimeString(i.start),
      end: minutesToTimeString(i.end),
      startMinutes: i.start,
      endMinutes: i.end,
      isMorning: i.start < 13 * 60,
      isAfternoon: i.start >= 13 * 60,
    }));
    const hoursText = shifts.map((s) => `${s.start} - ${s.end}`).join(' / ');

    return {
      dayIndex: dayIdx,
      dayShort: shortNames[dayIdx],
      dayLetter: letters[dayIdx],
      dayFull: NOMI_GIORNI_LABEL[dayIdx],
      isOpen: true,
      isContinuous: shifts.length === 1,
      hoursText,
      shifts,
      isToday,
    };
  });
}
