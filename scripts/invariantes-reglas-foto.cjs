/* eslint-disable @typescript-eslint/no-require-imports */
/* Comprueba reglas de seguridad sobre los casos simulados (motor real + reglas de la foto + catálogo completo).
   Uso: node scripts/invariantes-reglas-foto.cjs. Sale con código 1 si algún caso incumple una regla. */
"use strict";
const motor = require("../src/server/motor/motor.js");
const { lleva, RETINOIDES } = require("../src/server/motor/activos.js");
const { aplicarReglasFoto } = require("../src/server/motor/reglasFoto.js");
const { LISTA } = require("./casos-reglas-foto.cjs");
const CASOS = require("./casos-simulados.json");
const POR_ID = new Map(LISTA.map(p => [p.id, p]));
const NIVELES = [[3, "bajo"], [4, "medio"], [5, "alto"]];
const errores = [];
let rutinas = 0;

for(const c of CASOS){
  const r = { edad: c.edad, edad_tramo: c.edad_tramo, sexo: c.sexo, embarazo: c.sexo === "hombre" ? "no" : c.embarazo || "no", lactancia: c.lactancia || "no",
    receta: c.receta || "no", reactiva: c.reactiva || "nunca", sienta: ["nada"], retinoide_exp: "nunca", fototipo: "III", textura: "igual", preocupa: ["nada"], piel: "normal", kiosko: true };
  const rf = aplicarReglasFoto(c.notas, r);
  Object.assign(r, { problemas_extra: rf.problemas_extra, veto_extra: rf.veto_extra, bonus_activos: rf.bonus_activos, derivacion_extra: rf.derivacion_extra, avisos_extra: rf.avisos_extra, prioridad_foto: rf.prioridad_foto });
  if(rf.piel) r.piel = rf.piel;
  const embOLac = r.embarazo === "si" || r.lactancia === "si";
  const todoBien = Object.values(c.notas).every(v => v >= 75);
  for(const [n, pres] of NIVELES){
    const out = motor.calcularCon({ ...r, productos: n, presupuesto: pres }, LISTA);
    rutinas++;
    const prods = out.productos.filter(p => p.id).map(p => POR_ID.get(p.id)).filter(Boolean);
    const tiene = k => prods.some(p => lleva(p, k));
    const mal = t => errores.push(`${c.id} (${n} productos): ${t}`);
    if(out.productos.length > 6) mal(`${out.productos.length} productos, el tope es 6`);
    if(!out.productos.some(p => p.slot === "S" || /solar/i.test(p.paso || ""))) mal("sin protector solar");
    if(embOLac) for(const k of RETINOIDES.concat(["bakuchiol", "tranexamico", "thiamidol"])) if(tiene(k)) mal(`embarazo o lactancia con ${k}`);
    if(c.edad === "14-17") for(const k of RETINOIDES) if(tiene(k)) mal(`menor con ${k}`);
    if(c.notas.rojez <= 49) for(const k of ["glicolico", "lactico", "vitc_pura"]) if(tiene(k)) mal(`rojez ${c.notas.rojez} con ${k}`);
    if(r.receta === "si" && out.modo !== "suave") mal("receta sin modo suave");
    if(todoBien) for(const k of RETINOIDES.concat(["glicolico", "lactico", "salicilico", "pha"])) if(tiene(k)) mal(`piel en Bien con ${k}`);
    if(r.reactiva === "siempre" && c.notas.arrugas <= 49) for(const k of ["retinol", "retinal"]) if(tiene(k)) mal(`reactividad frecuente con ${k}`);
    if(r.lactancia === "si" && !out.avisos.some(a => /pecho/.test(a))) mal("lactancia sin el aviso de no aplicar en el pecho");
    if(r.lactancia === "si" && out.derivacion.some(d => /matrona/.test(d.texto))) mal("lactancia con aviso de matrona");
    for(const p of out.productos) if(!p.producto && !p.motivo && p.slot !== "S") mal(`paso vacío: ${p.paso}`);
  }
}
console.log(`${CASOS.length} casos, ${rutinas} rutinas, ${errores.length} fallos`);
for(const e of errores) console.log(" ✗ " + e);
process.exit(errores.length ? 1 : 0);
