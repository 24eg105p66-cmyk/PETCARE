const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

async function initAssets() {
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  const petsDir = path.join(uploadsDir, 'pets');
  const qrcodesDir = path.join(uploadsDir, 'qrcodes');
  const docsDir = path.join(uploadsDir, 'documents');
  const reportsDir = path.join(uploadsDir, 'reports');

  [uploadsDir, petsDir, qrcodesDir, docsDir, reportsDir].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  // Base URL for QR codes (can be overridden by APP_URL in .env)
  const appUrl = process.env.APP_URL || 'http://localhost:5000';

  // Generate QR code for Max
  const maxQrPath = path.join(qrcodesDir, 'qr-pet_max_golden_2026_demo.png');
  await QRCode.toFile(maxQrPath, `${appUrl}/emergency/pet_max_golden_2026_demo`, {
    errorCorrectionLevel: 'H',
    margin: 2,
    color: { dark: '#1e5136', light: '#ffffff' },
    width: 400
  });

  // Generate QR code for Luna
  const lunaQrPath = path.join(qrcodesDir, 'qr-pet_luna_cat_2026_demo.png');
  await QRCode.toFile(lunaQrPath, `${appUrl}/emergency/pet_luna_cat_2026_demo`, {
    errorCorrectionLevel: 'H',
    margin: 2,
    color: { dark: '#1e5136', light: '#ffffff' },
    width: 400
  });

  // Create clean SVG/PNG avatars for Max & Luna
  const maxSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
    <rect width="100%" height="100%" fill="#E9F5ED"/>
    <circle cx="200" cy="180" r="110" fill="#E6AF2E"/>
    <!-- Dog Face -->
    <ellipse cx="200" cy="190" rx="90" ry="75" fill="#F4C95D"/>
    <!-- Ears -->
    <path d="M 120,130 C 90,160 85,240 125,230 C 145,225 145,170 140,140 Z" fill="#D4991E"/>
    <path d="M 280,130 C 310,160 315,240 275,230 C 255,225 255,170 260,140 Z" fill="#D4991E"/>
    <!-- Eyes -->
    <ellipse cx="165" cy="175" rx="10" ry="12" fill="#2D3142"/>
    <circle cx="168" cy="172" r="3" fill="#FFFFFF"/>
    <ellipse cx="235" cy="175" rx="10" ry="12" fill="#2D3142"/>
    <circle cx="238" cy="172" r="3" fill="#FFFFFF"/>
    <!-- Snout & Nose -->
    <ellipse cx="200" cy="210" rx="35" ry="25" fill="#FAF0CA"/>
    <path d="M 190,200 Q 200,195 210,200 Q 200,215 190,200 Z" fill="#2D3142"/>
    <path d="M 200,212 L 200,222 M 193,222 Q 200,227 207,222" stroke="#2D3142" stroke-width="3" fill="none"/>
    <!-- Collar & Tag -->
    <rect x="130" y="270" width="140" height="20" rx="10" fill="#2D6A4F"/>
    <circle cx="200" cy="295" r="14" fill="#E76F51"/>
    <text x="200" y="300" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#FFFFFF" text-anchor="middle">QR</text>
    <text x="200" y="355" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#1E5136" text-anchor="middle">Max (Golden Retriever)</text>
  </svg>`;

  const lunaSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
    <rect width="100%" height="100%" fill="#EBF2FA"/>
    <circle cx="200" cy="180" r="110" fill="#90A4AE"/>
    <!-- Ears -->
    <polygon points="120,130 160,80 175,140" fill="#78909C"/>
    <polygon points="135,125 160,95 170,135" fill="#FFCDD2"/>
    <polygon points="280,130 240,80 225,140" fill="#78909C"/>
    <polygon points="265,125 240,95 230,135" fill="#FFCDD2"/>
    <!-- Face -->
    <ellipse cx="200" cy="185" rx="85" ry="70" fill="#B0BEC5"/>
    <!-- Eyes -->
    <ellipse cx="165" cy="175" rx="14" ry="16" fill="#FFB74D"/>
    <ellipse cx="165" cy="175" rx="6" ry="14" fill="#263238"/>
    <circle cx="162" cy="170" r="3" fill="#FFFFFF"/>
    <ellipse cx="235" cy="175" rx="14" ry="16" fill="#FFB74D"/>
    <ellipse cx="235" cy="175" rx="6" ry="14" fill="#263238"/>
    <circle cx="232" cy="170" r="3" fill="#FFFFFF"/>
    <!-- Nose & Mouth -->
    <polygon points="195,195 205,195 200,202" fill="#E57373"/>
    <path d="M 200,202 Q 192,208 185,205 M 200,202 Q 208,208 215,205" stroke="#37474F" stroke-width="2.5" fill="none"/>
    <!-- Whiskers -->
    <path d="M 170,195 L 120,190 M 170,202 L 120,205 M 230,195 L 280,190 M 230,202 L 280,205" stroke="#CFD8DC" stroke-width="2"/>
    <!-- Collar -->
    <rect x="145" y="260" width="110" height="16" rx="8" fill="#E76F51"/>
    <circle cx="200" cy="282" r="10" fill="#FFD54F"/>
    <text x="200" y="350" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#2D6A4F" text-anchor="middle">Luna (British Shorthair)</text>
  </svg>`;

  fs.writeFileSync(path.join(petsDir, 'demo-max.svg'), maxSvg);
  fs.writeFileSync(path.join(petsDir, 'demo-luna.svg'), lunaSvg);

  // Also write dummy document files for demo
  fs.writeFileSync(path.join(docsDir, 'rabies_certificate_max.pdf'), '%PDF-1.4 Demonstration Veterinary Certificate for Max (Rabies Vaccination 3-Yr Booster)');
  fs.writeFileSync(path.join(docsDir, 'apoquel_prescription.pdf'), '%PDF-1.4 Demonstration Veterinary Prescription for Max (Apoquel 16mg)');

  console.log('✅ Initial assets, SVGs, and QR codes generated successfully.');
}

if (require.main === module) {
  initAssets().catch(console.error);
}

module.exports = { initAssets };
