import React, { useState } from 'react';
import {
  WpArticle,
  EventoQuartiere,
  RichiestaVolontariato,
  UserInteractions,
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
} from 'lucide-react';
import { ClassificaCittadini } from './ClassificaCittadini';

interface HomeTabProps {
  news: WpArticle[];
  eventi: EventoQuartiere[];
  richieste: RichiestaVolontariato[];
  interactions: UserInteractions;
  onSelectTab: (tab: 'home' | 'eventi' | 'segnalazioni' | 'volontariato' | 'proposte') => void;
  onRequestJoinVolunteer: (richiesta: RichiestaVolontariato) => void;
  onRequestJoinEvento: (evento: EventoQuartiere) => void;
  darkMode?: boolean;
  onOpenWpPanel?: () => void;
  isAdmin?: boolean;
  onOpenPuntiModal?: () => void;
  onUpdateUserNome?: (nome: string) => void;
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
}) => {
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
    setToastMsg('Dettagli copiati! Incollali su WhatsApp o altre app.');
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleShareNews = async (art: WpArticle) => {
    const title = art.titolo;
    const text = `📰 Notizia CdQ Villaggio Prenestino:\n"${art.titolo}"\n${art.estratto}`;
    const url = art.link || 'https://www.villaggioprenestino.it';

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url,
        });
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          copyToClipboard(`${text}\n${url}`);
        }
      }
    } else {
      copyToClipboard(`${text}\n${url}`);
    }
  };

  const handleShareEvento = async (ev: EventoQuartiere) => {
    const title = `Evento CdQ: ${ev.t}`;
    const text = `📅 Partecipa all'evento "${ev.t}"!\n🗓️ Data: ${ev.d} ${ev.m} alle ore ${ev.ora}\n📍 Luogo: ${ev.luogo}\n\nUnisciti ai vicini di Villaggio Prenestino!`;
    const url = 'https://www.villaggioprenestino.it';

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url,
        });
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          copyToClipboard(`${text}\n${url}`);
        }
      }
    } else {
      copyToClipboard(`${text}\n${url}`);
    }
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
        <div className="relative z-10 max-w-lg">
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider mb-2">
            Il quartiere siamo noi
          </span>
          <h2 className="text-xl sm:text-2xl font-black leading-tight text-white tracking-tight">
            Partecipa alla vita di Villaggio Prenestino
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-white/90 leading-relaxed">
            Scopri le iniziative, dai una mano per le attività o segnala un problema nel quartiere.
          </p>

          {/* Bottoni Principali Arancioni */}
          <div className="mt-4 flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={() => onSelectTab('segnalazioni')}
              className="w-full sm:w-auto px-4 py-2.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Megaphone className="w-4 h-4" />
              Invia Segnalazione
            </button>
            <button
              onClick={() => onSelectTab('volontariato')}
              className="w-full sm:w-auto px-4 py-2.5 bg-white/15 hover:bg-white/25 active:bg-white/30 text-white font-bold text-xs sm:text-sm rounded-xl border border-white/25 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <HeartHandshake className="w-4 h-4 text-amber-300" />
              Diventa Volontario
            </button>
          </div>
        </div>
      </section>

      {/* SEZIONE: Ultime Notizie (Semplificato per mobile) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#781816' }} />
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {news.slice(0, 3).map((art) => (
            <article
              key={art.id}
              className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
                  <img
                    src={art.img}
                    alt={art.titolo}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=600&q=80';
                    }}
                  />
                  <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-slate-950/80 text-white text-[10px] font-bold">
                    {art.data}
                  </span>
                </div>

                <div className="p-3.5">
                  <h4 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                    {art.titolo}
                  </h4>
                  <p className="mt-1.5 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {art.estratto}
                  </p>
                </div>
              </div>

              <div className="px-3.5 pb-3 pt-1 flex items-center gap-2">
                <a
                  href={art.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-1"
                >
                  Leggi <ChevronRight className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => handleShareNews(art)}
                  title="Condividi notizia su WhatsApp o altre app"
                  aria-label="Condividi notizia su WhatsApp o altre app"
                  className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs shadow-xs hover:shadow transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Share2 className="w-3.5 h-3.5 text-white stroke-[2.3]" />
                  <span>Condividi</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* SEZIONE: Volontariato: Serve una mano */}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {richieste.slice(0, 4).map((r) => {
            const hasJoined = interactions.richiesteAderite.includes(r.id);
            const percentage = Math.min(100, Math.round((r.have / Math.max(1, r.need)) * 100));

            return (
              <div
                key={r.id}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-1.5">
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {r.t}
                    </h4>
                    {r.urgente && (
                      <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950">
                        Urgente
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-amber-800 font-semibold flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                    {r.w}
                  </p>
                  <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                    {r.desc}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-1 font-semibold text-slate-700">
                    <span>
                      Volontari: <strong>{r.have}</strong> su {r.need}
                    </span>
                    <span className="text-amber-800 font-bold">{percentage}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden mb-2.5">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: '#781816',
                      }}
                    />
                  </div>

                  <button
                    onClick={() => onRequestJoinVolunteer(r)}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      hasJoined
                        ? 'bg-amber-100 text-amber-950 border border-amber-300 hover:bg-amber-200'
                        : 'bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 shadow-xs'
                    }`}
                  >
                    {hasJoined ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                        Hai aderito! (Annulla)
                      </>
                    ) : (
                      <>
                        <HeartHandshake className="w-4 h-4" />
                        Ci sono anche io! (+10 pts)
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SEZIONE: Prossimi Eventi */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-600" />
            Prossimi eventi
          </h3>
          <button
            onClick={() => onSelectTab('eventi')}
            className="text-xs text-amber-800 font-bold flex items-center gap-0.5 hover:underline"
          >
            Tutti gli eventi <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {eventi.filter((ev) => !ev.passato).slice(0, 2).map((ev) => {
            const isAttending = interactions.eventiPartecipati.includes(ev.id);
            const isPagamento = ev.tipo === 'pagamento';

            return (
              <div
                key={ev.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex gap-3.5 items-start"
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
                  <h4 className="text-sm font-bold text-slate-900 leading-snug">
                    {ev.t}
                  </h4>

                  {/* Tag tipologia accanto a ora e luogo */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600 font-semibold mt-1">
                    {ev.tipo === 'pagamento' ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-950 border border-amber-300 dark:bg-amber-950/70 dark:text-amber-300">
                        <CreditCard className="w-2.5 h-2.5 text-amber-700" />
                        A pagamento
                      </span>
                    ) : ev.tipo === 'gratuito' ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-950 border border-sky-300 dark:bg-sky-950/70 dark:text-sky-300">
                        <Ticket className="w-2.5 h-2.5 text-sky-700" />
                        Gratuito
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-950 border border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300">
                        <HeartHandshake className="w-2.5 h-2.5 text-emerald-700" />
                        Volontariato
                      </span>
                    )}

                    <span className="flex items-center gap-1 truncate text-slate-500">
                      <Clock className="w-3 h-3 text-slate-400 shrink-0" /> {ev.ora} •
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" /> {ev.luogo}
                    </span>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                    <span className="text-xs text-slate-600 font-semibold flex items-center gap-1 truncate">
                      <Users className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <strong>{ev.n}</strong> {isPagamento ? 'iscritti' : 'confermati'}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleShareEvento(ev)}
                        title="Condividi evento su WhatsApp o altre app"
                        aria-label="Condividi evento su WhatsApp o altre app"
                        className="py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold shadow-xs hover:shadow transition flex items-center gap-1 cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5 text-white stroke-[2.3]" />
                        <span className="text-[11px]">Condividi</span>
                      </button>
                      <button
                        onClick={() => onRequestJoinEvento(ev)}
                        className={`text-xs px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                          isAttending
                            ? 'bg-amber-100 text-amber-950 border border-amber-300'
                            : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                        }`}
                      >
                        {isAttending
                          ? (isPagamento ? 'Iscritto ✓' : 'Ci sarai ✓')
                          : (isPagamento ? 'Iscriviti' : 'Ci sarò')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SEZIONE: Classifica dei Cittadini Attivi (Top 5 con più Punti Civici) */}
      <ClassificaCittadini
        interactions={interactions}
        onSelectTab={onSelectTab}
        onOpenPuntiModal={onOpenPuntiModal}
        onUpdateUserNome={onUpdateUserNome}
        darkMode={darkMode}
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
