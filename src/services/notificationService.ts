import { AppNotification } from '../types';

const NOTIFICATIONS_STORAGE_KEY = 'cdq_notifications_history';
const NOTIFICATION_ICON = 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=128&q=80';

/**
 * Verifica se l'API Notification del browser è supportata nel contesto corrente
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Restituisce lo stato attuale del permesso delle notifiche
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Richiede all'utente il permesso di mostrare notifiche del browser
 */
export async function requestBrowserNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Errore durante la richiesta permessi notifiche:', error);
    return Notification.permission;
  }
}

/**
 * Recupera lo storico delle notifiche salvate in locale
 */
export function getStoredNotifications(): AppNotification[] {
  try {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Errore nel recupero notifiche salvate:', err);
  }
  return [];
}

/**
 * Salva la lista di notifiche in locale
 */
export function saveStoredNotifications(notifiche: AppNotification[]): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifiche.slice(0, 50)));
    }
  } catch (err) {
    console.error('Errore nel salvataggio delle notifiche:', err);
  }
}

/**
 * Invia una notifica browser (se permessi concessi) e la registra nello storico dell'app
 */
export function triggerNotification(params: {
  titolo: string;
  messaggio: string;
  tipo: 'proposta_voti' | 'segnalazione_stato' | 'commercio_approvato' | 'sistema';
  targetId?: number;
}): AppNotification {
  const now = new Date();
  const nuovaNotifica: AppNotification = {
    id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    tipo: params.tipo,
    titolo: params.titolo,
    messaggio: params.messaggio,
    timestamp: Date.now(),
    dataOra: now.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }),
    letta: false,
    targetId: params.targetId,
  };

  // 1. Salva nello storico locale
  const attuali = getStoredNotifications();
  const aggiornate = [nuovaNotifica, ...attuali];
  saveStoredNotifications(aggiornate);

  // 2. Emetti notifica nativa del browser se supportata e permessa
  if (isNotificationSupported() && Notification.permission === 'granted') {
    try {
      const nativeNotif = new Notification(params.titolo, {
        body: params.messaggio,
        icon: NOTIFICATION_ICON,
        badge: NOTIFICATION_ICON,
        tag: `cdq_${params.tipo}_${params.targetId || Date.now()}`,
      });

      nativeNotif.onclick = () => {
        if (typeof window !== 'undefined') {
          window.focus();
        }
        nativeNotif.close();
      };
    } catch (err) {
      console.warn('Invio notifica nativa browser non riuscito (es. restrizione iframe):', err);
    }
  }

  // 3. Notifica componenti interni tramite CustomEvent
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('cdq:new-notification', {
        detail: nuovaNotifica,
      })
    );
  }

  return nuovaNotifica;
}

/**
 * Segna tutte le notifiche come lette
 */
export function markAllNotificationsAsRead(): void {
  const notif = getStoredNotifications().map((n) => ({ ...n, letta: true }));
  saveStoredNotifications(notif);
}

/**
 * Elimina tutto lo storico notifiche
 */
export function clearAllNotifications(): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
    }
  } catch (err) {
    console.error('Errore pulizia notifiche:', err);
  }
}
