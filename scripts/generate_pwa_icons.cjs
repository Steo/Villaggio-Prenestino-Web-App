const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

// Path vettoriale originale del monogramma corsivo CdQ
const cdqPathD = "M 111.450 45.407 C 108.198 46.823, 103.848 51.460, 101.486 56.027 C 99.576 59.720, 95.887 73.257, 95.115 79.401 C 94.536 84.015, 94.271 84.382, 90.591 85.654 C 84.203 87.863, 80.561 91.385, 76.753 99.038 C 73.553 105.471, 72.331 106.829, 65.111 111.980 C 54.894 119.268, 48.085 122.253, 40.500 122.768 C 35.446 123.111, 33.956 122.806, 31.054 120.834 C 25.551 117.095, 23.690 112.956, 23.783 104.654 C 23.926 91.770, 30.813 75.022, 39.813 65.668 C 44.656 60.634, 47.955 59, 53.276 59 C 58.197 59, 61.351 61.481, 62.545 66.293 C 63.414 69.793, 60.833 76.869, 57.570 79.935 C 54.420 82.894, 48.296 84.922, 44.415 84.293 C 41.810 83.870, 41.193 84.154, 40.710 86 C 40.392 87.218, 40.560 89.343, 41.085 90.723 C 41.987 93.096, 42.374 93.209, 48.272 92.834 C 55.972 92.343, 62.244 88.434, 66.784 81.292 C 74.150 69.707, 72.819 57.908, 63.532 52.466 C 51.204 45.241, 33.131 54.147, 21.960 72.951 C 4.082 103.044, 11.756 132.067, 37.566 131.976 C 50.150 131.931, 60.196 128.226, 68.867 120.430 C 73.409 116.346, 73.905 116.127, 74.484 117.949 C 75.522 121.219, 79.911 124, 84.034 124 C 86.663 124, 89.333 122.968, 92.880 120.581 L 97.961 117.161 101.381 120.581 C 106.354 125.554, 110.887 124.970, 119.777 118.212 C 121.580 116.842, 123.171 115.896, 123.314 116.111 C 128.239 123.499, 130.093 125.556, 133.762 127.706 C 136.183 129.125, 139.559 130.571, 141.264 130.920 C 143.988 131.477, 144.708 132.402, 147.188 138.527 C 150.186 145.933, 154.588 150.932, 158.266 151.106 C 165.560 151.452, 170.782 149.578, 176.920 144.414 C 179.420 142.310, 180.041 141.083, 179.803 138.717 C 179.282 133.533, 176.767 133.074, 172.081 137.308 C 166.140 142.676, 162.341 142.457, 156.463 136.408 C 154.008 133.883, 152 131.464, 152 131.033 C 152 130.602, 153.463 129.958, 155.250 129.600 C 165.997 127.452, 177.032 113.766, 181.595 96.929 C 184.059 87.834, 184.053 72.181, 181.584 65.032 C 178.858 57.144, 171.249 49.739, 164.107 48.026 C 149.179 44.445, 135.354 52.427, 126.911 69.500 C 122.017 79.397, 119.538 91.480, 120.301 101.709 L 120.840 108.918 116.189 111.998 C 110.588 115.708, 107.923 115.584, 106.854 111.565 C 105.830 107.714, 107.348 101.235, 110.941 94.118 C 115.422 85.239, 120.880 68.629, 121.584 61.726 C 122.348 54.229, 120.794 47.670, 117.749 45.537 C 115.151 43.717, 115.321 43.721, 111.450 45.407 M 110.154 55.713 C 108.173 59.414, 106.053 69.788, 105.008 80.885 C 104.419 87.147, 104.150 92.483, 104.410 92.743 C 105.065 93.398, 107.383 87.633, 110.983 76.395 C 114.606 65.085, 115.460 54.768, 112.817 54.225 C 111.892 54.035, 110.693 54.705, 110.154 55.713 M 151.191 56.676 C 144.735 59.858, 136.701 72.646, 133.571 84.724 C 131.759 91.717, 131.523 103.743, 133.088 109.377 C 134.614 114.875, 140.577 120.921, 145.196 121.656 C 150.466 122.495, 153.471 121.470, 158.194 117.225 C 165.797 110.391, 172 92.766, 172 77.995 C 172 68.336, 170.367 62.532, 166.494 58.425 C 163.760 55.526, 162.591 55.003, 158.882 55.023 C 156.472 55.035, 153.011 55.779, 151.191 56.676 M 90.146 94.008 C 86.572 97.582, 82.777 107.096, 83.200 111.422 C 83.457 114.058, 83.948 114.544, 86.616 114.803 C 89.083 115.044, 90.281 114.454, 92.366 111.977 C 94.781 109.107, 95 108.103, 95 99.923 C 95 95.015, 94.585 91, 94.077 91 C 93.569 91, 91.800 92.354, 90.146 94.008";

