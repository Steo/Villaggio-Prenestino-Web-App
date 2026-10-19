import React, { useState, useEffect, useRef } from 'react';
import {
  WpArticle,
  EventoQuartiere,
  RichiestaVolontariato,
  SegnalazioneCittadina,
  PropostaCittadina,
  CandidaturaVolontario,
  UserInteractions,
  TipoEvento,
  AppNotification,
  StatoSegnalazione,
  AppTabsConfig,
  DEFAULT_TABS_CONFIG,
} from './types';
import {
  fetchAllData,
  getUserInteractions,
  saveUserInteractions,
  submitInteraction,
  submitSegnalazione,
  submitCandidaturaVolontario,
  submitProposta,
  getWpConfig,
  saveWpConfig,
  adminCreateEvento,
  adminUpdateSegnalazioneStato,
  adminUpdateSegnalazioneModerazione,
  adminUpdatePropostaModerazione,
  adminCreateRichiesta,
  syncCitizenPointsToWp,
  submitAttivitaCommercio,
  getAppTabsConfig,
  setAppTabStatus,
} from './services/wpService';
import {
  triggerNotification,
  getStoredNotifications,
  markAllNotificationsAsRead,
  clearAllNotifications,
  isNotificationSupported,
  getNotificationPermission,
  requestBrowserNotificationPermission,
} from './services/notificationService';
import { Header } from './components/Header';
import { HomeTab } from './components/HomeTab';
import { EventiTab } from './components/EventiTab';
import { SegnalazioniTab } from './components/SegnalazioniTab';
import { VolontariatoTab } from './components/VolontariatoTab';
import { ProposteAltroTab } from './components/ProposteAltroTab';
import { CommercioTab } from './components/CommercioTab';
import { VolunteerContactModal } from './components/VolunteerContactModal';
import { PhotoLightbox } from './components/PhotoLightbox';
import { WpPluginPanel } from './components/WpPluginPanel';
import { AdminAccessModal } from './components/AdminAccessModal';
import { PuntiCiviciModal } from './components/PuntiCiviciModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { ExportModal } from './components/ExportModal';
import { PwaInstallBanner } from './components/PwaInstallBanner';
import { GuidaTourModal } from './components/GuidaTourModal';
import { RejectionNoticeModal, RejectedItemNotice } from './components/RejectionNoticeModal';
import { AttivitaCommercio } from './types';
import {
  NuovoLivelloModal,
  LivelloCommunity,
  getLivelloFromPunti,
  LIVELLO_RANKS,
} from './components/NuovoLivelloModal';

import {
  Home,
  Calendar,
  Camera,
  HeartHandshake,
  Lightbulb,
  Sparkles,
  Store,
} from 'lucide-react';

