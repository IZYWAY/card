/**
 * Рисует лицевую сторону, оборот бейджа и ленту в обычный 2D-холст,
 * который потом натягивается на 3D-модель как картинка.
 * Раскладка повторяет HTML-карточку из HeroA.astro, чтобы бейдж выглядел одинаково
 * и до загрузки 3D, и после.
 */

export interface BadgeContent {
  role: string;
  first: string;
  last: string;
  makes: string[];
  handle: string;
  site: string;
  scan: string;
  /** Модули QR-кода строкой из 0 и 1, построчно. */
  qr: string;
  qrSize: number;
  band: string;
}

const C = {
  card: '#14132B',
  pearl: '#E9EBEF',
  back: '#F7F8FA',
  backEdge: '#D5D8E0',
  ink: '#14132B',
  inkSoft: '#55566A',
  lilac: '#B9B7E6',
  light: '#E6E5FB',
  foil: ['#6FE3FF', '#FF7AD9', '#FFE27A'],
  accent: '#5B3DF5',
};

const F = {
  display: '"Unbounded Variable", "Arial Black", sans-serif',
  text: '"Onest Variable", system-ui, sans-serif',
  mono: '"Martian Mono Variable", ui-monospace, monospace',
};

/** Ждёт шрифты, иначе холст нарисует текст запасным шрифтом. */
export async function loadFonts(c: BadgeContent) {
  const all = [c.role, c.first, c.last, ...c.makes, c.handle, c.site, c.scan, c.band, 'QR'].join(' ');
  await Promise.race([
    Promise.all([
      document.fonts.load(`700 40px ${F.display}`, all),
      document.fonts.load(`500 40px ${F.mono}`, all),
      document.fonts.load(`400 40px ${F.text}`, all),
    ]),
    new Promise((r) => setTimeout(r, 2500)),
  ]);
}

