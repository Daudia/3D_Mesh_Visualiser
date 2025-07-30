// main.js

let scene, camera, renderer, mesh;
let rotationSpeed = 0.01;
let cameraDistance = 10;
let cameraAngleX = 0; // angle horizontal (azimut)
let cameraAngleY = 30 * (Math.PI / 180); // angle vertical (élévation) en radians
let currentTexture = "wire_white"; // texture par défaut
let wireSegments = 30;
let heightScale = 1; // Échelle verticale

init();
animate();

function init() {
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
  renderer.setClearColor(0x000000);
  document.getElementById("canvasContainer").appendChild(renderer.domElement);

  // Première surface
  createSurface();

  // Réaction au bouton
  document.getElementById("updateBtn").addEventListener("click", () => {
    if (mesh) scene.remove(mesh);
    createSurface();
  });

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

function createSurface() {
  const expr = document.getElementById("functionInput").value;

  const segments = 100;
  const xRange = 5;
  const yRange = 5;

  const vertices = [];
  const zValues = [];

  function parseFunction(str) {
    return new Function("x", "y", `return ${str};`);
  }

  let func;
  try {
    func = parseFunction(expr);
  } catch (e) {
    alert("Erreur dans l'expression : " + e.message);
    return;
  }

  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < segments; j++) {
      const x = (i / (segments - 1)) * xRange * 2 - xRange;
      const y = (j / (segments - 1)) * yRange * 2 - yRange;
      const z = func(x, y);
      vertices.push(x, z, y);
      zValues.push(z);
    }
  }

  const zMin = Math.min(...zValues);
  const zMax = Math.max(...zValues);

  // Choix de la texture
  if (currentTexture === "rainbow") {
    createRainbowTexture(vertices, zValues, segments, zMin, zMax);
  } else if (currentTexture === "wire_white") {
    createWireframeTexture(vertices, segments);
  } else if (currentTexture === "wire_color") {
    createColorWireframe(vertices, zValues, segments, zMin, zMax);
  }
}

function animate() {
  requestAnimationFrame(animate);
  if (mesh) mesh.rotation.y += rotationSpeed;

  // Mise à jour dynamique de la position de caméra
  camera.position.x =
    cameraDistance * Math.sin(cameraAngleX) * Math.cos(cameraAngleY);
  camera.position.y = cameraDistance * Math.sin(cameraAngleY);
  camera.position.z =
    cameraDistance * Math.cos(cameraAngleX) * Math.cos(cameraAngleY);
  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);
}

const uiPanel = document.getElementById("ui");
const toggleBtn = document.getElementById("toggleMenuBtn");
const showBtn = document.getElementById("showMenuBtn");

toggleBtn.addEventListener("click", () => {
  uiPanel.style.display = "none";
  showBtn.style.display = "block";
});

showBtn.addEventListener("click", () => {
  uiPanel.style.display = "block";
  showBtn.style.display = "none";
});

// Contrôles de la caméra
document.getElementById("zoomControl").addEventListener("input", (e) => {
  cameraDistance = parseFloat(e.target.value);
});

document.getElementById("camX").addEventListener("input", (e) => {
  cameraAngleX = parseFloat(e.target.value) * (Math.PI / 180); // en degrés → radians
});

document.getElementById("camY").addEventListener("input", (e) => {
  cameraAngleY = parseFloat(e.target.value) * (Math.PI / 180);
});

// Vitesse de rotation
document.getElementById("rotationSpeed").addEventListener("input", (e) => {
  rotationSpeed = parseFloat(e.target.value);
});

function createRainbowTexture(vertices, zValues, segments, zMin, zMax) {
  const geometry = new THREE.BufferGeometry();
  const colors = [];

  for (let i = 0; i < vertices.length / 3; i++) {
    const z = zValues[i];
    const t = (z - zMin) / (zMax - zMin); // Normalisation
    const hue = t; // teinte sur 0.0 → 1.0
    const color = new THREE.Color().setHSL(hue, 1.0, 0.5); // saturation 100%, luminosité 50%
    colors.push(color.r, color.g, color.b);
  }

  const indices = [];
  for (let i = 0; i < segments - 1; i++) {
    for (let j = 0; j < segments - 1; j++) {
      const a = i * segments + j;
      const b = a + 1;
      const c = a + segments;
      const d = c + 1;
      indices.push(a, b, d, a, d, c);
    }
  }

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3)
  );
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const material = new THREE.MeshBasicMaterial({
    vertexColors: true,
    side: THREE.DoubleSide,
  });

  if (mesh) scene.remove(mesh);
  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
}

function createWireframeTexture(vertices, segments) {
  const geometry = new THREE.BufferGeometry();

  const indices = [];
  for (let i = 0; i < segments - 1; i++) {
    for (let j = 0; j < segments - 1; j++) {
      const a = i * segments + j;
      const b = a + 1;
      const c = a + segments;
      const d = c + 1;
      indices.push(a, b, d, a, d, c);
    }
  }

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3)
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    wireframe: true,
    side: THREE.DoubleSide,
  });

  if (mesh) scene.remove(mesh);
  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
}

function createColorWireframe(vertices, zValues, segments, zMin, zMax) {
  const geometry = new THREE.BufferGeometry();

  const indices = [];
  for (let i = 0; i < segments - 1; i++) {
    for (let j = 0; j < segments - 1; j++) {
      const a = i * segments + j;
      const b = a + 1;
      const c = a + segments;
      const d = c + 1;
      indices.push(a, b, d, a, d, c);
    }
  }

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3)
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const edges = new THREE.EdgesGeometry(geometry);
  const lineColors = [];
  const position = geometry.attributes.position;
  const vertexCount = edges.attributes.position.count;

  for (let i = 0; i < vertexCount; i++) {
    const z = position.getZ(i % position.count);
    const t = (z - zMin) / (zMax - zMin);
    const hue = 0.7 + 0.2 * t;
    const color = new THREE.Color().setHSL(hue % 1.0, 1.0, 0.6);
    lineColors.push(color.r, color.g, color.b);
  }

  edges.setAttribute("color", new THREE.Float32BufferAttribute(lineColors, 3));

  const material = new THREE.LineBasicMaterial({
    vertexColors: true,
  });

  if (mesh) scene.remove(mesh);
  mesh = new THREE.LineSegments(edges, material);
  scene.add(mesh);
}

document.querySelectorAll(".textureBtn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".textureBtn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    const texture = btn.dataset.texture;
    if (texture === "1") currentTexture = "rainbow";
    if (texture === "2") currentTexture = "wire_white";
    if (texture === "3") currentTexture = "wire_color";

    if (mesh) scene.remove(mesh); // ⬅️ important pour éviter l'empilement
    createSurface();
  });
});

document.getElementById("wireSegments").addEventListener("input", (e) => {
  wireSegments = parseInt(e.target.value);
  if (currentTexture === "wire_overlay") {
    createSurface(); // Recrée le mesh avec nouveau wireframe
  }
});

document.getElementById("presetSelect").addEventListener("change", (e) => {
  const expr = e.target.value;
  if (expr) {
    document.getElementById("functionInput").value = expr;
    usePresetWormhole = false;
    createSurface();
  }
});
