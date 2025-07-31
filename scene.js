import * as THREE from "three";

export let scene, camera, renderer;
let cameraDistance = 20;
let cameraAngleX = 0;
let cameraAngleY = 30 * (Math.PI / 180);

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
  camera.lookAt(0, 0, 0);

  // Lumière
  const light = new THREE.PointLight(0xffffff, 1);
  light.position.set(10, 10, 10);
  scene.add(light);

  // Rendu
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x111111, 1);
  document.getElementById("canvasContainer").appendChild(renderer.domElement);

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

  if (camera && renderer && scene) {
    camera.position.x =
      cameraDistance * Math.sin(cameraAngleX) * Math.cos(cameraAngleY);
    camera.position.y = cameraDistance * Math.sin(cameraAngleY);
    camera.position.z =
      cameraDistance * Math.cos(cameraAngleX) * Math.cos(cameraAngleY);
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }
}

// Expose setters
export function setCameraDistance(d) {
  cameraDistance = d;
}

export function setCameraAngles(angleX, angleY) {
  cameraAngleX = angleX;
  cameraAngleY = angleY;
}