function canvas(w: number, h: number) {
  const el = document.createElement('canvas');
  el.width = w;
  el.height = h;
  const ctx = el.getContext('2d')!;
  return { el, ctx };
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function spaced(ctx: CanvasRenderingContext2D, px: number, em = 0.08) {
  // letterSpacing есть не во всех браузерах; без него текст просто чуть плотнее.
  (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${(px * em).toFixed(1)}px`;
}

function foilGradient(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  const stops = [...C.foil, ...C.foil];
  stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c));
  return g;
}

/** Ширина и высота холста карточки. Пропорции как у бейджа: 1.6 × 2.25. */
export const CARD_PX = { w: 1024, h: 1440 };

export function drawFront(c: BadgeContent) {
  const { w, h } = CARD_PX;
  const { el, ctx } = canvas(w, h);
  const pad = w * 0.09;
  const cq = (w - pad * 2) / 100;

  ctx.fillStyle = C.card;
  ctx.fillRect(0, 0, w, h);

  // Едва заметный объём и кольца в правом верхнем углу.
  const glow = ctx.createRadialGradient(w * 0.15, h * 0.05, 0, w * 0.15, h * 0.05, w * 1.1);
  glow.addColorStop(0, 'rgba(70, 66, 140, 0.55)');
  glow.addColorStop(1, 'rgba(70, 66, 140, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.055)';
  ctx.lineWidth = 3;
  for (let r = 30; r < w * 1.3; r += 34) {
    ctx.beginPath();
    ctx.arc(w * 0.88, h * 0.08, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Прорезь под зажим.
  const slotW = 22 * cq;
  const slotH = 3.2 * cq;
  const slotY = pad;
  roundRect(ctx, (w - slotW) / 2, slotY, slotW, slotH, slotH / 2);
  ctx.fillStyle = C.pearl;
  ctx.fill();

  // Подпись над именем.
  let y = slotY + slotH + 9 * cq;
  const small = 3.3 * cq;
  ctx.textBaseline = 'top';
  ctx.font = `500 ${small}px ${F.mono}`;
  spaced(ctx, small);
  ctx.fillStyle = C.lilac;
  ctx.fillText(c.role.toUpperCase(), pad, y);

  // Имя фольгой. Уменьшаем, если длинная фамилия не влезает.
  y += small + 4 * cq;
  let size = 12.6 * cq;
  ctx.font = `700 ${size}px ${F.display}`;
  spaced(ctx, size, -0.01);
  const widest = Math.max(ctx.measureText(c.first.toUpperCase()).width, ctx.measureText(c.last.toUpperCase()).width);
  if (widest > w - pad * 2) size *= (w - pad * 2) / widest;
  ctx.font = `700 ${size}px ${F.display}`;
  ctx.fillStyle = foilGradient(ctx, pad, y, w - pad, y + size * 2.4);
  ctx.fillText(c.first.toUpperCase(), pad, y);
  ctx.fillText(c.last.toUpperCase(), pad, y + size * 1.08);

  // Низ: подпись с ником и круглая печать «QR».
  const seal = 14 * cq;
  const footY = h - pad - seal;
  ctx.font = `500 ${small}px ${F.mono}`;
  spaced(ctx, small);
  ctx.fillStyle = C.lilac;
  ctx.textBaseline = 'middle';
  ctx.fillText(c.handle.toUpperCase(), pad, footY + seal / 2);
  const sx = w - pad - seal / 2;
  const sy = footY + seal / 2;
  const cg = ctx.createConicGradient(0.6, sx, sy);
  [...C.foil, C.foil[0]].forEach((col, i) => cg.addColorStop(i / 3, col));
  ctx.beginPath();
  ctx.arc(sx, sy, seal / 2, 0, Math.PI * 2);
  ctx.fillStyle = cg;
  ctx.fill();
  ctx.fillStyle = C.card;
  ctx.font = `700 ${small}px ${F.mono}`;
  ctx.textAlign = 'center';
  ctx.fillText('QR', sx, sy + 1);
  ctx.textAlign = 'left';

  // Четыре направления с тонкими линиями, снизу вверх.
  const row = small + 4.8 * cq;
  let ry = footY - 6 * cq - row * c.makes.length;
  ctx.textBaseline = 'top';
  ctx.font = `500 ${small}px ${F.mono}`;
  spaced(ctx, small);
  for (const item of c.makes) {
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fillRect(pad, ry, w - pad * 2, 2);
    ctx.fillStyle = C.light;
    ctx.fillText(item.toUpperCase(), pad, ry + 2.4 * cq);
    ry += row;
  }

  // Тонкая фольгированная кромка.
  ctx.lineWidth = 7;
  ctx.strokeStyle = foilGradient(ctx, 0, 0, w, h);
  roundRect(ctx, 3.5, 3.5, w - 7, h - 7, 64);
  ctx.stroke();

  return el;
}

export function drawBack(c: BadgeContent) {
  const { w, h } = CARD_PX;
  const { el, ctx } = canvas(w, h);
  const pad = w * 0.09;
  const cq = (w - pad * 2) / 100;

  ctx.fillStyle = C.back;
  ctx.fillRect(0, 0, w, h);
  ctx.lineWidth = 6;
  ctx.strokeStyle = C.backEdge;
  roundRect(ctx, 3, 3, w - 6, h - 6, 64);
  ctx.stroke();

  const slotW = 22 * cq;
  const slotH = 3.2 * cq;
  roundRect(ctx, (w - slotW) / 2, pad, slotW, slotH, slotH / 2);
  ctx.fillStyle = C.pearl;
  ctx.fill();

  // QR-код: каждая клетка — целое число пикселей, чтобы камера читала уверенно.
  const n = c.qrSize;
  const cell = Math.floor((w - pad * 2) / n);
  const qrW = cell * n;
  const qx = Math.round((w - qrW) / 2);
  const qy = Math.round(pad + slotH + 12 * cq);
  ctx.fillStyle = C.ink;
  for (let r = 0; r < n; r++) {
    for (let col = 0; col < n; col++) {
      if (c.qr[r * n + col] === '1') ctx.fillRect(qx + col * cell, qy + r * cell, cell, cell);
    }
  }

  let y = qy + qrW + 7 * cq;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const small = 3.4 * cq;
  ctx.font = `500 ${small}px ${F.mono}`;
  spaced(ctx, small, 0.02);
  ctx.fillStyle = C.ink;
  ctx.fillText(c.site, w / 2, y);

  y += small + 3 * cq;
  const body = 4.2 * cq;
  ctx.font = `400 ${body}px ${F.text}`;
  spaced(ctx, body, 0);
  ctx.fillStyle = C.inkSoft;
  for (const line of wrap(ctx, c.scan, w - pad * 2.4)) {
    ctx.fillText(line, w / 2, y);
    y += body * 1.3;
  }
  return el;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, max: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > max && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  // Выравниваем строки по длине, чтобы не было «висящего» последнего слова.
  if (lines.length === 2) {
    const all = text.split(/\s+/);
    let best = lines;
    let bestDiff = Infinity;
    for (let i = 1; i < all.length; i++) {
      const a = all.slice(0, i).join(' ');
      const b = all.slice(i).join(' ');
      const wa = ctx.measureText(a).width;
      const wb = ctx.measureText(b).width;
      if (wa <= max && wb <= max && Math.abs(wa - wb) < bestDiff) {
        best = [a, b];
        bestDiff = Math.abs(wa - wb);
      }
    }
    return best;
  }
  return lines;
}

/** Лента: фиолетовая, с повторяющейся надписью вдоль. Длинная сторона холста идёт вдоль ленты. */
export function drawBand(c: BadgeContent) {
  const across = 160;
  const along = 1600;
  const { el, ctx } = canvas(across, along);
  ctx.fillStyle = C.accent;
  ctx.fillRect(0, 0, across, along);
  // Тонкие прострочки по краям, как у настоящей ленты.
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(10, 0, 3, along);
  ctx.fillRect(across - 13, 0, 3, along);

  ctx.save();
  ctx.translate(across / 2, 0);
  ctx.rotate(Math.PI / 2);
  const size = 72;
  ctx.font = `700 ${size}px ${F.display}`;
  spaced(ctx, size, 0.04);
  ctx.fillStyle = '#FFFFFF';
  ctx.textBaseline = 'middle';
  const text = `${c.band.toUpperCase()}   `;
  const tw = ctx.measureText(text).width;
  // Текст повторяется так, чтобы рисунок ровно стыковался при повторе текстуры.
  const reps = Math.max(1, Math.round(along / tw));
  const step = along / reps;
  const sx = step / tw;
  for (let i = 0; i < reps; i++) {
    ctx.save();
    ctx.translate(i * step, 0);
    ctx.scale(sx, 1);
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }
  ctx.restore();
  return el;
}

/** Мягкое пятно тени за бейджем. */
export function drawShadow() {
  const s = 256;
  const { el, ctx } = canvas(s, s);
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, 'rgba(20,19,43,0.55)');
  g.addColorStop(0.55, 'rgba(20,19,43,0.22)');
  g.addColorStop(1, 'rgba(20,19,43,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  return el;
}