export type TabType = 'home' | 'eventi' | 'commercio' | 'segnalazioni' | 'volontariato' | 'proposte';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [tabsConfig, setTabsConfig] = useState<AppTabsConfig>(getAppTabsConfig);
  const [interactions, setInteractions] = useState<UserInteractions>(getUserInteractions);

  // Se l'amministratore disattiva la scheda attualmente aperta, torna automaticamente alla Home
  useEffect(() => {
    if (activeTab !== 'home' && tabsConfig[activeTab] === false) {
      setActiveTab('home');
    }
  }, [tabsConfig, activeTab]);

  const handleToggleTab = async (tab: keyof AppTabsConfig) => {
    const currentVal = tabsConfig[tab] !== false;
    const nextVal = !currentVal;
    const updated = await setAppTabStatus(tab, nextVal);
    setTabsConfig(updated);
    const tabLabels: Record<keyof AppTabsConfig, string> = {
      eventi: 'Eventi',
      segnalazioni: 'Segnalazioni',
      commercio: 'Commercianti',
      volontariato: 'Volontari',
      proposte: 'Idee e Proposte',
    };
    showToast(nextVal ? `Scheda "${tabLabels[tab]}" attivata nell'app!` : `Scheda "${tabLabels[tab]}" disattivata nell'app.`);
  };

  // Modalità Scura / Chiara
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vp_dark_mode');
      if (saved !== null) {
        return saved === 'true';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    try {
      localStorage.setItem('vp_dark_mode', darkMode ? 'true' : 'false');
    } catch {
      // Ignora errori di storage
    }
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  // App Data
  const [news, setNews] = useState<WpArticle[]>([]);
  const [eventi, setEventi] = useState<EventoQuartiere[]>([]);
  const [richieste, setRichieste] = useState<RichiestaVolontariato[]>([]);
  const [segnalazioni, setSegnalazioni] = useState<SegnalazioneCittadina[]>([]);
  const [proposte, setProposte] = useState<PropostaCittadina[]>([]);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  // Vetrina Commercio & Mappa Attività (Sincronizzata con database WordPress)
  const [attivitaCommercio, setAttivitaCommercio] = useState<AttivitaCommercio[]>(() => {
    try {
      const saved = localStorage.getItem('vp_attivita_commercio');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  // Voto Mi piace per attività commerciale: UNIVOCE, massimo 1 volta per ogni attività per utente
  const handleVoteAttivita = (attivita: AttivitaCommercio) => {
    // Controllo se già consigliata sia nello state che nel localStorage
    const stored = getUserInteractions();
    const currentVoted = Array.from(new Set([
      ...(interactions.negoziVotati || []),
      ...(stored.negoziVotati || []),
    ]));

    if (currentVoted.includes(attivita.id)) {
      showToast(`Hai già consigliato "${attivita.nome}"!`);
      return;
    }

    const nextVoted = [...currentVoted, attivita.id];

    // Incrementa di 1 il contatore e salva
    setAttivitaCommercio((prev) => {
      const next = prev.map((a) =>
        a.id === attivita.id ? { ...a, miPiace: (a.miPiace || 0) + 1 } : a
      );
      try {
        localStorage.setItem('vp_attivita_commercio', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });

    // Invia al server se disponibile
    submitInteraction({ tipo: 'negozio_vota', postId: attivita.id }).catch(() => {});

    // Salva atomicamente la lista dei negozi votati insieme all'accredito di +2 Punti Civici
    addPunti(2, 'Mi piace a un commerciante', { negoziVotati: nextVoted });
    showToast(`Hai consigliato "${attivita.nome}"! (+2 punti civici)`);
  };

  const handleAggiungiAttivita = async (nuova: AttivitaCommercio) => {
    // Invio sincrono/asincrono verso l'API WordPress (salvata come pending/in attesa)
    try {
      await submitAttivitaCommercio({
        nome: nuova.nome,
        categoria: nuova.categoria,
        indirizzo: nuova.indirizzo,
        telefono: nuova.telefono,
        whatsapp: nuova.whatsapp || '',
        orari: nuova.orari,
        descrizione: nuova.descrizione,
        offertaTitolo: nuova.offertaAttiva?.titolo || '',
        offertaDettaglio: nuova.offertaAttiva?.dettaglio || '',
        nomeReferente: nuova.nomeReferente,
        emailReferente: nuova.emailReferente,
        lat: nuova.lat,
        lng: nuova.lng,
        immagine: nuova.immagine,
        logo: nuova.logo,
      });
    } catch (e) {
      console.warn('Errore invio commercio a WP:', e);
    }

    setAttivitaCommercio((prev) => {
      const updated = [nuova, ...prev];
      try {
        localStorage.setItem('vp_attivita_commercio', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });

    const updatedMie = Array.from(new Set([...(interactions.mieAttivita || []), nuova.id]));
    addPunti(5, 'Registrazione nuova attività commerciale', { mieAttivita: updatedMie });
    showToast('Bottega registrata! Notifica email inviata ad associazione@villaggioprenestino.it');
  };

  const handleApprovaAttivita = (id: number) => {
    setAttivitaCommercio((prev) => {
      const updated = prev.map((item) =>
        item.id === id
          ? {
              ...item,
              statoApprovazione: 'approvata' as const,
              verificato: true,
            }
          : item
      );
      try {
        localStorage.setItem('vp_attivita_commercio', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
    showToast('Attività commerciale approvata con successo! Ora è pubblica per tutti i residenti.');
  };

  const handleUpdateAttivita = (id: number, updatedData: Partial<AttivitaCommercio>) => {
    setAttivitaCommercio((prev) => {
      const updated = prev.map((item) =>
        item.id === id ? { ...item, ...updatedData } : item
      );
      try {
        localStorage.setItem('vp_attivita_commercio', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
    showToast('Scheda attività commerciale aggiornata con successo!');
  };

  // Volunteer contact modal state
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    tipo: 'evento_vengo' | 'cisono';
    id: number;
    titolo: string;
    totalJoined: number;
    targetJoined?: number;
    tipoEvento?: TipoEvento;
    quota?: string;
  } | null>(null);

  // WordPress Plugin & Insight Backend Panel state
  const [wpPanelOpen, setWpPanelOpen] = useState(false);
  const [wpConfig, setWpConfig] = useState(getWpConfig);

  // Modalità Amministratore Riservata (Opzione A): Nascosta di default per i normali cittadini
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (
          params.get('admin') === 'true' ||
          params.get('admin') === '1' ||
          window.location.hash === '#admin'
        ) {
          localStorage.setItem('cdq_admin_mode', 'true');
          return true;
        }
        return localStorage.getItem('cdq_admin_mode') === 'true';
      }
    } catch {
      // ignore
    }
    return false;
  });
  const [adminAccessModalOpen, setAdminAccessModalOpen] = useState(false);
  const [puntiModalOpen, setPuntiModalOpen] = useState(false);
  const [levelUpModalOpen, setLevelUpModalOpen] = useState(false);
  const [unlockedLevel, setUnlockedLevel] = useState<LivelloCommunity>('Vicino Attivo');
  const [unlockedLevelPoints, setUnlockedLevelPoints] = useState<number>(0);

  // Centro Notifiche del Browser
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(getStoredNotifications);

  // Modale Esportazione Plugin & Web App ZIP
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // Guida Tour Interattiva Onboarding
  const [tourModalOpen, setTourModalOpen] = useState(false);

  // Pop-up Avviso Rifiuto per l'utente all'avvio dell'app
  const [userRejectedItemNotice, setUserRejectedItemNotice] = useState<RejectedItemNotice | null>(null);

  // Controllo primo avvio per mostrare la guida interattiva
  useEffect(() => {
    try {
      const tourCompletato = localStorage.getItem('vp_tour_completato');
      if (!tourCompletato) {
        const timer = setTimeout(() => {
          setTourModalOpen(true);
        }, 750);
        return () => clearTimeout(timer);
      }
    } catch {
      // ignore
    }
  }, []);

  // Snapshot precedenti per rilevare variazioni sui dati salvati / sincronizzati
  const prevProposalVotesRef = useRef<Record<number, number>>({});
  const prevReportStatusesRef = useRef<Record<number, StatoSegnalazione>>({});
  const isInitialProposteLoad = useRef(true);
  const isInitialSegnalazioniLoad = useRef(true);

  // Sincronizzazione notifiche all'evento globale
  useEffect(() => {
    const handleNewNotif = () => {
      setNotifications(getStoredNotifications());
    };
    window.addEventListener('cdq:new-notification', handleNewNotif);
    return () => {
      window.removeEventListener('cdq:new-notification', handleNewNotif);
    };
  }, []);

  // Monitoraggio variazioni voti su "le mie proposte"
  useEffect(() => {
    if (proposte.length === 0) return;

    if (isInitialProposteLoad.current) {
      proposte.forEach((p) => {
        prevProposalVotesRef.current[p.id] = p.v;
      });
      isInitialProposteLoad.current = false;
      return;
    }

    const miePropIds = interactions.mieProposte || [];
    proposte.forEach((p) => {
      if (miePropIds.includes(p.id)) {
        const prevVotes = prevProposalVotesRef.current[p.id];
        if (prevVotes !== undefined && p.v > prevVotes) {
          const delta = p.v - prevVotes;
          triggerNotification({
            tipo: 'proposta_voti',
            titolo: '🎉 Nuovi voti per la tua proposta!',
            messaggio: `La tua proposta "${p.t}" ha ricevuto ${delta === 1 ? '1 nuovo voto' : `${delta} nuovi voti`} dalla comunità! (Totale: ${p.v} voti)`,
            targetId: p.id,
          });
          showToast(`🔔 Notifica browser: Nuovi voti per "${p.t.substring(0, 26)}..."`);
        }
      }
      prevProposalVotesRef.current[p.id] = p.v;
    });
  }, [proposte, interactions.mieProposte]);

  // Monitoraggio variazioni stato su "le mie segnalazioni"
  useEffect(() => {
    if (segnalazioni.length === 0) return;

    if (isInitialSegnalazioniLoad.current) {
      segnalazioni.forEach((s) => {
        prevReportStatusesRef.current[s.id] = s.s;
      });
      isInitialSegnalazioniLoad.current = false;
      return;
    }

    const mieSegnIds = interactions.mieSegnalazioni || [];
    segnalazioni.forEach((s) => {
      if (mieSegnIds.includes(s.id)) {
        const prevStato = prevReportStatusesRef.current[s.id];
        if (prevStato !== undefined && s.s !== prevStato) {
          const statoTesto =
            s.s === 1
              ? 'Ricevuta dall\'Associazione'
              : s.s === 2
              ? 'Inoltrata all\'ente preposto (Municipio VI)'
              : 'Risolta con successo!';
          triggerNotification({
            tipo: 'segnalazione_stato',
            titolo: '📋 Aggiornamento Segnalazione!',
            messaggio: `La tua segnalazione "${s.t}" è passata allo stato: ${statoTesto}.`,
            targetId: s.id,
          });
          showToast(`🔔 Notifica browser: Segnalazione passata a "${statoTesto}"`);
        }
      }
      prevReportStatusesRef.current[s.id] = s.s;
    });
  }, [segnalazioni, interactions.mieSegnalazioni]);

  // Simulazione Nuovo Voto per una proposta dell'utente (per test rapido notifiche)
  const handleSimulateProposalVote = (targetProposalId?: number) => {
    const targetId =
      targetProposalId ||
      (interactions.mieProposte && interactions.mieProposte[0]) ||
      (proposte[0] ? proposte[0].id : 1);

    if (!interactions.mieProposte?.includes(targetId)) {
      const updated = {
        ...interactions,
        mieProposte: [...(interactions.mieProposte || []), targetId],
      };
      setInteractions(updated);
      saveUserInteractions(updated);
    }

    setProposte((prev) =>
      prev.map((p) => (p.id === targetId ? { ...p, v: p.v + 1 } : p))
    );
  };

  // Simulazione Avanzamento Stato per una segnalazione dell'utente (per test rapido notifiche)
  const handleSimulateReportStatusChange = async (targetReportId?: number) => {
    const targetId =
      targetReportId ||
      (interactions.mieSegnalazioni && interactions.mieSegnalazioni[0]) ||
      (segnalazioni[0] ? segnalazioni[0].id : 1);

    if (!interactions.mieSegnalazioni?.includes(targetId)) {
      const updated = {
        ...interactions,
        mieSegnalazioni: [...(interactions.mieSegnalazioni || []), targetId],
      };
      setInteractions(updated);
      saveUserInteractions(updated);
    }

    const segCorrente = segnalazioni.find((s) => s.id === targetId);
    const prossimoStato: StatoSegnalazione =
      !segCorrente || segCorrente.s === 3 ? 1 : ((segCorrente.s + 1) as StatoSegnalazione);

    await adminUpdateSegnalazioneStato(targetId, prossimoStato);
    setSegnalazioni((prev) =>
      prev.map((s) => (s.id === targetId ? { ...s, s: prossimoStato } : s))
    );
  };

  // Test invio notifica generica di prova
  const handleTestNotification = () => {
    triggerNotification({
      tipo: 'sistema',
      titolo: '🔔 Test Notifiche Quartiere',
      messaggio: 'Il sistema di notifica è attivo e sincronizzato con il tuo browser!',
    });
    showToast('🔔 Notifica di test inviata!');
  };

  // Toast feedback
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleUpdateUserNome = (nome: string) => {
    const updated: UserInteractions = {
      ...interactions,
      contattiSalvati: {
        nome,
        telefono: interactions.contattiSalvati?.telefono || '',
      },
    };
    setInteractions(updated);
    saveUserInteractions(updated);
    showToast(`Nome salvato per la classifica: ${nome}`);
    syncCitizenPointsToWp(nome, interactions.puntiCivici, 'Cittadino attivo');
  };

  const handleActivateAdmin = () => {
    setIsAdmin(true);
    try {
      localStorage.setItem('cdq_admin_mode', 'true');
    } catch {
      // ignore
    }
    showToast('🛠️ Modalità Amministratore attivata!');
  };

  const handleDeactivateAdmin = () => {
    setIsAdmin(false);
    try {
      localStorage.removeItem('cdq_admin_mode');
    } catch {
      // ignore
    }
    setWpPanelOpen(false);
    showToast('Modalità Amministratore disattivata. Vista cittadino attiva.');
  };

  const handleUpdateSegnalazioneModerazione = async (
    id: number,
    statoApprovazione: 'approvata' | 'rifiutata' | 'in_attesa',
    motivazioneRifiuto?: string
  ) => {
    await adminUpdateSegnalazioneModerazione(id, statoApprovazione, motivazioneRifiuto);
    setSegnalazioni((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, statoApprovazione, motivazioneRifiuto: motivazioneRifiuto || '' }
          : s
      )
    );

    if (statoApprovazione === 'rifiutata') {
      const seg = segnalazioni.find((s) => s.id === id);
      const title = seg ? seg.t : 'Segnalazione';
      triggerNotification({
        tipo: 'segnalazione_stato',
        titolo: '❌ Segnalazione non approvata',
        messaggio: `La tua segnalazione "${title}" è stata rifiutata dall'amministratore. Motivazione: "${motivazioneRifiuto || 'Non conforme alle linee guida.'}"`,
        targetId: id,
      });
      showToast(`Segnalazione #${id} rifiutata. Notifica inviata al mittente.`);
    } else if (statoApprovazione === 'approvata') {
      const seg = segnalazioni.find((s) => s.id === id);
      const title = seg ? seg.t : 'Segnalazione';
      triggerNotification({
        tipo: 'segnalazione_stato',
        titolo: '✅ Segnalazione Approvata!',
        messaggio: `La tua segnalazione "${title}" è stata approvata e pubblicata nell'app di quartiere.`,
        targetId: id,
      });
      showToast('Segnalazione approvata e pubblicata con successo!');
    }
  };

  const handleUpdatePropostaModerazione = async (
    id: number,
    statoApprovazione: 'approvata' | 'rifiutata' | 'in_attesa',
    motivazioneRifiuto?: string
  ) => {
    await adminUpdatePropostaModerazione(id, statoApprovazione, motivazioneRifiuto);
    setProposte((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, statoApprovazione, motivazioneRifiuto: motivazioneRifiuto || '' }
          : p
      )
    );

    if (statoApprovazione === 'rifiutata') {
      const prop = proposte.find((p) => p.id === id);
      const title = prop ? prop.t : 'Proposta';
      triggerNotification({
        tipo: 'proposta_voti',
        titolo: '❌ Proposta non approvata',
        messaggio: `La tua proposta "${title}" è stata rifiutata dall'amministratore. Motivazione: "${motivazioneRifiuto || 'Non conforme alle linee guida.'}"`,
        targetId: id,
      });
      showToast(`Proposta #${id} rifiutata. Notifica inviata al mittente.`);
    } else if (statoApprovazione === 'approvata') {
      const prop = proposte.find((p) => p.id === id);
      const title = prop ? prop.t : 'Proposta';
      triggerNotification({
        tipo: 'proposta_voti',
        titolo: '✅ Proposta Approvata!',
        messaggio: `La tua proposta "${title}" è stata approvata e pubblicata nell'app di quartiere.`,
        targetId: id,
      });
      showToast('Proposta approvata e pubblicata con successo!');
    }
  };

  // Controllo avviso di rifiuto per l'utente all'avvio dell'app o dopo la moderazione
  useEffect(() => {
    if (loadingData) return;
    try {
      const acknowledgedRaw = localStorage.getItem('vp_acknowledged_rejections');
      const acknowledged: number[] = acknowledgedRaw ? JSON.parse(acknowledgedRaw) : [];

      const mieSegn = interactions.mieSegnalazioni || [];
      const mieProp = interactions.mieProposte || [];

      // Cerca segnalazioni rifiutate inviate da me non ancora lette
      const rejectedSeg = segnalazioni.find(
        (s) =>
          mieSegn.includes(s.id) &&
          s.statoApprovazione === 'rifiutata' &&
          !acknowledged.includes(s.id)
      );

      if (rejectedSeg) {
        setUserRejectedItemNotice({
          id: rejectedSeg.id,
          type: 'segnalazione',
          titolo: rejectedSeg.t,
          motivazione: rejectedSeg.motivazioneRifiuto || 'Non conforme alle linee guida della comunità.',
          data: rejectedSeg.data,
        });
        return;
      }

      // Cerca proposte rifiutate inviate da me non ancora lette
      const rejectedProp = proposte.find(
        (p) =>
          mieProp.includes(p.id) &&
          p.statoApprovazione === 'rifiutata' &&
          !acknowledged.includes(p.id)
      );

      if (rejectedProp) {
        setUserRejectedItemNotice({
          id: rejectedProp.id,
          type: 'proposta',
          titolo: rejectedProp.t,
          motivazione: rejectedProp.motivazioneRifiuto || 'Non conforme alle linee guida della comunità.',
          data: rejectedProp.data,
        });
      }
    } catch {
      // ignore
    }
  }, [segnalazioni, proposte, interactions.mieSegnalazioni, interactions.mieProposte, loadingData]);

  const handleAcknowledgeRejection = (id: number) => {
    try {
      const acknowledgedRaw = localStorage.getItem('vp_acknowledged_rejections');
      const acknowledged: number[] = acknowledgedRaw ? JSON.parse(acknowledgedRaw) : [];
      if (!acknowledged.includes(id)) {
        acknowledged.push(id);
        localStorage.setItem('vp_acknowledged_rejections', JSON.stringify(acknowledged));
      }
    } catch {
      // ignore
    }
    setUserRejectedItemNotice(null);
  };

  const loadData = async () => {
    setLoadingData(true);
    try {
      const data = await fetchAllData();
      setNews(data.news);
      setEventi(data.eventi);
      setRichieste(data.richieste);
      setSegnalazioni(data.segnalazioni);
      setProposte(data.proposte);
      if (data.schedeAttive) {
        setTabsConfig(data.schedeAttive);
      }
      if (Array.isArray(data.commercio)) {
        setAttivitaCommercio(data.commercio);
        try {
          localStorage.setItem('vp_attivita_commercio', JSON.stringify(data.commercio));
        } catch {
          // ignore
        }
      }
    } catch (err) {
      console.error('Errore durante il caricamento dati:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadData();

    // Rileva parametro ?admin=true o #admin nell'URL all'avvio
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (
          params.get('admin') === 'true' ||
          params.get('admin') === '1' ||
          window.location.hash === '#admin'
        ) {
          setIsAdmin(true);
          localStorage.setItem('cdq_admin_mode', 'true');
          showToast('🛠️ Benvenuto Amministratore! Dashboard sbloccata.');
          // Pulisce l'URL senza ricaricare la pagina
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    } catch {
      // ignore
    }

    // Inizializza il livello noto al primo avvio per evitare popup non richiesti
    try {
      const stored = localStorage.getItem('vp_last_known_level');
      if (!stored) {
        const currentLevel = getLivelloFromPunti(interactions.puntiCivici);
        localStorage.setItem('vp_last_known_level', currentLevel);
      }
    } catch {
      // ignore
    }
  }, []);

  const addPunti = (
    punti: number,
    motivazione: string,
    extraUpdates?: Partial<UserInteractions>
  ) => {
    setInteractions((prev) => {
      const oldPunti = prev.puntiCivici;
      const newPunti = oldPunti + punti;
      const updated: UserInteractions = {
        ...prev,
        ...extraUpdates,
        puntiCivici: newPunti,
      };
      saveUserInteractions(updated);
      syncCitizenPointsToWp(
        updated.contattiSalvati?.nome || '',
        newPunti,
        motivazione
      );

      // Verifica se il volontario raggiunge un nuovo livello della community
      const oldLevel = getLivelloFromPunti(oldPunti);
      const newLevel = getLivelloFromPunti(newPunti);

      let lastKnownLevel: LivelloCommunity = oldLevel;
      try {
        const stored = localStorage.getItem('vp_last_known_level') as LivelloCommunity | null;
        if (stored && LIVELLO_RANKS[stored] !== undefined) {
          lastKnownLevel = stored;
        }
      } catch {
        // ignore
      }

      if (LIVELLO_RANKS[newLevel] > LIVELLO_RANKS[lastKnownLevel]) {
        // Passaggio di livello: mostra il pop up congratulazioni con i colori del livello raggiunto
        setUnlockedLevel(newLevel);
        setUnlockedLevelPoints(newPunti);
        setLevelUpModalOpen(true);
        try {
          localStorage.setItem('vp_last_known_level', newLevel);
        } catch {
          // ignore
        }
      }

      return updated;
    });

    showToast(`+${punti} punti: ${motivazione}`);
  };

  // Gestione Adesione a Richiesta di Volontariato ("Serve una mano")
  const handleRequestJoinVolunteer = (richiesta: RichiestaVolontariato) => {
    const alreadyJoined = interactions.richiesteAderite.includes(richiesta.id);

    if (alreadyJoined) {
      submitInteraction({ tipo: 'cisono', postId: richiesta.id, annulla: true });
      const updated = {
        ...interactions,
        richiesteAderite: interactions.richiesteAderite.filter((id) => id !== richiesta.id),
      };
      setInteractions(updated);
      saveUserInteractions(updated);

      setRichieste((prev) =>
        prev.map((r) => (r.id === richiesta.id ? { ...r, have: Math.max(0, r.have - 1) } : r))
      );
      showToast('Adesione annullata.');
    } else {
      setPendingAction({
        tipo: 'cisono',
        id: richiesta.id,
        titolo: richiesta.t,
        totalJoined: richiesta.have,
        targetJoined: richiesta.need,
      });
      setContactModalOpen(true);
    }
  };

  // Gestione Adesione a Evento
  const handleRequestJoinEvento = (evento: EventoQuartiere) => {
    const alreadyJoined = interactions.eventiPartecipati.includes(evento.id);

    if (alreadyJoined) {
      submitInteraction({ tipo: 'evento_vengo', postId: evento.id, annulla: true });
      const updated = {
        ...interactions,
        eventiPartecipati: interactions.eventiPartecipati.filter((id) => id !== evento.id),
      };
      setInteractions(updated);
      saveUserInteractions(updated);

      setEventi((prev) =>
        prev.map((e) => (e.id === evento.id ? { ...e, n: Math.max(0, e.n - 1) } : e))
      );
      showToast('Partecipazione annullata.');
    } else {
      setPendingAction({
        tipo: 'evento_vengo',
        id: evento.id,
        titolo: evento.t,
        totalJoined: evento.n,
        targetJoined: evento.target,
        tipoEvento: evento.tipo || 'volontariato',
        quota: evento.quota,
      });
      setContactModalOpen(true);
    }
  };

  // Conferma dal Modal Contatto
  const handleConfirmVolunteerModal = (contactData: { nome: string; telefono: string; anonimo: boolean }) => {
    if (!pendingAction) return;

    const { tipo, id } = pendingAction;
    submitInteraction({
      tipo,
      postId: id,
      nome: contactData.nome,
      telefono: contactData.telefono,
    });

    const updatedInteractions = { ...interactions };
    if (contactData.nome && contactData.telefono) {
      updatedInteractions.contattiSalvati = {
        nome: contactData.nome,
        telefono: contactData.telefono,
      };
    }

    if (tipo === 'cisono') {
      updatedInteractions.richiesteAderite = [...updatedInteractions.richiesteAderite, id];
      setRichieste((prev) =>
        prev.map((r) => (r.id === id ? { ...r, have: r.have + 1 } : r))
      );
      addPunti(10, 'Adesione volontariato');
    } else {
      updatedInteractions.eventiPartecipati = [...updatedInteractions.eventiPartecipati, id];
      setEventi((prev) =>
        prev.map((e) => (e.id === id ? { ...e, n: e.n + 1 } : e))
      );

      const tipoEv = pendingAction.tipoEvento || 'volontariato';
      if (tipoEv === 'pagamento') {
        showToast("Richiesta registrata! Sarai ricontattato dall'Associazione per l'iscrizione formale e il pagamento dell'iscrizione all'evento.");
      } else if (tipoEv === 'gratuito') {
        showToast("È stato riservato un posto a tuo nome per la partecipazione all'evento!");
      } else {
        addPunti(5, 'Partecipazione evento');
      }
    }

    setInteractions(updatedInteractions);
    saveUserInteractions(updatedInteractions);
    setContactModalOpen(false);
    setPendingAction(null);
  };

  // Votazione Proposta (il contatore si ferma al primo click e non incrementa oltre)
  const handleVoteProposta = (proposta: PropostaCittadina) => {
    const stored = getUserInteractions();
    const currentVoted = Array.from(new Set([
      ...(interactions.proposteVotate || []),
      ...(stored.proposteVotate || []),
    ]));

    // Se l'utente ha già votato questa proposta, il click non fa aumentare ulteriormente il contatore
    if (currentVoted.includes(proposta.id)) {
      showToast('Hai già votato questa proposta!');
      return;
    }

    const nextVoted = [...currentVoted, proposta.id];
    submitInteraction({ tipo: 'proposta_vota', postId: proposta.id }).catch(() => {});

    setProposte((prev) =>
      prev.map((p) => (p.id === proposta.id ? { ...p, v: p.v + 1 } : p))
    );
    addPunti(2, 'Voto proposta', { proposteVotate: nextVoted });
  };

  // Nuova Segnalazione
  const handleSubmitSegnalazione = async (data: {
    titolo: string;
    luogo: string;
    descrizione: string;
    foto: string[];
    nome?: string;
    telefono?: string;
  }) => {
    const res = await submitSegnalazione(data);
    const updatedMie = Array.from(new Set([...(interactions.mieSegnalazioni || []), res.newId]));
    addPunti(5, 'Segnalazione inviata', { mieSegnalazioni: updatedMie });

    // Richiedi permessi notifiche browser se in stato default per avvisarlo dei futuri cambi di stato
    if (isNotificationSupported() && getNotificationPermission() === 'default') {
      requestBrowserNotificationPermission();
    }

    showToast('Segnalazione inviata! Notifica email recapitata ad associazione@villaggioprenestino.it');
    loadData();
  };

  // Nuova Proposta
  const handleSubmitProposta = async (titolo: string) => {
    const res = await submitProposta(titolo);
    const updatedMie = Array.from(new Set([...(interactions.mieProposte || []), res.newId]));
    addPunti(5, 'Proposta inviata', { mieProposte: updatedMie });

    // Richiedi permessi notifiche browser se in stato default per avvisarlo di nuovi voti
    if (isNotificationSupported() && getNotificationPermission() === 'default') {
      requestBrowserNotificationPermission();
    }

    loadData();
  };

  // Candidatura Volontario
  const handleSubmitCandidatura = async (candidatura: CandidaturaVolontario) => {
    await submitCandidaturaVolontario(candidatura);
    const updated = {
      ...interactions,
      contattiSalvati: {
        nome: candidatura.nome,
        telefono: candidatura.telefono,
      },
    };
    setInteractions(updated);
    saveUserInteractions(updated);
    addPunti(15, 'Iscrizione volontario');
  };

  return (
    <div className={`min-h-screen font-sans flex flex-col selection:bg-amber-500 selection:text-slate-950 transition-colors duration-200 ${
      darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-100/80 text-slate-900'
    }`}>
      {/* Toast Notifiche */}
      {toast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-slate-950 text-amber-300 border border-amber-500/30 px-3.5 py-2 rounded-xl shadow-2xl text-xs sm:text-sm font-bold flex items-center gap-1.5 animate-bounce">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          {toast}
        </div>
      )}

      {/* Header fisso con logo, contatore punti e toggle tema scuro */}
      <Header
        interactions={interactions}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        onOpenWpPanel={() => setWpPanelOpen(true)}
        isAdmin={isAdmin}
        onOpenAdminAccessModal={() => setAdminAccessModalOpen(true)}
        onOpenPuntiModal={() => setPuntiModalOpen(true)}
        unreadNotificationsCount={notifications.filter((n) => !n.letta).length}
        onOpenNotifications={() => setNotificationModalOpen(true)}
        onOpenExportModal={() => setExportModalOpen(true)}
        onOpenTour={() => setTourModalOpen(true)}
      />

      {/* Banner PWA: Installazione Rapida guidata su smartphone */}
      <PwaInstallBanner />

      {/* Contenuto Principale */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3.5 sm:px-4 py-4 sm:py-5">
        {activeTab === 'home' && (
          <HomeTab
            news={news}
            eventi={eventi}
            richieste={richieste}
            interactions={interactions}
            onSelectTab={setActiveTab}
            onRequestJoinVolunteer={handleRequestJoinVolunteer}
            onRequestJoinEvento={handleRequestJoinEvento}
            darkMode={darkMode}
            onOpenWpPanel={() => setWpPanelOpen(true)}
            isAdmin={isAdmin}
            onOpenPuntiModal={() => setPuntiModalOpen(true)}
            onUpdateUserNome={handleUpdateUserNome}
            onOpenExportModal={() => setExportModalOpen(true)}
            onOpenTour={() => setTourModalOpen(true)}
            loading={loadingData}
            tabsConfig={tabsConfig}
          />
        )}

        {activeTab === 'eventi' && tabsConfig.eventi !== false && (
          <EventiTab
            eventi={eventi}
            interactions={interactions}
            onRequestJoinEvento={handleRequestJoinEvento}
          />
        )}

        {activeTab === 'segnalazioni' && tabsConfig.segnalazioni !== false && (
          <SegnalazioniTab
            segnalazioni={segnalazioni}
            mieSegnalazioni={interactions.mieSegnalazioni}
            onSubmitSegnalazione={handleSubmitSegnalazione}
            onOpenPhoto={(url) => setLightboxPhoto(url)}
            onAdvanceSegnalazioneStato={handleSimulateReportStatusChange}
            loading={loadingData}
          />
        )}

        {activeTab === 'volontariato' && tabsConfig.volontariato !== false && (
          <VolontariatoTab
            richieste={richieste}
            joinedRichieste={interactions.richiesteAderite}
            onRequestJoinVolunteer={handleRequestJoinVolunteer}
            onSubmitCandidatura={handleSubmitCandidatura}
            defaultName={interactions.contattiSalvati?.nome}
            defaultPhone={interactions.contattiSalvati?.telefono}
          />
        )}

        {activeTab === 'commercio' && tabsConfig.commercio !== false && (
          <CommercioTab
            attivita={attivitaCommercio}
            eventi={eventi}
            votedAttivita={interactions.negoziVotati || []}
            onVoteAttivita={handleVoteAttivita}
            onAggiungiAttivita={handleAggiungiAttivita}
            onUpdateAttivita={handleUpdateAttivita}
            onApprovaAttivita={handleApprovaAttivita}
            darkMode={darkMode}
            loading={loadingData}
          />
        )}

        {activeTab === 'proposte' && tabsConfig.proposte !== false && (
          <ProposteAltroTab
            proposte={proposte}
            votedProposte={interactions.proposteVotate}
            mieProposte={interactions.mieProposte}
            onVoteProposta={handleVoteProposta}
            onSubmitProposta={handleSubmitProposta}
            onSimulateVoteForProposal={handleSimulateProposalVote}
          />
        )}
      </main>

      {/* Bottom Navigation Bar per Smartphone & Desktop (La Home è sempre visibile, le altre schede sono gestite dall'amministratore) */}
      <nav className={`fixed bottom-0 left-0 right-0 z-40 backdrop-blur-md border-t shadow-md transition-colors duration-200 ${
        darkMode ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-200'
      }`}>
        <div className="max-w-xl mx-auto px-1 py-1 flex items-center justify-around">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center py-1.5 px-2 rounded-xl transition text-[10px] sm:text-[11px] font-bold ${
              activeTab === 'home'
                ? 'scale-105'
                : darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-900'
            }`}
            style={{ color: activeTab === 'home' ? (darkMode ? '#fca5a5' : '#781816') : undefined }}
          >
            <Home className="w-5 h-5 mb-0.5" />
            <span>Home</span>
          </button>

          {tabsConfig.eventi !== false && (
            <button
              onClick={() => setActiveTab('eventi')}
              className={`flex flex-col items-center py-1.5 px-2 rounded-xl transition text-[10px] sm:text-[11px] font-bold ${
                activeTab === 'eventi'
                  ? 'scale-105'
                  : darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-900'
              }`}
              style={{ color: activeTab === 'eventi' ? (darkMode ? '#fca5a5' : '#781816') : undefined }}
            >
              <Calendar className="w-5 h-5 mb-0.5" />
              <span>Eventi</span>
            </button>
          )}

          {tabsConfig.commercio !== false && (
            <button
              onClick={() => setActiveTab('commercio')}
              className={`flex flex-col items-center py-1.5 px-2 rounded-xl transition text-[10px] sm:text-[11px] font-bold ${
                activeTab === 'commercio'
                  ? 'scale-105 text-amber-600'
                  : darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-900'
              }`}
              style={{ color: activeTab === 'commercio' ? (darkMode ? '#fbbf24' : '#d97706') : undefined }}
            >
              <div className="relative">
                <Store className="w-5 h-5 mb-0.5" />
                {attivitaCommercio.some(a => !!a.offertaAttiva) && (
                  <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                )}
              </div>
              <span>Commercianti</span>
            </button>
          )}

          {tabsConfig.segnalazioni !== false && (
            <button
              onClick={() => setActiveTab('segnalazioni')}
              className={`flex flex-col items-center py-1.5 px-2 rounded-xl transition text-[10px] sm:text-[11px] font-bold ${
                activeTab === 'segnalazioni'
                  ? 'scale-105 text-amber-500'
                  : darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <div className="relative">
                <Camera className="w-5 h-5 mb-0.5" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500" />
              </div>
              <span>Segnala</span>
            </button>
          )}

          {tabsConfig.volontariato !== false && (
            <button
              onClick={() => setActiveTab('volontariato')}
              className={`flex flex-col items-center py-1.5 px-2 rounded-xl transition text-[10px] sm:text-[11px] font-bold ${
                activeTab === 'volontariato'
                  ? 'scale-105'
                  : darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-900'
              }`}
              style={{ color: activeTab === 'volontariato' ? (darkMode ? '#fca5a5' : '#781816') : undefined }}
            >
              <HeartHandshake className="w-5 h-5 mb-0.5" />
              <span>Volontari</span>
            </button>
          )}

          {tabsConfig.proposte !== false && (
            <button
              onClick={() => setActiveTab('proposte')}
              className={`flex flex-col items-center py-1.5 px-2 rounded-xl transition text-[10px] sm:text-[11px] font-bold ${
                activeTab === 'proposte'
                  ? 'scale-105'
                  : darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-900'
              }`}
              style={{ color: activeTab === 'proposte' ? (darkMode ? '#fca5a5' : '#781816') : undefined }}
            >
              <Lightbulb className="w-5 h-5 mb-0.5" />
              <span>Idee</span>
            </button>
          )}
        </div>
      </nav>

      {/* Modale Inserimento Recapito Volontario / Evento */}
      <VolunteerContactModal
        isOpen={contactModalOpen}
        onClose={() => {
          setContactModalOpen(false);
          setPendingAction(null);
        }}
        title={pendingAction?.titolo || ''}
        totalJoined={pendingAction?.totalJoined || 0}
        targetJoined={pendingAction?.targetJoined}
        tipoEvento={pendingAction?.tipoEvento}
        quota={pendingAction?.quota}
        defaultName={interactions.contattiSalvati?.nome}
        defaultPhone={interactions.contattiSalvati?.telefono}
        onConfirm={handleConfirmVolunteerModal}
      />

      {/* Lightbox Zoom Foto Segnalazioni */}
      <PhotoLightbox
        url={lightboxPhoto}
        onClose={() => setLightboxPhoto(null)}
      />

      {/* Pannello WordPress Backend & Insight */}
      <WpPluginPanel
        isOpen={wpPanelOpen}
        onClose={() => setWpPanelOpen(false)}
        config={wpConfig}
        onSaveConfig={(cfg) => {
          setWpConfig(cfg);
          saveWpConfig(cfg);
          showToast('Configurazione WordPress salvata!');
        }}
        isLiveConnected={wpConfig.useLiveApi}
        onTestConnection={async () => {
          const res = await fetchAllData();
          return res.isLive;
        }}
        eventi={eventi}
        segnalazioni={segnalazioni}
        richieste={richieste}
        proposte={proposte}
        onRefreshData={loadData}
        onUpdateSegnalazioneStato={async (id, stato) => {
          await adminUpdateSegnalazioneStato(id, stato);
          loadData();
          showToast('Stato segnalazione aggiornato!');
        }}
        onUpdateSegnalazioneModerazione={handleUpdateSegnalazioneModerazione}
        onUpdatePropostaModerazione={handleUpdatePropostaModerazione}
        onCreateEvento={async (ev) => {
          await adminCreateEvento(ev);
          loadData();
          showToast('Nuovo evento pubblicato nell\'app!');
        }}
        onCreateRichiesta={async (req) => {
          await adminCreateRichiesta(req);
          loadData();
          showToast('Nuova attività volontariato pubblicata!');
        }}
        onApprovaAttivita={handleApprovaAttivita}
        onDeactivateAdmin={handleDeactivateAdmin}
      />

      {/* Modal Segreta Accesso Amministratore (PIN) */}
      <AdminAccessModal
        isOpen={adminAccessModalOpen}
        onClose={() => setAdminAccessModalOpen(false)}
        isAdmin={isAdmin}
        onActivateAdmin={handleActivateAdmin}
        onDeactivateAdmin={handleDeactivateAdmin}
        onOpenExportModal={() => setExportModalOpen(true)}
        darkMode={darkMode}
      />

      {/* Modal Sistema Punti Civici Gamification */}
      <PuntiCiviciModal
        isOpen={puntiModalOpen}
        onClose={() => setPuntiModalOpen(false)}
        puntiCivici={interactions.puntiCivici}
        darkMode={darkMode}
        onPreviewLevel={(liv) => {
          setUnlockedLevel(liv);
          setUnlockedLevelPoints(interactions.puntiCivici);
          setLevelUpModalOpen(true);
        }}
      />

      {/* Pop up Celebrativo Passaggio di Livello della Community */}
      <NuovoLivelloModal
        isOpen={levelUpModalOpen}
        onClose={() => setLevelUpModalOpen(false)}
        livello={unlockedLevel}
        punti={unlockedLevelPoints || interactions.puntiCivici}
        darkMode={darkMode}
      />

      {/* Centro Notifiche del Browser */}
      <NotificationCenterModal
        isOpen={notificationModalOpen}
        onClose={() => setNotificationModalOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={() => {
          markAllNotificationsAsRead();
          setNotifications(getStoredNotifications());
          showToast('Tutte le notifiche contrassegnate come lette');
        }}
        onClearAll={() => {
          clearAllNotifications();
          setNotifications([]);
          showToast('Storico notifiche svuotato');
        }}
        onTestNotification={handleTestNotification}
        onSimulateProposalVote={handleSimulateProposalVote}
        onSimulateReportStatusChange={handleSimulateReportStatusChange}
        darkMode={darkMode}
        onPermissionChange={() => {
          showToast('Stato permessi notifiche aggiornato!');
        }}
      />

      {/* Finestra Esportazione Plugin WordPress & Web App ZIP */}
      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        darkMode={darkMode}
        onOpenWpPanel={() => setWpPanelOpen(true)}
      />

      {/* Guida Tour Interattivo Onboarding per Nuovi Utenti */}
      <GuidaTourModal
        isOpen={tourModalOpen}
        onClose={() => setTourModalOpen(false)}
        onSelectTab={(tab) => setActiveTab(tab)}
        onAddWelcomePoints={() => {
          try {
            const welcomed = localStorage.getItem('vp_welcome_pts');
            if (!welcomed) {
              localStorage.setItem('vp_welcome_pts', 'true');
              addPunti(10, 'Benvenuto nel quartiere!');
            }
          } catch {
            // ignore
          }
        }}
        darkMode={darkMode}
      />

      {/* Pop up informativo di avviso per l'utente in caso di proposta o segnalazione rifiutata */}
      <RejectionNoticeModal
        isOpen={!!userRejectedItemNotice}
        item={userRejectedItemNotice}
        onAcknowledge={handleAcknowledgeRejection}
        darkMode={darkMode}
      />
    </div>
  );
}
