/* eslint-disable @typescript-eslint/no-require-imports */
/* Casos permanentes del Hito 1 (mejoras de la biblioteca aprobadas por Hugo el 27/11/2026).
   Uso: node scripts/hito1-casos.cjs   → imprime cada comprobación y sale con código 1 si alguna falla. */
"use strict";
const L = require("./ciclos100/lib.cjs");
const M = L.cargar();
const { estado, lleva, RETINOIDES, ACIDOS } = M.AC;
const BASE = { id: "H1", arquetipo: "hito1", edad: "35-44", sexo: "mujer", embarazo: "no", receta: "no", reactiva: "nunca", retinoide: "nunca",
  notas: { acne: 70, poros: 60, brillo: 60, manchas: 55, tono: 62, arrugas: 55, firmeza: 62, textura: 60, rojez: 65, hidratacion: 60, ojeras: 70 } };
const caso = ov => { const c = JSON.parse(JSON.stringify(BASE)); Object.assign(c, ov); c.notas = Object.assign({}, BASE.notas, ov.notas || {}); return c; };
function correr(ov, extraR){
  const c = caso(ov), { r } = L.respuestas(c, M); Object.assign(r, extraR || {});
  const out = {};
  const outs = M.motor.calcularNiveles(JSON.parse(JSON.stringify(r)), M.LISTA, L.NIVELES.map(([, n, pres]) => ({ productos: n, presupuesto: pres })));   // como en el iPad (27/11)
  L.NIVELES.forEach(([k], i) => { out[k] = outs[i]; });
  return out;
}
const prods = o => o.productos.filter(p => p.id).map(p => ({ ...p, f: M.POR.get(p.id) }));
let fallos = 0, total = 0;
const ok = (cond, txt) => { total++; if(!cond) fallos++; console.log(`${cond ? "✓" : "✗"} ${txt}`); };
const fragante = p => p.fragancia === true || lleva(p, "perfume") || lleva(p, "aceite_esencial");

// Propuesta 8 · tratamiento en consulta
for(const proc of ["peeling", "laser", "microagujas", "otro"]){
  for(const cuando of ["semana", "dos_semanas"]){
    const o = correr({ procedimiento: proc, procedimiento_cuando: cuando, notas: { acne: 45, arrugas: 45, ojeras: 50 } });
    for(const [k, x] of Object.entries(o)){
      const ps = prods(x);
      ok(x.modo === "suave", `P8 ${proc}/${cuando} ${k}: rutina suave`);
      ok(!x.productos.some(p => /^serum|contorno/.test(p.slot)), `P8 ${proc}/${cuando} ${k}: sin sérums ni contorno`);
      ok(!ps.some(p => RETINOIDES.concat(ACIDOS, ["azelaico", "vitc_pura", "thiamidol"]).some(a => lleva(p.f, a))), `P8 ${proc}/${cuando} ${k}: sin retinoides, ácidos ni despigmentantes`);
      ok(!ps.some(p => fragante(p.f)), `P8 ${proc}/${cuando} ${k}: sin perfume ni aceites esenciales`);
      const h = ps.find(p => p.slot === "H");
      ok(!!h && ["ceramidas", "pantenol", "bisabolol", "karite", "centella", "escualano"].some(a => estado(h.f)[a]), `P8 ${proc}/${cuando} ${k}: hidratante reparadora (${h ? h.id : "ninguna"})`);
      ok(x.derivacion.some(d => /Sigue las indicaciones de quien te hizo el tratamiento/.test(d.texto) && !/\d+ (días|semanas)/.test(d.texto.replace(/una o dos semanas|menos de una semana/, ""))), `P8 ${proc}/${cuando} ${k}: aviso sin plazos inventados`);
    }
  }
}
{ const o = correr({ procedimiento: "limpieza", procedimiento_cuando: "semana" });
  ok(o.media.modo === "normal" && o.media.derivacion.some(d => /limpieza facial/.test(d.texto)), "P8 limpieza facial: rutina normal con aviso"); }
{ const o = correr({});
  ok(!o.media.derivacion.some(d => /tratamiento en consulta|limpieza facial/.test(d.texto)), "P8 sin tratamiento: nada cambia"); }

{ const o = correr({ procedimiento: "laser", procedimiento_cuando: "semana", retinoide: "tolera", notas: { hidratacion: 45 } });
  for(const [k, x] of Object.entries(o)) ok(!x.avisos.some(t => /Mantén tu retinoide|Puedes seguir con tu retinoide/.test(t)), `P8 láser con retinoide propio ${k}: no se le dice que siga con el retinoide`); }
{ const o = correr({ embarazo: "embarazo", notas: { acne: 40 } });
  for(const [k, x] of Object.entries(o)) ok(!x.avisos.some(t => /con el retinoide de noche/.test(t)), `Laboratorio L14 embarazo con granos ${k}: el aviso del peróxido no menciona retinoide`); }

