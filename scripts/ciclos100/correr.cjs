/* eslint-disable @typescript-eslint/no-require-imports */
/* Uso:
   node scripts/ciclos100/correr.cjs antiguos [etiqueta]   → los 148 casos antiguos (revisión de seguridad)
   node scripts/ciclos100/correr.cjs ciclo N               → genera y pasa el ciclo N (10 casos), con ±3 puntos
   node scripts/ciclos100/correr.cjs regresion [etiqueta]   → vuelve a pasar todos los casos de los ciclos hechos y compara con la última foto
   Escribe en scripts/ciclos100/salida/ (no se sube) y deja un resumen en la consola. */
"use strict";
const fs = require("fs"), path = require("path");
const L = require("./lib.cjs");
const OUT = path.join(__dirname, "salida");
fs.mkdirSync(OUT, { recursive: true });
const SEV = ["CRÍTICO", "GRAVE", "MENOR"];
const cuenta = f => Object.fromEntries(SEV.map(s => [s, f.filter(x => x.sev === s).length]));

function pasar(casos, M, conEstabilidad){
  return casos.map(c => {
    const res = L.correr(c, M);
    const fallos = L.revisar(c, res, M);
    const est = conEstabilidad ? L.estabilidad(c, res, M) : null;
    return { c, res, fallos, est };
  });
}
function todosLosCasos(){
  const casos = [];
  for(let n = 1; n <= 10; n++){ const f = path.join(OUT, `ciclo${n}_casos.json`); if(fs.existsSync(f)) casos.push(...JSON.parse(fs.readFileSync(f, "utf8"))); }
  return casos;
}
const huella = x => x.fallos.map(f => `${f.nivel}|${f.sev}|${f.tipo}`).sort();
const peso = x => x.fallos.reduce((a, f) => a + (f.sev === "CRÍTICO" ? 100 : f.sev === "GRAVE" ? 10 : 1), 0);

const [, , cmd, arg] = process.argv;
const M = L.cargar();
if(cmd === "antiguos"){
  const casos = JSON.parse(fs.readFileSync(path.join(__dirname, "antiguos148.json"), "utf8"));
  const r = pasar(casos, M, false);
  const crit = r.flatMap(x => x.fallos.filter(f => f.sev === "CRÍTICO").map(f => `${x.c.id} ${f.nivel}: ${f.tipo} · ${f.txt}`));
  const tot = cuenta(r.flatMap(x => x.fallos));
  fs.writeFileSync(path.join(OUT, `antiguos_${arg || "actual"}.json`), JSON.stringify(r.map(x => ({ id: x.c.id, fallos: x.fallos, ids: Object.fromEntries(L.NIVELES.map(([k]) => [k, L.ids(x.res[k])])) })), null, 1));
  console.log(`148 casos antiguos: ${JSON.stringify(tot)}`);
  for(const t of crit) console.log(" ✗ " + t);
}
else if(cmd === "ciclo"){
  const n = +arg;
  const casos = L.generarCiclo(n);
  fs.writeFileSync(path.join(OUT, `ciclo${n}_casos.json`), JSON.stringify(casos, null, 1));
  const r = pasar(casos, M, true);
  fs.writeFileSync(path.join(OUT, `ciclo${n}_resultado.json`), JSON.stringify(r.map(x => ({ c: x.c, fallos: x.fallos, est: x.est, res: resumen(x.res) })), null, 1));
  for(const x of r) imprimir(x);
  const tot = cuenta(r.flatMap(x => x.fallos));
  const est = r.map(x => x.est.length); const des = r.reduce((a, x) => a + x.est.filter(e => e.tipo === "desempate").length, 0);
  console.log(`\nCICLO ${n}: ${JSON.stringify(tot)} · rutinas sin fallos ${30 - new Set(r.flatMap(x => x.fallos.map(f => x.c.id + f.nivel))).size}/30 · ±3: ${est.filter(v => !v).length}/10 casos estables, ${des} cambios por desempate`);
}
else if(cmd === "regresion"){
  const casos = todosLosCasos();
  const r = pasar(casos, M, false);
  const f = path.join(OUT, "foto_regresion.json");
  const antes = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : {};
  const peor = [], mejor = [];
  for(const x of r){ const a = antes[x.c.id]; if(!a) continue; const p = peso(x); if(p > a.peso) peor.push(`${x.c.id}: ${a.peso} → ${p} [${huella(x).filter(h => !a.huella.includes(h)).join("; ")}]`); else if(p < a.peso) mejor.push(`${x.c.id}: ${a.peso} → ${p}`); }
  console.log(`${r.length} casos. Empeoran: ${peor.length}. Mejoran: ${mejor.length}.`);
  for(const t of peor) console.log(" ↓ " + t);
  for(const t of mejor) console.log(" ↑ " + t);
  if(arg === "fijar" || !Object.keys(antes).length){ fs.writeFileSync(f, JSON.stringify(Object.fromEntries(r.map(x => [x.c.id, { peso: peso(x), huella: huella(x) }])), null, 1)); console.log("foto guardada"); }
  console.log(JSON.stringify(cuenta(r.flatMap(x => x.fallos))));
}

