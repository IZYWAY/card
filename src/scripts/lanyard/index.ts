/**
 * 3D-бейдж на ленте. Тот же приём, что у бейджа Vercel Ship '24:
 * лента из трёх звеньев и карточка на шарнире, физика — Rapier, отрисовка — three.js.
 * Модель, лента и надписи свои; ничего из файлов Vercel не используется.
 *
 * Загружается после того, как страница уже показана (см. HeroA.astro),
 * поэтому на первую загрузку не влияет.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import RAPIER from '@dimforge/rapier3d';
import { BAND_PX, type BadgeContent, drawBack, drawBand, drawFront, drawShadow, loadFonts } from './textures';

// Размеры в условных единицах сцены. Пропорции бейджа — как у пластиковой карты.
const CARD_W = 1.6;
const CARD_H = 2.25;
const CARD_D = 0.022;
const RADIUS = 0.1;
/** Точка крепления ленты над верхним краем карточки (кольцо карабина). */
const ANCHOR_Y = 1.45;
/** Длина одного звена ленты; звеньев три. */
const LINK = 1;
const BAND_W = 0.34;
const FOV = 25;

export interface LanyardOptions {
  /** Элемент, в который вставляется холст. */
  host: HTMLElement;
  /** Место, где в покое должна висеть карточка (её HTML-версия). */
  target: HTMLElement;
  content: BadgeContent;
  /** Сейчас показан оборот с QR? */
  isFlipped: () => boolean;
  /** Нажатие на бейдж (без перетаскивания). */
  onTap: () => void;
  onReady: () => void;
}

