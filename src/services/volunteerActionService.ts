export interface AzioneVolontariato {
  id: string;
  tipo: 'adesione' | 'candidatura_albo' | 'nuova_iniziativa';
  titolo: string;
  luogo?: string;
  volontarioNome: string;
  telefono?: string;
  dataOra: string;
  timestamp: number;
  dettaglio?: string;
}

const STORAGE_KEY = 'vp_volunteer_actions_log_v1';

/**
 * Recupera le ultime azioni di volontariato salvate in tempo reale
 */
export function getRecentVolunteerActions(limit = 5): AzioneVolontariato[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: AzioneVolontariato[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(0, limit);
      }
    }
  } catch (e) {
    console.error('Errore recupero azioni volontariato:', e);
  }

  // Azioni di default basate sulla community di Villaggio Prenestino
  const defaultActions: AzioneVolontariato[] = [
    {
      id: 'vol_seed_1',
      tipo: 'adesione',
      titolo: 'Pulizia sentiero e potatura rami',
      luogo: 'Parco Via Fosso dell\'Osa',
      volontarioNome: 'Marco R.',
      telefono: '348 ••• •129',
      dataOra: 'Oggi alle 10:15',
      timestamp: Date.now() - 1000 * 60 * 45,
      dettaglio: 'Ha confermato la presenza con guanti e cesoie',
    },
    {
      id: 'vol_seed_2',
      tipo: 'candidatura_albo',
      titolo: 'Iscrizione Albo Volontari',
      luogo: 'Quartiere Villaggio Prenestino',
      volontarioNome: 'Elena B.',
      telefono: '333 ••• •842',
      dataOra: 'Oggi alle 08:30',
      timestamp: Date.now() - 1000 * 60 * 150,
      dettaglio: 'Disponibilità per: Cura del verde e Eventi di quartiere',
    },
    {
      id: 'vol_seed_3',
      tipo: 'adesione',
      titolo: 'Supporto raccolta alimentare residenti',
      luogo: 'Piazza del Quartiere',
      volontarioNome: 'Fabio T.',
      telefono: '320 ••• •905',
      dataOra: 'Ieri alle 17:40',
      timestamp: Date.now() - 1000 * 60 * 60 * 18,
      dettaglio: 'Disponibile per carico scatoloni e distribuzione',
    },
    {
      id: 'vol_seed_4',
      tipo: 'candidatura_albo',
      titolo: 'Iscrizione Albo Volontari',
      luogo: 'Villaggio Prenestino',
      volontarioNome: 'Chiara M.',
      telefono: '347 ••• •661',
      dataOra: 'Ieri alle 11:20',
      timestamp: Date.now() - 1000 * 60 * 60 * 25,
      dettaglio: 'Disponibilità per: Comunicazione social e foto eventi',
    },
    {
      id: 'vol_seed_5',
      tipo: 'nuova_iniziativa',
      titolo: 'Manutenzione panchine e staccionata',
      luogo: 'Area Giochi Via Prenestina',
      volontarioNome: 'Direttivo Associazione',
      dataOra: '2 giorni fa',
      timestamp: Date.now() - 1000 * 60 * 60 * 48,
      dettaglio: 'Aperta ricerca per 4 volontari per verniciatura',
    },
  ];

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultActions));
  } catch {
    // ignore
  }

  return defaultActions.slice(0, limit);
}

/**
 * Registra una nuova azione di volontariato in tempo reale
 */
export function recordVolunteerAction(action: Omit<AzioneVolontariato, 'id' | 'timestamp' | 'dataOra'> & { dataOra?: string }): AzioneVolontariato {
  const current = getRecentVolunteerActions(20);
  const now = Date.now();
  
  const timeStr = action.dataOra || 'Pochi istanti fa';
  const newAction: AzioneVolontariato = {
    ...action,
    id: 'vol_' + now + '_' + Math.random().toString(36).substring(2, 6),
    timestamp: now,
    dataOra: timeStr,
  };

  const updated = [newAction, ...current].slice(0, 30);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    // Trigger evento browser per aggiornare all'istante qualsiasi componente in ascolto
    window.dispatchEvent(new CustomEvent('cdq:new-volunteer-action', { detail: newAction }));
  } catch (e) {
    console.error('Errore salvataggio azione volontariato:', e);
  }

  return newAction;
}
