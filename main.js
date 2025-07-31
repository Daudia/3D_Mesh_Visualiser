// main.js
import * as THREE from "three";

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
let useTime = false;
let time = 0;
let timeStep = 0.01;
let expressionError = false;
let compiledFunc1 = null;
let compiledFunc2 = null;
const USER_XYZ_KEY = "user_xyz_presets";
const USER_PARAM_KEY = "user_param_presets";

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
  timeCheckbox: document.getElementById("useTime"),
  timeStep: document.getElementById("timeStep"),
  resetTimeBtn: document.getElementById("resetTimeBtn"),
  saveXYZPresetBtn: document.getElementById("saveXYZPresetBtn"),
  userXYZPresets: document.getElementById("userXYZPresets"),
  saveParamPresetBtn: document.getElementById("saveParamPresetBtn"),
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

    if (animateXY && currentMode === "xyz" && !expressionError) {
      if (moveOnX) offsetX += moveSpeed * 0.01;
      if (moveOnY) offsetY += moveSpeed * 0.01;
      regenerateSurface();
    }

    if (useTime && currentMode === "xyz" && !expressionError) {
      time += timeStep;
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
  compiledFunc1 = new Function(
    "x",
    "y",
    "t",
    `return ${DOM.functionInput.value};`
  );
  compiledFunc2 = new Function("x", "y", "t", `return 0;`);
  initXYZSurfaceIfNeeded();
}

function loadUserPresets(key) {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

function saveUserPresets(key, presets) {
  localStorage.setItem(key, JSON.stringify(presets));
}

function generateXYZSurface() {
  if (currentMode !== "xyz" || !compiledFunc1 || !compiledFunc2) return;

  const segments = wireSegments;
  const xRange = domainRange;
  const yRange = domainRange;

  const vertices = [];
  const zValues = [];

  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < segments; j++) {
      const x = (i / (segments - 1)) * xRange * 2 - xRange;
      const y = (j / (segments - 1)) * yRange * 2 - yRange;

      const z1 = compiledFunc1(x + offsetX, y + offsetY, useTime ? time : 0);
      const z2 = compiledFunc2(x + offsetX, y + offsetY, useTime ? time : 0);
      const z = (1 - morphT) * z1 + morphT * z2;
      vertices.push(x, z, y);
      zValues.push(z);
    }
  }

  const zMin = Math.min(...zValues);
  const zMax = Math.max(...zValues);

  const previousRotation = mesh ? mesh.rotation.clone() : null;
  if (mesh) scene.remove(mesh);

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
  setupSaveControls();
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
    animateXY = false;
    DOM.moveToggle.checked = false;
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
    try {
      compiledFunc1 = new Function(
        "x",
        "y",
        "t",
        `return ${DOM.functionInput.value};`
      );
      compiledFunc2 = new Function(
        "x",
        "y",
        "t",
        `return ${DOM.functionInput2.value || DOM.functionInput.value};`
      );
      expressionError = false;

      currentMode = "xyz";
      regenerateSurface();
    } catch (e) {
      expressionError = true;
      alert("Erreur dans une des fonctions : " + e.message);
    }
  });

  DOM.timeCheckbox.addEventListener("change", (e) => {
    useTime = e.target.checked;
  });

  DOM.timeStep.addEventListener("input", (e) => {
    timeStep = parseFloat(e.target.value);
  });

  DOM.resetTimeBtn.addEventListener("click", () => {
    time = 0;
    useTime = false;
    DOM.timeCheckbox.checked = false;
    regenerateSurface();
  });

  DOM.presetSelect.addEventListener("change", (e) => {
    const expr = e.target.value;
    offsetX = 0;
    offsetY = 0;
    if (expr) {
      currentMode = "xyz";

      DOM.functionInput.value = expr;

      try {
        compiledFunc1 = new Function("x", "y", "t", `return ${expr};`);
        compiledFunc2 = new Function("x", "y", "t", `return 0;`);
        expressionError = false;
        generateXYZSurface();
      } catch (err) {
        expressionError = true;
      }
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

function setupSaveControls() {
  DOM.saveXYZPresetBtn = document.getElementById("saveXYZPresetBtn");
  DOM.userXYZPresets = document.getElementById("userXYZPresets");

  DOM.saveParamPresetBtn = document.getElementById("saveParamPresetBtn");
  DOM.userParamPresets = document.getElementById("userParamPresets");

  DOM.saveXYZPresetBtn.addEventListener("click", () => {
    const name = prompt("Preset name:");
    if (!name) return;

    const preset = {
      name,
      value1: DOM.functionInput.value,
      value2: DOM.functionInput2.value,
    };

    const existing = loadUserPresets(USER_XYZ_KEY);
    existing.push(preset);
    saveUserPresets(USER_XYZ_KEY, existing);
    populateUserXYZPresets();
  });

  DOM.userXYZPresets.addEventListener("change", (e) => {
    const selected = loadUserPresets(USER_XYZ_KEY).find(
      (p) => p.name === e.target.value
    );
    if (!selected) return;

    DOM.functionInput.value = selected.value1;
    DOM.functionInput2.value = selected.value2;
    DOM.updateXYZBtn.click();
  });
  DOM.saveParamPresetBtn.addEventListener("click", () => {
    const name = prompt("Preset name:");
    if (!name) return;

    const preset = {
      name,
      x: DOM.paramX.value,
      y: DOM.paramY.value,
      z: DOM.paramZ.value,
      uMin: DOM.uMin.value,
      uMax: DOM.uMax.value,
      vMin: DOM.vMin.value,
      vMax: DOM.vMax.value,
    };

    const existing = loadUserPresets(USER_PARAM_KEY);
    existing.push(preset);
    saveUserPresets(USER_PARAM_KEY, existing);
    populateUserParamPresets();
  });

  DOM.userParamPresets.addEventListener("change", (e) => {
    const selected = loadUserPresets(USER_PARAM_KEY).find(
      (p) => p.name === e.target.value
    );
    if (!selected) return;

    DOM.paramX.value = selected.x;
    DOM.paramY.value = selected.y;
    DOM.paramZ.value = selected.z;
    DOM.uMin.value = selected.uMin;
    DOM.uMax.value = selected.uMax;
    DOM.vMin.value = selected.vMin;
    DOM.vMax.value = selected.vMax;

    DOM.updateParamBtn.click();
  });
}
