// main.js
import { createParametricSurface } from "./parametric.js";
import { FUNCTION_PRESETS, PARAMETRIC_PRESETS } from "./presets.js";
import {
  applyTextureToMesh,
  animatedGeometry,
  setUseColorVariation,
} from "./textures.js";

import {
  initScene,
  scene,
  setCameraDistance,
  setCameraAngles,
} from "./scene.js";

import {
  darkenHex,
  lightenHex,
  hexToHSL,
  hslToHex,
} from "./color-manipulation.js";

let mesh;
let rotationSpeed = 0;

let cameraAngleX = 0;
let cameraAngleY = 30 * (Math.PI / 180);
let currentTexture = "wire_gradient";
let wireSegments = 30;
let domainRange = 5;
let currentMode = "xyz";
let morphT = 0;
let animatedMeshTime = 0;
let offsetX = 0;
let offsetY = 0;
let animateXY = false;
let moveOnX = true;
let moveOnY = false;
let moveSpeed = 0;

const textureMap = {
  1: "wire_gradient",
  2: "wire_detailled",
  3: "wire_glitch",
  4: "rainbow",
  5: "animated_rainbow",
  6: "plain_color",
};

const DOM = {
  uiPanel: document.getElementById("ui"),
  toggleBtn: document.getElementById("toggleMenuBtn"),
  showBtn: document.getElementById("showMenuBtn"),
  colorPicker: document.getElementById("colorPicker"),
  morphValue: document.getElementById("morphValue"),
  functionInput: document.getElementById("functionInput"),
  functionInput2: document.getElementById("functionInput2"),
  paramX: document.getElementById("paramX"),
  paramY: document.getElementById("paramY"),
  paramZ: document.getElementById("paramZ"),
  uMin: document.getElementById("uMin"),
  uMax: document.getElementById("uMax"),
  vMin: document.getElementById("vMin"),
  vMax: document.getElementById("vMax"),
  presetSelect: document.getElementById("presetSelect"),
  presetParamSelect: document.getElementById("presetParamSelect"),
  moveToggle: document.getElementById("moveToggle"),
  moveX: document.getElementById("moveX"),
  moveY: document.getElementById("moveY"),
  moveSpeed: document.getElementById("moveSpeed"),
  rangeSlider: document.getElementById("rangeSlider"),
  wireSegments: document.getElementById("wireSegments"),
  rotationSpeed: document.getElementById("rotationSpeed"),
  colorVariationToggle: document.getElementById("colorVariationToggle"),
  canvasContainer: document.getElementById("canvasContainer"),
  morphSlider: document.getElementById("morphSlider"),
  updateXYZBtn: document.getElementById("updateXYZBtn"),
  updateParamBtn: document.getElementById("updateParamBtn"),
  resetOffsetBtn: document.getElementById("resetOffsetBtn"),
  camX: document.getElementById("camX"),
  camY: document.getElementById("camY"),
  zoomControl: document.getElementById("zoomControl"),
  rootStyle: document.documentElement.style,
};

initScene({
  onRender: () => {
    if (mesh) mesh.rotation.y += rotationSpeed;

    if (currentTexture === "animated_rainbow" && animatedGeometry) {
      animatedMeshTime += 0.01;

      const colors = animatedGeometry.attributes.color.array;
      const z = animatedGeometry.attributes.position.array;

      for (let i = 0; i < colors.length / 3; i++) {
        const zi = z[i * 3 + 1];
        const t = 0.5 + 0.5 * Math.sin(zi * 2 + animatedMeshTime);
        const color = new THREE.Color().setHSL(t, 1.0, 0.5);
        colors[i * 3 + 0] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
      }

      animatedGeometry.attributes.color.needsUpdate = true;
    }

    if (animateXY && currentMode === "xyz") {
      if (moveOnX) offsetX += moveSpeed * 0.01;
      if (moveOnY) offsetY += moveSpeed * 0.01;
      regenerateSurface();
    }
  },
});

initializeApp();
setupUIEvents();

function initXYZSurfaceIfNeeded() {
  const input = DOM.functionInput;
  if (input && input.value.trim()) {
    currentMode = "xyz";
    generateXYZSurface();
  }
}

function initializeApp() {
  updateGlowColor();
  updateThemeColors();
  populateXYZPresets();
  populateParametricPresets();
  initXYZSurfaceIfNeeded();
}

