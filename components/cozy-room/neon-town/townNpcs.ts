import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function mergeParts(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const normalized = parts.map((p) => {
    const g = p.index ? p.toNonIndexed() : p.clone();
    if (g.hasAttribute("uv")) g.deleteAttribute("uv");
    if (!g.hasAttribute("normal")) g.computeVertexNormals();
    p.dispose();
    return g;
  });
  const merged = mergeGeometries(normalized, false) ?? new THREE.BufferGeometry();
  for (const g of normalized) g.dispose();
  return merged;
}

function createPersonGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const skirt = new THREE.CylinderGeometry(0.22, 0.34, 0.92, 6);
  skirt.translate(0, 0.46, 0);
  parts.push(skirt);
  const torso = new THREE.CylinderGeometry(0.28, 0.22, 0.62, 6);
  torso.translate(0, 1.18, 0);
  parts.push(torso);
  const head = new THREE.IcosahedronGeometry(0.21, 0);
  head.translate(0, 1.66, 0);
  parts.push(head);
  const hat = new THREE.ConeGeometry(0.32, 0.24, 6);
  hat.translate(0, 1.88, 0);
  parts.push(hat);
  return mergeParts(parts);
}

function createSheepGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const body = new THREE.BoxGeometry(0.68, 0.56, 1.02);
  body.translate(0, 0.62, 0);
  parts.push(body);
  const head = new THREE.BoxGeometry(0.34, 0.34, 0.42);
  head.translate(0, 0.72, 0.62);
  parts.push(head);
  for (const lx of [-0.2, 0.2]) {
    for (const lz of [-0.32, 0.32]) {
      const leg = new THREE.BoxGeometry(0.11, 0.42, 0.11);
      leg.translate(lx, 0.21, lz);
      parts.push(leg);
    }
  }
  return mergeParts(parts);
}

function createCowGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const body = new THREE.BoxGeometry(0.95, 0.88, 1.95);
  body.translate(0, 1.05, 0);
  parts.push(body);
  const head = new THREE.BoxGeometry(0.54, 0.52, 0.66);
  head.translate(0, 1.24, 1.18);
  parts.push(head);
  const horn = new THREE.BoxGeometry(0.88, 0.1, 0.1);
  horn.translate(0, 1.5, 1.15);
  parts.push(horn);
  for (const lx of [-0.32, 0.32]) {
    for (const lz of [-0.68, 0.68]) {
      const leg = new THREE.BoxGeometry(0.16, 0.72, 0.16);
      leg.translate(lx, 0.36, lz);
      parts.push(leg);
    }
  }
  return mergeParts(parts);
}

function createHorseGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const body = new THREE.BoxGeometry(0.76, 0.76, 1.85);
  body.translate(0, 1.28, 0);
  parts.push(body);
  const neck = new THREE.BoxGeometry(0.38, 0.82, 0.44);
  neck.rotateX(0.32);
  neck.translate(0, 1.72, 0.92);
  parts.push(neck);
  const head = new THREE.BoxGeometry(0.34, 0.34, 0.68);
  head.translate(0, 2.02, 1.26);
  parts.push(head);
  const tail = new THREE.BoxGeometry(0.14, 0.72, 0.16);
  tail.rotateX(-0.22);
  tail.translate(0, 1.02, -0.98);
  parts.push(tail);
  for (const lx of [-0.25, 0.25]) {
    for (const lz of [-0.66, 0.66]) {
      const leg = new THREE.BoxGeometry(0.14, 0.96, 0.14);
      leg.translate(lx, 0.48, lz);
      parts.push(leg);
    }
  }
  return mergeParts(parts);
}

function createCartGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const bed = new THREE.BoxGeometry(2.3, 0.95, 4.4);
  bed.translate(0, 1.15, -0.8);
  parts.push(bed);
  const canopy = new THREE.CylinderGeometry(1.12, 1.12, 4.1, 8);
  canopy.rotateX(Math.PI * 0.5);
  canopy.translate(0, 2.05, -0.8);
  parts.push(canopy);
  for (const wx of [-1.25, 1.25]) {
    for (const wz of [-2.1, 0.5]) {
      const wheel = new THREE.CylinderGeometry(0.65, 0.65, 0.18, 8);
      wheel.rotateZ(Math.PI * 0.5);
      wheel.translate(wx, 0.65, wz);
      parts.push(wheel);
    }
  }
  const horse = createHorseGeometry();
  horse.translate(0, 0, 2.75);
  parts.push(horse);
  return mergeParts(parts);
}

export type NpcKind = "person" | "sheep" | "cow" | "horse";

interface PathAgent {
  waypoints: Array<[number, number]>;
  progress: number;
  speed: number;
  stridePhase: number;
  scale: number;
  x: number;
  y: number;
  z: number;
  yaw: number;
  /** If relocated by user drag, person strolls freely around dropped spot */
  customAnchor: { x: number; z: number; angle: number; radius: number } | null;
  jumpVel: number;
  jumpOffset: number;
  spinBoost: number;
}

interface PastureAnimal {
  homeX: number;
  homeZ: number;
  radius: number;
  angle: number;
  orbitSpeed: number;
  wanderFreq: number;
  phase: number;
  scale: number;
  facing: number;
  x: number;
  y: number;
  z: number;
  jumpVel: number;
  jumpOffset: number;
}

export interface DraggableNpcTarget {
  kind: NpcKind;
  mesh: THREE.InstancedMesh;
}

export interface TownNpcSystem {
  interactiveMeshes: DraggableNpcTarget[];
  beginDrag: (kind: NpcKind, index: number) => THREE.Vector3 | null;
  moveDrag: (worldX: number, worldZ: number) => { x: number; y: number; z: number; groundY: number } | null;
  endDrag: () => void;
  pokeNpc: (kind: NpcKind, index: number) => void;
  update: (t: number, delta: number) => void;
  dispose: () => void;
}

