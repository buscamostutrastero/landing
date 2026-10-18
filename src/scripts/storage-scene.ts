import {
  BoxGeometry, CanvasTexture, CapsuleGeometry, CylinderGeometry, DirectionalLight, Group, HemisphereLight,
  Mesh, MeshBasicMaterial, MeshStandardMaterial, NeutralToneMapping, OrthographicCamera, PlaneGeometry,
  RepeatWrapping, Scene, SphereGeometry, Spherical, SRGBColorSpace, Texture, TorusGeometry, Vector3, WebGLRenderer,
  type BufferGeometry, type Material, type Object3D,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createStorageObjects } from './storage-objects';

export type SceneUnit = { size: string; width: number; depth: number };
export type ViewerView = '3d' | 'top';
export type StorageScene = ReturnType<typeof createStorageScene>;
type Wall = { group: Group; normal: Vector3 };

const navy = 0x183b50;
const yellow = 0xf6b51a;
const thickness = 0.045;
const overview = { phi: 0.76, theta: 0.72 };
const cameraRadius = 8;

function canvasTexture(width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas textures are unavailable.');
  draw(context);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

function repeated(texture: CanvasTexture, x: number, y: number) {
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(x, y);
  return texture;
}

function wallTexture(length: number) {
  return repeated(canvasTexture(64, 8, (ctx) => {
    const gradient = ctx.createLinearGradient(0, 0, 64, 0);
    gradient.addColorStop(0, '#d7dddc');
    gradient.addColorStop(0.12, '#f4f5f1');
    gradient.addColorStop(0.7, '#f4f5f1');
    gradient.addColorStop(0.88, '#e6eae6');
    gradient.addColorStop(1, '#d7dddc');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 8);
  }), length / 0.12, 1);
}

function floorTexture(width: number, depth: number) {
  // A seeded texture keeps size changes visually stable and reproducible.
  let seed = 17;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  return repeated(canvasTexture(256, 256, (ctx) => {
    ctx.fillStyle = '#d6d3c9';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 3200; i++) {
      const tone = 130 + Math.floor(random() * 70);
      ctx.fillStyle = `rgb(${tone} ${tone} ${tone - 5} / .09)`;
      ctx.fillRect(random() * 256, random() * 256, 1, 1);
    }
    ctx.strokeStyle = 'rgb(255 255 255 / 36%)';
    ctx.lineWidth = 1;
    for (const position of [0, 128, 256]) {
      ctx.beginPath(); ctx.moveTo(position, 0); ctx.lineTo(position, 256); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, position); ctx.lineTo(256, position); ctx.stroke();
    }
  }), width, depth);
}

function sizeTexture(size: string) {
  return canvasTexture(768, 320, (ctx) => {
    ctx.fillStyle = '#34505a';
    ctx.font = '700 160px Manrope, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${size} m²`, 384, 168);
  });
}

function studioTexture() {
  return canvasTexture(1024, 1024, (ctx) => {
    const gradient = ctx.createRadialGradient(512, 512, 80, 512, 512, 510);
    gradient.addColorStop(0, '#e7e4d9');
    gradient.addColorStop(0.55, 'rgb(231 228 217 / 70%)');
    gradient.addColorStop(1, 'rgb(231 228 217 / 0%)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1024, 1024);
    ctx.globalCompositeOperation = 'source-atop';
    ctx.strokeStyle = 'rgb(78 96 95 / 5%)';
    ctx.lineWidth = 1;
    // Half-metre grid on a twelve-metre plane, not a facility floor plan.
    for (let p = 0; p <= 1024; p += 1024 / 24) {
      ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, 1024); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(1024, p); ctx.stroke();
    }
  });
}