function generateXYZSurface() {
  if (currentMode !== "xyz") return; // <-- ne fait rien si on n'est pas en mode xyz

  const expr1 = DOM.functionInput.value;
  const expr2 = DOM.functionInput2 ? DOM.functionInput2.value : expr1; // fallback

  let func1, func2;
  try {
    func1 = new Function("x", "y", `return ${expr1};`);
    func2 = new Function("x", "y", `return ${expr2};`);
  } catch (e) {
    alert("Erreur dans une expression : " + e.message);
    return;
  }

  const segments = wireSegments;
  const xRange = domainRange;
  const yRange = domainRange;

  const vertices = [];
  const zValues = [];

  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < segments; j++) {
      const x = (i / (segments - 1)) * xRange * 2 - xRange;
      const y = (j / (segments - 1)) * yRange * 2 - yRange;

      const z1 = func1(x + offsetX, y + offsetY);
      const z2 = func2(x + offsetX, y + offsetY);
      const z = (1 - morphT) * z1 + morphT * z2;
      vertices.push(x, z, y);
      zValues.push(z);
    }
  }

  const zMin = Math.min(...zValues);
  const zMax = Math.max(...zValues);

  const previousRotation = mesh ? mesh.rotation.clone() : null;
  if (mesh) scene.remove(mesh);

  // Appel texture → retourne un mesh
  mesh = applyTextureToMesh(
    vertices,
    zValues,
    segments,
    zMin,
    zMax,
    currentTexture
  );
  mesh.position.set(0, 0, 0);

  if (previousRotation) {
    mesh.rotation.copy(previousRotation);
  }

  scene.add(mesh);
}

function generateParametricSurface() {
  currentMode = "parametric";

  const xExpr = DOM.paramX.value;
  const yExpr = DOM.paramY.value;
  const zExpr = DOM.paramZ.value;

  const uMin = parseFloat(DOM.uMin.value);
  const uMax = parseFloat(DOM.uMax.value);
  const vMin = parseFloat(DOM.vMin.value);
  const vMax = parseFloat(DOM.vMax.value);

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
    result.zMax,
    currentTexture
  );

  scene.add(mesh);
}

function regenerateSurface() {
  if (mesh) scene.remove(mesh);
  if (currentMode === "xyz") {
    generateXYZSurface();
  } else if (currentMode === "parametric") {
    generateParametricSurface();
  }
}

function updateUIColor() {
  const hex = DOM.colorPicker.value;
  DOM.rootStyle.setProperty("--ui-base-color", hex);
}

function updateGlowColor() {
  const color = DOM.colorPicker.value;
  document.documentElement.style.setProperty("--glow-color", color);

  const hsl = hexToHSL(color);

  const lighter = hslToHex(
    hsl.h,
    Math.min(hsl.s + 20, 100),
    Math.min(hsl.l + 20, 100)
  );
  document.documentElement.style.setProperty("--glow-edge", lighter);

  const shiftedHue = (hsl.h + 20) % 360;
  const darker = hslToHex(
    shiftedHue,
    Math.min(hsl.s + 15, 100),
    Math.max(hsl.l - 25, 0)
  );
  document.documentElement.style.setProperty("--glow-dark", darker);
}

function updateThemeColors() {
  const color = DOM.colorPicker.value;

  document.documentElement.style.setProperty("--ui-base-color", color);
  document.documentElement.style.setProperty("--glow-color", color);

  const darker = darkenHex(color, 0.6);

  document.documentElement.style.setProperty("--ui-base-color-dark", darker);
  document.documentElement.style.setProperty("--glow-dark", darker);

  const edge = lightenHex(color, 0.3);
  document.documentElement.style.setProperty("--glow-edge", edge);
}

function populateXYZPresets() {
  const select = DOM.presetSelect;
  FUNCTION_PRESETS.forEach((preset) => {
    const option = document.createElement("option");
    option.value = preset.value;
    option.textContent = preset.name;
    select.appendChild(option);
  });
}

function populateParametricPresets() {
  const select = DOM.presetParamSelect;
  PARAMETRIC_PRESETS.forEach((preset) => {
    const option = document.createElement("option");
    option.value = preset.name;
    option.textContent = preset.name;
    select.appendChild(option);
  });
}

function setupUIEvents() {
  setupCameraControls();
  setupMovementControls();
  setupTextureControls();
  setupHideUIControls();
  setupAnimationControls();
  setupFunctionsControls();
}