export async function mountLanyard(o: LanyardOptions) {
  await loadFonts();

  /* ---------- Отрисовка ---------- */
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-hidden', 'true');
  o.host.appendChild(canvas);

  const scene = new THREE.Scene();
  // Освещение как у бейджа Vercel: чёрная «студия» с полосами света.
  // Они дают на глянцевой карточке узкие блики, бегущие при раскачивании.
  const studio = new THREE.Scene();
  studio.background = new THREE.Color(0x000000);
  const strip = (intensity: number, pos: number[], rot: number[], scale: number[]) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 1, 1).multiplyScalar(intensity), side: THREE.DoubleSide }),
    );
    m.position.fromArray(pos);
    m.rotation.set(rot[0], rot[1], rot[2]);
    m.scale.fromArray(scale);
    m.lookAt(0, 0, 0);
    m.rotateZ(rot[2]);
    studio.add(m);
  };
  strip(2, [0, -1, 5], [0, 0, Math.PI / 3], [100, 0.1, 1]);
  strip(3, [-1, -1, 1], [0, 0, Math.PI / 3], [100, 0.1, 1]);
  strip(3, [1, 1, 1], [0, 0, Math.PI / 3], [100, 0.1, 1]);
  strip(10, [-10, 0, 14], [0, Math.PI / 2, Math.PI / 3], [100, 10, 1]);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(studio, 0.02).texture;
  scene.add(new THREE.AmbientLight(0xffffff, Math.PI));

  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 200);

  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const texture = (img: HTMLCanvasElement, srgb = true) => {
    const t = new THREE.CanvasTexture(img);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = maxAniso;
    return t;
  };

  /* ---------- Карточка ---------- */
  const card = new THREE.Group();
  scene.add(card);

  const shape = new THREE.Shape();
  {
    const x = -CARD_W / 2;
    const y = -CARD_H / 2;
    shape.moveTo(x + RADIUS, y);
    shape.lineTo(x + CARD_W - RADIUS, y);
    shape.quadraticCurveTo(x + CARD_W, y, x + CARD_W, y + RADIUS);
    shape.lineTo(x + CARD_W, y + CARD_H - RADIUS);
    shape.quadraticCurveTo(x + CARD_W, y + CARD_H, x + CARD_W - RADIUS, y + CARD_H);
    shape.lineTo(x + RADIUS, y + CARD_H);
    shape.quadraticCurveTo(x, y + CARD_H, x, y + CARD_H - RADIUS);
    shape.lineTo(x, y + RADIUS);
    shape.quadraticCurveTo(x, y, x + RADIUS, y);
  }
  const faceGeo = () => {
    const g = new THREE.ShapeGeometry(shape, 12);
    const pos = g.attributes.position;
    const uv = g.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      const u = (pos.getX(i) + CARD_W / 2) / CARD_W;
      uv.setXY(i, u, (pos.getY(i) + CARD_H / 2) / CARD_H);
    }
    return g;
  };

  // Лицо: глянцевый лак поверх чёрного, как у бейджа Vercel.
  const frontMat = new THREE.MeshPhysicalMaterial({
    map: texture(drawFront(o.content)),
    clearcoat: 1,
    clearcoatRoughness: 0.15,
    roughness: 0.3,
    metalness: 0.5,
  });
  // Оборот белый и матовый, как бумага: блики высветляют чёрные клетки QR, и камера его не читает.
  const backMat = new THREE.MeshStandardMaterial({
    map: texture(drawBack(o.content)),
    roughness: 0.9,
    metalness: 0,
    envMapIntensity: 0.25,
    emissive: 0xffffff,
    emissiveIntensity: 0.3,
  });
  backMat.emissiveMap = backMat.map;

  const front = new THREE.Mesh(faceGeo(), frontMat);
  front.position.z = CARD_D / 2 + 0.0005;
  // Оборот развёрнут на 180°: когда карточка повернётся, он окажется к зрителю и не зеркальным.
  const back = new THREE.Mesh(faceGeo(), backMat);
  back.rotation.y = Math.PI;
  back.position.z = -CARD_D / 2 - 0.0005;
  const edge = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, { depth: CARD_D, bevelEnabled: false, curveSegments: 12 }),
    [
      new THREE.MeshBasicMaterial({ visible: false }),
      new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4, metalness: 0.4 }),
    ],
  );
  edge.position.z = -CARD_D / 2;
  card.add(front, back, edge);

  // Карабин из тёмного металла: узкий зажим на верхнем краю и петля, в которую продета лента.
  const metal = new THREE.MeshStandardMaterial({ color: 0x353535, metalness: 1, roughness: 0.3 });
  const clamp = new THREE.Mesh(new RoundedBoxGeometry(0.085, 0.38, 0.12, 3, 0.03), metal);
  clamp.position.set(0, CARD_H / 2 + 0.02, 0);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.024, 16, 48), metal);
  ring.scale.set(1.25, 1, 1);
  ring.position.set(0, ANCHOR_Y - 0.01, 0);
  card.add(clamp, ring);

  const pickables = [front, back, edge, clamp];

  // Тень на «стене» за бейджем.
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(CARD_W * 1.45, CARD_H * 1.3),
    new THREE.MeshBasicMaterial({ map: texture(drawShadow(), false), transparent: true, depthWrite: false, opacity: 0.3 }),
  );
  shadow.renderOrder = -1;
  scene.add(shadow);

  /* ---------- Лента ---------- */
  const bandTex = texture(drawBand(o.content));
  bandTex.wrapT = THREE.RepeatWrapping;
  const SEG = 64;
  const bandGeo = new THREE.BufferGeometry();
  const bandPos = new Float32Array((SEG + 1) * 2 * 3);
  const bandUv = new Float32Array((SEG + 1) * 2 * 2);
  const bandIdx: number[] = [];
  for (let i = 0; i < SEG; i++) {
    const a = i * 2;
    bandIdx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  bandGeo.setIndex(bandIdx);
  bandGeo.setAttribute('position', new THREE.BufferAttribute(bandPos, 3));
  bandGeo.setAttribute('uv', new THREE.BufferAttribute(bandUv, 2));
  const band = new THREE.Mesh(
    bandGeo,
    new THREE.MeshStandardMaterial({ map: bandTex, roughness: 0.75, side: THREE.DoubleSide }),
  );
  band.frustumCulled = false;
  scene.add(band);

  /* ---------- Физика ---------- */
  const world = new RAPIER.World({ x: 0, y: -40, z: 0 });
  const NO_COLLISIONS = 0x0001_0000; // состоит в группе 1, ни с кем не сталкивается
  const segment = () =>
    RAPIER.RigidBodyDesc.dynamic().setLinearDamping(2).setAngularDamping(2).setCanSleep(true);

  const fixed = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
  const links = [0, 1, 2].map(() => {
    const b = world.createRigidBody(segment());
    world.createCollider(RAPIER.ColliderDesc.ball(0.1).setCollisionGroups(NO_COLLISIONS), b);
    return b;
  });
  const body = world.createRigidBody(segment());
  world.createCollider(
    RAPIER.ColliderDesc.cuboid(CARD_W / 2, CARD_H / 2, 0.01).setCollisionGroups(NO_COLLISIONS),
    body,
  );
  const zero = { x: 0, y: 0, z: 0 };
  world.createImpulseJoint(RAPIER.JointData.rope(LINK, zero, zero), fixed, links[0], true);
  world.createImpulseJoint(RAPIER.JointData.rope(LINK, zero, zero), links[0], links[1], true);
  world.createImpulseJoint(RAPIER.JointData.rope(LINK, zero, zero), links[1], links[2], true);
  world.createImpulseJoint(RAPIER.JointData.spherical(zero, { x: 0, y: ANCHOR_Y, z: 0 }), links[2], body, true);

  /* ---------- Раскладка: бейдж висит там, где была HTML-карточка ---------- */
  let width = 1;
  let height = 1;
  let unitsPerPx = 0.01;
  const anchor = new THREE.Vector3();
  let placed = false;

  const layout = () => {
    const box = o.host.getBoundingClientRect();
    const t = o.target.getBoundingClientRect();
    width = Math.max(1, box.width);
    height = Math.max(1, box.height);
    const dpr = Math.min(window.devicePixelRatio || 1, width > 1000 ? 1.6 : 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // Камера отодвигается так, чтобы карточка была того же размера, что HTML-версия.
    const cardPx = Math.max(120, t.height || height * 0.5);
    const visibleH = (CARD_H * height) / cardPx;
    const dist = visibleH / 2 / Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    camera.aspect = width / height;
    camera.position.set(0, 0, dist);
    camera.updateProjectionMatrix();
    unitsPerPx = visibleH / height;

    // Точка подвеса — над центром HTML-карточки, на длину ленты выше.
    const cx = (t.left + t.width / 2 - box.left - width / 2) * unitsPerPx;
    const cy = -(t.top + t.height / 2 - box.top - height / 2) * unitsPerPx;
    // Небольшой запас: лента под весом чуть провисает.
    anchor.set(cx, cy + ANCHOR_Y + LINK * 3 + 0.05, 0);
    fixed.setTranslation(anchor, true);

    if (!placed) {
      // Старт: лента вытянута вбок — бейдж падает и раскачивается, как у Vercel.
      // Старт: бейдж отведён в сторону и сразу на экране — он качнётся и успокоится.
      // На узком экране угол меньше, чтобы бейдж не улетал за край.
      placed = true;
      const angle = THREE.MathUtils.degToRad(width < 600 ? 16 : 28);
      const dx = Math.sin(angle);
      const dy = -Math.cos(angle);
      links.forEach((b, i) => b.setTranslation({ x: anchor.x + dx * LINK * (i + 1), y: anchor.y + dy * LINK * (i + 1), z: 0 }, true));
      const reach = LINK * 3 + ANCHOR_Y;
      body.setTranslation({ x: anchor.x + dx * reach, y: anchor.y + dy * reach, z: 0 }, true);
      body.setRotation(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), angle), true);
      lerped.forEach((v, i) => v.copy(links[i].translation() as THREE.Vector3Like));
    }
    links.forEach((b) => b.wakeUp());
    body.wakeUp();
    dirty = true;
  };

  /* ---------- Перетаскивание и нажатие ---------- */
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const hit = new THREE.Vector3();
  const grabOffset = new THREE.Vector3();
  let dragging = false;
  let pointerId = -1;
  let downAt = { x: 0, y: 0, t: 0 };
  let moved = false;
  let hovering = false;

  const toNdc = (e: PointerEvent | Touch) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  };
  const hitsCard = (e: PointerEvent | Touch) => {
    toNdc(e);
    raycaster.setFromCamera(ndc, camera);
    return raycaster.intersectObjects(pickables, false).length > 0;
  };
  const pointOnPlane = (e: PointerEvent) => {
    toNdc(e);
    raycaster.setFromCamera(ndc, camera);
    plane.constant = -(body.translation().z || 0);
    return raycaster.ray.intersectPlane(plane, hit);
  };

  // Холст не ловит нажатия сам (чтобы не мешать кнопкам и прокрутке),
  // поэтому слушаем документ и проверяем, попали ли в бейдж.
  const onDown = (e: PointerEvent) => {
    if (dragging || e.button > 0 || !hitsCard(e)) return;
    const p = pointOnPlane(e);
    if (!p) return;
    e.preventDefault();
    dragging = true;
    pointerId = e.pointerId;
    moved = false;
    downAt = { x: e.clientX, y: e.clientY, t: performance.now() };
    const tr = body.translation();
    grabOffset.set(p.x - tr.x, p.y - tr.y, 0);
    [fixed, ...links, body].forEach((b) => b.wakeUp());
    body.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased, true);
    document.documentElement.classList.add('is-grabbing');
    dirty = true;
  };
  const onMove = (e: PointerEvent) => {
    if (dragging && e.pointerId === pointerId) {
      if (Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 6) moved = true;
      const p = pointOnPlane(e);
      if (p) body.setNextKinematicTranslation({ x: p.x - grabOffset.x, y: p.y - grabOffset.y, z: 0 });
      e.preventDefault();
      return;
    }
    if (e.pointerType === 'mouse') {
      const over = hitsCard(e);
      if (over !== hovering) {
        hovering = over;
        document.documentElement.classList.toggle('is-over-badge', over);
      }
    }
  };
  const onUp = (e: PointerEvent) => {
    if (!dragging || e.pointerId !== pointerId) return;
    dragging = false;
    body.setBodyType(RAPIER.RigidBodyType.Dynamic, true);
    document.documentElement.classList.remove('is-grabbing');
    if (!moved && performance.now() - downAt.t < 450) o.onTap();
  };
  // На телефоне не даём странице прокручиваться, если палец лёг на бейдж.
  const onTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 1 && hitsCard(e.touches[0])) e.preventDefault();
  };
  document.addEventListener('pointerdown', onDown, { passive: false });
  document.addEventListener('pointermove', onMove, { passive: false });
  document.addEventListener('pointerup', onUp);
  document.addEventListener('pointercancel', onUp);
  document.addEventListener('touchstart', onTouchStart, { passive: false });

  /* ---------- Кадр ---------- */
  const lerped = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  const curve = new THREE.CatmullRomCurve3(
    [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()],
    false,
    'chordal',
  );
  const tangent = new THREE.Vector3();
  const side = new THREE.Vector3();
  const view = new THREE.Vector3(0, 0, 1);
  const q = new THREE.Quaternion();
  const euler = new THREE.Euler();
  let dirty = true;
  let visible = true;
  let last = performance.now();
  let acc = 0;
  const STEP = 1 / 60;

  const updateBand = () => {
    // Сглаживаем верхние звенья: так лента не дрожит при резких рывках.
    for (let i = 0; i < 2; i++) {
      const cur = links[i].translation();
      const d = lerped[i].distanceTo(cur as THREE.Vector3Like);
      const speed = 10 + Math.min(1, Math.max(0.1, d)) * 40;
      lerped[i].lerp(cur as THREE.Vector3Like, Math.min(1, STEP * speed));
    }
    // Лента уходит вверх за край экрана — «на шею».
    const top = camera.position.z * Math.tan(THREE.MathUtils.degToRad(FOV / 2)) + 1;
    curve.points[0].set(anchor.x, Math.max(anchor.y + 1, top + 0.5), 0);
    curve.points[1].copy(anchor);
    curve.points[2].copy(lerped[0]);
    curve.points[3].copy(lerped[1]);
    curve.points[4].copy(links[2].translation() as THREE.Vector3Like);
    const spaced = curve.getSpacedPoints(SEG);
    const length = curve.getLength();
    for (let i = 0; i <= SEG; i++) {
      const p = spaced[i];
      curve.getTangentAt(i / SEG, tangent);
      side.crossVectors(tangent, view);
      if (side.lengthSq() < 1e-6) side.set(1, 0, 0);
      side.normalize().multiplyScalar(BAND_W / 2);
      bandPos.set([p.x - side.x, p.y - side.y, p.z - side.z, p.x + side.x, p.y + side.y, p.z + side.z], i * 6);
      // Текстура повторяется вдоль ленты, отсчёт снизу, от карточки.
      const v = ((1 - i / SEG) * length) / (BAND_W * (BAND_PX.along / BAND_PX.across));
      bandUv.set([1, v, 0, v], i * 4);
    }
    bandGeo.attributes.position.needsUpdate = true;
    bandGeo.attributes.uv.needsUpdate = true;
  };

  const steer = () => {
    // Карточка сама разворачивается к зрителю лицом, а после нажатия — оборотом.
    const r = body.rotation();
    q.set(r.x, r.y, r.z, r.w);
    euler.setFromQuaternion(q, 'YXZ');
    const flipped = o.isFlipped();
    const target = flipped ? Math.PI : 0;
    const err = Math.atan2(Math.sin(target - euler.y), Math.cos(target - euler.y));
    const w = body.angvel();
    if (Math.abs(err) > 0.01 || Math.abs(w.y) > 0.01) {
      // Поворот к цели с демпфированием, близким к критическому: быстро и почти без перелёта.
      // Оборотом бейдж показывают под камеру, поэтому там он ещё и меньше качается.
      const calm = flipped ? 0.96 : 1;
      body.setAngvel({ x: w.x * calm, y: w.y + err * 0.3 - w.y * 0.12, z: w.z * calm }, true);
      if (flipped) {
        const v = body.linvel();
        body.setLinvel({ x: v.x * 0.97, y: v.y, z: v.z * 0.97 }, true);
      }
    }
  };

  const frame = (now: number) => {
    raf = 0;
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    const asleep = body.isSleeping() && links.every((b) => b.isSleeping()) && !dragging;
    if (!asleep || dirty) {
      acc += dt;
      let steps = 0;
      while (acc >= STEP && steps < 4) {
        if (!dragging) steer();
        world.step();
        acc -= STEP;
        steps++;
      }
      if (steps === 4) acc = 0;

      const t = body.translation();
      const r = body.rotation();
      card.position.set(t.x, t.y, t.z);
      card.quaternion.set(r.x, r.y, r.z, r.w);
      shadow.position.set(t.x + 0.18, t.y - 0.32, t.z - 0.9);
      shadow.quaternion.identity();
      updateBand();
      renderer.render(scene, camera);
      dirty = false;
    } else {
      acc = 0;
    }
    schedule();
  };
  let raf = 0;
  const schedule = () => {
    if (!raf && visible && !document.hidden) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  };

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    schedule();
  }).observe(o.host);
  document.addEventListener('visibilitychange', schedule);
  new ResizeObserver(() => {
    layout();
    schedule();
  }).observe(o.host);

  /** Вызывается при перевороте: будит физику, чтобы карточка развернулась. */
  const wake = () => {
    body.wakeUp();
    dirty = true;
    schedule();
  };

  layout();
  updateBand();
  renderer.render(scene, camera);
  o.onReady();
  schedule();

  return { wake };
}
