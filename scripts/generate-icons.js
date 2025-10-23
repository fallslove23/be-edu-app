import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 간단한 Canvas 기반 아이콘 생성 (Node.js 환경에서는 실제 Canvas 없이 SVG -> Canvas 변환)
// 실제 구현에서는 puppeteer나 canvas 라이브러리 사용 권장

const iconSizes = [
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' }
];

// 실제로는 Canvas API를 사용해서 PNG 생성
// 여기서는 간단한 fallback으로 처리

function generateSimpleIcon(size, filename) {
  // 단색 사각형 아이콘 생성 (실제로는 더 복잡한 로직 필요)
  const iconPath = path.join(__dirname, '..', 'public', 'icons', filename);
  
  // SVG를 기반으로 한 간단한 데이터 URI 생성
  const svgContent = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" rx="${Math.round(size * 0.125)}" fill="#3b82f6"/>
      <g fill="white">
        <path d="M${size * 0.22} ${size * 0.125}c-${size * 0.017} 0-${size * 0.031} ${size * 0.014}-${size * 0.031} ${size * 0.031}v${size * 0.688}c0 ${size * 0.017} ${size * 0.014} ${size * 0.031} ${size * 0.031} ${size * 0.031}h${size * 0.563}c${size * 0.017} 0 ${size * 0.031}-${size * 0.014} ${size * 0.031}-${size * 0.031}V${size * 0.156}c0-${size * 0.017}-${size * 0.014}-${size * 0.031}-${size * 0.031}-${size * 0.031}H${size * 0.22}z"/>
        <text x="${size * 0.5}" y="${size * 0.7}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${size * 0.15}" font-weight="bold" fill="white">BS</text>
      </g>
    </svg>
  `.trim();
  
  console.log(`아이콘 생성: ${filename} (${size}x${size})`);
  
  // SVG 파일로 저장 (PNG 변환은 별도 도구 필요)
  fs.writeFileSync(iconPath.replace('.png', '.svg'), svgContent);
  
  return iconPath;
}

// 아이콘 생성
console.log('PWA 아이콘 생성 중...');

iconSizes.forEach(({ size, name }) => {
  try {
    generateSimpleIcon(size, name);
  } catch (error) {
    console.error(`아이콘 생성 실패 ${name}:`, error.message);
  }
});

console.log('아이콘 생성 완료! SVG 파일들이 생성되었습니다.');
console.log('실제 프로덕션에서는 PNG 파일 생성을 위해 추가 도구가 필요합니다.');

// Favicon 생성
const faviconSvg = `
<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" rx="4" fill="#3b82f6"/>
  <text x="16" y="22" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="white">BS</text>
</svg>
`.trim();

fs.writeFileSync(path.join(__dirname, '..', 'public', 'favicon.svg'), faviconSvg);
console.log('Favicon SVG 생성 완료!');