/* eslint-disable @typescript-eslint/no-require-imports */
/* Escalado entre niveles (Hugo, 27/11): la media y la completa contienen al nivel anterior, y la completa cubre todos los ingredientes
   principales que se recomiendan. Uso: node scripts/laboratorio/escalado.cjs [--detalle] */
"use strict";
const fs = require("fs"), path = require("path");
const L = require("../ciclos100/lib.cjs"), M = L.cargar();
const lab = JSON.parse(fs.readFileSync(path.join(__dirname, "casos.json"), "utf8"));
const reg = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "ciclos100", "antiguos148.json"), "utf8"));
for(let n = 1; n <= 20; n++){ const f = path.join(__dirname, "..", "ciclos100", "salida", `ciclo${n}_casos.json`); if(fs.existsSync(f)) reg.push(...JSON.parse(fs.readFileSync(f, "utf8"))); }
const ACT = { retinoide: ["retinal", "retinol", "esteres_retinilo", "hpr"], bakuchiol: ["bakuchiol"], aha: ["glicolico", "lactico"], salicilico: ["salicilico"], antiacne: ["azelaico", "niacinamida"],
  despigmentante: ["azelaico", "tranexamico", "thiamidol", "niacinamida"], vitc: ["vitc_pura", "vitc_derivados"], calma: ["niacinamida", "azelaico"], sebo: ["niacinamida"], glicolico_afeitado: ["glicolico"],
  pha: ["pha"], barrera: ["niacinamida"], niacinamida: ["niacinamida"], azelaico_mixto: ["azelaico"], azelaico_noche: ["azelaico"] };
const CAPACIDAD = /ya no cabe|No cabe sin pasar de 6|no más activos a la vez|Un sérum por momento|la mañana es para la vitamina C|No cabe sin sumar/;
const detalle = process.argv.includes("--detalle");
function medir(casos, nombre){
  let iguales = 0, noContiene = 0, sinCubrir = 0, faltan = 0, espera = 0; const ej = [];
  for(const c of casos){
    const res = L.correr(c, M);
    const P = L.NIVELES.map(([k]) => res[k]);
    const idsN = P.map(o => o.productos.filter(p => p.id).map(p => p.id));
    const iguala = idsN.some((x, i) => i && x.join() === idsN[i - 1].join());
    const contiene = idsN.every((x, i) => !i || idsN[i - 1].every(id => x.includes(id)));
    if(iguala) iguales++; if(!contiene) noContiene++;
    // ingredientes principales: los sérums de los tres niveles y lo que la completa deja fuera solo por sitio
    const comp = P[2], ks = new Set();
    for(const o of P) for(const s of o._pauta.serums) ks.add(s.k);
    for(const f of comp._pauta.fuera) if(f.k && CAPACIDAD.test(f.por)) ks.add(f.k);
    ks.delete("humectante");
    const ps = comp.productos.filter(p => p.id && p.slot !== "L" && p.slot !== "contorno").map(p => M.POR.get(p.id)).filter(Boolean);
    // los tres principales: los tres primeros en el orden de prioridad de la completa
    const orden = comp._pauta.lista.map(x => x.k).filter((k, i, a) => a.indexOf(k) === i && ks.has(k) && ACT[k]);
    for(const k of ks) if(ACT[k] && !orden.includes(k)) orden.push(k);
    const top = orden.slice(0, 3);
    const sin = top.filter(k => !ps.some(p => ACT[k].some(a => M.AC.aDosis(p, a))));
    const tolera = sin.filter(k => (comp._pauta.fuera.find(f => f.k === k) || {}).por === "Con piel que reacciona o con rojez, no más activos a la vez. Entra cuando toleres los anteriores.");
    if(sin.length > tolera.length){ sinCubrir++; faltan += sin.length - tolera.length; ej.push(`${c.id}: ${sin.filter(k => !tolera.includes(k)).join(", ")} [${(comp._pauta.fuera.find(f => f.k === sin.find(k => !tolera.includes(k))) || {}).por || "con sérum sin el activo"}]`); }
    if(tolera.length) espera++;
  }
  console.log(`${nombre}: ${casos.length} casos · dos niveles iguales ${iguales} · el superior no contiene al inferior ${noContiene} · completa sin cubrir alguno de los 3 ingredientes principales ${sinCubrir} (${faltan}) · con alguno en espera por piel reactiva o rojez ${espera}`);
  if(detalle) for(const t of ej) console.log("   " + t);
}
medir(reg, "Regresión"); medir(lab, "Laboratorio");
