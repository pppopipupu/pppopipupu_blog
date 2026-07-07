"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";

/**
 * Physics lab configuration parameters.
 */
interface SimConfig {
  stiffness: number;
  gravity: number;
  ropeLength: number;
  wireframe: boolean;
}

/**
 * Loads the static Ammo.js WASM engine from public/lib/ammo.js.
 */
const loadAmmoEngine = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return;
    if ((window as any).Ammo) {
      resolve((window as any).Ammo);
      return;
    }
    const script = document.createElement("script");
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
    script.src = `${basePath}/lib/ammo.js`;
    script.async = true;
    script.onload = () => {
      if ((window as any).Ammo) {
        resolve((window as any).Ammo);
      } else {
        reject(new Error("Ammo failed to attach to window scope"));
      }
    };
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });
};

/**
 * Interactive Ammo.js soft-body box and rope physics simulation with Three.js rendering.
 */
export default function AmmoTestScene() {
  const mountRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [config, setConfig] = useState<SimConfig>({
    stiffness: 0.8,
    gravity: -9.8,
    ropeLength: 16,
    wireframe: false,
  });

  const [fps, setFps] = useState<number>(60);
  const [nodesCount, setNodesCount] = useState<number>(0);
  const [boxHeight, setBoxHeight] = useState<string>("0.00");
  const [dragStatus, setDragStatus] = useState<string>("IDLE");
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  const ammoRef = useRef<any>(null);
  const physicsWorldRef = useRef<any>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  const softBoxMeshRef = useRef<THREE.Mesh | null>(null);
  const softBoxBodyRef = useRef<any>(null);
  const nodeMapRef = useRef<number[]>([]);
  const topNodeIndexRef = useRef<number>(0);
  const topIndicesRef = useRef<number[]>([]);
  const topOffsetsRef = useRef<{ x: number; y: number; z: number }[]>([]);

  const ropeLineRef = useRef<THREE.Line | null>(null);
  const ropeNodesGroupRef = useRef<THREE.Group | null>(null);
  const ropeBodyRef = useRef<any>(null);

  const anchorMeshRef = useRef<THREE.Mesh | null>(null);

  const isDraggingRef = useRef<boolean>(false);
  const isOrbitingRef = useRef<boolean>(false);
  const previousMousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cameraTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 3, 0));
  const sphericalRef = useRef<THREE.Spherical>(new THREE.Spherical());

  const dragPlaneRef = useRef<THREE.Plane>(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());

  const tmpTransformRef = useRef<any>(null);

  const configRef = useRef<SimConfig>(config);
  useEffect(() => {
    configRef.current = config;
    if (softBoxMeshRef.current) {
      (softBoxMeshRef.current.material as THREE.MeshStandardMaterial).wireframe = config.wireframe;
    }
  }, [config]);

  /**
   * Creates physics soft bodies, rigid body anchors, rope, and the coupling link.
   */
  const initPhysicsObjects = useCallback(() => {
    const AmmoLib = ammoRef.current;
    const world = physicsWorldRef.current;
    const scene = sceneRef.current;
    if (!AmmoLib || !world || !scene) return;

    if (softBoxBodyRef.current) {
      world.removeSoftBody(softBoxBodyRef.current);
      softBoxBodyRef.current = null;
    }
    if (softBoxMeshRef.current) {
      scene.remove(softBoxMeshRef.current);
      softBoxMeshRef.current.geometry.dispose();
      softBoxMeshRef.current = null;
    }
    if (ropeBodyRef.current) {
      world.removeSoftBody(ropeBodyRef.current);
      ropeBodyRef.current = null;
    }
    if (ropeLineRef.current) {
      scene.remove(ropeLineRef.current);
      ropeLineRef.current.geometry.dispose();
      ropeLineRef.current = null;
    }
    if (ropeNodesGroupRef.current) {
      scene.remove(ropeNodesGroupRef.current);
      ropeNodesGroupRef.current = null;
    }
    const worldInfo = world.getWorldInfo();

    if (!anchorMeshRef.current) {
      const anchorGeo = new THREE.SphereGeometry(0.6, 16, 16);
      const anchorMat = new THREE.MeshStandardMaterial({
        color: 0xff0055,
        emissive: 0xff0033,
        roughness: 0.2,
      });
      const anchorMesh = new THREE.Mesh(anchorGeo, anchorMat);
      anchorMesh.position.set(0, 7, 0);
      scene.add(anchorMesh);
      anchorMeshRef.current = anchorMesh;
    } else {
      anchorMeshRef.current.position.set(0, 7, 0);
    }

    const boxCenterY = 1.5;
    const boxWidth = 2;
    const boxHeightDim = 2;
    const boxDepth = 2;
    const subdivisions = 2;
    const boxGeo = new THREE.BoxGeometry(
      boxWidth, boxHeightDim, boxDepth,
      subdivisions, subdivisions, subdivisions
    );
    const boxMat = new THREE.MeshStandardMaterial({
      color: 0x00ffcc,
      wireframe: configRef.current.wireframe,
      roughness: 0.3,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });
    const softBoxMesh = new THREE.Mesh(boxGeo, boxMat);
    softBoxMesh.position.set(0, 0, 0);
    scene.add(softBoxMesh);
    softBoxMeshRef.current = softBoxMesh;

    const posAttr = boxGeo.attributes.position;
    const indexAttr = boxGeo.index;

    const vertices: number[] = [];
    const nodeMap: number[] = [];
    const vertexMap = new Map<string, number>();
    const topIndices: number[] = [];
    const topOffsets: { x: number; y: number; z: number }[] = [];
    let highestY = -Infinity;
    let topNodeIdx = 0;

    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vy = posAttr.getY(i) + boxCenterY;
      const vz = posAttr.getZ(i);
      const key = `${vx.toFixed(4)},${vy.toFixed(4)},${vz.toFixed(4)}`;

      if (!vertexMap.has(key)) {
        const uniqueIdx = vertices.length / 3;
        vertexMap.set(key, uniqueIdx);
        vertices.push(vx, vy, vz);

        if (vy > highestY) {
          highestY = vy;
          topNodeIdx = uniqueIdx;
        }
      }
      nodeMap[i] = vertexMap.get(key)!;
    }
    nodeMapRef.current = nodeMap;
    topNodeIndexRef.current = topNodeIdx;

    for (let uIdx = 0; uIdx < vertices.length / 3; uIdx++) {
      const vx = vertices[uIdx * 3];
      const vy = vertices[uIdx * 3 + 1];
      const vz = vertices[uIdx * 3 + 2];
      if (vy >= highestY - 0.1) {
        topIndices.push(uIdx);
        topOffsets.push({ x: vx, y: vy - highestY, z: vz });
      }
    }
    topIndicesRef.current = topIndices;
    topOffsetsRef.current = topOffsets;

    const indices: number[] = [];
    if (indexAttr) {
      for (let i = 0; i < indexAttr.count; i++) {
        const origIdx = indexAttr.getX(i);
        indices.push(nodeMap[origIdx]);
      }
    }

    const softBodyHelpers = new AmmoLib.btSoftBodyHelpers();
    const softBoxBody = softBodyHelpers.CreateFromTriMesh(
      worldInfo, vertices, indices, indices.length / 3, true
    );

    const sbConfig = softBoxBody.get_m_cfg();
    sbConfig.kVCF = 1.0;
    sbConfig.kDP = 0.01;
    sbConfig.kDG = 0;
    sbConfig.kLF = 0;
    sbConfig.kPR = 80;
    sbConfig.kVC = 12;
    sbConfig.kDF = 0.5;
    sbConfig.kMT = 0.2;
    sbConfig.kCHR = 1.0;
    sbConfig.kKHR = 0.8;
    sbConfig.kSHR = 1.0;
    sbConfig.kAHR = 0.7;
    sbConfig.piterations = 4;
    sbConfig.collisions = 0x11;

    const mat = softBoxBody.get_m_materials().at(0);
    mat.m_kLST = configRef.current.stiffness;
    mat.m_kAST = configRef.current.stiffness;
    mat.m_kVST = 1.0;

    softBoxBody.setTotalMass(3.0, false);
    softBoxBody.setActivationState(4);

    softBoxBody.generateBendingConstraints(2, mat);

    world.addSoftBody(softBoxBody, 1, -1);
    softBoxBodyRef.current = softBoxBody;

    const ropeTopY = 7.0;
    const ropeBottomY = highestY;
    const ropeSegments = configRef.current.ropeLength;
    const ropeStart = new AmmoLib.btVector3(0, ropeTopY, 0);
    const ropeEnd = new AmmoLib.btVector3(0, ropeBottomY, 0);
    const ropeBody = softBodyHelpers.CreateRope(
      worldInfo, ropeStart, ropeEnd, ropeSegments, 1
    );

    const rConfig = ropeBody.get_m_cfg();
    rConfig.kDP = 0.01;
    rConfig.kDF = 0.5;
    rConfig.piterations = 4;
    rConfig.collisions = 0x11;
    ropeBody.setTotalMass(0.4, false);
    ropeBody.setActivationState(4);

    const ropeMat = ropeBody.get_m_materials().at(0);
    ropeMat.m_kLST = 0.9;
    ropeMat.m_kAST = 0.9;

    world.addSoftBody(ropeBody, 1, -1);
    ropeBodyRef.current = ropeBody;

    const numNodes = ropeSegments + 1;
    const ropePositions = new Float32Array(numNodes * 3);
    const ropeGeo = new THREE.BufferGeometry();
    ropeGeo.setAttribute("position", new THREE.BufferAttribute(ropePositions, 3));
    const ropeLineMat = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 4 });
    const ropeLine = new THREE.Line(ropeGeo, ropeLineMat);
    scene.add(ropeLine);
    ropeLineRef.current = ropeLine;

    const nodesGroup = new THREE.Group();
    const nodeSphereGeo = new THREE.SphereGeometry(0.1, 8, 8);
    const nodeSphereMat = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x008888,
      roughness: 0.2,
    });
    for (let i = 0; i < numNodes; i++) {
      nodesGroup.add(new THREE.Mesh(nodeSphereGeo, nodeSphereMat));
    }
    scene.add(nodesGroup);
    ropeNodesGroupRef.current = nodesGroup;

    const totalNodes = softBoxBody.get_m_nodes().size() + numNodes;
    setNodesCount(totalNodes);
  }, []);

  /**
   * Sets up renderer, Ammo dynamics world, scene objects, and animation loop.
   */
  useEffect(() => {
    if (!canvasRef.current || !mountRef.current) return;

    let animId: number;
    const clock = new THREE.Clock();
    let frameCounter = 0;
    let lastTime = performance.now();

    const canvas = canvasRef.current;
    const width = mountRef.current.clientWidth || 800;
    const height = mountRef.current.clientHeight || 600;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);
    scene.fog = new THREE.FogExp2(0x050505, 0.03);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 6, 14);
    camera.lookAt(0, 3, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x00ff00, 1.2);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0xff00ff, 1.5, 20);
    pointLight.position.set(-8, 8, -5);
    scene.add(pointLight);

    const groundGeo = new THREE.BoxGeometry(20, 1, 20);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.8,
      metalness: 0.2,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.position.set(0, -0.5, 0);
    scene.add(groundMesh);

    const gridHelper = new THREE.GridHelper(20, 20, 0x00ff00, 0x222222);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    loadAmmoEngine().then((AmmoFactory) => {
      AmmoFactory().then((AmmoLib: any) => {
        ammoRef.current = AmmoLib;

        tmpTransformRef.current = new AmmoLib.btTransform();

        const collisionConfiguration = new AmmoLib.btSoftBodyRigidBodyCollisionConfiguration();
        const dispatcher = new AmmoLib.btCollisionDispatcher(collisionConfiguration);
        const broadphase = new AmmoLib.btDbvtBroadphase();
        const solver = new AmmoLib.btSequentialImpulseConstraintSolver();
        const softBodySolver = new AmmoLib.btDefaultSoftBodySolver();

        const world = new AmmoLib.btSoftRigidDynamicsWorld(
          dispatcher, broadphase, solver, collisionConfiguration, softBodySolver
        );
        world.setGravity(new AmmoLib.btVector3(0, configRef.current.gravity, 0));
        physicsWorldRef.current = world;

        const worldInfo = world.getWorldInfo();
        worldInfo.set_m_gravity(new AmmoLib.btVector3(0, configRef.current.gravity, 0));
        worldInfo.air_density = 1.2;
        worldInfo.m_maxDisplacement = 100;
        worldInfo.set_m_broadphase(broadphase);
        worldInfo.set_m_dispatcher(dispatcher);

        const groundTransform = new AmmoLib.btTransform();
        groundTransform.setIdentity();
        groundTransform.setOrigin(new AmmoLib.btVector3(0, -0.5, 0));
        const groundMotionState = new AmmoLib.btDefaultMotionState(groundTransform);
        const groundShape = new AmmoLib.btBoxShape(new AmmoLib.btVector3(10, 0.5, 10));
        const groundRbInfo = new AmmoLib.btRigidBodyConstructionInfo(
          0, groundMotionState, groundShape, new AmmoLib.btVector3(0, 0, 0)
        );
        const groundBody = new AmmoLib.btRigidBody(groundRbInfo);
        groundBody.setFriction(0.9);
        world.addRigidBody(groundBody);

        initPhysicsObjects();
        setIsInitialized(true);

        const renderLoop = () => {
          animId = requestAnimationFrame(renderLoop);

          const delta = Math.min(clock.getDelta(), 0.03);

          if (physicsWorldRef.current && ammoRef.current) {
            const gVec = new ammoRef.current.btVector3(0, configRef.current.gravity, 0);
            physicsWorldRef.current.setGravity(gVec);
            physicsWorldRef.current.getWorldInfo().set_m_gravity(gVec);
          }

          if (ropeBodyRef.current && anchorMeshRef.current) {
            const ropeNodes = ropeBodyRef.current.get_m_nodes();
            if (ropeNodes.size() > 0) {
              const headNode = ropeNodes.at(0);
              const ax = anchorMeshRef.current.position.x;
              const ay = anchorMeshRef.current.position.y;
              const az = anchorMeshRef.current.position.z;
              headNode.get_m_x().setValue(ax, ay, az);
              headNode.get_m_q().setValue(ax, ay, az);
              headNode.get_m_v().setValue(0, 0, 0);
            }
          }

          if (physicsWorldRef.current) {
            physicsWorldRef.current.stepSimulation(delta, 4, 1 / 60);
          }

          if (ropeBodyRef.current && softBoxBodyRef.current) {
            const ropeNodes = ropeBodyRef.current.get_m_nodes();
            if (ropeNodes.size() > 0) {
              const tailIdx = ropeNodes.size() - 1;
              const tailNode = ropeNodes.at(tailIdx);
              const tPos = tailNode.get_m_x();

              const boxNodes = softBoxBodyRef.current.get_m_nodes();
              const topIndices = topIndicesRef.current;

              let avgTopX = 0, avgTopY = 0, avgTopZ = 0;
              let topCount = 0;
              for (const idx of topIndices) {
                if (idx < boxNodes.size()) {
                  const p = boxNodes.at(idx).get_m_x();
                  avgTopX += p.x();
                  avgTopY += p.y();
                  avgTopZ += p.z();
                  topCount++;
                }
              }

              if (topCount > 0) {
                avgTopX /= topCount;
                avgTopY /= topCount;
                avgTopZ /= topCount;

                const dx = tPos.x() - avgTopX;
                const dy = tPos.y() - avgTopY;
                const dz = tPos.z() - avgTopZ;

                for (let i = 0; i < boxNodes.size(); i++) {
                  const bNode = boxNodes.at(i);
                  const p = bNode.get_m_x();
                  const q = bNode.get_m_q();
                  bNode.get_m_x().setValue(p.x() + dx, p.y() + dy, p.z() + dz);
                  bNode.get_m_q().setValue(q.x() + dx, q.y() + dy, q.z() + dz);
                }
              }
            }
          }

          if (softBoxBodyRef.current && softBoxMeshRef.current) {
            const softBody = softBoxBodyRef.current;
            const nodes = softBody.get_m_nodes();
            const geo = softBoxMeshRef.current.geometry;
            const posAttr = geo.attributes.position;
            const nodeMap = nodeMapRef.current;

            let avgY = 0;
            let validCount = 0;
            for (let i = 0; i < posAttr.count; i++) {
              const nodeIdx = nodeMap[i];
              if (nodeIdx !== undefined && nodeIdx < nodes.size()) {
                const node = nodes.at(nodeIdx);
                if (node) {
                  const pos = node.get_m_x();
                  const px = pos.x(), py = pos.y(), pz = pos.z();
                  if (isFinite(px) && isFinite(py) && isFinite(pz)) {
                    posAttr.setXYZ(i, px, py, pz);
                    avgY += py;
                    validCount++;
                  }
                }
              }
            }
            posAttr.needsUpdate = true;
            geo.computeVertexNormals();
            geo.computeBoundingSphere();

            if (validCount > 0) {
              setBoxHeight((avgY / validCount).toFixed(2));
            }
          }

          if (ropeBodyRef.current && ropeLineRef.current && ropeNodesGroupRef.current) {
            const ropeBody = ropeBodyRef.current;
            const nodes = ropeBody.get_m_nodes();
            const numNodes = nodes.size();
            const geo = ropeLineRef.current.geometry;
            const posAttr = geo.attributes.position;
            const groupChildren = ropeNodesGroupRef.current.children;

            for (let i = 0; i < numNodes; i++) {
              const node = nodes.at(i);
              const pos = node.get_m_x();
              posAttr.setXYZ(i, pos.x(), pos.y(), pos.z());

              if (i < groupChildren.length) {
                groupChildren[i].position.set(pos.x(), pos.y(), pos.z());
              }
            }
            posAttr.needsUpdate = true;
          }

          if (rendererRef.current && sceneRef.current && cameraRef.current) {
            rendererRef.current.render(sceneRef.current, cameraRef.current);
          }

          frameCounter++;
          const now = performance.now();
          if (now - lastTime >= 1000) {
            setFps(Math.round((frameCounter * 1000) / (now - lastTime)));
            frameCounter = 0;
            lastTime = now;
          }
        };

        renderLoop();
      });
    });

    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [initPhysicsObjects]);

  /**
   * Handles left-click anchor dragging or right-click camera orbiting on pointer down.
   */
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!cameraRef.current) return;

    if (e.button === 2) {
      isOrbitingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (e.button === 0 && anchorMeshRef.current) {
      const rect = mountRef.current?.getBoundingClientRect();
      if (!rect) return;

      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
      const intersects = raycasterRef.current.intersectObject(anchorMeshRef.current);

      const anchorPos = anchorMeshRef.current.position;
      const anchorScreenPos = anchorPos.clone().project(cameraRef.current);
      const distToAnchorScreen = Math.hypot(
        mouseRef.current.x - anchorScreenPos.x,
        mouseRef.current.y - anchorScreenPos.y
      );

      if (intersects.length > 0 || distToAnchorScreen < 0.45 || mouseRef.current.y > 0.1) {
        isDraggingRef.current = true;
        setDragStatus("DRAGGING");

        dragPlaneRef.current.setFromNormalAndCoplanarPoint(
          cameraRef.current.getWorldDirection(new THREE.Vector3()).negate(),
          anchorPos
        );
      }
    }
  };

  /**
   * Handles anchor translation or camera rotation on pointer move.
   */
  const handlePointerMove = (e: React.PointerEvent) => {
    if (isOrbitingRef.current && cameraRef.current) {
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };

      const offset = cameraRef.current.position.clone().sub(cameraTargetRef.current);
      sphericalRef.current.setFromVector3(offset);
      sphericalRef.current.theta -= deltaX * 0.005;
      sphericalRef.current.phi -= deltaY * 0.005;
      sphericalRef.current.phi = THREE.MathUtils.clamp(
        sphericalRef.current.phi, 0.1, Math.PI - 0.1
      );

      offset.setFromSpherical(sphericalRef.current);
      cameraRef.current.position.copy(cameraTargetRef.current).add(offset);
      cameraRef.current.lookAt(cameraTargetRef.current);
      return;
    }

    if (isDraggingRef.current && cameraRef.current && anchorMeshRef.current) {
      const rect = mountRef.current?.getBoundingClientRect();
      if (!rect) return;

      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
      const targetPos = new THREE.Vector3();
      const hit = raycasterRef.current.ray.intersectPlane(dragPlaneRef.current, targetPos);

      if (hit) {
        targetPos.x = THREE.MathUtils.clamp(targetPos.x, -10, 10);
        targetPos.y = THREE.MathUtils.clamp(targetPos.y, 0.5, 14);
        targetPos.z = THREE.MathUtils.clamp(targetPos.z, -10, 10);

        anchorMeshRef.current.position.copy(targetPos);
      }
    }
  };

  /**
   * Resets drag and orbit states on pointer release.
   */
  const handlePointerUp = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      setDragStatus("IDLE");
    }
    if (isOrbitingRef.current) {
      isOrbitingRef.current = false;
    }
  };

  /**
   * Handles mouse wheel zoom for camera distance adjustment.
   */
  const handleWheel = (e: React.WheelEvent) => {
    if (!cameraRef.current) return;
    const offset = cameraRef.current.position.clone().sub(cameraTargetRef.current);
    let radius = offset.length();
    radius += e.deltaY * 0.01;
    radius = THREE.MathUtils.clamp(radius, 3, 40);
    offset.setLength(radius);
    cameraRef.current.position.copy(cameraTargetRef.current).add(offset);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#050505] text-[#00ff00] font-mono select-none border-4 border-[#00ff00] rounded-none">
      <header className="flex items-center justify-between px-4 py-2 bg-[#00ff00] text-black font-bold border-b-4 border-black rounded-none">
        <div className="flex items-center gap-3">
          <span className="bg-black text-[#00ff00] px-2 py-0.5 border border-black rounded-none text-xs">
            SYS_LAB
          </span>
          <h1 className="tracking-wider text-sm md:text-base">
            AMMO.JS SOFT-BODY ROPE SIMULATOR [CLASSIFIED]
          </h1>
        </div>
        <div className="text-xs tracking-widest hidden sm:block">
          STATUS: {isInitialized ? "ENGINE_ACTIVE" : "INITIALIZING..."}
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <div
          ref={mountRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onContextMenu={(e) => e.preventDefault()}
          onWheel={handleWheel}
          className="flex-1 relative cursor-crosshair bg-black border-r-0 md:border-r-4 border-[#00ff00] rounded-none overflow-hidden"
        >
          <canvas ref={canvasRef} className="w-full h-full block" />

          <div className="absolute top-3 left-3 bg-black/80 border-2 border-[#00ff00] p-2 text-xs text-[#00ff00] pointer-events-none rounded-none">
            <p className="font-bold border-b border-[#00ff00] pb-1 mb-1">[ CONTROLS ]</p>
            <p>1. 左键拖拽红色手柄：移动绳索与箱子</p>
            <p>2. 右键拖拽：旋转 360 度视角</p>
            <p>3. 滚轮滑动：拉近 / 拉远摄像机</p>
          </div>

          <div className="absolute top-3 right-3 bg-black/80 border-2 border-[#ff00ff] p-2 text-xs text-[#ff00ff] pointer-events-none rounded-none text-right">
            <p>FPS: {fps}</p>
            <p>DRAG_STATE: {dragStatus}</p>
          </div>
        </div>

        <div className="w-full md:w-80 bg-[#111111] border-t-4 md:border-t-0 border-[#00ff00] p-4 flex flex-col gap-4 overflow-y-auto rounded-none">
          <div className="border-2 border-[#00ff00] p-3 bg-black rounded-none">
            <h2 className="text-xs font-bold text-black bg-[#00ff00] px-1 py-0.5 mb-3 inline-block rounded-none">
              PHYSICS_PARAMETERS
            </h2>

            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span>SOFT_STIFFNESS:</span>
                <span className="text-[#00ffff]">{config.stiffness}</span>
              </div>
              <input
                type="range"
                className="y2k-range w-full"
                min="0.1"
                max="1.0"
                step="0.05"
                value={config.stiffness}
                onChange={(e) => setConfig({ ...config, stiffness: parseFloat(e.target.value) })}
              />
            </div>

            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span>GRAVITY_Y:</span>
                <span className="text-[#00ffff]">{config.gravity}</span>
              </div>
              <input
                type="range"
                className="y2k-range w-full"
                min="-20"
                max="0"
                step="0.5"
                value={config.gravity}
                onChange={(e) => setConfig({ ...config, gravity: parseFloat(e.target.value) })}
              />
            </div>

            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span>ROPE_SEGMENTS:</span>
                <span className="text-[#00ffff]">{config.ropeLength}</span>
              </div>
              <input
                type="range"
                className="y2k-range w-full"
                min="8"
                max="32"
                step="2"
                value={config.ropeLength}
                onChange={(e) => setConfig({ ...config, ropeLength: parseInt(e.target.value) })}
              />
            </div>

            <div className="flex items-center justify-between text-xs mt-2 border-t border-[#004400] pt-2">
              <span>WIREFRAME_RENDER:</span>
              <button
                onClick={() => setConfig({ ...config, wireframe: !config.wireframe })}
                className={`px-2 py-0.5 border text-xs font-bold rounded-none ${
                  config.wireframe
                    ? "bg-[#00ff00] text-black border-black"
                    : "bg-black text-[#00ff00] border-[#00ff00]"
                }`}
              >
                {config.wireframe ? "ON" : "OFF"}
              </button>
            </div>
          </div>

          <div className="border-2 border-[#00ffff] p-3 bg-black text-[#00ffff] rounded-none">
            <h2 className="text-xs font-bold text-black bg-[#00ffff] px-1 py-0.5 mb-3 inline-block rounded-none">
              TELEMETRY_DATA
            </h2>
            <div className="text-xs flex flex-col gap-1 font-mono">
              <div className="flex justify-between">
                <span>SIMULATION_ENGINE:</span>
                <span>AMMO_WASM</span>
              </div>
              <div className="flex justify-between">
                <span>TOTAL_SOFT_NODES:</span>
                <span>{nodesCount}</span>
              </div>
              <div className="flex justify-between">
                <span>BOX_AVG_ALTITUDE:</span>
                <span>{boxHeight} m</span>
              </div>
              <div className="flex justify-between">
                <span>CONSTRAINT_TYPE:</span>
                <span>ANCHOR_LINK</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-auto">
            <button
              onClick={initPhysicsObjects}
              className="w-full bg-[#00ff00] text-black font-bold py-2 border-2 border-white hover:bg-[#00cc00] active:translate-x-0.5 active:translate-y-0.5 rounded-none text-xs tracking-wider"
            >
              [ RESET PHYSICS SCENE ]
            </button>
            <button
              onClick={() => setConfig({ ...config, gravity: config.gravity === 0 ? -9.8 : 0 })}
              className="w-full bg-[#ff00ff] text-black font-bold py-2 border-2 border-white hover:bg-[#cc00cc] active:translate-x-0.5 active:translate-y-0.5 rounded-none text-xs tracking-wider"
            >
              {config.gravity === 0 ? "[ ENABLE GRAVITY ]" : "[ ZERO GRAVITY ]"}
            </button>
          </div>
        </div>
      </div>

      <footer className="bg-[#111111] text-xs px-4 py-1 border-t-2 border-[#00ff00] flex justify-between text-[#008800] rounded-none">
        <span>pppopipupu // Y2K LABS</span>
        <span>MEM_ALLOC: OK | WASM_THREAD: MAIN</span>
      </footer>
    </div>
  );
}
