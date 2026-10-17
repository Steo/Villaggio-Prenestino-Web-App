import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Unlock,
  KeyRound,
  Sparkles,
  Clock,
  Phone,
  MessageCircle,
  Globe,
  FileText,
  Check,
  AlertCircle,
  ShieldCheck,
  Store,
  Eye,
  EyeOff,
} from 'lucide-react';
import { AttivitaCommercio, OffertaCommercio } from '../types';

interface GestioneTitolareModalProps {
  shop: AttivitaCommercio | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: number, updatedData: Partial<AttivitaCommercio>) => void;
}

const STORAGE_UNLOCKED_KEY = 'vp_titolare_unlocked_shops';

function getUnlockedShops(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_UNLOCKED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveUnlockedShop(shopId: number, remember: boolean) {
  if (!remember) return;
  try {
    const current = getUnlockedShops();
    if (!current.includes(shopId)) {
      localStorage.setItem(STORAGE_UNLOCKED_KEY, JSON.stringify([...current, shopId]));
    }
  } catch {
    // ignore
  }
}

function forgetUnlockedShop(shopId: number) {
  try {
    const current = getUnlockedShops();
    localStorage.setItem(STORAGE_UNLOCKED_KEY, JSON.stringify(current.filter((id) => id !== shopId)));
  } catch {
    // ignore
  }
}

export const GestioneTitolareModal: React.FC<GestioneTitolareModalProps> = ({
  shop,
  isOpen,
  onClose,
  onSave,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form states
  const [hasOffer, setHasOffer] = useState(false);
  const [offerTitle, setOfferTitle] = useState('');
  const [offerDetail, setOfferDetail] = useState('');
  const [offerDiscount, setOfferDiscount] = useState<number | ''>('');
  const [offerExpiry, setOfferExpiry] = useState('');

  const [orari, setOrari] = useState('');
  const [apertoOra, setApertoOra] = useState(true);

  const [telefono, setTelefono] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [sitoWeb, setSitoWeb] = useState('');
  const [descrizione, setDescrizione] = useState('');

  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [newPinError, setNewPinError] = useState('');

  // Sincronizza lo stato quando si apre la modale per un'attività
  useEffect(() => {
    if (!shop || !isOpen) {
      setPinInput('');
      setPinError(false);
      setIsUnlocked(false);
      setSaveSuccess(false);
      setNewPin('');
      setConfirmNewPin('');
      setNewPinError('');
      return;
    }

    // Controlla se il negozio è già memorizzato come sbloccato su questo device
    const unlockedList = getUnlockedShops();
    const alreadyUnlocked = unlockedList.includes(shop.id);
    setIsUnlocked(alreadyUnlocked);

    // Inizializza i campi del form con i dati attuali
    setHasOffer(!!shop.offertaAttiva);
    setOfferTitle(shop.offertaAttiva?.titolo || '');
    setOfferDetail(shop.offertaAttiva?.dettaglio || '');
    setOfferDiscount(
      typeof shop.offertaAttiva?.scontoPercentuale === 'number'
        ? shop.offertaAttiva.scontoPercentuale
        : ''
    );
    setOfferExpiry(shop.offertaAttiva?.scadenza || '');

    setOrari(shop.orari || '');
    setApertoOra(shop.apertoOra ?? true);

    setTelefono(shop.telefono || '');
    setWhatsapp(shop.whatsapp || '');
    setSitoWeb(shop.sitoWeb || '');
    setDescrizione(shop.descrizione || '');

    setPinInput('');
    setPinError(false);
    setNewPin('');
    setConfirmNewPin('');
    setNewPinError('');
  }, [shop, isOpen]);

  if (!isOpen || !shop) return null;

  const shopPin = shop.pinGestione || '1234';

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === shopPin) {
      setIsUnlocked(true);
      setPinError(false);
      saveUnlockedShop(shop.id, rememberDevice);
    } else {
      setPinError(true);
    }
  };

  const handleRelock = () => {
    forgetUnlockedShop(shop.id);
    setIsUnlocked(false);
    setPinInput('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // Validazione eventuale cambio PIN
    if (newPin.trim().length > 0) {
      if (newPin.trim().length < 4) {
        setNewPinError('Il nuovo PIN deve contenere almeno 4 cifre.');
        return;
      }
      if (newPin !== confirmNewPin) {
        setNewPinError('I due PIN inseriti non coincidono.');
        return;
      }
    }

    let offertaAttiva: OffertaCommercio | undefined = undefined;
    if (hasOffer && offerTitle.trim().length > 0) {
      offertaAttiva = {
        titolo: offerTitle.trim(),
        dettaglio: offerDetail.trim(),
        scontoPercentuale: typeof offerDiscount === 'number' ? offerDiscount : undefined,
        scadenza: offerExpiry.trim() || undefined,
      };
    }

    const updatedData: Partial<AttivitaCommercio> = {
      offertaAttiva,
      orari: orari.trim(),
      apertoOra,
      telefono: telefono.trim(),
      whatsapp: whatsapp.trim() || undefined,
      sitoWeb: sitoWeb.trim() || undefined,
      descrizione: descrizione.trim(),
    };

    if (newPin.trim().length >= 4) {
      updatedData.pinGestione = newPin.trim();
    }

    onSave(shop.id, updatedData);
    setSaveSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              {isUnlocked ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{isUnlocked ? 'Gestione Scheda Attività' : 'Area Riservata Titolare'}</span>
                {isUnlocked && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                    Sbloccata
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[240px] sm:max-w-xs">
                {shop.nome}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Chiudi finestra"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenuto scrollabile */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {!isUnlocked ? (
            /* PASSO 1: INSERIMENTO PIN SEGRETO */
            <form onSubmit={handleVerifyPin} className="space-y-5">
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/40 text-amber-950 dark:text-amber-200 text-xs leading-relaxed space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold">
                  <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Accesso riservato all&apos;esercente</span>
                </div>
                <p>
                  Inserisci il codice PIN a 4 cifre per aggiornare in autonomia l&apos;offerta in corso, gli orari e i contatti della tua bottega.
                </p>
                <div className="pt-1 text-[11px] text-amber-800/90 dark:text-amber-300/80 font-mono">
                  PIN predefinito di prova: <strong className="font-bold underline">1234</strong>
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="pin-input"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                >
                  Codice PIN di Gestione
                </label>
                <div className="relative">
                  <input
                    id="pin-input"
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    maxLength={8}
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value);
                      if (pinError) setPinError(false);
                    }}
                    placeholder="••••"
                    autoFocus
                    className={`w-full py-3 px-4 pr-12 text-center text-xl font-mono tracking-widest rounded-2xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white transition focus:outline-hidden focus:ring-2 ${
                      pinError
                        ? 'border-rose-400 ring-2 ring-rose-400/20 bg-rose-50/30'
                        : 'border-slate-300 dark:border-slate-700 focus:ring-amber-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    aria-label={showPin ? 'Nascondi PIN' : 'Mostra PIN'}
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {pinError && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-semibold animate-in fade-in">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>PIN non corretto. Riprova con il PIN del tuo negozio (demo: 1234).</span>
                  </div>
                )}
              </div>

              {/* Opzione Ricorda su questo dispositivo */}
              <label className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 dark:border-slate-700 cursor-pointer"
                />
                <span>Ricorda questo smartphone/browser per 30 giorni</span>
              </label>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={pinInput.trim().length === 0}
                  className="py-2.5 px-5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:pointer-events-none text-slate-950 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Sblocca Scheda</span>
                </button>
              </div>
            </form>
          ) : (
            /* PASSO 2: MODIFICA DATI ATTIVITÀ & OFFERTA */
            <form onSubmit={handleSave} className="space-y-6">
              {saveSuccess && (
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Modifiche salvate con successo! Chiusura in corso...</span>
                </div>
              )}

              {/* SEZIONE 1: OFFERTA SPECIALE & COUPON */}
              <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-950 dark:text-amber-200">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Offerta Speciale / Coupon di Quartiere</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasOffer}
                      onChange={(e) => setHasOffer(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                {hasOffer ? (
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Titolo Promozione (es. Mercoledì del Pane & Dolci)
                      </label>
                      <input
                        type="text"
                        value={offerTitle}
                        onChange={(e) => setOfferTitle(e.target.value)}
                        placeholder="Es. Sconto 15% sulla panificazione artigianale"
                        className="w-full text-xs py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                        required={hasOffer}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Dettaglio & Condizioni per i residenti
                      </label>
                      <textarea
                        rows={2}
                        value={offerDetail}
                        onChange={(e) => setOfferDetail(e.target.value)}
                        placeholder="Descrivi cosa include l'offerta o se serve menzionare l'app in cassa..."
                        className="w-full text-xs py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                        required={hasOffer}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Sconto % (opzionale)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={99}
                          value={offerDiscount}
                          onChange={(e) =>
                            setOfferDiscount(e.target.value === '' ? '' : Number(e.target.value))
                          }
                          placeholder="es. 15"
                          className="w-full text-xs py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Validità / Scadenza
                        </label>
                        <input
                          type="text"
                          value={offerExpiry}
                          onChange={(e) => setOfferExpiry(e.target.value)}
                          placeholder="Es. Attiva questo mese, Tutti i martedì..."
                          className="w-full text-xs py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                    Nessuna promozione speciale in evidenza. Attiva l&apos;interruttore per pubblicare un coupon o sconto visibile a tutti i vicini di quartiere.
                  </p>
                )}
              </div>

              {/* SEZIONE 2: ORARI & STATO APERTURA */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <span>Orari di Apertura</span>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                    <span className={apertoOra ? 'text-emerald-600' : 'text-slate-500'}>
                      {apertoOra ? 'Aperto Adesso' : 'Chiuso'}
                    </span>
                    <input
                      type="checkbox"
                      checked={apertoOra}
                      onChange={(e) => setApertoOra(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </label>
                </div>
                <input
                  type="text"
                  value={orari}
                  onChange={(e) => setOrari(e.target.value)}
                  placeholder="Es. Lun-Sab 08:30 - 20:00 (Orario Continuato)"
                  className="w-full text-xs py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  required
                />
              </div>

              {/* SEZIONE 3: CONTATTI E RECAPITI */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-slate-500" />
                  <span>Recapiti Telefonici & WhatsApp</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Telefono Negozio
                    </label>
                    <input
                      type="tel"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="06 2244 5511"
                      className="w-full text-xs py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      WhatsApp Ordini (con prefisso 39)
                    </label>
                    <input
                      type="tel"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="393401122334"
                      className="w-full text-xs py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    <span>Sito Web o Pagina Social (Instagram / Facebook)</span>
                  </label>
                  <input
                    type="url"
                    value={sitoWeb}
                    onChange={(e) => setSitoWeb(e.target.value)}
                    placeholder="https://..."
                    className="w-full text-xs py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* SEZIONE 4: DESCRIZIONE ATTIVITÀ */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span>Descrizione e Presentazione della Bottega</span>
                </label>
                <textarea
                  rows={3}
                  value={descrizione}
                  onChange={(e) => setDescrizione(e.target.value)}
                  placeholder="Racconta brevemente la tua attività, specialità artigianali, prodotti a Km0 o servizi per i residenti..."
                  className="w-full text-xs py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  required
                />
              </div>

              {/* SEZIONE 5: CAMBIO PIN */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                  <span>Cambia PIN di Sicurezza (opzionale)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={8}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="Nuovo PIN (min 4 cifre)"
                    className="w-full text-xs py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={8}
                    value={confirmNewPin}
                    onChange={(e) => setConfirmNewPin(e.target.value)}
                    placeholder="Conferma Nuovo PIN"
                    className="w-full text-xs py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
                {newPinError && (
                  <p className="text-[11px] text-rose-500 font-semibold">{newPinError}</p>
                )}
                <p className="text-[10px] text-slate-400">
                  Lascia vuoti i campi se desideri conservare il PIN attuale.
                </p>
              </div>

              {/* PULSANTI AZIONE */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleRelock}
                  className="w-full sm:w-auto text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition underline underline-offset-2 cursor-pointer text-center sm:text-left"
                >
                  Blocca di nuovo (richiedi PIN la prossima volta)
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="py-2.5 px-5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Salva Modifiche</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
