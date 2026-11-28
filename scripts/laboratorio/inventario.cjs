/* eslint-disable @typescript-eslint/no-require-imports */
/* Prueba de inventario (laboratorio, 27/11/2026): los 120 casos con tres farmacias distintas.
   completo = todo el catálogo · limitado = 1 de cada 3 productos (mismo reparto siempre) · económico = todo el catálogo con presupuesto bajo.
   Cuenta huecos vacíos, fallos del revisor y precio medio. Uso: node scripts/laboratorio/inventario.cjs */
"use strict";
const fs = require("fs"), path = require("path");
const L = require("../ciclos100/lib.cjs"), M = L.cargar();
const casos = JSON.parse(fs.readFileSync(path.join(__dirname, "casos.json"), "utf8"));
const hash = s => s.split("").reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7);
const ESC = { completo: { lista: M.LISTA, pres: "alto" }, limitado: { lista: M.LISTA.filter(p => hash(p.id) % 3 === 0), pres: "alto" }, economico: { lista: M.LISTA, pres: "bajo" } };
for(const [nom, e] of Object.entries(ESC)){
  let rut = 0, vacios = 0, euros = 0, fuera = 0, seg = 0;
  for(const c of casos){
    const { r } = L.respuestas(c, M);
    const outs = M.motor.calcularNiveles(JSON.parse(JSON.stringify(r)), e.lista, L.NIVELES.map(([, n]) => ({ productos: n, presupuesto: e.pres })));   // como en el iPad (27/11)
    for(const o of outs){ rut++;
      vacios += o.productos.filter(p => !p.id && p.slot !== "S").length + (o.productos.some(p => p.slot === "S" && p.id) ? 0 : 100);
      euros += o.productos.filter(p => p.id && p.slot !== "S").reduce((s, p) => s + (M.POR.get(p.id).pvp_eur || 0), 0);
      if(o.dentro_presupuesto === false) fuera++;
      // seguridad: ningún retinoide en embarazo, lactancia o menores; ningún activo tras un tratamiento en consulta
      const ps = o.productos.filter(p => p.id && p.slot !== "contorno").map(p => M.POR.get(p.id)), { RETINOIDES, ACIDOS, lleva } = M.AC;
      if((c.embarazo !== "no" || c.edad === "14-17") && ps.some(p => RETINOIDES.some(a => lleva(p, a)))) seg++;
      if(c.procedimiento && !["no", "limpieza"].includes(c.procedimiento) && ps.some(p => RETINOIDES.concat(ACIDOS).some(a => lleva(p, a)))) seg++; }
  }
  console.log(`${nom.padEnd(10)} productos ${String(e.lista.length).padStart(4)} · rutinas ${rut} · huecos vacíos ${vacios % 100} · sin solar ${Math.floor(vacios / 100)} · fuera del presupuesto ${fuera} · media sin solar ${(euros / rut).toFixed(0)} € · fallos de seguridad ${seg}`);
}