function resumen(res){
  const o = { reglas: res.reglas, prioridad: res.prioridad, piel: res.piel };
  for(const [k] of L.NIVELES){ const x = res[k];
    o[k] = { modo: x.modo, problemas: x.perfil.problemas.map(p => p.id + " " + p.corto), ingredientes: (x.ingredientes_piel || []).slice(0, 6),
      opciones: (x.opciones || []).map(op => ({ papel: op.papel, nombre: op.nombre, por_que: op.por_que, motivo: op.motivo })), prioridad: x.prioridad,
      productos: x.productos.map(p => ({ paso: p.paso, turno: p.turno, slot: p.slot, id: p.id || null, marca: p.marca || null, producto: p.producto || null, activo: p.activo || null, dosis: p.dosis || null, score: p.score ?? null, desglose: p.desglose || null, frecuencia: p.frecuencia || null, para: p.para || null, motivo: p.producto ? null : p.motivo || null, precio: p.precio ?? null })),
      queda_fuera: x.queda_fuera, avisos: x.avisos, derivacion: x.derivacion.map(d => d.texto), total: x.total };
  }
  return o;
}
function imprimir(x){
  const c = x.c;
  console.log(`\n## ${c.id} ${c.arquetipo} · ${c.edad} ${c.sexo}${c.embarazo !== "no" ? " " + c.embarazo : ""}${c.receta === "si" ? " receta" : ""} · reactiva ${c.reactiva} · retinoide ${c.retinoide}${c.limite ? " · LÍMITE: " + c.limite : ""}`);
  console.log("   notas " + L.ASP.map(k => `${k.slice(0, 4)} ${c.notas[k]}`).join(" · ") + `   piel ${x.res.piel}`);
  const ing = x.res.basica.ingredientes_piel; if(ing) console.log("   ingredientes: " + ing.slice(0, 5).map(i => `${i.k} ${i.puntos}`).join(", "));
  for(const [k] of L.NIVELES){ const o = x.res[k];
    console.log(`   ${k} (${o.modo}): ` + o.productos.map(p => `${p.paso.replace("Sérum de ", "S.")}: ${p.producto ? p.marca + " · " + p.producto : "—"}${p.activo ? " [" + p.activo + "]" : ""}${p.frecuencia ? " {" + p.frecuencia.replace(/ \(.*\)/, "") + "}" : ""}`).join(" | ")); }
  for(const f of x.fallos) console.log(`   ✗ ${f.sev} ${f.nivel}: ${f.tipo}${f.txt ? " · " + f.txt : ""}`);
  if(x.est && x.est.length){ const d = x.est.filter(e => e.tipo === "desempate").length, u = x.est.length - d; console.log(`   ±3: ${x.est.length} cambios (${d} por desempate, ${u} por umbral)`); }
}
module.exports = { pasar, resumen };
