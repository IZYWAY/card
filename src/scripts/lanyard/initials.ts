/**
 * Огромные инициалы на лице бейджа с «дефектами» — в духе слова SHIP на бейдже Vercel.
 * Несколько стилей; какой из них на бейдже, задаётся в drawFront (textures.ts).
 * Все «случайности» с фиксированным зерном: рисунок одинаковый при каждой загрузке.
 */

export const INITIALS_STYLES = [
  'slices',
  'smear',
  'halftone',
  'pixels',
  'scanlines',
  'shear',
  'misprint',
  'echo',
] as const;
export type InitialsStyle = (typeof INITIALS_STYLES)[number];

type Box = { x: number; y: number; w: number; h: number };
type Glyph = {
  el: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  /** Границы самой буквы внутри холста. */
  left: number;
  top: number;
  gw: number;
  gh: number;
  /** Где холст буквы стоит на карточке. */
  x: number;
  y: number;
};

/** Детерминированный генератор псевдослучайных чисел. */
export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

function canvas(w: number, h: number) {
  const el = document.createElement('canvas');
  el.width = Math.max(1, Math.ceil(w));
  el.height = Math.max(1, Math.ceil(h));
  return { el, ctx: el.getContext('2d')! };
}

/** Рисует букву в отдельный холст размером с её ячейку, прижав к правому краю. */
function glyph(letter: string, box: Box, i: number, n: number, font: string, weight = 640): Glyph {
  const slotH = box.h / n;
  const { el, ctx } = canvas(box.w, slotH);
  ctx.font = `${weight} 100px ${font}`;
  const probe = ctx.measureText(letter);
  const ph = probe.actualBoundingBoxAscent + probe.actualBoundingBoxDescent;
  const pw = probe.actualBoundingBoxLeft + probe.actualBoundingBoxRight;
  const size = Math.min((slotH * 0.9) / ph, (box.w * 0.96) / pw) * 100;
  ctx.font = `${weight} ${size}px ${font}`;
  const m = ctx.measureText(letter);
  const gw = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
  const gh = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
  const gx = el.width - gw - box.w * 0.02 + m.actualBoundingBoxLeft;
  const gy = (slotH - gh) / 2 + m.actualBoundingBoxAscent;
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillText(letter, gx, gy);
  return { el, ctx, left: gx - m.actualBoundingBoxLeft, top: gy - m.actualBoundingBoxAscent, gw, gh, x: box.x, y: box.y + i * slotH };
}

/** Доля закрашенных пикселей в квадрате клетки (0…1). */
function coverage(data: Uint8ClampedArray, width: number, x: number, y: number, cell: number) {
  let sum = 0;
  let count = 0;
  const step = Math.max(1, Math.floor(cell / 4));
  for (let yy = y; yy < y + cell; yy += step) {
    for (let xx = x; xx < x + cell; xx += step) {
      sum += data[(yy * width + xx) * 4 + 3];
      count++;
    }
  }
  return count ? sum / count / 255 : 0;
}

/** Облако точек-растра: гуще в центре, реже к краям. */
function dotCloud(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, cell: number, rand: () => number) {
  ctx.fillStyle = '#fff';
  for (let k = 0; k < 2200; k++) {
    const a = rand() * Math.PI * 2;
    const d = Math.pow(rand(), 0.6) * r * 1.05;
    const px = Math.round((cx + Math.cos(a) * d) / cell) * cell;
    const py = Math.round((cy + Math.sin(a) * d * 0.85) / cell) * cell;
    if (rand() < (1 - d / (r * 1.05)) * 0.85) ctx.fillRect(px, py, cell * 0.62, cell * 0.62);
  }
}

