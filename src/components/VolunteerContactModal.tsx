import React, { useState, useEffect } from 'react';
import { HeartHandshake, Phone, User, X, Check, ShieldCheck, CreditCard, Ticket, Info } from 'lucide-react';
import { TipoEvento } from '../types';

interface VolunteerContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  totalJoined: number;
  targetJoined?: number;
  tipoEvento?: TipoEvento;
  quota?: string;
  defaultName?: string;
  defaultPhone?: string;
  onConfirm: (data: { nome: string; telefono: string; anonimo: boolean }) => void;
}

export const VolunteerContactModal: React.FC<VolunteerContactModalProps> = ({
  isOpen,
  onClose,
  title,
  totalJoined,
  targetJoined,
  tipoEvento = 'volontariato',
  quota,
  defaultName = '',
  defaultPhone = '',
  onConfirm,
}) => {
  const [nome, setNome] = useState(defaultName);
  const [telefono, setTelefono] = useState(defaultPhone);

  useEffect(() => {
    if (isOpen) {
      setNome(defaultName);
      setTelefono(defaultPhone);
    }
  }, [isOpen, defaultName, defaultPhone]);

  if (!isOpen) return null;

  const isPagamento = tipoEvento === 'pagamento';
  const isGratuito = tipoEvento === 'gratuito';
  const isVolontariato = tipoEvento === 'volontariato';
  const isRequiredContact = isPagamento || isGratuito;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRequiredContact && (!nome.trim() || !telefono.trim())) {
      return;
    }
    onConfirm({
      nome: nome.trim(),
      telefono: telefono.trim(),
      anonimo: false,
    });
  };

  const handleSkip = () => {
    onConfirm({
      nome: '',
      telefono: '',
      anonimo: true,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-scaleUp">
        {/* Header con colore associazione #781816 */}
        <div className="p-4 sm:p-5 text-white relative" style={{ backgroundColor: '#781816' }}>
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-1.5 rounded-full text-white/80 hover:text-white hover:bg-black/20 transition cursor-pointer"
            aria-label="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Badge tipologia */}
          <div className="flex items-center gap-2 mb-1.5">
            {isPagamento && (
              <>
                <CreditCard className="w-4 h-4 text-amber-300" />
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Iscrizione a pagamento {quota ? `(${quota})` : ''}
                </span>
              </>
            )}
            {isGratuito && (
              <>
                <Ticket className="w-4 h-4 text-sky-300" />
                <span className="text-xs font-bold text-sky-300 uppercase tracking-wider">
                  Evento Gratuito
                </span>
              </>
            )}
            {isVolontariato && (
              <>
                <HeartHandshake className="w-4 h-4 text-amber-300" />
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Volontariato
                </span>
              </>
            )}
          </div>

          <h2 className="text-base sm:text-lg font-black leading-tight text-white">
            {isPagamento
              ? "Iscrizione all'evento"
              : isGratuito
              ? 'Riserva il tuo posto'
              : "Ottimo, grazie per l'aiuto!"}
          </h2>
          <p className="text-xs text-white/85 mt-1 line-clamp-2">
            {title}
          </p>
        </div>

        {/* Counter informativo */}
        <div className="bg-amber-50 px-4 py-2 border-b border-amber-200/80 flex items-center justify-between text-xs text-amber-950 font-semibold">
          <span>{isPagamento ? 'Iscritti confermati:' : 'Partecipanti insieme a te:'}</span>
          <span className="font-bold bg-amber-200/90 px-2 py-0.5 rounded-full">
            {totalJoined + 1} {targetJoined ? `su ${targetJoined}` : 'persone'}
          </span>
        </div>

        {/* Form con gestione campi obbligatori per tipologia */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5">
          <p className="text-xs text-slate-600 leading-relaxed">
            {isPagamento
              ? 'Fornisci nome, cognome e recapito telefonico obbligatori per avviare la procedura di iscrizione:'
              : isGratuito
              ? 'Fornisci nome, cognome e numero di telefono obbligatori per registrare il posto a tuo nome:'
              : "Lascia nome e cellulare per essere ricontattato dall'Associazione per l'attività:"}
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              {isRequiredContact ? (
                <span>
                  Nome e cognome <strong className="text-rose-500">*</strong>
                </span>
              ) : (
                'Nome o Soprannome:'
              )}
            </label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder={isRequiredContact ? 'es. Mario Rossi' : 'es. Stefano D.'}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-amber-600" />
              <span>
                Numero di Telefono {isRequiredContact && <strong className="text-rose-500">*</strong>}
              </span>
            </label>
            <input
              type="tel"
              required
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="es. 333 1234567"
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Avviso informativo per evento a pagamento o gratuito */}
          {isPagamento && (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-900 dark:text-amber-200 text-xs leading-relaxed flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Sarai ricontattato dall'Associazione per l'iscrizione formale e il pagamento dell'iscrizione all'evento.
              </span>
            </div>
          )}

          {isGratuito && (
            <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/25 text-sky-950 dark:text-sky-200 text-xs leading-relaxed flex items-start gap-2">
              <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <span>
                È stato predisposto l'accredito gratuito: verrà riservato un posto a tuo nome per la partecipazione.
              </span>
            </div>
          )}

          <div className="flex items-start gap-1.5 text-[11px] text-slate-500 pt-0.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>I tuoi recapiti sono trattati con riservatezza dall'Associazione.</span>
          </div>

          {/* Bottoni azione */}
          <div className="pt-2 flex flex-col gap-2">
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 text-xs sm:text-sm font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Check className="w-4 h-4" />
              {isPagamento
                ? "Invia richiesta di iscrizione"
                : isGratuito
                ? "Conferma presenza (Riserva posto)"
                : "Conferma e lascia recapito"}
            </button>

            {/* Il tasto skip è disponibile solo per il volontariato, non per eventi a pagamento o gratuiti con nominativo obbligatorio */}
            {!isRequiredContact && (
              <button
                type="button"
                onClick={handleSkip}
                className="w-full py-2 px-3 text-slate-500 hover:text-slate-800 text-xs font-medium rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                Partecipa senza lasciare recapito
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
