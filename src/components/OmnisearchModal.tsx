import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  WpArticle,
  EventoQuartiere,
  AttivitaCommercio,
  SegnalazioneCittadina,
  RichiestaVolontariato,
  PropostaCittadina,
} from '../types';
import { TabType } from '../App';
import {
  Search,
  X,
  Calendar,
  Store,
  Newspaper,
  AlertTriangle,
  HeartHandshake,
  Lightbulb,
  Clock,
  ArrowRight,
  Sparkles,
  ChevronRight,
  History,
  Trash2,
} from 'lucide-react';

export type SearchCategoryFilter =
  | 'all'
  | 'eventi'
  | 'commercio'
  | 'news'
  | 'segnalazioni'
  | 'volontariato'
  | 'proposte';

export interface SearchResultItem {
  id: string | number;
  type: SearchCategoryFilter;
  tab: TabType;
  title: string;
  preview?: string;
  subtitle: string;
  badge: string;
  date?: string;
  score: number;
}

interface OmnisearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: TabType, targetId?: number | string) => void;
  articles: WpArticle[];
  eventi: EventoQuartiere[];
  commercio: AttivitaCommercio[];
  segnalazioni: SegnalazioneCittadina[];
  richieste: RichiestaVolontariato[];
  proposte: PropostaCittadina[];
}

const RECENT_SEARCHES_KEY = 'vp_omnisearch_recent_v1';

function cleanPreviewText(raw?: string, maxLen = 50): string {
  if (!raw) return '';
  const clean = raw.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  if (clean.length <= maxLen) return clean;
  return clean.substring(0, maxLen).trim() + '...';
}

