/* eslint-disable @typescript-eslint/no-require-imports */
/* Pasa caras simuladas por el motor real, con las reglas de la foto (nuevo) y con el umbral antiguo (antes).
   Uso: node scripts/casos-reglas-foto.cjs [salida.json]. No llama a ninguna API: las notas son inventadas. */
"use strict";
const motor = require("../src/server/motor/motor.js");
const { TODOS } = require("../src/server/motor/catalogo.js");
const { aplicarAlMotor, ASPECTOS } = require("../src/server/motor/reglasFoto.js");

const LISTA = TODOS.filter(p => !p.retirado && !p.sin_verificar && p.pvp_eur != null);
const NIVELES = [["basica", 3, "bajo"], ["media", 4, "medio"], ["completa", 5, "alto"]];
// Umbral antiguo (analisisPiel.ts): intensidad = 100 - nota >= 40, y se completa hasta 3 con intensidad >= 25
const ANTES = { acne: "P02", poros: "P07", brillo: "P06", manchas: "P12", tono: "P14", arrugas: "P17", firmeza: "P19", textura: "P20", rojez: "P23", hidratacion: "P29", ojeras: "P15" };
function problemasAntes(notas){
  const orden = ASPECTOS.filter(a => notas[a] != null).sort((a, b) => notas[a] - notas[b]);
  const fijos = orden.filter(a => 100 - notas[a] >= 40);
  const extra = orden.filter(a => !fijos.includes(a) && 100 - notas[a] >= 25).slice(0, Math.max(0, 3 - fijos.length));
  return [...new Set(orden.filter(a => fijos.includes(a) || extra.includes(a)).map(a => ANTES[a]))];
}
function pielAntes(notas){
  const b = 100 - (notas.brillo ?? 100), h = 100 - (notas.hidratacion ?? 100);
  return b >= 50 ? "brillo_total" : b >= 35 ? "brillo_T" : h >= 50 ? "tirante" : "normal";
}
function base(c){
  return { edad: c.edad, sexo: c.sexo, embarazo: c.sexo === "hombre" ? "no" : c.embarazo || "no", lactancia: c.lactancia || "no", edad_tramo: c.edad_tramo, receta: c.receta || "no", reactiva: c.reactiva || "nunca",
    sienta: ["nada"], retinoide_exp: "nunca", fototipo: c.fototipo || "III", textura: "igual", preocupa: ["nada"], kiosko: true };
}
function resumen(out){
  return out.productos.map(p => ({ paso: p.paso, turno: p.turno, activo: p.activo || null, producto: p.producto ? `${p.marca} · ${p.producto}` : null, motivo: p.producto ? null : p.motivo || null }));
}
function correr(r){
  const res = {};
  for(const [k, n, pres] of NIVELES){
    const out = motor.calcularCon({ ...r, productos: n, presupuesto: pres }, LISTA);
    res[k] = { modo: out.modo, productos: resumen(out), avisos: out.avisos };
    if(k === "basica"){ res.orden = out.perfil.problemas.map(x => x.id); res.no_recomiendo = out.no_recomiendo; res.derivacion = out.derivacion.map(d => d.texto); }
  }
  return res;
}
function caso(c){
  const rNuevo = base(c);
  rNuevo.piel = pielAntes(c.notas);
  const rf = aplicarAlMotor(rNuevo, c.notas);
  const rAntes = { ...base(c), piel: pielAntes(c.notas), problemas_extra: problemasAntes(c.notas) };
  return { ...c, reglas: rf.reglas_aplicadas, prioridad: rf.prioridad_foto, bonus: rf.bonus_activos, vetos_reglas: Object.keys(rf.veto_extra), piel: rNuevo.piel,
    nuevo: correr(rNuevo), antes: { problemas: rAntes.problemas_extra, ...correr(rAntes) } };
}
module.exports = { caso, LISTA };
if(require.main === module){
  const CASOS = require("./casos-simulados.json");
  const out = CASOS.map(caso);
  const f = process.argv[2] || "casos-resultado.json";
  require("fs").writeFileSync(f, JSON.stringify(out, null, 1));
  console.log(`${out.length} casos → ${f}`);
}