function shadowTexture() {
  return canvasTexture(256, 256, (ctx) => {
    const gradient = ctx.createRadialGradient(128, 128, 12, 128, 128, 128);
    gradient.addColorStop(0, 'rgb(25 44 47 / 30%)');
    gradient.addColorStop(0.45, 'rgb(25 44 47 / 17%)');
    gradient.addColorStop(1, 'rgb(25 44 47 / 0%)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
  });
}

function box(width: number, height: number, depth: number, material: Material, x: number, y: number, z: number) {
  const mesh = new Mesh(new BoxGeometry(width, height, depth), material);
  mesh.position.set(x, y, z);
  return mesh;
}

function horizontalPlane(width: number, depth: number, material: Material, y: number) {
  const plane = new Mesh(new PlaneGeometry(width, depth), material);
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = y;
  return plane;
}

function disposeTree(root: Object3D) {
  const geometries = new Set<BufferGeometry>();
  const materials = new Set<Material>();
  const textures = new Set<Texture>();
  root.traverse((child) => {
    if (!(child instanceof Mesh)) return;
    geometries.add(child.geometry);
    for (const material of [child.material].flat() as Material[]) {
      materials.add(material);
      for (const value of Object.values(material)) if (value instanceof Texture) textures.add(value);
    }
  });
  textures.forEach((texture) => texture.dispose());
  materials.forEach((material) => material.dispose());
  geometries.forEach((geometry) => geometry.dispose());
}

function buildUnit({ size, width, depth }: SceneUnit, height: number) {
  const group = new Group();
  const walls: Wall[] = [];
  const front = depth / 2;
  const trim = new MeshStandardMaterial({ color: 0xe0e5df, roughness: 0.64, metalness: 0.12 });
  const blue = new MeshStandardMaterial({ color: navy, roughness: 0.4, metalness: 0.25 });
  const dark = new MeshStandardMaterial({ color: 0x29424a, roughness: 0.85 });
  const accent = new MeshStandardMaterial({ color: yellow, roughness: 0.65 });
  const shadow = horizontalPlane(width + 1.1, depth + 0.85, new MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false }), -0.079);
  const plinth = box(width + 0.14, 0.075, depth + 0.14, trim, 0, -0.038, 0);
  const floor = horizontalPlane(width, depth, new MeshStandardMaterial({ map: floorTexture(width, depth), roughness: 0.96 }), 0.002);
  const labelWidth = Math.min(width * 0.58, 0.95);
  const label = horizontalPlane(labelWidth, labelWidth * 320 / 768, new MeshBasicMaterial({ map: sizeTexture(size), transparent: true, depthWrite: false }), 0.006);
  label.position.set(width * 0.12, 0.006, -depth * 0.35);
  group.add(shadow, plinth, floor, label);

  const addWall = (length: number, x: number, z: number, rotation: number, normal: Vector3) => {
    const wall = new Group();
    wall.position.set(x, 0, z);
    wall.rotation.y = rotation;
    const material = new MeshStandardMaterial({ map: wallTexture(length), roughness: 0.7, metalness: 0.06 });
    wall.add(
      box(length, height, thickness, material, 0, height / 2, 0),
      box(length + thickness, 0.025, thickness + 0.02, trim, 0, height, 0),
      box(length, 0.055, thickness + 0.015, trim, 0, 0.027, 0),
    );
    group.add(wall);
    walls.push({ group: wall, normal });
    // Low rails retain the footprint when the near-side wall is cut away.
    const rail = box(length, 0.06, thickness, trim, x, 0.03, z);
    rail.rotation.y = rotation;
    group.add(rail);
  };
  addWall(width + thickness * 2, 0, -front - thickness / 2, 0, new Vector3(0, 0, -1));
  addWall(depth, -width / 2 - thickness / 2, 0, -Math.PI / 2, new Vector3(-1, 0, 0));
  addWall(depth, width / 2 + thickness / 2, 0, Math.PI / 2, new Vector3(1, 0, 0));

  // Slim guides and an open roller keep the entrance readable from above.
  const opening = width - 0.12;
  const doorTop = height - 0.16;
  const facade = new Group();
  for (const side of [-1, 1]) {
    const x = side * (width / 2 - 0.025);
    facade.add(
      box(0.055, doorTop, 0.07, blue, x, doorTop / 2, front),
      box(0.015, doorTop, 0.025, trim, x - side * 0.02, doorTop / 2, front + 0.044),
    );
  }
  const roll = new Mesh(new CylinderGeometry(0.09, 0.09, opening, 32), blue);
  roll.rotation.z = Math.PI / 2;
  roll.position.set(0, height - 0.09, front - 0.025);
  facade.add(roll);
  for (const side of [-1, 1]) {
    const cap = new Mesh(new CylinderGeometry(0.095, 0.095, 0.012, 24), trim);
    cap.rotation.z = Math.PI / 2;
    cap.position.set(side * (opening / 2 + 0.006), height - 0.09, front - 0.025);
    facade.add(cap);
    for (const radius of [0.068, 0.04]) {
      const coil = new Mesh(new TorusGeometry(radius, 0.003, 4, 24), blue);
      coil.rotation.y = Math.PI / 2;
      coil.position.copy(cap.position);
      coil.position.x += side * 0.008;
      facade.add(coil);
    }
  }
  group.add(
    facade,
    box(opening, 0.012, 0.07, accent, 0, 0.011, front + 0.01),
    box(opening, 0.012, 0.015, dark, 0, 0.01, front - 0.045),
  );
  const objects = createStorageObjects(width, depth);
  group.add(objects);
  return { group, walls, objects, label };
}