export const OmnisearchModal: React.FC<OmnisearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  articles,
  eventi,
  commercio,
  segnalazioni,
  richieste,
  proposte,
}) => {
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<SearchCategoryFilter>('all');
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus automatico all'apertura
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setQuery('');
      setCategoryFilter('all');
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Gestione tasto ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const saveRecentSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed || trimmed.length < 2) return;
    setRecentSearches((prev) => {
      const next = [trimmed, ...prev.filter((t) => t.toLowerCase() !== trimmed.toLowerCase())].slice(0, 5);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  // Indicizzazione e punteggio di ricerca unificata
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const items: SearchResultItem[] = [];

    // 1. Eventi
    if (categoryFilter === 'all' || categoryFilter === 'eventi') {
      eventi.forEach((ev) => {
        const titleMatch = (ev.t || '').toLowerCase().includes(q);
        const descMatch = (ev.p || '').toLowerCase().includes(q);
        const placeMatch = (ev.luogo || '').toLowerCase().includes(q);
        if (titleMatch || descMatch || placeMatch) {
          items.push({
            id: ev.id,
            type: 'eventi',
            tab: 'eventi',
            title: ev.t,
            preview: cleanPreviewText(ev.p, 50),
            subtitle: `${ev.d} ${ev.m}${ev.ora ? ` · ${ev.ora}` : ''} — ${ev.luogo || 'Villaggio Prenestino'}`,
            badge: 'Evento',
            date: `${ev.d} ${ev.m}`,
            score: titleMatch ? 10 : 5,
          });
        }
      });
    }

    // 2. Commercio & Attività
    if (categoryFilter === 'all' || categoryFilter === 'commercio') {
      commercio.forEach((c) => {
        const nameMatch = (c.nome || '').toLowerCase().includes(q);
        const catMatch = (c.categoria || '').toLowerCase().includes(q);
        const descMatch = (c.descrizione || '').toLowerCase().includes(q);
        const addrMatch = (c.indirizzo || '').toLowerCase().includes(q);
        const offerMatch = (c.offertaAttiva?.titolo || '').toLowerCase().includes(q);
        if (nameMatch || catMatch || descMatch || addrMatch || offerMatch) {
          items.push({
            id: c.id,
            type: 'commercio',
            tab: 'commercio',
            title: c.nome,
            preview: cleanPreviewText(c.descrizione || c.offertaAttiva?.dettaglio, 50),
            subtitle: `${c.indirizzo} · ${c.categoria.toUpperCase()}${c.offertaAttiva?.titolo ? ` · Offerta: ${c.offertaAttiva.titolo}` : ''}`,
            badge: 'Negozio',
            score: nameMatch ? 12 : 6,
          });
        }
      });
    }

    // 3. Notizie WordPress
    if (categoryFilter === 'all' || categoryFilter === 'news') {
      articles.forEach((art) => {
        const titleMatch = (art.titolo || '').toLowerCase().includes(q);
        const excerptMatch = (art.estratto || '').toLowerCase().includes(q);
        if (titleMatch || excerptMatch) {
          items.push({
            id: art.id,
            type: 'news',
            tab: 'home',
            title: art.titolo,
            preview: cleanPreviewText(art.estratto, 50),
            subtitle: `${art.data} · ${art.autore || 'Notizia'}`,
            badge: 'Notizia',
            score: titleMatch ? 9 : 4,
          });
        }
      });
    }

    // 4. Segnalazioni
    if (categoryFilter === 'all' || categoryFilter === 'segnalazioni') {
      segnalazioni.forEach((seg) => {
        const titleMatch = (seg.t || '').toLowerCase().includes(q);
        const placeMatch = (seg.w || '').toLowerCase().includes(q);
        const descMatch = (seg.desc || '').toLowerCase().includes(q);
        if (titleMatch || placeMatch || descMatch) {
          const statoLabel =
            seg.s === 3
              ? 'Risolta'
              : seg.s === 2
              ? 'In lavorazione'
              : 'Segnalata';
          items.push({
            id: seg.id,
            type: 'segnalazioni',
            tab: 'segnalazioni',
            title: seg.t || 'Segnalazione cittadina',
            preview: cleanPreviewText(seg.desc, 50),
            subtitle: `${seg.w} · Stato: ${statoLabel} (${seg.data || ''})`,
            badge: 'Segnalazione',
            score: titleMatch ? 8 : 4,
          });
        }
      });
    }

    // 5. Volontariato ("Serve una Mano")
    if (categoryFilter === 'all' || categoryFilter === 'volontariato') {
      richieste.forEach((r) => {
        const titleMatch = (r.t || '').toLowerCase().includes(q);
        const descMatch = (r.desc || '').toLowerCase().includes(q);
        const placeMatch = (r.w || '').toLowerCase().includes(q);
        if (titleMatch || descMatch || placeMatch) {
          items.push({
            id: r.id,
            type: 'volontariato',
            tab: 'volontariato',
            title: r.t,
            preview: cleanPreviewText(r.desc, 50),
            subtitle: `${r.w} · Volontari: ${r.have}/${r.need}${r.data ? ` · ${r.data}` : ''}`,
            badge: 'Aiuto',
            score: titleMatch ? 9 : 4,
          });
        }
      });
    }

    // 6. Proposte dei cittadini
    if (categoryFilter === 'all' || categoryFilter === 'proposte') {
      proposte.forEach((p) => {
        const titleMatch = (p.t || '').toLowerCase().includes(q);
        const descMatch = (p.desc || '').toLowerCase().includes(q);
        if (titleMatch || descMatch) {
          items.push({
            id: p.id,
            type: 'proposte',
            tab: 'proposte',
            title: p.t,
            preview: cleanPreviewText(p.desc, 50),
            subtitle: `${p.v || 0} sostenitori${p.data ? ` · ${p.data}` : ''}`,
            badge: 'Proposta',
            score: titleMatch ? 8 : 3,
          });
        }
      });
    }

    // Ordina per rilevanza decrescente
    return items.sort((a, b) => b.score - a.score);
  }, [query, categoryFilter, articles, eventi, commercio, segnalazioni, richieste, proposte]);

  const handleSelectResult = (item: SearchResultItem) => {
    saveRecentSearch(query);
    onClose();
    onNavigate(item.tab, item.id);
  };

  const getCategoryIcon = (type: SearchCategoryFilter) => {
    switch (type) {
      case 'eventi':
        return <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'commercio':
        return <Store className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'news':
        return <Newspaper className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
      case 'segnalazioni':
        return <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case 'volontariato':
        return <HeartHandshake className="w-4 h-4 text-teal-600 dark:text-teal-400" />;
      case 'proposte':
        return <Lightbulb className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-slate-500" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-4 sm:pt-16 px-3 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[88vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cerca eventi, negozi, notizie, segnalazioni..."
            className="flex-1 bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-base sm:text-lg font-medium outline-none"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
              aria-label="Cancella testo"
            >
              <X className="w-5 h-5" />
            </button>
          ) : (
            <span className="hidden sm:inline-block text-[11px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
              ESC per chiudere
            </span>
          )}
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-xl bg-slate-100 dark:bg-slate-800"
            aria-label="Chiudi ricerca"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Filter Bar */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'Tutto' },
            { id: 'eventi', label: 'Eventi' },
            { id: 'commercio', label: 'Negozi' },
            { id: 'news', label: 'Notizie' },
            { id: 'segnalazioni', label: 'Segnalazioni' },
            { id: 'volontariato', label: 'Aiuto' },
            { id: 'proposte', label: 'Proposte' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id as SearchCategoryFilter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors min-h-[36px] flex items-center ${
                categoryFilter === cat.id
                  ? 'bg-amber-700 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Results / Empty / Recent Searches */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {!query.trim() ? (
            /* Stato Iniziale: Ultime Ricerche se presenti */
            recentSearches.length > 0 ? (
              <div className="space-y-4 py-2">
                <div>
                  <div className="flex items-center justify-between px-2 mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5" /> Ultime ricerche
                    </span>
                    <button
                      onClick={clearRecentSearches}
                      className="text-xs text-rose-600 hover:underline flex items-center gap-1 min-h-[32px] px-2 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" /> Cancella
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 px-2">
                    {recentSearches.map((term, idx) => (
                      <button
                        key={idx}
                        onClick={() => setQuery(term)}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-xl flex items-center gap-1.5 transition-colors min-h-[36px] cursor-pointer"
                      >
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{term}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : null
          ) : results.length === 0 ? (
            /* Nessun Risultato */
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <Search className="w-6 h-6" />
              </div>
              <p className="text-base font-bold text-slate-800 dark:text-slate-200">
                Nessun risultato trovato per &ldquo;{query}&rdquo;
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Prova con un termine diverso oppure seleziona il filtro &ldquo;Tutto&rdquo; per cercare in tutte le sezioni.
              </p>
            </div>
          ) : (
            /* Risultati Trovati */
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-slate-400 px-2 pb-1">
                Trovati {results.length} risultati
              </div>
              {results.map((item) => (
                <button
                  key={`${item.type}_${item.id}`}
                  onClick={() => handleSelectResult(item)}
                  className="w-full text-left p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-50/80 dark:hover:bg-amber-950/30 border border-slate-200 dark:border-slate-700/60 hover:border-amber-400/60 dark:hover:border-amber-600/60 transition-all flex items-center justify-between gap-3 group min-h-[56px]"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 mt-0.5">
                      {getCategoryIcon(item.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {item.badge}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1.5 min-w-0 overflow-hidden">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-amber-800 dark:group-hover:text-amber-300 shrink-0 max-w-[60%] sm:max-w-[70%]">
                          {item.title}
                        </h4>
                        {item.preview && (
                          <span
                            title={item.preview}
                            className="text-xs text-slate-500 dark:text-slate-400 font-normal truncate min-w-0 flex-1 opacity-90"
                          >
                            — {item.preview}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-amber-700 dark:group-hover:text-amber-400 shrink-0 transition-transform group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
