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
  adminCreateRichiesta,
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
import { VolunteerContactModal } from './components/VolunteerContactModal';
import { PhotoLightbox } from './components/PhotoLightbox';
import { WpPluginPanel } from './components/WpPluginPanel';
import { AdminAccessModal } from './components/AdminAccessModal';
import { PuntiCiviciModal } from './components/PuntiCiviciModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
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
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'eventi' | 'segnalazioni' | 'volontariato' | 'proposte'>('home');
  const [interactions, setInteractions] = useState<UserInteractions>(getUserInteractions);

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

  const loadData = async () => {
    const data = await fetchAllData();
    setNews(data.news);
    setEventi(data.eventi);
    setRichieste(data.richieste);
    setSegnalazioni(data.segnalazioni);
    setProposte(data.proposte);
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

  const addPunti = (punti: number, motivazione: string) => {
    const oldPunti = interactions.puntiCivici;
    const newPunti = oldPunti + punti;
    const updated = {
      ...interactions,
      puntiCivici: newPunti,
    };
    setInteractions(updated);
    saveUserInteractions(updated);
    showToast(`+${punti} punti: ${motivazione}`);

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
    const alreadyVoted = interactions.proposteVotate.includes(proposta.id);

    // Se l'utente ha già votato questa proposta, il click non fa aumentare ulteriormente il contatore
    if (alreadyVoted) {
      return;
    }

    submitInteraction({ tipo: 'proposta_vota', postId: proposta.id });
    const updated = {
      ...interactions,
      proposteVotate: [...interactions.proposteVotate, proposta.id],
    };
    setInteractions(updated);
    saveUserInteractions(updated);

    setProposte((prev) =>
      prev.map((p) => (p.id === proposta.id ? { ...p, v: p.v + 1 } : p))
    );
    addPunti(2, 'Voto proposta');
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
    const updated = {
      ...interactions,
      mieSegnalazioni: updatedMie,
    };
    setInteractions(updated);
    saveUserInteractions(updated);
    addPunti(5, 'Segnalazione inviata');

    // Richiedi permessi notifiche browser se in stato default per avvisarlo dei futuri cambi di stato
    if (isNotificationSupported() && getNotificationPermission() === 'default') {
      requestBrowserNotificationPermission();
    }

    loadData();
  };

  // Nuova Proposta
  const handleSubmitProposta = async (titolo: string) => {
    const res = await submitProposta(titolo);
    const updatedMie = Array.from(new Set([...(interactions.mieProposte || []), res.newId]));
    const updated = {
      ...interactions,
      mieProposte: updatedMie,
    };
    setInteractions(updated);
    saveUserInteractions(updated);
    addPunti(5, 'Proposta inviata');

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
      />

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
          />
        )}

        {activeTab === 'eventi' && (
          <EventiTab
            eventi={eventi}
            interactions={interactions}
            onRequestJoinEvento={handleRequestJoinEvento}
          />
        )}

        {activeTab === 'segnalazioni' && (
          <SegnalazioniTab
            segnalazioni={segnalazioni}
            mieSegnalazioni={interactions.mieSegnalazioni}
            onSubmitSegnalazione={handleSubmitSegnalazione}
            onOpenPhoto={(url) => setLightboxPhoto(url)}
            onAdvanceSegnalazioneStato={handleSimulateReportStatusChange}
          />
        )}

        {activeTab === 'volontariato' && (
          <VolontariatoTab
            richieste={richieste}
            joinedRichieste={interactions.richiesteAderite}
            onRequestJoinVolunteer={handleRequestJoinVolunteer}
            onSubmitCandidatura={handleSubmitCandidatura}
            defaultName={interactions.contattiSalvati?.nome}
            defaultPhone={interactions.contattiSalvati?.telefono}
          />
        )}

        {activeTab === 'proposte' && (
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

      {/* Bottom Navigation Bar per Smartphone & Desktop */}
      <nav className={`fixed bottom-0 left-0 right-0 z-40 backdrop-blur-md border-t shadow-md transition-colors duration-200 ${
        darkMode ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-200'
      }`}>
        <div className="max-w-md mx-auto px-1 py-1 flex items-center justify-around">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center py-1.5 px-3 rounded-xl transition text-[11px] font-bold ${
              activeTab === 'home'
                ? 'scale-105'
                : darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-900'
            }`}
            style={{ color: activeTab === 'home' ? (darkMode ? '#fca5a5' : '#781816') : undefined }}
          >
            <Home className="w-5 h-5 mb-0.5" />
            <span>Home</span>
          </button>

          <button
            onClick={() => setActiveTab('eventi')}
            className={`flex flex-col items-center py-1.5 px-3 rounded-xl transition text-[11px] font-bold ${
              activeTab === 'eventi'
                ? 'scale-105'
                : darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-900'
            }`}
            style={{ color: activeTab === 'eventi' ? (darkMode ? '#fca5a5' : '#781816') : undefined }}
          >
            <Calendar className="w-5 h-5 mb-0.5" />
            <span>Eventi</span>
          </button>

          <button
            onClick={() => setActiveTab('segnalazioni')}
            className={`flex flex-col items-center py-1.5 px-3 rounded-xl transition text-[11px] font-bold ${
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

          <button
            onClick={() => setActiveTab('volontariato')}
            className={`flex flex-col items-center py-1.5 px-3 rounded-xl transition text-[11px] font-bold ${
              activeTab === 'volontariato'
                ? 'scale-105'
                : darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-900'
            }`}
            style={{ color: activeTab === 'volontariato' ? (darkMode ? '#fca5a5' : '#781816') : undefined }}
          >
            <HeartHandshake className="w-5 h-5 mb-0.5" />
            <span>Volontari</span>
          </button>

          <button
            onClick={() => setActiveTab('proposte')}
            className={`flex flex-col items-center py-1.5 px-3 rounded-xl transition text-[11px] font-bold ${
              activeTab === 'proposte'
                ? 'scale-105'
                : darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-900'
            }`}
            style={{ color: activeTab === 'proposte' ? (darkMode ? '#fca5a5' : '#781816') : undefined }}
          >
            <Lightbulb className="w-5 h-5 mb-0.5" />
            <span>Idee</span>
          </button>
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
        onDeactivateAdmin={handleDeactivateAdmin}
      />

      {/* Modal Segreta Accesso Amministratore (PIN) */}
      <AdminAccessModal
        isOpen={adminAccessModalOpen}
        onClose={() => setAdminAccessModalOpen(false)}
        isAdmin={isAdmin}
        onActivateAdmin={handleActivateAdmin}
        onDeactivateAdmin={handleDeactivateAdmin}
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
    </div>
  );
}