function buildPerson() {
  const person = new Group();
  const material = new MeshStandardMaterial({ color: 0x657c88, roughness: 0.95 });
  const limb = (radius: number, length: number, x: number, y: number, tilt = 0) => {
    const mesh = new Mesh(new CapsuleGeometry(radius, length, 5, 12), material);
    mesh.position.set(x, y, 0);
    mesh.rotation.z = tilt;
    person.add(mesh);
    return mesh;
  };
  limb(0.053, 0.69, -0.085, 0.415);
  limb(0.053, 0.69, 0.085, 0.415);
  const torso = new Mesh(new CylinderGeometry(0.16, 0.125, 0.44, 16), material);
  torso.position.y = 1.18;
  torso.scale.z = 0.63;
  person.add(torso);
  limb(0.12, 0.1, 0, 0.91).scale.z = 0.7;
  limb(0.043, 0.48, -0.19, 1.115, -0.07);
  limb(0.043, 0.48, 0.19, 1.115, 0.07);
  limb(0.045, 0.07, 0, 1.435);
  const head = new Mesh(new SphereGeometry(0.11, 20, 16), material);
  head.position.y = 1.59;
  head.scale.z = 0.93;
  person.add(head);
  for (const side of [-1, 1]) {
    person.add(box(0.1, 0.055, 0.18, material, side * 0.085, 0.028, 0.035));
  }
  const shadow = horizontalPlane(0.85, 0.65, new MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false }), -0.076);
  person.add(shadow);
  return person;
}

