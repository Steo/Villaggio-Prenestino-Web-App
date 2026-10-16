<?php
/**
 * Plugin Name: VP Quartiere - Gestione Web App Villaggio Prenestino
 * Plugin URI:  https://www.villaggioprenestino.it
 * Description: Plugin ufficiale per la gestione della Web App di quartiere: gestisce commercianti e negozi locali con approvazione moderatore, segnalazioni con foto, richieste di volontariato con contatti dei cittadini, eventi, proposte, dashboard Insight e REST API.
 * Version:     1.4.0
 * Author:      Associazione di Quartiere Villaggio Prenestino
 * Author URI:  https://www.villaggioprenestino.it
 * License:     GPL-2.0+
 * Text Domain: vp-quartiere
 */

if (!defined('ABSPATH')) {
    exit;
}

define('VPQ_VERSION', '1.4.0');
define('VPQ_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('VPQ_PLUGIN_URL', plugin_dir_url(__FILE__));

/**
 * Attivazione del plugin: creazione tabella personalizzata interazioni
 */
register_activation_hook(__FILE__, 'vpq_activate');
add_action('plugins_loaded', 'vpq_check_upgrade');

function vpq_check_upgrade() {
    if (get_option('vpq_db_version') !== VPQ_VERSION) {
        vpq_activate();
    }
}

function vpq_activate() {
    global $wpdb;
    require_once ABSPATH . 'wp-admin/includes/upgrade.php';

    $table_interazioni = $wpdb->prefix . 'vp_interazioni';
    $charset_collate   = $wpdb->get_charset_collate();

    $sql = "CREATE TABLE $table_interazioni (
        id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
        tipo varchar(30) NOT NULL,
        post_id bigint(20) unsigned NOT NULL,
        token varchar(64) NOT NULL,
        nome varchar(100) NOT NULL DEFAULT '',
        telefono varchar(40) NOT NULL DEFAULT '',
        note text NULL,
        creato datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY dedup_token (tipo, post_id, token),
        KEY post_idx (post_id),
        KEY tipo_idx (tipo)
    ) $charset_collate;";

    dbDelta($sql);

    // Genera chiave API se non esiste
    if (!get_option('vpq_api_key')) {
        update_option('vpq_api_key', wp_generate_password(32, false));
    }
    if (!get_option('vpq_allow_origins')) {
        update_option('vpq_allow_origins', '*');
    }
    update_option('vpq_db_version', VPQ_VERSION);

    // Registra i tipi di post e aggiorna i permalink
    vpq_register_post_types();
    flush_rewrite_rules();
}

/**
 * Registrazione Custom Post Types
 */
add_action('init', 'vpq_register_post_types');
function vpq_register_post_types() {
    // 1. Eventi del quartiere (Raggruppati sotto il menu unico vp-quartiere)
    register_post_type('vp_evento', [
        'labels' => [
            'name'               => 'Eventi Quartiere',
            'singular_name'      => 'Evento',
            'menu_name'          => '📅 Eventi Quartiere',
            'add_new'            => 'Aggiungi Evento',
            'add_new_item'       => 'Nuovo Evento',
            'edit_item'          => 'Modifica Evento',
            'all_items'          => 'Tutti gli Eventi',
        ],
        'public'       => false,
        'show_ui'      => true,
        'show_in_menu' => 'vp-quartiere',
        'supports'     => ['title', 'editor', 'thumbnail'],
    ]);

    // 2. Richieste Volontariato ("Serve una mano")
    register_post_type('vp_richiesta', [
        'labels' => [
            'name'               => 'Serve una Mano (Volontariato)',
            'singular_name'      => 'Azione Volontariato',
            'menu_name'          => '🤝 Serve una Mano',
            'add_new'            => 'Nuova Richiesta',
            'add_new_item'       => 'Nuova Richiesta Volontari',
            'edit_item'          => 'Modifica Richiesta',
            'all_items'          => 'Tutte le Richieste',
        ],
        'public'       => false,
        'show_ui'      => true,
        'show_in_menu' => 'vp-quartiere',
        'supports'     => ['title', 'editor'],
    ]);

    // 3. Segnalazioni Cittadine
    register_post_type('vp_segnalazione', [
        'labels' => [
            'name'               => 'Segnalazioni Cittadini',
            'singular_name'      => 'Segnalazione',
            'menu_name'          => '⚠️ Segnalazioni',
            'add_new'            => 'Nuova Segnalazione',
            'edit_item'          => 'Dettagli Segnalazione',
            'all_items'          => 'Tutte le Segnalazioni',
        ],
        'public'       => false,
        'show_ui'      => true,
        'show_in_menu' => 'vp-quartiere',
        'supports'     => ['title', 'editor', 'thumbnail'],
    ]);

    // 4. Proposte Cittadini
    register_post_type('vp_proposta', [
        'labels' => [
            'name'               => 'Proposte Cittadini',
            'singular_name'      => 'Proposta',
            'menu_name'          => '💡 Proposte Cittadini',
            'all_items'          => 'Tutte le Proposte',
        ],
        'public'       => false,
        'show_ui'      => true,
        'show_in_menu' => 'vp-quartiere',
        'supports'     => ['title', 'editor'],
    ]);

    // 5. Iscrizioni Registro Volontari ("Partecipa")
    register_post_type('vp_volontario', [
        'labels' => [
            'name'               => 'Albo Volontari Registrati',
            'singular_name'      => 'Volontario',
            'menu_name'          => '👥 Albo Volontari',
            'all_items'          => 'Tutti i Volontari',
        ],
        'public'       => false,
        'show_ui'      => true,
        'show_in_menu' => 'vp-quartiere',
        'supports'     => ['title', 'editor'],
    ]);

    // 6. Commercianti e Negozi di Quartiere (con sistema di approvazione moderatore)
    register_post_type('vp_commercio', [
        'labels' => [
            'name'               => 'Commercianti & Negozi',
            'singular_name'      => 'Attività Commerciale',
            'menu_name'          => '🏪 Commercianti',
            'add_new'            => 'Nuova Attività',
            'add_new_item'       => 'Aggiungi Attività Commerciale',
            'edit_item'          => 'Dettagli Attività Commerciale',
            'all_items'          => 'Tutti i Commercianti',
        ],
        'public'       => false,
        'show_ui'      => true,
        'show_in_menu' => 'vp-quartiere',
        'supports'     => ['title', 'editor', 'thumbnail'],
    ]);
}

/**
 * Meta Box nei Custom Post Types per gestione dati
 */
add_action('add_meta_boxes', 'vpq_add_meta_boxes');
function vpq_add_meta_boxes() {
    // Meta box per Eventi
    add_meta_box('vpq_evento_meta', 'Dettagli Evento', 'vpq_render_evento_meta', 'vp_evento', 'normal', 'high');
    // Meta box per Richieste Volontariato
    add_meta_box('vpq_richiesta_meta', 'Obiettivo Volontari e Luogo', 'vpq_render_richiesta_meta', 'vp_richiesta', 'normal', 'high');
    // Meta box per Segnalazioni
    add_meta_box('vpq_segnalazione_meta', 'Stato e Luogo Segnalazione', 'vpq_render_segnalazione_meta', 'vp_segnalazione', 'normal', 'high');
    // Meta box per Volontari
    add_meta_box('vpq_volontario_meta', 'Recapiti Volontario', 'vpq_render_volontario_meta', 'vp_volontario', 'normal', 'high');
    // Meta box per Commercianti con stato di approvazione
    add_meta_box('vpq_commercio_meta', 'Dati Attività & Approvazione Moderatore', 'vpq_render_commercio_meta', 'vp_commercio', 'normal', 'high');
}

/**
 * Helper per calcolare la data completa, giorno, mese abbreviato e stabilire se un evento è passato.
 */
function vpq_normalize_data_evento($giorno, $mese, $anno = '', $ora = '10:00', $passato_esplicito = false) {
    $current_year = date('Y');
    $anno = $anno ? trim($anno) : $current_year;
    if (strlen($anno) === 2) {
        $anno = '20' . $anno;
    }

    $map_mesi = [
        'GEN' => '01', 'FEB' => '02', 'MAR' => '03', 'APR' => '04', 'MAG' => '05', 'GIU' => '06',
        'LUG' => '07', 'AGO' => '08', 'SET' => '09', 'OTT' => '10', 'NOV' => '11', 'DIC' => '12',
        'JAN' => '01', 'MAY' => '05', 'JUN' => '06', 'JUL' => '07', 'AUG' => '08', 'SEP' => '09', 'OCT' => '10', 'DEC' => '12',
        '01'  => '01', '02'  => '02', '03'  => '03', '04'  => '04', '05'  => '05', '06'  => '06',
        '07'  => '07', '08'  => '08', '09'  => '09', '10'  => '10', '11'  => '11', '12'  => '12',
        '1'   => '01', '2'   => '02', '3'   => '03', '4'   => '04', '5'   => '05', '6'   => '06',
        '7'   => '07', '8'   => '08', '9'   => '09',
    ];

    $m_clean = strtoupper(trim($mese));
    $num_mese = isset($map_mesi[$m_clean]) ? $map_mesi[$m_clean] : date('m');
    $num_giorno = sprintf('%02d', max(1, min(31, (int)$giorno)));

    $iso_date = sprintf('%04d-%02d-%02d', (int)$anno, (int)$num_mese, (int)$num_giorno);

    // Mese display italiano (es. OTT)
    $mesi_nomi = [
        '01' => 'GEN', '02' => 'FEB', '03' => 'MAR', '04' => 'APR',
        '05' => 'MAG', '06' => 'GIU', '07' => 'LUG', '08' => 'AGO',
        '09' => 'SET', '10' => 'OTT', '11' => 'NOV', '12' => 'DIC'
    ];
    $mese_display = isset($mesi_nomi[$num_mese]) ? $mesi_nomi[$num_mese] : $m_clean;

    // Controllo se è passato: o è stato flaggato manualmente, oppure la data completa è precedente ad oggi
    $oggi = current_time('Y-m-d'); // Fuso orario locale WordPress
    $is_passato = $passato_esplicito || ($iso_date < $oggi);

    return [
        'giorno'        => (string)(int)$num_giorno,
        'mese'          => $mese_display,
        'anno'          => (string)$anno,
        'data_completa' => $iso_date,
        'is_passato'    => (bool)$is_passato,
    ];
}

