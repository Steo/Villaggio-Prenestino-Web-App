=== VP Quartiere - Gestione Web App Villaggio Prenestino ===
Contributors: stefano.deprophetis
Requires at least: 5.8
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: 1.6.0
License: GPLv2 or later

Plugin WordPress ufficiale per la Web App dell'Associazione di Quartiere Villaggio Prenestino.

Novità v1.6.0:
- Nuovo Componente di Riepilogo in Tempo Reale: monitora all'istante il numero di attività commerciali mappate, le segnalazioni in attesa di moderazione e le ultime 5 azioni di volontariato avvenute nell'app sia nel pannello WordPress che nella Web App.
- Shortcode ufficiale `[vp_negozi_mappa]` (e alias `[vp_commercianti]`): incorpora la mappa interattiva dei negozi con schede responsive in pagine, articoli o widget del sito.
- Supporto doppio motore cartografico: OpenStreetMap (gratuito, zero configurazione API) o Google Maps con parametro `provider="google"`.
- Ricerca istantanea dal vivo e filtri per categoria dinamici su mappa e schede con centratura automatica al click.
- Parametri flessibili: `categoria`, `schede`, `ricerca`, `filtro_categoria`, `colonne`, `altezza`, `offerte_solo`, `limite`, `ordine`, `zoom`, `centro_lat`, `centro_lng`.
- Nuova tab dedicata "🧩 Shortcode Mappa" nella dashboard del plugin con guida, tabella parametri ed esempi pronti da copiare.
- Supporto per 7 Categorie Merceologiche (Alimentari, Ristorazione, Farmacie & salute, Artigiani, Servizi alla persona, Servizi per animali, Casa & hobby).
- Geocodifica ad alta precisione al civico ed esatta corrispondenza dei pin sulla mappa senza dipendenza da fatturazione Google Cloud.
- Integrazione completa del modulo "🏪 Commercianti e Negozi di Quartiere": Custom Post Type `vp_commercio` con supporto per orari, WhatsApp ordini, promozioni residenti e coordinate Google Maps.
- Sistema di moderazione e approvazione amministratore: le nuove attività registrate dall'app vengono inserite con stato "In attesa di approvazione" (pending) esattamente come le segnalazioni cittadine.
- Tab dedicata "🏪 Commercianti" nella Dashboard Hub di WordPress con filtri (In Attesa / Pubblicati) e pulsante di approvazione rapida 1-click.
- Notifiche in bacheca con contatore visivo per le nuove attività in attesa di revisione.
- REST API v1 complete: `POST /wp-json/vp/v1/commercio` con moderazione, `POST /wp-json/vp/v1/commercio/vota` per il conteggio "Mi piace" e sincronizzazione nella chiamata unica `GET /wp-json/vp/v1/dati`.

== Shortcode ==
Usa `[vp_negozi_mappa]` su qualsiasi pagina o articolo di WordPress per mostrare la mappa e le schede.

Esempi:
- Mappa standard completa: `[vp_negozi_mappa]`
- Solo mappa senza schede: `[vp_negozi_mappa schede="no" altezza="500px"]`
- Solo ristoranti a 2 colonne: `[vp_negozi_mappa categoria="ristorazione" colonne="2"]`
- Solo negozi con offerte: `[vp_negozi_mappa offerte_solo="si" limite="6"]`
- Con Google Maps: `[vp_negozi_mappa provider="google"]`

== Installazione ==
1. Da WordPress vai su Plugin > Aggiungi nuovo > Carica plugin.
2. Seleziona il file zip "vp-quartiere.zip" e clicca "Installa adesso" (sostituisci la versione precedente se richiesta).
3. Clicca "Attiva plugin".
4. Troverai la voce principale nel menu verticale di WordPress: "🏡 VP Quartiere".
5. In "VP Quartiere > Commercianti" puoi revisionare e approvare le attività inserite dai negozianti.
6. In "VP Quartiere > Shortcode Mappa" trovi la guida completa ai parametri.