/** Вырезает круглую область из буквы (под облако точек). */
function erase(g: Glyph, cx: number, cy: number, r: number) {
  g.ctx.globalCompositeOperation = 'destination-out';
  const grad = g.ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  grad.addColorStop(0, 'rgba(0,0,0,1)');
  grad.addColorStop(0.7, 'rgba(0,0,0,1)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.ctx.fillStyle = grad;
  g.ctx.fillRect(0, 0, g.el.width, g.el.height);
  g.ctx.globalCompositeOperation = 'source-over';
}

/** Копирует горизонтальную полосу буквы (доли высоты a…b) со сдвигом dx. */
function band(ctx: CanvasRenderingContext2D, g: Glyph, a: number, b: number, dx = 0, dy = 0) {
  const y0 = g.top + g.gh * a;
  const hh = g.gh * (b - a);
  if (hh > 0.5) ctx.drawImage(g.el, 0, y0, g.el.width, hh, g.x + dx, g.y + y0 + dy, g.el.width, hh);
}

/**
 * Раскладка «Сдвига» для одной буквы: вертикальные полосы (доли ширины буквы)
 * и их сдвиг по высоте (доли высоты буквы). Общая для 3D-бейджа и HTML-карточки,
 * чтобы обе версии выглядели одинаково.
 */
export function shearPlan(seed: number, index: number) {
  const rand = rng(seed + index * 101);
  const strips: Array<{ from: number; to: number; dy: number }> = [];
  let from = 0;
  while (from < 1) {
    const to = Math.min(1, from + 0.06 + rand() * 0.12);
    const r = rand();
    // Сдвинута примерно каждая третья полоса и несильно — буква должна читаться.
    const dy = r < 0.66 ? 0 : (rand() < 0.5 ? -1 : 1) * (0.04 + rand() * 0.07);
    strips.push({ from, to, dy });
    from = to;
  }
  return strips;
}

/** Зерно рисунка: от первой буквы инициалов, чтобы ДЕ и DE выглядели по-своему, но всегда одинаково. */
export const initialsSeed = (initials: string) => 0x5eed + initials.charCodeAt(0);

export function drawInitials(
  ctx: CanvasRenderingContext2D,
  letters: string,
  box: Box,
  style: InitialsStyle,
  font: string,
  seed: number,
) {
  const rand = rng(seed);
  const n = Math.max(1, letters.length);
  const glyphs = [...letters].map((l, i) => glyph(l, box, i, n, font));
  const [a, b] = glyphs;
  const cell = Math.max(3, Math.round(box.w * 0.009));

  switch (style) {
    /** Срез: первая буква растворяется в точках, у второй сдвинуты полосы. */
    case 'slices': {
      const cx = a.left + a.gw * 0.88;
      const cy = a.top + a.gh * 0.34;
      const r = box.w * 0.13;
      erase(a, cx, cy, r);
      band(ctx, a, 0, 0.64);
      band(ctx, a, 0.7, 1);
      dotCloud(ctx, a.x + cx, a.y + cy, r, cell, rand);
      if (b) {
        band(ctx, b, 0, 0.16);
        band(ctx, b, 0.16, 0.3, -0.09 * box.w);
        band(ctx, b, 0.3, 0.52);
        band(ctx, b, 0.58, 0.7, -0.05 * box.w);
        band(ctx, b, 0.7, 1);
      }
      break;
    }

    /** Протяжка: правая часть второй буквы «потекла» вбок длинными полосами до края карточки. */
    case 'smear': {
      ctx.drawImage(a.el, a.x, a.y);
      if (b) {
        const cutX = b.left + b.gw * 0.62;
        ctx.drawImage(b.el, 0, 0, cutX, b.el.height, b.x, b.y, cutX, b.el.height);
        const len = box.x + box.w * 1.2 - (b.x + cutX);
        // Растянутый столбец пикселей, нарезанный на полосы разной толщины и длины.
        const { el: st, ctx: sc } = canvas(len, b.el.height);
        sc.drawImage(b.el, cutX, 0, 2, b.el.height, 0, 0, len, b.el.height);
        // Маска из полос рисуется отдельно и накладывается один раз:
        // режим destination-in стирает всё вне каждого отдельного рисунка.
        const { el: mask, ctx: mc } = canvas(len, b.el.height);
        let y = 0;
        while (y < b.el.height) {
          const hh = 2 + rand() * b.gh * 0.035;
          const gap = 1 + rand() * b.gh * 0.02;
          mc.fillRect(0, y, len * (0.35 + rand() * 0.65), hh);
          y += hh + gap;
        }
        sc.globalCompositeOperation = 'destination-in';
        sc.drawImage(mask, 0, 0);
        ctx.drawImage(st, b.x + cutX, b.y);
      }
      break;
    }

    /** Растр: первая буква цельная, вторая рассыпается в точки сверху вниз. */
    case 'halftone': {
      ctx.drawImage(a.el, a.x, a.y);
      if (b) {
        const step = Math.round(box.w * 0.028);
        const data = b.ctx.getImageData(0, 0, b.el.width, b.el.height).data;
        ctx.fillStyle = '#fff';
        for (let y = 0; y + step <= b.el.height; y += step) {
          // Сверху точки крупные (почти сплошная заливка), к низу мельчают.
          const t = Math.min(1, Math.max(0, (y - b.top) / b.gh));
          const scale = 1.05 - t * 0.8;
          for (let x = 0; x + step <= b.el.width; x += step) {
            const cov = coverage(data, b.el.width, x, y, step);
            if (cov < 0.35) continue;
            const r = (step / 2) * scale * Math.sqrt(cov);
            ctx.beginPath();
            ctx.arc(b.x + x + step / 2, b.y + y + step / 2, r, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      break;
    }

    /** Пиксели: буквы собраны из квадратов, правый край осыпается и разлетается. */
    case 'pixels': {
      const step = Math.round(box.w * 0.034);
      ctx.fillStyle = '#fff';
      for (const g of glyphs) {
        const data = g.ctx.getImageData(0, 0, g.el.width, g.el.height).data;
        for (let y = 0; y + step <= g.el.height; y += step) {
          for (let x = 0; x + step <= g.el.width; x += step) {
            if (coverage(data, g.el.width, x, y, step) < 0.5) continue;
            // Чем правее и ниже, тем больше шанс, что квадрат отвалился.
            const u = (x - g.left) / g.gw;
            const v = (y - g.top) / g.gh;
            const risk = Math.max(0, u - 0.55) * 1.6 + (g === b ? Math.max(0, v - 0.6) * 0.8 : 0);
            const r = rand();
            if (r < risk * 0.45) continue;
            let dx = 0;
            let dy = 0;
            if (r < risk * 0.9) {
              dx = step * Math.round(1 + rand() * 4);
              dy = -step * Math.round(rand() * 2);
            }
            ctx.fillRect(g.x + x + dx, g.y + y + dy, step - 2, step - 2);
          }
        }
      }
      break;
    }

    /** Строки: буквы нарезаны горизонтальными линиями, к верху линии тоньше. */
    case 'scanlines': {
      const pitch = Math.round(box.w * 0.032);
      for (const g of glyphs) {
        for (let y = g.top; y < g.top + g.gh; y += pitch) {
          const t = (y - g.top) / g.gh;
          const thick = Math.max(2, pitch * (0.18 + t * 0.82));
          ctx.drawImage(g.el, 0, y, g.el.width, thick, g.x, g.y + y, g.el.width, thick);
        }
      }
      break;
    }

    /** Сдвиг: буквы нарезаны вертикальными полосами, часть полос съехала вверх-вниз. */
    case 'shear': {
      glyphs.forEach((g, i) => {
        for (const { from, to, dy } of shearPlan(seed, i)) {
          const x = g.left + g.gw * from;
          const w = g.gw * (to - from);
          ctx.drawImage(g.el, x, 0, w, g.el.height, g.x + x, g.y + dy * g.gh, w, g.el.height);
        }
      });
      break;
    }

    /** Брак печати: контур буквы съехал относительно заливки, заливка с прорезями. */
    case 'misprint': {
      const fontPx = (g: Glyph) => g.gh; // для толщины контура
      for (const g of glyphs) {
        // Контур: буква минус её «сжатая» копия (пересечение сдвинутых копий).
        const k = Math.max(4, fontPx(g) * 0.02);
        const { el: inner, ctx: ic } = canvas(g.el.width, g.el.height);
        ic.drawImage(g.el, 0, 0);
        ic.globalCompositeOperation = 'destination-in';
        for (const [ox, oy] of [[k, 0], [-k, 0], [0, k], [0, -k], [k * 0.7, k * 0.7], [-k * 0.7, -k * 0.7], [k * 0.7, -k * 0.7], [-k * 0.7, k * 0.7]]) ic.drawImage(g.el, ox, oy);
        const { el: o, ctx: oc } = canvas(g.el.width, g.el.height);
        oc.drawImage(g.el, 0, 0);
        oc.globalCompositeOperation = 'destination-out';
        oc.drawImage(inner, 0, 0);
        oc.globalCompositeOperation = 'source-over';
        // Заливка с горизонтальными прорезями.
        const cuts = g === a ? [0.42, 0.47] : [0.2, 0.24, 0.66, 0.73];
        let from = 0;
        for (let c = 0; c < cuts.length; c += 2) {
          band(ctx, g, from, cuts[c]);
          from = cuts[c + 1];
        }
        band(ctx, g, from, 1);
        // Контур смещён вправо-вниз.
        ctx.drawImage(o, g.x + box.w * 0.045, g.y + box.w * 0.03);
      }
      break;
    }

    /** Эхо: за буквами тянется след из полупрозрачных копий. */
    case 'echo': {
      for (const g of glyphs) {
        const copies = 6;
        for (let c = copies; c >= 1; c--) {
          ctx.globalAlpha = 0.08 + (1 - c / copies) * 0.28;
          ctx.drawImage(g.el, g.x - c * box.w * 0.035, g.y - c * box.w * 0.012);
        }
        ctx.globalAlpha = 1;
        ctx.drawImage(g.el, g.x, g.y);
      }
      break;
    }
  }
}