function vpq_render_evento_meta($post) {
    wp_nonce_field('vpq_save_meta', 'vpq_meta_nonce');
    $giorno   = get_post_meta($post->ID, '_vp_giorno', true) ?: date('d');
    $mese     = get_post_meta($post->ID, '_vp_mese', true) ?: strtoupper(date('M'));
    $anno     = get_post_meta($post->ID, '_vp_anno', true) ?: date('Y');
    $data_iso = get_post_meta($post->ID, '_vp_data_completa', true);
    $ora      = get_post_meta($post->ID, '_vp_ora', true) ?: '10:00';
    $luogo    = get_post_meta($post->ID, '_vp_luogo', true) ?: 'Piazza Villaggio Prenestino';
    $target   = get_post_meta($post->ID, '_vp_target', true) ?: '10';
    $tipo     = get_post_meta($post->ID, '_vp_tipo', true) ?: 'volontariato';
    $quota    = get_post_meta($post->ID, '_vp_quota', true) ?: '';
    $passato  = (bool) get_post_meta($post->ID, '_vp_passato', true);

    // Se non è impostata la data ISO, calcolala per valorizzare l'input HTML5 date
    if (!$data_iso) {
        $norm = vpq_normalize_data_evento($giorno, $mese, $anno, $ora, $passato);
        $data_iso = $norm['data_completa'];
    }
    ?>
    <table class="form-table">
        <tr>
            <th><label for="vp_tipo">Tipologia Evento:</label></th>
            <td>
                <select id="vp_tipo" name="vp_tipo">
                    <option value="volontariato" <?php selected($tipo, 'volontariato'); ?>>🤝 Volontariato di Quartiere (Gratuito)</option>
                    <option value="gratuito" <?php selected($tipo, 'gratuito'); ?>>🎟️ Evento Pubblico Gratuito (Festa / Incontro)</option>
                    <option value="pagamento" <?php selected($tipo, 'pagamento'); ?>>💳 Iscrizione a Pagamento (Biglietto / Quota)</option>
                </select>
            </td>
        </tr>
        <tr><th><label for="vp_quota">Quota (se a pagamento):</label></th><td><input type="text" id="vp_quota" name="vp_quota" value="<?php echo esc_attr($quota); ?>" placeholder="es. 10€" class="regular-text" style="width:120px;" /></td></tr>

        <!-- Selezione data completa con calendario nativo e anno -->
        <tr style="background:#f9f9f9;">
            <th><label for="vp_data_completa"><strong>Data Completa Evento (con Anno):</strong></label></th>
            <td>
                <input type="date" id="vp_data_completa" name="vp_data_completa" value="<?php echo esc_attr($data_iso); ?>" class="regular-text" style="width:180px;font-weight:bold;" />
                <p class="description" style="margin-top:4px;">
                    📅 <strong>Scegli giorno, mese e anno</strong> dal calendario. Se imposti una data nel passato, l'evento verrà spostato <strong>automaticamente nella sezione "Eventi Passati"</strong> dell'app.
                </p>
            </td>
        </tr>

        <tr>
            <th>Campi Data Dettagliati:</th>
            <td>
                <span style="display:inline-block;margin-right:15px;">
                    <label for="vp_giorno">Giorno:</label>
                    <input type="text" id="vp_giorno" name="vp_giorno" value="<?php echo esc_attr($giorno); ?>" class="small-text" style="width:60px;" />
                </span>
                <span style="display:inline-block;margin-right:15px;">
                    <label for="vp_mese">Mese (es. OTT):</label>
                    <input type="text" id="vp_mese" name="vp_mese" value="<?php echo esc_attr($mese); ?>" class="small-text" style="width:70px;text-transform:uppercase;" />
                </span>
                <span style="display:inline-block;margin-right:15px;">
                    <label for="vp_anno"><strong>Anno (es. 2026):</strong></label>
                    <input type="text" id="vp_anno" name="vp_anno" value="<?php echo esc_attr($anno); ?>" class="small-text" style="width:75px;font-weight:bold;" />
                </span>
            </td>
        </tr>

        <tr><th><label for="vp_ora">Orario (es. 10:30):</label></th><td><input type="text" id="vp_ora" name="vp_ora" value="<?php echo esc_attr($ora); ?>" class="regular-text" style="width:120px;" /></td></tr>
        <tr><th><label for="vp_luogo">Luogo/Indirizzo:</label></th><td><input type="text" id="vp_luogo" name="vp_luogo" value="<?php echo esc_attr($luogo); ?>" class="regular-text" /></td></tr>
        <tr><th><label for="vp_target">Numero volontari/iscritti target:</label></th><td><input type="number" id="vp_target" name="vp_target" value="<?php echo esc_attr($target); ?>" class="small-text" /></td></tr>
        <tr>
            <th><label for="vp_passato">Stato Evento:</label></th>
            <td>
                <label>
                    <input type="checkbox" id="vp_passato" name="vp_passato" value="1" <?php checked($passato, true); ?> />
                    Segna come evento concluso/passato manualmente (apparirà nella sezione "Eventi Passati" dell'app)
                </label>
                <p class="description" style="color:#666;">Nota: se la data dell'evento è passata, il plugin lo mostrerà comunque in "Eventi Passati" automaticamente.</p>
            </td>
        </tr>
    </table>
    <script>
    (function(){
        var dateInput = document.getElementById('vp_data_completa');
        var dInput = document.getElementById('vp_giorno');
        var mInput = document.getElementById('vp_mese');
        var yInput = document.getElementById('vp_anno');
        var passCheck = document.getElementById('vp_passato');
        if (!dateInput || !dInput || !mInput || !yInput) return;

        var mapMesi = ['GEN','FEB','MAR','APR','MAG','GIU','LUG','AGO','SET','OTT','NOV','DIC'];

        dateInput.addEventListener('change', function(){
            if (!this.value) return;
            var parts = this.value.split('-'); // YYYY-MM-DD
            if (parts.length === 3) {
                var year = parts[0];
                var mNum = parseInt(parts[1], 10);
                var day = parseInt(parts[2], 10);
                yInput.value = year;
                mInput.value = mapMesi[mNum - 1] || 'OTT';
                dInput.value = day;

                var today = new Date().toISOString().slice(0, 10);
                if (dateInput.value < today && passCheck) {
                    passCheck.checked = true;
                }
            }
        });
    })();
    </script>
    <?php
}

function vpq_render_richiesta_meta($post) {
    wp_nonce_field('vpq_save_meta', 'vpq_meta_nonce');
    $luogo     = get_post_meta($post->ID, '_vp_luogo', true) ?: 'Parco di Via Fosso dell\'Osa';
    $obiettivo = get_post_meta($post->ID, '_vp_obiettivo', true) ?: '8';
    $urgente   = (bool) get_post_meta($post->ID, '_vp_urgente', true);
    ?>
    <table class="form-table">
        <tr><th><label for="vp_luogo">Dove (Luogo/Zona):</label></th><td><input type="text" id="vp_luogo" name="vp_luogo" value="<?php echo esc_attr($luogo); ?>" class="regular-text" /></td></tr>
        <tr><th><label for="vp_obiettivo">Volontari necessari (Target):</label></th><td><input type="number" id="vp_obiettivo" name="vp_obiettivo" value="<?php echo esc_attr($obiettivo); ?>" class="small-text" /></td></tr>
        <tr>
            <th><label for="vp_urgente">Priorità:</label></th>
            <td>
                <label>
                    <input type="checkbox" id="vp_urgente" name="vp_urgente" value="1" <?php checked($urgente, true); ?> />
                    <strong>Attività Urgente</strong> (mostrerà il badge rosso di allerta nell'app)
                </label>
            </td>
        </tr>
    </table>
    <?php
}

function vpq_render_segnalazione_meta($post) {
    wp_nonce_field('vpq_save_meta', 'vpq_meta_nonce');
    $luogo = get_post_meta($post->ID, '_vp_luogo', true);
    $stato = get_post_meta($post->ID, '_vp_stato', true) ?: '1';
    $nome  = get_post_meta($post->ID, '_vp_cittadino_nome', true);
    $tel   = get_post_meta($post->ID, '_vp_cittadino_tel', true);
    ?>
    <table class="form-table">
        <tr>
            <th><label for="vp_stato">Stato di avanzamento:</label></th>
            <td>
                <select id="vp_stato" name="vp_stato">
                    <option value="1" <?php selected($stato, '1'); ?>>🟡 Ricevuta (Presa in carico)</option>
                    <option value="2" <?php selected($stato, '2'); ?>>🔵 Inoltrata al Municipio VI / Enti</option>
                    <option value="3" <?php selected($stato, '3'); ?>>🟢 Risolta</option>
                </select>
                <p class="description">I cittadini nell'app vedranno l'aggiornamento in tempo reale con il badge colorato.</p>
            </td>
        </tr>
        <tr><th><label for="vp_luogo">Via / Zona:</label></th><td><input type="text" id="vp_luogo" name="vp_luogo" value="<?php echo esc_attr($luogo); ?>" class="regular-text" /></td></tr>
        <?php if ($nome || $tel): ?>
        <tr><th>Recapiti cittadino:</th><td><strong>Nome:</strong> <?php echo esc_html($nome ?: 'Anonimo'); ?> | <strong>Tel:</strong> <?php echo esc_html($tel ?: 'Non fornito'); ?></td></tr>
        <?php endif; ?>
    </table>
    <?php
}

function vpq_render_volontario_meta($post) {
    wp_nonce_field('vpq_save_meta', 'vpq_meta_nonce');
    $tel = get_post_meta($post->ID, '_vp_telefono', true);
    $att = get_post_meta($post->ID, '_vp_attivita', true);
    ?>
    <table class="form-table">
        <tr><th><label for="vp_telefono">Telefono diretto:</label></th><td><input type="text" id="vp_telefono" name="vp_telefono" value="<?php echo esc_attr($tel); ?>" class="regular-text" /> <a href="tel:<?php echo esc_attr($tel); ?>" class="button">Chiama</a> <a href="https://wa.me/39<?php echo esc_attr(preg_replace('/[^0-9]/', '', $tel)); ?>" target="_blank" class="button">WhatsApp</a></td></tr>
        <tr><th>Attività scelte:</th><td><?php echo esc_html(is_array($att) ? implode(', ', $att) : $att); ?></td></tr>
    </table>
    <?php
}

function vpq_render_commercio_meta($post) {
    wp_nonce_field('vpq_save_meta', 'vpq_meta_nonce');
    $categoria      = get_post_meta($post->ID, '_vp_categoria', true) ?: 'alimentari';
    $indirizzo      = get_post_meta($post->ID, '_vp_indirizzo', true) ?: '';
    $telefono       = get_post_meta($post->ID, '_vp_telefono', true) ?: '';
    $whatsapp       = get_post_meta($post->ID, '_vp_whatsapp', true) ?: '';
    $orari          = get_post_meta($post->ID, '_vp_orari', true) ?: 'Lun-Sab 09:00 - 19:30';
    $offerta_titolo = get_post_meta($post->ID, '_vp_offerta_titolo', true) ?: '';
    $offerta_det    = get_post_meta($post->ID, '_vp_offerta_dettaglio', true) ?: '';
    $lat            = get_post_meta($post->ID, '_vp_lat', true) ?: '41.8965';
    $lng            = get_post_meta($post->ID, '_vp_lng', true) ?: '12.6710';
    $verificato     = (bool) get_post_meta($post->ID, '_vp_verificato', true);
    $mipiace        = (int) get_post_meta($post->ID, '_vp_mipiace', true) ?: 1;
    $referente      = get_post_meta($post->ID, '_vp_nome_referente', true) ?: '';
    $email_ref      = get_post_meta($post->ID, '_vp_email_referente', true) ?: '';
    $is_pending     = $post->post_status === 'pending';
    ?>
    <?php if ($is_pending): ?>
    <div style="background:#fff3cd; border-left:4px solid #ffba00; padding:12px 15px; margin-bottom:15px; border-radius:4px;">
        <h3 style="margin:0 0 6px 0; color:#856404; font-size:14px; font-weight:bold;">
            ⚠️ ATTIVITÀ IN ATTESA DI APPROVAZIONE DALL'AMMINISTRATORE
        </h3>
        <p style="margin:0; font-size:12px; color:#856404;">
            Questa attività è stata inoltrata da un negoziante dal form dell'App. <strong>Non è visibile pubblicamente</strong> ai residenti finché non viene approvata. Per approvarla, clicca sul pulsante <em>"Pubblica"</em> nel box a destra (Stato: Pubblicato).
        </p>
    </div>
    <?php else: ?>
    <div style="background:#d4edda; border-left:4px solid #28a745; padding:10px 15px; margin-bottom:15px; border-radius:4px;">
        <p style="margin:0; font-size:12px; color:#155724; font-weight:bold;">
            ✅ ATTIVITÀ APPROVATA E PUBBLICATA: Visibile a tutti i residenti su Google Maps e nella vetrina commercianti.
        </p>
    </div>
    <?php endif; ?>

    <table class="form-table">
        <tr>
            <th><label for="vp_categoria">Categoria Merceologica:</label></th>
            <td>
                <select id="vp_categoria" name="vp_categoria">
                    <option value="alimentari" <?php selected($categoria, 'alimentari'); ?>>🍞 Alimentari & Gastronomia</option>
                    <option value="ristorazione" <?php selected($categoria, 'ristorazione'); ?>>🍕 Bar & Ristorazione</option>
                    <option value="salute" <?php selected($categoria, 'salute'); ?>>💊 Salute & Farmacia</option>
                    <option value="servizi" <?php selected($categoria, 'servizi'); ?>>🔧 Artigiani & Servizi</option>
                    <option value="casa" <?php selected($categoria, 'casa'); ?>>🏡 Casa, Giardino & Hobby</option>
                </select>
            </td>
        </tr>
        <tr>
            <th><label for="vp_indirizzo">Indirizzo a Villaggio Prenestino:</label></th>
            <td><input type="text" id="vp_indirizzo" name="vp_indirizzo" value="<?php echo esc_attr($indirizzo); ?>" class="regular-text" placeholder="es. Via Fosso dell'Osa 120" /></td>
        </tr>
        <tr>
            <th><label for="vp_telefono">Telefono Principale:</label></th>
            <td><input type="text" id="vp_telefono" name="vp_telefono" value="<?php echo esc_attr($telefono); ?>" class="regular-text" /></td>
        </tr>
        <tr>
            <th><label for="vp_whatsapp">WhatsApp Ordini (senza spazi, prefisso 39):</label></th>
            <td><input type="text" id="vp_whatsapp" name="vp_whatsapp" value="<?php echo esc_attr($whatsapp); ?>" class="regular-text" placeholder="es. 393401234567" /></td>
        </tr>
        <tr>
            <th><label for="vp_orari">Orari di Apertura:</label></th>
            <td><input type="text" id="vp_orari" name="vp_orari" value="<?php echo esc_attr($orari); ?>" class="regular-text" placeholder="es. Lun-Sab 08:30 - 19:30" /></td>
        </tr>
        <tr style="background:#fffbee;">
            <th><label for="vp_offerta_titolo">Titolo Offerta Residenti:</label></th>
            <td>
                <input type="text" id="vp_offerta_titolo" name="vp_offerta_titolo" value="<?php echo esc_attr($offerta_titolo); ?>" class="regular-text" placeholder="es. Sconto 10% sulla spesa del martedì" />
                <br />
                <input type="text" id="vp_offerta_dettaglio" name="vp_offerta_dettaglio" value="<?php echo esc_attr($offerta_det); ?>" class="regular-text" style="margin-top:5px;" placeholder="Dettaglio o condizioni coupon" />
            </td>
        </tr>
        <tr>
            <th>Coordinate Google Maps:</th>
            <td>
                <label>Lat: <input type="text" id="vp_lat" name="vp_lat" value="<?php echo esc_attr($lat); ?>" style="width:110px;" /></label>
                <label style="margin-left:10px;">Lng: <input type="text" id="vp_lng" name="vp_lng" value="<?php echo esc_attr($lng); ?>" style="width:110px;" /></label>
            </td>
        </tr>
        <tr>
            <th>Badge & Consensi:</th>
            <td>
                <label>
                    <input type="checkbox" id="vp_verificato" name="vp_verificato" value="1" <?php checked($verificato, true); ?> />
                    <strong>Attività Verificata</strong> (mostra la spunta verde di garanzia CdQ)
                </label>
                <br /><br />
                <label>
                    Numero "Mi piace" ricevuti: 
                    <input type="number" id="vp_mipiace" name="vp_mipiace" value="<?php echo esc_attr($mipiace); ?>" style="width:70px;" min="0" />
                </label>
            </td>
        </tr>
        <?php if ($referente || $email_ref): ?>
        <tr style="background:#f9f9f9;">
            <th>Contatto Richiedente / Titolare:</th>
            <td>
                <strong>Nome:</strong> <?php echo esc_html($referente ?: '—'); ?> | 
                <strong>Recapito / Email:</strong> <?php echo esc_html($email_ref ?: '—'); ?>
            </td>
        </tr>
        <?php endif; ?>
    </table>
    <?php
}

add_action('save_post', 'vpq_save_meta');
function vpq_save_meta($post_id) {
    if (!isset($_POST['vpq_meta_nonce']) || !wp_verify_nonce($_POST['vpq_meta_nonce'], 'vpq_save_meta')) {
        return;
    }
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
    if (!current_user_can('edit_post', $post_id)) return;

    if (isset($_POST['vp_giorno'])) update_post_meta($post_id, '_vp_giorno', sanitize_text_field($_POST['vp_giorno']));
    if (isset($_POST['vp_mese'])) update_post_meta($post_id, '_vp_mese', sanitize_text_field($_POST['vp_mese']));
    if (isset($_POST['vp_anno'])) update_post_meta($post_id, '_vp_anno', sanitize_text_field($_POST['vp_anno']));
    if (isset($_POST['vp_data_completa'])) update_post_meta($post_id, '_vp_data_completa', sanitize_text_field($_POST['vp_data_completa']));
    if (isset($_POST['vp_ora'])) update_post_meta($post_id, '_vp_ora', sanitize_text_field($_POST['vp_ora']));
    if (isset($_POST['vp_luogo'])) update_post_meta($post_id, '_vp_luogo', sanitize_text_field($_POST['vp_luogo']));
    if (isset($_POST['vp_target'])) update_post_meta($post_id, '_vp_target', absint($_POST['vp_target']));
    if (isset($_POST['vp_tipo'])) update_post_meta($post_id, '_vp_tipo', sanitize_text_field($_POST['vp_tipo']));
    if (isset($_POST['vp_quota'])) update_post_meta($post_id, '_vp_quota', sanitize_text_field($_POST['vp_quota']));

    // Se stiamo salvando un vp_evento, normalizza la data e calcola automaticamente lo stato passato
    if (get_post_type($post_id) === 'vp_evento') {
        $g = isset($_POST['vp_giorno']) ? sanitize_text_field($_POST['vp_giorno']) : get_post_meta($post_id, '_vp_giorno', true);
        $m = isset($_POST['vp_mese']) ? sanitize_text_field($_POST['vp_mese']) : get_post_meta($post_id, '_vp_mese', true);
        $y = isset($_POST['vp_anno']) ? sanitize_text_field($_POST['vp_anno']) : get_post_meta($post_id, '_vp_anno', true);
        $ora = isset($_POST['vp_ora']) ? sanitize_text_field($_POST['vp_ora']) : get_post_meta($post_id, '_vp_ora', true);
        $pass_check = isset($_POST['vp_passato']) ? true : false;

        $norm = vpq_normalize_data_evento($g, $m, $y, $ora, $pass_check);
        update_post_meta($post_id, '_vp_giorno', $norm['giorno']);
        update_post_meta($post_id, '_vp_mese', $norm['mese']);
        update_post_meta($post_id, '_vp_anno', $norm['anno']);
        update_post_meta($post_id, '_vp_data_completa', $norm['data_completa']);
        update_post_meta($post_id, '_vp_passato', $norm['is_passato'] ? '1' : '0');
    } else {
        update_post_meta($post_id, '_vp_passato', isset($_POST['vp_passato']) ? '1' : '0');
    }
    if (isset($_POST['vp_obiettivo'])) update_post_meta($post_id, '_vp_obiettivo', absint($_POST['vp_obiettivo']));
    update_post_meta($post_id, '_vp_urgente', isset($_POST['vp_urgente']) ? '1' : '0');
    if (isset($_POST['vp_stato'])) update_post_meta($post_id, '_vp_stato', sanitize_text_field($_POST['vp_stato']));
    if (isset($_POST['vp_telefono'])) update_post_meta($post_id, '_vp_telefono', sanitize_text_field($_POST['vp_telefono']));

    // Metadati Commercianti
    if (isset($_POST['vp_categoria'])) update_post_meta($post_id, '_vp_categoria', sanitize_text_field($_POST['vp_categoria']));
    if (isset($_POST['vp_indirizzo'])) update_post_meta($post_id, '_vp_indirizzo', sanitize_text_field($_POST['vp_indirizzo']));
    if (isset($_POST['vp_whatsapp'])) update_post_meta($post_id, '_vp_whatsapp', sanitize_text_field($_POST['vp_whatsapp']));
    if (isset($_POST['vp_orari'])) update_post_meta($post_id, '_vp_orari', sanitize_text_field($_POST['vp_orari']));
    if (isset($_POST['vp_offerta_titolo'])) update_post_meta($post_id, '_vp_offerta_titolo', sanitize_text_field($_POST['vp_offerta_titolo']));
    if (isset($_POST['vp_offerta_dettaglio'])) update_post_meta($post_id, '_vp_offerta_dettaglio', sanitize_text_field($_POST['vp_offerta_dettaglio']));
    if (isset($_POST['vp_lat'])) update_post_meta($post_id, '_vp_lat', sanitize_text_field($_POST['vp_lat']));
    if (isset($_POST['vp_lng'])) update_post_meta($post_id, '_vp_lng', sanitize_text_field($_POST['vp_lng']));
    update_post_meta($post_id, '_vp_verificato', isset($_POST['vp_verificato']) ? '1' : '0');
    if (isset($_POST['vp_mipiace'])) update_post_meta($post_id, '_vp_mipiace', absint($_POST['vp_mipiace']));
}

/**
 * Colonne Personalizzate nel Back Office
 */
// 1. Richieste Volontariato: chi si è offerto con telefono
add_filter('manage_vp_richiesta_posts_columns', function($cols) {
    $cols['vp_volontari_lista'] = 'Volontari che hanno aderito (Nome & Tel)';
    $cols['vp_progresso']       = 'Stato Aderiti';
    return $cols;
});
add_action('manage_vp_richiesta_posts_custom_column', function($col, $post_id) {
    global $wpdb;
    if ($col === 'vp_volontari_lista') {
        $table = $wpdb->prefix . 'vp_interazioni';
        $rows  = $wpdb->get_results($wpdb->prepare("SELECT nome, telefono, creato FROM $table WHERE tipo='cisono' AND post_id=%d ORDER BY creato DESC LIMIT 30", $post_id));
        if ($rows) {
            echo '<ul style="margin:0;padding-left:15px;">';
            foreach ($rows as $r) {
                $nome = $r->nome ? esc_html($r->nome) : '<em>Anonimo</em>';
                $tel  = $r->telefono ? ' (<a href="tel:' . esc_attr($r->telefono) . '">' . esc_html($r->telefono) . '</a>)' : '';
                echo '<li>' . $nome . $tel . ' <small style="color:#888;">[' . esc_html(date_i18n('d/m H:i', strtotime($r->creato))) . ']</small></li>';
            }
            echo '</ul>';
        } else {
            echo '<span style="color:#999;">Nessun volontario ancora</span>';
        }
    }
    if ($col === 'vp_progresso') {
        $table    = $wpdb->prefix . 'vp_interazioni';
        $aderiti  = (int) $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM $table WHERE tipo='cisono' AND post_id=%d", $post_id));
        $target   = (int) get_post_meta($post_id, '_vp_obiettivo', true) ?: 8;
        $perc     = min(100, round(($aderiti / max(1, $target)) * 100));
        echo '<strong>' . $aderiti . ' / ' . $target . '</strong> (' . $perc . '%)';
    }
}, 10, 2);

// 2. Segnalazioni: Stato e Foto
add_filter('manage_vp_segnalazione_posts_columns', function($cols) {
    $cols['vp_stato_col'] = 'Stato Segnalazione';
    $cols['vp_luogo_col'] = 'Indirizzo/Luogo';
    $cols['vp_foto_col']  = 'Foto';
    return $cols;
});
add_action('manage_vp_segnalazione_posts_custom_column', function($col, $post_id) {
    if ($col === 'vp_stato_col') {
        $s = get_post_meta($post_id, '_vp_stato', true) ?: '1';
        $map = [
            '1' => '<span style="background:#fff3cd;color:#856404;padding:3px 8px;border-radius:12px;font-weight:bold;">Ricevuta</span>',
            '2' => '<span style="background:#cce5ff;color:#004085;padding:3px 8px;border-radius:12px;font-weight:bold;">Inoltrata</span>',
            '3' => '<span style="background:#d4edda;color:#155724;padding:3px 8px;border-radius:12px;font-weight:bold;">Risolta</span>',
        ];
        echo isset($map[$s]) ? $map[$s] : $s;
    }
    if ($col === 'vp_luogo_col') {
        echo esc_html(get_post_meta($post_id, '_vp_luogo', true) ?: '—');
    }
    if ($col === 'vp_foto_col') {
        if (has_post_thumbnail($post_id)) {
            echo get_the_post_thumbnail($post_id, [50, 50], ['style' => 'border-radius:4px;object-fit:cover;']);
        } else {
            echo '<span style="color:#999;">Nessuna</span>';
        }
    }
}, 10, 2);

// 3. Volontari Registrati: Telefono e Attività
add_filter('manage_vp_volontario_posts_columns', function($cols) {
    $cols['vp_tel_col'] = 'Telefono';
    $cols['vp_att_col'] = 'Attività Offerte';
    return $cols;
});
add_action('manage_vp_volontario_posts_custom_column', function($col, $post_id) {
    if ($col === 'vp_tel_col') {
        $tel = get_post_meta($post_id, '_vp_telefono', true);
        echo $tel ? '<a href="tel:' . esc_attr($tel) . '" class="button button-small">' . esc_html($tel) . '</a>' : '—';
    }
    if ($col === 'vp_att_col') {
        $att = get_post_meta($post_id, '_vp_attivita', true);
        echo esc_html(is_array($att) ? implode(', ', $att) : ($att ?: 'Tutte'));
    }
}, 10, 2);

// 4. Eventi Quartiere: Data Completa, Stato (In programma / Concluso), Partecipanti
add_filter('manage_vp_evento_posts_columns', function($cols) {
    $cols['vp_data_col']   = 'Data Evento';
    $cols['vp_stato_ev']   = 'Stato Evento';
    $cols['vp_part_col']   = 'Partecipanti';
    $cols['vp_luogo_ev']   = 'Luogo';
    return $cols;
});
add_action('manage_vp_evento_posts_custom_column', function($col, $post_id) {
    global $wpdb;
    if ($col === 'vp_data_col') {
        $g = get_post_meta($post_id, '_vp_giorno', true);
        $m = get_post_meta($post_id, '_vp_mese', true);
        $y = get_post_meta($post_id, '_vp_anno', true) ?: date('Y');
        $ora = get_post_meta($post_id, '_vp_ora', true) ?: '10:00';
        echo '<strong>' . esc_html($g . ' ' . $m . ' ' . $y) . '</strong> <small>(' . esc_html($ora) . ')</small>';
    }
    if ($col === 'vp_stato_ev') {
        $g = get_post_meta($post_id, '_vp_giorno', true);
        $m = get_post_meta($post_id, '_vp_mese', true);
        $y = get_post_meta($post_id, '_vp_anno', true) ?: date('Y');
        $pass_meta = (bool) get_post_meta($post_id, '_vp_passato', true);
        $norm = vpq_normalize_data_evento($g, $m, $y, '10:00', $pass_meta);

        if ($norm['is_passato']) {
            echo '<span style="background:#e2e8f0;color:#475569;padding:3px 8px;border-radius:12px;font-weight:bold;font-size:11px;">🏁 Concluso / Passato</span>';
        } else {
            echo '<span style="background:#dcfce7;color:#166534;padding:3px 8px;border-radius:12px;font-weight:bold;font-size:11px;">🟢 In Programma</span>';
        }
    }
    if ($col === 'vp_part_col') {
        $table = $wpdb->prefix . 'vp_interazioni';
        $count = (int) $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM $table WHERE tipo='evento_vengo' AND post_id=%d", $post_id));
        $target = (int) get_post_meta($post_id, '_vp_target', true) ?: 10;
        echo '<strong>' . $count . ' / ' . $target . '</strong>';
    }
    if ($col === 'vp_luogo_ev') {
        echo esc_html(get_post_meta($post_id, '_vp_luogo', true) ?: '—');
    }
}, 10, 2);

// 5. Commercianti e Negozi (con stato di approvazione e contatti)
add_filter('manage_vp_commercio_posts_columns', function($cols) {
    $new_cols = [];
    foreach ($cols as $k => $v) {
        $new_cols[$k] = $v;
        if ($k === 'title') {
            $new_cols['vp_cat_col']          = 'Categoria';
            $new_cols['vp_indirizzo_col']    = 'Indirizzo';
            $new_cols['vp_contatti_col']     = 'Telefono & WhatsApp';
            $new_cols['vp_approvazione_col'] = 'Stato Moderazione';
            $new_cols['vp_mipiace_col']      = 'Mi Piace';
        }
    }
    return $new_cols;
});
add_action('manage_vp_commercio_posts_custom_column', function($col, $post_id) {
    if ($col === 'vp_cat_col') {
        $cat = get_post_meta($post_id, '_vp_categoria', true) ?: 'alimentari';
        $labels = [
            'alimentari'   => '🍞 Alimentari',
            'ristorazione' => '🍕 Ristorazione',
            'salute'       => '💊 Salute & Farmacia',
            'servizi'      => '🔧 Servizi & Artigiani',
            'casa'         => '🏡 Casa & Hobby',
        ];
        echo isset($labels[$cat]) ? esc_html($labels[$cat]) : esc_html($cat);
    }
    if ($col === 'vp_indirizzo_col') {
        echo esc_html(get_post_meta($post_id, '_vp_indirizzo', true) ?: '—');
    }
    if ($col === 'vp_contatti_col') {
        $tel = get_post_meta($post_id, '_vp_telefono', true);
        $wa  = get_post_meta($post_id, '_vp_whatsapp', true);
        if ($tel) echo '<div>📞 <a href="tel:' . esc_attr($tel) . '">' . esc_html($tel) . '</a></div>';
        if ($wa) echo '<div>💬 <a href="https://wa.me/' . esc_attr($wa) . '" target="_blank">WhatsApp</a></div>';
        if (!$tel && !$wa) echo '—';
    }
    if ($col === 'vp_approvazione_col') {
        $status = get_post_status($post_id);
        if ($status === 'pending') {
            echo '<span style="background:#fff3cd;color:#856404;padding:3px 8px;border-radius:12px;font-weight:bold;font-size:11px;">⏳ In Attesa Approvazione</span>';
        } elseif ($status === 'publish') {
            echo '<span style="background:#d4edda;color:#155724;padding:3px 8px;border-radius:12px;font-weight:bold;font-size:11px;">✅ Pubblicata su App</span>';
        } else {
            echo esc_html($status);
        }
    }
    if ($col === 'vp_mipiace_col') {
        $mp = (int) get_post_meta($post_id, '_vp_mipiace', true) ?: 0;
        echo '<strong>' . $mp . '</strong> 👍';
    }
}, 10, 2);


/**
 * Gestione CORS per Web App
 */
add_action('rest_api_init', function() {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    add_filter('rest_pre_serve_request', function($value) {
        $origin = get_http_origin();
        $allowed = get_option('vpq_allow_origins', '*');
        
        if ($allowed === '*' || ($origin && in_array($origin, array_map('trim', explode(',', $allowed)))) ) {
            header('Access-Control-Allow-Origin: ' . ($origin ? $origin : '*'));
        } else {
            header('Access-Control-Allow-Origin: *');
        }
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Headers: Content-Type, X-VP-Key, X-VP-Token, Authorization');
        return $value;
    });
}, 15);


/**
 * REST API Endpoints personalizzati (/wp-json/vp/v1/...)
 */
add_action('rest_api_init', function() {
    $ns = 'vp/v1';

    // 1. GET /wp-json/vp/v1/dati - Scarica tutti i dati pubblici in una chiamata sola
    register_rest_route($ns, '/dati', [
        'methods'             => 'GET',
        'callback'            => 'vpq_api_get_dati',
        'permission_callback' => '__return_true',
    ]);

    // 2. GET /wp-json/vp/v1/news - Ultimi 3 articoli WordPress del sito
    register_rest_route($ns, '/news', [
        'methods'             => 'GET',
        'callback'            => 'vpq_api_get_news',
        'permission_callback' => '__return_true',
    ]);

    // 3. POST /wp-json/vp/v1/interazione - Prenotazione evento, volontariato "Ci sono", like proposta
    register_rest_route($ns, '/interazione', [
        'methods'             => 'POST',
        'callback'            => 'vpq_api_post_interazione',
        'permission_callback' => '__return_true',
    ]);

    // 4. POST /wp-json/vp/v1/segnalazione - Invio segnalazione con foto
    register_rest_route($ns, '/segnalazione', [
        'methods'             => 'POST',
        'callback'            => 'vpq_api_post_segnalazione',
        'permission_callback' => '__return_true',
    ]);

    // 5. POST /wp-json/vp/v1/proposta - Invio nuova idea cittadino
    register_rest_route($ns, '/proposta', [
        'methods'             => 'POST',
        'callback'            => 'vpq_api_post_proposta',
        'permission_callback' => '__return_true',
    ]);

    // 6. POST /wp-json/vp/v1/volontario - Registrazione volontario dal form Partecipa
    register_rest_route($ns, '/volontario', [
        'methods'             => 'POST',
        'callback'            => 'vpq_api_post_volontario',
        'permission_callback' => '__return_true',
    ]);

    // 7. GET /wp-json/vp/v1/insights - Statistiche aggregate e metriche grafiche
    register_rest_route($ns, '/insights', [
        'methods'             => 'GET',
        'callback'            => 'vpq_api_get_insights',
        'permission_callback' => '__return_true',
    ]);

    // 8. POST /wp-json/vp/v1/evento - Creazione nuovo evento
    register_rest_route($ns, '/evento', [
        'methods'             => 'POST',
        'callback'            => 'vpq_api_post_evento',
        'permission_callback' => '__return_true',
    ]);

    // 9. POST /wp-json/vp/v1/richiesta - Creazione nuova attività volontariato
    register_rest_route($ns, '/richiesta', [
        'methods'             => 'POST',
        'callback'            => 'vpq_api_post_richiesta',
        'permission_callback' => '__return_true',
    ]);

    // 10. POST /wp-json/vp/v1/segnalazione/stato - Aggiornamento stato segnalazione
    register_rest_route($ns, '/segnalazione/stato', [
        'methods'             => 'POST',
        'callback'            => 'vpq_api_post_segnalazione_stato',
        'permission_callback' => '__return_true',
    ]);

    // 11. GET /wp-json/vp/v1/classifica - Classifica dinamica cittadini
    register_rest_route($ns, '/classifica', [
        'methods'             => 'GET',
        'callback'            => 'vpq_api_get_classifica',
        'permission_callback' => '__return_true',
    ]);

    // 12. POST /wp-json/vp/v1/classifica/sync - Sincronizzazione punti utente da app
    register_rest_route($ns, '/classifica/sync', [
        'methods'             => 'POST',
        'callback'            => 'vpq_api_post_classifica_sync',
        'permission_callback' => '__return_true',
    ]);

    // 13. POST /wp-json/vp/v1/commercio - Registrazione nuova attività commerciale (Stato: Pending per approvazione admin)
    register_rest_route($ns, '/commercio', [
        'methods'             => 'POST',
        'callback'            => 'vpq_api_post_commercio',
        'permission_callback' => '__return_true',
    ]);

    // 14. POST /wp-json/vp/v1/commercio/vota - Voto mi piace commerciante
    register_rest_route($ns, '/commercio/vota', [
        'methods'             => 'POST',
        'callback'            => 'vpq_api_post_commercio_vota',
        'permission_callback' => '__return_true',
    ]);
});

/**
 * 1. CALLBACK: GET /dati
 */
function vpq_api_get_dati() {
    global $wpdb;
    $table = $wpdb->prefix . 'vp_interazioni';

    // Eventi
    $eventi_query = new WP_Query([
        'post_type'      => 'vp_evento',
        'post_status'    => 'publish',
        'posts_per_page' => 50,
        'orderby'        => 'date',
        'order'          => 'DESC',
    ]);
    $eventi = [];
    foreach ($eventi_query->posts as $p) {
        $count = (int) $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM $table WHERE tipo='evento_vengo' AND post_id=%d", $p->ID));
        $giorno_raw  = get_post_meta($p->ID, '_vp_giorno', true) ?: date('d');
        $mese_raw    = get_post_meta($p->ID, '_vp_mese', true) ?: strtoupper(date('M'));
        $anno_raw    = get_post_meta($p->ID, '_vp_anno', true) ?: date('Y');
        $ora         = get_post_meta($p->ID, '_vp_ora', true) ?: '10:00';
        $passato_raw = (bool) get_post_meta($p->ID, '_vp_passato', true);

        // Normalizza la data ed esegue il controllo automatico passato rispetto ad oggi
        $norm = vpq_normalize_data_evento($giorno_raw, $mese_raw, $anno_raw, $ora, $passato_raw);

        $eventi[] = [
            'id'           => $p->ID,
            't'            => $p->post_title,
            'p'            => wp_strip_all_tags($p->post_content),
            'd'            => $norm['giorno'],
            'm'            => $norm['mese'],
            'anno'         => $norm['anno'],
            'dataCompleta' => $norm['data_completa'],
            'ora'          => $ora,
            'luogo'        => get_post_meta($p->ID, '_vp_luogo', true) ?: 'Villaggio Prenestino',
            'n'            => $count,
            'target'       => (int) get_post_meta($p->ID, '_vp_target', true) ?: 10,
            'tipo'         => get_post_meta($p->ID, '_vp_tipo', true) ?: 'volontariato',
            'passato'      => $norm['is_passato'],
            'quota'        => get_post_meta($p->ID, '_vp_quota', true) ?: '',
        ];
    }

    // Richieste Volontariato ("Serve una mano")
    $richieste_query = new WP_Query([
        'post_type'      => 'vp_richiesta',
        'post_status'    => 'publish',
        'posts_per_page' => 50,
        'orderby'        => 'date',
        'order'          => 'DESC',
    ]);
    $richieste = [];
    foreach ($richieste_query->posts as $p) {
        $aderiti = (int) $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM $table WHERE tipo='cisono' AND post_id=%d", $p->ID));
        $richieste[] = [
            'id'     => $p->ID,
            't'      => $p->post_title,
            'w'      => get_post_meta($p->ID, '_vp_luogo', true) ?: 'Villaggio Prenestino',
            'desc'   => wp_strip_all_tags($p->post_content),
            'have'   => $aderiti,
            'need'   => (int) get_post_meta($p->ID, '_vp_obiettivo', true) ?: 8,
            'urgente'=> (bool) get_post_meta($p->ID, '_vp_urgente', true),
        ];
    }

    // Segnalazioni pubbliche
    $segnalazioni_query = new WP_Query([
        'post_type'      => 'vp_segnalazione',
        'post_status'    => 'publish',
        'posts_per_page' => 30,
        'orderby'        => 'date',
        'order'          => 'DESC',
    ]);
    $segnalazioni = [];
    foreach ($segnalazioni_query->posts as $p) {
        $thumb = get_the_post_thumbnail_url($p->ID, 'large');
        $altre_foto = get_post_meta($p->ID, '_vp_foto_urls', true);
        $foto_arr = [];
        if ($thumb) $foto_arr[] = $thumb;
        if (is_array($altre_foto)) {
            foreach ($altre_foto as $f) {
                if ($f && !in_array($f, $foto_arr)) $foto_arr[] = $f;
            }
        }

        $segnalazioni[] = [
            'id'    => $p->ID,
            't'     => $p->post_title,
            'w'     => get_post_meta($p->ID, '_vp_luogo', true) ?: 'Villaggio Prenestino',
            'desc'  => wp_strip_all_tags($p->post_content),
            's'     => (int) (get_post_meta($p->ID, '_vp_stato', true) ?: 1),
            'ph'    => $foto_arr,
            'data'  => get_the_date('d/m/Y', $p->ID),
        ];
    }

    // Proposte cittadinanza
    $proposte_query = new WP_Query([
        'post_type'      => 'vp_proposta',
        'post_status'    => 'publish',
        'posts_per_page' => 30,
        'orderby'        => 'date',
        'order'          => 'DESC',
    ]);
    $proposte = [];
    foreach ($proposte_query->posts as $p) {
        $voti = (int) $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM $table WHERE tipo='proposta_vota' AND post_id=%d", $p->ID));
        $proposte[] = [
            'id' => $p->ID,
            't'  => $p->post_title,
            'v'  => $voti,
        ];
    }

    // Ordina le proposte per numero di "Mi piace" decrescente (le più votate per prime)
    usort($proposte, function($a, $b) {
        return $b['v'] - $a['v'];
    });

    // Commercianti e Negozi (Solo quelli approvati e pubblicati dal moderatore!)
    $commercio_query = new WP_Query([
        'post_type'      => 'vp_commercio',
        'post_status'    => 'publish', // Esclude categoricamente quelli pending/in attesa
        'posts_per_page' => 60,
        'orderby'        => 'date',
        'order'          => 'DESC',
    ]);
    $commercio = [];
    foreach ($commercio_query->posts as $p) {
        $thumb      = get_post_meta($p->ID, '_vp_immagine', true) ?: get_the_post_thumbnail_url($p->ID, 'large');
        $logo       = get_post_meta($p->ID, '_vp_logo', true) ?: '';
        $off_titolo = get_post_meta($p->ID, '_vp_offerta_titolo', true);
        $off_det    = get_post_meta($p->ID, '_vp_offerta_dettaglio', true);
        $cat        = get_post_meta($p->ID, '_vp_categoria', true) ?: 'alimentari';
        $voti_mp    = (int) ($wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM $table WHERE tipo='commercio_vota' AND post_id=%d", $p->ID)) ?: 0);
        $meta_mp    = (int) get_post_meta($p->ID, '_vp_mipiace', true) ?: 1;
        $tot_mp     = max($meta_mp, $voti_mp);

        $commercio[] = [
            'id'             => $p->ID,
            'nome'           => $p->post_title,
            'categoria'      => $cat,
            'descrizione'    => wp_strip_all_tags($p->post_content),
            'indirizzo'      => get_post_meta($p->ID, '_vp_indirizzo', true) ?: 'Villaggio Prenestino',
            'lat'            => floatval(get_post_meta($p->ID, '_vp_lat', true) ?: 41.8965),
            'lng'            => floatval(get_post_meta($p->ID, '_vp_lng', true) ?: 12.6710),
            'telefono'       => get_post_meta($p->ID, '_vp_telefono', true) ?: '',
            'whatsapp'       => get_post_meta($p->ID, '_vp_whatsapp', true) ?: '',
            'orari'          => get_post_meta($p->ID, '_vp_orari', true) ?: 'Lun-Sab 09:00 - 19:30',
            'apertoOra'      => true,
            'verificato'     => (bool) get_post_meta($p->ID, '_vp_verificato', true),
            'miPiace'        => $tot_mp,
            'immagine'       => $thumb ?: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
            'logo'           => $logo,
            'offertaAttiva'  => $off_titolo ? [
                'titolo'   => $off_titolo,
                'dettaglio'=> $off_det ?: 'Offerta per i residenti del quartiere',
                'scadenza' => 'Promozione attiva',
            ] : null,
        ];
    }

    // News/Articoli
    $news = vpq_get_ultimi_articoli();

    return rest_ensure_response([
        'success'      => true,
        'eventi'       => $eventi,
        'richieste'    => $richieste,
        'segnalazioni' => $segnalazioni,
        'proposte'     => $proposte,
        'commercio'    => $commercio,
        'classifica'   => vpq_api_get_classifica_data(),
        'news'         => $news,
    ]);
}

/**
 * 2. CALLBACK: GET /news (ultimi 3 articoli dal blog WordPress)
 */
function vpq_api_get_news() {
    return rest_ensure_response(vpq_get_ultimi_articoli());
}

function vpq_get_ultimi_articoli() {
    $posts = get_posts([
        'numberposts' => 3,
        'post_status' => 'publish',
        'orderby'     => 'date',
        'order'       => 'DESC',
    ]);
    $res = [];
    foreach ($posts as $post) {
        $thumb = get_the_post_thumbnail_url($post->ID, 'medium_large');
        $raw_excerpt = get_the_excerpt($post->ID);
        if (!$raw_excerpt) {
            $raw_excerpt = wp_trim_words($post->post_content, 25);
        }
        $clean = strip_shortcodes($raw_excerpt);
        $clean = preg_replace('/\[\/?et_pb_[^\]]*\]/i', ' ', $clean);
        $clean = preg_replace('/\[[^\]]+\]/', ' ', $clean);
        $estratto = wp_strip_all_tags($clean);
        $estratto = trim(preg_replace('/\s+/', ' ', $estratto));
        if (empty($estratto)) {
            $estratto = 'Leggi l\'articolo completo sul sito di Villaggio Prenestino.';
        }

        $res[] = [
            'id'      => $post->ID,
            'titolo'  => html_entity_decode(get_the_title($post->ID)),
            'estratto'=> $estratto,
            'data'    => get_the_date('d M Y', $post->ID),
            'link'    => get_permalink($post->ID),
            'img'     => $thumb ?: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=600&q=80',
        ];
    }
    return $res;
}

/**
 * 3. CALLBACK: POST /interazione (Adesione evento, volontariato "Ci sono", like)
 */
function vpq_api_post_interazione(WP_REST_Request $request) {
    global $wpdb;
    $table = $wpdb->prefix . 'vp_interazioni';

    $tipo     = sanitize_key($request->get_param('tipo') ?: $request->get_param('azione'));
    $post_id  = absint($request->get_param('id') ?: $request->get_param('post_id'));
    $token    = sanitize_text_field($request->get_header('X-VP-Token') ?: $request->get_param('token') ?: 'anon_' . wp_generate_password(12, false));
    $nome     = sanitize_text_field($request->get_param('nome') ?: '');
    $telefono = sanitize_text_field($request->get_param('telefono') ?: $request->get_param('tel') ?: '');
    $annulla  = (bool) $request->get_param('annulla');

    if (!$tipo || !$post_id) {
        return new WP_Error('vpq_bad_request', 'Parametri mancanti.', ['status' => 400]);
    }

    // Modalità annullamento
    if ($annulla) {
        $wpdb->delete($table, [
            'tipo'    => $tipo,
            'post_id' => $post_id,
            'token'   => $token,
        ], ['%s', '%d', '%s']);

        $count = (int) $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM $table WHERE tipo=%s AND post_id=%d", $tipo, $post_id));
        return rest_ensure_response([
            'success'  => true,
            'azione'   => 'annullato',
            'conteggio'=> $count,
        ]);
    }

    // Inserimento idempotente
    $wpdb->query($wpdb->prepare(
        "INSERT INTO $table (tipo, post_id, token, nome, telefono, creato)
         VALUES (%s, %d, %s, %s, %s, NOW())
         ON DUPLICATE KEY UPDATE nome = VALUES(nome), telefono = VALUES(telefono)",
        $tipo, $post_id, $token, $nome, $telefono
    ));

    $count = (int) $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM $table WHERE tipo=%s AND post_id=%d", $tipo, $post_id));

    return rest_ensure_response([
        'success'   => true,
        'azione'    => 'registrato',
        'conteggio' => $count,
        'messaggio' => 'Grazie per il tuo contributo al quartiere!'
    ]);
}

/**
 * 4. CALLBACK: POST /segnalazione
 */
function vpq_api_post_segnalazione(WP_REST_Request $request) {
    $titolo      = sanitize_text_field($request->get_param('titolo') ?: 'Segnalazione dal quartiere');
    $luogo       = sanitize_text_field($request->get_param('luogo') ?: $request->get_param('dove') ?: 'Villaggio Prenestino');
    $descrizione = sanitize_textarea_field($request->get_param('descrizione') ?: '');
    $nome        = sanitize_text_field($request->get_param('nome') ?: 'Cittadino');
    $telefono    = sanitize_text_field($request->get_param('telefono') ?: '');
    $foto_base64 = $request->get_param('foto'); // Array di stringhe base64

    // Creazione della segnalazione in bozza/pending per moderazione
    $post_id = wp_insert_post([
        'post_type'    => 'vp_segnalazione',
        'post_title'   => $titolo . ' - ' . $luogo,
        'post_content' => $descrizione,
        'post_status'  => 'pending', // In attesa di approvazione dal direttivo
    ]);

    if (is_wp_error($post_id)) {
        return new WP_Error('vpq_save_error', 'Impossibile salvare la segnalazione.', ['status' => 500]);
    }

    update_post_meta($post_id, '_vp_luogo', $luogo);
    update_post_meta($post_id, '_vp_stato', '1'); // 1 = Ricevuta
    update_post_meta($post_id, '_vp_cittadino_nome', $nome);
    update_post_meta($post_id, '_vp_cittadino_tel', $telefono);

    // Caricamento foto allegate nella Media Library di WordPress
    $foto_urls = [];
    if (is_array($foto_base64)) {
        require_once ABSPATH . 'wp-admin/includes/image.php';
        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/media.php';

        $first = true;
        foreach (array_slice($foto_base64, 0, 3) as $data_uri) {
            if (preg_match('/^data:image\/(\w+);base64,/', $data_uri, $type)) {
                $raw_data = substr($data_uri, strpos($data_uri, ',') + 1);
                $decoded  = base64_decode($raw_data);
                if ($decoded) {
                    $ext = strtolower($type[1]);
                    if (!in_array($ext, ['jpg', 'jpeg', 'png', 'webp'])) $ext = 'jpg';
                    $filename = 'segnalazione-' . $post_id . '-' . wp_generate_password(6, false) . '.' . $ext;
                    $upload   = wp_upload_bits($filename, null, $decoded);
                    if (empty($upload['error'])) {
                        $attachment = [
                            'post_mime_type' => 'image/' . ($ext === 'jpg' ? 'jpeg' : $ext),
                            'post_title'     => sanitize_file_name($filename),
                            'post_content'   => '',
                            'post_status'    => 'inherit'
                        ];
                        $attach_id = wp_insert_attachment($attachment, $upload['file'], $post_id);
                        $attach_data = wp_generate_attachment_metadata($attach_id, $upload['file']);
                        wp_update_attachment_metadata($attach_id, $attach_data);
                        $foto_urls[] = $upload['url'];
                        if ($first) {
                            set_post_thumbnail($post_id, $attach_id);
                            $first = false;
                        }
                    }
                }
            }
        }
        update_post_meta($post_id, '_vp_foto_urls', $foto_urls);
    }

    return rest_ensure_response([
        'success'   => true,
        'post_id'   => $post_id,
        'messaggio' => 'Segnalazione ricevuta con successo! Verrà revisionata dall\'associazione e inoltrata.',
    ]);
}

/**
 * 5. CALLBACK: POST /proposta
 */
function vpq_api_post_proposta(WP_REST_Request $request) {
    $titolo = sanitize_text_field($request->get_param('titolo'));
    if (!$titolo) {
        return new WP_Error('vpq_bad_data', 'Inserisci un titolo per la proposta.', ['status' => 400]);
    }

    $post_id = wp_insert_post([
        'post_type'    => 'vp_proposta',
        'post_title'   => $titolo,
        'post_status'  => 'pending', // Approvazione prima della pubblicazione
    ]);

    return rest_ensure_response([
        'success'   => true,
        'messaggio' => 'Proposta inviata! Sarà pubblicata nell\'app dopo una rapida verifica.',
    ]);
}

/**
 * 6. CALLBACK: POST /volontario (Albo Volontari)
 */
function vpq_api_post_volontario(WP_REST_Request $request) {
    $nome      = sanitize_text_field($request->get_param('nome') ?: 'Volontario');
    $telefono  = sanitize_text_field($request->get_param('telefono') ?: $request->get_param('tel'));
    $attivita  = $request->get_param('attivita');
    $note      = sanitize_textarea_field($request->get_param('note') ?: '');

    if (empty($telefono)) {
        return new WP_Error('vpq_no_phone', 'Il recapito telefonico è obbligatorio per essere ricontattato.', ['status' => 400]);
    }

    $att_str = is_array($attivita) ? implode(', ', array_map('sanitize_text_field', $attivita)) : sanitize_text_field($attivita);

    $content = "Candidatura Volontario:\n";
    $content .= "Nome: " . $nome . "\n";
    $content .= "Telefono: " . $telefono . "\n";
    $content .= "Attività di interesse: " . $att_str . "\n";
    if ($note) $content .= "Note: " . $note . "\n";

    $post_id = wp_insert_post([
        'post_type'    => 'vp_volontario',
        'post_title'   => $nome . ' - ' . $telefono,
        'post_content' => $content,
        'post_status'  => 'private', // Privato: visibile solo all'associazione in WP
    ]);

    update_post_meta($post_id, '_vp_telefono', $telefono);
    update_post_meta($post_id, '_vp_attivita', is_array($attivita) ? $attivita : [$attivita]);

    return rest_ensure_response([
        'success'   => true,
        'messaggio' => 'Grazie ' . $nome . '! La tua candidatura è stata salvata. Ti contatteremo presto per le attività di quartiere.',
    ]);
}

/**
 * 7. CALLBACK: GET /insights
 */
function vpq_api_get_insights() {
    global $wpdb;
    $table = $wpdb->prefix . 'vp_interazioni';

    // Conteggi Segnalazioni REALI (senza valori fittizi)
    $tot_segnalazioni = (int) wp_count_posts('vp_segnalazione')->publish;
    $risolte_count    = (int) $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->postmeta} WHERE meta_key='_vp_stato' AND meta_value='3'");
    $inoltrate_count  = (int) $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->postmeta} WHERE meta_key='_vp_stato' AND meta_value='2'");
    $ricevute_count   = max(0, $tot_segnalazioni - $risolte_count - $inoltrate_count);
    $tasso_risoluzione = $tot_segnalazioni > 0 ? round(($risolte_count / $tot_segnalazioni) * 100) : 0;

    // Conteggi Volontari REALI (senza valori fittizi)
    $tot_volontari = (int) ($wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->posts} WHERE post_type='vp_volontario' AND post_status IN ('publish','private','draft')") ?: 0);

    // Conteggi Proposte & Voti REALI (senza valori fittizi)
    $tot_proposte = (int) wp_count_posts('vp_proposta')->publish;
    $tot_voti     = (int) ($wpdb->get_var("SELECT COUNT(*) FROM $table WHERE tipo='proposta_vota'") ?: 0);

    // Conteggi Eventi REALI (senza valori fittizi)
    $tot_eventi       = (int) wp_count_posts('vp_evento')->publish;
    $tot_partecipanti = (int) ($wpdb->get_var("SELECT COUNT(*) FROM $table WHERE tipo='evento_vengo'") ?: 0);

    return rest_ensure_response([
        'success'               => true,
        'totaleSegnalazioni'    => $tot_segnalazioni,
        'segnalazioniRisolte'   => $risolte_count,
        'segnalazioniInoltrate' => $inoltrate_count,
        'segnalazioniRicevute'  => $ricevute_count,
        'tassoRisoluzione'      => $tasso_risoluzione,
        'volontariTotali'       => $tot_volontari,
        'volontariAttivi'       => $tot_volontari,
        'oreCivicheStimate'     => $tot_volontari * 3,
        'ideeTotali'            => $tot_proposte,
        'votiTotali'            => $tot_voti,
        'eventiTotali'          => $tot_eventi,
        'partecipantiEventi'    => $tot_partecipanti,
    ]);
}

/**
 * 8. CALLBACK: POST /evento (Creazione evento da app/admin)
 */
function vpq_api_post_evento(WP_REST_Request $request) {
    $titolo      = sanitize_text_field($request->get_param('t') ?: $request->get_param('titolo'));
    $descrizione = sanitize_textarea_field($request->get_param('p') ?: $request->get_param('descrizione') ?: '');
    $giorno      = sanitize_text_field($request->get_param('d') ?: date('d'));
    $mese        = sanitize_text_field($request->get_param('m') ?: strtoupper(date('M')));
    $anno        = sanitize_text_field($request->get_param('anno') ?: date('Y'));
    $data_iso    = sanitize_text_field($request->get_param('dataCompleta') ?: '');
    $ora         = sanitize_text_field($request->get_param('ora') ?: '10:00');
    $luogo       = sanitize_text_field($request->get_param('luogo') ?: 'Villaggio Prenestino');
    $target      = absint($request->get_param('target') ?: 10);
    $tipo        = sanitize_text_field($request->get_param('tipo') ?: 'volontariato');
    $quota       = sanitize_text_field($request->get_param('quota') ?: '');
    $passato     = (bool) $request->get_param('passato');

    if ($data_iso && strpos($data_iso, '-') !== false) {
        $parts = explode('-', $data_iso);
        if (count($parts) === 3) {
            $anno = $parts[0];
            $mapM = ['01'=>'GEN','02'=>'FEB','03'=>'MAR','04'=>'APR','05'=>'MAG','06'=>'GIU','07'=>'LUG','08'=>'AGO','09'=>'SET','10'=>'OTT','11'=>'NOV','12'=>'DIC'];
            $mese = isset($mapM[$parts[1]]) ? $mapM[$parts[1]] : $mese;
            $giorno = (string)(int)$parts[2];
        }
    }

    $norm = vpq_normalize_data_evento($giorno, $mese, $anno, $ora, $passato);

    if (!$titolo) {
        return new WP_Error('vpq_no_title', 'Titolo evento mancante.', ['status' => 400]);
    }

    $post_id = wp_insert_post([
        'post_type'    => 'vp_evento',
        'post_title'   => $titolo,
        'post_content' => $descrizione,
        'post_status'  => 'publish',
    ]);

    if (is_wp_error($post_id)) {
        return new WP_Error('vpq_save_error', 'Impossibile salvare l\'evento.', ['status' => 500]);
    }

    update_post_meta($post_id, '_vp_giorno', $norm['giorno']);
    update_post_meta($post_id, '_vp_mese', $norm['mese']);
    update_post_meta($post_id, '_vp_anno', $norm['anno']);
    update_post_meta($post_id, '_vp_data_completa', $norm['data_completa']);
    update_post_meta($post_id, '_vp_ora', $ora);
    update_post_meta($post_id, '_vp_luogo', $luogo);
    update_post_meta($post_id, '_vp_target', $target);
    update_post_meta($post_id, '_vp_tipo', $tipo);
    update_post_meta($post_id, '_vp_quota', $quota);
    update_post_meta($post_id, '_vp_passato', $norm['is_passato'] ? '1' : '0');

    return rest_ensure_response([
        'success'   => true,
        'id'        => $post_id,
        'messaggio' => 'Evento pubblicato su WordPress con successo!',
    ]);
}

/**
 * 9. CALLBACK: POST /richiesta (Creazione attività volontariato da app/admin)
 */
function vpq_api_post_richiesta(WP_REST_Request $request) {
    $titolo      = sanitize_text_field($request->get_param('t') ?: $request->get_param('titolo'));
    $descrizione = sanitize_textarea_field($request->get_param('desc') ?: $request->get_param('descrizione') ?: '');
    $luogo       = sanitize_text_field($request->get_param('w') ?: $request->get_param('luogo') ?: 'Villaggio Prenestino');
    $need        = absint($request->get_param('need') ?: $request->get_param('obiettivo') ?: 8);
    $urgente     = (bool) $request->get_param('urgente');

    if (!$titolo) {
        return new WP_Error('vpq_no_title', 'Titolo richiesta mancante.', ['status' => 400]);
    }

    $post_id = wp_insert_post([
        'post_type'    => 'vp_richiesta',
        'post_title'   => $titolo,
        'post_content' => $descrizione,
        'post_status'  => 'publish',
    ]);

    if (is_wp_error($post_id)) {
        return new WP_Error('vpq_save_error', 'Impossibile salvare la richiesta.', ['status' => 500]);
    }

    update_post_meta($post_id, '_vp_luogo', $luogo);
    update_post_meta($post_id, '_vp_obiettivo', $need);
    update_post_meta($post_id, '_vp_urgente', $urgente ? '1' : '0');

    return rest_ensure_response([
        'success'   => true,
        'id'        => $post_id,
        'messaggio' => 'Attività di volontariato pubblicata su WordPress con successo!',
    ]);
}

/**
 * 10. CALLBACK: POST /segnalazione/stato (Aggiornamento stato da app/admin)
 */
function vpq_api_post_segnalazione_stato(WP_REST_Request $request) {
    $post_id = absint($request->get_param('id'));
    $stato   = sanitize_text_field($request->get_param('stato'));

    if (!$post_id || !$stato) {
        return new WP_Error('vpq_bad_data', 'ID o stato mancante.', ['status' => 400]);
    }

    update_post_meta($post_id, '_vp_stato', $stato);

    return rest_ensure_response([
        'success'   => true,
        'messaggio' => 'Stato segnalazione aggiornato con successo!',
    ]);
}

/**
 * 11. CALLBACK: GET /classifica (Classifica dinamica cittadini)
 */
function vpq_api_get_classifica() {
    return rest_ensure_response([
        'success'    => true,
        'classifica' => vpq_api_get_classifica_data(),
    ]);
}

/**
 * 12. CALLBACK: POST /classifica/sync (Sincronizzazione punti utente da app)
 */
function vpq_api_post_classifica_sync(WP_REST_Request $request) {
    $token    = sanitize_text_field($request->get_param('token') ?: '');
    $nome     = sanitize_text_field($request->get_param('nome') ?: '');
    $punti    = absint($request->get_param('punti'));
    $attivita = sanitize_text_field($request->get_param('attivitaPrincipale') ?: 'Cittadino attivo');

    if (!$token || !$nome || $punti <= 0) {
        return rest_ensure_response([
            'success'   => false,
            'messaggio' => 'Dati insufficienti per la sincronizzazione.',
        ]);
    }

    $synced = get_option('vpq_cittadini_sync', []);
    if (!is_array($synced)) {
        $synced = [];
    }

    $synced[$token] = [
        'nome'               => $nome,
        'punti'              => $punti,
        'attivitaPrincipale' => $attivita,
        'aggiornato'         => current_time('mysql'),
    ];

    update_option('vpq_cittadini_sync', $synced);

    return rest_ensure_response([
        'success'    => true,
        'messaggio'  => 'Punti cittadino sincronizzati con successo!',
        'classifica' => vpq_api_get_classifica_data(),
    ]);
}

/**
 * 13. CALLBACK: POST /commercio (Registrazione nuova attività commerciale con moderazione)
 */
function vpq_api_post_commercio(WP_REST_Request $request) {
    $nome              = sanitize_text_field($request->get_param('nome') ?: 'Nuova Attività Commerciale');
    $categoria         = sanitize_key($request->get_param('categoria') ?: 'alimentari');
    $indirizzo         = sanitize_text_field($request->get_param('indirizzo') ?: 'Villaggio Prenestino');
    $telefono          = sanitize_text_field($request->get_param('telefono') ?: '');
    $whatsapp          = sanitize_text_field($request->get_param('whatsapp') ?: '');
    $orari             = sanitize_text_field($request->get_param('orari') ?: 'Lun-Sab 09:00 - 19:30');
    $descrizione       = sanitize_textarea_field($request->get_param('descrizione') ?: '');
    $offerta_titolo    = sanitize_text_field($request->get_param('offerta_titolo') ?: '');
    $offerta_dettaglio = sanitize_text_field($request->get_param('offerta_dettaglio') ?: '');
    $nome_referente    = sanitize_text_field($request->get_param('nome_referente') ?: '');
    $email_referente   = sanitize_text_field($request->get_param('email_referente') ?: '');
    $lat               = floatval($request->get_param('lat') ?: 41.8965);
    $lng               = floatval($request->get_param('lng') ?: 12.6710);
    $immagine          = sanitize_text_field($request->get_param('immagine') ?: '');
    $logo              = sanitize_text_field($request->get_param('logo') ?: '');

    // Creazione del post in stato PENDING (in attesa di revisione e approvazione da parte dell'amministratore del sito)
    $post_id = wp_insert_post([
        'post_type'    => 'vp_commercio',
        'post_title'   => $nome,
        'post_content' => $descrizione,
        'post_status'  => 'pending', // Esattamente come le segnalazioni cittadine!
    ]);

    if (is_wp_error($post_id)) {
        return new WP_Error('vpq_save_error', 'Impossibile registrare l\'attività commerciale.', ['status' => 500]);
    }

    update_post_meta($post_id, '_vp_categoria', $categoria);
    update_post_meta($post_id, '_vp_indirizzo', $indirizzo);
    update_post_meta($post_id, '_vp_telefono', $telefono);
    update_post_meta($post_id, '_vp_whatsapp', $whatsapp);
    update_post_meta($post_id, '_vp_orari', $orari);
    update_post_meta($post_id, '_vp_offerta_titolo', $offerta_titolo);
    update_post_meta($post_id, '_vp_offerta_dettaglio', $offerta_dettaglio);
    update_post_meta($post_id, '_vp_nome_referente', $nome_referente);
    update_post_meta($post_id, '_vp_email_referente', $email_referente);
    update_post_meta($post_id, '_vp_lat', $lat);
    update_post_meta($post_id, '_vp_lng', $lng);
    update_post_meta($post_id, '_vp_mipiace', 1);
    update_post_meta($post_id, '_vp_verificato', '0');
    if ($immagine) {
        update_post_meta($post_id, '_vp_immagine', $immagine);
    }
    if ($logo) {
        update_post_meta($post_id, '_vp_logo', $logo);
    }

    return rest_ensure_response([
        'success'   => true,
        'post_id'   => $post_id,
        'status'    => 'pending',
        'messaggio' => 'Attività commerciale registrata con successo! È ora in attesa di approvazione da parte dell\'amministratore prima della pubblicazione.',
    ]);
}

/**
 * 14. CALLBACK: POST /commercio/vota (Mi piace attività commerciale)
 */
function vpq_api_post_commercio_vota(WP_REST_Request $request) {
    global $wpdb;
    $table = $wpdb->prefix . 'vp_interazioni';

    $post_id = absint($request->get_param('id') ?: $request->get_param('post_id'));
    $token   = sanitize_text_field($request->get_header('X-VP-Token') ?: $request->get_param('token') ?: 'anon_' . wp_generate_password(12, false));

    if (!$post_id) {
        return new WP_Error('vpq_bad_data', 'ID attività mancante.', ['status' => 400]);
    }

    $wpdb->replace($table, [
        'tipo'    => 'commercio_vota',
        'post_id' => $post_id,
        'token'   => $token,
        'creato'  => current_time('mysql'),
    ]);

    $count = (int) $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM $table WHERE tipo='commercio_vota' AND post_id=%d", $post_id));
    $current_meta = (int) get_post_meta($post_id, '_vp_mipiace', true) ?: 0;
    $new_mipiace = max($current_meta + 1, $count);
    update_post_meta($post_id, '_vp_mipiace', $new_mipiace);

    return rest_ensure_response([
        'success'   => true,
        'azione'    => 'votato',
        'conteggio' => $new_mipiace,
        'messaggio' => 'Grazie per aver consigliato questa attività ai tuoi vicini!',
    ]);
}

/**
 * Calcola la classifica reale dei cittadini dai dati attivi su WordPress
 * (Segnalazioni, Proposte, Volontariato, Eventi e sync App).
 * Se l'app/plugin è appena installato e non ci sono azioni, restituisce [] (vuota).
 */
function vpq_api_get_classifica_data() {
    global $wpdb;
    $table_interazioni = $wpdb->prefix . 'vp_interazioni';

    $cittadini_map = [];

    // 1. Segnalazioni inviate dai cittadini (+20 pt per segnalazione)
    $segnalazioni = get_posts([
        'post_type'      => 'vp_segnalazione',
        'post_status'    => 'publish',
        'posts_per_page' => -1,
    ]);
    foreach ($segnalazioni as $s) {
        $nome = trim(get_post_meta($s->ID, '_vp_cittadino_nome', true));
        if ($nome && strtolower($nome) !== 'anonimo') {
            $key = strtolower($nome);
            if (!isset($cittadini_map[$key])) {
                $cittadini_map[$key] = [
                    'id'                 => 'cit_seg_' . substr(md5($key), 0, 10),
                    'nome'               => $nome,
                    'punti'              => 0,
                    'attivitaPrincipale' => 'Segnalazioni decoro urbano',
                ];
            }
            $cittadini_map[$key]['punti'] += 20;
        }
    }

    // 2. Proposte inviate dai cittadini (+25 pt per proposta)
    $proposte = get_posts([
        'post_type'      => 'vp_proposta',
        'post_status'    => 'publish',
        'posts_per_page' => -1,
    ]);
    foreach ($proposte as $p) {
        $nome = trim(get_post_meta($p->ID, '_vp_cittadino_nome', true));
        if ($nome && strtolower($nome) !== 'anonimo') {
            $key = strtolower($nome);
            if (!isset($cittadini_map[$key])) {
                $cittadini_map[$key] = [
                    'id'                 => 'cit_prop_' . substr(md5($key), 0, 10),
                    'nome'               => $nome,
                    'punti'              => 0,
                    'attivitaPrincipale' => 'Proposte di quartiere',
                ];
            } else {
                $cittadini_map[$key]['attivitaPrincipale'] = 'Proposte & cura civica';
            }
            $cittadini_map[$key]['punti'] += 25;
        }
    }

    // 3. Volontari che hanno aderito ad attività (+30 pt per adesione)
    $table_exists = $wpdb->get_var("SHOW TABLES LIKE '$table_interazioni'");
    if ($table_exists) {
        $volontari = $wpdb->get_results("SELECT nome, COUNT(*) as count FROM $table_interazioni WHERE tipo IN ('cisono', 'volontario_cisono') AND nome != '' GROUP BY nome");
        if ($volontari) {
            foreach ($volontari as $v) {
                $nome = trim($v->nome);
                if ($nome && strtolower($nome) !== 'anonimo') {
                    $key = strtolower($nome);
                    if (!isset($cittadini_map[$key])) {
                        $cittadini_map[$key] = [
                            'id'                 => 'cit_vol_' . substr(md5($key), 0, 10),
                            'nome'               => $nome,
                            'punti'              => 0,
                            'attivitaPrincipale' => 'Volontariato attivo',
                        ];
                    } else {
                        $cittadini_map[$key]['attivitaPrincipale'] = 'Volontariato & iniziative';
                    }
                    $cittadini_map[$key]['punti'] += ((int) $v->count * 30);
                }
            }
        }
    }

    // 4. Cittadini sincronizzati dall'App
    $synced = get_option('vpq_cittadini_sync', []);
    if (is_array($synced)) {
        foreach ($synced as $token => $data) {
            $nome = trim($data['nome'] ?? '');
            $punti = (int) ($data['punti'] ?? 0);
            if ($nome && $punti > 0 && strtolower($nome) !== 'anonimo') {
                $key = strtolower($nome);
                if (!isset($cittadini_map[$key])) {
                    $cittadini_map[$key] = [
                        'id'                 => 'cit_sync_' . substr(md5($token), 0, 10),
                        'nome'               => $nome,
                        'punti'              => $punti,
                        'attivitaPrincipale' => $data['attivitaPrincipale'] ?? 'Cittadino attivo',
                    ];
                } else {
                    $cittadini_map[$key]['punti'] = max($cittadini_map[$key]['punti'], $punti);
                }
            }
        }
    }

    // Calcolo livelli e badge
    $colors = ['bg-emerald-600', 'bg-amber-600', 'bg-sky-600', 'bg-purple-600', 'bg-rose-600', 'bg-teal-600', 'bg-indigo-600'];
    $idx = 0;
    $classifica = [];
    foreach ($cittadini_map as $c) {
        $p = (int) $c['punti'];
        if ($p <= 0) continue;

        if ($p >= 150) {
            $liv = 'Custode'; $badge = '⭐';
        } elseif ($p >= 80) {
            $liv = 'Pilastro'; $badge = '🏛️';
        } elseif ($p >= 30) {
            $liv = 'Vicino Attivo'; $badge = '🤝';
        } else {
            $liv = 'Nuovo Vicino'; $badge = '🌱';
        }

        $classifica[] = [
            'id'                 => $c['id'],
            'nome'               => $c['nome'],
            'punti'              => $p,
            'badge'              => $badge,
            'livello'            => $liv,
            'attivitaPrincipale' => $c['attivitaPrincipale'],
            'avatarBg'           => $colors[$idx % count($colors)],
        ];
        $idx++;
    }

    // Ordina per punti decrescenti
    usort($classifica, function($a, $b) {
        return $b['punti'] - $a['punti'];
    });

    return $classifica;
}

/**
 * Menu Amministrazione WordPress Unificato con Hub & Schede (Tab)
 * Raggruppa tutte le funzionalità dell'app sotto un'unica voce nel menu verticale di WordPress!
 */
add_action('admin_menu', function() {
    // 1. Voce Principale UNICA nel menu verticale
    add_menu_page(
        'VP Quartiere - Dashboard & Hub',
        '🏡 VP Quartiere',
        'manage_options',
        'vp-quartiere',
        'vpq_render_admin_hub',
        'dashicons-location-alt',
        25
    );

    // 2. Prima sotto-voce: apre la Dashboard con le Schede (Tab)
    add_submenu_page(
        'vp-quartiere',
        'Dashboard & Tab Hub',
        '📊 Dashboard & Tab Hub',
        'manage_options',
        'vp-quartiere',
        'vpq_render_admin_hub'
    );

    // I 5 Custom Post Type sono raggruppati qui sotto grazie a 'show_in_menu' => 'vp-quartiere':
    // - edit.php?post_type=vp_evento
    // - edit.php?post_type=vp_richiesta
    // - edit.php?post_type=vp_segnalazione
    // - edit.php?post_type=vp_proposta
    // - edit.php?post_type=vp_volontario

    // 3. Impostazioni REST API
    add_submenu_page(
        'vp-quartiere',
        'Impostazioni & REST API App',
        '⚙️ Impostazioni API',
        'manage_options',
        'vp-quartiere-settings',
        'vpq_render_admin_page'
    );
}, 8);

/**
 * Assicura al 100% che cliccando sulla voce di menu principale "🏡 VP Quartiere" nel menu verticale di WP,
 * si apra SEMPRE la "Dashboard & Tab Hub" con tutte le statistiche e le schede!
 */
add_action('admin_menu', function() {
    global $submenu;
    if (isset($submenu['vp-quartiere']) && is_array($submenu['vp-quartiere'])) {
        $hub_item = null;
        $other_items = [];
        foreach ($submenu['vp-quartiere'] as $item) {
            if ($item[2] === 'vp-quartiere') {
                $hub_item = $item;
            } else {
                $other_items[] = $item;
            }
        }
        if ($hub_item) {
            $submenu['vp-quartiere'] = array_merge([$hub_item], $other_items);
        }
    }
}, 999);

/**
 * Funzione di fallback per retrocompatibilità con vecchi link
 */
function vpq_render_insights_dashboard() {
    vpq_render_admin_hub('panoramica');
}

/**
 * Funzione impostazioni: reindirizza o renderizza la tab Impostazioni dell'Hub
 */
function vpq_render_admin_page() {
    vpq_render_admin_hub('impostazioni');
}

/**
 * Render dell'Hub Unificato con Navigazione a Schede (Tabs)
 */
function vpq_render_admin_hub($preset_tab = '') {
    if (!current_user_can('manage_options')) return;
    global $wpdb;
    $table = $wpdb->prefix . 'vp_interazioni';

    // Gestione salvataggio impostazioni
    if (isset($_POST['vpq_save_settings']) && check_admin_referer('vpq_settings_nonce')) {
        update_option('vpq_allow_origins', sanitize_text_field($_POST['vpq_allow_origins']));
        if (!empty($_POST['vpq_regenerate_key'])) {
            update_option('vpq_api_key', wp_generate_password(32, false));
        }
        echo '<div class="notice notice-success is-dismissible" style="margin:15px 0;"><p><strong>Impostazioni API salvate con successo!</strong></p></div>';
    }

    // Tab attiva (di default sempre la Dashboard / Panoramica)
    $allowed_tabs = ['panoramica', 'eventi', 'volontari', 'segnalazioni', 'commercianti', 'impostazioni', 'webapp'];
    $active_tab   = !empty($preset_tab) ? $preset_tab : (isset($_GET['tab']) ? sanitize_key($_GET['tab']) : 'panoramica');
    if (!in_array($active_tab, $allowed_tabs)) {
        $active_tab = 'panoramica';
    }

    // Statistiche REALI dal database di WordPress (azzerate alla prima installazione)
    $tot_segnalazioni = (int) wp_count_posts('vp_segnalazione')->publish;
    $risolte_count    = (int) $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->postmeta} WHERE meta_key='_vp_stato' AND meta_value='3'");
    $inoltrate_count  = (int) $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->postmeta} WHERE meta_key='_vp_stato' AND meta_value='2'");
    $ricevute_count   = max(0, $tot_segnalazioni - $risolte_count - $inoltrate_count);
    $tasso_risolte    = $tot_segnalazioni > 0 ? round(($risolte_count / $tot_segnalazioni) * 100) : 0;

    $tot_volontari    = (int) ($wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->posts} WHERE post_type='vp_volontario' AND post_status IN ('publish','private','draft')") ?: 0);
    $tot_richieste    = (int) wp_count_posts('vp_richiesta')->publish;
    $tot_idee         = (int) wp_count_posts('vp_proposta')->publish;
    $tot_voti         = (int) ($wpdb->get_var("SELECT COUNT(*) FROM $table WHERE tipo='proposta_vota'") ?: 0);
    $tot_eventi       = (int) wp_count_posts('vp_evento')->publish;
    $tot_partecipanti = (int) ($wpdb->get_var("SELECT COUNT(*) FROM $table WHERE tipo='evento_vengo'") ?: 0);

    // Statistiche Commercianti
    $tot_commercio     = (int) wp_count_posts('vp_commercio')->publish;
    $pending_commercio = (int) wp_count_posts('vp_commercio')->pending;

    // Configurazione API
    $api_key       = get_option('vpq_api_key');
    $origins       = get_option('vpq_allow_origins', '*');
    $endpoint_base = home_url('/wp-json/vp/v1/');
    $app_url       = home_url('/app/');
    ?>
    <div class="wrap" style="max-width:1240px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen-Sans,Ubuntu,Cantarell,sans-serif;">
        
        <!-- Header Unificato Hub -->
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:15px;margin:20px 0 15px 0;">
            <div>
                <h1 style="margin:0;font-size:24px;font-weight:800;color:#0f172a;display:flex;align-items:center;gap:10px;">
                    <span class="dashicons dashicons-location-alt" style="font-size:28px;width:28px;height:28px;color:#059669;"></span>
                    Centro Gestione Web App - Villaggio Prenestino
                </h1>
                <p style="margin:4px 0 0 0;color:#64748b;font-size:13px;">
                    Pannello unico a schede per gestire contenuti, consultare statistiche civiche e configurare le API senza disperdere voci nel menu di WordPress.
                </p>
            </div>
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="background:#dcfce7;color:#166534;font-weight:bold;padding:6px 12px;border-radius:20px;font-size:12px;border:1px solid #bbf7d0;">
                    ● Sincronizzazione Live Attiva (v1.4.0)
                </span>
                <a href="<?php echo esc_url($app_url); ?>" target="_blank" class="button button-secondary" style="font-size:12px;">
                    📱 Apri Web App &rarr;
                </a>
            </div>
        </div>

        <!-- Barra di Navigazione a Schede (Tab) -->
        <h2 class="nav-tab-wrapper" style="margin-bottom:20px;border-bottom:1px solid #cbd5e1;padding-bottom:0;">
            <a href="<?php echo admin_url('admin.php?page=vp-quartiere&tab=panoramica'); ?>" class="nav-tab <?php echo $active_tab === 'panoramica' ? 'nav-tab-active' : ''; ?>" style="font-weight:600;font-size:13px;">
                📊 Dashboard & Tab Hub
            </a>
            <a href="<?php echo admin_url('admin.php?page=vp-quartiere&tab=commercianti'); ?>" class="nav-tab <?php echo $active_tab === 'commercianti' ? 'nav-tab-active' : ''; ?>" style="font-weight:600;font-size:13px;">
                🏪 Commercianti <?php if ($pending_commercio > 0): ?><span style="background:#e11d48;color:#fff;padding:2px 7px;border-radius:10px;font-size:10px;margin-left:4px;font-weight:bold;"><?php echo $pending_commercio; ?> in attesa</span><?php endif; ?>
            </a>
            <a href="<?php echo admin_url('admin.php?page=vp-quartiere&tab=eventi'); ?>" class="nav-tab <?php echo $active_tab === 'eventi' ? 'nav-tab-active' : ''; ?>" style="font-weight:600;font-size:13px;">
                📅 Eventi del Quartiere
            </a>
            <a href="<?php echo admin_url('admin.php?page=vp-quartiere&tab=volontari'); ?>" class="nav-tab <?php echo $active_tab === 'volontari' ? 'nav-tab-active' : ''; ?>" style="font-weight:600;font-size:13px;">
                🤝 Volontariato & Albo
            </a>
            <a href="<?php echo admin_url('admin.php?page=vp-quartiere&tab=segnalazioni'); ?>" class="nav-tab <?php echo $active_tab === 'segnalazioni' ? 'nav-tab-active' : ''; ?>" style="font-weight:600;font-size:13px;">
                ⚠️ Segnalazioni & Proposte
            </a>
            <a href="<?php echo admin_url('admin.php?page=vp-quartiere&tab=impostazioni'); ?>" class="nav-tab <?php echo $active_tab === 'impostazioni' ? 'nav-tab-active' : ''; ?>" style="font-weight:600;font-size:13px;">
                ⚙️ Impostazioni & API
            </a>
            <a href="<?php echo admin_url('admin.php?page=vp-quartiere&tab=webapp'); ?>" class="nav-tab <?php echo $active_tab === 'webapp' ? 'nav-tab-active' : ''; ?>" style="font-weight:600;font-size:13px;">
                📱 Web App & Download
            </a>
        </h2>

        <!-- ========================================== -->
        <!-- TAB 1: DASHBOARD & TAB HUB (STATISTICHE)   -->
        <!-- ========================================== -->
        <?php if ($active_tab === 'panoramica'): ?>
            <?php if ($tot_segnalazioni === 0 && $tot_volontari === 0 && $tot_idee === 0 && $tot_eventi === 0): ?>
                <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-left:4px solid #16a34a;border-radius:12px;padding:14px 18px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;gap:15px;flex-wrap:wrap;">
                    <div>
                        <strong style="color:#166534;font-size:14px;">✨ Installazione Pulita: Database Pronto e Azzerato</strong>
                        <p style="margin:2px 0 0 0;font-size:12px;color:#15803d;">
                            Tutti i contatori sono a zero e pronti a caricare i dati reali dalla Web App (segnalazioni, volontari, idee) o inseriti dalle schede del plugin. Nessun dato fittizio.
                        </p>
                    </div>
                    <span style="font-size:11px;font-weight:700;background:#dcfce7;color:#166534;padding:4px 10px;border-radius:20px;border:1px solid #86efac;">
                        Zero Dati Fittizi ✓
                    </span>
                </div>
            <?php endif; ?>

            <?php if ($pending_commercio > 0): ?>
                <div style="background:#fffbeb;border:1px solid #fde68a;border-left:4px solid #f59e0b;border-radius:12px;padding:14px 18px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;gap:15px;flex-wrap:wrap;">
                    <div>
                        <strong style="color:#92400e;font-size:14px;">🔔 Attività Commerciali in Attesa di Approvazione (<?php echo $pending_commercio; ?>)</strong>
                        <p style="margin:2px 0 0 0;font-size:12px;color:#b45309;">
                            Ci sono commercianti che hanno registrato la propria attività tramite la Web App. Revisiona e approva le schede per renderle visibili su Google Maps e nella vetrina pubblica.
                        </p>
                    </div>
                    <a href="<?php echo admin_url('admin.php?page=vp-quartiere&tab=commercianti'); ?>" class="button button-primary" style="background:#d97706;border-color:#b45309;font-weight:bold;">
                        Revisiona e Approva (<?php echo $pending_commercio; ?>) &rarr;
                    </a>
                </div>
            <?php endif; ?>

            <!-- 5 KPI Cards (Dati Reali da Database) -->
            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:16px;margin-bottom:25px;">
                <div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:20px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                    <div style="display:flex;justify-content:space-between;align-items:center;color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;">
                        <span>Segnalazioni Cittadini</span>
                        <span class="dashicons dashicons-warning" style="color:#d97706;"></span>
                    </div>
                    <div style="font-size:32px;font-weight:900;color:#0f172a;margin:8px 0 4px 0;"><?php echo $tot_segnalazioni; ?></div>
                    <?php if ($tot_segnalazioni > 0): ?>
                        <div style="font-size:12px;color:#16a34a;font-weight:700;">
                            <?php echo $tasso_risolte; ?>% risolte con successo
                        </div>
                        <div style="font-size:11px;color:#94a3b8;margin-top:6px;border-top:1px solid #f1f5f9;padding-top:6px;">
                            Inoltrate a Municipio: <?php echo $inoltrate_count; ?> • In attesa: <?php echo $ricevute_count; ?>
                        </div>
                    <?php else: ?>
                        <div style="font-size:12px;color:#64748b;font-weight:600;">
                            In attesa di segnalazioni
                        </div>
                        <div style="font-size:11px;color:#94a3b8;margin-top:6px;border-top:1px solid #f1f5f9;padding-top:6px;">
                            Pronto a ricevere le segnalazioni dalla Web App
                        </div>
                    <?php endif; ?>
                </div>

                <div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:20px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                    <div style="display:flex;justify-content:space-between;align-items:center;color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;">
                        <span>Volontari Mobilitati</span>
                        <span class="dashicons dashicons-heart" style="color:#10b981;"></span>
                    </div>
                    <div style="font-size:32px;font-weight:900;color:#0f172a;margin:8px 0 4px 0;"><?php echo $tot_volontari; ?></div>
                    <?php if ($tot_volontari > 0): ?>
                        <div style="font-size:12px;color:#059669;font-weight:700;">
                            Albo permanente con recapiti
                        </div>
                        <div style="font-size:11px;color:#94a3b8;margin-top:6px;border-top:1px solid #f1f5f9;padding-top:6px;">
                            <?php echo $tot_richieste; ?> iniziative "Serve una Mano"
                        </div>
                    <?php else: ?>
                        <div style="font-size:12px;color:#64748b;font-weight:600;">
                            Albo volontari azzerato
                        </div>
                        <div style="font-size:11px;color:#94a3b8;margin-top:6px;border-top:1px solid #f1f5f9;padding-top:6px;">
                            I residenti iscritti da "Partecipa" compariranno qui
                        </div>
                    <?php endif; ?>
                </div>

                <div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:20px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                    <div style="display:flex;justify-content:space-between;align-items:center;color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;">
                        <span>Idee & Proposte</span>
                        <span class="dashicons dashicons-lightbulb" style="color:#6366f1;"></span>
                    </div>
                    <div style="font-size:32px;font-weight:900;color:#0f172a;margin:8px 0 4px 0;"><?php echo $tot_idee; ?></div>
                    <?php if ($tot_idee > 0): ?>
                        <div style="font-size:12px;color:#4f46e5;font-weight:700;">
                            <?php echo $tot_voti; ?> voti di preferenza
                        </div>
                        <div style="font-size:11px;color:#94a3b8;margin-top:6px;border-top:1px solid #f1f5f9;padding-top:6px;">
                            Partecipazione civica attiva
                        </div>
                    <?php else: ?>
                        <div style="font-size:12px;color:#64748b;font-weight:600;">
                            Nessuna proposta caricata
                        </div>
                        <div style="font-size:11px;color:#94a3b8;margin-top:6px;border-top:1px solid #f1f5f9;padding-top:6px;">
                            Le proposte dei residenti compariranno qui
                        </div>
                    <?php endif; ?>
                </div>

                <div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:20px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                    <div style="display:flex;justify-content:space-between;align-items:center;color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;">
                        <span>Eventi & Comunità</span>
                        <span class="dashicons dashicons-calendar-alt" style="color:#e11d48;"></span>
                    </div>
                    <div style="font-size:32px;font-weight:900;color:#0f172a;margin:8px 0 4px 0;"><?php echo $tot_partecipanti; ?></div>
                    <?php if ($tot_eventi > 0): ?>
                        <div style="font-size:12px;color:#e11d48;font-weight:700;">
                            Partecipanti registrati
                        </div>
                        <div style="font-size:11px;color:#94a3b8;margin-top:6px;border-top:1px solid #f1f5f9;padding-top:6px;">
                            <?php echo $tot_eventi; ?> eventi gestiti nel quartiere
                        </div>
                    <?php else: ?>
                        <div style="font-size:12px;color:#64748b;font-weight:600;">
                            Nessun evento in programma
                        </div>
                        <div style="font-size:11px;color:#94a3b8;margin-top:6px;border-top:1px solid #f1f5f9;padding-top:6px;">
                            Inserisci il primo evento dalla scheda "Eventi"
                        </div>
                    <?php endif; ?>
                </div>

                <div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:20px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                    <div style="display:flex;justify-content:space-between;align-items:center;color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;">
                        <span>Commercianti & Negozi</span>
                        <span class="dashicons dashicons-store" style="color:#059669;"></span>
                    </div>
                    <div style="font-size:32px;font-weight:900;color:#0f172a;margin:8px 0 4px 0;"><?php echo $tot_commercio; ?></div>
                    <?php if ($pending_commercio > 0): ?>
                        <div style="font-size:12px;color:#d97706;font-weight:700;">
                            ⚠️ <?php echo $pending_commercio; ?> in attesa di approvazione
                        </div>
                    <?php else: ?>
                        <div style="font-size:12px;color:#16a34a;font-weight:600;">
                            Tutte le schede approvate
                        </div>
                    <?php endif; ?>
                    <div style="font-size:11px;color:#94a3b8;margin-top:6px;border-top:1px solid #f1f5f9;padding-top:6px;">
                        <a href="<?php echo admin_url('admin.php?page=vp-quartiere&tab=commercianti'); ?>" style="text-decoration:none;font-weight:600;color:#059669;">Gestisci commercianti &rarr;</a>
                    </div>
                </div>
            </div>

            <!-- Griglia Grafica Dinamica -->
            <div style="display:grid;grid-template-columns:2fr 1fr;gap:20px;margin-bottom:25px;">
                <div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
                        <div>
                            <h3 style="margin:0;font-size:15px;font-weight:800;color:#1e293b;">Andamento Segnalazioni nel Tempo</h3>
                            <p style="margin:2px 0 0 0;font-size:12px;color:#64748b;">Rilevazione mensile segnalazioni inviate e risolte sul territorio</p>
                        </div>
                        <?php if ($tot_segnalazioni > 0): ?>
                        <div style="font-size:11px;color:#64748b;font-weight:600;">
                            <span style="display:inline-block;width:10px;height:10px;background:#f59e0b;border-radius:2px;margin-right:4px;"></span> Inviate
                            <span style="display:inline-block;width:10px;height:10px;background:#10b981;border-radius:2px;margin-left:10px;margin-right:4px;"></span> Risolte
                        </div>
                        <?php endif; ?>
                    </div>

                    <?php if ($tot_segnalazioni > 0): ?>
                        <div style="height:170px;display:flex;align-items:flex-end;justify-content:space-around;padding-top:15px;border-bottom:1px solid #e2e8f0;">
                            <?php
                            for ($i = 5; $i >= 0; $i--) {
                                $ts = strtotime("-$i months");
                                $m_label = date_i18n('M', $ts);
                                $ym = date('Y-m', $ts);
                                $inv = (int) $wpdb->get_var($wpdb->prepare(
                                    "SELECT COUNT(*) FROM {$wpdb->posts} WHERE post_type='vp_segnalazione' AND post_status='publish' AND post_date LIKE %s",
                                    $ym . '%'
                                ));
                                $ris = (int) $wpdb->get_var($wpdb->prepare(
                                    "SELECT COUNT(DISTINCT p.ID) FROM {$wpdb->posts} p 
                                     INNER JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id 
                                     WHERE p.post_type='vp_segnalazione' AND p.post_status='publish' 
                                     AND pm.meta_key='_vp_stato' AND pm.meta_value='3' AND p.post_date LIKE %s",
                                    $ym . '%'
                                ));
                                $h1 = min(130, $inv * 18);
                                $h2 = min(130, $ris * 18);
                                echo '<div style="display:flex;flex-direction:column;align-items:center;gap:6px;">';
                                echo '  <div style="display:flex;align-items:flex-end;gap:4px;height:130px;">';
                                echo '      <div style="width:16px;height:' . max(4, $h1) . 'px;background:linear-gradient(to top, #f59e0b, #fbbf24);border-radius:4px 4px 0 0;" title="' . $inv . ' inviate"></div>';
                                echo '      <div style="width:16px;height:' . max(4, $h2) . 'px;background:linear-gradient(to top, #059669, #10b981);border-radius:4px 4px 0 0;" title="' . $ris . ' risolte"></div>';
                                echo '  </div>';
                                echo '  <span style="font-size:11px;font-weight:700;color:#475569;">' . substr($m_label, 0, 3) . '</span>';
                                echo '</div>';
                            }
                            ?>
                        </div>
                        <div style="margin-top:12px;font-size:12px;color:#64748b;display:flex;justify-content:space-between;">
                            <span>✓ Tasso di risoluzione: <strong><?php echo $tasso_risolte; ?>%</strong></span>
                            <span>✓ Istanze gestite: <strong><?php echo $tot_segnalazioni; ?> totali</strong></span>
                        </div>
                    <?php else: ?>
                        <div style="height:170px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:#94a3b8;border:2px dashed #e2e8f0;border-radius:12px;padding:20px;">
                            <span class="dashicons dashicons-chart-bar" style="font-size:36px;width:36px;height:36px;color:#cbd5e1;margin-bottom:8px;"></span>
                            <strong style="color:#64748b;font-size:13px;">Nessuna segnalazione registrata nel database</strong>
                            <p style="margin:4px 0 0 0;font-size:12px;color:#94a3b8;max-width:380px;">
                                Il grafico temporale mostrerà le segnalazioni inviate e risolte mese per mese non appena i cittadini utilizzeranno la Web App.
                            </p>
                        </div>
                    <?php endif; ?>
                </div>

                <!-- Criticità per Settore (Dinamica) -->
                <div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.05);display:flex;flex-direction:column;justify-content:space-between;">
                    <div>
                        <h3 style="margin:0;font-size:15px;font-weight:800;color:#1e293b;">Criticità per Settore</h3>
                        <p style="margin:2px 0 15px 0;font-size:12px;color:#64748b;">Ripartizione istanze territoriali</p>
                        
                        <?php
                        $cat_rows = $wpdb->get_results(
                            "SELECT pm.meta_value as cat, COUNT(*) as cnt 
                             FROM {$wpdb->postmeta} pm 
                             INNER JOIN {$wpdb->posts} p ON p.ID = pm.post_id 
                             WHERE p.post_type='vp_segnalazione' AND p.post_status='publish' 
                             AND pm.meta_key='_vp_categoria' AND pm.meta_value != '' 
                             GROUP BY pm.meta_value ORDER BY cnt DESC LIMIT 4"
                        );

                        if ($tot_segnalazioni > 0 && !empty($cat_rows)):
                            $colors = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444'];
                            $ci = 0;
                            foreach ($cat_rows as $cr):
                                $pct = round(($cr->cnt / max(1, $tot_segnalazioni)) * 100);
                                $col = $colors[$ci % count($colors)];
                                $ci++;
                                ?>
                                <div style="margin-bottom:12px;">
                                    <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;">
                                        <span style="font-weight:600;color:#334155;"><?php echo esc_html($cr->cat); ?></span>
                                        <span style="font-weight:800;color:#0f172a;"><?php echo $pct; ?>%</span>
                                    </div>
                                    <div style="width:100%;height:8px;background:#f1f5f9;border-radius:10px;overflow:hidden;">
                                        <div style="width:<?php echo $pct; ?>%;height:100%;background:<?php echo $col; ?>;border-radius:10px;"></div>
                                    </div>
                                </div>
                                <?php
                            endforeach;
                        else:
                            ?>
                            <div style="padding:25px 10px;text-align:center;color:#94a3b8;border:2px dashed #e2e8f0;border-radius:12px;">
                                <span class="dashicons dashicons-category" style="font-size:32px;width:32px;height:32px;color:#cbd5e1;margin-bottom:6px;"></span>
                                <div style="font-size:12px;color:#64748b;font-weight:600;">In attesa di segnalazioni</div>
                                <p style="margin:4px 0 0 0;font-size:11px;color:#94a3b8;">
                                    La ripartizione per ambito si calcolerà sui dati reali inviati.
                                </p>
                            </div>
                        <?php endif; ?>
                    </div>

                    <div style="margin-top:15px;padding-top:12px;border-top:1px solid #f1f5f9;">
                        <a href="<?php echo admin_url('edit.php?post_type=vp_segnalazione'); ?>" class="button button-secondary" style="width:100%;text-align:center;">
                            Gestisci Segnalazioni & Foto &rarr;
                        </a>
                    </div>
                </div>
            </div>

            <!-- Griglia: Volontari e Barometro Idee Reali -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
                <div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                    <h3 style="margin:0 0 4px 0;font-size:15px;font-weight:800;color:#1e293b;">Disponibilità Volontari per Ambito</h3>
                    <p style="margin:0 0 15px 0;font-size:12px;color:#64748b;">Campi di interesse espressi dai residenti nell'Albo</p>
                    
                    <?php
                    $att_rows = $wpdb->get_results(
                        "SELECT meta_value as att, COUNT(*) as cnt 
                         FROM {$wpdb->postmeta} pm 
                         INNER JOIN {$wpdb->posts} p ON p.ID = pm.post_id 
                         WHERE p.post_type='vp_volontario' 
                         AND pm.meta_key='_vp_attivita' AND pm.meta_value != '' 
                         GROUP BY pm.meta_value ORDER BY cnt DESC LIMIT 6"
                    );

                    if ($tot_volontari > 0 && !empty($att_rows)):
                        echo '<ul style="margin:0;padding:0;list-style:none;font-size:13px;">';
                        foreach ($att_rows as $ar) {
                            $pct_v = round(($ar->cnt / max(1, $tot_volontari)) * 100);
                            echo '<li style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f8fafc;">';
                            echo '  <span>' . esc_html($ar->att) . '</span>';
                            echo '  <strong>' . $ar->cnt . ' volontari (' . $pct_v . '%)</strong>';
                            echo '</li>';
                        }
                        echo '</ul>';
                    else:
                        ?>
                        <div style="padding:25px 15px;text-align:center;color:#94a3b8;border:2px dashed #e2e8f0;border-radius:12px;">
                            <span class="dashicons dashicons-groups" style="font-size:36px;width:36px;height:36px;color:#cbd5e1;margin-bottom:6px;"></span>
                            <div style="font-size:13px;color:#64748b;font-weight:700;">Nessun volontario ancora iscritto</div>
                            <p style="margin:4px 0 0 0;font-size:12px;color:#94a3b8;">
                                Quando i residenti compileranno il modulo "Partecipa" nella Web App, qui comparirà la ripartizione dei loro ambiti di disponibilità.
                            </p>
                        </div>
                    <?php endif; ?>
                </div>

                <div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                    <h3 style="margin:0 0 4px 0;font-size:15px;font-weight:800;color:#1e293b;">Barometro Idee dei Cittadini</h3>
                    <p style="margin:0 0 15px 0;font-size:12px;color:#64748b;">Le proposte più sostenute dalla comunità locale</p>

                    <?php
                    $top_idee_posts = get_posts([
                        'post_type'      => 'vp_proposta',
                        'post_status'    => 'publish',
                        'posts_per_page' => 3,
                        'orderby'        => 'date',
                        'order'          => 'DESC'
                    ]);

                    if ($tot_idee > 0 && !empty($top_idee_posts)):
                        echo '<div style="display:flex;flex-direction:column;gap:10px;">';
                        foreach ($top_idee_posts as $tip) {
                            $voti_prop = (int) $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM $table WHERE tipo='proposta_vota' AND post_id=%d", $tip->ID));
                            ?>
                            <div style="background:#f8fafc;padding:10px 14px;border-radius:12px;border:1px solid #e2e8f0;">
                                <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:700;color:#1e293b;">
                                    <span><?php echo esc_html($tip->post_title); ?></span>
                                    <span style="color:#d97706;"><?php echo $voti_prop; ?> voti</span>
                                </div>
                                <div style="font-size:11px;color:#64748b;margin-top:3px;">
                                    <a href="<?php echo esc_url(get_edit_post_link($tip->ID)); ?>" style="color:#0284c7;text-decoration:none;">Visualizza in WordPress &rarr;</a>
                                </div>
                            </div>
                            <?php
                        }
                        echo '</div>';
                    else:
                        ?>
                        <div style="padding:25px 15px;text-align:center;color:#94a3b8;border:2px dashed #e2e8f0;border-radius:12px;">
                            <span class="dashicons dashicons-lightbulb" style="font-size:36px;width:36px;height:36px;color:#cbd5e1;margin-bottom:6px;"></span>
                            <div style="font-size:13px;color:#64748b;font-weight:700;">Nessuna proposta ancora inviata</div>
                            <p style="margin:4px 0 0 0;font-size:12px;color:#94a3b8;">
                                Le proposte avanzate dai cittadini nella sezione "Idee" compariranno qui con il rispettivo conteggio dei voti "Mi piace".
                            </p>
                        </div>
                    <?php endif; ?>
                </div>
            </div>

        <!-- ========================================== -->
        <!-- TAB 2: EVENTI DEL QUARTIERE                -->
        <!-- ========================================== -->
        <?php elseif ($active_tab === 'eventi'): ?>
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:20px;">
                <div>
                    <h2 style="margin:0;font-size:18px;font-weight:800;color:#0f172a;">Gestione Eventi della Comunità</h2>
                    <p style="margin:4px 0 0 0;font-size:12px;color:#64748b;">
                        Crea nuovi eventi o modifica quelli esistenti con la data completa di anno. Se la data è passata, l'evento viene mostrato nella sezione <strong>"Eventi passati"</strong>.
                    </p>
                </div>
                <div style="display:flex;gap:10px;">
                    <a href="<?php echo admin_url('post-new.php?post_type=vp_evento'); ?>" class="button button-primary" style="background:#059669;border-color:#047857;font-weight:700;padding:6px 14px;height:auto;">
                        ➕ Nuovo Evento
                    </a>
                    <a href="<?php echo admin_url('edit.php?post_type=vp_evento'); ?>" class="button button-secondary" style="padding:6px 14px;height:auto;">
                        📋 Tutti gli Eventi in WordPress &rarr;
                    </a>
                </div>
            </div>

            <!-- Avviso funzionalità Anno -->
            <div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:20px;font-size:13px;color:#1e40af;">
                <strong>💡 Novità v1.3.1:</strong> Ora puoi inserire l'anno esatto per ogni evento (es. 2024, 2025, 2026). Gli eventi con data anteriore ad oggi vengono automaticamente categorizzati come <strong>"Eventi passati"</strong> nella Web App.
            </div>

            <!-- Tabella Eventi Recenti -->
            <div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                <table class="wp-list-table widefat fixed striped" style="border:none;">
                    <thead>
                        <tr>
                            <th style="font-weight:700;padding:12px 16px;">Titolo Evento</th>
                            <th style="font-weight:700;width:150px;">Data Completa</th>
                            <th style="font-weight:700;width:110px;">Orario</th>
                            <th style="font-weight:700;width:180px;">Luogo</th>
                            <th style="font-weight:700;width:120px;">Stato</th>
                            <th style="font-weight:700;width:110px;text-align:center;">Partecipanti</th>
                            <th style="font-weight:700;width:90px;text-align:right;padding-right:16px;">Azioni</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php
                        $eventi_query = new WP_Query([
                            'post_type'      => 'vp_evento',
                            'post_status'    => 'publish',
                            'posts_per_page' => 20,
                            'orderby'        => 'date',
                            'order'          => 'DESC',
                        ]);

                        if ($eventi_query->have_posts()):
                            while ($eventi_query->have_posts()): $eventi_query->the_post();
                                $eid   = get_the_ID();
                                $d     = get_post_meta($eid, '_vp_giorno', true) ?: '';
                                $m     = get_post_meta($eid, '_vp_mese', true) ?: '';
                                $a     = get_post_meta($eid, '_vp_anno', true) ?: date('Y');
                                $ora   = get_post_meta($eid, '_vp_ora', true) ?: '10:00';
                                $luogo = get_post_meta($eid, '_vp_luogo', true) ?: 'Villaggio Prenestino';
                                $pass  = get_post_meta($eid, '_vp_passato', true);
                                $is_passato = ($pass === '1' || $pass === true || $pass === 'true');
                                $part  = (int) $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM $table WHERE tipo='evento_vengo' AND post_id=%d", $eid));
                                ?>
                                <tr>
                                    <td style="padding:12px 16px;">
                                        <strong>
                                            <a href="<?php echo esc_url(get_edit_post_link($eid)); ?>" style="color:#0f172a;text-decoration:none;">
                                                <?php the_title(); ?>
                                            </a>
                                        </strong>
                                    </td>
                                    <td>
                                        <code style="background:#f1f5f9;padding:3px 8px;border-radius:4px;font-weight:600;color:#0f172a;">
                                            <?php echo esc_html($d . ' ' . $m . ' ' . $a); ?>
                                        </code>
                                    </td>
                                    <td><?php echo esc_html($ora); ?></td>
                                    <td><?php echo esc_html($luogo); ?></td>
                                    <td>
                                        <?php if ($is_passato): ?>
                                            <span style="background:#f1f5f9;color:#64748b;font-weight:700;padding:3px 8px;border-radius:12px;font-size:11px;">
                                                🏁 Passato
                                            </span>
                                        <?php else: ?>
                                            <span style="background:#dcfce7;color:#166534;font-weight:700;padding:3px 8px;border-radius:12px;font-size:11px;">
                                                🟢 Attivo
                                            </span>
                                        <?php endif; ?>
                                    </td>
                                    <td style="text-align:center;">
                                        <span style="background:#f8fafc;padding:2px 8px;border-radius:10px;font-weight:700;font-size:12px;">
                                            👥 <?php echo $part; ?>
                                        </span>
                                    </td>
                                    <td style="text-align:right;padding-right:16px;">
                                        <a href="<?php echo esc_url(get_edit_post_link($eid)); ?>" class="button button-small">
                                            Modifica
                                        </a>
                                    </td>
                                </tr>
                                <?php
                            endwhile;
                            wp_reset_postdata();
                        else:
                            ?>
                            <tr>
                                <td colspan="7" style="text-align:center;padding:30px;color:#64748b;">
                                    Nessun evento ancora inserito. <a href="<?php echo admin_url('post-new.php?post_type=vp_evento'); ?>">Aggiungi il primo evento &rarr;</a>
                                </td>
                            </tr>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>

        <!-- ========================================== -->
        <!-- TAB 3: VOLONTARIATO & ALBO                 -->
        <!-- ========================================== -->
        <?php elseif ($active_tab === 'volontari'): ?>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
                <!-- Colonna 1: Serve una Mano (Iniziative attive) -->
                <div>
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
                        <div>
                            <h3 style="margin:0;font-size:16px;font-weight:800;color:#0f172a;">Richieste "Serve una Mano"</h3>
                            <p style="margin:2px 0 0 0;font-size:12px;color:#64748b;">Iniziative civiche in cerca di volontari</p>
                        </div>
                        <a href="<?php echo admin_url('post-new.php?post_type=vp_richiesta'); ?>" class="button button-primary button-small">
                            ➕ Nuova Richiesta
                        </a>
                    </div>

                    <div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                        <table class="wp-list-table widefat fixed striped" style="border:none;">
                            <thead>
                                <tr>
                                    <th style="font-weight:700;padding:10px 14px;">Titolo</th>
                                    <th style="font-weight:700;width:90px;">Volontari</th>
                                    <th style="font-weight:700;width:75px;text-align:right;padding-right:14px;">Azioni</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php
                                $richieste = get_posts(['post_type' => 'vp_richiesta', 'posts_per_page' => 10, 'post_status' => 'publish']);
                                if ($richieste):
                                    foreach ($richieste as $r):
                                        $req = get_post_meta($r->ID, '_vp_volontari_richiesti', true) ?: 3;
                                        $ad  = (int) $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM $table WHERE tipo='richiesta_aderisci' AND post_id=%d", $r->ID));
                                        ?>
                                        <tr>
                                            <td style="padding:10px 14px;">
                                                <strong><a href="<?php echo get_edit_post_link($r->ID); ?>"><?php echo esc_html($r->post_title); ?></a></strong>
                                            </td>
                                            <td>
                                                <span style="font-size:12px;font-weight:700;color:#059669;"><?php echo $ad; ?> / <?php echo $req; ?></span>
                                            </td>
                                            <td style="text-align:right;padding-right:14px;">
                                                <a href="<?php echo get_edit_post_link($r->ID); ?>" class="button button-small">Modifica</a>
                                            </td>
                                        </tr>
                                        <?php
                                    endforeach;
                                else:
                                    echo '<tr><td colspan="3" style="text-align:center;padding:20px;color:#64748b;">Nessuna richiesta presente.</td></tr>';
                                endif;
                                ?>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Colonna 2: Albo Volontari Registrati -->
                <div>
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
                        <div>
                            <h3 style="margin:0;font-size:16px;font-weight:800;color:#0f172a;">Albo Volontari Registrati</h3>
                            <p style="margin:2px 0 0 0;font-size:12px;color:#64748b;">Cittadini disponibili con recapiti privati</p>
                        </div>
                        <a href="<?php echo admin_url('edit.php?post_type=vp_volontario'); ?>" class="button button-secondary button-small">
                            📋 Visualizza Albo Completo
                        </a>
                    </div>

                    <div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                        <table class="wp-list-table widefat fixed striped" style="border:none;">
                            <thead>
                                <tr>
                                    <th style="font-weight:700;padding:10px 14px;">Nome Cittadino</th>
                                    <th style="font-weight:700;width:120px;">Telefono</th>
                                    <th style="font-weight:700;">Attività Offerte</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php
                                $volontari = get_posts(['post_type' => 'vp_volontario', 'posts_per_page' => 10, 'post_status' => 'any']);
                                if ($volontari):
                                    foreach ($volontari as $v):
                                        $tel = get_post_meta($v->ID, '_vp_telefono', true) ?: 'Non specificato';
                                        $att = get_post_meta($v->ID, '_vp_attivita', true) ?: 'Supporto generale';
                                        ?>
                                        <tr>
                                            <td style="padding:10px 14px;">
                                                <strong><a href="<?php echo get_edit_post_link($v->ID); ?>"><?php echo esc_html($v->post_title); ?></a></strong>
                                            </td>
                                            <td>
                                                <code style="font-size:11px;background:#f8fafc;padding:2px 6px;border-radius:4px;"><?php echo esc_html($tel); ?></code>
                                            </td>
                                            <td style="font-size:12px;color:#475569;">
                                                <?php echo esc_html($att); ?>
                                            </td>
                                        </tr>
                                        <?php
                                    endforeach;
                                else:
                                    echo '<tr><td colspan="3" style="text-align:center;padding:20px;color:#64748b;">Nessun volontario iscritto finora.</td></tr>';
                                endif;
                                ?>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

        <!-- ========================================== -->
        <!-- TAB 4: SEGNALAZIONI & PROPOSTE             -->
        <!-- ========================================== -->
        <?php elseif ($active_tab === 'segnalazioni'): ?>
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:20px;">
                <div>
                    <h2 style="margin:0;font-size:18px;font-weight:800;color:#0f172a;">Istanze dei Cittadini & Segnalazioni</h2>
                    <p style="margin:4px 0 0 0;font-size:12px;color:#64748b;">
                        Monitora e aggiorna lo stato delle segnalazioni dei residenti (Ricevuta, Inoltrata al Municipio VI, Risolta).
                    </p>
                </div>
                <a href="<?php echo admin_url('edit.php?post_type=vp_segnalazione'); ?>" class="button button-primary" style="padding:6px 14px;height:auto;">
                    ⚠️ Gestisci Tutte le Segnalazioni in WordPress &rarr;
                </a>
            </div>

            <div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05);margin-bottom:25px;">
                <table class="wp-list-table widefat fixed striped" style="border:none;">
                    <thead>
                        <tr>
                            <th style="font-weight:700;padding:12px 16px;">Problematica Segnalata</th>
                            <th style="font-weight:700;width:150px;">Categoria</th>
                            <th style="font-weight:700;width:180px;">Indirizzo / Luogo</th>
                            <th style="font-weight:700;width:130px;">Stato Risoluzione</th>
                            <th style="font-weight:700;width:80px;text-align:right;padding-right:16px;">Azioni</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php
                        $segnalazioni = get_posts(['post_type' => 'vp_segnalazione', 'posts_per_page' => 15, 'post_status' => 'publish']);
                        if ($segnalazioni):
                            foreach ($segnalazioni as $s):
                                $cat   = get_post_meta($s->ID, '_vp_categoria', true) ?: 'Generico';
                                $luogo = get_post_meta($s->ID, '_vp_luogo', true) ?: 'Villaggio Prenestino';
                                $stato = (int) get_post_meta($s->ID, '_vp_stato', true) ?: 1;
                                ?>
                                <tr>
                                    <td style="padding:12px 16px;">
                                        <strong><a href="<?php echo get_edit_post_link($s->ID); ?>"><?php echo esc_html($s->post_title); ?></a></strong>
                                    </td>
                                    <td><span style="font-size:12px;color:#475569;"><?php echo esc_html($cat); ?></span></td>
                                    <td><span style="font-size:12px;color:#475569;"><?php echo esc_html($luogo); ?></span></td>
                                    <td>
                                        <?php if ($stato === 3): ?>
                                            <span style="background:#dcfce7;color:#166534;font-weight:700;padding:3px 8px;border-radius:12px;font-size:11px;">🟢 Risolta</span>
                                        <?php elseif ($stato === 2): ?>
                                            <span style="background:#fef3c7;color:#92400e;font-weight:700;padding:3px 8px;border-radius:12px;font-size:11px;">🟡 Inoltrata</span>
                                        <?php else: ?>
                                            <span style="background:#fee2e2;color:#991b1b;font-weight:700;padding:3px 8px;border-radius:12px;font-size:11px;">🔴 Ricevuta</span>
                                        <?php endif; ?>
                                    </td>
                                    <td style="text-align:right;padding-right:16px;">
                                        <a href="<?php echo get_edit_post_link($s->ID); ?>" class="button button-small">Dettagli</a>
                                    </td>
                                </tr>
                                <?php
                            endforeach;
                        else:
                            echo '<tr><td colspan="5" style="text-align:center;padding:25px;color:#64748b;">Nessuna segnalazione registrata.</td></tr>';
                        endif;
                        ?>
                    </tbody>
                </table>
            </div>

        <!-- ========================================== -->
        <!-- TAB 5: COMMERCIANTI & NEGOZI DI QUARTIERE  -->
        <!-- ========================================== -->
        <?php elseif ($active_tab === 'commercianti'): ?>
            <?php
            // Gestione azione approvazione rapida
            if (isset($_GET['action']) && $_GET['action'] === 'vpq_approva_commercio' && isset($_GET['post_id']) && check_admin_referer('vpq_approva_commercio_' . $_GET['post_id'])) {
                $pid = absint($_GET['post_id']);
                wp_update_post([
                    'ID'          => $pid,
                    'post_status' => 'publish',
                ]);
                update_post_meta($pid, '_vp_verificato', '1');
                echo '<div class="notice notice-success is-dismissible" style="margin:15px 0;"><p><strong>Attività commerciale approvata con successo! È ora pubblicata e visibile a tutti i residenti su Google Maps e nella vetrina.</strong></p></div>';
            }

            $filtro_stato = isset($_GET['stato_filtro']) ? sanitize_key($_GET['stato_filtro']) : 'tutti';
            $query_args = [
                'post_type'      => 'vp_commercio',
                'posts_per_page' => 50,
                'orderby'        => 'date',
                'order'          => 'DESC',
            ];
            if ($filtro_stato === 'pending') {
                $query_args['post_status'] = 'pending';
            } elseif ($filtro_stato === 'publish') {
                $query_args['post_status'] = 'publish';
            } else {
                $query_args['post_status'] = ['publish', 'pending', 'draft'];
            }
            $commercio_admin_query = new WP_Query($query_args);
            ?>
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:15px;">
                <div>
                    <h2 style="margin:0;font-size:18px;font-weight:800;color:#0f172a;">
                        🏪 Commercianti e Negozi di Quartiere
                    </h2>
                    <p style="margin:2px 0 0 0;font-size:12px;color:#64748b;">
                        Controlla le attività inserite dai commercianti dall'app, approva la pubblicazione e gestisci promozioni e recapiti WhatsApp.
                    </p>
                </div>
                <div style="display:flex;gap:8px;">
                    <a href="<?php echo admin_url('post-new.php?post_type=vp_commercio'); ?>" class="button button-primary">
                        ➕ Aggiungi Nuova Attività
                    </a>
                </div>
            </div>

            <!-- Filtri rapidi -->
            <div style="margin-bottom:15px;display:flex;gap:10px;align-items:center;">
                <span style="font-size:12px;font-weight:600;color:#64748b;">Filtra:</span>
                <a href="<?php echo admin_url('admin.php?page=vp-quartiere&tab=commercianti&stato_filtro=tutti'); ?>" class="button <?php echo $filtro_stato === 'tutti' ? 'button-primary' : 'button-secondary'; ?>" style="font-size:12px;">
                    Tutti (<?php echo $tot_commercio + $pending_commercio; ?>)
                </a>
                <a href="<?php echo admin_url('admin.php?page=vp-quartiere&tab=commercianti&stato_filtro=pending'); ?>" class="button <?php echo $filtro_stato === 'pending' ? 'button-primary' : 'button-secondary'; ?>" style="font-size:12px;<?php echo $pending_commercio > 0 ? 'border-color:#f59e0b;color:#b45309;font-weight:bold;' : ''; ?>">
                    ⏳ In Attesa di Approvazione (<?php echo $pending_commercio; ?>)
                </a>
                <a href="<?php echo admin_url('admin.php?page=vp-quartiere&tab=commercianti&stato_filtro=publish'); ?>" class="button <?php echo $filtro_stato === 'publish' ? 'button-primary' : 'button-secondary'; ?>" style="font-size:12px;">
                    ✅ Pubblicati su App (<?php echo $tot_commercio; ?>)
                </a>
            </div>

            <!-- Tabella Attività -->
            <div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05);margin-bottom:25px;">
                <table class="wp-list-table widefat fixed striped" style="border:none;">
                    <thead>
                        <tr>
                            <th style="font-weight:700;width:65px;text-align:center;">Foto/Logo</th>
                            <th style="font-weight:700;padding:12px 16px;">Nome Attività</th>
                            <th style="font-weight:700;width:140px;">Categoria</th>
                            <th style="font-weight:700;width:220px;">Indirizzo a Villaggio Prenestino</th>
                            <th style="font-weight:700;width:180px;">Telefono & WhatsApp</th>
                            <th style="font-weight:700;width:160px;">Stato Moderazione</th>
                            <th style="font-weight:700;width:90px;text-align:center;">Mi Piace</th>
                            <th style="font-weight:700;width:160px;text-align:right;padding-right:16px;">Azioni Moderatore</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if ($commercio_admin_query->have_posts()): ?>
                            <?php while ($commercio_admin_query->have_posts()): $commercio_admin_query->the_post();
                                $cid        = get_the_ID();
                                $status     = get_post_status($cid);
                                $cat        = get_post_meta($cid, '_vp_categoria', true) ?: 'alimentari';
                                $ind        = get_post_meta($cid, '_vp_indirizzo', true) ?: '—';
                                $tel        = get_post_meta($cid, '_vp_telefono', true);
                                $wa         = get_post_meta($cid, '_vp_whatsapp', true);
                                $mp         = (int) get_post_meta($cid, '_vp_mipiace', true) ?: 0;
                                $ref        = get_post_meta($cid, '_vp_nome_referente', true);
                                $img        = get_post_meta($cid, '_vp_immagine', true) ?: get_the_post_thumbnail_url($cid, 'thumbnail') ?: get_post_meta($cid, '_vp_logo', true);
                                $approva_url = wp_nonce_url(admin_url('admin.php?page=vp-quartiere&tab=commercianti&action=vpq_approva_commercio&post_id=' . $cid), 'vpq_approva_commercio_' . $cid);
                            ?>
                            <tr style="<?php echo $status === 'pending' ? 'background:#fffdf5;' : ''; ?>">
                                <td style="text-align:center;padding:8px 10px;vertical-align:middle;">
                                    <?php if ($img): ?>
                                        <img src="<?php echo esc_url($img); ?>" alt="Logo/Foto" style="width:44px;height:44px;object-fit:cover;border-radius:10px;border:1px solid #cbd5e1;display:inline-block;" />
                                    <?php else: ?>
                                        <div style="width:44px;height:44px;border-radius:10px;background:#f1f5f9;display:inline-flex;align-items:center;justify-content:center;font-size:20px;">🏪</div>
                                    <?php endif; ?>
                                </td>
                                <td style="padding:12px 16px;vertical-align:middle;">
                                    <strong>
                                        <a href="<?php echo esc_url(get_edit_post_link($cid)); ?>" style="color:#0f172a;text-decoration:none;">
                                            <?php the_title(); ?>
                                        </a>
                                    </strong>
                                    <?php if ($ref): ?>
                                        <div style="font-size:11px;color:#64748b;">Referente: <?php echo esc_html($ref); ?></div>
                                    <?php endif; ?>
                                </td>
                                <td>
                                    <span style="font-size:11px;font-weight:600;background:#f1f5f9;padding:2px 8px;border-radius:10px;text-transform:capitalize;">
                                        <?php echo esc_html($cat); ?>
                                    </span>
                                </td>
                                <td style="font-size:12px;color:#334155;"><?php echo esc_html($ind); ?></td>
                                <td style="font-size:12px;">
                                    <?php if ($tel): ?><div>📞 <a href="tel:<?php echo esc_attr($tel); ?>"><?php echo esc_html($tel); ?></a></div><?php endif; ?>
                                    <?php if ($wa): ?><div>💬 <a href="https://wa.me/<?php echo esc_attr($wa); ?>" target="_blank" style="color:#16a34a;font-weight:bold;">WhatsApp</a></div><?php endif; ?>
                                </td>
                                <td>
                                    <?php if ($status === 'pending'): ?>
                                        <span style="background:#fef3c7;color:#92400e;padding:3px 10px;border-radius:12px;font-weight:bold;font-size:11px;display:inline-block;">
                                            ⏳ In Attesa Approvazione
                                        </span>
                                    <?php elseif ($status === 'publish'): ?>
                                        <span style="background:#dcfce7;color:#166534;padding:3px 10px;border-radius:12px;font-weight:bold;font-size:11px;display:inline-block;">
                                            ✅ Pubblicata su App
                                        </span>
                                    <?php else: ?>
                                        <span style="font-size:11px;color:#64748b;"><?php echo esc_html($status); ?></span>
                                    <?php endif; ?>
                                </td>
                                <td style="text-align:center;font-weight:bold;font-size:12px;color:#0f172a;">
                                    <?php echo $mp; ?> 👍
                                </td>
                                <td style="text-align:right;padding-right:16px;">
                                    <?php if ($status === 'pending'): ?>
                                        <a href="<?php echo esc_url($approva_url); ?>" class="button button-small button-primary" style="background:#16a34a;border-color:#15803d;font-weight:bold;margin-right:4px;">
                                            ✓ Approva
                                        </a>
                                    <?php endif; ?>
                                    <a href="<?php echo esc_url(get_edit_post_link($cid)); ?>" class="button button-small">
                                        Modifica
                                    </a>
                                </td>
                            </tr>
                            <?php endwhile; wp_reset_postdata(); ?>
                        <?php else: ?>
                            <tr>
                                <td colspan="7" style="text-align:center;padding:30px;color:#64748b;">
                                    Nessuna attività commerciale trovata per il filtro selezionato.
                                </td>
                            </tr>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>

        <!-- ========================================== -->
        <!-- TAB 6: IMPOSTAZIONI & API                  -->
        <!-- ========================================== -->
        <?php elseif ($active_tab === 'impostazioni'): ?>
            <div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:25px;box-shadow:0 1px 3px rgba(0,0,0,0.05);max-width:850px;">
                <h2 style="margin:0 0 4px 0;font-size:18px;font-weight:800;color:#0f172a;">Configurazione Comunicazione Web App & REST API</h2>
                <p style="margin:0 0 20px 0;font-size:13px;color:#64748b;">
                    Parametri di sincronizzazione dati tra WordPress e la Web App attiva per i cittadini.
                </p>

                <div style="background:#f8fafc;border-left:4px solid #059669;padding:14px 18px;border-radius:0 8px 8px 0;margin-bottom:20px;">
                    <div style="font-size:13px;color:#334155;line-height:1.7;">
                        <div><strong>Endpoint Feed Dati App:</strong> <code><?php echo esc_html($endpoint_base); ?>dati</code></div>
                        <div style="margin-top:4px;"><strong>Chiave Segreta di Sicurezza (Header X-VP-Key):</strong> 
                            <code style="background:#e2e8f0;padding:3px 8px;border-radius:4px;font-weight:700;color:#0f172a;"><?php echo esc_html($api_key); ?></code>
                        </div>
                    </div>
                </div>

                <form method="post">
                    <?php wp_nonce_field('vpq_settings_nonce'); ?>
                    <table class="form-table" style="margin-top:0;">
                        <tr>
                            <th scope="row" style="font-weight:700;">Domini Autorizzati (CORS):</th>
                            <td>
                                <input type="text" name="vpq_allow_origins" value="<?php echo esc_attr($origins); ?>" class="regular-text" style="width:100%;max-width:500px;" />
                                <p class="description" style="margin-top:4px;">
                                    Usa <code>*</code> per consentire a tutti i dispositivi/app, oppure inserisci l'URL esatto (es. <code>https://www.villaggioprenestino.it</code>).
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row" style="font-weight:700;">Sicurezza Chiave:</th>
                            <td>
                                <label style="display:flex;align-items:center;gap:8px;">
                                    <input type="checkbox" name="vpq_regenerate_key" value="1" />
                                    <span>Rigenera una nuova chiave API di sicurezza</span>
                                </label>
                            </td>
                        </tr>
                    </table>

                    <p class="submit" style="margin-top:20px;padding-top:15px;border-top:1px solid #f1f5f9;">
                        <input type="submit" name="vpq_save_settings" class="button button-primary" value="Salva Impostazioni API" style="padding:6px 16px;height:auto;" />
                    </p>
                </form>
            </div>

        <!-- ========================================== -->
        <!-- TAB 6: WEB APP & DOWNLOAD                  -->
        <!-- ========================================== -->
        <?php elseif ($active_tab === 'webapp'): ?>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
                <!-- Card 1: Stato Web App -->
                <div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
                        <span class="dashicons dashicons-smartphone" style="font-size:26px;width:26px;height:26px;color:#2563eb;"></span>
                        <h3 style="margin:0;font-size:16px;font-weight:800;color:#0f172a;">Applicazione Pubblicata</h3>
                    </div>
                    <p style="font-size:13px;color:#64748b;line-height:1.5;">
                        La Web App dei cittadini è accessibile al percorso dedicato del sito web. Tutti i dati inseriti nel plugin compaiono istantaneamente nell'app.
                    </p>
                    <div style="margin:16px 0;background:#f8fafc;padding:12px 14px;border-radius:10px;border:1px solid #e2e8f0;">
                        <span style="font-size:11px;color:#64748b;text-transform:uppercase;font-weight:700;">Indirizzo Web App:</span>
                        <div style="font-size:13px;font-weight:700;color:#2563eb;margin-top:2px;">
                            <a href="<?php echo esc_url($app_url); ?>" target="_blank" style="text-decoration:none;">
                                <?php echo esc_html($app_url); ?> &rarr;
                            </a>
                        </div>
                    </div>
                    <a href="<?php echo esc_url($app_url); ?>" target="_blank" class="button button-primary" style="background:#2563eb;border-color:#1d4ed8;width:100%;text-align:center;padding:6px 0;height:auto;">
                        🚀 Apri la Web App nel Browser
                    </a>
                </div>

                <!-- Card 2: Risorse & Download ZIP -->
                <div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
                        <span class="dashicons dashicons-download" style="font-size:26px;width:26px;height:26px;color:#059669;"></span>
                        <h3 style="margin:0;font-size:16px;font-weight:800;color:#0f172a;">File del Progetto & Pacchetti</h3>
                    </div>
                    <p style="font-size:13px;color:#64748b;line-height:1.5;">
                        Scarica l'archivio del plugin o i file statici compilati della web app per l'installazione su Ergonet o altri server.
                    </p>
                    <div style="display:flex;flex-direction:column;gap:10px;margin-top:16px;">
                        <a href="<?php echo esc_url(home_url('/vp-quartiere.zip')); ?>" class="button button-secondary" style="display:flex;align-items:center;justify-content:center;gap:6px;padding:6px 0;height:auto;">
                            <span class="dashicons dashicons-admin-plugins" style="margin-top:-2px;"></span> Scarica Plugin Aggiornato (vp-quartiere.zip v1.3.1)
                        </a>
                        <a href="<?php echo esc_url(home_url('/villaggioprenestino-app.zip')); ?>" class="button button-secondary" style="display:flex;align-items:center;justify-content:center;gap:6px;padding:6px 0;height:auto;">
                            <span class="dashicons dashicons-media-archive" style="margin-top:-2px;"></span> Scarica Pacchetto Web App (villaggioprenestino-app.zip)
                        </a>
                    </div>
                </div>
            </div>
        <?php endif; ?>

    </div>
    <?php
}
