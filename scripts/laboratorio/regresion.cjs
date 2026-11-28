/* eslint-disable @typescript-eslint/no-require-imports */
/* Regresión de los casos del laboratorio (piloto + casos 1-100, 27/11/2026).
   Uso: node scripts/laboratorio/regresion.cjs           → compara con la foto guardada y sale con 1 si algún caso empeora
        node scripts/laboratorio/regresion.cjs --foto    → guarda la foto actual (solo tras revisar los cambios) */
"use strict";
const fs = require("fs"), path = require("path");
const L = require("../ciclos100/lib.cjs"), M = L.cargar();
const casos = JSON.parse(fs.readFileSync(path.join(__dirname, "casos.json"), "utf8"));
const FOTO = path.join(__dirname, "foto.json");
const PESO = { "CRÍTICO": 100, GRAVE: 10, MENOR: 1 };
const ahora = {};
for(const c of casos){ const f = L.revisar(c, L.correr(c, M), M) || []; ahora[c.id] = f.map(x => `${x.nivel}: ${x.sev} ${x.tipo}`).sort(); }
const tot = o => Object.values(o).flat().reduce((s, x) => { const k = Object.keys(PESO).find(k => x.includes(" " + k + " ")); s[k] = (s[k] || 0) + 1; return s; }, {});
if(process.argv.includes("--foto")){ fs.writeFileSync(FOTO, JSON.stringify(ahora, null, 1)); console.log(`Foto guardada: ${casos.length} casos`, tot(ahora)); process.exit(0); }
const antes = JSON.parse(fs.readFileSync(FOTO, "utf8"));
const peso = l => l.reduce((s, x) => s + (PESO[Object.keys(PESO).find(k => x.includes(" " + k + " "))] || 0), 0);
let peor = 0, mejor = 0;
for(const id of Object.keys(ahora)){ const a = peso(antes[id] || []), b = peso(ahora[id]);
  if(b > a){ peor++; console.log(`✗ ${id} empeora:`, ahora[id].filter(x => !(antes[id] || []).includes(x)).join("; ")); } else if(b < a) mejor++; }
console.log(`${casos.length} casos del laboratorio. Empeoran: ${peor}. Mejoran: ${mejor}.`, tot(ahora));
process.exit(peor ? 1 : 0);