// Laboratorio, tanda 1 (27/11)
{ const o = correr({ reactiva: "siempre", notas: { hidratacion: 42, acne: 64, brillo: 61, rojez: 46 } });
  for(const [k, x] of Object.entries(o)){ const h = prods(x).find(p => p.slot === "H"); ok(!!h && !/acnestil|imperfec|effaclar|cleanance|oil control|matif/i.test(h.f.producto), `Lab T1-12 reactiva siempre y seca ${k}: hidratante sin gama antiimperfecciones (${h ? h.id : "ninguna"})`); } }
{ const o = correr({ retinoide: "tolera", notas: { arrugas: 45 } });
  for(const [k, x] of Object.entries(o)) ok(!x.avisos.some(t => /concentración media/.test(t)), `Lab T1-46 ya tolera retinoide ${k}: no promete una concentración`); }

// Propuesta 11 · aceites esenciales
{ const o = correr({ reactiva: "a_veces" });
  for(const [k, x] of Object.entries(o)) ok(!prods(x).some(p => ["L", "H", "H2"].includes(p.slot) && fragante(p.f)), `P11 reactiva a veces ${k}: limpiador e hidratante sin perfume ni aceites esenciales`); }
{ const o = correr({}, { sienta: ["perfume"] });
  for(const [k, x] of Object.entries(o)) ok(!prods(x).some(p => fragante(p.f)), `P11 «el perfume me sienta mal» ${k}: ningún producto con perfume ni aceites esenciales`); }
{ const o = correr({ reactiva: "siempre", notas: { rojez: 45 } });
  for(const [k, x] of Object.entries(o)) ok(!prods(x).some(p => fragante(p.f)), `P11 reactiva siempre ${k}: ningún producto con perfume ni aceites esenciales`); }
{ const ae = M.LISTA.filter(p => lleva(p, "aceite_esencial")), fijos = M.LISTA.filter(p => (p.inci_completo || []).some(i => /(seed|kernel|fruit|nut) oil/i.test(i)) && !lleva(p, "aceite_esencial"));
  ok(ae.length > 0 && fijos.length > 0, `P11 detector: ${ae.length} productos con aceite esencial; los aceites vegetales fijos (semilla, hueso, fruto, nuez) no cuentan`); }

// Propuesta 1 · solar mineral en piel que reacciona siempre
{ const o = correr({ reactiva: "siempre", notas: { rojez: 47, brillo: 85, acne: 80 } });
  const s = prods(o.basica).find(p => p.slot === "S");
  ok(!!s && (s.f.spf || 0) >= 50 && !fragante(s.f), `P1 reactiva siempre: solar SPF 50+ sin perfume (${s ? s.id + ", " + s.f.tipo_filtro : "ninguno"})`); }

// Propuestas 6 y 21 · niacinamida no es el tratamiento principal de los granos
{ const o = correr({ edad: "18-24", notas: { acne: 40, brillo: 50, poros: 55 } });
  for(const [k, x] of Object.entries(o)){ const s = x._pauta.serums.find(z => z.k === "antiacne");
    ok(!s || !(s.activos || []).includes("niacinamida"), `P6 acné ${k}: el sérum para los granos no es niacinamida (${s ? s.activos.join("/") : "sin sérum antiacné"})`); } }
{ const tabla = require("../src/server/motor/necesidades.json").ingredientes.niacinamida.pesos;
  ok(tabla.acne === 1 && tabla.brillo === 2.5 && tabla.poros === 2 && tabla.rojez === 2 && tabla.manchas === 2, "P21 tabla: niacinamida pesa 1 en granos y el resto de sus pesos no cambia"); }

// Propuesta 5 · solar con color y fototipo declarado
{ const conColor = o => { const s = prods(o.basica).find(p => p.slot === "S"); return !!(s && s.f.oxidos_hierro); };
  const iv = correr({ fototipo: "IV", notas: { manchas: 70 } }), vi = correr({ fototipo: "VI", notas: { manchas: 80 } });
  ok(conColor(iv), "P5 fototipo IV con manchas 70: solar con color");
  ok(conColor(vi), "P5 fototipo VI: solar con color");
  for(const ft of ["I", "II", "III", "IV", "V", "VI", undefined]){ const o = correr({ fototipo: ft, notas: { manchas: 74 } }); const s = prods(o.basica).find(p => p.slot === "S");
    ok(!!s && (s.f.spf || 0) >= 50, `P5 fototipo ${ft || "sin declarar"}: SPF 50+ siempre (${s ? s.id : "ninguno"})`); } }

// Propuesta 13 · piel muy seca
{ const o = correr({ edad: "55-64", notas: { hidratacion: 38, brillo: 82, arrugas: 50 } });
  for(const [k, x] of Object.entries(o)){ const h = prods(x).find(p => p.slot === "H");
    ok(!!h && ["crema", "balsamo"].includes(h.f.textura) && ["ceramidas", "colesterol", "karite", "vaselina", "escualano"].some(a => estado(h.f)[a]), `P13 hidratación 38 ${k}: crema con lípidos (${h ? h.id + ", " + h.f.textura : "ninguna"})`); } }

console.log(`\n${total} comprobaciones, ${fallos} fallos`);
process.exit(fallos ? 1 : 0);
