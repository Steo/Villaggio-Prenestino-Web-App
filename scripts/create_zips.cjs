const fs = require('fs');
const path = require('path');

function createSimpleZip(sourceDir, outPath, rootPrefix = '', excludeFilter = null) {
  const files = [];

  function readDir(dir, base) {
    if (!fs.existsSync(dir)) return;
    for (const item of fs.readdirSync(dir)) {
      const full = path.join(dir, item);
      const rel = base ? path.join(base, item) : item;

      if (excludeFilter && excludeFilter(item, rel, full)) {
        continue;
      }

      if (item.endsWith('.zip')) {
        continue;
      }

      if (fs.statSync(full).isDirectory()) {
        readDir(full, rel);
      } else {
        files.push({ rel: rel.split(path.sep).join('/'), full });
      }
    }
  }

  readDir(sourceDir, rootPrefix);

  function dosDateTime(d) {
    const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (Math.floor(d.getSeconds() / 2));
    const date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    return { time, date };
  }

  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }

  function crc32(buf) {
    let crc = 0 ^ -1;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
    }
    return (crc ^ -1) >>> 0;
  }

  const fileBuffers = [];
  const centralHeaders = [];
  let offset = 0;
  const now = new Date();
  const dt = dosDateTime(now);

  for (const f of files) {
    const data = fs.readFileSync(f.full);
    const nameBuf = Buffer.from(f.rel, 'utf8');
    const crc = crc32(data);
    const size = data.length;

    const locHdr = Buffer.alloc(30 + nameBuf.length);
    locHdr.writeUInt32LE(0x04034b50, 0);
    locHdr.writeUInt16LE(20, 4);
    locHdr.writeUInt16LE(0, 6);
    locHdr.writeUInt16LE(0, 8);
    locHdr.writeUInt16LE(dt.time, 10);
    locHdr.writeUInt16LE(dt.date, 12);
    locHdr.writeUInt32LE(crc, 14);
    locHdr.writeUInt32LE(size, 18);
    locHdr.writeUInt32LE(size, 22);
    locHdr.writeUInt16LE(nameBuf.length, 26);
    locHdr.writeUInt16LE(0, 28);
    nameBuf.copy(locHdr, 30);

    const cenHdr = Buffer.alloc(46 + nameBuf.length);
    cenHdr.writeUInt32LE(0x02014b50, 0);
    cenHdr.writeUInt16LE(20, 4);
    cenHdr.writeUInt16LE(20, 6);
    cenHdr.writeUInt16LE(0, 8);
    cenHdr.writeUInt16LE(0, 10);
    cenHdr.writeUInt16LE(dt.time, 12);
    cenHdr.writeUInt16LE(dt.date, 14);
    cenHdr.writeUInt32LE(crc, 16);
    cenHdr.writeUInt32LE(size, 20);
    cenHdr.writeUInt32LE(size, 24);
    cenHdr.writeUInt16LE(nameBuf.length, 28);
    cenHdr.writeUInt16LE(0, 30);
    cenHdr.writeUInt16LE(0, 32);
    cenHdr.writeUInt16LE(0, 34);
    cenHdr.writeUInt16LE(0, 36);
    cenHdr.writeUInt32LE(0, 38);
    cenHdr.writeUInt32LE(offset, 42);
    nameBuf.copy(cenHdr, 46);

    fileBuffers.push(locHdr, data);
    centralHeaders.push(cenHdr);
    offset += locHdr.length + size;
  }

  const cenStart = offset;
  let cenSize = 0;
  for (const c of centralHeaders) {
    fileBuffers.push(c);
    cenSize += c.length;
  }

  const endHdr = Buffer.alloc(22);
  endHdr.writeUInt32LE(0x06054b50, 0);
  endHdr.writeUInt16LE(0, 4);
  endHdr.writeUInt16LE(0, 6);
  endHdr.writeUInt16LE(files.length, 8);
  endHdr.writeUInt16LE(files.length, 10);
  endHdr.writeUInt32LE(cenSize, 12);
  endHdr.writeUInt32LE(cenStart, 16);
  endHdr.writeUInt16LE(0, 20);
  fileBuffers.push(endHdr);

  fs.writeFileSync(outPath, Buffer.concat(fileBuffers));
  const stats = fs.statSync(outPath);
  console.log(`[ZIP OK] ${outPath} (${(stats.size / 1024).toFixed(1)} KB, ${files.length} files)`);
}

console.log('--- Generazione Pacchetti ZIP VP Quartiere ---');

// 1. Pacchetto WordPress Plugin
const pluginSource = path.join(__dirname, '..', 'public', 'vp-quartiere');
const pluginZipOut = path.join(__dirname, '..', 'public', 'vp-quartiere.zip');
createSimpleZip(pluginSource, pluginZipOut, 'vp-quartiere');

// 2. Pacchetto Web App compilata
const distDir = path.join(__dirname, '..', 'dist');
const webAppZipOut = path.join(__dirname, '..', 'public', 'villaggioprenestino-app.zip');

if (fs.existsSync(distDir)) {
  // Garantisci la doppia compatibilità per evitare schermata bianca se scompattato piatto in /app/
  const assetsDir = path.join(distDir, 'assets');
  if (fs.existsSync(assetsDir)) {
    const assetFiles = fs.readdirSync(assetsDir);
    for (const af of assetFiles) {
      const srcFile = path.join(assetsDir, af);
      const destFile = path.join(distDir, af);
      if (!fs.existsSync(destFile) && fs.statSync(srcFile).isFile()) {
        fs.copyFileSync(srcFile, destFile);
      }
    }
    console.log(`[COMPAT] Duplicati ${assetFiles.length} file assets nella root dist per compatibilità estrazione piatta cPanel/FTP`);
  }

  // Assicurati che .htaccess e LEGGIMI siano presenti
  const htaccessPublic = path.join(__dirname, '..', 'public', '.htaccess');
  const htaccessDist = path.join(distDir, '.htaccess');
  if (fs.existsSync(htaccessPublic) && !fs.existsSync(htaccessDist)) {
    fs.copyFileSync(htaccessPublic, htaccessDist);
  }

  const leggimiPublic = path.join(__dirname, '..', 'public', 'LEGGIMI-INSTALLAZIONE.txt');
  const leggimiDist = path.join(distDir, 'LEGGIMI-INSTALLAZIONE.txt');
  if (fs.existsSync(leggimiPublic) && !fs.existsSync(leggimiDist)) {
    fs.copyFileSync(leggimiPublic, leggimiDist);
  }

  // Crea lo zip escludendo file .zip ricorsivi e la cartella del plugin wp-quartiere
  createSimpleZip(distDir, webAppZipOut, '', (item) => {
    return item === 'vp-quartiere' || item.endsWith('.zip');
  });

  // Copia entrambi i pacchetti anche dentro dist per garantire disponibilità sia in dev che in produzione
  const distPluginZip = path.join(distDir, 'vp-quartiere.zip');
  const distWebAppZip = path.join(distDir, 'villaggioprenestino-app.zip');
  fs.copyFileSync(pluginZipOut, distPluginZip);
  fs.copyFileSync(webAppZipOut, distWebAppZip);
  console.log('[SYNC] Copiati entrambi gli ZIP in dist/ per servire il download in ogni modalità');
} else {
  console.warn('[AVVISO] Cartella dist/ non trovata. Esegui prima npm run build.');
}

console.log('--- Generazione completata con successo ---');
