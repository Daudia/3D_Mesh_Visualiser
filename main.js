// main.js
import { createParametricSurface, parametricPresets } from "./parametric.js";
import { FUNCTION_PRESETS, PARAMETRIC_PRESETS } from "./presets.js";

let scene, camera, renderer, mesh;
let rotationSpeed = 0.01;
let cameraDistance = 20;
let cameraAngleX = 0; // angle horizontal (azimut)
let cameraAngleY = 30 * (Math.PI / 180); // angle vertical (élévation) en radians
let currentTexture = "wire_gradient"; // texture par défaut
let wireSegments = 30;
let useColorVariation = true;
let domainRange = 5; // valeur initiale : -10 à +10
let currentMode = "xyz"; // ou "parametric"

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
  renderer.setClearColor(0x111111, 1); // couleur de fond
  document.getElementById("canvasContainer").appendChild(renderer.domElement);

  // Première surface
  createSurface();

  // Réaction au bouton
  document.getElementById("updateBtn").addEventListener("click", () => {
    currentMode = "xyz"; // <-- Ajout

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
  if (currentMode !== "xyz") return; // <-- ne fait rien si on n'est pas en mode xyz

  const expr = document.getElementById("functionInput").value;

  const segments = wireSegments;
  const xRange = domainRange;
  const yRange = domainRange;

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

  const previousRotation = mesh ? mesh.rotation.clone() : null;
  if (mesh) scene.remove(mesh);

  // Appel texture → retourne un mesh
  mesh = applyTextureToMesh(vertices, zValues, segments, zMin, zMax);

  if (previousRotation) {
    mesh.rotation.copy(previousRotation);
  }

  scene.add(mesh);
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

  return new THREE.Mesh(geometry, material);
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

  const baseColorHex = document.getElementById("colorPicker").value;
  const color = new THREE.Color(baseColorHex);

  let finalColor = color;
  if (useColorVariation) {
    const hsl = {};
    color.getHSL(hsl);
    hsl.h = (hsl.h + (Math.random() - 0.5) * 0.1 + 1) % 1;
    hsl.l = THREE.MathUtils.clamp(hsl.l + (Math.random() - 0.5) * 0.1, 0, 1);
    finalColor = new THREE.Color().setHSL(hsl.h, hsl.s, hsl.l);
  }

  const material = new THREE.MeshBasicMaterial({
    color: finalColor,
    wireframe: true,
    side: THREE.DoubleSide,
  });

  return new THREE.Mesh(geometry, material);
}

function createGlitchWireframe(vertices, segments, zMin, zMax) {
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

  return new THREE.LineSegments(edges, material);
}

function createColorWireframe(vertices, segments) {
  const linePositions = [];
  const lineColors = [];

  const baseColorHex = document.getElementById("colorPicker").value;
  const baseColor = new THREE.Color(baseColorHex);
  const hsl = {};
  baseColor.getHSL(hsl);

  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < segments - 1; j++) {
      const idx1 = i * segments + j;
      const idx2 = i * segments + j + 1;
      addLine(vertices, idx1, idx2, hsl);
    }
  }

  for (let j = 0; j < segments; j++) {
    for (let i = 0; i < segments - 1; i++) {
      const idx1 = i * segments + j;
      const idx2 = (i + 1) * segments + j;
      addLine(vertices, idx1, idx2, hsl);
    }
  }

  function addLine(verts, i1, i2, hslBase) {
    linePositions.push(
      verts[i1 * 3],
      verts[i1 * 3 + 1],
      verts[i1 * 3 + 2],
      verts[i2 * 3],
      verts[i2 * 3 + 1],
      verts[i2 * 3 + 2]
    );

    for (let i = 0; i < 2; i++) {
      let color = new THREE.Color().setHSL(hslBase.h, hslBase.s, hslBase.l);
      if (useColorVariation) {
        const variation = (Math.random() - 0.5) * 0.3;
        const l = THREE.MathUtils.clamp(
          hslBase.l + (Math.random() - 0.5) * 0.5,
          0,
          1
        );
        color = new THREE.Color().setHSL(
          (hslBase.h + variation) % 5.0,
          hslBase.s,
          l
        );
      }
      lineColors.push(color.r, color.g, color.b);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(linePositions, 3)
  );
  geometry.setAttribute(
    "color",
    new THREE.Float32BufferAttribute(lineColors, 3)
  );

  const material = new THREE.LineBasicMaterial({ vertexColors: true });

  return new THREE.LineSegments(geometry, material);
}

document.querySelectorAll(".textureBtn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".textureBtn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    const texture = btn.dataset.texture;
    if (texture === "1") currentTexture = "wire_gradient";
    if (texture === "2") currentTexture = "wire_detailled";
    if (texture === "3") currentTexture = "wire_glitch";
    if (texture === "4") currentTexture = "rainbow";
    if (mesh) scene.remove(mesh); // ⬅️ important pour éviter l'empilement
    updateSurface();
  });
});

