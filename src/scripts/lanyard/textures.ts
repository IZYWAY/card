/**
 * Рисунок бейджа в духе бейджа Vercel Ship '24: чёрное лицо с огромными «рассыпанными»
 * буквами, белый оборот с QR, чёрная лента с белой подписью. Вместо логотипа и слова SHIP —
 * инициалы владельца. Всё рисуется в коде; файлов Vercel здесь нет.
 *
 * Шрифт — Geist (OFL), он грузится только вместе с 3D-бейджем.
 */
import geistLatin from '@fontsource-variable/geist/files/geist-latin-wght-normal.woff2?url';
import geistCyrillic from '@fontsource-variable/geist/files/geist-cyrillic-wght-normal.woff2?url';
import monoLatin from '@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2?url';
import monoCyrillic from '@fontsource-variable/geist-mono/files/geist-mono-cyrillic-wght-normal.woff2?url';

export interface BadgeContent {
  role: string;
  first: string;
  last: string;
  handle: string;
  site: string;
  /** Модули QR-кода строкой из 0 и 1, построчно. */
  qr: string;
  qrSize: number;
  /** Короткая метка в рамке рядом с инициалами: «AI» / «ИИ». */
  tag: string;
  /** Заголовок над QR-кодом. */
  qrTitle: string;
}

const SANS = '"Badge Geist", "Helvetica Neue", Arial, sans-serif';
const MONO = '"Badge Geist Mono", ui-monospace, monospace';
const LATIN = 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD';
const CYRILLIC = 'U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116';

/** Ширина и высота холста карточки. Пропорции как у бейджа: 1.6 × 2.25. */
export const CARD_PX = { w: 1024, h: 1440 };

export const initialsOf = (c: BadgeContent) => `${c.first[0] ?? ''}${c.last[0] ?? ''}`.toUpperCase();

/** Подключает Geist и ждёт его, иначе холст нарисует текст запасным шрифтом. */
export async function loadFonts() {
  const faces = [
    new FontFace('Badge Geist', `url(${geistLatin})`, { weight: '100 900', unicodeRange: LATIN }),
    new FontFace('Badge Geist', `url(${geistCyrillic})`, { weight: '100 900', unicodeRange: CYRILLIC }),
    new FontFace('Badge Geist Mono', `url(${monoLatin})`, { weight: '100 900', unicodeRange: LATIN }),
    new FontFace('Badge Geist Mono', `url(${monoCyrillic})`, { weight: '100 900', unicodeRange: CYRILLIC }),
  ];
  await Promise.race([
    Promise.all(
      faces.map((f) =>
        f.load().then(
          (loaded) => document.fonts.add(loaded),
          () => {},
        ),
      ),
    ),
    new Promise((r) => setTimeout(r, 3000)),
  ]);
}

function canvas(w: number, h: number) {
  const el = document.createElement('canvas');
  el.width = w;
  el.height = h;
  return { el, ctx: el.getContext('2d')! };
}

