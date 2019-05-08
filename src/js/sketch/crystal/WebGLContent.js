import * as THREE from 'three';
import MathEx from 'js-util/MathEx';
import sleep from 'js-util/sleep';

import PromiseTextureLoader from '../../common/PromiseTextureLoader';
import PromiseOBJLoader from '../../common/PromiseOBJLoader';

import ForcePerspectiveCamera from './ForcePerspectiveCamera';
import Crystal from './Crystal';
import CrystalSparkle from './CrystalSparkle';
import Background from './Background';

// ==========
// Define common variables
//
const canvas = document.getElementById('canvas-webgl');
const renderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: true,
  canvas: canvas,
});
const scene = new THREE.Scene();
const camera = new ForcePerspectiveCamera();
const cameraResolution = new THREE.Vector2();
const clock = new THREE.Clock({
  autoStart: false
});

// For the preloader.
const preloader = document.querySelector('.p-preloader');

// ==========
// Define unique variables
//
const COUNT = 12;
const crystals = [];
const crystalSparkles = [];

// ==========
// Define functions
//
const resizeCamera = (resolution) => {
  if (resolution.x > resolution.y) {
    cameraResolution.set(
      (resolution.x >= 1200) ? 1200 : resolution.x,
      (resolution.x >= 1200) ? 800 : resolution.x * 0.66,
    );
  } else {
    cameraResolution.set(
      ((resolution.y >= 1200) ? 800 : resolution.y * 0.66) * 0.6,
      ((resolution.y >= 1200) ? 1200 : resolution.y) * 0.6,
    );
  }
  camera.setViewOffset(
    cameraResolution.x,
    cameraResolution.y,
    (resolution.x - cameraResolution.x) / -2,
    (resolution.y - cameraResolution.y) / -2,
    resolution.x,
    resolution.y
  );
  camera.updateProjectionMatrix();
};

export default class WebGLContent {
  constructor() {
  }
  async init() {
    renderer.setClearColor(0x0e0e0e, 1.0);

    camera.aspect = 3 / 2;
    camera.far = 1000;
    camera.setFocalLength(50);

    let crystalGeometries;
    let crystalNormalMap;
    let crystalSurfaceTex;

    await Promise.all([
      PromiseOBJLoader('/sketch-threejs/model/crystal/crystal.obj'),
      PromiseTextureLoader('/sketch-threejs/img/sketch/crystal/normal.jpg'),
      PromiseTextureLoader('/sketch-threejs/img/sketch/crystal/surface.jpg'),
    ]).then((response) => {
      crystalGeometries = response[0].children.map((mesh) => {
        return mesh.geometry;
      });
      crystalNormalMap = response[1];
      crystalSurfaceTex = response[2];
    });

    for (var i = 0; i < COUNT; i++) {
      const radian = MathEx.radians(i / COUNT * 360);
      crystals[i] = new Crystal(crystalGeometries[i % 3]);
      crystals[i].position.set(
        Math.cos(radian) * 30,
        0,
        Math.sin(radian) * 30
      );
      crystals[i].start(i / COUNT, crystalNormalMap, crystalSurfaceTex);
      scene.add(crystals[i]);
      // crystalSparkles[i] = new CrystalSparkle();
      // scene.add(crystalSparkles[i]);
    }

    let index = 0;
    camera.lookAnchor.copy(crystals[index % COUNT].position);
    setInterval(() => {
      index++;
      camera.lookAnchor.copy(crystals[index % COUNT].position);
    }, 3000);
  }
  start() {
    this.play();
  }
  stop() {
    this.pause();
  }
  play() {
    clock.start();
    this.update();
  }
  pause() {
    clock.stop();
  }
  update() {
    const time = clock.getDelta();

    // Update each objects.
    for (var i = 0; i < crystals.length; i++) {
      crystals[i].update(time);
    }
    camera.update();

    // Render the 3D scene.
    renderer.render(scene, camera);

    // When the clock is stopped, it stops the all rendering too.
    if (clock.running === false) return;

    // Iterate the rendering.
    requestAnimationFrame(() => {
      this.update();
    });
  }
  resize(resolution) {
    canvas.width = resolution.x;
    canvas.height = resolution.y;
    resizeCamera(resolution);
    renderer.setSize(resolution.x, resolution.y);
  }
}