document.getElementById("wireSegments").addEventListener("input", (e) => {
  wireSegments = parseInt(e.target.value);
  updateSurface();
});

document.getElementById("presetSelect").addEventListener("change", (e) => {
  const expr = e.target.value;
  if (expr) {
    currentMode = "xyz"; // <-- Ajout

    document.getElementById("functionInput").value = expr;
    createSurface();
  }
});

document
  .getElementById("colorVariationToggle")
  .addEventListener("change", (e) => {
    useColorVariation = e.target.checked;
    updateSurface();
  });

const rootStyle = document.documentElement.style;
const colorPicker = document.getElementById("colorPicker");

function updateUIColor() {
  const hex = colorPicker.value;
  rootStyle.setProperty("--ui-base-color", hex);
}

colorPicker.addEventListener("input", () => {
  updateUIColor();
  if (mesh) scene.remove(mesh);
  updateSurface();
});

document.getElementById("colorPicker").addEventListener("input", (e) => {
  const uiPanel = document.getElementById("ui");
  const hex = e.target.value;
  const color = new THREE.Color(hex);
  const hsl = {};
  color.getHSL(hsl);

  // on recalcule une couleur RGBA à partir du HSL avec luminosité + alpha
  const glowColor = `hsla(${Math.floor(hsl.h * 360)}, ${Math.floor(
    hsl.s * 100
  )}%, ${Math.floor(hsl.l * 100)}%, 0.45)`;

  uiPanel.style.setProperty("--haloColor", glowColor);
});

document
  .getElementById("colorPicker")
  .addEventListener("input", updateGlowColor);
updateGlowColor(); // au chargement

function hexToHSL(hex) {
  const c = hex.replace("#", "");
  const bigint = parseInt(c, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  const rPerc = r / 255,
    gPerc = g / 255,
    bPerc = b / 255;
  const max = Math.max(rPerc, gPerc, bPerc);
  const min = Math.min(rPerc, gPerc, bPerc);
  let h,
    s,
    l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rPerc:
        h = (gPerc - bPerc) / d + (gPerc < bPerc ? 6 : 0);
        break;
      case gPerc:
        h = (bPerc - rPerc) / d + 2;
        break;
      case bPerc:
        h = (rPerc - gPerc) / d + 4;
        break;
    }
    h /= 6;
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);
  return { h, s, l };
}

function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;

  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) =>
    Math.round(
      255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))))
    );

  return `#${[f(0), f(8), f(4)]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("")}`;
}

function updateGlowColor() {
  const color = document.getElementById("colorPicker").value;
  document.documentElement.style.setProperty("--glow-color", color);

  const hsl = hexToHSL(color);

  // 🎯 glow-edge = plus clair + saturé
  const lighter = hslToHex(
    hsl.h,
    Math.min(hsl.s + 20, 100),
    Math.min(hsl.l + 20, 100)
  );
  document.documentElement.style.setProperty("--glow-edge", lighter);

  // 🎯 glow-dark = plus sombre + légère dérive chromatique
  const shiftedHue = (hsl.h + 20) % 360; // décalage teinte
  const darker = hslToHex(
    shiftedHue,
    Math.min(hsl.s + 15, 100),
    Math.max(hsl.l - 25, 0)
  );
  document.documentElement.style.setProperty("--glow-dark", darker);
}

function updateThemeColors() {
  const color = document.getElementById("colorPicker").value;

  // Appliquer la couleur de base
  document.documentElement.style.setProperty("--ui-base-color", color);
  document.documentElement.style.setProperty("--glow-color", color);

  // Générer une version plus sombre automatiquement
  const darker = darkenHex(color, 0.6); // plus sombre à ~60%

  document.documentElement.style.setProperty("--ui-base-color-dark", darker);
  document.documentElement.style.setProperty("--glow-dark", darker);

  // Variante claire et saturée (optionnelle pour bord vif)
  const edge = lightenHex(color, 0.3);
  document.documentElement.style.setProperty("--glow-edge", edge);
}

function darkenHex(hex, amount = 0.4) {
  let { r, g, b } = hexToRGB(hex);
  r = Math.floor(r * (1 - amount));
  g = Math.floor(g * (1 - amount));
  b = Math.floor(b * (1 - amount));
  return rgbToHex(r, g, b);
}

function lightenHex(hex, amount = 0.3) {
  let { r, g, b } = hexToRGB(hex);
  r = Math.min(255, Math.floor(r + (255 - r) * amount));
  g = Math.min(255, Math.floor(g + (255 - g) * amount));
  b = Math.min(255, Math.floor(b + (255 - b) * amount));
  return rgbToHex(r, g, b);
}

