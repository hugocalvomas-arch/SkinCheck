/* eslint-disable @typescript-eslint/no-require-imports */
/* Prueba de seguimiento a 4 semanas (laboratorio, 27/11/2026). Simula la vuelta de cada clienta:
   las dos notas más bajas suben 6 puntos (mejora modesta), el resto ±1, y si la rutina llevaba retinoide ahora lo usa «reciente».
   Mide cuántos productos se mantienen (continuidad), si el retinoide sigue o se cambia, y si aparece algún activo vetado. */
"use strict";
const fs = require("fs"), path = require("path");
const L = require("../ciclos100/lib.cjs"), M = L.cargar();
const casos = JSON.parse(fs.readFileSync(path.join(__dirname, "casos.json"), "utf8"));
const { RETINOIDES, lleva } = M.AC;
let rut = 0, mant = 0, tot = 0, cambiaTodo = 0, retSigue = 0, retAntes = 0, retCambia = 0, seg = 0, mas = 0, menos = 0;
for(const c of casos){
  if(c.procedimiento && c.procedimiento !== "no") continue;   // tras un tratamiento en consulta la vuelta es otro caso
  const a = L.correr(c, M);
  const bajas = L.ASP.filter(k => k !== "ojeras").sort((x, y) => c.notas[x] - c.notas[y]).slice(0, 2);
  const notas = Object.fromEntries(L.ASP.map((k, i) => [k, Math.min(100, c.notas[k] + (bajas.includes(k) ? 6 : (i % 2 ? 1 : -1)))]));
  for(const [n] of L.NIVELES){
    const ia = L.ids(a[n]).map(x => x.split("{")[0]), conRet = ia.some(id => { const p = M.POR.get(id.split(":").pop()); return p && RETINOIDES.some(k => lleva(p, k)); });
    const c2 = { ...c, id: c.id + "-4s", notas, retinoide: conRet && c.retinoide === "nunca" ? "reciente" : c.retinoide };
    const b = L.correr(c2, M), ib = L.ids(b[n]).map(x => x.split("{")[0]);
    rut++; tot += ia.length; const k = ia.filter(x => ib.includes(x)).length; mant += k; if(k <= 1) cambiaTodo++;
    if(ib.length > ia.length) mas++; else if(ib.length < ia.length) menos++;
    if(conRet){ retAntes++; const r2 = ib.find(id => { const p = M.POR.get(id.split(":").pop()); return p && RETINOIDES.some(q => lleva(p, q)); }); if(r2 && ia.includes(r2)) retSigue++; else if(r2) retCambia++; }
    if((c.embarazo !== "no" || c.edad === "14-17") && ib.some(id => { const p = M.POR.get(id.split(":").pop()); return p && RETINOIDES.some(q => lleva(p, q)); })) seg++;
  }
}
console.log(`${rut} rutinas a las 4 semanas: se mantienen ${mant} de ${tot} productos (${(100 * mant / tot).toFixed(0)} %). Cambian casi enteras (≤1 producto igual): ${cambiaTodo}.`);
console.log(`Más productos: ${mas} · menos: ${menos}. Con retinoide antes: ${retAntes} → sigue el mismo ${retSigue}, se cambia por otro ${retCambia}, desaparece ${retAntes - retSigue - retCambia}. Fallos de seguridad: ${seg}.`);
