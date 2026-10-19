# Piano d'Azione: Gestione e Approvazione/Rifiuto Proposte e Segnalazioni nel Plugin WordPress

Questo piano definisce l'implementazione per visualizzare tutte le proposte ed il report delle segnalazioni (inclusi gli elementi con stato "in attesa" o "da approvare") all'interno della dashboard del plugin WordPress (`WpPluginPanel`), fornendo all'amministratore i comandi per approvare o rifiutare le sottomissioni e notificando gli utenti tramite pop-up e centro notifiche.

---

### 1. Visualizzazione e Azioni nella Dashboard WordPress (`WpPluginPanel.tsx`)
- **Tabelle Proposte e Segnalazioni**: Modificare la logica di filtraggio nelle tabelle delle tab del plugin per mostrare sia gli elementi approvati sia quelli con stato "in attesa" / "in_attesa" o "da approvare".
- **Badge di Stato e Pulsanti di Azione**:
  - Aggiungere un badge distintivo per lo stato (es. "In attesa di approvazione", "Approvato", "Rifiutato").
  - Aggiungere i pulsanti **"Approva"** (con icona di spunta verde) e **"Rifiuta"** (con icona X rossa) su ogni riga non ancora processata.
- **Azione Approva**: Aggiorna direttamente lo stato della segnalazione/proposta impostandolo come approvato e pubblicandolo nell'app.

---

### 2. Modale di Rifiuto per l'Amministratore
- **Modale Motivazione Rifiuto**: Alla pressione del pulsante "Rifiuta", apre un pop-up modale dove l'amministratore può scrivere una motivazione personalizzata spiegando il motivo del rifiuto.
- **Invio e Conferma**: Al confermare il rifiuto, il sistema imposta lo stato della sottomissione a "Rifiutato" e registra il messaggio dell'amministratore accoppiato all'utente o all'ID dell'inserimento.

---

### 3. Notifica Pop-up e Centro Notifiche per l'Utente (`NotificationCenterModal.tsx` & `App.tsx`)
- **Generazione Notifica**: Registra la notifica di rifiuto contenente la motivazione dell'amministratore ed il titolo della proposta/segnalazione rifiutata.
- **Pop-up Informativo all'Avvio**: Se l'utente ha una o più notifiche di rifiuto non ancora lette o appena ricevute, mostra automaticamente un pop-up informativo all'avvio dell'applicazione.
- **Integrazione Centro Notifiche**: Visualizza la notifica dettagliata anche nell'elenco della campanella delle notifiche per consultazioni successive.

---

### 4. Verifiche e Compilazione
- Esecuzione di `compile_applet` e `lint_applet` per verificare che non vi siano errori di tipo o sintassi TypeScript.
- Verifica del corretto riavvio del dev server e fruibilità completa dell'interfaccia.
