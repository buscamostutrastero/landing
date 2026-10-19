import test from 'node:test';
import assert from 'node:assert/strict';
import { Box3, Mesh, Vector3 } from 'three';
import { objectDimensions, storageExampleForSize } from '../src/lib/storage-examples.mjs';
import { createBicycle, createDresser, createSofa, createLargeStorageExample } from '../src/scripts/storage-reference-objects.mjs';

const epsilon = 1e-6;
const bounds = (object) => new Box3().setFromObject(object, true);
const closeTo = (actual, expected) => assert.ok(Math.abs(actual - expected) < epsilon, `${actual} should equal ${expected}`);

function dispose(root) {
  const geometry = new Set();
  const materials = new Set();
  root.traverse((object) => {
    if (object instanceof Mesh) {
      geometry.add(object.geometry);
      for (const material of [object.material].flat()) materials.add(material);
    }
  });
  geometry.forEach((item) => item.dispose());
  materials.forEach((item) => item.dispose());
}

test('reference geometry matches the advertised object dimensions without rescaling', () => {
  for (const [create, expected] of [
    [createBicycle, [0.62, 1.1, 1.8]],
    [createDresser, [0.8, 0.78, 0.48]],
    [createSofa, [1.9, 0.83, 0.95]],
  ]) {
    const object = create();
    const measured = bounds(object);
    measured.getSize(new Vector3()).toArray().forEach((value, index) => closeTo(value, expected[index]));
    closeTo(measured.min.y, 0);
    object.traverse((child) => {
      assert.deepEqual(child.scale.toArray(), [1, 1, 1]);
      if (child instanceof Mesh) {
        assert.ok([...child.geometry.getAttribute('position').array].every(Number.isFinite));
      }
    });
    dispose(object);
  }
});

test('the adult bicycle has two full-size wheels touching the floor', () => {
  const bicycle = createBicycle();
  const tires = bicycle.children.filter((child) => child.name === 'bicycle-tire');
  assert.equal(tires.length, 2);
  for (const tire of tires) {
    const box = bounds(tire);
    closeTo(box.min.y, 0);
    closeTo(box.max.y, 0.7);
  }
  closeTo(tires[1].position.z - tires[0].position.z, 1.1);
  dispose(bicycle);
});

for (const { size, width, depth, example, names } of [
  { size: '3', width: 1.5, depth: 2, example: 'bike-dresser', names: ['example-bicycle', 'example-dresser', 'example-floor-boxes'] },
  { size: '3,5', width: 1.75, depth: 2, example: 'bike-sofa', names: ['example-bicycle', 'example-sofa'] },
]) {
  test(`${size} m² uses its intended example, fully contained and without overlapping objects`, () => {
    assert.equal(storageExampleForSize(size).id, example);
    const contents = createLargeStorageExample(width, depth, example);
    assert.deepEqual(contents.children.map((child) => child.name), names);
    const boxes = contents.children.map(bounds);
    for (const box of boxes) {
      assert.ok(box.min.x >= -width / 2 + 0.049);
      assert.ok(box.max.x <= width / 2 - 0.049);
      assert.ok(box.min.z >= -depth / 2 + 0.049);
      assert.ok(box.max.z <= depth / 2 - 0.049);
      assert.ok(box.min.y >= -epsilon && box.max.y < 2.2);
    }
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) assert.ok(!boxes[i].intersectsBox(boxes[j]));
    }
    const bicycle = contents.getObjectByName('example-bicycle');
    const bicycleSize = bounds(bicycle).getSize(new Vector3());
    closeTo(bicycleSize.x, objectDimensions.bicycle.width);
    closeTo(bicycleSize.z, objectDimensions.bicycle.depth);
    closeTo(bicycleSize.y, objectDimensions.bicycle.height);
    for (const object of contents.children) closeTo(bounds(object).min.y, 0.003);
    dispose(contents);
  });
}

test('smaller rooms keep the boxes example; large objects are never shrunk into an incompatible room', () => {
  for (const size of ['1', '1,5', '2', '2,5']) assert.equal(storageExampleForSize(size).id, 'boxes');
  assert.throws(() => createLargeStorageExample(1.1, 2, 'bike-dresser'), RangeError);
  assert.throws(() => createLargeStorageExample(1.5, 2, 'bike-sofa'), RangeError);
  assert.throws(() => createLargeStorageExample(1.75, 1.8, 'bike-sofa'), RangeError);
  assert.throws(() => createLargeStorageExample(2, 2, 'unknown'), RangeError);
  assert.throws(() => createLargeStorageExample(NaN, 2, 'bike-sofa'), RangeError);
  assert.throws(() => createLargeStorageExample(2, Infinity, 'bike-sofa'), RangeError);
});
