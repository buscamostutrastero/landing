import { BoxGeometry, CylinderGeometry, Group, Mesh, MeshStandardMaterial, TorusGeometry, Vector3 } from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { objectDimensions } from '../lib/storage-examples.mjs';

/** @param {number} w @param {number} h @param {number} d @param {import('three').Material} material @param {number} x @param {number} y @param {number} z @param {number} [radius] */
function block(w, h, d, material, x, y, z, radius = 0) {
  const mesh = new Mesh(radius ? new RoundedBoxGeometry(w, h, d, 2, radius) : new BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  return mesh;
}

/** @param {number[]} a @param {number[]} b @param {number} radius @param {import('three').Material} material */
function rod(a, b, radius, material) {
  const start = new Vector3(...a);
  const end = new Vector3(...b);
  const direction = end.clone().sub(start);
  const mesh = new Mesh(new CylinderGeometry(radius, radius, direction.length(), 8), material);
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), direction.normalize());
  return mesh;
}

/** Adult bicycle on its wheels. The handlebar remains at its full reference width. */
export function createBicycle() {
  const bicycle = new Group();
  bicycle.name = 'example-bicycle';
  const { width, depth, height } = objectDimensions.bicycle;
  const frame = new MeshStandardMaterial({ color: 0xe4b33d, roughness: 0.5, metalness: 0.25 });
  const rubber = new MeshStandardMaterial({ color: 0x33414a, roughness: 0.94 });
  const metal = new MeshStandardMaterial({ color: 0xadb8ba, roughness: 0.4, metalness: 0.65 });
  const wheelRadius = 0.35;
  const axleOffset = depth / 2 - wheelRadius;
  for (const z of [-axleOffset, axleOffset]) {
    const tire = new Mesh(new TorusGeometry(wheelRadius - 0.025, 0.025, 8, 40), rubber);
    tire.name = 'bicycle-tire';
    tire.rotation.y = Math.PI / 2;
    tire.position.set(0, wheelRadius, z);
    const rim = new Mesh(new TorusGeometry(0.305, 0.008, 4, 40), metal);
    rim.rotation.y = Math.PI / 2;
    rim.position.copy(tire.position);
    bicycle.add(tire, rim, rod([-0.045, wheelRadius, z], [0.045, wheelRadius, z], 0.023, metal));
    for (let i = 0; i < 8; i++) {
      const angle = i * Math.PI / 4;
      bicycle.add(rod([0, wheelRadius, z], [0, wheelRadius + Math.sin(angle) * 0.3, z + Math.cos(angle) * 0.3], 0.002, metal));
    }
  }
  const rear = [0, wheelRadius, -axleOffset];
  const crank = [0, 0.3, -0.1];
  const seat = [0, 0.73, -0.19];
  const head = [0, 0.88, 0.3];
  const fork = [0, 0.6, 0.39];
  const front = [0, wheelRadius, axleOffset];
  for (const [a, b] of [[rear, crank], [rear, seat], [crank, seat], [seat, head], [head, crank], [head, fork], [fork, front]]) {
    bicycle.add(rod(a, b, 0.018, frame));
  }
  const barY = height - 0.018;
  bicycle.add(
    rod(seat, [0, 0.94, -0.19], 0.012, metal),
    block(0.16, 0.06, 0.25, rubber, 0, 0.96, -0.2, 0.025),
    rod(head, [0, barY, 0.38], 0.014, metal),
    rod([-width / 2, barY, 0.38], [width / 2, barY, 0.38], 0.014, metal),
    rod([-width / 2, barY, 0.38], [-width / 2 + 0.1, barY, 0.38], 0.018, rubber),
    rod([width / 2 - 0.1, barY, 0.38], [width / 2, barY, 0.38], 0.018, rubber),
    rod([-0.14, 0.31, -0.1], [0.14, 0.31, -0.1], 0.012, metal),
    block(0.08, 0.025, 0.09, rubber, -0.14, 0.25, -0.1),
    block(0.08, 0.025, 0.09, rubber, 0.14, 0.37, -0.1),
    rod([-0.02, 0.3, -0.12], [-0.16, 0.012, -0.25], 0.007, metal),
  );
  const chainring = new Mesh(new TorusGeometry(0.075, 0.008, 4, 24), metal);
  chainring.rotation.y = Math.PI / 2;
  chainring.position.set(0.045, 0.3, -0.1);
  bicycle.add(chainring);
  return bicycle;
}

