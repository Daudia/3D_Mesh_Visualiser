// parametric.js

export function createParametricSurface({
  xExpr,
  yExpr,
  zExpr,
  uMin,
  uMax,
  vMin,
  vMax,
  segmentsU,
  segmentsV,
}) {
  const vertices = [];
  const zValues = [];

  const fx = new Function("u", "v", `return ${xExpr};`);
  const fy = new Function("u", "v", `return ${yExpr};`);
  const fz = new Function("u", "v", `return ${zExpr};`);

  for (let i = 0; i < segmentsU; i++) {
    for (let j = 0; j < segmentsV; j++) {
      const u = uMin + (i / (segmentsU - 1)) * (uMax - uMin);
      const v = vMin + (j / (segmentsV - 1)) * (vMax - vMin);
      const x = fx(u, v);
      const y = fy(u, v);
      const z = fz(u, v);
      vertices.push(x, z, y); // Note : Y et Z sont inversés pour correspondre à ton système
      zValues.push(z);
    }
  }

  const zMin = Math.min(...zValues);
  const zMax = Math.max(...zValues);

  return {
    vertices,
    zValues,
    zMin,
    zMax,
    segments: segmentsU, // nécessaire pour recréer les indices ou mesh
  };
}

export const parametricPresets = [
  {
    name: "Tore",
    x: "(2 + Math.cos(v)) * Math.cos(u)",
    y: "(2 + Math.cos(v)) * Math.sin(u)",
    z: "Math.sin(v)",
    uRange: [0, 2 * Math.PI],
    vRange: [0, 2 * Math.PI],
  },
  {
    name: "Sphère",
    x: "Math.sin(v) * Math.cos(u)",
    y: "Math.sin(v) * Math.sin(u)",
    z: "Math.cos(v)",
    uRange: [0, 2 * Math.PI],
    vRange: [0, Math.PI],
  },
  {
    name: "Hélicoïde",
    x: "u * Math.cos(v)",
    y: "u * Math.sin(v)",
    z: "v",
    uRange: [0, 2],
    vRange: [0, 4 * Math.PI],
  },
];
