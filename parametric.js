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
