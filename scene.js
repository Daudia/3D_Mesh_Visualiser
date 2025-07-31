import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export let scene, camera, renderer;
let cameraDistance = 20;
let cameraAngleX = 0;
let cameraAngleY = 30 * (Math.PI / 180);
let controls;

export function initScene({ onRender }) {
  scene = new THREE.Scene();

  // Caméra
  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0, 5, 10);

  // Lumière
  const light = new THREE.PointLight(0xffffff, 1);
  light.position.set(10, 10, 10);
  scene.add(light);

  // Rendu
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x111111, 1);
  document.getElementById("canvasContainer").appendChild(renderer.domElement);

  // Contrôles souris
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; // pour une rotation plus fluide
  controls.dampingFactor = 0.05;

  controls.enablePan = true; // clic droit pour translater
  controls.enableZoom = true; // molette pour zoomer
  controls.rotateSpeed = 0.5;
  controls.zoomSpeed = 0.5;
  controls.panSpeed = 0.5;

  window.addEventListener("resize", updateSceneSize);

  animateLoop(onRender);
}

export function updateSceneSize() {
  if (!camera || !renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animateLoop(onRender) {
  requestAnimationFrame(() => animateLoop(onRender));

  if (onRender) onRender();

  if (controls) controls.update(); // important !

  if (camera && renderer && scene) {
    renderer.render(scene, camera);
  }
}
