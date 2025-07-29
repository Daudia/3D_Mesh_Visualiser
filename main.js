// main.js

let scene, camera, renderer, mesh;
let rotationSpeed = 0.01;

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
  document.body.appendChild(renderer.domElement);

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
  const geometry = new THREE.BufferGeometry();

  const size = 100;
  const segments = 100;
  const vertices = [];
  const colors = [];

  const xRange = 5;
  const yRange = 5;

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

      const hue = 0.7 + 0.3 * Math.sin(z * 2); // variation chromatique
      const color = new THREE.Color().setHSL(hue, 1.0, 0.5);
      colors.push(color.r, color.g, color.b);
    }
  }

  const indices = [];
  for (let i = 0; i < segments - 1; i++) {
    for (let j = 0; j < segments - 1; j++) {
      const a = i * segments + j;
      const b = a + 1;
      const c = a + segments;
      const d = c + 1;

      indices.push(a, b, d);
      indices.push(a, d, c);
    }
  }

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3)
  );
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const material = new THREE.MeshPhongMaterial({
    vertexColors: true,
    side: THREE.DoubleSide,
    shininess: 100,
    emissive: 0x111111,
    specular: 0xffffff,
  });

  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // Texture buttons toggle
  const textureButtons = document.querySelectorAll(".textureBtn");

  // Par défaut, activer Option 1
  document
    .querySelector('.textureBtn[data-texture="1"]')
    .classList.add("active");

  textureButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      textureButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const textureOption = btn.dataset.texture;
      console.log("Texture sélectionnée :", textureOption);
      // Tu peux appeler ici une fonction pour changer de texture plus tard
    });
  });
}

function animate() {
  requestAnimationFrame(animate);
  if (mesh) mesh.rotation.y += rotationSpeed;
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

function playDisperseEffect(onComplete) {
  const ui = document.getElementById("ui");
  const rect = ui.getBoundingClientRect();

  // Crée le conteneur
  const fragmentContainer = document.createElement("div");
  fragmentContainer.classList.add("ui-fragmented");
  document.body.appendChild(fragmentContainer);

  const cols = 6;
  const rows = 6;
  const total = cols * rows;

  for (let i = 0; i < total; i++) {
    const piece = document.createElement("div");
    piece.classList.add("ui-piece");

    // style individualisé
    piece.style.animationDelay = `${Math.random() * 0.5}s`;
    piece.style.background = getComputedStyle(ui).backgroundColor;
    fragmentContainer.appendChild(piece);

    // Ajoute la classe pour déclencher l’animation
    requestAnimationFrame(() => {
      piece.classList.add("animate-out");
      const dx = (Math.random() - 0.5) * 100;
      const dy = (Math.random() - 0.5) * 100;
      piece.style.transform = `translate(${dx}px, ${dy}px) scale(0.7) rotate(${
        (Math.random() - 0.5) * 30
      }deg)`;
      piece.style.filter = `blur(5px)`;
      piece.style.opacity = 0;
    });
  }

  // Attendre la fin de l'effet (~1s) avant d'appeler onComplete
  setTimeout(() => {
    fragmentContainer.remove();
    onComplete();
  }, 1000);
}