function spacing(ctx: CanvasRenderingContext2D, px: number) {
  // letterSpacing есть не во всех браузерах; без него текст просто чуть плотнее.
  (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${px.toFixed(1)}px`;
}

/** Детерминированный «случайный» генератор: рисунок одинаковый при каждой загрузке. */
function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

/**
 * Подпись-знак: инициалы и короткая метка в скруглённой рамке (как «Vercel Ship [24]»).
 * Возвращает ширину знака.
 */
function wordmark(
  ctx: CanvasRenderingContext2D,
  c: BadgeContent,
  x: number,
  y: number,
  size: number,
  color: string,
  align: 'left' | 'center' = 'left',
) {
  const text = initialsOf(c);
  ctx.font = `600 ${size}px ${SANS}`;
  spacing(ctx, -size * 0.03);
  const tw = ctx.measureText(text).width;
  const gap = size * 0.28;
  const boxH = size * 0.86;
  ctx.font = `600 ${size * 0.5}px ${SANS}`;
  spacing(ctx, 0);
  const tagW = ctx.measureText(c.tag).width;
  const boxW = Math.max(boxH, tagW + size * 0.34);
  const total = tw + gap + boxW;
  const x0 = align === 'center' ? x - total / 2 : x;

  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.font = `600 ${size}px ${SANS}`;
  spacing(ctx, -size * 0.03);
  ctx.fillText(text, x0, y);
  const bx = x0 + tw + gap;
  const by = y - size * 0.74;
  ctx.lineWidth = Math.max(2, size * 0.065);
  ctx.beginPath();
  ctx.roundRect(bx, by, boxW, boxH, size * 0.2);
  ctx.stroke();
  ctx.font = `600 ${size * 0.5}px ${SANS}`;
  spacing(ctx, 0);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(c.tag, bx + boxW / 2, by + boxH / 2 + size * 0.02);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  return total;
}

/**
 * Огромные инициалы с «разломом», как слово SHIP на бейдже Vercel:
 * первая буква растворяется в облаке точек, у второй сдвинуты пара полос и отколот кусочек.
 * Разлом заданный, а не случайный: буквы должны узнаваться.
 */
function brokenLetters(
  ctx: CanvasRenderingContext2D,
  letters: string,
  box: { x: number; y: number; w: number; h: number },
  seed: number,
) {
  const rand = rng(seed);
  const n = Math.max(1, letters.length);
  const slotH = box.h / n;
  // Полосы: [от, до] по высоте буквы (0 — верх, 1 — низ) и сдвиг влево в долях ширины ячейки.
  const cuts: Array<Array<[number, number, number]>> = [
    [[0.64, 0.7, -1]], // у первой буквы тонкая щель
    [
      [0.16, 0.3, 0.09],
      [0.52, 0.58, -1],
      [0.58, 0.7, 0.05],
    ],
  ];

  for (let i = 0; i < n; i++) {
    const { el: tmp, ctx: t } = canvas(Math.ceil(box.w), Math.ceil(slotH));
    // Подбираем кегль по настоящим границам буквы (у «Д» есть ножки ниже строки).
    t.font = `640 100px ${SANS}`;
    const probe = t.measureText(letters[i]);
    const gh = probe.actualBoundingBoxAscent + probe.actualBoundingBoxDescent;
    const gw = probe.actualBoundingBoxLeft + probe.actualBoundingBoxRight;
    const size = Math.min((slotH * 0.9) / gh, (box.w * 0.96) / gw) * 100;
    t.font = `640 ${size}px ${SANS}`;
    const m = t.measureText(letters[i]);
    const glyphW = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
    const glyphH = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
    const gx = tmp.width - glyphW - box.w * 0.02 + m.actualBoundingBoxLeft;
    const gy = (slotH - glyphH) / 2 + m.actualBoundingBoxAscent;
    t.fillStyle = '#fff';
    t.textBaseline = 'alphabetic';
    t.textAlign = 'left';
    t.fillText(letters[i], gx, gy);
    const left = gx - m.actualBoundingBoxLeft;
    const topY = gy - m.actualBoundingBoxAscent;

    let cloud: { x: number; y: number; r: number } | null = null;
    if (i === 0) {
      cloud = { x: left + glyphW * 0.88, y: topY + glyphH * 0.34, r: box.w * 0.13 };
      t.globalCompositeOperation = 'destination-out';
      const g = t.createRadialGradient(cloud.x, cloud.y, 0, cloud.x, cloud.y, cloud.r);
      g.addColorStop(0, 'rgba(0,0,0,1)');
      g.addColorStop(0.7, 'rgba(0,0,0,1)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      t.fillStyle = g;
      t.fillRect(0, 0, tmp.width, tmp.height);
      t.globalCompositeOperation = 'source-over';
    }

    // Собираем букву полосами: целые куски, сдвинутые куски и пропуски.
    const slot = box.y + i * slotH;
    const plan = cuts[i] ?? [];
    let from = 0;
    const draw = (a: number, b: number, dx: number) => {
      const y0 = topY + glyphH * a;
      const hh = glyphH * (b - a);
      if (hh > 0.5) ctx.drawImage(tmp, 0, y0, tmp.width, hh, box.x - dx * box.w, slot + y0, tmp.width, hh);
    };
    for (const [a, b, dx] of plan) {
      draw(from, a, 0);
      if (dx >= 0) draw(a, b, dx);
      from = b;
    }
    draw(from, 1, 0);
    // Всё, что выше и ниже глифа (ничего), не рисуем.

    if (cloud) {
      // Облако точек: гуще в центре, реже к краям, клетки ровные — как растр.
      const cell = Math.max(3, Math.round(box.w * 0.009));
      ctx.fillStyle = '#fff';
      const cx = box.x + cloud.x;
      const cy = slot + cloud.y;
      for (let k = 0; k < 2200; k++) {
        const a = rand() * Math.PI * 2;
        const d = Math.pow(rand(), 0.6) * cloud.r * 1.05;
        const px = Math.round((cx + Math.cos(a) * d) / cell) * cell;
        const py = Math.round((cy + Math.sin(a) * d * 0.85) / cell) * cell;
        const p = 1 - d / (cloud.r * 1.05);
        if (rand() < p * 0.85) ctx.fillRect(px, py, cell * 0.62, cell * 0.62);
      }
    }
  }
}

export function drawFront(c: BadgeContent) {
  const { w, h } = CARD_PX;
  const { el, ctx } = canvas(w, h);
  const pad = w * 0.0625;
  const initials = initialsOf(c);

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);

  // Знак в левом верхнем углу (у Vercel тут логотип).
  ctx.fillStyle = '#fff';
  ctx.font = `700 ${w * 0.052}px ${SANS}`;
  spacing(ctx, -w * 0.002);
  ctx.textBaseline = 'top';
  ctx.fillText(initials, pad, pad);

  // Огромные инициалы столбиком справа.
  brokenLetters(ctx, initials, { x: w * 0.34, y: h * 0.07, w: w * 0.6, h: h * 0.56 }, 0x5eed + initials.charCodeAt(0));
  // Отколовшийся кусочек внизу, как у оригинала.
  ctx.fillStyle = '#fff';
  ctx.fillRect(w * 0.62, h * 0.905, w * 0.085, h * 0.018);

  // Имя и роль внизу слева.
  const nameSize = w * 0.074;
  let y = h * 0.668;
  ctx.font = `600 ${nameSize}px ${SANS}`;
  spacing(ctx, -nameSize * 0.02);
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#fff';
  const maxName = w * 0.62;
  for (const word of [c.first, c.last]) {
    let s = nameSize;
    ctx.font = `600 ${s}px ${SANS}`;
    const mw = ctx.measureText(word).width;
    if (mw > maxName) {
      s *= maxName / mw;
      ctx.font = `600 ${s}px ${SANS}`;
    }
    ctx.fillText(word, pad, y);
    y += nameSize * 1.06;
  }
  const mono = w * 0.027;
  ctx.font = `500 ${mono}px ${MONO}`;
  spacing(ctx, mono * 0.06);
  ctx.fillStyle = '#d6d6d6';
  ctx.fillText(c.role.toUpperCase(), pad, y + mono * 0.7);

  // Подпись-знак внизу.
  wordmark(ctx, c, pad, h * 0.952, w * 0.044, '#fff');
  return el;
}

export function drawBack(c: BadgeContent) {
  const { w, h } = CARD_PX;
  const { el, ctx } = canvas(w, h);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);

  const mono = w * 0.042;
  ctx.font = `600 ${mono}px ${MONO}`;
  spacing(ctx, mono * 0.1);
  ctx.fillStyle = '#000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(c.qrTitle.toUpperCase(), w / 2, h * 0.235);

  // QR-код: каждая клетка — целое число пикселей, чтобы камера читала уверенно.
  const n = c.qrSize;
  const cell = Math.floor((w * 0.68) / n);
  const size = cell * n;
  const qx = Math.round((w - size) / 2);
  const qy = Math.round(h * 0.27);
  for (let r = 0; r < n; r++) {
    for (let col = 0; col < n; col++) {
      if (c.qr[r * n + col] === '1') ctx.fillRect(qx + col * cell, qy + r * cell, cell, cell);
    }
  }

  ctx.font = `600 ${mono * 0.85}px ${MONO}`;
  spacing(ctx, mono * 0.04);
  ctx.fillStyle = '#111';
  ctx.fillText(c.site, w / 2, qy + size + h * 0.055);
  ctx.fillText(c.handle.toUpperCase(), w / 2, qy + size + h * 0.055 + mono * 1.7);
  ctx.textAlign = 'left';

  wordmark(ctx, c, w / 2, h * 0.952, w * 0.044, '#000', 'center');
  return el;
}

/** Лента: чёрная, с белым знаком вдоль. Длинная сторона холста идёт вдоль ленты. */
export const BAND_PX = { across: 200, along: 680 };

export function drawBand(c: BadgeContent) {
  const { across, along } = BAND_PX;
  const { el, ctx } = canvas(across, along);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, across, along);
  ctx.save();
  ctx.translate(across / 2, 0);
  ctx.rotate(Math.PI / 2);
  // Знак в центре плитки; плитка повторяется вдоль ленты.
  const size = across * 0.5;
  wordmark(ctx, c, along / 2, size * 0.33, size, '#fff', 'center');
  ctx.restore();
  return el;
}

/** Мягкое пятно тени за бейджем. */
export function drawShadow() {
  const s = 256;
  const { el, ctx } = canvas(s, s);
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, 'rgba(10,10,20,0.55)');
  g.addColorStop(0.55, 'rgba(10,10,20,0.2)');
  g.addColorStop(1, 'rgba(10,10,20,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  return el;
}
