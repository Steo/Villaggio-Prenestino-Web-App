import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Award,
  Sparkles,
  TrendingUp,
  User,
  ChevronRight,
  Edit2,
  Check,
  X,
  HelpCircle,
  Camera,
  HeartHandshake,
  Lightbulb,
} from 'lucide-react';
import { UserInteractions } from '../types';
import { getFullLeaderboard } from '../services/leaderboardService';

interface ClassificaCittadiniProps {
  interactions: UserInteractions;
  onSelectTab: (tab: 'home' | 'eventi' | 'segnalazioni' | 'volontariato' | 'proposte') => void;
  onOpenPuntiModal?: () => void;
  onUpdateUserNome?: (nome: string) => void;
  darkMode?: boolean;
}

export const ClassificaCittadini: React.FC<ClassificaCittadiniProps> = ({
  interactions,
  onSelectTab,
  onOpenPuntiModal,
  onUpdateUserNome,
  darkMode = false,
}) => {
  const [editingName, setEditingName] = useState(false);
  const [nomeInput, setNomeInput] = useState(interactions.contattiSalvati?.nome || '');

  const userName = interactions.contattiSalvati?.nome;

  const leaderboard = useMemo(() => {
    return getFullLeaderboard(interactions.puntiCivici, userName);
  }, [interactions.puntiCivici, userName]);

  const handleSaveNome = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = nomeInput.trim();
    if (clean && onUpdateUserNome) {
      onUpdateUserNome(clean);
    }
    setEditingName(false);
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span
          className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shadow-xs border border-amber-300 shrink-0"
          title="1° Posto"
        >
          🥇
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span
          className={`w-6 h-6 rounded-full font-black text-xs flex items-center justify-center shadow-xs border shrink-0 ${
            darkMode
              ? 'bg-slate-700 text-slate-100 border-slate-600'
              : 'bg-slate-200 text-slate-800 border-slate-300'
          }`}
          title="2° Posto"
        >
          🥈
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span
          className={`w-6 h-6 rounded-full font-black text-xs flex items-center justify-center shadow-xs border shrink-0 ${
            darkMode
              ? 'bg-amber-950/80 text-amber-300 border-amber-700'
              : 'bg-amber-100 text-amber-900 border-amber-300'
          }`}
          title="3° Posto"
        >
          🥉
        </span>
      );
    }
    return (
      <span
        className={`w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center border shrink-0 ${
          darkMode
            ? 'bg-slate-800 text-slate-300 border-slate-700'
            : 'bg-slate-100 text-slate-700 border-slate-200'
        }`}
      >
        #{rank}
      </span>
    );
  };

  const isUserInTop5 = leaderboard.currentUserRank <= 5;

  return (
    <section
      className={`rounded-3xl p-4 sm:p-6 border transition-colors space-y-4 ${
        darkMode
          ? 'bg-slate-900 border-slate-800 text-slate-100'
          : 'bg-white border-slate-200/90 text-slate-900 shadow-xs'
      }`}
    >
      {/* Testata della Sezione */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b pb-3.5 ${
          darkMode ? 'border-slate-800' : 'border-slate-100'
        }`}
      >
        <div className="flex items-start gap-2.5">
          <div
            className="w-10 h-10 rounded-2xl text-white flex items-center justify-center shadow-xs shrink-0 mt-0.5"
            style={{ backgroundColor: '#781816' }}
          >
            <Trophy className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                className={`text-base sm:text-lg font-black leading-tight ${
                  darkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                Classifica dei Cittadini Attivi
              </h3>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide ${
                  darkMode
                    ? 'bg-amber-950/80 text-amber-300 border-amber-700'
                    : 'bg-amber-100 text-amber-900 border-amber-300'
                }`}
              >
                Top 5
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              I residenti più virtuosi che partecipano alla cura e alla vita del quartiere
            </p>
          </div>
        </div>

        {/* Pulsante info punteggio */}
        {onOpenPuntiModal && (
          <button
            type="button"
            onClick={onOpenPuntiModal}
            className={`self-start sm:self-center px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 border ${
              darkMode
                ? 'bg-slate-800 hover:bg-amber-950/50 text-slate-200 hover:text-amber-300 border-slate-700'
                : 'bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-900 border-slate-200 shadow-2xs'
            }`}
            title="Scopri come accumulare punti civici e salire di livello"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
            <span>Come funziona</span>
          </button>
        )}
      </div>

      {/* Elenco dei Primi 5 Utenti */}
      <div className="space-y-2.5">
        {leaderboard.top5.map((cittadino, idx) => {
          const rank = idx + 1;
          const isUser = cittadino.isCurrentUser;

          return (
            <div
              key={cittadino.id}
              className={`p-3 sm:p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                isUser
                  ? darkMode
                    ? 'bg-amber-950/30 border-amber-600/60 shadow-xs ring-2 ring-amber-400/40'
                    : 'bg-amber-50/90 border-amber-300 shadow-xs ring-2 ring-amber-400/30'
                  : rank === 1
                  ? darkMode
                    ? 'bg-gradient-to-r from-amber-950/20 via-slate-900 to-slate-900 border-amber-900/50'
                    : 'bg-gradient-to-r from-amber-50/70 via-amber-50/20 to-white border-amber-200/90 shadow-2xs'
                  : darkMode
                  ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs'
              }`}
            >
              {/* Sinistra: Posizione, Avatar e Info */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="shrink-0 flex items-center justify-center">
                  {getRankBadge(rank)}
                </div>

                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-white font-black text-xs sm:text-sm flex items-center justify-center shrink-0 shadow-xs select-none ${
                    isUser
                      ? 'bg-[#781816]'
                      : cittadino.avatarBg || 'bg-slate-600'
                  }`}
                >
                  {cittadino.nome.substring(0, 2).toUpperCase()}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`font-bold text-xs sm:text-sm truncate ${
                        darkMode ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {cittadino.nome}
                    </span>

                    {isUser && (
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-[#781816] text-white">
                        Tu
                      </span>
                    )}

                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-md border shrink-0 ${
                        darkMode
                          ? 'bg-slate-800 text-slate-300 border-slate-700'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                      title={`Livello: ${cittadino.livello}`}
                    >
                      <span>{cittadino.badge}</span>
                      <span className="hidden sm:inline">{cittadino.livello}</span>
                    </span>
                  </div>

                  <p
                    className={`text-[11px] truncate mt-0.5 font-medium ${
                      darkMode ? 'text-slate-400' : 'text-slate-600'
                    }`}
                  >
                    {cittadino.attivitaPrincipale}
                  </p>
                </div>
              </div>

              {/* Destra: Punti Civici Badge */}
              <div className="shrink-0 text-right">
                <div
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl font-black text-xs sm:text-sm border shadow-2xs ${
                    rank === 1
                      ? darkMode
                        ? 'bg-amber-950 text-amber-200 border-amber-700'
                        : 'bg-amber-100 text-amber-950 border-amber-300'
                      : isUser
                      ? darkMode
                        ? 'bg-emerald-950 text-emerald-200 border-emerald-700'
                        : 'bg-emerald-100 text-emerald-950 border-emerald-300'
                      : darkMode
                      ? 'bg-slate-800 text-slate-200 border-slate-700'
                      : 'bg-slate-100 text-slate-800 border-slate-200'
                  }`}
                >
                  <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>{cittadino.punti}</span>
                  <span
                    className={`text-[10px] font-semibold ${
                      darkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    pts
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Box Stato Personale: se l'utente non è nei primi 5, mostra la sua posizione e quanti punti mancano */}
      {!isUserInTop5 && (
        <div
          className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            darkMode
              ? 'bg-gradient-to-r from-amber-950/30 via-slate-900 to-amber-950/30 border-amber-800 text-slate-200'
              : 'bg-gradient-to-r from-amber-50 via-orange-50/40 to-amber-50 border-amber-200/90 text-slate-900 shadow-2xs'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border ${
                darkMode
                  ? 'bg-amber-500/20 text-amber-300 border-amber-700/50'
                  : 'bg-amber-500/20 text-amber-900 border-amber-300/80'
              }`}
            >
              #{leaderboard.currentUserRank}
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className={`text-xs font-bold ${
                    darkMode ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  La tua posizione attuale:{' '}
                  <strong className={darkMode ? 'text-amber-400' : 'text-amber-900'}>
                    #{leaderboard.currentUserRank}
                  </strong>
                </span>
                <span
                  className={`text-xs font-semibold ${
                    darkMode ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  ({interactions.puntiCivici} pts)
                </span>
              </div>
              <p
                className={`text-[11px] mt-0.5 leading-relaxed ${
                  darkMode ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                Ti mancano solo{' '}
                <strong className={darkMode ? 'text-amber-300' : 'text-slate-900'}>
                  {leaderboard.pointsToTop5} punti
                </strong>{' '}
                per entrare nella Top 5 dei Cittadini Attivi!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <span
              className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border ${
                darkMode
                  ? 'text-amber-400 bg-amber-900/60 border-amber-700'
                  : 'text-amber-950 bg-amber-200/80 border-amber-300'
              }`}
            >
              +{leaderboard.pointsToTop5} pts al traguardo
            </span>
          </div>
        </div>
      )}

      {/* Modifica Nome Utente in Classifica */}
      <div
        className={`pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
          darkMode ? 'text-slate-400' : 'text-slate-600'
        }`}
      >
        {editingName ? (
          <form onSubmit={handleSaveNome} className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              required
              value={nomeInput}
              onChange={(e) => setNomeInput(e.target.value)}
              placeholder="es. Mario R."
              className={`px-2.5 py-1 text-xs rounded-lg border focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                darkMode
                  ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500'
                  : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
              }`}
              autoFocus
            />
            <button
              type="submit"
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs"
            >
              <Check className="w-3.5 h-3.5" /> Salva
            </button>
            <button
              type="button"
              onClick={() => setEditingName(false)}
              className={`px-2 py-1 rounded-lg font-semibold flex items-center gap-1 cursor-pointer transition ${
                darkMode
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </form>
        ) : (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span>Nome in classifica:</span>
            <strong className={darkMode ? 'text-slate-200' : 'text-slate-900'}>
              {userName || 'Tu (Questo dispositivo)'}
            </strong>
            <button
              type="button"
              onClick={() => {
                setNomeInput(userName || '');
                setEditingName(true);
              }}
              className={`p-1 transition cursor-pointer ${
                darkMode
                  ? 'text-slate-400 hover:text-amber-400'
                  : 'text-slate-500 hover:text-amber-800'
              }`}
              title="Personalizza il tuo nome visibile in classifica"
            >
              <Edit2 className="w-3 h-3" />
            </button>
          </div>
        )}

        {isUserInTop5 && (
          <div
            className={`flex items-center gap-1 font-bold ${
              darkMode ? 'text-emerald-400' : 'text-emerald-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Complimenti! Sei tra i primi 5 del quartiere</span>
          </div>
        )}
      </div>

      {/* Box Azioni Rapide per Accumulare Punti Civici (Call to Action per incentivare) */}
      <div
        className={`p-3 sm:p-4 rounded-2xl border space-y-2.5 ${
          darkMode
            ? 'bg-slate-800/60 border-slate-800'
            : 'bg-slate-50 border-slate-200/90'
        }`}
      >
        <div className="flex items-center justify-between">
          <span
            className={`text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
              darkMode ? 'text-slate-300' : 'text-slate-700'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
            Scala la classifica: partecipa attivamente
          </span>
          <span
            className={`text-[11px] font-semibold ${
              darkMode ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Punti immediati
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => onSelectTab('segnalazioni')}
            className={`p-2.5 rounded-xl border transition text-left flex items-center justify-between group cursor-pointer shadow-2xs ${
              darkMode
                ? 'bg-slate-900 border-slate-700/80 hover:border-amber-500'
                : 'bg-white border-slate-200 hover:border-amber-400 hover:bg-amber-50/30'
            }`}
          >
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
              <div className="min-w-0">
                <div
                  className={`text-xs font-bold leading-tight ${
                    darkMode ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  Invia Segnalazione
                </div>
                <div
                  className={`text-[10px] ${
                    darkMode ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  Buche o decoro
                </div>
              </div>
            </div>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-black border shrink-0 ${
                darkMode
                  ? 'bg-amber-950 text-amber-300 border-amber-800'
                  : 'bg-amber-100 text-amber-950 border-amber-300'
              }`}
            >
              +5 pts
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('volontariato')}
            className={`p-2.5 rounded-xl border transition text-left flex items-center justify-between group cursor-pointer shadow-2xs ${
              darkMode
                ? 'bg-slate-900 border-slate-700/80 hover:border-emerald-500'
                : 'bg-white border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30'
            }`}
          >
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
              <div className="min-w-0">
                <div
                  className={`text-xs font-bold leading-tight ${
                    darkMode ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  Serve una Mano
                </div>
                <div
                  className={`text-[10px] ${
                    darkMode ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  Volontariato attivo
                </div>
              </div>
            </div>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-black border shrink-0 ${
                darkMode
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                  : 'bg-emerald-100 text-emerald-950 border-emerald-300'
              }`}
            >
              +10 pts
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('proposte')}
            className={`p-2.5 rounded-xl border transition text-left flex items-center justify-between group cursor-pointer shadow-2xs ${
              darkMode
                ? 'bg-slate-900 border-slate-700/80 hover:border-purple-500'
                : 'bg-white border-slate-200 hover:border-purple-400 hover:bg-purple-50/30'
            }`}
          >
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-purple-500 group-hover:scale-110 transition-transform" />
              <div className="min-w-0">
                <div
                  className={`text-xs font-bold leading-tight ${
                    darkMode ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  Proponi & Vota
                </div>
                <div
                  className={`text-[10px] ${
                    darkMode ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  Idee per il quartiere
                </div>
              </div>
            </div>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-black border shrink-0 ${
                darkMode
                  ? 'bg-purple-950 text-purple-300 border-purple-800'
                  : 'bg-purple-100 text-purple-950 border-purple-300'
              }`}
            >
              +5 pts
            </span>
          </button>
        </div>
      </div>
    </section>
  );
};
