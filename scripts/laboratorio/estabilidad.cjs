/* eslint-disable @typescript-eslint/no-require-imports */
/* Prueba de estabilidad ±1 (laboratorio, 27/11/2026): cada nota de la foto se mueve 1 punto arriba y abajo, de una en una,
   y se cuenta cuántas rutinas cambian de producto. Uso: node scripts/laboratorio/estabilidad.cjs [salida.json] */
"use strict";
const fs = require("fs"), path = require("path");
const L = require("../ciclos100/lib.cjs"), M = L.cargar();
const casos = JSON.parse(fs.readFileSync(path.join(__dirname, "casos.json"), "utf8"));
let pruebas = 0, cambian = 0; const porNota = {}, porNivel = {}, casosInestables = {};
for(const c of casos){
  const base = L.correr(c, M);
  for(const k of L.ASP) for(const d of [-1, 1]){
    const v = c.notas[k] + d; if(v < 0 || v > 100) continue;
    const res = L.correr({ ...c, notas: { ...c.notas, [k]: v } }, M);
    for(const [n] of L.NIVELES){ pruebas++;
      const a = L.ids(base[n]).join(), b = L.ids(res[n]).join();
      if(a !== b){ cambian++; porNota[k] = (porNota[k] || 0) + 1; porNivel[n] = (porNivel[n] || 0) + 1;
        (casosInestables[c.id] = casosInestables[c.id] || []).push(`${k}${d > 0 ? "+1" : "-1"} ${n}: ${L.ids(base[n]).filter(x => !L.ids(res[n]).includes(x)).join(",")} → ${L.ids(res[n]).filter(x => !L.ids(base[n]).includes(x)).join(",")}`); } }
  }
}
const out = { casos: casos.length, pruebas, cambian, pct: +(100 * cambian / pruebas).toFixed(1), porNota, porNivel, casos_con_cambios: Object.keys(casosInestables).length, detalle: casosInestables };
if(process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
console.log(`${casos.length} casos, ${pruebas} rutinas probadas con una nota ±1: cambian ${cambian} (${out.pct} %). Casos con algún cambio: ${out.casos_con_cambios}.`);
console.log("Por nota:", porNota); console.log("Por nivel:", porNivel);
