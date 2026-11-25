/* eslint-disable @typescript-eslint/no-require-imports */
/* Comprueba reglas de seguridad sobre los casos simulados (motor real + reglas de la foto + catálogo completo).
   Uso: node scripts/invariantes-reglas-foto.cjs. Sale con código 1 si algún caso incumple una regla. */
"use strict";
const motor = require("../src/server/motor/motor.js");
const { lleva, estado, aDosis, RETINOIDES } = require("../src/server/motor/activos.js");
const { aplicarAlMotor } = require("../src/server/motor/reglasFoto.js");
const { LISTA } = require("./casos-reglas-foto.cjs");
const CASOS = require("./casos-simulados.json");
const POR_ID = new Map(LISTA.map(p => [p.id, p]));
const NIVELES = [[3, "bajo"], [4, "medio"], [5, "alto"]];
const errores = [];
let rutinas = 0;

for(const c of CASOS){
  const r = { edad: c.edad, edad_tramo: c.edad_tramo, sexo: c.sexo, embarazo: c.sexo === "hombre" ? "no" : c.embarazo || "no", lactancia: c.lactancia || "no",
    receta: c.receta || "no", reactiva: c.reactiva || "nunca", sienta: ["nada"], retinoide_exp: "nunca", fototipo: "III", textura: "igual", preocupa: ["nada"], piel: "normal", kiosko: true };
  const rf = aplicarAlMotor(r, c.notas);
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
    // auditoría 24/11: receta, melasma, vitamina A sin porcentaje y reactividad frecuente
    if(r.receta === "si" && out.productos.some(p => /^serum/.test(p.slot || ""))) mal("receta con un sérum de tratamiento");
    if(r.receta === "si" && !out.derivacion.some(d => /tratamiento que utilizas/.test(d.texto))) mal("receta sin aviso para revisar el tratamiento");
    if(out.perfil.problemas.some(x => x.id === "P13")) mal("la foto asigna manchas hormonales (P13)");
    for(const p of prods) for(const k of ["retinol", "esteres_retinilo"]) if(lleva(p, k) && estado(p)[k].estado !== "declarada" && !(p.flags || []).includes("conforme_2024_996")) mal(`${p.producto}: ${k} sin porcentaje declarado`);
    if(r.reactiva === "siempre" && out.productos.length > 4) mal(`reactividad frecuente con ${out.productos.length} productos`);
    if(r.reactiva === "siempre" && tiene("vitc_pura")) mal("reactividad frecuente con vitamina C pura");
    // Correcciones de Hugo a los casos de prueba (24/11)
    const sinAclarado = out.productos.filter(p => p.id && p.slot !== "L").map(p => POR_ID.get(p.id)).filter(Boolean);
    const conAcido = sinAclarado.filter(p => ["glicolico", "lactico", "mandelico", "lha"].some(k => lleva(p, k)) || (p.inci_completo || []).some(i => /\bsalicylic acid\b/i.test(i) && !/capryloyl/i.test(i)));
    if(conAcido.length > 1) mal(`dos productos sin aclarado con ácido exfoliante: ${conAcido.map(p => p.producto).join(" + ")}`);
    if(Object.values(c.notas).every(v => v >= 70) && conAcido.length) mal(`todo ≥70 con exfoliante (${conAcido[0].producto})`);
    if(r.embarazo === "si" && r.lactancia !== "si" && prods.some(p => lleva(p, "salicilico") || lleva(p, "glicolico"))) mal("embarazo con salicílico o glicólico");
    if(r.embarazo === "si" && r.lactancia !== "si" && c.notas.manchas <= 69){ const sol = out.productos.find(p => p.slot === "S" && p.id); if(sol && !POR_ID.get(sol.id).oxidos_hierro) mal("embarazo con manchas sin solar con color"); }
    if((c.notas.rojez <= 49 || ["a_veces", "siempre"].includes(r.reactiva)) && tiene("urea")) mal("urea con rojez o reactividad");
    { const l = out.productos.find(p => p.slot === "L" && p.producto); if(l && /micel|micellar|\bh2o\b/i.test(l.producto) && !/gel|mousse|moussant|espuma|foam/i.test(l.producto)) mal(`agua micelar como limpiador (${l.producto})`); }
    for(const T of ["AM", "PM"]){ const d = out.productos.filter(p => /^serum/.test(p.slot || "") && p.turno === T && p.id && !p.noches && !p.frecuencia); const parAz = d.length === 2 && d.some(p => /azelaico/.test(p.activo || "")) && d.some(p => /vitamina C|niacinamida/.test(p.activo || ""));
      if(d.length > 1 && !parAz) mal(`dos sérums diarios por la ${T === "AM" ? "mañana" : "noche"}`); }
    if(prods.some(p => RETINOIDES.some(k => lleva(p, k))) && out.productos.some(p => /^serum/.test(p.slot || "") && p.turno === "AM" && p.id && ["glicolico", "lactico"].some(k => aDosis(POR_ID.get(p.id), k)))) mal("glicólico o láctico de mañana con retinoide");
    if(c.notas.hidratacion < 55 && out.productos.some(p => /^serum/.test(p.slot || "") && p.id && ["glicolico", "lactico"].some(k => aDosis(POR_ID.get(p.id), k)))) mal("AHA sin aclarado con la hidratación por debajo de 55");
    // P-03 (Hugo, 24/11): con arrugas y rojez 30-49, retinal solo si nunca reacciona y la hidratación es ≥50; hasta 0,05 %, 2 noches, sándwich y crema reparadora
    if(c.notas.arrugas <= 49 && c.notas.rojez >= 30 && c.notas.rojez <= 49){
      const ret = prods.filter(p => RETINOIDES.some(k => lleva(p, k)));
      const p03 = r.reactiva === "nunca" && c.notas.hidratacion >= 50;
      if(!p03 && ret.length) mal(`rojez ${c.notas.rojez} sin P-03 con retinoide (${ret[0].producto})`);
      for(const p of ret){ const e = estado(p).retinal; if(!e || e.estado !== "declarada" || e.pct > 0.05 || RETINOIDES.some(k => k !== "retinal" && lleva(p, k))) mal(`P-03: ${p.producto} no es retinal ≤0,05 % declarado`); }
      const sr = out.productos.find(p => p.id && ret.some(x => x.id === p.id));
      if(sr && (!sr.noches || sr.noches.length > 2)) mal(`P-03: retinal ${sr.noches ? sr.noches.length : "sin"} noches`);
      if(ret.length){
        for(const h of out.productos.filter(p => ["H", "H2"].includes(p.slot) && p.id)){ const ph = POR_ID.get(h.id), e = estado(ph); if(ph.fragancia !== false || lleva(ph, "perfume") || !(e.ceramidas || e.pantenol)) mal(`P-03: hidratante no reparadora (${ph.producto})`); }
        if(!out.semana.some(d => d.noche.includes("Hidratante (antes y después)"))) mal("P-03: el retinal va sin sándwich");
      }
    }
  }
}
console.log(`${CASOS.length} casos, ${rutinas} rutinas, ${errores.length} fallos`);
for(const e of errores) console.log(" ✗ " + e);
process.exit(errores.length ? 1 : 0);
