# Scheda Attività Modale ad Alta Leggibilità da Mappa

Sostituzione dell'attuale fumetto nativo InfoWindow di Google Maps con un popup modale dedicato, spazioso e ad alto contrasto, che si apre direttamente al tocco del pin per garantire la massima leggibilità e usabilità sia su smartphone che su desktop.

## User Review & Critical Decisions

> [!IMPORTANT]
> **Decisioni confermate dall'utente nella fase di intervista:**
> - **Tipo di interfaccia**: Popup modale centrato ad alta leggibilità (anziché bottom sheet o solo scorrimento).
> - **Comportamento di apertura**: Apertura immediata della scheda completa al tocco del pin sulla mappa (senza passaggi intermedi o mini-anteprime).

---

## 1. Overview & Core Concept

- **Problema attuale**: L'InfoWindow nativo di Google Maps inserito all'interno del riquadro cartografico è vincolato a dimensioni ristrette (~285px) e alle coordinate del pin. Su schermi piccoli, le informazioni (foto, categoria, orari, indirizzo, offerte promozionali e bottoni di chiamata/indicazioni) risultano compresse e difficili da consultare.
- **Soluzione**: Al tocco di un pin commerciante sulla mappa, viene visualizzato un **popup modale dedicato centrato a schermo** con backdrop semi-trasparente e sfumato, scroll fluido dei contenuti, tipografia nitida, immagini ad alta risoluzione, pulsante di chiusura chiaro e ben visibile sia in modalità giorno che notte, e azioni rapide dirette (WhatsApp, Telefono, Indicazioni stradali, Gestione scheda con PIN).

---

## 2. User Experience & Visual Design

### Flusso Utente
1. L'utente naviga la mappa e tocca/clicca su un pin commerciante.
2. La mappa centra dolcemente il pin selezionato e compare immediatamente il popup modale con animazione fluida di apertura (`scaleUp` / `fadeIn`).
3. L'utente può consultare tutti i dettagli senza sovrapposizioni:
   - **Copertina & Badge**: Immagine del negozio ben dimensionata con badge offerta attiva.
   - **Intestazione**: Nome dell'attività in grande rilievo, categoria commerciale e badge di verifica associazione.
   - **Info Pratiche**: Indirizzo completo, orari di apertura chiari con icona orologio.
   - **Box Offerta Promozionale**: Se presente un'offerta attiva per i residenti del quartiere, è mostrata in un riquadro dedicato con dettagli chiari.
   - **Descrizione**: Testo descrittivo del negozio senza tagli o troncamenti forzati.
   - **Pulsanti di Azione Rapida**:
     - *Chiama subito* (telefono)
     - *Invia messaggio WhatsApp* (apertura diretta chat)
     - *Indicazioni Stradali* (apre Google Maps per calcolo percorso a piedi o in auto)
     - *Gestisci scheda* (per i commercianti con PIN)
4. La modale si chiude toccando il tasto "X" chiaro in alto a destra, toccando lo sfondo scuro, o premendo il tasto ESC.

### Adattamento Mobile e Dark Mode
- **Mobile verticale**: Larghezza fluida del 94% con altezza massima dell'85vh e scroll interno per garantire che nessun elemento venga tagliato anche sui dispositivi più compatti.
- **Dark Mode**: Sfondo scuro elegante `#0b1329` / `bg-slate-900`, bordi sottili in `slate-700`, testi bianchi ad alto contrasto, e tasto "X" chiaro e nitido.

---

## 3. Key Product Decisions & Trade-Offs

- **Rimozione di InfoWindow a favore della modale dedicata**:
  - *Scelta*: Disabilitare il rendering del componente `InfoWindow` di `@vis.gl/react-google-maps` per evitare vincoli di overflow e posizionamento forzato dal motore di Google Maps.
  - *Vantaggi*: Controllo totale su accessibilità, contrasto, scroll touch, responsive design e animazioni.
- **Apertura diretta senza schermata intermedia**:
  - *Scelta*: Come confermato dall'utente, al tocco del pin si apre subito la scheda ricca e completa, riducendo i passaggi a vuoto e facilitando il contatto immediato con il commerciante.

---

## 4. Technical Architecture & Data Strategy

```
┌──────────────────────────────────────────────────────────────┐
│ CommercioTab / MappaQuartiere                                │
│                                                              │
│  ┌───────────────────────┐       ┌────────────────────────┐  │
│  │ Google Maps API       │       │ ModalSchedaCommerciante│  │
│  │ CustomMapMarker (Pin) │──────>│ (Popup Modale Centrato)│  │
│  └───────────────────────┘       └────────────────────────┘  │
│             │                                 │              │
│       onSelectAttivita             Azioni: Tel / WA / Mappe  │
└──────────────────────────────────────────────────────────────┘
```

- **Componente**: Implementazione di un componente modale ad alta leggibilità in `MappaQuartiere` o `CommercioTab` pilotato dallo stato `selectedItem` / `selectedAttivitaId`.
- **Integrazione**: Mantenimento della sincronizzazione tra la selezione da mappa e la vetrina commercianti sottostante.