export function createStorageScene(host: HTMLElement, options: {
  height: number;
  largest: { width: number; depth: number };
  onContextLost: () => void;
  onViewChange: (view: ViewerView) => void;
}) {
  const { height, largest } = options;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = NeutralToneMapping;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.append(renderer.domElement);

  const scene = new Scene();
  const camera = new OrthographicCamera(-3, 3, 3, -3, 0.1, 40);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enablePan = false;
  controls.enableDamping = false;
  controls.minPolarAngle = 0.001;
  controls.maxPolarAngle = 1.36;
  controls.minZoom = 0.75;
  controls.maxZoom = 1.8;
  controls.rotateSpeed = 0.65;
  controls.zoomSpeed = 0.7;

  const sun = new DirectionalLight(0xfffaf0, 2.7);
  sun.position.set(-3, 6, 4);
  const fill = new DirectionalLight(0xdbe9f2, 0.8);
  fill.position.set(4, 3, -3);
  const ground = horizontalPlane(12, 12, new MeshBasicMaterial({ map: studioTexture(), transparent: true, depthWrite: false }), -0.08);
  const person = buildPerson();
  person.rotation.y = 0.18;
  scene.add(new HemisphereLight(0xffffff, 0xd8d0bd, 1.6), sun, fill, ground, person);

  let unit: SceneUnit | null = null;
  let built: ReturnType<typeof buildUnit> | null = null;
  let running = false;
  let disposed = false;
  let frameId = 0;
  let currentView: ViewerView = '3d';
  let objectsVisible = true;
  type CameraMove = { from: Spherical; to: Spherical; fromZoom: number; toZoom: number; start: number };
  let move: CameraMove | null = null;
  const offset = new Vector3();
  const direction = new Vector3();
  const target = new Vector3(-0.28, height * 0.38, 0.08);
  const ease = (t: number) => 1 - (1 - t) ** 3;

  function setView(view: ViewerView) {
    currentView = view;
    options.onViewChange(view);
  }

  function current() {
    return new Spherical().setFromVector3(offset.copy(camera.position).sub(controls.target));
  }

  function applyCamera(position: Spherical, zoom: number) {
    camera.position.setFromSpherical(position).add(controls.target);
    camera.zoom = zoom;
    camera.updateProjectionMatrix();
    controls.update();
  }

  function goTo(to: Spherical, zoom = move?.toZoom ?? camera.zoom) {
    to.makeSafe();
    zoom = Math.max(controls.minZoom, Math.min(controls.maxZoom, zoom));
    const from = current();
    while (to.theta - from.theta > Math.PI) to.theta -= Math.PI * 2;
    while (from.theta - to.theta > Math.PI) to.theta += Math.PI * 2;
    if (reducedMotion.matches) {
      move = null;
      applyCamera(to, zoom);
    } else move = { from, to, fromZoom: camera.zoom, toZoom: zoom, start: performance.now() };
    requestRender();
  }

  function render(now: number) {
    frameId = 0;
    if (!running || disposed) return;
    if (move) {
      const t = reducedMotion.matches ? 1 : Math.min(1, (now - move.start) / 380);
      const k = ease(t);
      applyCamera(new Spherical(
        cameraRadius,
        move.from.phi + (move.to.phi - move.from.phi) * k,
        move.from.theta + (move.to.theta - move.from.theta) * k,
      ), move.fromZoom + (move.toZoom - move.fromZoom) * k);
      if (t === 1) move = null;
    }
    // Hide the near wall rather than painting a transparent surface over the interior.
    camera.getWorldDirection(direction).negate();
    built?.walls.forEach((wall) => { wall.group.visible = direction.dot(wall.normal) < 0.025; });
    person.visible = current().phi > 0.12;
    renderer.render(scene, camera);
    if (move) requestRender();
  }

  function requestRender() {
    if (running && !disposed && !document.hidden && !frameId) frameId = requestAnimationFrame(render);
  }

  function resize() {
    const { clientWidth: width, clientHeight: viewportHeight } = host;
    if (!width || !viewportHeight || disposed) return;
    renderer.setSize(width, viewportHeight, false);
    const aspect = width / viewportHeight;
    // A common orthographic frustum preserves comparison across all six units.
    const horizontalSpan = Math.hypot(largest.width + 0.95, largest.depth + 0.5) + 0.3;
    const verticalSpan = Math.hypot(height, largest.depth) + 1.6;
    const span = Math.max(verticalSpan, horizontalSpan / aspect);
    camera.left = -span * aspect / 2;
    camera.right = span * aspect / 2;
    camera.top = span / 2 - 0.3;
    camera.bottom = -span / 2 - 0.3;
    camera.updateProjectionMatrix();
    requestRender();
  }

  const onGesture = () => {
    move = null;
    setView(current().phi < 0.025 ? 'top' : '3d');
  };
  const onGestureEnd = () => setView(current().phi < 0.025 ? 'top' : '3d');
  const onContextLost = (event: Event) => {
    event.preventDefault();
    options.onContextLost();
  };
  const onVisibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(frameId);
      frameId = 0;
    } else requestRender();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  controls.addEventListener('change', requestRender);
  controls.addEventListener('start', onGesture);
  controls.addEventListener('end', onGestureEnd);
  renderer.domElement.addEventListener('webglcontextlost', onContextLost);
  document.addEventListener('visibilitychange', onVisibility);
  controls.target.copy(target);
  applyCamera(new Spherical(cameraRadius, overview.phi, overview.theta), 1);

  return {
    setUnit(next: SceneUnit) {
      if (unit?.size === next.size || disposed) return;
      if (built) {
        scene.remove(built.group);
        disposeTree(built.group);
      }
      built = buildUnit(next, height);
      built.objects.visible = objectsVisible;
      built.label.visible = !objectsVisible;
      scene.add(built.group);
      unit = next;
      // Keep the reference figure fixed while the footprint changes.
      person.position.set(-largest.width / 2 - 0.45, 0, largest.depth / 2 + 0.15);
      requestRender();
    },
    setObjectsVisible(visible: boolean) {
      objectsVisible = visible;
      if (built) {
        built.objects.visible = visible;
        built.label.visible = !visible;
      }
      requestRender();
    },
    reset() {
      setView('3d');
      goTo(new Spherical(cameraRadius, overview.phi, overview.theta), 1);
    },
    top() {
      setView('top');
      goTo(new Spherical(cameraRadius, 0.001, 0), 1);
    },
    rotate(direction: 1 | -1) {
      const sph = move?.to.clone() ?? current();
      if (currentView === 'top') sph.phi = overview.phi;
      sph.theta += direction * Math.PI / 6;
      setView('3d');
      goTo(sph);
    },
    zoom(factor: number) {
      goTo(move?.to.clone() ?? current(), (move?.toZoom ?? camera.zoom) / factor);
    },
    start() {
      if (disposed) return;
      running = true;
      controls.enabled = true;
      resize();
      requestRender();
    },
    stop() {
      running = false;
      controls.enabled = false;
      cancelAnimationFrame(frameId);
      frameId = 0;
      if (move) {
        applyCamera(move.to, move.toZoom);
        move = null;
      }
    },
    frame() {
      resize();
      move = null;
      controls.target.copy(target);
      applyCamera(new Spherical(cameraRadius, overview.phi, overview.theta), 1);
      setView('3d');
      requestRender();
    },
    dispose() {
      if (disposed) return;
      this.stop();
      disposed = true;
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      controls.dispose();
      disposeTree(scene);
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
