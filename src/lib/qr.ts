import QRCode from 'qrcode';

/**
 * Собирает QR-код как SVG во время сборки сайта (в браузере ничего не генерируется).
 * Возвращает размер сетки и одну строку пути со всеми тёмными модулями.
 */
export function qrPath(text: string, quiet = 2) {
  const { modules } = QRCode.create(text, { errorCorrectionLevel: 'M' });
  const n = modules.size;
  let d = '';
  for (let y = 0; y < n; y++) {
    let run = 0;
    for (let x = 0; x <= n; x++) {
      const on = x < n && modules.get(y, x);
      if (on) run++;
      else if (run) {
        d += `M${x - run + quiet} ${y + quiet}h${run}v1h-${run}z`;
        run = 0;
      }
    }
  }
  return { size: n + quiet * 2, d };
}
