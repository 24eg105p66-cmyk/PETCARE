const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const qrcodesDir = path.join(__dirname, '..', 'uploads', 'qrcodes');
if (!fs.existsSync(qrcodesDir)) {
  fs.mkdirSync(qrcodesDir, { recursive: true });
}

function getAppUrl() {
  return process.env.APP_URL || 'http://localhost:5000';
}

function generatePublicId() {
  const cleanUuid = uuidv4().replace(/-/g, '');
  return `pet_${cleanUuid.substring(0, 16)}`;
}

async function generatePetQRCode(publicId) {
  const appUrl = getAppUrl();
  const emergencyUrl = `${appUrl}/emergency/${publicId}`;
  const filename = `qr-${publicId}.png`;
  const filePath = path.join(qrcodesDir, filename);

  await QRCode.toFile(filePath, emergencyUrl, {
    errorCorrectionLevel: 'H',
    margin: 2,
    color: {
      dark: '#1E5136', // Forest green
      light: '#FFFFFF'
    },
    width: 500
  });

  const qrCodeUrl = `/uploads/qrcodes/${filename}`;
  return {
    publicId,
    emergencyUrl,
    qrCodeUrl,
    filePath
  };
}

async function getQRCodeDataUrl(publicId) {
  const appUrl = getAppUrl();
  const emergencyUrl = `${appUrl}/emergency/${publicId}`;
  return await QRCode.toDataURL(emergencyUrl, {
    errorCorrectionLevel: 'H',
    margin: 2,
    color: {
      dark: '#1E5136',
      light: '#FFFFFF'
    },
    width: 500
  });
}

module.exports = {
  generatePublicId,
  generatePetQRCode,
  getQRCodeDataUrl,
  getAppUrl
};