/** Generic two-seat sofa; reference envelope from IKEA KIVIK, without branding. */
export function createSofa() {
  const sofa = new Group();
  sofa.name = 'example-sofa';
  const { width, depth, height } = objectDimensions.sofa;
  const fabric = new MeshStandardMaterial({ color: 0x8fa39c, roughness: 0.96 });
  const cushions = new MeshStandardMaterial({ color: 0xa1b3a9, roughness: 0.98 });
  const feet = new MeshStandardMaterial({ color: 0x78644d, roughness: 0.85 });
  for (const x of [-width / 2 + 0.12, width / 2 - 0.12]) {
    for (const z of [-depth / 2 + 0.12, depth / 2 - 0.12]) sofa.add(block(0.07, 0.08, 0.07, feet, x, 0.04, z));
  }
  sofa.add(
    block(width - 0.04, 0.3, depth - 0.04, fabric, 0, 0.23, 0, 0.025),
    block(width, 0.47, 0.18, fabric, 0, height - 0.235, -depth / 2 + 0.09, 0.035),
  );
  for (const side of [-1, 1]) {
    sofa.add(
      block(0.25, 0.47, depth, fabric, side * (width / 2 - 0.125), 0.315, 0, 0.035),
      block(0.695, 0.1, 0.6, cushions, side * 0.35, 0.4, 0.08, 0.035),
      block(0.695, 0.34, 0.17, cushions, side * 0.35, 0.61, -0.27, 0.035),
    );
  }
  return sofa;
}

/** Generic three-drawer chest; reference envelope from IKEA MALM. */
export function createDresser() {
  const dresser = new Group();
  dresser.name = 'example-dresser';
  const { width, depth, height } = objectDimensions.dresser;
  const wood = new MeshStandardMaterial({ color: 0xc9ad83, roughness: 0.85 });
  const fronts = new MeshStandardMaterial({ color: 0xe7d5b4, roughness: 0.9 });
  const handles = new MeshStandardMaterial({ color: 0x59666a, roughness: 0.6 });
  dresser.add(
    block(width - 0.04, 0.06, depth - 0.04, wood, 0, 0.03, 0),
    block(width, height - 0.06, depth - 0.02, wood, 0, (height + 0.06) / 2, -0.01),
    block(width, 0.025, depth, fronts, 0, height - 0.0125, 0),
  );
  for (const y of [0.18, 0.415, 0.65]) {
    dresser.add(
      block(width - 0.05, 0.204, 0.012, fronts, 0, y, depth / 2 - 0.01),
      block(0.2, 0.012, 0.004, handles, 0, y + 0.058, depth / 2 - 0.002),
    );
  }
  return dresser;
}

function createFloorBoxes() {
  const boxes = new Group();
  boxes.name = 'example-floor-boxes';
  const cardboard = new MeshStandardMaterial({ color: 0xc9a36a, roughness: 0.95 });
  const tape = new MeshStandardMaterial({ color: 0xe9d5ac, roughness: 0.85 });
  const label = new MeshStandardMaterial({ color: 0xf4f0e8, roughness: 0.95 });
  for (const { w, h, d, y } of [{ w: 0.4, h: 0.32, d: 0.31, y: 0 }, { w: 0.34, h: 0.27, d: 0.28, y: 0.322 }]) {
    boxes.add(
      block(w, h, d, cardboard, 0, y + h / 2, 0, 0.005),
      block(0.045, 0.002, d - 0.006, tape, 0, y + h + 0.001, 0),
      block(w * 0.28, h * 0.2, 0.002, label, -w * 0.2, y + h * 0.4, d / 2 + 0.001),
    );
  }
  return boxes;
}

/** @param {number} width @param {number} depth @param {string} example */
export function createLargeStorageExample(width, depth, example) {
  const furniture = example === 'bike-dresser' ? objectDimensions.dresser : objectDimensions.sofa;
  // Two 5 cm wall margins and at least 3 cm between the reference envelopes.
  const minimumWidth = furniture.depth + objectDimensions.bicycle.width + 0.13;
  const minimumDepth = Math.max(objectDimensions.bicycle.depth, example === 'bike-sofa' ? furniture.width : 0) + 0.1;
  if (!['bike-dresser', 'bike-sofa'].includes(example) || !Number.isFinite(width) || !Number.isFinite(depth) || width < minimumWidth || depth < minimumDepth) {
    throw new RangeError('The reference objects require their full-size illustrative room.');
  }
  const contents = new Group();
  contents.name = 'storage-example';
  const bicycle = createBicycle();
  bicycle.position.set(width / 2 - 0.05 - objectDimensions.bicycle.width / 2, 0.003, 0);
  contents.add(bicycle);
  if (example === 'bike-sofa') {
    const sofa = createSofa();
    sofa.rotation.y = Math.PI / 2;
    sofa.position.set(-width / 2 + 0.05 + objectDimensions.sofa.depth / 2, 0.003, 0);
    contents.add(sofa);
  } else {
    const dresser = createDresser();
    dresser.rotation.y = Math.PI / 2;
    dresser.position.set(-width / 2 + 0.05 + objectDimensions.dresser.depth / 2, 0.003, -depth / 2 + 0.05 + objectDimensions.dresser.width / 2);
    const boxes = createFloorBoxes();
    boxes.position.set(dresser.position.x, 0.003, depth / 2 - 0.4);
    contents.add(dresser, boxes);
  }
  return contents;
}
