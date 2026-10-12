import os
import shutil
import zipfile
import subprocess

def main():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    print("1. Compiling production build with Vite...")
    subprocess.run(["npm", "run", "build"], cwd=root_dir, check=True)

    dist_dir = os.path.join(root_dir, "dist")
    public_dir = os.path.join(root_dir, "public")

    # Files to exclude from the app zip
    exclude_files = {"villaggioprenestino-app.zip", "vp-quartiere.zip"}
    exclude_dirs = {"vp-quartiere"}

    # Create README-INSTALLAZIONE.txt
    readme_content = """========================================================================
GUIDA ALL'INSTALLAZIONE: WEB APP VILLAGGIO PRENESTINO (V1.3.2)
========================================================================

Questa cartella contiene i file di produzione della Web App del Comitato
di Quartiere Villaggio Prenestino, pronta per essere caricata su qualsiasi
hosting Apache/PHP (es. Ergonet, cPanel, Plesk) o server web.

------------------------------------------------------------------------
ISTRUZIONI RAPIDE PER ERGONET / cPANEL / FILEZILLA (3 MINUTI)
------------------------------------------------------------------------

1. ACCESSO AL TUO HOSTING:
   - Apri cPanel -> "Gestione File" (File Manager)
     oppure collegati con FileZilla (FTP / SFTP).

2. CARICAMENTO NELLA CARTELLA /app:
   - Vai nella cartella radice del tuo dominio (di solito 'public_html').
   - Se non esiste già, crea una nuova cartella chiamata 'app'.
   - Carica tutti i file di questo archivio dentro 'public_html/app/':
       - index.html
       - assets/ (con i file CSS e JS compilati)
       - logo-cdq.svg
       - logoo-cdq-2019-BIANCO-ORIZZONTALE.png
       - .htaccess (importante per il routing Apache!)

3. VERIFICA ONLINE:
   - Apri nel browser: https://www.villaggioprenestino.it/app
   - La Web App sarà immediatamente visibile e funzionante!

------------------------------------------------------------------------
INTEGRAZIONE CON WORDPRESS:
------------------------------------------------------------------------
1. Installa e attiva il plugin WordPress 'vp-quartiere.zip' da:
   WP Admin -> Plugin -> Aggiungi nuovo -> Carica plugin.

2. Nel menu di WordPress apparirà la voce '🏡 VP Quartiere' con la
   Dashboard & Tab Hub.

3. La Web App e il plugin dialogheranno automaticamente tramite le
   API REST di WordPress su:
   https://www.villaggioprenestino.it/wp-json/vp/v1/

Buon lavoro dal Comitato di Quartiere Villaggio Prenestino!
========================================================================
"""
    readme_path = os.path.join(dist_dir, "LEGGIMI-INSTALLAZIONE.txt")
    with open(readme_path, "w", encoding="utf-8") as f:
        f.write(readme_content)

    # Copy readme to public too so it's kept
    with open(os.path.join(public_dir, "LEGGIMI-INSTALLAZIONE.txt"), "w", encoding="utf-8") as f:
        f.write(readme_content)

    print("2. Packaging villaggioprenestino-app.zip...")
    app_zip_dist = os.path.join(dist_dir, "villaggioprenestino-app.zip")
    app_zip_public = os.path.join(public_dir, "villaggioprenestino-app.zip")

    # Remove existing zip files first to avoid nesting
    for z in [app_zip_dist, app_zip_public]:
        if os.path.exists(z):
            os.remove(z)

    with zipfile.ZipFile(app_zip_public, "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(dist_dir):
            # Exclude unwanted directories
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            for file in files:
                if file in exclude_files:
                    continue
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, dist_dir)
                zipf.write(file_path, rel_path)

        # Include duplicated files in root for assets (so the app works whether extracted flat or in subfolders)
        assets_dir = os.path.join(dist_dir, "assets")
        if os.path.exists(assets_dir):
            for file in os.listdir(assets_dir):
                file_path = os.path.join(assets_dir, file)
                if os.path.isfile(file_path):
                    # Write in root of zip as well
                    zipf.write(file_path, file)

    # Also copy app zip to dist
    shutil.copyfile(app_zip_public, app_zip_dist)
    print(f"   Created {app_zip_public} ({os.path.getsize(app_zip_public)} bytes)")

    print("3. Packaging vp-quartiere.zip (WordPress plugin)...")
    wp_plugin_folder = os.path.join(public_dir, "vp-quartiere")
    wp_zip_public = os.path.join(public_dir, "vp-quartiere.zip")
    wp_zip_dist = os.path.join(dist_dir, "vp-quartiere.zip")

    for z in [wp_zip_public, wp_zip_dist]:
        if os.path.exists(z):
            os.remove(z)

    with zipfile.ZipFile(wp_zip_public, "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(wp_plugin_folder):
            for file in files:
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, public_dir)
                zipf.write(file_path, rel_path)

    shutil.copyfile(wp_zip_public, wp_zip_dist)
    print(f"   Created {wp_zip_public} ({os.path.getsize(wp_zip_public)} bytes)")

    print("Done! Both zip files are freshly built and ready for download.")

if __name__ == "__main__":
    main()
