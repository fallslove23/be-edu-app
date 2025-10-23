// PNG 아이콘 생성 스크립트
// 실제 환경에서는 sharp 등의 라이브러리를 사용하거나 디자인 도구를 활용

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// SVG를 Base64로 변환하여 Canvas에서 PNG로 렌더링하는 함수
function generatePNGIcon(size) {
  const svgContent = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" rx="${size * 0.125}" fill="#3b82f6"/>
      <g fill="white">
        <rect x="${size * 0.22}" y="${size * 0.125}" width="${size * 0.565}" height="${size * 0.75}" rx="${size * 0.03}" fill="white"/>
        <text x="${size * 0.5}" y="${size * 0.7}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${size * 0.15}" font-weight="bold" fill="#3b82f6">BS</text>
      </g>
    </svg>
  `;
  
  return svgContent;
}

// 브라우저 환경에서 실행되는 함수
function createPNGFromSVG(svgString, size, filename) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = size;
  canvas.height = size;
  
  const img = new Image();
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  
  img.onload = function() {
    ctx.drawImage(img, 0, 0, size, size);
    
    canvas.toBlob(function(blob) {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  };
  
  img.src = url;
}

// 콘솔에서 실행할 수 있는 함수들을 전역에 노출
if (typeof window !== 'undefined') {
  window.generateIcons = function() {
    sizes.forEach(size => {
      const svgContent = generatePNGIcon(size);
      createPNGFromSVG(svgContent, size, `icon-${size}x${size}.png`);
    });
  };
  
  console.log('아이콘 생성 함수가 준비되었습니다. window.generateIcons()를 실행하세요.');
}

export { generatePNGIcon, createPNGFromSVG };