/**
 * Genera l'SVG dell'icona ufficiale CdQ.
 * @param {number} size - Dimensione della vista (es. 512)
 * @param {boolean} maskable - Se true, applica padding di sicurezza per le icone Android maskable (80% safe zone)
 */
function createCdqSvg(size, maskable = false) {
  // Scala del monogramma:
  // Nel viewBox originale 195x196, il monogramma è centrato su (97.5, 97.5)
  // Per standard (any) usiamo scale ~2.42 su 512 (circa 400px di larghezza, perfetto per home screen)
  // Per maskable, riduciamo leggermente a ~1.95 per garantire che i margini rientrino nel cerchio centrale dell'80%
  const scale = maskable ? 1.95 : 2.42;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs>
    <!-- Gradiente rosso bordeaux profondo ad alta fedeltà -->
    <linearGradient id="bgGrad" x1="0.5" y1="0" x2="0.5" y2="1">
      <stop offset="0%" stop-color="#9a1815"/>
      <stop offset="35%" stop-color="#8a1412"/>
      <stop offset="70%" stop-color="#730e0c"/>
      <stop offset="100%" stop-color="#4e0807"/>
    </linearGradient>

    <!-- Riflesso lucido ad arco (effetto gloss social / app icon) -->
    <linearGradient id="glossGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.22"/>
      <stop offset="80%" stop-color="#ffffff" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.0"/>
    </linearGradient>

    <!-- Ombreggiatura morbida per le lettere bianche -->
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="2" dy="5" stdDeviation="4.5" flood-color="#1c0302" flood-opacity="0.65"/>
    </filter>
  </defs>

  <!-- Bordo esterno scuro (cornice icona social CdQ) -->
  <rect x="0" y="0" width="512" height="512" fill="#420908"/>
  <!-- Filetto di separazione interno scuro -->
  <rect x="6" y="6" width="500" height="500" fill="#290403"/>
  <!-- Sfondo rosso porpora con gradiente -->
  <rect x="10" y="10" width="492" height="492" fill="url(#bgGrad)"/>

  <!-- Effetto riflesso curvo superiore -->
  <path d="M 10 10 L 502 10 L 502 272 Q 330 298 256 302 Q 130 306 10 316 Z" fill="url(#glossGrad)"/>

  <!-- Monogramma corsivo bianco "CdQ" con ombra elegante -->
  <g transform="translate(256, 256) scale(${scale}) translate(-97.5, -97.5)" filter="url(#shadow)">
    <path d="${cdqPathD}" fill="#ffffff" fill-rule="evenodd"/>
  </g>
</svg>`;
}

function renderPng(svg, size, outputPath) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
    imageRendering: 1,
    shapeRendering: 2,
    textRendering: 1,
  });
  const pngData = resvg.render();
  fs.writeFileSync(outputPath, pngData.asPng());
  console.log(`✓ Generato: ${outputPath} (${size}x${size}, ${pngData.asPng().length} bytes)`);
}

const publicDir = path.join(__dirname, '../public');
const distDir = path.join(__dirname, '../dist');

// 1. Salva l'SVG master dell'icona
const masterSvg = createCdqSvg(512, false);
fs.writeFileSync(path.join(publicDir, 'pwa-icon.svg'), masterSvg);
fs.writeFileSync(path.join(publicDir, 'icon.svg'), masterSvg);

// 2. Genera l'icona Android 512x512
renderPng(masterSvg, 512, path.join(publicDir, 'pwa-512x512.png'));

// 3. Genera l'icona Android 192x192
renderPng(masterSvg, 192, path.join(publicDir, 'pwa-192x192.png'));

// 4. Genera l'icona Apple Touch per iOS Safari (180x180)
renderPng(masterSvg, 180, path.join(publicDir, 'apple-touch-icon.png'));

// 5. Genera l'icona Android Maskable 512x512 (con safe zone del 80%)
const maskableSvg = createCdqSvg(512, true);
renderPng(maskableSvg, 512, path.join(publicDir, 'pwa-maskable-512x512.png'));

// 6. Genera favicon PNG per browser tab desktop (48x48 e 32x32)
renderPng(masterSvg, 48, path.join(publicDir, 'favicon-48x48.png'));
renderPng(masterSvg, 32, path.join(publicDir, 'favicon-32x32.png'));

console.log('Tutte le icone PWA per dispositivi mobili e desktop sono state generate con successo!');
