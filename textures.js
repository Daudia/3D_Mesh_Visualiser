let useColorVariation = true;
export let animatedMaterial = null;
export let animatedGeometry = null;

export function setUseColorVariation(value) {
  useColorVariation = value;
}

function createPlainColorMesh(vertices, zValues, segments, zMin, zMax) {
  const geometry = new THREE.BufferGeometry();

  const colors = [];
  const baseColorHex = document.getElementById("colorPicker").value;
  const baseColor = new THREE.Color(baseColorHex);
  const hsl = {};
  baseColor.getHSL(hsl);

  for (let i = 0; i < zValues.length; i++) {
    const z = zValues[i];
    const t = (z - zMin) / (zMax - zMin); // Normalisation 0 → 1

    let h = hsl.h;
    let s = hsl.s;
    let l = THREE.MathUtils.clamp(hsl.l * (0.5 + 0.5 * t), 0, 1); // dégradé en luminosité

    if (useColorVariation) {
      h = (h + (Math.random() - 0.5) * 0.05 + 1) % 1;
      l = THREE.MathUtils.clamp(l + (Math.random() - 0.5) * 0.1, 0, 1);
    }

    const color = new THREE.Color().setHSL(h, s, l);
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

function createAnimatedRainbowMesh(vertices, zValues, segments, zMin, zMax) {
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

  const colors = [];
  for (let i = 0; i < zValues.length; i++) {
    const z = zValues[i];
    const t = (z - zMin) / (zMax - zMin);
    const hue = t;
    const color = new THREE.Color().setHSL(hue, 1.0, 0.5);
    colors.push(color.r, color.g, color.b);
  }

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3)
  );
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  animatedGeometry = geometry; // pour animation

  animatedMaterial = new THREE.MeshBasicMaterial({
    vertexColors: true,
    side: THREE.DoubleSide,
  });

  return new THREE.Mesh(geometry, animatedMaterial);
}

export function applyTextureToMesh(
  vertices,
  zValues,
  segments,
  zMin,
  zMax,
  currentTexture
) {
  switch (currentTexture) {
    case "plain_color":
      return createPlainColorMesh(vertices, zValues, segments, zMin, zMax);
    case "rainbow":
      return createRainbowTexture(vertices, zValues, segments, zMin, zMax);
    case "wire_detailled":
      return createWireframeTexture(vertices, segments);
    case "wire_glitch":
      return createGlitchWireframe(vertices, segments, zMin, zMax);
    case "wire_gradient":
      return createColorWireframe(vertices, segments);
    case "animated_rainbow":
      return createAnimatedRainbowMesh(vertices, zValues, segments, zMin, zMax);
    default:
      console.warn("Texture inconnue :", currentTexture);
      return null;
  }
}
