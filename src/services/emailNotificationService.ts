/**
 * Servizio di Notifica Email per l'Associazione di Quartiere Villaggio Prenestino
 * Indirizzo di notifica: associazione@villaggioprenestino.it
 */

export const ASSOCIAZIONE_EMAIL = 'associazione@villaggioprenestino.it';

export interface EmailNotificationRecord {
  id: string;
  timestamp: string;
  tipo: 'segnalazione' | 'commercio' | 'test';
  destinatario: string;
  oggetto: string;
  corpo: string;
  stato: 'inviata' | 'in_coda';
}

const STORAGE_KEY = 'vp_email_notifications_history_v1';

export function getEmailNotificationHistory(): EmailNotificationRecord[] {
  try {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Errore nel recupero storico email notifiche:', err);
  }
  return [];
}

export function saveEmailNotificationRecord(record: EmailNotificationRecord): void {
  try {
    if (typeof window === 'undefined') return;
    const current = getEmailNotificationHistory();
    const updated = [record, ...current].slice(0, 50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Errore nel salvataggio storico email notifica:', err);
  }
}

/**
 * Prepara e registra la notifica email per una nuova segnalazione cittadina
 */
export async function notifyAssociazioneNewSegnalazione(data: {
  id?: number;
  titolo: string;
  luogo: string;
  descrizione: string;
  nome?: string;
  telefono?: string;
  fotoCount?: number;
}): Promise<{ success: boolean; email: string; oggetto: string }> {
  const oggetto = `📢 Nuova Segnalazione Cittadina: ${data.titolo} - ${data.luogo}`;
  const corpo = `Gentile Associazione di Quartiere Villaggio Prenestino,

È appena stata inserita una nuova segnalazione tramite la Web App di Quartiere:

📌 Titolo: ${data.titolo}
📍 Luogo: ${data.luogo}
📝 Descrizione:
${data.descrizione}

👤 Cittadino segnalatore: ${data.nome || 'Anonimo'}
📞 Recapito telefonico: ${data.telefono || 'Non specificato'}
📸 Foto allegate: ${data.fotoCount ?? 0} immagine/i
🗓️ Data: ${new Date().toLocaleString('it-IT')}

Gestisci e prendi in carico la segnalazione dalla bacheca di moderazione della Web App o dal pannello WordPress del sito www.villaggioprenestino.it/wp-admin.

--
Web App Associazione di Quartiere Villaggio Prenestino
www.villaggioprenestino.it`;

  const record: EmailNotificationRecord = {
    id: 'email_seg_' + Date.now(),
    timestamp: new Date().toISOString(),
    tipo: 'segnalazione',
    destinatario: ASSOCIAZIONE_EMAIL,
    oggetto,
    corpo,
    stato: 'inviata',
  };

  saveEmailNotificationRecord(record);

  // Invia al backend WordPress se connesso
  try {
    const wpBase = localStorage.getItem('vp_config_v1');
    let baseUrl = 'https://villaggioprenestino.it';
    if (wpBase) {
      const parsed = JSON.parse(wpBase);
      if (parsed.baseUrl) baseUrl = parsed.baseUrl.replace(/\/+$/, '');
    }

    fetch(`${baseUrl}/wp-json/vp/v1/notify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: ASSOCIAZIONE_EMAIL,
        subject: oggetto,
        message: corpo,
        tipo: 'segnalazione',
      }),
    }).catch(() => {
      // Ignora errori di rete se offline, il record locale è comunque conservato
    });
  } catch {
    // ignore
  }

  return { success: true, email: ASSOCIAZIONE_EMAIL, oggetto };
}

/**
 * Prepara e registra la notifica email per una nuova attività commerciale
 */
export async function notifyAssociazioneNewAttivita(data: {
  nome: string;
  categoria: string;
  indirizzo: string;
  telefono: string;
  whatsapp?: string;
  orari?: string;
  descrizione?: string;
  offertaTitolo?: string;
  offertaDettaglio?: string;
  nomeReferente?: string;
  emailReferente?: string;
}): Promise<{ success: boolean; email: string; oggetto: string }> {
  const oggetto = `🏪 Nuova Attività Commerciale da approvare: ${data.nome} (${data.categoria})`;
  const corpo = `Gentile Associazione di Quartiere Villaggio Prenestino,

È stata registrata una nuova bottega / attività commerciale tramite la Web App di Quartiere in attesa di moderazione:

🏪 Nome attività: ${data.nome}
🏷️ Categoria: ${data.categoria.toUpperCase()}
📍 Indirizzo: ${data.indirizzo}
📞 Telefono: ${data.telefono}
💬 WhatsApp: ${data.whatsapp || 'Non indicato'}
🕒 Orari: ${data.orari || 'Non indicati'}

👤 Nome Referente: ${data.nomeReferente || 'Non specificato'}
✉️ Email Referente: ${data.emailReferente || 'Non specificata'}

🎁 Offerta per i residenti:
${data.offertaTitolo ? `${data.offertaTitolo} - ${data.offertaDettaglio || ''}` : 'Nessuna offerta specificata'}

📝 Note / Descrizione:
${data.descrizione || 'Nessuna descrizione aggiuntiva'}

🗓️ Ricevuta il: ${new Date().toLocaleString('it-IT')}

L'attività è attualmente in attesa di approvazione. Puoi approvarla o rifiutarla dall'apposito pannello "Plugin WordPress" nella Web App o da WordPress in www.villaggioprenestino.it/wp-admin.

--
Web App Associazione di Quartiere Villaggio Prenestino
www.villaggioprenestino.it`;

  const record: EmailNotificationRecord = {
    id: 'email_att_' + Date.now(),
    timestamp: new Date().toISOString(),
    tipo: 'commercio',
    destinatario: ASSOCIAZIONE_EMAIL,
    oggetto,
    corpo,
    stato: 'inviata',
  };

  saveEmailNotificationRecord(record);

  // Invia al backend WordPress se connesso
  try {
    const wpBase = localStorage.getItem('vp_config_v1');
    let baseUrl = 'https://villaggioprenestino.it';
    if (wpBase) {
      const parsed = JSON.parse(wpBase);
      if (parsed.baseUrl) baseUrl = parsed.baseUrl.replace(/\/+$/, '');
    }

    fetch(`${baseUrl}/wp-json/vp/v1/notify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: ASSOCIAZIONE_EMAIL,
        subject: oggetto,
        message: corpo,
        tipo: 'commercio',
      }),
    }).catch(() => {
      // Ignora errori di rete se offline
    });
  } catch {
    // ignore
  }

  return { success: true, email: ASSOCIAZIONE_EMAIL, oggetto };
}

/**
 * Genera URL mailto per aprire il client di posta dell'utente precompilato
 */
export function getMailtoLink(subject: string, body: string): string {
  return `mailto:${ASSOCIAZIONE_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
