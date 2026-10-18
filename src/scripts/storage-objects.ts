import { BoxGeometry, CylinderGeometry, Group, Mesh, MeshStandardMaterial, type Material } from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

function block(width: number, height: number, depth: number, material: Material, x: number, y: number, z: number, radius = 0) {
  const geometry = radius
    ? new RoundedBoxGeometry(width, height, depth, 2, radius)
    : new BoxGeometry(width, height, depth);
  const mesh = new Mesh(geometry, material);
  mesh.position.set(x, y, z);
  return mesh;
}

/** Fixed-size illustrative props, shared by every room size; not a capacity calculation. */
export function createStorageObjects(width: number, depth: number) {
  const contents = new Group();
  contents.name = 'storage-example';
  const steel = new MeshStandardMaterial({ color: 0x687f85, roughness: 0.5, metalness: 0.4 });
  const wood = new MeshStandardMaterial({ color: 0xc8b28b, roughness: 0.94 });
  const cardboard = new MeshStandardMaterial({ color: 0xc69b61, roughness: 0.95 });
  const lightCardboard = new MeshStandardMaterial({ color: 0xd9b982, roughness: 0.96 });
  const tape = new MeshStandardMaterial({ color: 0xe6cf9d, roughness: 0.75 });
  const paper = new MeshStandardMaterial({ color: 0xf5f1e8, roughness: 0.95 });
  const ink = new MeshStandardMaterial({ color: 0x63584b, roughness: 0.95 });
  const plastic = new MeshStandardMaterial({ color: 0xe2e4dc, roughness: 0.7 });
  const blue = new MeshStandardMaterial({ color: 0x426474, roughness: 0.82 });
  const rubber = new MeshStandardMaterial({ color: 0x34434a, roughness: 0.92 });

  const carton = (w: number, h: number, d: number, light = false) => {
    const group = new Group();
    group.add(
      block(w, h, d, light ? lightCardboard : cardboard, 0, h / 2, 0, 0.005),
      block(0.045, 0.002, d - 0.006, tape, 0, h + 0.001, 0),
      block(0.045, h * 0.32, 0.002, tape, 0, h * 0.84, d / 2 + 0.001),
      block(w * 0.29, h * 0.2, 0.002, paper, -w * 0.2, h * 0.38, d / 2 + 0.001),
      block(w * 0.16, 0.006, 0.003, ink, -w * 0.2, h * 0.4, d / 2 + 0.002),
      block(w * 0.11, 0.004, 0.003, ink, -w * 0.22, h * 0.35, d / 2 + 0.002),
    );
    return group;
  };

  const rack = new Group();
  rack.name = 'example-shelf';
  rack.position.set(-width / 2 + 0.44, 0.003, -depth / 2 + 0.205);
  // 78 × 33 cm footprint and 1.65 m uprights, identical in every room.
  for (const x of [-0.375, 0.375]) {
    for (const z of [-0.15, 0.15]) rack.add(block(0.025, 1.65, 0.025, steel, x, 0.825, z));
  }
  const levels = [0.1, 0.55, 1, 1.45];
  for (const y of levels) {
    rack.add(
      block(0.78, 0.023, 0.33, wood, 0, y, 0),
      block(0.78, 0.03, 0.018, steel, 0, y - 0.015, 0.158),
    );
  }
  for (const direction of [-1, 1]) {
    const brace = block(0.012, Math.hypot(0.72, 1.35), 0.009, steel, 0, 0.825, -0.152);
    brace.rotation.z = direction * Math.atan2(0.72, 1.35);
    rack.add(brace);
  }
  const shelvedCartons = [
    { x: -0.18, y: 0.113, w: 0.3, h: 0.28, d: 0.25, light: false },
    { x: 0.18, y: 0.113, w: 0.3, h: 0.25, d: 0.25, light: true },
    { x: -0.17, y: 1.013, w: 0.32, h: 0.3, d: 0.25, light: true },
    { x: 0.18, y: 1.013, w: 0.26, h: 0.23, d: 0.25, light: false },
    { x: -0.1, y: 1.463, w: 0.34, h: 0.19, d: 0.25, light: false },
  ];
  for (const { x, y, w, h, d, light } of shelvedCartons) {
    const cartonGroup = carton(w, h, d, light);
    cartonGroup.position.set(x, y, 0.005);
    rack.add(cartonGroup);
  }
  rack.add(
    block(0.54, 0.24, 0.265, plastic, 0, 0.682, 0.005, 0.015),
    block(0.56, 0.025, 0.28, blue, 0, 0.815, 0.005, 0.007),
    block(0.11, 0.025, 0.008, rubber, 0, 0.72, 0.142),
  );

  const boxes = new Group();
  boxes.name = 'example-floor-boxes';
  boxes.position.set(width / 2 - 0.245, 0.003, depth / 2 - 0.24);
  const bottom = carton(0.4, 0.32, 0.31);
  const top = carton(0.34, 0.27, 0.28, true);
  top.position.y = 0.322;
  boxes.add(bottom, top);

  const suitcase = new Group();
  suitcase.name = 'example-suitcase';
  suitcase.position.set(-width / 2 + 0.23, 0, depth / 2 - 0.2);
  suitcase.add(
    block(0.33, 0.49, 0.22, blue, 0, 0.3, 0, 0.035),
    block(0.335, 0.015, 0.224, rubber, 0, 0.3, 0, 0.005),
    block(0.012, 0.18, 0.012, steel, -0.055, 0.63, -0.05),
    block(0.012, 0.18, 0.012, steel, 0.055, 0.63, -0.05),
    block(0.14, 0.025, 0.035, rubber, 0, 0.725, -0.05, 0.01),
    block(0.09, 0.025, 0.045, rubber, 0, 0.55, 0, 0.01),
  );
  for (const x of [-0.11, -0.055, 0, 0.055, 0.11]) {
    suitcase.add(block(0.008, 0.33, 0.007, rubber, x, 0.3, 0.112, 0.003));
  }
  for (const x of [-0.12, 0.12]) {
    const wheel = new Mesh(new CylinderGeometry(0.025, 0.025, 0.035, 12), rubber);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 0.028, 0.055);
    suitcase.add(wheel);
  }

  contents.add(rack, boxes, suitcase);
  return contents;
}