export function createTownNpcSystem(
  scene: THREE.Scene,
  gBufferScene: THREE.Scene,
  getHeight: (x: number, z: number) => number,
  materials: {
    personMat: THREE.Material;
    sheepMat: THREE.Material;
    cowMat: THREE.Material;
    horseMat: THREE.Material;
    cartMat: THREE.Material;
    normalDepthMat: THREE.Material;
  }
): TownNpcSystem {
  const rand = mulberry32(993107);

  /* ---- 1. Townsfolk & Guards Routes ---- */
  const routes: Array<{ pts: Array<[number, number]>; count: number; speedRange: [number, number] }> = [
    { pts: [[-22, 34], [22, 34], [26, 56], [22, 78], [-22, 78], [-26, 56]], count: 26, speedRange: [1.6, 2.8] },
    { pts: [[-3.8, 86], [-3.8, 165], [-3.8, 232], [-3.8, 298], [3.8, 298], [3.8, 232], [3.8, 165], [3.8, 86]], count: 24, speedRange: [2.0, 3.3] },
    { pts: [[-48, 52], [-88, 44], [-128, 36], [-132, 68], [-92, 76], [-52, 68]], count: 28, speedRange: [1.7, 3.0] },
    { pts: [[-52, 20], [-94, -10], [-124, -44], [-96, -68], [-58, -32]], count: 16, speedRange: [1.5, 2.6] },
    { pts: [[62, 46], [108, 36], [156, 24], [154, -26], [110, -46], [66, -24]], count: 22, speedRange: [1.4, 2.3] },
    { pts: [[-46, 126], [-96, 134], [-146, 146], [-126, 178], [-76, 174], [-44, 158]], count: 22, speedRange: [1.5, 2.7] },
    { pts: [[46, 126], [96, 136], [138, 154], [116, 178], [68, 170], [44, 150]], count: 16, speedRange: [1.5, 2.7] },
    { pts: [[-4, 10], [-4, -48], [-4, -106], [-34, -130], [-34, -172], [34, -172], [34, -130], [4, -106], [4, -48], [4, 10]], count: 16, speedRange: [1.9, 3.0] },
    { pts: [[-260, 120], [-210, 180], [-140, 290], [-10, 325], [130, 310], [230, 190], [260, 110]], count: 10, speedRange: [1.8, 2.8] },
  ];

  const people: PathAgent[] = [];
  for (const r of routes) {
    for (let i = 0; i < r.count; i++) {
      people.push({
        waypoints: r.pts,
        progress: rand() * r.pts.length,
        speed: r.speedRange[0] + rand() * (r.speedRange[1] - r.speedRange[0]),
        stridePhase: rand() * Math.PI * 2,
        scale: 0.92 + rand() * 0.22,
        x: r.pts[0][0],
        y: 8,
        z: r.pts[0][1],
        yaw: 0,
        customAnchor: null,
        jumpVel: 0,
        jumpOffset: 0,
        spinBoost: 0,
      });
    }
  }

  /* ---- 2. Moving Horse-Drawn Carts ---- */
  const cartRoutes: Array<Array<[number, number]>> = [
    [[5, 385], [3, 305], [3, 232], [3, 120], [-36, 62], [-96, 52], [-96, 66], [-36, 76], [-3, 120], [-3, 232], [-3, 305], [-5, 385]],
    [[-280, 165], [-210, 295], [-90, 345], [60, 340], [210, 290], [285, 160], [295, 145], [205, 305], [60, 355], [-90, 360], [-220, 308], [-292, 165]],
  ];
  const carts: PathAgent[] = [];
  for (let i = 0; i < 8; i++) {
    const pts = cartRoutes[i % cartRoutes.length];
    carts.push({
      waypoints: pts,
      progress: (i / 8) * pts.length + rand() * 0.5,
      speed: 4.8 + rand() * 2.0,
      stridePhase: rand() * Math.PI * 2,
      scale: 1.0,
      x: pts[0][0],
      y: 8,
      z: pts[0][1],
      yaw: 0,
      customAnchor: null,
      jumpVel: 0,
      jumpOffset: 0,
      spinBoost: 0,
    });
  }

  /* ---- 3. Livestock Pastures ---- */
  function buildPastures(specs: Array<[number, number, number, number]>, speedScale: number): PastureAnimal[] {
    const out: PastureAnimal[] = [];
    for (const [hx, hz, rad, cnt] of specs) {
      for (let i = 0; i < cnt; i++) {
        const a = rand() * Math.PI * 2;
        const r = (0.2 + rand() * 0.8) * rad;
        const homeX = hx + Math.cos(a) * r * 0.45;
        const homeZ = hz + Math.sin(a) * r * 0.45;
        const ang = rand() * Math.PI * 2;
        const radius = 5 + rand() * 11;
        const x = homeX + Math.cos(ang) * radius;
        const z = homeZ + Math.sin(ang) * radius;
        out.push({
          homeX,
          homeZ,
          radius,
          angle: ang,
          orbitSpeed: (0.03 + rand() * 0.06) * speedScale * (rand() > 0.5 ? 1 : -1),
          wanderFreq: 0.35 + rand() * 0.55,
          phase: rand() * Math.PI * 2,
          scale: 0.9 + rand() * 0.22,
          facing: rand() * Math.PI * 2,
          x,
          y: getHeight(x, z),
          z,
          jumpVel: 0,
          jumpOffset: 0,
        });
      }
    }
    return out;
  }

  const sheep = buildPastures(
    [[-285, 130, 32, 16], [-230, 330, 34, 16], [135, 345, 34, 16], [295, 140, 32, 14], [-290, -110, 28, 10]],
    1.1
  );
  const cows = buildPastures(
    [[-155, 345, 30, 12], [265, 295, 32, 12], [315, 25, 30, 10], [-315, 15, 28, 10]],
    0.75
  );
  const horses = buildPastures(
    [[-55, 315, 22, 8], [65, 315, 22, 8], [280, -100, 26, 6], [-255, -180, 24, 6]],
    1.35
  );

  /* ---- 4. InstancedMeshes ---- */
  const personGeo = createPersonGeometry();
  const sheepGeo = createSheepGeometry();
  const cowGeo = createCowGeometry();
  const horseGeo = createHorseGeometry();
  const cartGeo = createCartGeometry();

  function makePairedInstanced(
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    count: number
  ): [THREE.InstancedMesh, THREE.InstancedMesh] {
    const main = new THREE.InstancedMesh(geo, mat, count);
    main.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    main.frustumCulled = false;
    scene.add(main);

    const gb = new THREE.InstancedMesh(geo, materials.normalDepthMat, count);
    gb.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    gb.frustumCulled = false;
    gBufferScene.add(gb);
    return [main, gb];
  }

  const [peopleMesh, peopleGb] = makePairedInstanced(personGeo, materials.personMat, people.length);
  const [sheepMesh, sheepGb] = makePairedInstanced(sheepGeo, materials.sheepMat, sheep.length);
  const [cowMesh, cowGb] = makePairedInstanced(cowGeo, materials.cowMat, cows.length);
  const [horseMesh, horseGb] = makePairedInstanced(horseGeo, materials.horseMat, horses.length);
  const [cartMesh, cartGb] = makePairedInstanced(cartGeo, materials.cartMat, carts.length);

  /* ---- 5. Drag & Poke Interactive State ---- */
  const DRAG_LIFT = 5.5;
  let dragged: { kind: NpcKind; index: number; x: number; y: number; z: number } | null = null;

  function groundAt(x: number, z: number): number {
    let y = Math.max(0.1, getHeight(x, z));
    if (Math.abs(x) < 10.5 && z > 234 && z < 299) {
      y = Math.max(y, 8.2);
    }
    return y;
  }

  function getPastureList(kind: NpcKind): PastureAnimal[] | null {
    if (kind === "sheep") return sheep;
    if (kind === "cow") return cows;
    if (kind === "horse") return horses;
    return null;
  }

  const beginDrag = (kind: NpcKind, index: number): THREE.Vector3 | null => {
    if (kind === "person") {
      const p = people[index];
      if (!p) return null;
      dragged = { kind, index, x: p.x, y: p.y + DRAG_LIFT, z: p.z };
      return new THREE.Vector3(p.x, p.y, p.z);
    }
    const list = getPastureList(kind);
    const a = list?.[index];
    if (!a) return null;
    dragged = { kind, index, x: a.x, y: a.y + DRAG_LIFT, z: a.z };
    return new THREE.Vector3(a.x, a.y, a.z);
  };

  const moveDrag = (worldX: number, worldZ: number) => {
    if (!dragged) return null;
    const cx = THREE.MathUtils.clamp(worldX, -445, 445);
    const cz = THREE.MathUtils.clamp(worldZ, -445, 445);
    const gy = groundAt(cx, cz);
    dragged.x = cx;
    dragged.z = cz;
    dragged.y = gy + DRAG_LIFT;
    return { x: cx, y: dragged.y, z: cz, groundY: gy };
  };

  const endDrag = () => {
    if (!dragged) return;
    const { kind, index, x, z } = dragged;
    const gy = groundAt(x, z);
    if (kind === "person") {
      const p = people[index];
      if (p) {
        p.x = x;
        p.z = z;
        p.y = gy;
        p.jumpOffset = DRAG_LIFT;
        p.jumpVel = 0;
        p.customAnchor = { x, z, angle: rand() * Math.PI * 2, radius: 6 + rand() * 8 };
      }
    } else {
      const list = getPastureList(kind);
      const a = list?.[index];
      if (a) {
        a.homeX = x;
        a.homeZ = z;
        a.x = x;
        a.z = z;
        a.y = gy;
        a.radius = Math.min(a.radius, 9);
        a.jumpOffset = DRAG_LIFT;
        a.jumpVel = 0;
      }
    }
    dragged = null;
  };

  const pokeNpc = (kind: NpcKind, index: number) => {
    if (kind === "person") {
      const p = people[index];
      if (p) {
        p.jumpVel = 9.5;
        p.spinBoost = Math.PI * 2;
      }
      return;
    }
    const list = getPastureList(kind);
    const a = list?.[index];
    if (a) {
      a.jumpVel = 8.0;
    }
  };

  /* ---- 6. Zero-Allocation Frame Update ---- */
  const _mat = new THREE.Matrix4();
  const _pos = new THREE.Vector3();
  const _quat = new THREE.Quaternion();
  const _euler = new THREE.Euler();
  const _scale = new THREE.Vector3();

  function advancePathAgent(agent: PathAgent, delta: number) {
    const n = agent.waypoints.length;
    const idx = Math.floor(agent.progress) % n;
    const nextIdx = (idx + 1) % n;
    const [x1, z1] = agent.waypoints[idx];
    const [x2, z2] = agent.waypoints[nextIdx];
    const segLen = Math.max(1, Math.hypot(x2 - x1, z2 - z1));
    agent.progress = (agent.progress + (agent.speed * delta) / segLen) % n;

    const curIdx = Math.floor(agent.progress) % n;
    const nxtIdx = (curIdx + 1) % n;
    const frac = agent.progress - Math.floor(agent.progress);
    const [ax, az] = agent.waypoints[curIdx];
    const [bx, bz] = agent.waypoints[nxtIdx];
    agent.x = ax + (bx - ax) * frac;
    agent.z = az + (bz - az) * frac;
    agent.yaw = Math.atan2(bx - ax, bz - az);
  }

  function stepGravity(entity: { jumpOffset: number; jumpVel: number }, delta: number) {
    if (entity.jumpOffset > 0 || entity.jumpVel > 0) {
      entity.jumpOffset += entity.jumpVel * delta;
      entity.jumpVel -= 26.0 * delta;
      if (entity.jumpOffset <= 0) {
        entity.jumpOffset = 0;
        entity.jumpVel = entity.jumpVel < -4.5 ? -entity.jumpVel * 0.34 : 0;
      }
    }
  }

  function updatePastureGroup(
    kind: NpcKind,
    list: PastureAnimal[],
    mainMesh: THREE.InstancedMesh,
    gbMesh: THREE.InstancedMesh,
    t: number,
    delta: number,
    hopAmp: number
  ) {
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      if (dragged && dragged.kind === kind && dragged.index === i) {
        a.x = dragged.x;
        a.y = dragged.y;
        a.z = dragged.z;
        const wiggle = Math.sin(t * 24) * 0.28;
        _pos.set(a.x, a.y, a.z);
        _euler.set(wiggle * 0.5, a.facing + t * 2.4, wiggle);
        _quat.setFromEuler(_euler);
        _scale.setScalar(a.scale * 1.15);
      } else {
        const prevX = a.x;
        const prevZ = a.z;
        a.angle += a.orbitSpeed * delta;
        const rMod = a.radius * (0.78 + 0.22 * Math.sin(t * a.wanderFreq + a.phase));
        a.x = a.homeX + Math.cos(a.angle) * rMod;
        a.z = a.homeZ + Math.sin(a.angle) * rMod;
        const dx = a.x - prevX;
        const dz = a.z - prevZ;
        if (dx * dx + dz * dz > 1e-6) a.facing = Math.atan2(dx, dz);
        stepGravity(a, delta);
        a.y = groundAt(a.x, a.z);
        const grazePitch = a.jumpOffset > 0.05 ? -0.15 : Math.max(0, Math.sin(t * 0.9 + a.phase)) * 0.16;
        const hop = Math.abs(Math.sin(t * 3.6 + a.phase)) * hopAmp;

        _pos.set(a.x, a.y + hop + a.jumpOffset, a.z);
        _euler.set(grazePitch, a.facing, 0);
        _quat.setFromEuler(_euler);
        _scale.setScalar(a.scale);
      }
      _mat.compose(_pos, _quat, _scale);
      mainMesh.setMatrixAt(i, _mat);
      gbMesh.setMatrixAt(i, _mat);
    }
    mainMesh.instanceMatrix.needsUpdate = true;
    gbMesh.instanceMatrix.needsUpdate = true;
  }

  const update = (t: number, delta: number) => {
    for (let i = 0; i < people.length; i++) {
      const p = people[i];
      if (dragged && dragged.kind === "person" && dragged.index === i) {
        p.x = dragged.x;
        p.y = dragged.y;
        p.z = dragged.z;
        const wiggle = Math.sin(t * 26) * 0.34;
        _pos.set(p.x, p.y, p.z);
        _euler.set(wiggle * 0.4, p.yaw + t * 3.0, wiggle);
        _quat.setFromEuler(_euler);
        _scale.setScalar(p.scale * 1.18);
      } else {
        if (p.customAnchor) {
          const prevX = p.x;
          const prevZ = p.z;
          p.customAnchor.angle += (p.speed / Math.max(4, p.customAnchor.radius)) * delta;
          p.x = p.customAnchor.x + Math.cos(p.customAnchor.angle) * p.customAnchor.radius;
          p.z = p.customAnchor.z + Math.sin(p.customAnchor.angle) * p.customAnchor.radius;
          p.yaw = Math.atan2(p.x - prevX, p.z - prevZ);
        } else {
          advancePathAgent(p, delta);
        }
        stepGravity(p, delta);
        if (p.spinBoost > 0) {
          p.spinBoost = Math.max(0, p.spinBoost - delta * 8.5);
        }
        p.y = groundAt(p.x, p.z);
        const bob = Math.abs(Math.sin(t * 7.2 + p.stridePhase)) * 0.14;
        const sway = Math.sin(t * 7.2 + p.stridePhase) * 0.06;

        _pos.set(p.x, p.y + bob + p.jumpOffset, p.z);
        _euler.set(0, p.yaw + p.spinBoost, sway);
        _quat.setFromEuler(_euler);
        _scale.setScalar(p.scale);
      }
      _mat.compose(_pos, _quat, _scale);
      peopleMesh.setMatrixAt(i, _mat);
      peopleGb.setMatrixAt(i, _mat);
    }
    peopleMesh.instanceMatrix.needsUpdate = true;
    peopleGb.instanceMatrix.needsUpdate = true;

    for (let i = 0; i < carts.length; i++) {
      const c = carts[i];
      advancePathAgent(c, delta);
      c.y = groundAt(c.x, c.z);
      const rattle = Math.sin(t * 9.5 + c.stridePhase) * 0.04;
      _pos.set(c.x, c.y + rattle, c.z);
      _euler.set(0, c.yaw, rattle * 0.4);
      _quat.setFromEuler(_euler);
      _scale.setScalar(c.scale);
      _mat.compose(_pos, _quat, _scale);
      cartMesh.setMatrixAt(i, _mat);
      cartGb.setMatrixAt(i, _mat);
    }
    cartMesh.instanceMatrix.needsUpdate = true;
    cartGb.instanceMatrix.needsUpdate = true;

    updatePastureGroup("sheep", sheep, sheepMesh, sheepGb, t, delta, 0.08);
    updatePastureGroup("cow", cows, cowMesh, cowGb, t, delta, 0.02);
    updatePastureGroup("horse", horses, horseMesh, horseGb, t, delta, 0.05);
  };

  update(0, 0.016);

  return {
    interactiveMeshes: [
      { kind: "person", mesh: peopleMesh },
      { kind: "sheep", mesh: sheepMesh },
      { kind: "cow", mesh: cowMesh },
      { kind: "horse", mesh: horseMesh },
    ],
    beginDrag,
    moveDrag,
    endDrag,
    pokeNpc,
    update,
    dispose: () => {
      scene.remove(peopleMesh, sheepMesh, cowMesh, horseMesh, cartMesh);
      gBufferScene.remove(peopleGb, sheepGb, cowGb, horseGb, cartGb);
      personGeo.dispose();
      sheepGeo.dispose();
      cowGeo.dispose();
      horseGeo.dispose();
      cartGeo.dispose();
    },
  };
}