function setupCameraControls() {
  DOM.zoomControl.addEventListener("input", (e) => {
    setCameraDistance(parseFloat(e.target.value));
  });

  DOM.camX.addEventListener("input", (e) => {
    cameraAngleX = parseFloat(e.target.value) * (Math.PI / 180);
    setCameraAngles(cameraAngleX, cameraAngleY);
  });

  DOM.camY.addEventListener("input", (e) => {
    cameraAngleY = parseFloat(e.target.value) * (Math.PI / 180);
    setCameraAngles(cameraAngleX, cameraAngleY);
  });
}

function setupMovementControls() {
  DOM.moveToggle.addEventListener("change", (e) => {
    animateXY = e.target.checked;
  });

  DOM.moveX.addEventListener("change", (e) => {
    moveOnX = e.target.checked;
  });

  DOM.moveY.addEventListener("change", (e) => {
    moveOnY = e.target.checked;
  });

  DOM.moveSpeed.addEventListener("input", (e) => {
    moveSpeed = parseFloat(e.target.value);
  });

  DOM.resetOffsetBtn.addEventListener("click", () => {
    offsetX = 0;
    offsetY = 0;
    regenerateSurface();
  });
}

function setupTextureControls() {
  document.querySelectorAll(".textureBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".textureBtn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const texture = btn.dataset.texture;
      currentTexture = textureMap[texture] || currentTexture;

      if (mesh) scene.remove(mesh);
      regenerateSurface();
    });
  });

  DOM.colorVariationToggle.addEventListener("change", (e) => {
    setUseColorVariation(e.target.checked);
    regenerateSurface();
  });

  DOM.colorPicker.addEventListener("input", (e) => {
    const hex = e.target.value;
    const color = new THREE.Color(hex);
    const hsl = {};
    color.getHSL(hsl);

    updateUIColor();
    updateGlowColor();
    updateThemeColors();

    const svg = DOM.logoSvg;
    if (svg) {
      svg.style.stroke = hex;
      svg.style.fill = "none";
    }

    if (mesh) scene.remove(mesh);
    regenerateSurface();
  });
}

function setupHideUIControls() {
  DOM.toggleBtn.addEventListener("click", () => {
    DOM.uiPanel.style.display = "none";
    DOM.showBtn.style.display = "block";
  });

  DOM.showBtn.addEventListener("click", () => {
    DOM.uiPanel.style.display = "block";
    DOM.showBtn.style.display = "none";
  });
}

function setupAnimationControls() {
  DOM.rotationSpeed.addEventListener("input", (e) => {
    rotationSpeed = parseFloat(e.target.value);
  });
  DOM.rangeSlider.addEventListener("input", (e) => {
    domainRange = parseFloat(e.target.value);
    regenerateSurface();
  });
  DOM.morphSlider.addEventListener("input", (e) => {
    morphT = parseFloat(e.target.value);
    DOM.morphValue.textContent = morphT.toFixed(2);
    if (currentMode === "xyz") regenerateSurface();
  });
  DOM.wireSegments.addEventListener("input", (e) => {
    wireSegments = parseInt(e.target.value);
    regenerateSurface();
  });
}

function setupFunctionsControls() {
  DOM.updateXYZBtn.addEventListener("click", () => {
    currentMode = "xyz";
    regenerateSurface();
  });
  DOM.presetSelect.addEventListener("change", (e) => {
    const expr = e.target.value;
    offsetX = 0;
    offsetY = 0;
    if (expr) {
      currentMode = "xyz";

      DOM.functionInput.value = expr;
      generateXYZSurface();
    }
  });

  ["uMin", "uMax", "vMin", "vMax"].forEach((id) => {
    document.getElementById(id).addEventListener("input", () => {
      currentMode = "parametric";
      generateParametricSurface();
    });
  });
  DOM.updateParamBtn.addEventListener("click", () => {
    if (mesh) scene.remove(mesh);
    generateParametricSurface();
  });
  DOM.presetParamSelect.addEventListener("change", (e) => {
    const selected = PARAMETRIC_PRESETS.find((p) => p.name === e.target.value);
    if (!selected) return;

    DOM.paramX.value = selected.x;
    DOM.paramY.value = selected.y;
    DOM.paramZ.value = selected.z;

    DOM.uMin.value = selected.uMin;
    DOM.uMax.value = selected.uMax;
    DOM.vMin.value = selected.vMin;
    DOM.vMax.value = selected.vMax;

    currentMode = "parametric";
    generateParametricSurface();
  });
}