function hexToRGB(hex) {
  hex = hex.replace("#", "");
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const bigint = parseInt(hex, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

function rgbToHex(r, g, b) {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
}

updateThemeColors();

document.getElementById("colorPicker").addEventListener("input", (e) => {
  const color = e.target.value;
  const svg = document.getElementById("logo-svg");
  if (svg) {
    svg.style.stroke = color;
    svg.style.fill = "none";
  }

  updateUIColor();
  updateGlowColor();
  updateThemeColors();

  if (mesh) scene.remove(mesh);
  updateSurface();
});
document.getElementById("rangeSlider").addEventListener("input", (e) => {
  domainRange = parseFloat(e.target.value);
  updateSurface();
});

document
  .getElementById("generateParametricBtn")
  .addEventListener("click", () => {
    const xExpr = document.getElementById("paramX").value;
    const yExpr = document.getElementById("paramY").value;
    const zExpr = document.getElementById("paramZ").value;

    const uMin = parseFloat(document.getElementById("uMin").value);
    const uMax = parseFloat(document.getElementById("uMax").value);
    const vMin = parseFloat(document.getElementById("vMin").value);
    const vMax = parseFloat(document.getElementById("vMax").value);

    const segments = 100;

    if (mesh) scene.remove(mesh);
    mesh = createParametricSurface({
      xExpr,
      yExpr,
      zExpr,
      uMin,
      uMax,
      vMin,
      vMax,
      segmentsU: segments,
      segmentsV: segments,
    });
    scene.add(mesh);
  });

document
  .getElementById("generateParametricBtn")
  .addEventListener("click", () => {
    if (mesh) scene.remove(mesh);
    createParamSurface();
  });

function createParamSurface() {
  currentMode = "parametric";

  const xExpr = document.getElementById("paramX").value;
  const yExpr = document.getElementById("paramY").value;
  const zExpr = document.getElementById("paramZ").value;

  const uMin = parseFloat(document.getElementById("uMin").value);
  const uMax = parseFloat(document.getElementById("uMax").value);
  const vMin = parseFloat(document.getElementById("vMin").value);
  const vMax = parseFloat(document.getElementById("vMax").value);

  const segments = wireSegments;

  if (mesh) scene.remove(mesh);

  const result = createParametricSurface({
    xExpr,
    yExpr,
    zExpr,
    uMin,
    uMax,
    vMin,
    vMax,
    segmentsU: segments,
    segmentsV: segments,
  });

  mesh = applyTextureToMesh(
    result.vertices,
    result.zValues,
    result.segments,
    result.zMin,
    result.zMax
  );

  scene.add(mesh);
}

function updateSurface() {
  if (mesh) scene.remove(mesh);
  if (currentMode === "xyz") {
    createSurface();
  } else if (currentMode === "parametric") {
    createParamSurface();
  }
}

function applyTextureToMesh(vertices, zValues, segments, zMin, zMax) {
  switch (currentTexture) {
    case "rainbow":
      return createRainbowTexture(vertices, zValues, segments, zMin, zMax);
    case "wire_detailled":
      return createWireframeTexture(vertices, segments);
    case "wire_glitch":
      return createGlitchWireframe(vertices, segments, zMin, zMax);
    case "wire_gradient":
      return createColorWireframe(vertices, segments);
    default:
      console.warn("Texture inconnue :", currentTexture);
      return null;
  }
}
function populateXYZPresets() {
  const select = document.getElementById("presetSelect");
  FUNCTION_PRESETS.forEach((preset) => {
    const option = document.createElement("option");
    option.value = preset.value;
    option.textContent = preset.name;
    select.appendChild(option);
  });
}
populateXYZPresets();

function populateParametricPresets() {
  const select = document.getElementById("presetParamSelect");
  PARAMETRIC_PRESETS.forEach((preset) => {
    const option = document.createElement("option");
    option.value = preset.name;
    option.textContent = preset.name;
    select.appendChild(option);
  });
}
populateParametricPresets();

document.getElementById("presetParamSelect").addEventListener("change", (e) => {
  const selected = PARAMETRIC_PRESETS.find((p) => p.name === e.target.value);
  if (!selected) return;

  // Mise à jour des champs
  document.getElementById("paramX").value = selected.x;
  document.getElementById("paramY").value = selected.y;
  document.getElementById("paramZ").value = selected.z;

  document.getElementById("uMin").value = selected.uMin;
  document.getElementById("uMax").value = selected.uMax;
  document.getElementById("vMin").value = selected.vMin;
  document.getElementById("vMax").value = selected.vMax;

  // Génération directe
  currentMode = "parametric";
  createParamSurface();
});
