/**
 * Общий источник движения для обоих вариантов.
 * Отдаёт два числа от −1 до 1 (влево/вправо и вверх/вниз), которые берутся:
 *   1) из гироскопа телефона, если он доступен и разрешён;
 *   2) из курсора или пальца;
 *   3) если человек ничего не трогает — из медленного покачивания «само по себе».
 * При включённой в системе настройке «уменьшить движение» всё стоит на месте.
 */

type Render = (x: number, y: number, time: number) => void;
type Idle = (seconds: number) => [number, number];

type OrientationCtor = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>;
};

const clamp = (v: number) => Math.max(-1, Math.min(1, v));

export function startMotion(el: HTMLElement, render: Render, idle: Idle) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches) {
    render(0, 0, 0);
    return { needsPermission: false, requestGyro: async () => false, whenGyroStarts() {} };
  }

  let targetX = 0;
  let targetY = 0;
  let x = 0;
  let y = 0;
  let lastInput = -1e9;
  let visible = true;
  let frame = 0;

  // Курсор и палец: положение относительно центра элемента.
  window.addEventListener(
    'pointermove',
    (e) => {
      const r = el.getBoundingClientRect();
      const halfW = Math.max(r.width / 2, window.innerWidth * 0.3);
      const halfH = Math.max(r.height / 2, window.innerHeight * 0.3);
      targetX = clamp((e.clientX - (r.left + r.width / 2)) / halfW);
      targetY = clamp((e.clientY - (r.top + r.height / 2)) / halfH);
      lastInput = performance.now();
    },
    { passive: true },
  );

  // Гироскоп: считаем наклон от того положения, в котором телефон держат сейчас.
  let baseBeta: number | null = null;
  let baseGamma = 0;
  const onOrientation = (e: DeviceOrientationEvent) => {
    if (e.beta == null || e.gamma == null) return;
    if (baseBeta == null) {
      baseBeta = e.beta;
      baseGamma = e.gamma;
    }
    // «Ноль» понемногу подтягивается к текущему положению руки.
    baseBeta += (e.beta - baseBeta) * 0.004;
    baseGamma += (e.gamma - baseGamma) * 0.004;
    targetX = clamp((e.gamma - baseGamma) / 22);
    targetY = clamp((e.beta - baseBeta) / 22);
    lastInput = performance.now();
  };

  const Orientation = window.DeviceOrientationEvent as OrientationCtor | undefined;
  const canAsk = typeof Orientation?.requestPermission === 'function';
  const isPhone = window.matchMedia('(pointer: coarse)').matches;
  let gyroWorks = false;
  let onGyroStart = () => {};
  if (Orientation) {
    window.addEventListener('deviceorientation', onOrientation, { passive: true });
    window.addEventListener(
      'deviceorientation',
      (e) => {
        if (e.beta == null) return;
        gyroWorks = true;
        onGyroStart();
      },
      { passive: true, once: true },
    );
  }

  /**
   * На iPhone гироскоп включается только после нажатия и согласия человека.
   * Пока согласия нет, события просто не приходят и работает покачивание.
   */
  const requestGyro = async () => {
    if (!canAsk) return gyroWorks;
    try {
      return (await Orientation!.requestPermission!()) === 'granted';
    } catch {
      return false; // отказ: остаётся покачивание
    }
  };

  const tick = (now: number) => {
    frame = 0;
    const live = now - lastInput < 2200;
    const [ix, iy] = live ? [targetX, targetY] : idle(now / 1000);
    const k = live ? 0.14 : 0.05;
    x += (ix - x) * k;
    y += (iy - y) * k;
    render(x, y, now / 1000);
    schedule();
  };
  const schedule = () => {
    if (!frame && visible && !document.hidden) frame = requestAnimationFrame(tick);
  };

  // Не тратим батарею, когда элемент не на экране или вкладка свёрнута.
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    schedule();
  }).observe(el);
  document.addEventListener('visibilitychange', schedule);
  schedule();

  return {
    /** Нужно ли показать кнопку «Включить наклон» (телефон, который спрашивает разрешение). */
    needsPermission: canAsk && isPhone,
    requestGyro,
    /** Сообщает, что гироскоп заработал и кнопка больше не нужна. */
    whenGyroStarts(fn: () => void) {
      onGyroStart = fn;
      if (gyroWorks) fn();
    },
  };
}

/**
 * Кнопка «Включить наклон». Показывается только на телефонах, которые спрашивают
 * разрешение на гироскоп (iPhone), и только если гироскоп не заработал сам.
 */
export function bindGyroButton(button: HTMLButtonElement, motion: ReturnType<typeof startMotion>) {
  if (!motion.needsPermission) return;
  let working = false;
  motion.whenGyroStarts(() => {
    working = true;
    button.hidden = true;
  });
  setTimeout(() => {
    if (!working) button.hidden = false;
  }, 700);
  button.addEventListener('click', async () => {
    await motion.requestGyro();
    button.hidden = true;
  });
}
