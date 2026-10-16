/**
 * Utility per la condivisione rapida 1-click su WhatsApp e Web Share API
 */

export interface ShareDataPayload {
  title: string;
  text: string;
  url?: string;
}

/**
 * Apre direttamente WhatsApp su app nativa o WhatsApp Web
 * con il testo opportunamente codificato.
 */
export const shareToWhatsApp = (message: string, url?: string): void => {
  const fullText = url ? `${message}\n\n👉 Scopri di più: ${url}` : message;
  const encodedText = encodeURIComponent(fullText);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}`;

  // Prova ad aprire in una nuova scheda o triggerare il deep link
  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
};

/**
 * Condivisione universale: prova Web Share API (se su mobile supportato),
 * altrimenti apre direttamente WhatsApp.
 */
export const shareWithNativeOrWhatsApp = async (
  payload: ShareDataPayload,
  onCopiedFallback?: (msg: string) => void
): Promise<void> => {
  const fullText = payload.url
    ? `${payload.text}\n\n👉 ${payload.url}`
    : payload.text;

  // Se l'utente ha la Web Share API sul proprio smartphone (iOS Safari / Android Chrome)
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: payload.title,
        text: payload.text,
        url: payload.url || window.location.href,
      });
      return;
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return; // Utente ha annullato la condivisione, non fare nulla
      }
    }
  }

  // Fallback prioritario: apertura diretta WhatsApp
  shareToWhatsApp(payload.text, payload.url);

  // Notifica opzionale per rassicurare l'utente
  if (onCopiedFallback) {
    onCopiedFallback('Apertura WhatsApp in corso...');
  }
};
