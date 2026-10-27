import React, { useState } from 'react';
import {
  WpArticle,
  EventoQuartiere,
  RichiestaVolontariato,
  UserInteractions,
  AppTabsConfig,
} from '../types';
import {
  Calendar,
  HeartHandshake,
  ChevronRight,
  MapPin,
  Clock,
  Users,
  CheckCircle2,
  Megaphone,
  Share2,
  MessageCircle,
  ExternalLink,
  CreditCard,
  Ticket,
  Download,
  FolderArchive,
  HelpCircle,
  Camera,
  Lightbulb,
  Image,
  Zap,
  Newspaper,
  CalendarPlus,
  PlusCircle,
} from 'lucide-react';
import { ClassificaCittadini } from './ClassificaCittadini';
import { shareWithNativeOrWhatsApp, shareToWhatsApp } from '../utils/shareUtils';
import { getGoogleCalendarUrl } from '../utils/calendarUtils';
import { NewsSkeletonList } from './SkeletonLoaders';
import { ProgressiveImage } from './common/ProgressiveImage';

interface HomeTabProps {
  news: WpArticle[];
  eventi: EventoQuartiere[];
  richieste: RichiestaVolontariato[];
  interactions: UserInteractions;
  onSelectTab: (tab: 'home' | 'eventi' | 'segnalazioni' | 'volontariato' | 'proposte' | 'commercio') => void;
  onRequestJoinVolunteer: (richiesta: RichiestaVolontariato) => void;
  onRequestJoinEvento: (evento: EventoQuartiere) => void;
  darkMode?: boolean;
  onOpenWpPanel?: () => void;
  isAdmin?: boolean;
  onOpenPuntiModal?: () => void;
  onUpdateUserNome?: (nome: string) => void;
  onOpenExportModal?: () => void;
  onOpenTour?: () => void;
  loading?: boolean;
  tabsConfig?: AppTabsConfig;
  onOpenPhoto?: (url: string) => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({
  news,
  eventi,
  richieste,
  interactions,
  onSelectTab,
  onRequestJoinVolunteer,
  onRequestJoinEvento,
  darkMode,
  onOpenWpPanel,
  isAdmin = false,
  onOpenPuntiModal,
  onUpdateUserNome,
  onOpenExportModal,
  onOpenTour,
  loading = false,
  tabsConfig,
  onOpenPhoto,
}) => {
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
    setToastMsg('Dettagli copiati! Incollali su WhatsApp o altre app.');
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleShareNews = (art: WpArticle) => {
    const text = `📰 *Notizia Associazione Villaggio Prenestino*:\n"${art.titolo}"\n\n${art.estratto}`;
    const url = art.link || 'https://www.villaggioprenestino.it';
    shareWithNativeOrWhatsApp(
      {
        title: art.titolo,
        text,
        url,
      },
      (msg) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(null), 3000);
      }
    );
  };

  const handleShareEvento = (ev: EventoQuartiere) => {
    const text = `📅 *Evento a Villaggio Prenestino*: "${ev.t}"\n🗓️ Data: ${ev.d} ${ev.m} alle ore ${ev.ora}\n📍 Luogo: ${ev.luogo}\n\nUnisciti ai residenti di quartiere!`;
    const url = 'https://www.villaggioprenestino.it';
    shareWithNativeOrWhatsApp(
      {
        title: `Evento Associazione: ${ev.t}`,
        text,
        url,
      },
      (msg) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(null), 3000);
      }
    );
  };

  const handleShareVolunteer = (r: RichiestaVolontariato) => {
    const text = `🤝 *Appello Volontariato Villaggio Prenestino*:\n"${r.t}"\n📍 Luogo: ${r.w}\n👥 Mancano ${Math.max(1, r.need - r.have)} persone!\n\n${r.desc}`;
    const url = 'https://www.villaggioprenestino.it';
    shareWithNativeOrWhatsApp(
      {
        title: `Volontariato: ${r.t}`,
        text,
        url,
      },
      (msg) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(null), 3000);
      }
    );
  };

  return (
    <div className="space-y-5 pb-20 animate-fadeIn relative">
      {/* Toast notifica condivisione */}
      {toastMsg && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white border border-slate-700 px-4 py-2 rounded-xl shadow-2xl text-xs font-bold animate-bounce text-center max-w-[90vw]">
          {toastMsg}
        </div>
      )}
      {/* Hero Banner Compatto & Leggibile */}
      <section
        className="rounded-3xl p-5 sm:p-7 text-white shadow-lg border border-black/10 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #781816 0%, #5a1210 100%)',
        }}
      >
        <div className="relative z-10 max-w-xl">
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider mb-2">
            Insieme, per il quartiere.
          </span>
          <h2 className="text-xl sm:text-2xl font-black leading-tight text-white tracking-tight">
            Partecipa alla vita di Villaggio Prenestino
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-white/90 leading-relaxed">
            Scopri le iniziative, dai una mano per le attività o segnala un problema nel quartiere.
          </p>

          {/* Bottoni Principali Uniformi */}
          <div className="mt-4 flex flex-col sm:flex-row flex-wrap gap-2.5">
            {tabsConfig?.segnalazioni !== false && (
              <button
                onClick={() => onSelectTab('segnalazioni')}
                className="w-full sm:w-auto px-4 py-2.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Megaphone className="w-4 h-4" />
                Invia Segnalazione
              </button>
            )}
            {tabsConfig?.volontariato !== false && (
              <button
                onClick={() => onSelectTab('volontariato')}
                className="w-full sm:w-auto px-4 py-2.5 bg-white/15 hover:bg-white/25 active:bg-white/30 text-white font-bold text-xs sm:text-sm rounded-xl border border-white/25 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <HeartHandshake className="w-4 h-4 text-amber-300" />
                Diventa Volontario
              </button>
            )}
            {onOpenTour && (
              <button
                type="button"
                onClick={onOpenTour}
                className="w-full sm:w-auto px-4 py-2.5 bg-white/10 hover:bg-white/20 active:bg-white/25 text-amber-200 hover:text-white font-bold text-xs sm:text-sm rounded-xl border border-amber-400/30 transition flex items-center justify-center gap-1.5 cursor-pointer"
                title="Rivedi la guida e il tour delle sezioni principali"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Guida dell'App</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* SEZIONE: Azioni Rapide (Scorciatoie veloci compatibili con configurazione schede WordPress) */}
      {(tabsConfig?.segnalazioni !== false || tabsConfig?.proposte !== false || tabsConfig?.volontariato !== false) && (
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              Azioni rapide
            </h3>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Scorciatoie veloci
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
            {tabsConfig?.segnalazioni !== false && (
              <button
                type="button"
                onClick={() => {
                  try {
                    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                      navigator.vibrate([20]);
                    }
                  } catch {}
                  onSelectTab('segnalazioni');
                }}
                className="group p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-amber-500/50 dark:hover:border-amber-500/50 shadow-xs hover:shadow-md transition-all flex items-center gap-3 text-left cursor-pointer active:scale-[0.98] min-h-[52px]"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 dark:bg-amber-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Camera className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white leading-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    Invia segnalazione
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    Foto e problemi di quartiere
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-600 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            )}

            {tabsConfig?.proposte !== false && (
              <button
                type="button"
                onClick={() => {
                  try {
                    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                      navigator.vibrate([20]);
                    }
                  } catch {}
                  onSelectTab('proposte');
                }}
                className="group p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-amber-500/50 dark:hover:border-amber-500/50 shadow-xs hover:shadow-md transition-all flex items-center gap-3 text-left cursor-pointer active:scale-[0.98] min-h-[52px]"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 dark:bg-amber-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Lightbulb className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white leading-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    Nuova idea
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    Proponi e vota iniziative
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-600 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            )}

            {tabsConfig?.volontariato !== false && (
              <button
                type="button"
                onClick={() => {
                  try {
                    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                      navigator.vibrate([20]);
                    }
                  } catch {}
                  onSelectTab('volontariato');
                }}
                className="group p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 shadow-xs hover:shadow-md transition-all flex items-center gap-3 text-left cursor-pointer active:scale-[0.98] min-h-[52px]"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <HeartHandshake className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    Fai volontariato
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    Dai una mano alla comunità
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-600 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            )}
          </div>
        </section>
      )}

      {/* SEZIONE: Ultime Notizie (Semplificato per mobile) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            Ultime notizie
          </h3>
          <a
            href="https://www.villaggioprenestino.it"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
          >
            Tutte le news <ChevronRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {loading ? (
          <NewsSkeletonList count={3} />
        ) : news.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border border-slate-200/90 shadow-2xs text-xs text-slate-500">
            Nessun articolo pubblicato di recente.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {news.slice(0, 3).map((art) => (
              <article
                key={art.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="relative aspect-[16/9] overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <ProgressiveImage
                      src={art.img}
                      alt={art.titolo}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      containerClassName="w-full h-full"
                    />
                    <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-slate-950/80 text-white text-[11px] font-bold">
                      {art.data}
                    </span>
                  </div>

                  <div className="p-3.5">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2">
                      {art.titolo}
                    </h4>
                    <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {art.estratto}
                    </p>
                  </div>
                </div>

                <div className="px-3.5 pb-3.5 pt-1 flex items-center gap-2">
                  <a
                    href={art.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-h-[38px] sm:min-h-[40px] px-3.5 rounded-xl bg-[#781816] hover:bg-[#601311] active:bg-[#4d0f0e] dark:bg-amber-500 dark:hover:bg-amber-400 dark:active:bg-amber-600 text-white dark:text-slate-950 text-xs sm:text-sm font-bold shadow-xs hover:shadow transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Leggi</span>
                    <ChevronRight className="w-4 h-4 text-white/90 dark:text-slate-950 stroke-[2.4]" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleShareNews(art)}
                    title="Condividi notizia su WhatsApp o altre app"
                    aria-label="Condividi notizia su WhatsApp o altre app"
                    className="w-[38px] h-[38px] sm:w-[40px] sm:h-[40px] rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white shadow-xs hover:shadow transition flex items-center justify-center cursor-pointer shrink-0"
                  >
                    <Share2 className="w-4 h-4 text-white stroke-[2.3]" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* SEZIONE: Volontariato: Serve una mano */}
      {tabsConfig?.volontariato !== false && (
        <section className="rounded-3xl p-4 sm:p-5 border border-amber-200/80 bg-amber-50/50 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl text-white flex items-center justify-center shadow-xs"
              style={{ backgroundColor: '#781816' }}
            >
              <HeartHandshake className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 leading-tight">
                Volontariato: serve una mano
              </h3>
              <p className="text-[11px] text-slate-600">
                Adesioni condivise in tempo reale
              </p>
            </div>
          </div>
          <button
            onClick={() => onSelectTab('volontariato')}
            className="text-xs text-amber-800 font-bold flex items-center gap-0.5 hover:underline"
          >
            Vedi tutte <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {richieste.length === 0 ? (
          <div className="bg-white rounded-2xl p-5 text-center border border-amber-200/70 shadow-2xs space-y-1.5">
            <p className="text-xs font-bold text-slate-800">Nessuna attività di volontariato aperta al momento</p>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Iscriviti al nostro registro volontari per ricevere aggiornamenti sulle future iniziative.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {richieste.slice(0, 4).map((r) => {
              const hasJoined = interactions.richiesteAderite.includes(r.id);
              const percentage = Math.min(100, Math.round((r.have / Math.max(1, r.need)) * 100));
              const riferimentiTemporali = r.data || r.ora || r.data_ora
                ? (r.data ? `${r.data}${r.ora ? ` • ore ${r.ora}` : ''}` : (r.ora ? `Ore ${r.ora}` : r.data_ora || ''))
                : null;
              const posterUrl = r.featured_media_url || r.immagine_in_evidenza || r.locandina;

              return (
                <div
                  key={r.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-1.5">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                        {r.t}
                      </h4>
                      {r.urgente && (
                        <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950">
                          Urgente
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-semibold mt-1">
                      <span className="flex items-center gap-1 text-amber-800 dark:text-amber-400">
                        <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="truncate">{r.w}</span>
                      </span>
                      {riferimentiTemporali && (
                        <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-300 px-1.5 py-0.5 rounded text-[11px] font-medium border border-amber-200/70 dark:border-amber-800/60">
                          <Calendar className="w-3 h-3 text-amber-700 dark:text-amber-400 shrink-0" />
                          <span>{riferimentiTemporali}</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 line-clamp-2 leading-relaxed">
                      {r.desc}
                    </p>
                  </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs mb-1 font-semibold text-slate-700 dark:text-slate-300">
                    <span>
                      Volontari: <strong>{r.have}</strong> su {r.need}
                    </span>
                    <span className="text-amber-800 dark:text-amber-400 font-bold">{percentage}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mb-2.5">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: '#781816',
                      }}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onRequestJoinVolunteer(r)}
                      className={`flex-1 min-h-[38px] sm:min-h-[40px] py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        hasJoined
                          ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700 hover:bg-amber-200'
                          : 'bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 shadow-xs'
                      }`}
                    >
                      {hasJoined ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                          Hai aderito! (Annulla)
                        </>
                      ) : (
                        <>
                          <HeartHandshake className="w-4 h-4" />
                          Ci sono anche io! (+10 pts)
                        </>
                      )}
                    </button>
                    {posterUrl && (
                      <button
                        type="button"
                        onClick={() => onOpenPhoto?.(posterUrl)}
                        title="Apri locandina appello a tutto schermo"
                        aria-label="Apri locandina dell'attività"
                        className="min-h-[38px] sm:min-h-[40px] px-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 active:bg-amber-200 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0 text-xs font-bold"
                      >
                        <Image className="w-4 h-4 text-amber-700 dark:text-amber-400 stroke-[2.3]" />
                        <span className="hidden sm:inline">Apri locandina</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleShareVolunteer(r)}
                      title="Condividi richiesta di volontariato"
                      aria-label="Condividi richiesta di volontariato"
                      className="w-[38px] h-[38px] sm:w-[40px] sm:h-[40px] rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white shadow-xs hover:shadow transition flex items-center justify-center cursor-pointer shrink-0"
                    >
                      <Share2 className="w-4 h-4 text-white stroke-[2.3]" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
    )}

      {/* SEZIONE: Prossimi Eventi */}
      {tabsConfig?.eventi !== false && (
        <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            Prossimi eventi
          </h3>
          <button
            onClick={() => onSelectTab('eventi')}
            className="text-xs text-amber-800 dark:text-amber-400 font-bold flex items-center gap-0.5 hover:underline cursor-pointer"
          >
            Tutti gli eventi <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {eventi.filter((ev) => !ev.passato).length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border border-slate-200/90 shadow-2xs text-xs text-slate-500">
            Nessun evento in programma al momento. I prossimi appuntamenti verranno annunciati a breve.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {eventi.filter((ev) => !ev.passato).slice(0, 2).map((ev) => {
            const isAttending = interactions.eventiPartecipati.includes(ev.id);
            const isPagamento = ev.tipo === 'pagamento';
            const posterUrl = ev.featured_media_url || ev.immagine_in_evidenza || ev.locandina;

            return (
              <div
                key={ev.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-xs flex gap-3.5 items-start"
              >
                <div
                  className="shrink-0 w-11 rounded-xl text-white text-center py-1.5 px-0.5 shadow-xs"
                  style={{ backgroundColor: '#781816' }}
                >
                  <span className="block text-lg font-black leading-none text-amber-300">
                    {ev.d}
                  </span>
                  <span className="block text-[9px] font-bold tracking-wider mt-0.5 uppercase text-white/90">
                    {ev.m}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                    {ev.t}
                  </h4>

                  {/* Tag tipologia accanto a ora e luogo */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600 dark:text-slate-400 font-semibold mt-1">
                    {ev.tipo === 'pagamento' ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-950 border border-amber-300 dark:bg-amber-950/70 dark:text-amber-300">
                        <CreditCard className="w-2.5 h-2.5 text-amber-700 dark:text-amber-400" />
                        A pagamento
                      </span>
                    ) : ev.tipo === 'gratuito' ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-950 border border-sky-300 dark:bg-sky-950/70 dark:text-sky-300">
                        <Ticket className="w-2.5 h-2.5 text-sky-700 dark:text-sky-400" />
                        Gratuito
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-950 border border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300">
                        <HeartHandshake className="w-2.5 h-2.5 text-emerald-700 dark:text-emerald-400" />
                        Volontariato
                      </span>
                    )}

                    <span className="flex items-center gap-1 truncate text-slate-500 dark:text-slate-400">
                      <Clock className="w-3 h-3 text-slate-400 shrink-0" /> {ev.ora} •
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" /> {ev.luogo}
                    </span>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5">
                    <span className="text-xs text-slate-600 dark:text-slate-300 font-semibold flex items-center gap-1 truncate">
                      <Users className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <strong>{ev.n}</strong> {isPagamento ? 'iscritti' : 'confermati'}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {posterUrl && (
                        <button
                          type="button"
                          onClick={() => onOpenPhoto?.(posterUrl)}
                          title="Apri locandina evento a tutto schermo"
                          aria-label="Apri locandina evento"
                          className="py-1.5 px-2 rounded-lg bg-amber-50 hover:bg-amber-100 active:bg-amber-200 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <Image className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 stroke-[2.3]" />
                          <span className="text-[11px] hidden xs:inline sm:inline">Apri locandina</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onRequestJoinEvento(ev)}
                        title={
                          isAttending
                            ? (isPagamento ? 'Iscritto all\'evento ✓ (Tocca per annullare)' : 'Ci sarai ✓ (Tocca per annullare)')
                            : (isPagamento ? 'Iscriviti all\'evento (+5 pts civici)' : 'Iscriviti / Ci sarò (+5 pts civici)')
                        }
                        aria-label={
                          isAttending
                            ? 'Annulla iscrizione all\'evento'
                            : 'Iscriviti all\'evento'
                        }
                        className={`h-8 px-2.5 rounded-lg transition flex items-center justify-center gap-1 cursor-pointer shrink-0 shadow-xs hover:shadow active:scale-95 ${
                          isAttending
                            ? 'bg-amber-100 text-amber-950 border border-amber-300 hover:bg-amber-200 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-700'
                            : 'bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold'
                        }`}
                      >
                        {isAttending ? (
                          <>
                            <span className="text-[11px] font-bold">Iscritto</span>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-800 dark:text-emerald-300 stroke-[2.5]" />
                          </>
                        ) : (
                          <>
                            <span className="text-[11px] font-bold">Iscriviti</span>
                            <PlusCircle className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
                          </>
                        )}
                      </button>
                      <a
                        href={getGoogleCalendarUrl(ev)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Aggiungi al tuo calendario Google Calendar"
                        aria-label="Aggiungi al tuo calendario"
                        className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white shadow-xs hover:shadow transition flex items-center justify-center cursor-pointer shrink-0"
                      >
                        <CalendarPlus className="w-4 h-4 text-white stroke-[2.3]" />
                      </a>

                      <button
                        type="button"
                        onClick={() => handleShareEvento(ev)}
                        title="Condividi evento su WhatsApp o altre app"
                        aria-label="Condividi evento su WhatsApp o altre app"
                        className="w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white shadow-xs hover:shadow transition flex items-center justify-center cursor-pointer shrink-0"
                      >
                        <Share2 className="w-4 h-4 text-white stroke-[2.3]" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </section>
      )}

      {/* SEZIONE: Classifica dei Cittadini Attivi (Top 5 con più Punti Civici) */}
      <ClassificaCittadini
        interactions={interactions}
        onSelectTab={onSelectTab}
        onOpenPuntiModal={onOpenPuntiModal}
        onUpdateUserNome={onUpdateUserNome}
        darkMode={darkMode}
        tabsConfig={tabsConfig}
      />

      {/* BANNER: Canale WhatsApp Ufficiale del Quartiere */}
      <section className="relative overflow-hidden rounded-3xl p-5 sm:p-6 shadow-md border border-emerald-600/30 text-white bg-gradient-to-br from-emerald-900 via-emerald-950 to-slate-950">
        {/* Aloni decorativi di sfondo */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-emerald-400/10 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="max-w-md space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-bold tracking-wide uppercase">
              <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
              Canale WhatsApp Associazione
            </div>

            <h3 className="text-lg sm:text-xl font-black text-white leading-tight">
              Resta aggiornato sul quartiere
            </h3>

            <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
              Ricevi avvisi urgenti, notizie importanti, assemblee ed eventi di Villaggio Prenestino direttamente su WhatsApp con un solo tocco!
            </p>
          </div>

          <div className="shrink-0 pt-1 sm:pt-0">
            <a
              href="https://whatsapp.com/channel/0029VaHgrxA6hENxlGrxNd02"
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] active:scale-95 font-black text-xs sm:text-sm shadow-md hover:shadow-lg transition-all ${
                darkMode ? 'text-slate-950' : 'text-white'
              }`}
            >
              <MessageCircle className={`w-5 h-5 ${darkMode ? 'fill-slate-950 text-slate-950' : 'fill-white text-white'}`} />
              <span>Iscriviti al Canale WhatsApp</span>
              <ExternalLink className={`w-4 h-4 ml-0.5 ${darkMode ? 'text-slate-950 opacity-80' : 'text-white opacity-90'}`} />
            </a>
          </div>
        </div>
      </section>

      {/* BANNER ESPORTAZIONE: Scarica Plugin WordPress (.zip) e Web App (.zip) (Visibile solo in Modalità Admin) */}
      {isAdmin && onOpenExportModal && (
        <section className={`p-4 sm:p-5 rounded-3xl border transition-all ${
          darkMode
            ? 'bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-slate-900 border-emerald-500/30 text-slate-200'
            : 'bg-gradient-to-r from-emerald-50 via-teal-50/60 to-white border-emerald-200 text-slate-800 shadow-xs'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-xs shrink-0">
                <FolderArchive className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-bold leading-tight text-slate-900 dark:text-white">
                    Esporta per il tuo Sito Web & Hosting
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-600 text-white">
                    v1.6.0
                  </span>
                </div>
                <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  Scarica subito il <strong>Plugin WordPress</strong> (<code className="font-mono text-emerald-600 dark:text-emerald-400">vp-quartiere.zip</code>) e lo <strong>ZIP della Web App</strong> da testare su Ergonet, cPanel o FTP.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenExportModal}
              className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Esporta Plugin & ZIP</span>
            </button>
          </div>
        </section>
      )}

      {/* BANNER AMMINISTRATORE: Dashboard Insight & WordPress Plugin (Visibile solo a chi è in modalità Admin) */}
      {isAdmin && onOpenWpPanel && (
        <section className={`p-4 sm:p-5 rounded-3xl border transition-colors ${
          darkMode
            ? 'bg-slate-900/90 border-slate-800 text-slate-200'
            : 'bg-white border-slate-200 text-slate-800 shadow-xs'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0073aa] text-white flex items-center justify-center font-black text-lg shadow-xs shrink-0">
                W
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-bold leading-tight">
                    Pannello WordPress & Insight Community
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#0073aa]/15 text-[#0073aa]">
                    Admin
                  </span>
                </div>
                <p className={`text-[11px] mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Grafici segnalazioni, registro volontari, gestione eventi e download plugin WordPress.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenWpPanel}
              className="py-2 px-3.5 bg-[#0073aa] hover:bg-[#005177] active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <span>Apri Dashboard Insight</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>
      )}
    </div>
  );
};
