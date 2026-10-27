import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  CreditCard,
  QrCode,
  Gift,
  Award,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Store,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  Camera,
  History,
  Tag,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import {
  getUserFidelityState,
  validateAndClaimCassaQR,
  REWARDS_CATALOGO_PREDEFINITO,
  canUserClaimReward,
  claimReward,
  getVolunteerMultiplier,
  RewardQuartiere,
  UserFidelityState,
  VoucherRiscatto,
} from '../services/fidelityService';

interface FidelityCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  oreVolontariato?: number;
  darkMode?: boolean;
  onAddCivicPoints?: (punti: number, motivo: string) => void;
}

export const FidelityCardModal: React.FC<FidelityCardModalProps> = ({
  isOpen,
  onClose,
  oreVolontariato = 0,
  darkMode = false,
  onAddCivicPoints,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'carta' | 'premi' | 'voucher' | 'scanner'>('carta');
  const [fidelityState, setFidelityState] = useState<UserFidelityState>(getUserFidelityState);
  const [selectedReward, setSelectedReward] = useState<RewardQuartiere | null>(null);
  const [feedbackNotice, setFeedbackNotice] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Scanner state
  const [manualCodeInput, setManualCodeInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Ricarica stato al mount o evento globale
  useEffect(() => {
    if (isOpen) {
      setFidelityState(getUserFidelityState());
      setFeedbackNotice(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleUpdate = () => setFidelityState(getUserFidelityState());
    window.addEventListener('cdq:fidelity-updated', handleUpdate);
    return () => window.removeEventListener('cdq:fidelity-updated', handleUpdate);
  }, []);

  // Chiudi stream fotocamera alla chiusura
  useEffect(() => {
    if (!isOpen || activeSubTab !== 'scanner') {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setIsScanning(false);
    }
  }, [isOpen, activeSubTab]);

  const { multiplier, label: multiplierLabel, badge: multiplierBadge } = getVolunteerMultiplier(oreVolontariato);

  // Avvio fotocamera per scansione
  const startCameraScanner = async () => {
    setActiveSubTab('scanner');
    setIsScanning(true);
    setFeedbackNotice(null);

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }
    } catch (e) {
      console.warn('Accesso fotocamera non disponibile o rifiutato:', e);
      setIsScanning(false);
    }
  };

  // Validazione codice o JSON
  const handleProcessScan = (content: string) => {
    const res = validateAndClaimCassaQR(content, oreVolontariato);
    if (res.success) {
      setFeedbackNotice({ type: 'success', msg: res.message });
      setFidelityState(getUserFidelityState());
      if (onAddCivicPoints && res.ptsEarned) {
        onAddCivicPoints(Math.round(res.ptsEarned / 2), 'Acquisto a Km 0 certificato');
      }
      setActiveSubTab('carta');
      try {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate([40, 60, 40]);
        }
      } catch {}
    } else {
      setFeedbackNotice({ type: 'error', msg: res.message });
    }
  };

  const handleManualCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCodeInput.trim()) return;

    // Se l'utente digita il codice backup numerico o incolla il payload
    handleProcessScan(manualCodeInput.trim());
    setManualCodeInput('');
  };

  const handleClaim = (reward: RewardQuartiere) => {
    const res = claimReward(reward);
    if (res.success) {
      setFeedbackNotice({ type: 'success', msg: res.message });
      setFidelityState(getUserFidelityState());
      setActiveSubTab('voucher');
    } else {
      setFeedbackNotice({ type: 'error', msg: res.message });
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4 my-auto relative animate-scaleUp text-slate-900 dark:text-white">
        {/* Tasto Chiudi */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-2xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer z-10"
          aria-label="Chiudi fidelity card"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Intestazione */}
        <div className="flex items-center gap-3 pr-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#781816] to-amber-600 text-white flex items-center justify-center shadow-md shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                Fidelity Card di Quartiere
              </span>
              {multiplier > 1 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>Boost {multiplier}x Attivo</span>
                </span>
              )}
            </div>
            <h3 className="text-lg sm:text-xl font-black leading-tight text-slate-900 dark:text-white mt-0.5">
              Tessera Unica Villaggio Prenestino
            </h3>
          </div>
        </div>

        {/* Banner Avviso di Feedback (Successo o Errore) */}
        {feedbackNotice && (
          <div
            className={`p-3 rounded-2xl text-xs font-bold flex items-start gap-2 animate-fadeIn border ${
              feedbackNotice.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/70 border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200'
            }`}
          >
            {feedbackNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            )}
            <span className="flex-1 leading-relaxed">{feedbackNotice.msg}</span>
            <button
              type="button"
              onClick={() => setFeedbackNotice(null)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Navigazione Sotto-Schede (Carta, Premi, I Miei Voucher) */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700/80">
          <button
            type="button"
            onClick={() => setActiveSubTab('carta')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeSubTab === 'carta'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>La Mia Tessera</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('premi')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeSubTab === 'premi'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Gift className="w-3.5 h-3.5 text-amber-500" />
            <span>Catalogo Premi</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('voucher')}
            className={`py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer relative ${
              activeSubTab === 'voucher'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Tag className="w-3.5 h-3.5 text-emerald-500" />
            <span>Voucher ({fidelityState.voucherAttivi.filter((v) => v.stato === 'attivo').length})</span>
          </button>
        </div>

        {/* CONTENUTO SCHEDA 1: LA TESSERA VIRTUALE UNICA */}
        {activeSubTab === 'carta' && (
          <div className="space-y-4 animate-fadeIn">
            {/* CARTA GRAFICA SKEUOMORPHIC-MODERNA */}
            <div className="relative overflow-hidden rounded-3xl p-5 text-white shadow-xl border border-black/15 bg-gradient-to-br from-[#781816] via-[#601210] to-[#3a0a09]">
              {/* Effetti di luce satinata */}
              <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-amber-500/20 blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-rose-500/15 blur-xl pointer-events-none" />

              <div className="relative z-10 flex flex-col justify-between h-44 sm:h-48">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-black tracking-widest text-amber-300/90 block">
                      Associazione Villaggio Prenestino
                    </span>
                    <h4 className="text-base sm:text-lg font-black tracking-tight drop-shadow-xs">
                      Tessera Fedeltà di Quartiere
                    </h4>
                  </div>
                  <div className="p-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                    <QrCode className="w-5 h-5 text-amber-300" />
                  </div>
                </div>

                {/* Saldo Punti al Centro in Grande */}
                <div className="my-auto py-1">
                  <span className="text-[11px] font-bold text-white/80 uppercase tracking-wider block">
                    Saldo Punti Spesa
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-black text-amber-300 tracking-tight drop-shadow-md">
                      {fidelityState.puntiFidelity}
                    </span>
                    <span className="text-sm font-bold text-white/90">punti accumulati</span>
                  </div>
                </div>

                {/* Barra Inferiore della Carta: Moltiplicatore e Status Volontario */}
                <div className="pt-2 border-t border-white/15 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-white/90">
                    <Award className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{multiplierBadge}</span>
                  </div>
                  <span className="font-mono text-[11px] text-amber-200/90 font-bold tracking-wider">
                    {multiplierLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* Pulsante Principale Azione: Inquadra QR in Cassa */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={startCameraScanner}
                className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Camera className="w-4 h-4 stroke-[2.5]" />
                <span>Inquadra QR in Cassa</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubTab('premi')}
                className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 text-slate-800 dark:text-slate-100 font-bold text-xs sm:text-sm rounded-2xl border border-slate-200 dark:border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Gift className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Sfoglia Ricompense</span>
              </button>
            </div>

            {/* Box Spiegazione Equa e Moltiplicatore */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Come funziona la Fidelity Card Unica?</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                Ogni acquisto in qualsiasi negozio del quartiere ti fa guadagnare punti. Se doni tempo nel <strong>Volontariato</strong>, sblocchi il <strong>Moltiplicatore fino a 2.0x</strong> su tutti i tuoi acquisti! I punti sono spendibili in sconti e premi in tutto il quartiere.
              </p>
            </div>

            {/* Storico Ultimi Acquisti Certificati */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
                <span className="flex items-center gap-1">
                  <History className="w-3.5 h-3.5 text-amber-600" />
                  <span>Ultimi acquisti certificati:</span>
                </span>
                <span>{fidelityState.transazioni.length} totali</span>
              </div>

              {fidelityState.transazioni.length === 0 ? (
                <div className="p-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-500">
                  Nessun acquisto ancora registrato. Mostra la tessera in cassa al tuo prossimo acquisto!
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {fidelityState.transazioni.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-2.5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shadow-2xs"
                    >
                      <div className="min-w-0">
                        <h5 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {tx.shopName}
                        </h5>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {tx.dataOra} {tx.multiplier > 1 && `• Moltiplicatore ${tx.multiplier}x`}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-black text-xs text-emerald-600 dark:text-emerald-400">
                          +{tx.ptsFinal} pts
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CONTENUTO SCHEDA 2: CATALOGO RICOMPENSE & SOGLIE PREMIO */}
        {activeSubTab === 'premi' && (
          <div className="space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between px-1">
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  Ricompense di Quartiere
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Usa i tuoi punti unificati per sconti e omaggi negli esercenti aderenti.
                </p>
              </div>
              <span className="text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-2.5 py-1 rounded-full border border-amber-300 dark:border-amber-700">
                Saldo: {fidelityState.puntiFidelity} pts
              </span>
            </div>

            <div className="space-y-2.5 max-h-[52vh] overflow-y-auto pr-1">
              {REWARDS_CATALOGO_PREDEFINITO.map((rew) => {
                const check = canUserClaimReward(rew, fidelityState);
                return (
                  <div
                    key={rew.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800 dark:text-amber-300">
                          <Store className="w-3.5 h-3.5 text-amber-600" />
                          <span>{rew.shopName}</span>
                        </div>
                        <h5 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white mt-0.5">
                          {rew.titolo}
                        </h5>
                      </div>
                      <span className="px-2.5 py-1 rounded-xl bg-amber-400 text-slate-950 font-black text-xs shrink-0 shadow-2xs">
                        {rew.puntiRichiesti} pts
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                      {rew.descrizione}
                    </p>

                    {/* Regole di Tutela Commerciante Chiare */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                      {rew.spesaMinima && (
                        <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                          Spesa min: €{rew.spesaMinima}
                        </span>
                      )}
                      {rew.richiedeAcquistoPregresso ? (
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          🔒 Riservato a clienti con almeno 1 acquisto in questo negozio
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          ✓ Aperto a tutto il quartiere
                        </span>
                      )}
                    </div>

                    {/* Tasto Riscatta */}
                    <button
                      type="button"
                      disabled={!check.canClaim}
                      onClick={() => handleClaim(rew)}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        check.canClaim
                          ? 'bg-[#781816] hover:bg-[#5a1210] active:scale-95 text-white shadow-xs'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-75'
                      }`}
                      title={check.canClaim ? 'Riscatta questo buono da mostrare in cassa' : check.reason}
                    >
                      <span>{check.canClaim ? 'Riscatta Ricompensa' : (check.reason || 'Soglia non raggiunta')}</span>
                      {check.canClaim && <ArrowRight className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CONTENUTO SCHEDA 3: I MIEI VOUCHER ATTIVI */}
        {activeSubTab === 'voucher' && (
          <div className="space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                Voucher Generati
              </h4>
              <span className="text-xs text-slate-500">
                Mostra il codice in cassa al momento dell'acquisto
              </span>
            </div>

            {fidelityState.voucherAttivi.length === 0 ? (
              <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
                <Gift className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                <h5 className="font-bold text-xs text-slate-700 dark:text-slate-300">
                  Nessun voucher attivo al momento
                </h5>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  Sfoglia il catalogo ricompense per convertire i tuoi punti in buoni sconto o colazioni omaggio!
                </p>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('premi')}
                  className="px-4 py-2 bg-amber-500 text-slate-950 rounded-xl text-xs font-bold cursor-pointer hover:bg-amber-400"
                >
                  Vai al Catalogo Premi
                </button>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[52vh] overflow-y-auto pr-1">
                {fidelityState.voucherAttivi.map((v) => {
                  const isExpired = Date.now() > v.scadenzaTimestamp;
                  return (
                    <div
                      key={v.id}
                      className={`p-3.5 rounded-2xl border transition space-y-2 ${
                        v.stato === 'utilizzato'
                          ? 'bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                          : isExpired
                          ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
                          : 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                            {v.shopName}
                          </span>
                          <h5 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                            {v.titolo}
                          </h5>
                        </div>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                          -{v.puntiSpesi} pts
                        </span>
                      </div>

                      {/* Codice verifica e timer */}
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block">Codice da mostrare al commerciante:</span>
                          <span className="font-mono text-base font-black tracking-widest text-[#781816] dark:text-amber-400">
                            {v.codiceVerifica}
                          </span>
                        </div>
                        <div className="text-right text-[11px] font-bold">
                          {v.stato === 'utilizzato' ? (
                            <span className="text-slate-400">Utilizzato ✓</span>
                          ) : isExpired ? (
                            <span className="text-rose-500">Scaduto</span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Valido in cassa</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* CONTENUTO SCHEDA 4: SCANNER QR INQUADRA CASSA */}
        {activeSubTab === 'scanner' && (
          <div className="space-y-3 animate-fadeIn text-center">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-500">Punta verso il display del negoziante</span>
              <button
                type="button"
                onClick={() => setActiveSubTab('carta')}
                className="text-xs font-bold text-amber-600 hover:underline"
              >
                Torna alla carta
              </button>
            </div>

            {/* Finestra video fotocamera o mirino simulato */}
            <div className="relative w-full h-56 bg-slate-950 rounded-2xl overflow-hidden border-2 border-amber-400 flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Mirino grafico */}
              <div className="absolute inset-8 border-2 border-dashed border-amber-300 rounded-xl pointer-events-none animate-pulse flex items-center justify-center">
                <span className="text-[11px] font-bold text-white bg-black/60 px-2 py-1 rounded-md backdrop-blur-xs">
                  Inquadra il QR Code del commerciante
                </span>
              </div>
            </div>

            {/* Input manuale rapido / test backup code */}
            <form onSubmit={handleManualCodeSubmit} className="space-y-2 pt-1 text-left">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                Oppure inserisci il codice di cassa o incolla il payload:
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="Incolla codice QR o payload"
                  value={manualCodeInput}
                  onChange={(e) => setManualCodeInput(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl cursor-pointer"
                >
                  Conferma
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
