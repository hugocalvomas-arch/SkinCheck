/* Motor v2 (catálogo v2 de problemas y pautas, 02/10/2026).
   Cadena: respuestas → derivación → problemas → condiciones y vetos → funciones → pauta por huecos y por semana → productos → preferencias.
   Lo que es criterio vive en config.js y en las tablas de este archivo (PROBLEMAS, DESEOS). */
"use strict";
const CFG = require("./config.js");
const {CATALOGO, HUECO_H} = require("./catalogo.js");
// SkinRead: el catálogo que ve el motor se puede limitar al stock de una farmacia (calcularCon)
let LISTA = null;
const {RETINOIDES, ACIDOS, nombre, estado, lleva, aDosis, n, aceitesEsenciales} = require("./activos.js");
/* Sistema de fragancias (Hito 1, propuesta 11): perfumado = «parfum» o ficha con fragancia; fragante = además, aceites esenciales.
   «fragante» se usa donde la piel reacciona o la clienta declara que el perfume le sienta mal; «perfumado», en lo demás. */
const perfumado = p => p.fragancia === true || lleva(p, "perfume");
const fragante = p => perfumado(p) || lleva(p, "aceite_esencial");
// Paso 1 (Hugo, 24/11): qué ingredientes necesita la piel, con la tabla ingrediente × aspecto. Paso 2: fichas de producto con nota de calidad de fórmula.
const NEC = require("./necesidades.js");
const B3 = NEC.BANDA;   // banda de duda de ±3 puntos: dentro de ella se elige la opción prudente
let CALIDAD = {}; try { CALIDAD = require("./fichas-calidad.json"); } catch { CALIDAD = {}; }
const PESO_PRODUCTO = {ingrediente: .5, cobertura: .3, calidad: .6};   // ingrediente que la piel necesita + resto de lo que cubre + calidad de fórmula (0-10)

/* ------------------------------------------------------------------ 1 · Problemas */
const PROBLEMAS = {
  P01: {t: "Puntos negros y granitos sin inflamar", g: "acne", alcance: "trata"},
  P02: {t: "Granos rojos o con pus, leves", g: "acne", alcance: "trata"},
  P03: {t: "Granos del adulto en mandíbula y barbilla", g: "acne", alcance: "ayuda"},
  P04: {t: "Bultos profundos que duelen o dejan cicatriz", g: "acne", alcance: "no trata"},
  P05: {t: "Granitos pequeños e iguales que pican", g: "acne", alcance: "no trata"},
  P06: {t: "Brillo y exceso de grasa", g: "poros", alcance: "trata"},
  P07: {t: "Poro dilatado en piel grasa", g: "poros", alcance: "mejora"},
  P08: {t: "Poro dilatado en piel que ha perdido firmeza", g: "arrugas", alcance: "ayuda poco"},
  P09: {t: "Pelos encarnados y granitos del afeitado", g: "acne", alcance: "trata con técnica"},
  P10: {t: "Marcas oscuras tras granos o heridas", g: "manchas", alcance: "trata, despacio"},
  P11: {t: "Marcas rojas tras granos", g: "manchas", alcance: "ayuda poco"},
  P12: {t: "Manchas y tono desigual", g: "manchas", alcance: "ayuda poco"},
  P13: {t: "Manchas hormonales (melasma)", g: "manchas", alcance: "ayuda"},
  P14: {t: "Tono apagado y desigual", g: "manchas", alcance: "trata"},
  P15: {t: "Ojeras", g: "otros", alcance: "ayuda poco"},
  P16: {t: "Cicatrices hundidas de acné", g: "arrugas", alcance: "no trata"},
  P17: {t: "Líneas finas y arrugas", g: "arrugas", alcance: "trata la arruga fina"},
  P18: {t: "Arrugas de expresión marcadas", g: "arrugas", alcance: "ayuda poco"},
  P19: {t: "Falta de firmeza", g: "arrugas", alcance: "ayuda poco"},
  P20: {t: "Textura áspera", g: "arrugas", alcance: "trata"},
  P21: {t: "Rojez fija en mejillas y nariz", g: "rojez", alcance: "acompaña"},
  P22: {t: "Rojez con granitos", g: "rojez", alcance: "no trata"},
  P23: {t: "Piel sensible", g: "barrera", alcance: "trata con rutina corta"},
  P24: {t: "Piel irritada por exceso de activos", g: "barrera", alcance: "trata: parar"},
  P25: {t: "Descamación grasienta con rojez", g: "rojez", alcance: "acompaña"},
  P26: {t: "Rojez y granitos alrededor de la boca", g: "rojez", alcance: "no trata"},
  P27: {t: "Zonas secas que pican mucho, desde la infancia", g: "barrera", alcance: "acompaña"},
  P28: {t: "Piel seca", g: "barrera", alcance: "trata"},
  P29: {t: "Piel deshidratada", g: "barrera", alcance: "trata"},
  P30: {t: "Sequedad constante con descamación", g: "barrera", alcance: "acompaña"},
  P31: {t: "Sin problema concreto", g: "otros", alcance: "mantener"}
};
const ORDEN_GRUPO = {barrera: 0, rojez: 1, acne: 2, poros: 3, manchas: 4, arrugas: 5, otros: 6};
const tiene = (r, k, v) => (r[k] || []).includes(v);

function detectar(r){
  const P = new Set(), der = [];
  const d = (nivel, texto) => der.push({nivel, texto});
  const pre = r.preocupa || [];
  if(pre.includes("granos")){
    if(tiene(r, "granos", "comedones")) P.add("P01");
    if(tiene(r, "granos", "rojos")) P.add(tiene(r, "granos_adulto", "mandibula") ? "P03" : "P02");
    if(tiene(r, "granos", "muchos")){ P.add("P02"); d("suave", "Muchos granos, o también en pecho o espalda, es acné moderado. La cosmética no basta: pide cita con un dermatólogo. Esta rutina acompaña mientras tanto."); }
    if(tiene(r, "granos", "nodulos")){ P.add("P04"); d("minima", "Los bultos profundos que duelen o dejan cicatriz no se aclaran con productos de tienda, y esperar deja marca. Pide cita pronto."); }
    if(tiene(r, "granos", "iguales_pican")){ P.add("P05"); d("minima", "Granitos todos iguales que pican, en frente o línea del pelo, pueden no ser acné. Consúltalo: el tratamiento lo decide un médico."); }
    if(tiene(r, "granos", "perioral")){ P.add("P26"); d("sin_rutina", "Granitos y rojez alrededor de la boca, con el borde del labio limpio, suelen mejorar retirando cosméticos. Consulta con un dermatólogo; mientras tanto, la rutina es corta y suave. Si usas una crema con corticoide, no la dejes de golpe sin que te lo indiquen."); }
    if(tiene(r, "granos", "sobre_rojez")){ P.add("P22"); d("minima", "Granos sin puntos negros sobre rojez en mejillas y nariz no son acné común, y los productos antiacné los empeoran. Pide cita."); }
    if(tiene(r, "granos_adulto", "reglas_irregulares")) d("suave", "Granos con reglas irregulares pueden tener una causa hormonal que la cosmética no corrige. Coméntalo con tu médico.");
    if(tiene(r, "granos_adulto", "debut_adulto")) d("suave", "Si los granos han aparecido por primera vez de adulto, conviene una consulta.");
    if(tiene(r, "granos_adulto", "whey")) d("suave", "La proteína whey, los anabolizantes y algunos medicamentos pueden provocar granos. La cosmética no corrige esa causa.");
    if(r.embarazo === "si" || r.embarazo === "lactancia" || r.lactancia === "si") d("suave", "Con granos durante el embarazo o la lactancia, lo indicado es consultarlo. Te doy una rutina suave mientras tanto.");
  }
  if(pre.includes("brillo")) P.add("P06");
  if(pre.includes("poros")) P.add(pre.includes("firmeza") || (["40-49", "50+"].includes(r.edad) && ["tirante", "normal"].includes(r.piel)) ? "P08" : "P07");
  if(pre.includes("marcas") || pre.includes("granos")){
    if(tiene(r, "marcas", "oscura")) P.add("P10");
    if(tiene(r, "marcas", "roja")) P.add("P11");
    if(tiene(r, "marcas", "hoyo")){ P.add("P16"); d("aviso", "Las cicatrices hundidas no se rellenan con cosmética. Lo que las mejora son procedimientos en consulta."); }
  }
  if(pre.includes("manchas")){
    if(tiene(r, "manchas", "sol")) P.add("P12");
    if(tiene(r, "manchas", "melasma")){ P.add("P13"); d("aviso", "Las manchas hormonales mejoran más con tratamientos de receta y suelen volver. Te doy la rutina y te aconsejo una consulta; si a los 3 meses no hay mejoría, no esperes más."); }
    if(tiene(r, "manchas", "post")) P.add("P10");
    if(tiene(r, "manchas", "alarma")) d("urgente", "Una mancha reciente, que crece, con varios tonos o que sangra tiene que verla un dermatólogo. No uses despigmentantes sobre ella.");
  }
  if(pre.includes("tono")) P.add("P14");
  if(pre.includes("ojeras")) P.add("P15");
  if(pre.includes("arrugas")) P.add({desaparecen: "P29", reposo: "P17", gesto: "P18"}[r.lineas] || "P17");
  if(pre.includes("firmeza")) P.add("P19");
  if(pre.includes("aspera")) P.add("P20");
  if(pre.includes("rojez") || pre.includes("escozor")){
    if(tiene(r, "rojez", "fija")){ P.add("P21"); d("aviso", "Lo que reduce la rojez fija es un tratamiento médico. Esta rutina acompaña; pide una consulta."); }
    if(tiene(r, "rojez", "sensible") || (!((r.rojez || []).length) && pre.includes("escozor"))) P.add("P23");
    if(tiene(r, "rojez", "seborreica")){ P.add("P25"); d("minima", "Las escamas grasas y amarillentas junto a la nariz o en las cejas necesitan un tratamiento que es medicamento. Pide cita."); }
    if(tiene(r, "rojez", "atopica")){ P.add("P27"); d("minima", "Las zonas secas con picor intenso desde la infancia necesitan seguimiento médico. Con un brote activo se evitan los cosméticos."); }
    if(tiene(r, "rojez", "ojo")) der.push({nivel: "urgente", suave: true, texto: "Rojez con dolor en un ojo, ojo rojo o visión borrosa necesita atención médica sin esperar."});
    if(tiene(r, "rojez", "corticoide")) d("minima", "Si has usado crema con corticoide en la cara, lo primero es una consulta. No la dejes de golpe sin que te lo indiquen.");
    // marcó rojez o escozor y solo una señal de consulta: se trata como piel sensible, no como «sin problema»
    if(!["P21", "P22", "P23", "P25", "P27"].some(x => P.has(x))) P.add("P23");
  }
  if(r.irritada === "si") P.add("P24");
  if(pre.includes("sequedad")){
    P.add({estable: "P28", brilla_tira: "P29", no_mejora: "P30"}[r.sequedad] || "P28");
    if(r.sequedad === "no_mejora") d("aviso", "Una sequedad que no cede aunque hidrates bien, con picor o grietas, puede tener otra causa. Si en 4 semanas sigue igual, pide cita.");
  }
  if(tiene(r, "tras_afeitar", "encarnado")) P.add("P09");
  if(tiene(r, "tras_afeitar", "infeccion")){ P.add("P09"); der.push({nivel: "suave", suave: true, texto: "Granos del afeitado con dolor, calor, hinchazón o costras pueden estar infectados. Consúltalo. Mientras tanto, rutina suave y sin exfoliantes."}); }
  if(r.reactiva === "siempre" && !P.has("P21")) P.add("P23");
  // Test nuevo (lib/analisis, 06/11/2026): avisos que añade el adaptador. El test anterior no lo envía y no cambia nada.
  for(const x of r.derivacion_extra || []) if(x && x.texto) der.push(x);
  for(const id of r.problemas_extra || []) if(PROBLEMAS[id]) P.add(id);
  if(!P.size) P.add("P31");
  if(r.edad === "40-49" || r.edad === "50+"){ if(pre.includes("granos") && tiene(r, "granos_adulto", "debut_adulto")) d("suave", "Acné que empieza pasados los 40 conviene consultarlo."); }
  if(r.receta === "si") der.push({nivel: "consulta", texto: "Para elegir los productos más adecuados, vamos a revisar contigo el tratamiento que utilizas actualmente."});
  // Hito 1, propuesta 8 (Hugo, 27/11): tratamiento en consulta en las últimas 2 semanas. Se pregunta cuál y cuándo; no se inventan plazos de recuperación.
  // Peeling, láser, microagujas o uno que no sabe nombrar: rutina suave sin activos hasta que lo autorice quien lo hizo. Limpieza facial: rutina normal y aviso.
  { const PROC = CFG.procedimientos, x = PROC[r.procedimiento];
    if(x){ const cuando = {semana: "hace menos de una semana", dos_semanas: "hace una o dos semanas"}[r.procedimiento_cuando] || "hace poco";
      der.push({nivel: x.recuperacion ? "suave" : "aviso", suave: !!x.recuperacion, procedimiento: r.procedimiento, texto: x.texto.replace("{cuando}", cuando) + " " + PROC._cierre}); } }
  return {problemas: [...P], derivacion: der};
}

/* ------------------------------------------------------------------ 2 · Condiciones y vetos */
function condiciones(r, P){
  const c = {
    // Embarazo y lactancia se preguntan por separado (Hugo, 24/11). Los vetos prudentes valen para las dos; los avisos cambian.
    embarazo: r.embarazo === "si" || r.embarazo === "lactancia" || r.lactancia === "si",
    lactancia: r.embarazo === "lactancia" || r.lactancia === "si", menor18: r.edad === "14-17", menor25: ["14-17", "18-24"].includes(r.edad), mayor50: r.edad === "50+",
    rojez: P.includes("P21") || P.includes("P22"), reactiva: r.reactiva === "siempre" || P.includes("P23"),
    reactiva_a_veces: r.reactiva === "a_veces", barrera: P.includes("P24"), sequedad_activa: P.includes("P28") || P.includes("P30"),
    afeitado_diario: r.afeita === "diario", receta: r.receta === "si",
    fototipo_oscuro: CFG.fototipo_oscuro.fototipos.includes(r.fototipo) || (CFG.fototipo_oscuro.o_marcas_oscuras && (P.includes("P10") || r.marcas_oscuras === "siempre")),
    piel: {tirante: "seca", normal: "normal", brillo_T: "mixta", brillo_total: "grasa"}[r.piel] || "normal"
  };
  // Vetos: activo → motivo. «formula» = en cualquier posición de cualquier producto.
  const veto = {};
  const v = (ks, motivo) => ks.forEach(k => { if(!veto[k]) veto[k] = motivo; });
  if(c.embarazo){
    v(RETINOIDES.concat("bakuchiol"), c.lactancia
      ? "Mientras das el pecho, por prudencia no uso retinoides: apenas hay datos. En su lugar va el ácido azelaico."
      : "Durante el embarazo no se usan retinoides. En su lugar va el ácido azelaico.");
    if(CFG.embarazo_veta_arbutina_kojico) v(["arbutina", "kojico"], c.lactancia ? "Sin datos de seguridad durante la lactancia." : "Sin datos de seguridad en el embarazo.");
    if(CFG.embarazo_acidos === "vetar") v(ACIDOS, "Durante el embarazo prefiero no usar ácidos.");
    v(["thiamidol"], c.lactancia ? "Sin datos de seguridad durante la lactancia: por prudencia, mejor el ácido azelaico." : "Sin datos de seguridad en el embarazo: por prudencia, mejor el ácido azelaico.");   // revisión de 2025 (biblioteca de criterio, 25/11)
  }
  if(c.menor18) v(RETINOIDES.concat("bakuchiol"), "Con menos de 18 años no se usan retinoides ni rutina antiedad.");
  if(c.rojez) v(["glicolico", "lactico", "mandelico", "salicilico", "lha", "urea", "alcohol", "perfume", "mentol"], "Con rojez fija, los ácidos fuertes, el alcohol, el perfume y el mentol la empeoran.");
  if(c.reactiva) v(["glicolico", "lactico", "mandelico", "salicilico", "lha", "alcohol", "perfume"], "Tu piel reacciona con facilidad: sin exfoliantes fuertes, alcohol ni perfume.");
  if(r.reactiva === "siempre") v(["vitc_pura"], "Tu piel reacciona a menudo: la vitamina C pura escuece; mejor un derivado estable.");
  if(c.barrera) v(RETINOIDES.concat(ACIDOS, ["vitc_pura", "azelaico", "perfume"]), "Ahora tu piel tiene que recuperarse: sin retinoides, ácidos, vitamina C pura ni perfume.");
  // Propuesta 8: después de un peeling, un láser, microagujas o un tratamiento que no sabe nombrar, ningún activo hasta que lo autorice quien lo hizo
  c.procedimiento = !!(CFG.procedimientos[r.procedimiento] || {}).recuperacion;
  if(c.procedimiento) v(RETINOIDES.concat(ACIDOS, ["azelaico", "vitc_pura", "vitc_derivados", "bakuchiol", "tranexamico", "thiamidol", "arbutina", "kojico", "perfume", "alcohol", "mentol"]), "Después de un tratamiento en consulta, no pongo activos ni perfume hasta que quien te lo hizo te diga que puedes.");
  // Receta (decisión P-01 de Hugo, 24/11): sin activos encima de un tratamiento que no conocemos; lo revisa el farmacéutico
  if(c.receta) v(RETINOIDES.concat(ACIDOS, ["azelaico", "vitc_pura", "bakuchiol", "tranexamico", "thiamidol", "arbutina", "kojico"]), "Mientras sigas un tratamiento con receta, no pongo activos encima: primero lo revisamos contigo.");
  for(const s of r.sienta || []){
    if(s === "perfume") v(["perfume"], "Me dijiste que el perfume te sienta mal.");
    if(s === "alcohol") v(["alcohol"], "Me dijiste que el alcohol te sienta mal.");
    if(s === "retinoide") v(RETINOIDES, "Me dijiste que los retinoides ya te irritaron.");
    if(s === "acidos") v(ACIDOS, "Me dijiste que los exfoliantes ya te irritaron.");
    if(s === "vitc") v(["vitc_pura"], "Me dijiste que la vitamina C ya te irritó.");
  }
  // Test nuevo (lib/analisis): vetos que añade el adaptador (activos que ya usa, alergias, tratamientos). El test anterior no lo envía.
  for(const [k, m] of Object.entries(r.veto_extra || {})) v([k], m);
  if(P.includes("P11")) v(["glicolico", "lactico", "mandelico", "pha"], "Con marcas rojas lo primero es no irritar: sin exfoliantes.");
  if(P.includes("P30")) v(RETINOIDES.concat(["glicolico", "lactico", "mandelico", "pha", "salicilico"]), "Con sequedad que no cede, sin retinoides ni ácidos.");
  // sin ningún exfoliante: piel irritada, granitos alrededor de la boca, zonas secas con picor, escamas grasas, corticoide, tratamiento con receta
  c.sin_exfoliar = c.barrera || c.receta || ["P26", "P27", "P25", "P30", "P11"].some(x => P.includes(x)) || tiene(r, "rojez", "corticoide");
  if(c.sin_exfoliar) v(["pha", "azelaico"], "Ahora mismo, sin exfoliantes ni activos que puedan escocer.");
  return {c, veto};
}

/* ------------------------------------------------------------------ 3 · Funciones y deseos por problema
   Cada problema pide, por orden, una lista de «deseos»: qué función, con qué activos válidos, en qué turno. */
const R = CFG.rangos;
const F = {
  retinoide: {f: "F5", turno: "PM", activos: ["retinal", "retinol", "esteres_retinilo"], para: "renovar la piel", fuerte: true},
  bakuchiol: {f: "F5", turno: "PM", activos: ["bakuchiol"], para: "renovar la piel sin retinoide"},
  aha: {f: "F6", turno: "PM", activos: ["glicolico", "lactico"], para: "exfoliar y alisar la textura", fuerte: true},
  salicilico: {f: "F7", turno: "AM", activos: ["salicilico"], para: "desobstruir el poro", fuerte: true},
  antiacne: {f: "F9", turno: "AM", activos: ["azelaico", "niacinamida"], para: "calmar los granos", flexible: true},
  despigmentante: {f: "F10", turno: "AM", activos: ["azelaico", "tranexamico", "thiamidol", "niacinamida"], para: "aclarar las marcas y manchas", flexible: true},
  vitc: {f: "F4", turno: "AM", activos: ["vitc_pura", "vitc_derivados"], para: "proteger de día como antioxidante"},
  calma: {f: "F11", turno: "AM", activos: ["niacinamida", "azelaico"], para: "calmar la rojez", flexible: true},
  sebo: {f: "F8", turno: "AM", activos: ["niacinamida"], para: "regular el brillo", flexible: true},
  humectante: {f: "F13", turno: "AM", humectante: true, para: "aportar agua bajo la crema", flexible: true},
  glicolico_afeitado: {f: "F6", turno: "PM", activos: ["glicolico"], para: "evitar que el pelo se encarne", fuerte: true},
  // Piel sensible o reactiva: el exfoliante suave es un PHA (gluconolactona, ácido lactobiónico). Rutina suave: niacinamida para la barrera.
  pha: {f: "F6", turno: "PM", activos: ["pha"], para: "exfoliar de forma suave", fuerte: true},
  barrera: {f: "F12", turno: "AM", activos: ["niacinamida"], para: "reforzar la barrera con un activo suave", flexible: true},
  niacinamida: {f: "F8", turno: "AM", activos: ["niacinamida"], para: "afinar el poro, regular el brillo y unificar el tono", flexible: true}   // vía Leve: el ingrediente de la tabla aunque ningún problema lo pida (ciclo 5)
};
const DESEOS = {
  P01: ["retinoide", "antiacne", "salicilico"], P02: ["retinoide", "antiacne"], P03: ["antiacne", "retinoide"], P04: ["antiacne"], P05: ["antiacne"],
  P06: ["sebo", "salicilico", "retinoide", "aha"], P07: ["retinoide", "salicilico", "aha"], P08: ["retinoide", "vitc"],
  P09: ["glicolico_afeitado"], P10: ["despigmentante", "retinoide", "vitc"], P11: ["calma"],
  P12: ["retinoide", "vitc", "despigmentante"], P13: ["despigmentante", "vitc", "retinoide"], P14: ["vitc", "aha", "retinoide"],
  P15: [], P16: ["retinoide"], P17: ["retinoide", "vitc", "aha"], P18: ["retinoide", "vitc"], P19: ["retinoide", "vitc"],
  P20: ["aha", "vitc", "retinoide"], P21: ["calma"], P22: ["calma"], P23: ["calma"], P28: ["humectante"], P29: ["humectante"], P30: ["humectante"],
  P31: ["retinoide", "vitc", "aha"]
};
// Qué debe tener la hidratante, el limpiador y el solar según el problema
const BASE = {
  limpiador_salicilico: ["P01", "P02", "P07"],
  h_niacinamida: ["P02", "P03", "P06", "P07", "P23", "P24", "P29"], h_barrera: ["P03", "P21", "P22", "P23", "P24", "P11"], h_lipidos: ["P28", "P30", "P27"],
  h_ligera: ["P01", "P02", "P05", "P06", "P07", "P29"], h_peptidos: ["P19", "P18", "P08"],
  solar_color_oblig: ["P13"], solar_color_pref: ["P10"], solar_mate: ["P06", "P07", "P01", "P02"], solar_mineral: ["P21", "P22"]
};
const PLAZOS = {
  P01: "Dale 6-8 semanas antes de valorar. Si a las 12 no hay mejoría, pide cita.", P02: "Los cambios se ven en 4-8 semanas. Si a las 12 no hay mejoría, pide cita.",
  P03: "No hay un plazo fijo. Si los granos duelen, dejan marca o no ceden, consulta.", P06: "Valora a las 8 semanas.", P07: "El poro no se cierra: mejora su aspecto con constancia.",
  P09: "Si siguen saliendo tras cambiar la técnica de afeitado, consulta.", P10: "Las marcas oscuras tardan de 6 a 12 meses. Si a los 6 no cambian, consulta.",
  P11: "Las marcas rojas se van solas en 3-6 meses. Si pasan de 6-12 meses, consulta.", P12: "La cosmética atenúa; lo que las quita es láser o crioterapia.",
  P13: "De 3 a 12 meses, y puede volver. Si a los 3 meses no mejora, consulta.", P14: "Unas 12 semanas.", P15: "Las ojeras responden mal a las cremas: solar y no frotar.",
  P17: "Mínimo 6 semanas, a veces 3 meses. El efecto completo llega hacia las 24 semanas.", P18: "La cosmética ayuda poco con las arrugas de expresión.",
  P19: "Resultados sutiles en el mejor de los casos.", P20: "Sin plazo establecido.", P21: "Sin plazo: la rutina acompaña al tratamiento médico.", P23: "Si persiste o empeora, consulta.",
  P24: "Dos semanas como mínimo, y hasta que cedan los síntomas. Después, reintroduce un producto cada 1-2 semanas, empezando por el más suave.",
  P28: "Si en 4 semanas no cede, consulta.", P29: "Días: una buena hidratante rellena las líneas finas en poco tiempo.", P30: "Si persiste, consulta.", P31: ""
};

/* ------------------------------------------------------------------ 4 · Pauta: huecos y semana */
const DIAS = ["L", "M", "X", "J", "V", "S", "D"];
const AGUA_MICELAR = /micel|micellar|\bh2o\b/;
const H_CUBRE = ["niacinamida", "azelaico"];   // activos que una hidratante puede llevar a dosis para cubrir una función sin sérum (escalado, 27/11). La vitamina C no: en crema no sustituye al sérum de mañana (R35)
const SOLO_SITIO = /ya no cabe|No cabe sin pasar de 6|Un sérum por momento|la mañana es para la vitamina C|No cabe sin sumar/;   // motivos de «queda fuera» que son solo de sitio, no de tolerancia ni de seguridad
const CON_FRECUENCIA = ["retinoide", "bakuchiol", "aha", "pha", "salicilico", "glicolico_afeitado"];
function pauta(r, P, c, veto, modo){
  // SkinRead: con foto, barrera y rojez siguen primero (seguridad) y el resto va por gravedad (prioridad_foto); sin foto, por grupo
  const pf = r.prioridad_foto || {}, conFoto = Object.keys(pf).length > 0;
  const orden = P.slice().sort((a, b) => {
    const ga = ORDEN_GRUPO[PROBLEMAS[a].g], gb = ORDEN_GRUPO[PROBLEMAS[b].g];
    if(!conFoto || (ga <= 1 && gb <= 1)) return ga - gb || a.localeCompare(b);
    if((ga <= 1) !== (gb <= 1)) return ga <= 1 ? -1 : 1;
    return (pf[b] || 0) - (pf[a] || 0) || ga - gb || a.localeCompare(b);
  });
  const N0 = +r.productos || 3;
  let N = N0;
  const fuera = [], notas = [];
  const suave = modo === "suave";
  if((c.barrera || c.receta) && N > CFG.topes.barrera){ N = CFG.topes.barrera; }
  if(suave && N > CFG.topes.rojez_sensible) N = CFG.topes.rojez_sensible;
  // Reactividad «casi siempre» (auditoría D-05, base 6.5): como mucho 4 productos con el solar
  if(r.reactiva === "siempre" && N > 3){ N = 3; notas.push("Como tu piel reacciona a menudo, me quedo en pocos productos: así sabrás qué te sienta bien."); }
  if((c.rojez || c.reactiva) && N > CFG.topes.rojez_sensible){ N = CFG.topes.rojez_sensible; notas.push("Con rojez o piel sensible, más de cinco productos es demasiado: me quedo en cinco."); }
  // deseos de sérum, por orden de prioridad de problema
  const lista = [];
  // Correcciones de Hugo a los casos de prueba (24/11)
  const nf = r.notas_foto || {}, ap = r.aspecto_problema || {};
  const notaDe = p => ap[p] != null && typeof nf[ap[p]] === "number" ? nf[ap[p]] : null;
  const graso = ["P06", "P07"].some(x => P.includes(x));
  // piel grasa con arrugas a partir de 40 años, en la completa: retinal suave por la noche aunque lleve salicílico
  // retinoide suave por la noche desde los 35 (Hugo, 24/11): con arrugas <70, poros <55 o poros, textura, granitos o manchas en leve, en la media y la completa, antes que más salicílico o un segundo sérum de niacinamida
  const de35 = ["35-44", "45-54", "55+", "55-64", "65+"].includes(r.edad_tramo) || ["40-49", "50+"].includes(r.edad);
  const nb = k => typeof nf[k] === "number" ? nf[k] : 100;
  const combo40 = N0 >= 4 && de35 && (nb("arrugas") < 70 || nb("poros") < 55 || ["poros", "textura", "acne", "manchas"].some(k => nb(k) <= 69)) && !c.embarazo && !c.reactiva && !c.rojez && !r.mantenimiento && !suave && nb("hidratacion") >= 55 + B3;
  const madura = nb("arrugas") < 55 || nb("firmeza") < 55;   // piel madura: la básica ya lleva un activo antiedad
  const ordenDeseos = p => {
    let d = (DESEOS[p] || []).slice();
    if(r.mantenimiento) return p === "P31" && N0 >= 4 ? ["vitc"] : [];                       // mantenimiento: como mucho vitamina C
    if(r.reactiva === "siempre") d = d.map(x => ["calma", "antiacne", "despigmentante"].includes(x) ? "humectante" : x);   // piel que reacciona casi siempre: primero un sérum calmante de barrera (Hugo, 24/11)
    if(c.menor25 && ["P01", "P02"].includes(p)) d = ["antiacne"].concat(d.filter(x => x !== "antiacne"));   // acné joven: azelaico o niacinamida antes que el retinoide
    if(c.embarazo && ["P10", "P12", "P13"].includes(p)) d = ["despigmentante"].concat(d.filter(x => x !== "despigmentante"));   // embarazo con manchas: azelaico antes que la vitamina C
    return d;
  };
  if(c.menor18 && CFG.acne_14_17 === "limpiador_hidratante_solar") fuera.push({que: "Sérums de tratamiento", por: "De 14 a 17 años la rutina es limpiador, hidratante ligera y solar. Si los granos no mejoran, consulta en la farmacia o con un dermatólogo."});
  // Rutina suave (hay algo que consultar, la piel está irritada o hay un tratamiento con receta): siempre lleva un activo suave para la barrera.
  // Barrera dañada: tres productos y ninguno más. La niacinamida va dentro de la hidratante de barrera, no en un sérum aparte.
  if(suave && !c.menor18 && !c.barrera) lista.push({k: "barrera", por: orden[0]});
  if(!(c.menor18 && CFG.acne_14_17 === "limpiador_hidratante_solar")) for(const p of orden) for(const d of ordenDeseos(p)){
    let k = d;
    // exfoliante sin aclarado (Hugo, 24/11): con la piel deshidratada no entra; con una nota leve (50-69), solo en la completa y 2 noches
    if(["aha", "salicilico"].includes(k)){
      const nt = notaDe(p), nom = k === "aha" ? "Exfoliante con ácido" : "Loción de salicílico";
      if(typeof nf.hidratacion === "number" && nf.hidratacion <= 55 + B3){ if(!fuera.some(f => f.que === nom)) fuera.push({k, que: nom, por: "Con la piel deshidratada, primero se hidrata: el exfoliante espera."}); continue; }
      if(nt != null && nt >= 50 - B3 && N0 < 5){ if(!fuera.some(f => f.que === nom)) fuera.push({k, que: nom, por: "Con una nota leve no hace falta: el limpiador y el resto de la rutina bastan."}); continue; }
    }
    if(suave){
      if(k === "retinoide"){ if(!fuera.some(f => f.que === "Retinoide")) fuera.push({k: "retinoide", que: "Retinoide", por: "Queda para más adelante: primero la consulta y que la piel esté tranquila."}); continue; }
      if(k === "sebo") continue;                                       // ya va la niacinamida de la barrera
      if(k === "vitc" && veto.vitc_pura) continue;
      // la niacinamida ya va por la barrera: el segundo sérum es otro activo suave, o no hay segundo
      if(["antiacne", "despigmentante", "calma"].includes(k) && !F[k].activos.some(a => a !== "niacinamida" && !veto[a])) continue;
    }
    // Piel sensible, reactiva o con rojez: en lugar del ácido fuerte, un PHA. Si no se puede exfoliar nada, se dice.
    if((k === "aha" || k === "salicilico") && (suave || c.reactiva || c.rojez || veto.glicolico || (k === "salicilico" && veto.salicilico))){
      if(veto.pha){ if(!fuera.some(f => f.que === "Exfoliante")) fuera.push({que: "Exfoliante", por: veto.pha}); continue; }
      if(c.sequedad_activa){ if(!fuera.some(f => f.que === "Exfoliante")) fuera.push({que: "Exfoliante", por: "Con la piel seca, exfoliar empeora. La textura se trabaja hidratando."}); continue; }
      k = "pha";
    }
    if(k === "retinoide"){
      const motivoAcne = ["P01", "P02", "P03", "P07", "P16"].includes(p);
      if(veto.retinol && c.embarazo){ if(lista.some(x => ["despigmentante", "antiacne", "calma"].includes(x.k)) || (DESEOS[p] || []).some(x => ["despigmentante", "antiacne", "calma"].includes(x))) continue; k = "antiacne_o_azelaico"; }
      // Reactividad frecuente (Hugo, 24/11): primero la barrera; el bakuchiol se ofrece como alternativa cosmética, no como equivalente
      else if(veto.retinol && c.reactiva && !veto.bakuchiol && !motivoAcne && !c.menor25 && !c.rojez && !c.sequedad_activa && hayBakuchiol(veto, c)){ if(!fuera.some(f => f.que === "Retinoide")) fuera.push({que: "Retinoide", por: veto.retinol}); k = "bakuchiol"; }
      else if(veto.retinol){ fuera.push({que: "Retinoide", por: veto.retinol}); continue; }
      // menos de 25 (Hugo, 25/11, pregunta 4): con indicación de R32 (arrugas <65, textura <60, poros <55) puede usar retinoide; sin ella, no
      else if(c.menor25 && !motivoAcne && !(nb("arrugas") < 65 - B3 || nb("textura") < 60 - B3 || nb("poros") < 55 - B3)){ fuera.push({que: "Retinoide", por: "Con menos de 25 años no hace falta un retinoide antiedad. Antioxidante de mañana y solar."}); continue; }
      else if(c.rojez && !LIM(r).retinoide){ fuera.push({que: "Retinoide", por: "Con rojez fija, el retinoide solo entra cuando esté estable, y eso no lo puedo saber desde aquí."}); continue; }
      else if(c.sequedad_activa){ fuera.push({que: "Retinoide", por: "Mientras dure la sequedad, el retinoide espera. Cuando la piel deje de tirar, 1-2 noches por semana."}); continue; }
      // tope de una regla de la foto (Hugo, P-03): si no hay un retinal que lo cumpla y una crema reparadora sin perfume, el retinoide no entra
      else if(LIM(r).retinoide && !hayRetinoideTope(veto, c, LIM(r).retinoide)){ fuera.push({que: "Retinoide", por: LIM(r).retinoide.mensaje}); continue; }
    }
    if(k === "aha"){
      if(veto.glicolico){ fuera.push({que: "Exfoliante con ácido", por: veto.glicolico}); continue; }
      if(P.includes("P21") || P.includes("P23")) continue;
      if(c.sequedad_activa){ fuera.push({que: "Exfoliante con ácido", por: "Con la piel seca, exfoliar empeora. La textura se trata hidratando."}); continue; }
    }
    if(k === "salicilico" && veto.salicilico){ fuera.push({que: "Ácido salicílico", por: veto.salicilico}); continue; }
    if(k === "vitc" && c.menor18) continue;
    if(k === "glicolico_afeitado" && veto.glicolico){ continue; }
    if(!lista.some(x => x.k === k)) lista.push({k, por: p});
  }
  if(combo40 && !veto.retinal && !c.menor25){
    const i = lista.findIndex(x => x.k === "retinoide"), x = i >= 0 ? lista.splice(i, 1)[0] : {k: "retinoide", por: P.find(p => ["P17", "P07", "P20", "P12", "P02", "P03"].includes(p)) || "P17"};
    const iA = lista.findIndex(y => ["aha", "salicilico"].includes(y.k));
    lista.splice(Math.min(1, lista.length, iA >= 0 ? iA : 99), 0, x);   // segundo deseo, y siempre antes que un ácido: después del tratamiento principal, antes que el salicílico o la segunda niacinamida
  }
  if(madura && !c.menor25 && !c.embarazo && !suave && !veto.retinal && !veto.retinol){ const i = lista.findIndex(x => x.k === "retinoide"); if(i > 0) lista.unshift(lista.splice(i, 1)[0]); }
  // granitos y manchas a la vez: azelaico en la básica, que trata las dos cosas (Hugo, 24/11)
  if((P.some(p => ["P01", "P02", "P03"].includes(p)) || nb("acne") <= 69) && P.some(p => ["P10", "P12", "P13"].includes(p)) && !veto.azelaico && !suave){
    lista.unshift({k: "azelaico_mixto", por: P.find(p => ["P10", "P12", "P13"].includes(p))}); }
  // Menos de 30 años (Hugo, 24/11, caso 083): el retinoide facial solo entra con indicación: imperfecciones <65, textura <60, poros <55 o arrugas <65
  if(Object.keys(nf).length && ["14-17", "18-24", "25-34"].includes(r.edad_tramo) && !(nb("acne") < 65 - B3 || nb("textura") < 60 - B3 || nb("poros") < 55 - B3 || nb("arrugas") < 65 - B3)){
    const i = lista.findIndex(x => x.k === "retinoide");
    if(i >= 0){ lista.splice(i, 1); if(!fuera.some(f => f.que === "Retinoide")) fuera.push({k: "retinoide", que: "Retinoide", por: "Tu piel no lo necesita ahora: sin granitos, arrugas ni textura que tratar, solo añadiría irritación."}); }
  }
  // Manchas por debajo de 60 (Hugo, 24/11, R35): por la mañana, vitamina C o azelaico antes que un hialurónico o una niacinamida de barrera
  if(nb("manchas") < 60 && !suave && !r.mantenimiento){
    let iC = lista.findIndex(x => ["vitc", "despigmentante", "azelaico_mixto"].includes(x.k));
    if(iC < 0 && !veto.vitc_pura && !c.menor18 && !c.embarazo){ lista.push({k: "vitc", por: P.find(p => ["P10", "P12", "P13"].includes(p)) || "P31"}); iC = lista.length - 1; }
    const iH = lista.findIndex(x => ["humectante", "barrera"].includes(x.k));
    if(iC >= 0 && iH >= 0 && iC > iH) lista.splice(iH, 0, lista.splice(iC, 1)[0]);
    // en la completa, azelaico o tranexámico en lugar de repetir la vitamina C de la media
    // R35: con manchas <60 la vitamina C de la mañana se queda también en la completa (ciclo 15, C15-07)
    if(N0 >= 5 && !veto.azelaico && nb("manchas") >= 60){ const iV = lista.findIndex(x => x.k === "vitc"), iD = lista.findIndex(x => x.k === "despigmentante");
      if(iV >= 0 && iD > iV && lista.some(x => x.k === "retinoide")){ const t = lista[iV]; lista[iV] = lista[iD]; lista[iD] = t; lista[iV].activos = ["azelaico", "tranexamico"]; } }
  }
  // Vitamina C junto a los despigmentantes: si el tratamiento de granos ya trabaja las marcas (azelaico o niacinamida), la vitamina C entra antes que un despigmentante aparte
  { const iD = lista.findIndex(x => x.k === "despigmentante"), iC = lista.findIndex(x => x.k === "vitc");
    if(lista.some(x => x.k === "antiacne") && iD >= 0 && iC > iD){ const t = lista[iD]; lista[iD] = lista[iC]; lista[iC] = t; } }
  // el ácido exfoliante es el último en entrar: nunca le quita el sitio al retinoide
  if(lista.some(x => x.k === "retinoide")) lista.sort((a, b) => (["aha", "pha"].includes(a.k) && (a.por !== "P20" || combo40)) - (["aha", "pha"].includes(b.k) && (b.por !== "P20" || combo40)));
  // embarazo: azelaico ocupa el hueco del retinoide, de noche
  for(const x of lista) if(x.k === "antiacne_o_azelaico"){ x.k = "azelaico_noche"; }
  // Hito 1, propuestas 6 y 21 (Hugo, 27/11): la niacinamida no es el tratamiento principal de los granos (Cochrane CD011368: sin datos de eficacia).
  // El sérum para los granos es el ácido azelaico; la niacinamida solo ocupa ese hueco si el azelaico no se puede usar o ya va como azelaico mixto
  // (granos y marcas a la vez), y entonces se presenta como apoyo.
  // Sus otras funciones (brillo, poro, rojez, manchas, barrera) no cambian.
  const antiacne = veto.azelaico || lista.some(x => x.k === "azelaico_mixto") ? {...F.antiacne, activos: ["niacinamida"], para: "apoyar la piel con granos (la niacinamida es un apoyo, no el tratamiento principal)"} : {...F.antiacne, activos: ["azelaico"]};
  // si el azelaico ya trata los granos, el sérum de manchas usa otro despigmentante (sin dos azelaicos en la rutina; regresión del PR #17, T15 y C12-08)
  const despig = lista.some(x => x.k === "antiacne") && !veto.azelaico ? {...F.despigmentante, activos: F.despigmentante.activos.filter(a => a !== "azelaico")} : F.despigmentante;
  const deseoDe = k => k === "antiacne" ? antiacne : k === "despigmentante" ? despig : k === "azelaico_mixto" ? {f: "F10", turno: "AM", activos: ["azelaico"], para: "tratar los granitos y aclarar las marcas a la vez", flexible: true} : k === "azelaico_noche" ? {f: "F10", turno: "PM", activos: ["azelaico"], para: "ocupar el lugar del retinoide durante el embarazo o la lactancia"} : F[k];
  const deseo = deseoDe;
  // Vía Leve (Hugo, 24/11): sin ninguna nota en Moderado, se mantiene y se trata con UN solo activo suave dirigido a la nota más baja.
  // El activo sale de la tabla ingrediente × aspecto (suma de todas las notas); los ácidos exfoliantes sin aclarado no son «suaves».
  const ING = c.ing, notasF = A_FOTO.filter(k => typeof nf[k] === "number");
  const leve = !!ING && notasF.length > 0 && !r.mantenimiento && !suave && !c.menor18 && !c.barrera && !c.receta && Math.min(...notasF.map(k => nf[k])) >= 50 - B3;
  if(leve && (lista.length || !veto.niacinamida)){
    const pts = k => (ING.ranking.find(x => x.k === k) || {puntos: 0}).puntos;
    const pesoEn = (k, a) => ((NEC.TABLA.ingredientes[k] || {}).pesos || {})[a] || 0;
    let objetivo = notasF.filter(k => k !== "ojeras").sort((a, b) => nf[a] - nf[b] || a.localeCompare(b))[0];
    // la hidratación la cubre la hidratante: si otra nota está a 3 puntos o menos, el activo único va a esa (revisión clínica, C12-10)
    if(objetivo === "hidratacion"){ const otra = notasF.filter(k => !["ojeras", "hidratacion"].includes(k)).sort((a, b) => nf[a] - nf[b] || a.localeCompare(b))[0]; if(otra && nf[otra] - nf.hidratacion <= B3) objetivo = otra; }
    const NO_SUAVE = ["aha", "pha", "salicilico", "glicolico_afeitado"];   // exfoliantes: no son el activo suave único; en la completa entran solo con su indicación
    const notasObj = notasF.filter(k => k !== "ojeras"), minN = Math.min(...notasObj.map(k => nf[k]));
    const wObj = Object.fromEntries(notasObj.map(k => [k, Math.exp(-(nf[k] - minN) / 3) * (k === "hidratacion" ? .5 : 1)]));
    const sumW = Object.values(wObj).reduce((a, b) => a + b, 0) || 1;
    const pesoObj = a => notasObj.reduce((acc, k) => acc + wObj[k] * Math.min(3, pesoEn(a, k)) / 3, 0) / sumW;
    let mejor = null;
    if(!veto.niacinamida && !lista.some(x => ((x.activos || (deseoDe(x.k) || {}).activos) || []).includes("niacinamida"))) lista.push({k: "niacinamida", por: orden[0], _tabla: true});
    for(const x of lista){
      if(NO_SUAVE.includes(x.k) || (r._excluir || []).includes(x.k)) continue;
      const d = deseoDe(x.k); if(!d) continue;
      if(r.reactiva === "siempre" && d.fuerte && x.k !== "retinoide") continue;   // piel que reacciona casi siempre: el activo único no es fuerte (ciclo 4), salvo el retinoide en fórmula calmante y dosis de inicio (Hugo, 25/11)
      const acts = d.humectante ? ["hialuronico"] : (x.activos || d.activos || []).filter(a => !veto[a]);
      if(!acts.length) continue;
      // Hugo, 25/11 (pregunta 13): sin salto en «la nota más baja». Cada nota pesa más cuanto más cerca está de la más baja (a 3 puntos, ~1/3)
      const sc = Math.max(...acts.map(a => pts(a) * (.5 + .5 * pesoObj(a))));   // cuanto más trata la nota más baja, más cuenta (antes: todo o nada desde peso 1; ciclo 7)
      if(!mejor || sc > mejor.sc + 1e-9) mejor = {x, sc, acts: d.humectante ? null : acts.slice().sort((a, b) => pts(b) - pts(a) || a.localeCompare(b))};
    }
    // Hugo, 25/11 (pregunta 11): granitos y manchas por debajo de 65 a la vez, el azelaico de mañana es el activo único (trata las dos cosas)
    const azMix = nb("acne") < 65 && nb("manchas") < 65 && Math.max(nb("acne"), nb("manchas")) < Math.min(...notasF.filter(k => !["acne", "manchas", "ojeras", "hidratacion"].includes(k)).map(k => nf[k]), 101) && !veto.azelaico && !(r._excluir || []).includes("azelaico_mixto");
    if(azMix && !c.embarazo){ const am = lista.find(x => x.k === "azelaico_mixto"); if(am) mejor = {x: am, sc: 0, acts: ["azelaico"]}; }
    // Hugo, 25/11 (pregunta 18): piel que reacciona siempre con rojez <60 y manchas <60. Primero la barrera 4 semanas; en la completa, el puente es el azelaico suave de mañana (nunca vitamina C pura)
    const barreraPrimero = r.reactiva === "siempre" && nb("rojez") < 60 && nb("manchas") < 60;
    if(barreraPrimero){
      if(N0 >= 5 && !veto.azelaico && !(r._excluir || []).includes("azelaico_mixto")){ mejor = {x: lista.find(x => x.k === "azelaico_mixto") || {k: "azelaico_mixto", por: orden[0]}, sc: 0, acts: ["azelaico"]};
        notas.push("Empieza el ácido azelaico 3 mañanas por semana y sube a diario si no pica ni enrojece. Las manchas mejoran cuando la piel está tranquila."); }
      else notas.push("Las manchas se tratan a partir de la cuarta semana, cuando tu piel esté más tranquila. Ahora lo primero es reparar la barrera.");
    }
    // R4 (Hugo): embarazo con manchas, azelaico ya en la básica; también en la lactancia (Hugo, 25/11, pregunta 3)
    if(c.embarazo && nb("manchas") <= 69 + B3 && !veto.azelaico && !(r._excluir || []).some(k => ["despigmentante", "azelaico_mixto"].includes(k))){ const dp = lista.find(x => ["despigmentante", "azelaico_mixto"].includes(x.k)); if(dp) mejor = {x: dp, sc: 0, acts: ["azelaico"]}; else mejor = {x: {k: "azelaico_mixto", por: orden[0]}, sc: 0, acts: ["azelaico"]}; }   // sin deseo de manchas (p. ej. el problema es el acné), el azelaico igual (ciclo 6)
    if(!mejor && !veto.pha && !c.sequedad_activa) mejor = {x: {k: "pha", por: orden[0]}, sc: 0, acts: null};
    for(const x of lista) if((!mejor || x !== mejor.x) && !x._tabla){ const nom = nombreDeseo(x.k); if(!fuera.some(f => f.que === nom)) fuera.push({k: x.k, que: nom, por: "Tu piel está en la franja leve: un solo activo suave, dirigido a tu nota más baja. Lo demás se cuida con la rutina base."}); }
    // la media y la completa no rellenan: solo suman los pasos con indicación de Hugo (R21: retinoide desde los 35 con arrugas <70 o poros <55; R35: manchas <60, vitamina C o azelaico de mañana)
    // y en la completa, el exfoliante que deja entrar la regla de nota leve (Hugo: con 50-69, solo en la completa y 2 noches)
    const conIndicacion = N0 >= 4 ? lista.filter(x => x !== (mejor && mejor.x) && !(r._excluir || []).includes(x.k) && ((x.k === "retinoide" && combo40) || (nb("manchas") < 60 && ["vitc", "despigmentante", "azelaico_mixto"].includes(x.k)) || (N0 >= 5 && ["aha", "pha", "salicilico"].includes(x.k)))) : [];
    { const exf = conIndicacion.filter(x => ["aha", "pha", "salicilico"].includes(x.k)); for(const x of exf.slice(1)){ conIndicacion.splice(conIndicacion.indexOf(x), 1); } }
    // …con el azelaico de mañana, sin salicílico sin aclarado, y de noche un retinoide suave o niacinamida desde la media (pregunta 11)
    if(azMix && mejor && mejor.x.k === "azelaico_mixto"){
      for(const x of conIndicacion.filter(y => ["salicilico", "aha", "pha", "vitc", "despigmentante"].includes(y.k))) conIndicacion.splice(conIndicacion.indexOf(x), 1);
      if(N0 >= 4 && !conIndicacion.some(x => x.k === "retinoide")){
        const okRet = !c.embarazo && !c.menor18 && !veto.retinal && !(r._excluir || []).includes("retinoide") && nb("hidratacion") >= 55 + B3;
        const rt = okRet ? (lista.find(x => x.k === "retinoide") || {k: "retinoide", por: orden[0]}) : (!veto.niacinamida ? (lista.find(x => x.k === "niacinamida") || {k: "niacinamida", por: orden[0], _tabla: true}) : null);
        if(rt && !conIndicacion.includes(rt)) conIndicacion.push(rt);
      }
    }
    // R35: un solo paso de mañana para las manchas y el mismo en la media y la completa: vitamina C primero, salvo que la foto pida evitarla (ciclos 11-12, C11-05, C12-06)
    { const PREF = ["vitc", "azelaico_mixto", "despigmentante"], mch = conIndicacion.filter(x => PREF.includes(x.k)); if(!(((r.bonus_activos || {}).vitc_pura || 0) < 0)) mch.sort((a, b) => PREF.indexOf(a.k) - PREF.indexOf(b.k)); for(const x of mch.slice(1)) conIndicacion.splice(conIndicacion.indexOf(x), 1); }
    // Vitamina C estable de mañana en la media y la completa (Hugo, 25/11: «podría ponerse una vitamina C, quizá no un 15 %, pero sí una estabilizada más suave»):
    // solo derivados, solo si el activo único va de noche (un sérum por momento del día) y con tono, manchas, arrugas o firmeza por debajo de 70
    { const vc = lista.find(x => x.k === "vitc"), tm = x => (deseoDe(x.k) || {}).turno;
      // Hugo, 25/11 (pregunta 16): desde los 35 años, la vitamina C de mañana es el escalón de la media en la franja leve, salvo reactividad «siempre» o rojez marcada
      const vc2 = vc || (de35 && mejor && mejor.x.k !== "vitc" ? {k: "vitc", por: orden[0] || "P31"} : null);
      if(N0 >= 4 && vc2 && mejor && vc2 !== mejor.x && !(azMix && mejor.x.k === "azelaico_mixto") && !conIndicacion.includes(vc2) && (tm(mejor.x) === "PM" || (deseoDe(mejor.x.k) || {}).flexible) && !conIndicacion.some(x => tm(x) === "AM" || ["vitc", "azelaico_mixto", "despigmentante"].includes(x.k))
        && !veto.vitc_derivados && !(((r.bonus_activos || {}).vitc_derivados || 0) < 0) && r.reactiva !== "siempre" && nb("rojez") >= 55 - B3 && (de35 || ["tono", "manchas", "arrugas", "firmeza"].some(k => nb(k) < 70))){ vc2.activos = ["vitc_derivados"]; conIndicacion.push(vc2); } }
    // …y la completa suma un activo renovador de noche desde los 35 años (retinal suave según tolerancia), si aún no lo lleva
    if(N0 >= 5 && de35 && mejor && !c.embarazo && !c.menor25 && !veto.retinal && mejor.x.k !== "retinoide" && !conIndicacion.some(x => x.k === "retinoide") && !(r._excluir || []).includes("retinoide") && !r.mantenimiento && nb("hidratacion") >= 55 + B3){
      const rt = lista.find(x => x.k === "retinoide") || {k: "retinoide", por: orden[0] || "P17"}; conIndicacion.push(rt); }
    for(const x of lista) if(conIndicacion.includes(x)){ const nom = nombreDeseo(x.k), i = fuera.findIndex(f => f.que === nom); if(i >= 0) fuera.splice(i, 1); }
    conIndicacion.sort((a, b) => ["aha", "pha", "salicilico"].includes(a.k) - ["aha", "pha", "salicilico"].includes(b.k));   // el exfoliante, el último: antes la vitamina C y el renovador (Hugo, 25/11, pregunta 16)
    // la completa de la franja leve (pregunta 16): vitamina C de mañana y retinal de noche. Con un sérum por turno, el activo suave de la básica cede su sitio al retinal
    if(N0 >= 5 && mejor && conIndicacion.some(x => x.k === "retinoide") && conIndicacion.some(x => x.k === "vitc") && (deseoDe(mejor.x.k) || {}).flexible && !["vitc", "azelaico_mixto", "despigmentante", "retinoide"].includes(mejor.x.k) && r.reactiva !== "siempre"){
      const nom = nombreDeseo(mejor.x.k); if(!fuera.some(f => f.que === nom)) fuera.push({k: mejor.x.k, que: nom, por: "En la rutina completa, la mañana es para la vitamina C y la noche para el retinal: un sérum por momento del día."}); mejor = null; }
    lista.length = 0;
    if(mejor){ const y = Object.assign({}, mejor.x, {leve: true}); if(mejor.acts) y.activos = mejor.acts; lista.push(y); }
    lista.push(...conIndicacion);
  }

  // Reparto: 1 limpiador · 2 sérum principal · 3 hidratante · 4 sérum del otro turno · 5 contorno · 6 otro
  const huecos = [{slot: "L", etiqueta: "Limpiador", turno: "AMPM"}];
  const serums = [];
  const cabe = (d, usados) => {
    if(d.fuerte && usados.some(u => u.fuerte && u.turno === d.turno && !(u.k === "retinoide" && ["aha", "pha"].includes(d.k)) && !(d.k === "retinoide" && ["aha", "pha"].includes(u.k)))) return false;
    return true;
  };
  // Escalado (Hugo, 27/11): el nivel superior parte del anterior. Sus sérums van primero, en el mismo orden; lo nuevo se suma detrás
  if(r._previo && r._previo.deseos) for(const d of r._previo.deseos){ if(lista.some(x => x.k === d.k) || (r._excluir || []).includes(d.k) || (d.activos && d.activos.length && d.activos.every(a => veto[a])) || fuera.some(f => f.k === d.k && /la mañana es para la vitamina C/.test(f.por))) continue;
    const y = Object.assign({}, d); if(y.activos) y.activos = y.activos.filter(a => !veto[a]); lista.push(y); const i = fuera.findIndex(f => f.k === d.k); if(i >= 0) fuera.splice(i, 1); }
  if(r._previo && r._previo.serums){ const pos = k => { const i = r._previo.serums.indexOf(k); return i < 0 ? 99 : i; }; const l2 = lista.map((x, i) => [x, i]).sort((a, b) => pos(a[0].k) - pos(b[0].k) || a[1] - b[1]).map(z => z[0]); lista.length = 0; lista.push(...l2); }
  const ojos = ["P15", "P17", "P18", "P19"].some(x => P.includes(x));
  // quinto producto: otro tratamiento antes que un contorno que nadie ha pedido. Escalado (Hugo, 27/11): en la completa, un ingrediente principal que
  // no cabe gana al contorno de relleno; el contorno solo se queda el hueco con ojeras por debajo de 60 (R31). Antes bastaba con arrugas o firmeza para quitarle el sitio
  const tercero = N === 5 && !suave && (r._escalado ? nb("ojeras") >= 60 : !ojos) && !c.reactiva && !c.rojez && lista.length > 2;
  // ojeras por debajo de 60 (Hugo, 24/11, R31): contorno también en la básica y la media. En la básica, solo si no hay algo peor que tratar con el sérum
  const peorQueOjeras = A_FOTO.some(k => k !== "ojeras" && nb(k) < nb("ojeras"));
  const reservaOjos = nb("ojeras") < 60 && N < 5 && !suave && !c.menor18 && !c.barrera && !c.receta && (N >= 4 || !peorQueOjeras) ? 1 : 0;
  // R35 frente al contorno (Hugo, 25/11, pregunta 2): con manchas <60, desde la media el contorno no le quita el hueco a la vitamina C o el azelaico de mañana (máximo 6 productos con el solar)
  const r35 = N >= 4 && nb("manchas") < 60 && !r.mantenimiento && lista.some(x => ["vitc", "despigmentante", "azelaico_mixto"].includes(x.k));
  const maxSerums = c.barrera || c.receta || c.procedimiento ? 0 : leve && N < 4 ? (reservaOjos ? 0 : 1) : Math.max(0, (N >= 6 || tercero ? 3 : N >= 4 ? 2 : 1) - (r35 ? 0 : reservaOjos));
  // …y una función nueva que solo es niacinamida no ocupa un sérum si la hidratante del nivel anterior ya la lleva a dosis: ya está cubierta
  const hPrev = r._previo && r._previo.fijar && r._previo.fijar["s:H"] ? (LISTA || CATALOGO).find(q => q.id === r._previo.fijar["s:H"]) : null, enHidratante = [];
  for(const x of lista){
    if((r._excluir || []).includes(x.k)) continue;
    if((r._esperan || []).includes(x.k)){ if(!fuera.some(f => f.k === x.k)) fuera.push({k: x.k, que: nombreDeseo(x.k), por: "Un sérum por momento del día: no cabe sin quitarte algo que ya llevas. Es el siguiente paso."}); continue; }
    if(hPrev && !r._previo.serums.includes(x.k) && aDosis(hPrev, "niacinamida") && (x.activos || (deseoDe(x.k) || {}).activos || []).every(a => a === "niacinamida") && ((deseoDe(x.k) || {}).activos || []).length){ enHidratante.push({k: x.k, que: nombreDeseo(x.k), por: "Va en la hidratante.", acts: ["niacinamida"]}); continue; }
    if(c.barrera || c.receta){ if(!fuera.some(f => f.k === x.k)) fuera.push({k: x.k, que: nombreDeseo(x.k), por: c.receta ? "Con un tratamiento con receta, limpiador, hidratante y solar. Los tratamientos se eligen después de revisar contigo lo que usas." : "Mientras la piel se recupera, nada más que limpiador, hidratante y solar. Entrará después, de uno en uno."}); continue; }
    if(serums.length >= maxSerums){ if(!fuera.some(f => f.k === x.k)) fuera.push({k: x.k, que: nombreDeseo(x.k), por: N0 < 5 || !r._escalado ? (N0 < 6 ? "En esta rutina ya no cabe. Entraría en una con más pasos." : "No cabe sin sumar demasiados activos.") : c.reactiva || c.rojez || r.reactiva === "siempre" ? "Con piel que reacciona o con rojez, no más activos a la vez. Entra cuando toleres los anteriores." : "No cabe sin pasar de 6 productos: es el siguiente paso, cuando toleres bien esta rutina."}); continue; }
    const d = Object.assign({k: x.k, por: x.por}, deseo(x.k));
    if(x.activos){ d.activos = x.activos.filter(a => !veto[a]); d.restringido = !x.leve; }
    if(x.leve) d.leve = true;
    if(suave && d.activos && serums.some(s => s.k === "barrera")) d.activos = d.activos.filter(a => a !== "niacinamida");
    if(d.k === "salicilico" && serums.some(s => s.k === "retinoide") && r.retinoide_exp !== "tolera" && !combo40){
      fuera.push({k: "salicilico", que: "Loción de salicílico", por: "Mientras empiezas el retinoide, el salicílico va solo en el limpiador."}); continue; }
    if(d.k === "aha" || d.k === "pha"){
      const nom = d.k === "pha" ? "Exfoliante suave (PHA)" : "Exfoliante con ácido";
      if(serums.some(s => s.k === "retinoide") && r.retinoide_exp !== "tolera"){ fuera.push({k: d.k, que: nom, por: "El ácido entra cuando ya toleres el retinoide. Empezar los dos a la vez irrita."}); continue; }
      if(serums.some(s => s.k === "salicilico")){ fuera.push({k: d.k, que: nom, por: "Ya llevas salicílico sin aclarado; dos exfoliantes son demasiados."}); continue; }
    }
    // dos activos fuertes no se empiezan a la vez: si ya va un ácido o un salicílico sin aclarado, el retinoide nuevo espera
    if(d.k === "retinoide" && r.retinoide_exp !== "tolera" && serums.some(s => ["aha", "pha"].includes(s.k) || (s.k === "salicilico" && !combo40))){
      fuera.push({k: "retinoide", que: "Retinoide", por: serums.some(s => s.k === "salicilico") ? "Entra cuando lleves unas semanas con el salicílico y lo toleres. Empezar los dos a la vez irrita." : "Entra cuando ya toleres el exfoliante. Empezar los dos a la vez irrita."}); continue; }
    // el segundo sérum va al turno contrario
    if(serums.length >= 1 && d.flexible){ const am = serums.filter(s => s.turno === "AM").length, pm = serums.length - am; d.turno = am > pm ? "PM" : am < pm ? "AM" : d.k === "despigmentante" ? "PM" : (serums[serums.length - 1].turno === "AM" ? "PM" : "AM");
      // misma noche que el retinoide: despigmentante suave, no azelaico (el azelaico iría de mañana)
      if(d.turno === "PM" && serums.some(s => s.k === "retinoide") && d.activos) d.activos = d.activos.filter(a => a !== "azelaico"); }
    if(serums.length >= 1 && !d.flexible && serums.some(s => s.turno === d.turno) && !(["aha", "pha"].includes(d.k) && serums.some(s => s.k === "retinoide")) && !(d.k === "retinoide" && serums.some(s => ["aha", "pha"].includes(s.k)))){
      // mismo turno y no se puede mover: solo si el que estaba es flexible
      // el salicílico sin retinoide va de noche (regla de abajo): se puede mover ya, para no dejar fuera la vitamina C de la mañana (ciclo 20, C20-10)
      const otro = serums.find(s => s.turno === d.turno && (s.flexible || (s.k === "salicilico" && d.turno === "AM" && !serums.some(q => q.k === "retinoide"))));
      // la vitamina C comparte la mañana con un tratamiento suave antes que mandarlo a la noche del retinoide
      if(otro && d.k === "vitc" && serums.some(s => s.k === "retinoide")){ /* los dos de mañana */ }
      else if(otro) otro.turno = d.turno === "AM" ? "PM" : "AM";
      else { fuera.push({k: x.k, que: nombreDeseo(x.k), por: "Ocuparía el mismo turno que otro activo fuerte."}); continue; }
    }
    if(!cabe(d, serums)){ fuera.push({k: x.k, que: nombreDeseo(x.k), por: "Un solo activo fuerte por turno."}); continue; }
    serums.push(d);
  }
  // salicílico sin aclarado (Hugo, 24/11): nunca a diario. Con retinoide, por la mañana; sin él, por la noche alternando con el otro sérum
  { const sal = serums.find(s => s.k === "salicilico"); if(sal) sal.turno = serums.some(s => s.k === "retinoide") ? "AM" : "PM"; }
  // un sérum por momento del día: lo que va a diario no se junta con otro sérum diario en el mismo turno (los de frecuencia alternan)
  for(const T of ["AM", "PM"]){
    for(;;){
      const diarios = serums.filter(s => s.turno === T && !CON_FRECUENCIA.includes(s.k));
      if(diarios.length <= 1) break;
      // Hugo, 25/11 (pregunta 10): un sérum por turno, sin excepciones. Si chocan vitamina C y azelaico de mañana, azelaico con rojez, granitos, embarazo o lactancia; si no, vitamina C
      if(T === "AM"){
        const esAz = s => s.k === "azelaico_mixto" || ((s.activos || (F[s.k] || {}).activos || []).includes("azelaico") && ["despigmentante", "antiacne", "calma"].includes(s.k));
        const az = diarios.find(esAz), vc = diarios.find(s => s.k === "vitc");
        if(az && vc){ const prefAz = nb("rojez") < 60 || nb("acne") < 65 || c.embarazo; const q = prefAz ? vc : az;
          const libre2 = !serums.some(s => s.turno === "PM" && !CON_FRECUENCIA.includes(s.k));
          if(q === az && libre2 && !serums.some(s => s.k === "retinoide")){ az.turno = "PM"; continue; }
          serums.splice(serums.indexOf(q), 1); fuera.push({k: q.k, que: nombreDeseo(q.k), por: "Un sérum por momento del día: por la mañana va " + (prefAz ? "el azelaico, que también calma y trata los granitos." : "la vitamina C.")}); continue; }
      }
      const otro = T === "AM" ? "PM" : "AM", libre = !serums.some(s => s.turno === otro && !CON_FRECUENCIA.includes(s.k));
      const mov = diarios.filter(s => s.flexible && !(otro === "PM" && ["vitc", "despigmentante", "azelaico_mixto"].includes(s.k))).pop();
      if(mov && libre){ mov.turno = otro; continue; }
      const x = diarios[diarios.length - 1];
      serums.splice(serums.indexOf(x), 1);
      fuera.push({k: x.k, que: nombreDeseo(x.k), por: "Un sérum por momento del día: más capas no suman y pueden hacer bolitas."});
    }
  }
  // antioxidantes y antimanchas por la mañana; la noche, para el retinoide (Hugo, 24/11)
  { const pm = serums.find(s => s.turno === "PM" && ["despigmentante", "vitc", "azelaico_mixto"].includes(s.k)), am = serums.find(s => s.turno === "AM" && !CON_FRECUENCIA.includes(s.k) && !["despigmentante", "vitc", "azelaico_mixto"].includes(s.k) && s.flexible);
    if(pm && serums.some(s => s.k === "retinoide")){ if(am){ am.turno = "PM"; pm.turno = "AM"; } else if(!serums.some(s => s.turno === "AM" && !CON_FRECUENCIA.includes(s.k))) pm.turno = "AM"; } }
  // Reactividad «a veces» (Hugo, 24/11): se empieza con un solo activo fuerte; el segundo, a partir del mes
  if(r.reactiva === "a_veces"){ const FK = ["retinoide", "aha", "pha", "salicilico", "glicolico_afeitado", "bakuchiol"]; const fu = serums.filter(s => FK.includes(s.k));
    for(const s of fu.slice(1)){ serums.splice(serums.indexOf(s), 1); fuera.push({k: s.k, que: nombreDeseo(s.k), por: "Tu piel reacciona a veces: empieza con un solo activo fuerte. Este se añade a partir del mes, si el primero te sienta bien."}); }
    if(fu.length > 1) notas.push("Como tu piel reacciona a veces, empiezas con un solo activo fuerte. El segundo se añade a partir del mes, si el primero te sienta bien."); }
  // si al quitar un sérum la mañana se queda sin ninguno, el flexible que se pasó a la noche vuelve a la mañana (Lucía, 25/11: niacinamida de noche junto al retinal)
  if(!serums.some(s => s.turno === "AM" && !CON_FRECUENCIA.includes(s.k))){ const f = serums.find(s => s.turno === "PM" && s.flexible && !CON_FRECUENCIA.includes(s.k) && serums.some(o => o !== s && o.turno === "PM")); if(f) f.turno = "AM"; }
  serums.forEach((s, i) => huecos.push({slot: "serum" + (i + 1), etiqueta: s.turno === "PM" ? "Sérum de noche" : "Sérum de mañana", turno: s.turno, deseo: s}));
  huecos.push({slot: "H", etiqueta: "Hidratante", turno: "AMPM"});
  let contornoOjeras = false;
  if(reservaOjos) contornoOjeras = true;
  else if(P.includes("P15") && N < 5 && !suave && !c.menor18){
    if(serums.length < maxSerums) contornoOjeras = true;
    else fuera.push({que: "Contorno de ojos", por: "En esta rutina ya no cabe: va antes el tratamiento de lo demás. Entraría en una con más pasos."});
  }
  if(contornoOjeras) huecos.push({slot: "contorno", etiqueta: "Contorno de ojos", turno: "AMPM"});
  if(P.includes("P15") && suave) fuera.push({que: "Contorno de ojos", por: "Queda para más adelante: primero la consulta y que la piel esté tranquila."});
  if(P.includes("P09") && !suave) huecos.push({slot: "posafeitado", etiqueta: "Después del afeitado", turno: "AM"});
  // el contorno solo entra si lo que se quiere mejorar está en los ojos (ojeras, arrugas, firmeza)
  // Hugo, 25/11 (pregunta 9): el contorno entra solo por su nota de ojeras (<75 en la completa), nunca por las arrugas de la cara
  if(N >= 5 && (nb("ojeras") < 75 || r.mantenimiento) && !suave && !c.menor18 && !huecos.some(h => h.slot === "contorno") && huecos.length + 2 <= 6) huecos.push({slot: "contorno", etiqueta: "Contorno de ojos", turno: "AMPM"});
  if(N >= 6 && !suave && serums.length < 3){
    if(c.piel === "seca" || P.includes("P28")) huecos.push({slot: "H2", etiqueta: "Crema de noche", turno: "PM"});
  }
  if(huecos.length < N && !suave && !c.menor18 && !c.barrera && !c.receta) notas.push(`Te pongo ${huecos.length} productos y no ${N}: no hay nada más que tu piel necesite ahora, y un paso de relleno no mejora el resultado.`);
  huecos.push({slot: "S", etiqueta: "Protector solar", turno: "AM", aparte: true});

  // Semana
  const ret = serums.find(s => s.k === "retinoide" || s.k === "bakuchiol");
  const aha = serums.find(s => s.k === "aha" || s.k === "pha" || s.k === "glicolico_afeitado");
  let nochesRet = [], escalado = null;
  if(ret && ret.k === "retinoide"){
    const acne = ["P01", "P02"].includes(ret.por);
    if(c.reactiva || c.reactiva_a_veces){ nochesRet = ["L", "J"]; escalado = "Piel sensible: 1-2 noches por semana, en sándwich (hidratante, retinoide, hidratante), durante 8 semanas. Techo: 3 noches."; }
    else if(acne && (r.retinoide_exp === "nunca" || !r.retinoide_exp)){ nochesRet = ["L", "J"]; escalado = "Semanas 1-4: 2 noches no seguidas, para que la piel se acostumbre. Después, noches alternas y, si lo toleras, cada noche."; }
    else if(acne){ nochesRet = ["L", "X", "V", "D"]; escalado = "Con granos, noches alternas y, si lo toleras, cada noche. Espaciarlo le quita eficacia."; }
    // Acné del adulto (P03): la piel adulta se irrita antes (Dréno 2013, doi:10.1111/jdv.12061; Bagatin 2021, doi:10.1080/17512433.2021.1917376). Empieza más despacio que P01/P02 y llega a alternas, como dice el catálogo v2.
    else if(ret.por === "P03"){ nochesRet = ["L", "J"]; escalado = "Semanas 1-4: 2 noches no seguidas, entre dos capas de hidratante. Después, noches alternas si no irrita. Si la piel tira o escuece, vuelve a 2 noches."; }
    else if(r.retinoide_exp === "nunca" || !r.retinoide_exp){ nochesRet = ["L", "J"]; escalado = "Semanas 1-4: 2 noches no seguidas. Semanas 5-12: 3 noches. Desde la 13: 3 noches, que es el mantenimiento. Si lo toleras y quieres más, noches alternas."; }
    else { nochesRet = ["L", "X", "V"]; escalado = r.retinoide_exp === "reciente" ? "Ya lo usas desde hace poco: 3 noches por semana hasta la semana 12." : "Ya lo toleras: 3 noches por semana. Si quieres más, noches alternas."; }
    if(c.fototipo_oscuro && !acne && nochesRet.length > 2) nochesRet = ["L", "J"];
    if(c.mayor50 && nochesRet.length > 3) nochesRet = ["L", "X", "V"];
    const L = LIM(r).retinoide;
    // concentración según la experiencia (Hugo, 24/11)
    escalado = (r.retinoide_exp === "nunca" || !r.retinoide_exp ? "Es tu primer retinoide: empiezas con una concentración baja y subes cuando la piel lo tolere, a partir de unos 3 meses. " : "") + escalado;   // laboratorio (27/11, T1-46, L02): sin prometer una concentración que el producto elegido puede no tener
    if(L){ nochesRet = ["L", "J"].slice(0, L.noches || 2); escalado = `Retinal suave (hasta ${fmt(L.max_pct)} %) ${nochesRet.length} noches por semana, no seguidas, en sándwich: hidratante, retinal, hidratante. Mientras haya rojez no se sube de ${nochesRet.length} noches.`; }
  }
  // salicílico: 3 días por semana (2 si la nota es leve), sin coincidir con el retinoide ni con el ácido
  const salS = serums.find(s => s.k === "salicilico");
  let nochesSal = [];
  if(salS){ const n0 = (notaDe(salS.por) ?? 0) >= 50 ? 2 : 3; nochesSal = (salS.turno === "AM" ? ["M", "X", "V", "S", "D", "L"] : ["M", "X", "S", "V", "D", "L"]).filter(x => !nochesRet.includes(x)).slice(0, n0); }   // ni la mañana del día del retinoide (auditoría 24/11)
  let nochesAha = [];
  // Hugo, 25/11 (pregunta 20): AHA 2 noches separadas en la completa con piel que no reacciona y sin retinoide; 1 noche con retinoide o reactividad
  if(aha){ nochesAha = aha.k === "glicolico_afeitado" ? (ret ? ["M", "S"] : ["M", "J", "S"]) : aha.k === "aha" && !ret && N0 >= 5 && r.reactiva === "nunca" && !c.reactiva && !c.rojez ? ["M", "S"] : ["D"].filter(x => !nochesRet.includes(x)); if(aha.k !== "glicolico_afeitado" && !nochesAha.length) nochesAha = ["S"]; if(c.fototipo_oscuro) nochesAha = nochesAha.slice(0, 1); }
  const semana = DIAS.map(dia => {
    const paso = ["Limpiador"];
    const hayFrec = (ret && ret.k === "retinoide" && nochesRet.includes(dia)) || (aha && nochesAha.includes(dia)) || (salS && salS.turno === "PM" && nochesSal.includes(dia));
    for(const s of serums.filter(s => s.turno === "PM")){
      if((s.k === "retinoide") && !nochesRet.includes(dia)) continue;
      if(s.k === "salicilico" && !nochesSal.includes(dia)) continue;
      if(!CON_FRECUENCIA.includes(s.k) && hayFrec) continue;   // las noches del activo fuerte, el otro sérum descansa
      if((s.k === "aha" || s.k === "pha" || s.k === "glicolico_afeitado") && !nochesAha.includes(dia)) continue;
      paso.push(etiquetaDeseo(s.k));
    }
    paso.push(ret && nochesRet.includes(dia) && (c.reactiva || (ret.k === "retinoide" && LIM(r).retinoide && LIM(r).retinoide.sandwich)) ? "Hidratante (antes y después)" : "Hidratante");
    return {dia, noche: paso};
  });
  const vistos = new Set(), fuera1 = fuera.filter(x => !vistos.has(x.que) && vistos.add(x.que));
  // Escalado (Hugo, 27/11: «no puede ser que te quedes sin dirigir un ingrediente»): lo que se queda sin sérum solo por sitio o por el sérum único de cada turno
  // lo cubre la hidratante si hay una crema que lleve a dosis su niacinamida o su azelaico. Lo que espera por tolerancia o seguridad no entra aquí
  const bonH = r.bonus_activos || {}, actsH = k => ((deseoDe(k) || {}).activos || []).filter(a => H_CUBRE.includes(a) && !veto[a] && !((bonH[a] || 0) < 0));
  const cubrirH = r._escalado && r._top && !suave ? fuera1.filter(f => f.k && SOLO_SITIO.test(f.por) && actsH(f.k).length).map(f => Object.assign({}, f, {acts: actsH(f.k)})) : [];
  return {orden, N, N0, huecos, serums, semana, escalado, fuera: fuera1, notas, nochesRet, nochesAha, nochesSal, lista, leve, cubrirH: cubrirH.concat(enHidratante), enHidratante};
}
const NOMBRE_DESEO = {niacinamida: "Niacinamida", retinoide: "Retinoide", bakuchiol: "Bakuchiol", aha: "Exfoliante con ácido", salicilico: "Loción de salicílico", antiacne: "Azelaico o niacinamida",
  despigmentante: "Despigmentante", pha: "Exfoliante suave (PHA)", barrera: "Niacinamida", vitc: "Vitamina C", calma: "Niacinamida o azelaico", sebo: "Niacinamida", humectante: "Sérum hidratante", glicolico_afeitado: "Loción con glicólico", azelaico_noche: "Ácido azelaico", azelaico_mixto: "Ácido azelaico"};
const nombreDeseo = k => NOMBRE_DESEO[k] || k;
const etiquetaDeseo = k => ({retinoide: "Retinoide", pha: "PHA (exfoliante suave)", barrera: "Niacinamida", aha: "Ácido exfoliante", glicolico_afeitado: "Glicólico", despigmentante: "Despigmentante", azelaico_noche: "Azelaico", azelaico_mixto: "Azelaico", antiacne: "Azelaico o niacinamida", calma: "Niacinamida o azelaico", sebo: "Niacinamida", bakuchiol: "Bakuchiol", humectante: "Sérum hidratante"}[k] || nombreDeseo(k));

/* ------------------------------------------------------------------ 5 · Productos */
// Marcas que Hugo no recomienda (copiado de lib/motor.js de su web)
const MARCAS_EXCLUIDAS = ["Labelist","LÆRA","Laera","Nivea","Dove","Deliplus","Mixa","Diadermine","Babaria","Byphasse","Ziaja","7 Days"];
const normMarca = s => n(s).replace(/[^a-z0-9]/g, "");
const EXCL_MARCA = new Set([...MARCAS_EXCLUIDAS].map(normMarca));
const PROHIBIDOS_UE = ["zinc pyrithione", "hydroquinone", "4-methylbenzylidene camphor", "butylphenyl methylpropional"];
const CUERPO = /corporal|body|cuerpo|manos|hand |pies|champu|shampoo|capilar|cabello|labios|labial/;
// Correcciones de Hugo a los casos de prueba (24/11): productos que no van en el uso diario o que piden un perfil concreto
const NO_DIARIO = /post.?act|post.?procedimiento|post.?laser|\bscrub\b|exfoliante|exfoliant|peeling|3 en 1/;   // posprocedimiento y exfoliantes físicos
const INCI_FISICO = /\bpumice\b|perlite|walnut shell|juglans regia shell|apricot kernel powder|prunus armeniaca seed powder/;
const SOLO_HOMBRE = /for men|\bhomme\b|\bmen\b/;
const PIEL_IRRITADA = /zitcalm|epitheliale|bari[eé]derm|cicalfate|cicaplast baum|cicabio|cica.?repair|reparadora intensa|cicavit/;   // reparadores de barrera o postratamiento: solo con rojez, piel que reacciona, receta o barrera (informe, 24/11)
const NO_SOLAR_PRINCIPAL = new Set(["revolution-skincare-moisturiser", "avene-cicalfate-spf50"]);   // Cicalfate+ SPF50+: reparador de cicatrices y marcas, no solar facial diario   // hidratante con SPF: no como solar principal
const DENSA = /intensive|intensiv|\brich\b|\brica\b|piel seca|dry skin|ceramide treatment|\bbalm\b|balsamo/;
const A_FOTO = ["arrugas", "manchas", "textura", "rojez", "brillo", "firmeza", "hidratacion", "poros", "ojeras", "acne", "tono"];
const SEBORREGULADORA = /cloud clear|water cream|day light|oil control|seborregul|matific|\bmate\b|anti.?brillo|purif/;
const LIGERA = /plump.?tide|day light|hydration station|water gel|water cream|watery|aqua.?gel|\bgel\b/;
const DE_DIA = /morning|\bday\b|\bdia\b|de jour/;
const NO_HIDRATANTE = /vaselina pura|petrolatum puro|\bserum\b|\bsarum\b|tonico|toner|essence|esencia|ampoule|ampolla|callosidades|mascarilla|\bmask\b/;
const PIEL_OK = {seca: ["seca", "normal a seca", "todas"], normal: ["normal a seca", "normal a grasa", "todas"], mixta: ["normal a grasa", "grasa o mixta", "todas"], grasa: ["grasa o mixta", "normal a grasa", "todas"]};

function dosisDe(p, k, rango, c, ep){
  if(ep && ep.activo === k && !(estado(p)[k] && estado(p)[k].estado === "declarada")) return {ok: 1, txt: ep.control === false ? "dosis no publicada por la marca; hay estudios con este producto, sin grupo de comparación concluyente" : "dosis no publicada por la marca; la eficacia está estudiada en este producto, en ensayos del fabricante", tipo: ep.control === false ? "estudiada_sc" : "estudiada"};
  const e = estado(p)[k];
  if(!e) return null;
  if(e.estado === "declarada"){
    if(!rango) return {ok: 1, txt: `${fmt(e.pct)} %, dosis declarada por la marca`, tipo: "declarada"};
    if(e.pct >= rango[0] && e.pct <= rango[1]) return {ok: 1, txt: `${fmt(e.pct)} %, dosis declarada y dentro de lo eficaz (${fmt(rango[0])}-${fmt(rango[1])} %)`, tipo: "declarada"};
    if(k === "niacinamida" && e.pct > rango[1] && e.pct <= R.niacinamida.aceptable_hasta && !c.reactiva && !c.reactiva_a_veces && !c.rojez && !c.suave && !c.barrera)
      return {ok: .55, txt: `${fmt(e.pct)} %, más dosis de la necesaria`, tipo: "de_mas"};
    return null;
  }
  if(k === "thiamidol" && CFG.thiamidol.excepcion_eucerin_sin_dosis && n(p.marca) === "eucerin") return {ok: 1, txt: "dosis no publicada por la marca; eficacia estudiada en este producto", tipo: "estudiada"};
  if(e.estado === "probable"){ const re = e.rango_estimado; return {ok: .6, txt: `dosis no declarada; por su posición en la lista, ${re ? `entre el ${fmt(re[0])} y el ${fmt(re[1])} %` : "por encima del 1 %"}`, tipo: "probable"}; }
  if(e.estado === "tras_linea") return null;
  return {ok: .3, txt: "dosis no declarada por la marca", tipo: "no_declarada"};
}
const fmt = x => String(+(+x).toFixed(2)).replace(".", ",");
/* Tope de retinoide impuesto por una regla de la foto (Hugo, P-03): solo la forma indicada, con % declarado ≤ el máximo. */
function cumpleTopeRet(p, L){
  const e = estado(p)[L.activo];
  return !!e && e.estado === "declarada" && typeof e.pct === "number" && e.pct <= L.max_pct + 1e-9;
}
/* La hidratante que acompaña a ese retinoide: con ceramidas o pantenol y sin perfume. */
function esReparadora(p, H){
  if(!H) return true;
  const e = estado(p);
  if(H.fragrance_free && (p.fragancia !== false || lleva(p, "perfume"))) return false;
  return (H.one_of || []).some(k => e[k]);
}
/* El rango eficaz de siempre, recortado por arriba al máximo de la regla. */
function rangoTope(L){ const r = R[L.activo] || [0, L.max_pct]; return [r[0], Math.min(r[1], L.max_pct)]; }
/* Requisitos de la hidratante que ponen las reglas de la foto (moisturizer). */
function cumpleHidratante(p, q){
  const e = estado(p);
  if(q.fragrance_free && (p.fragancia !== false || lleva(p, "perfume"))) return false;
  if(q.texture && !q.texture.includes(p.textura)) return false;
  if(q.one_of && !q.one_of.some(k => e[k] || lleva(p, k))) return false;
  return true;
}
const ACIDOS_EXF = ["glicolico", "lactico", "mandelico", "salicilico", "lha", "pha"];   // el PHA también exfolia: cuenta para «un solo producto con ácido» (R2)
/* Para duplicados, la betaína salicilato no cuenta como BHA (Hugo, 24/11): es un éster muy suave. En el embarazo sigue vetada (vetado usa lleva). */
function llevaAcido(p, k){ if(k !== "salicilico") return lleva(p, k); return (p.inci_completo || []).some(i => /\bsalicylic acid\b/.test(n(i)) && !/capryloyl/.test(n(i))); }
function hayRetinoideTope(veto, c, L){
  const ser = (LISTA || CATALOGO).some(p => p.v2 && p.v2.protagonista === L.activo && ["PM", "AM/PM"].includes(p.v2.hueco) && !vetado(p, veto) && cumpleTopeRet(p, L) && dosisDe(p, L.activo, rangoTope(L), c));
  const hid = (LISTA || CATALOGO).some(p => p.v2 && p.v2.hueco === "H" && !vetado(p, veto) && esReparadora(p, L.hidratante));
  return ser && hid;
}
/** ¿Hay en el catálogo un sérum de bakuchiol que se pueda recomendar? Si no, el retinoide queda fuera sin dejar un paso vacío. */
function hayBakuchiol(veto, c){
  return (LISTA || CATALOGO).some(p => p.v2 && p.v2.protagonista === "bakuchiol" && ["AM", "PM", "AM/PM"].includes(p.v2.hueco) && !vetado(p, veto) && dosisDe(p, "bakuchiol", R.bakuchiol, c));
}
const LIM = r => (r && r.limites) || {};
function rangoPara(k, deseo, r){
  // concentración alta solo si ya lo tolera; si lo empezó hace poco, si la piel reacciona o está deshidratada, la de inicio (revisión clínica, C11-08)
  if(k === "retinal"){ const nfR = (r && r.notas_foto) || {}; const fragil = r && (r.reactiva === "siempre" || (nfR.hidratacion ?? 100) < 55 + B3);
    // Hugo, 25/11 (preguntas 7 y 17): quien ya tolera un retinoide no baja a la dosis de inicio. En la vía Leve o con la piel frágil, escalón intermedio (Crystal Retinal 3), nunca el 1
    if(r && r.retinoide_exp === "tolera") return fragil || (deseo && deseo.leve) ? R.retinal_intermedio : R.retinal_retinizada;
    return R.retinal_inicio; }
  if(k === "niacinamida") return deseo && deseo.k === "sebo" ? R.niacinamida.sebo : R.niacinamida.resto;
  return {vitc_pura: R.vitc_pura, vitc_derivados: R.vitc_derivados, retinol: R.retinol, retinal: R.retinal, bakuchiol: R.bakuchiol, glicolico: R.glicolico, lactico: R.lactico, salicilico: R.salicilico, azelaico: R.azelaico, tranexamico: R.tranexamico, thiamidol: R.thiamidol}[k] || null;
}
function vetado(p, veto, slot){
  const inci = (p.inci_completo || []).map(n);
  if(p.estado_legal && p.estado_legal !== "cosmetico") return "no es un cosmético";
  if((p.flags || []).includes("producto_no_conforme")) return "no cumple la normativa";
  if(PROHIBIDOS_UE.some(x => inci.some(i => i.includes(x)))) return "lleva un ingrediente prohibido en la UE";
  // Vitamina A por encima del 0,3 % de equivalente de retinol (Reglamento (UE) 2024/996): no se recomienda aunque aún se venda
  const er = (p.activos || []).reduce((t, x) => { const i = n(x.inci || ""), q = +x.pct_declarado || 0;
    return t + (i === "retinol" ? q : i === "retinyl acetate" ? q * 0.872 : i === "retinyl palmitate" ? q * 0.546 : 0); }, 0);
  if(er > 0.3 + 1e-9) return "lleva más vitamina A de la que permite la UE";
  // Sin el porcentaje de retinol o de ésteres no se puede comprobar el 0,3 % de la UE (auditoría D-04): no se recomienda
  if(!(p.flags || []).includes("conforme_2024_996") && ["retinol", "esteres_retinilo"].some(k => { const e = estado(p)[k]; return e && e.estado !== "declarada"; })) return "no declara el porcentaje de vitamina A";
  if(EXCL_MARCA.has(normMarca(p.marca))) return "marca excluida";
  if(CUERPO.test(" " + n(p.producto) + " ") && !/facial|rostro|face|cara/.test(n(p.producto))) return "no es de cara";
  if(/intim|pliegue|zonas con pelo|cuero cabelludo|shampoo|champu/.test(n(p.producto))) return "no es de cara";   // ficha: geles íntimos o de pliegues y champús (ciclos, 24/11)
  for(const k of Object.keys(veto)){
    if(k === "perfume"){ if(perfumado(p)) return "lleva perfume"; if(lleva(p, "aceite_esencial")) return "lleva aceites esenciales, que perfuman (" + aceitesEsenciales(p).slice(0, 2).join(", ") + ")"; continue; }
    if(k === "alcohol"){ if(p.alcohol_denat === true || lleva(p, "alcohol")) return "lleva alcohol"; continue; }
    if(lleva(p, k)) return "lleva " + nombre(k);
  }
  return null;
}
/* Candidatos puntuados para un hueco. */
function candidatos(h, ctx){
  const {c, veto, P, r, serums} = ctx, out = [];
  const hayRetinoide = serums.some(s => s.k === "retinoide"), hayAcido = serums.some(s => ["aha", "pha", "salicilico", "glicolico_afeitado"].includes(s.k));
  const quiere = k => BASE[k].some(p => P.includes(p));
  for(const p of (LISTA || CATALOGO)){
    const v2 = p.v2; if(!v2) continue;
    let base = 0, cubre = [], dosis = null, activo = null, pegas = [];
    const desglose = {ingrediente: 0, cobertura: 0, calidad: 0};
    // calidad mínima de fórmula (Hugo, 25/11, pregunta 5): en sérums y contorno, nunca por debajo de 2/10; con embarazo, lactancia o piel reactiva, de 3/10.
    // Si no queda ninguno, la cascada ya existente busca otro activo y, si tampoco, deja el hueco vacío
    if((/^serum/.test(h.slot) || h.slot === "contorno") && (CALIDAD[p.id] || {}).calidad != null && CALIDAD[p.id].calidad < (c.embarazo || c.reactiva || c.reactiva_a_veces ? 3 : 2)) continue;
    // Hugo, 25/11 (pregunta 1): con reactividad «a veces», limpiador e hidratante sin perfume; en el sérum activo se permite con aviso
    if(c.reactiva_a_veces && ["L", "H", "H2"].includes(h.slot) && fragante(p)) continue;
    if(h.slot === "L"){
      if(v2.hueco !== "L") continue;
      if((AGUA_MICELAR.test(n(p.producto)) || AGUA_MICELAR.test(n(p.url_producto))) && !/gel|mousse|moussant|espuma|foam/.test(n(p.producto))) continue;   // el agua micelar no se aclara: deja tensioactivos en la piel (Hugo, 24/11)
      const sal = aDosis(p, "salicilico"), otroAcido = ["glicolico", "lactico", "mandelico", "pha", "lha"].some(k => aDosis(p, k));
      const quiereSal = quiere("limpiador_salicilico") && !veto.salicilico && !P.includes("P03") && ctx.modo === "normal";
      if(otroAcido || (v2.exfoliante && !sal)) continue;                    // el limpiador no exfolia
      if(sal && !quiereSal) continue;
      if(sal && ["glicolico", "lactico", "mandelico", "pha", "lha"].some(k => lleva(p, k))) continue;   // con salicílico, sin otros ácidos en la fórmula
      if(sal && hayAcido) continue;                                         // máximo un exfoliante sin aclarado + un limpiador con salicílico… pero no con otro ácido de noche
      base = 1; if(quiereSal && sal){ base += .6; cubre.push("F7"); activo = "salicilico"; }
      const irr = (p.surfactantes || []).map(s => s && s.irritacion_1_5).filter(x => typeof x === "number");
      if(irr.length){ const m = Math.max(...irr); if((c.reactiva || c.rojez || c.barrera || c.piel === "seca") && m >= 4) continue; base += (5 - m) * .06; }
      cubre.push("F1");
    } else if(h.slot === "H" || h.slot === "H2"){
      if(v2.hueco !== "H") continue;
      // la hidratante no exfolia… salvo la hidratante de tratamiento para granitos (Hugo, 25/11, pregunta 19): con imperfecciones o brillo, sin sérum exfoliante ni retinoide, y en piel que no reacciona
      const nfT = r.notas_foto || {};
      const tratH = HUECO_H.has(p.id) && h.slot === "H" && ((nfT.acne ?? 100) < 65 || (nfT.brillo ?? 100) <= 60) && !hayAcido && !hayRetinoide && !c.reactiva && !c.reactiva_a_veces && !c.rojez && (nfT.rojez ?? 100) >= 55 + B3 && (nfT.hidratacion ?? 100) >= 55 + B3;
      if((["glicolico", "lactico", "mandelico", "pha", "salicilico", "lha"].some(k => aDosis(p, k)) || v2.exfoliante) && !tratH) continue;
      if(tratH) base += .3;
      if(h.slot === "H" && /\bnoche\b|\bnight\b|\bnuit\b|\bpm\b/.test(n(p.producto))) continue;   // «PM» también (ciclo 19: CeraVe Loción de Rostro PM de mañana)
      if(/hidratacion-cuerpo|corporal|body lotion/.test(n(p.url_producto || "") + " " + n(p.producto)) && p.formato_ml >= 400) continue;   // loción corporal de bote grande: no es la hidratante de la cara (revisión clínica, C12-07)
      if(/parpado|contorno|\beye\b|\byeux\b|ojos/.test(n(p.producto))) continue;   // una crema de ojos no es la hidratante de la cara   // la hidratante va mañana y noche: una crema de noche solo en el hueco de noche (H2)
      if(NO_HIDRATANTE.test(n(p.producto)) || /corporal/.test(n(p.subcategoria)) || /crema-corporal|body-lotion|locion-corporal/.test(n(p.url_producto)) || (p.textura === "aceite" && /\boil\b|aceite|huile/.test(n(p.producto)) && !/oil.free|oil control|anti.oil/.test(n(p.producto)))) continue;   // sérums, tónicos, aceites y productos de cuerpo no son la hidratante
      if(hayRetinoide && LIM(r).retinoide && !esReparadora(p, LIM(r).retinoide.hidratante)) continue;
      if(!(r.hidratante_req || []).every(q => cumpleHidratante(p, q))) continue;   // reglas de la foto: barrera sin perfume, crema rica a partir de 50…
      if(hayRetinoide && RETINOIDES.concat("bakuchiol").some(k => lleva(p, k))) continue;       // un solo retinoide en la rutina, y retinoide o bakuchiol, no los dos
      if(!hayRetinoide && RETINOIDES.concat("bakuchiol").some(k => aDosis(p, k)) && (c.menor25 || ctx.modo !== "normal" || hayAcido || !["P08", "P17", "P18", "P19"].some(x => P.includes(x)))) continue;   // una hidratante antiedad solo si hay un motivo antiedad
      base = 1;
      if(ACIDOS_EXF.some(k => llevaAcido(p, k))) base -= 1;                              // la hidratante no lleva ácidos exfoliantes: el ácido, como mucho, en un producto
      { const nfH = r.notas_foto || {}, oclusiva = /^(mineral oil|paraffinum|petrolatum|butyrospermum|cera alba|beeswax|vaselin)/.test(n((p.inci_completo || [])[0] || ""));
        // Hugo, 25/11 (pregunta 14): oclusiva solo en piel seca, o con hidratación <60 sin granitos ni brillo alto
        if(oclusiva && !(c.piel === "seca" || ((nfH.hidratacion ?? 100) < 60 && (nfH.acne ?? 100) >= 65 && (nfH.brillo ?? 100) > 65))) base -= .6; }   // una crema oclusiva (aceite mineral o cera de primer ingrediente) solo si la piel la pide (ciclo 3)
      if(/atopi/.test(n(p.producto)) && !c.barrera && !P.includes("P27")) base -= .5;
      // un bálsamo o pomada como hidratante de mañana y noche, solo con piel muy seca (<40), atópica o en barrera; si no, una crema (revisión clínica, C18-05)
      if(h.slot === "H" && (p.textura === "balsamo" || /balsamo|baume|\bbalm\b|ointment|pomada/.test(n(p.producto))) && !c.barrera && !P.includes("P27") && !((r.notas_foto || {}).hidratacion < 40)) base -= .5;   // una crema de piel atópica, solo si hace falta
      const e = estado(p);
      if(quiere("h_niacinamida") && e.niacinamida && e.niacinamida.estado !== "tras_linea" && !(e.niacinamida.pct > 5 && (c.reactiva || c.rojez || c.barrera))){ base += .35; cubre.push("F8"); }
      // propuesta 8: tras un peeling, un láser o microagujas, la hidratante es una crema reparadora sin perfume ni aceites esenciales, y sin gamas antiimperfecciones
      if(c.procedimiento && (!["ceramidas", "pantenol", "bisabolol", "karite", "centella", "escualano"].some(k => e[k]) || fragante(p) || /imperfec|blemish|cleanance|effaclar|sebium|hyseac|keracnyl|comedomed|normaderm|sebiaclear|acniben|acnestil|oil control|matif/.test(n(p.producto)))) continue;
      if(quiere("h_barrera") || c.reactiva || c.barrera || c.procedimiento){ if(["ceramidas", "pantenol", "bisabolol", "karite"].some(k => e[k]) && p.fragancia === false && !lleva(p, "aceite_esencial")){ base += .4; cubre.push("F12"); } else if(ctx.modo !== "normal" || c.barrera) base -= .3; }
      if(quiere("h_lipidos") || c.piel === "seca" || h.slot === "H2"){ if(["ceramidas", "colesterol", "karite", "vaselina"].some(k => e[k]) && ["crema", "balsamo"].includes(p.textura)){ base += .4; cubre.push("F14"); } }
      if(quiere("h_ligera") && ["gel", "gel-crema", "fluido", "locion"].includes(p.textura)) base += .3;
      if(quiere("h_peptidos") && e.peptidos){ base += .25; cubre.push("F15"); }
      if(["glicerina", "hialuronico"].some(k => e[k])) cubre.push("F13");
      if(h.slot === "H2" && !["crema", "balsamo"].includes(p.textura)) continue;
    } else if(h.slot === "S"){
      if(p.categoria !== "spf" || (p.spf || 0) < CFG.fps_minimo) continue;
      if(CFG.solares_excluidos.includes(n(p.marca))) continue;
      if(/stick|bruma|\bmist\b|spray|polvo|powder|cushion/.test(n(p.producto))) continue;   // sticks y brumas sirven para reaplicar, no como dosis principal
      base = (p.spf || 0) >= CFG.fps_defecto ? 1 : .6;
      if(p.fotoestable === false) continue;
      const color = !!p.oxidos_hierro;
      if(quiere("solar_color_oblig") || r.solar_color){ if(!color) continue; cubre.push("F3"); }
      // Hugo, 25/11 (pregunta 13): las preferencias del solar suben en rampa con la nota, sin salto en el umbral
      else { const nfS = r.notas_foto || {}, rp = (v, lo, hi) => typeof v === "number" ? Math.max(0, Math.min(1, (hi - v) / (hi - lo))) : 0;
        // Hito 1, propuesta 5 (Hugo, 27/11): el pigmento es una preferencia aparte; el SPF 50+ sigue siendo obligatorio para todos. Con el fototipo
        // DECLARADO en el iPad (nunca deducido de la foto): III-IV, la rampa empieza antes (manchas 78 → 60); I-II, la mitad (la luz visible apenas
        // pigmenta el fototipo II, Passeron 2021). La nota de manchas no diagnostica melasma. Sin fototipo, como antes.
        const ft = r.fototipo, fRamp = Object.keys(nfS).length ? (["III", "IV"].includes(ft) ? rp(nfS.manchas, 60, 78) : rp(nfS.manchas, 60, 72) * (["I", "II"].includes(ft) ? .5 : 1)) : 0;
        const fC = c.fototipo_oscuro ? 1 : Object.keys(nfS).length ? fRamp : (quiere("solar_color_pref") ? 1 : 0);
        if(color){ base += .4 * fC - .15 * (1 - fC); if(fC >= .5) cubre.push("F3"); } }
      { const nfS = r.notas_foto || {}, rp = (v, lo, hi) => typeof v === "number" ? Math.max(0, Math.min(1, (hi - v) / (hi - lo))) : 0;
        const fM = tiene(r, "sienta", "filtros_quimicos") ? 1 : Math.max(Object.keys(nfS).length ? rp(nfS.rojez, 50, 62) : 0, quiere("solar_mineral") && (c.reactiva || c.rojez) ? 1 : 0, quiere("solar_mineral") && !Object.keys(nfS).length ? 1 : 0);
        if(p.tipo_filtro === "mineral") base += .5 * fM; else if(tiene(r, "sienta", "filtros_quimicos")) continue;
        const fT = c.piel === "grasa" ? 1 : Object.keys(nfS).length ? Math.max(rp(nfS.brillo, 55, 70), rp(nfS.acne, 55, 70), rp(nfS.poros, 50, 65)) : (quiere("solar_mate") ? 1 : 0);
        if(["fluido", "gel", "gel-crema"].includes(p.textura)) base += .25 * fT; }
      if(p.uva_pf_ok) base += .1;
      if(typeof p.cosmeticidad === "number") base += p.cosmeticidad / 50;
      cubre.push("F2");
    } else if(h.slot === "contorno"){
      if(v2.hueco !== "contorno de ojos") continue;
      if(P.includes("P15") && !(v2.preocupacion || p.preocupacion || []).includes("ojeras")) continue;   // con ojeras, un contorno formulado para ojeras
      if(r.mantenimiento && (!["cafeina", "peptidos"].some(k => lleva(p, k)) || RETINOIDES.concat("bakuchiol").some(k => lleva(p, k)))) continue;   // mantenimiento: contorno con cafeína o péptidos (Hugo, 24/11)
      if(hayRetinoide && RETINOIDES.concat("bakuchiol").some(k => lleva(p, k))) continue;
      if((LIM(r).retinoide || (r._excluir || []).includes("retinoide")) && RETINOIDES.some(k => lleva(p, k))) continue;   // si el retinoide de la cara tiene tope o se ha quitado, el contorno no lo trae por otra vía
      // piel con rojez, que reacciona o deshidratada y sin retinoide en la cara: el contorno tampoco lo lleva (la piel del ojo es la más fina; revisión clínica, C11-06)
      const nfO = r.notas_foto || {};
      if(RETINOIDES.some(k => lleva(p, k)) && (!r.retinoide_exp || r.retinoide_exp === "nunca")) continue;   // sin experiencia con retinoides, el contorno no lo trae (Hugo, 25/11, pregunta 9): cafeína, vitamina K, niacinamida, péptidos, hialurónico o ceramidas
      if(!hayRetinoide && ((nfO.rojez ?? 100) < 55 + B3 || ["a_veces", "siempre"].includes(r.reactiva) || c.reactiva || c.rojez || (nfO.hidratacion ?? 100) < 55 + B3) && RETINOIDES.some(k => lleva(p, k))) continue;
      base = 1; const pr = v2.preocupacion || p.preocupacion || [];
      if(ACIDOS_EXF.concat("pha").some(k => llevaAcido(p, k))) base -= 1;   // en el contorno, sin ácidos exfoliantes
      if(P.includes("P15") && pr.includes("ojeras")) base += .5;
      if(["P17", "P18", "P19"].some(x => P.includes(x)) && pr.includes("arrugas")) base += .4;
      if((c.reactiva || c.rojez) && pr.includes("sensible")) base += .5;
      if(["P28", "P29"].some(x => P.includes(x)) && pr.includes("hidratacion")) base += .3;
    } else if(h.slot === "posafeitado"){
      if(v2.hueco !== "posafeitado") continue;
      if(lleva(p, "alcohol") || p.alcohol_denat || lleva(p, "mentol")) continue;
      base = 1; cubre.push("F12");
    } else if(h.deseo && h.deseo.humectante){
      if(v2.hueco !== "serum humectante" || !["humectante", "calmante o barrera"].includes(v2.tipo)) continue;
      base = 1; cubre.push("F13");
    } else if(h.deseo){
      if(!["AM", "PM", "AM/PM"].includes(v2.hueco)) continue;
      // El PHA no está fichado como protagonista en ningún producto: se busca por fórmula, y solo si no trae otro ácido ni un retinoide.
      const k = h.deseo.k === "pha" ? (aDosis(p, "pha") && !RETINOIDES.concat(ACIDOS.filter(x => x !== "pha"), ["bakuchiol"]).some(x => lleva(p, x)) ? "pha" : null)
        : (CFG.ensayo_producto[p.id] && CFG.ensayo_producto[p.id].funciones.includes(h.deseo.k) && ((ctx.modo !== "suave" && !h.deseo.par_azelaico && !h.deseo.restringido) || h.deseo.activos.includes(CFG.ensayo_producto[p.id].activo))) ? CFG.ensayo_producto[p.id].activo
        : h.deseo.activos.find(a => v2.protagonista === a);
      if(!k) continue;
      if((p.inci_completo || []).some(i => /\bmica\b|ci 7749|iron oxides/.test(n(i)))) continue;   // gotas con color o iluminadoras: son maquillaje, no un sérum de tratamiento
      const ep0 = CFG.ensayo_producto[p.id];
      if(ep0 && !ep0.funciones.includes(h.deseo.k)) continue;                            // el ensayo vale para la función estudiada, no para otras
      const ep = ep0 && (!ep0.problemas || ep0.problemas.includes(h.deseo.por)) ? ep0 : null;
      if(hayRetinoide && h.deseo.k !== "retinoide" && RETINOIDES.concat("bakuchiol").some(x => lleva(p, x))) continue;   // un solo retinoide en la rutina, también entre sérums
      if(v2.exfoliante && !["aha", "pha", "salicilico", "glicolico_afeitado"].includes(h.deseo.k)) continue;   // un exfoliante no vale como sérum de otra función
      if(k === "thiamidol"){
        if(h.deseo.por === "P12" || !["P10", "P13"].some(x => P.includes(x))) continue;
        if(/dermopure/.test(n(p.producto)) && !(c.piel === "grasa" || c.piel === "mixta")) continue;
      }
      if(k === "niacinamida" && h.deseo.k === "despigmentante" && c.fototipo_oscuro) base -= .2;
      if(k === "azelaico" && c.fototipo_oscuro) base += .3;
      dosis = dosisDe(p, k, rangoPara(k, h.deseo, r), c, ep);
      if(!dosis) continue;
      if(k === "retinol" && estado(p).retinol.pct > CFG.retinol_max) continue;
      // piel que reacciona a menudo (Hugo, 25/11, pregunta 4): retinoide solo en una fórmula que también calme o repare (bisabolol, pantenol, ceramidas, niacinamida, centella, ectoína)
      if(RETINOIDES.includes(k) && r.reactiva === "siempre" && !["bisabolol", "pantenol", "ceramidas", "niacinamida", "centella", "ectoina"].some(x => lleva(p, x))) continue;
      if(h.deseo.k === "retinoide" && LIM(r).retinoide && (k !== LIM(r).retinoide.activo || !cumpleTopeRet(p, LIM(r).retinoide))) continue;   // tope de la regla P-03: solo retinal con % declarado ≤0,05
      activo = k; base = 1 + dosis.ok + (ep ? (ep.control === false ? .1 : .2) : dosis.tipo === "estudiada" ? .2 : 0); cubre.push(h.deseo.f);
      // Paso 1: lo que esta piel necesita de este ingrediente (tabla ingrediente × aspecto)
      if(ctx.ing){ const x = ctx.ing.ranking.find(y => y.k === k); desglose.ingrediente = Math.round(PESO_PRODUCTO.ingrediente * (x ? x.puntos : 0) / ctx.ing.max * 100) / 100; base += desglose.ingrediente; }
      // vía Leve: el retinoide va a concentración baja (retinal hasta 0,05 %, retinol por debajo de 0,3 %)
      if(h.deseo.leve && RETINOIDES.includes(k)){ const pc = (estado(p)[k] || {}).pct; if((k === "retinal" && !(pc <= 0.05)) || (k === "retinol" && !(pc < 0.3))) continue; }
      // piel reactiva o con rojez: niacinamida baja, hasta el 4 % (revisión previa de Hugo)
      if(k === "niacinamida" && (c.reactiva || r.reactiva !== "nunca" || ((r.notas_foto || {}).rojez ?? 100) < 55 + B3) && (estado(p).niacinamida || {}).pct > 4) base -= .4;
      // una regla de la foto que «evita» este activo (avoid) pesa de verdad cuando es el protagonista del sérum: entra solo si no hay otra opción
      if(((r.bonus_activos || {})[k] || 0) < 0) base -= 1;
      // Vitamina C (Hugo, 24/11): la pura es la de referencia; entre los derivados, el 3-O-etil ascórbico es el que mejor funciona
      if(k === "vitc_pura") base += .15;
      if(["vitc_pura", "vitc_derivados"].includes(k) && ["pha", "glicolico", "lactico", "mandelico"].some(x => lleva(p, x))) base -= .3;   // una vitamina C que además exfolia suma ácido a la rutina
      if(k === "vitc_derivados") base += (p.inci_completo || []).some(i => /ethyl ascorbic/.test(n(i))) ? .1 : -.1;
      if(ep) pegas.push("la eficacia está estudiada en el producto acabado");
      if(h.deseo.turno === "AM" && RETINOIDES.some(x => lleva(p, x))) continue;        // retinoides, solo de noche
      // un solo activo fuerte por producto y por turno: el sérum no trae otro ácido o retinoide a dosis
      const otros = RETINOIDES.concat(ACIDOS).filter(x => x !== k && aDosis(p, x) && !(RETINOIDES.includes(k) && RETINOIDES.includes(x)));
      // un producto con ensayo propio se juzga como fórmula entera (su LHA y salicílico a dosis baja van incluidos en lo estudiado); en rutina suave o piel reactiva sigue sin entrar
      if(otros.length && (ctx.modo === "suave" || c.reactiva || !ep && (c.reactiva_a_veces || c.fototipo_oscuro || hayRetinoide && !RETINOIDES.includes(k)))) continue;
      if(otros.length && hayRetinoide && h.deseo.k === "despigmentante") continue;   // un despigmentante que además exfolia (glicólico, mandélico, PHA) no se suma a la rutina del retinoide, aunque tenga ensayo propio
      if(otros.length && !ep) base -= .25;
      if(!["aha", "pha", "salicilico", "glicolico_afeitado"].includes(h.deseo.k) && ACIDOS_EXF.some(x => x !== k && llevaAcido(p, x))) base -= .5;   // R2: un sérum de otra función que además trae ácido exfoliante, solo si no hay otro
      // secundarios que suman
      const e = estado(p);
      if(k === "vitc_pura" && (e.vitamina_e || e.ferulico)){ base += .2; pegas.push("lleva además vitamina E o ferúlico, que refuerzan a la vitamina C"); }
      if(k === "vitc_pura" && r.mantenimiento && +r.productos >= 5 && e.vitamina_e && e.ferulico) base += .5;   // completa de mantenimiento: vitamina C con E y ferúlico
      if(RETINOIDES.includes(k) && (e.ceramidas || e.pantenol)){ base += .15; pegas.push("lleva además ceramidas o pantenol, que ayudan a tolerarlo"); }
      if(k !== "niacinamida" && e.niacinamida && e.niacinamida.estado !== "tras_linea" && ["P06", "P07", "P10", "P13", "P21"].some(x => P.includes(x))){ base += .2; pegas.push("lleva además niacinamida, que también te ayuda"); }
      if(c.reactiva && k === "retinol") base -= .2;
      // quien nunca ha usado un retinoide empieza por la dosis baja: retinal hasta 0,05 % o retinol por debajo de 0,3 %
      // quien nunca ha usado un retinoide empieza suave (Hugo, 24/11): retinal hasta 0,05 % o retinol por debajo de 0,3 %; lo más fuerte no entra
      if(h.deseo.k === "retinoide" && (!r.retinoide_exp || r.retinoide_exp === "nunca")){ const pc = (e[k] || {}).pct; if((k === "retinal" && pc > 0.05) || (k === "retinol" && pc >= 0.3)) continue; }                                      // en piel reactiva, mejor retinal o ésteres
    } else continue;

    const v = vetado(p, veto, h.slot); if(v) continue;
    if(p.fragancia === true && h.slot !== "S") base -= .3;   // con perfume, solo si no hay otro igual de bueno sin él (informe, 24/11)
    { const nom = n(p.producto) + " " + n(p.marca), nf = r.notas_foto || {};
      if(h.slot !== "posafeitado" && (NO_DIARIO.test(nom) && !/exfoliante quimico/.test(nom) && !h.deseo || (p.inci_completo || []).some(i => INCI_FISICO.test(n(i))))) continue;   // ni posprocedimiento ni exfoliante físico como producto diario
      if(SOLO_HOMBRE.test(nom) && r.sexo !== "hombre") continue;
      if(h.slot === "L" && r.sexo === "hombre" && /desmaquill|demaquill|make-?up remover/.test(nom)) base -= .4;   // a un hombre sin maquillaje no se le da un desmaquillante como limpiador (revisión clínica, C12-09)
      if(/kelual|dermatitis seborreica|\bds\b/.test(nom) && !P.includes("P25")) continue;
      // R19 (Hugo): con la hidratación por debajo de 55, ningún producto sin aclarado con AHA a dosis (≥5 % o probable por su posición), sea cual sea su función
      if(h.slot !== "L" && (nf.hidratacion ?? 100) < 55 + B3 && ["glicolico", "lactico"].some(k => { const e = estado(p)[k]; return e && (e.pct != null ? e.pct >= 5 : e.estado === "probable"); })) continue;   // producto para la dermatitis seborreica: solo si se ha detectado (ciclos, 24/11)
      if(PIEL_IRRITADA.test(nom) && !(c.reactiva || c.rojez || c.barrera || c.receta || ctx.modo === "suave" || (typeof nf.rojez === "number" && nf.rojez <= 49))) continue;   // gama para piel irritada o en tratamiento
      if(h.slot === "S" && NO_SOLAR_PRINCIPAL.has(p.id)) continue;
      // vehículo según la piel: con brillo, sin bases oleosas ni cremas densas; piel seca y deshidratada, sin geles seborreguladores
      const brillo = typeof nf.brillo === "number" && nf.brillo <= 60, seca = typeof nf.hidratacion === "number" && nf.hidratacion < 55 && (nf.brillo ?? 100) >= 65;
      if(brillo && (p.textura === "aceite" || /anhydrous|anhidr/.test(nom)) && h.slot !== "L") continue;
      if(brillo && ["H", "H2"].includes(h.slot) && (DENSA.test(nom) || p.textura === "balsamo")) continue;
      if(seca && ["H", "H2"].includes(h.slot) && (SEBORREGULADORA.test(nom) || p.textura === "gel")) continue;
      // Hito 1, propuesta 13 (Hugo, 27/11; Augustin 2019): piel muy seca (hidratación <45, en rampa de 48 a 42) y sin brillo: vehículo más rico en lípidos
      // y fórmula con humectantes y lípidos. La urea suma solo sin reactividad declarada (la regla de la urea con rojez sigue pendiente). Nada es obligatorio.
      if(["H", "H2"].includes(h.slot) && typeof nf.hidratacion === "number" && !brillo){
        const fS = Math.max(0, Math.min(1, (48 - nf.hidratacion) / 6));
        if(fS > 0){ const e = estado(p), lip = ["ceramidas", "colesterol", "karite", "vaselina", "escualano"].some(k => e[k]), hum = ["glicerina", "hialuronico", "urea", "pantenol"].some(k => e[k]);
          if(lip && ["crema", "balsamo"].includes(p.textura)) base += .4 * fS;
          if(lip && hum) base += .2 * fS;
          if(e.urea && r.reactiva === "nunca" && !c.reactiva && !c.rojez && !c.reactiva_a_veces) base += .15 * fS;
          if(["gel", "fluido", "locion"].includes(p.textura) || LIGERA.test(nom)) base -= .4 * fS; } }
      // hidratación baja, rojez o piel que reacciona: limpiador suave o en crema, no espumoso
      // R32 (Hugo, 24/11): con rojez por debajo de 55, aunque la piel no reaccione
      const rojezB = (nf.rojez ?? 100) < 55 + B3, sensible = rojezB || ["a_veces", "siempre"].includes(r.reactiva) || c.reactiva || c.rojez || c.procedimiento;   // propuesta 8: tras un tratamiento en consulta, limpiador suave y crema de barrera
      // rojez o piel madura que pide nutrición: crema de barrera con lípidos, no geles ni water creams. R34: a partir de 65 años con poco brillo, igual
      const madura = ((nf.arrugas ?? 100) < 55 || (nf.firmeza ?? 100) < 55) && ["40-49", "50+"].includes(r.edad) || (r.edad_tramo === "65+" || r.edad === "50+") && (nf.brillo ?? 0) >= 65;   // desde los 50 sin brillo, crema y no gel (informe, 24/11)
      if(h.slot === "L" && (((nf.hidratacion ?? 100) < 55 + B3) || sensible || madura) && /espum|foam|mousse|moussant/.test(nom)) base -= 1;
      if(h.slot === "L" && sensible && /normal a grasa|oil control|purif|seborregul/.test(nom)) base -= 1;
      // piel con brillo o granos, sin sequedad ni rojez: limpiador en gel, no en crema o leche (revisión clínica, ciclo 11)
      if(h.slot === "L" && !sensible && !madura && (nf.hidratacion ?? 100) >= 55 + B3 && ((nf.brillo ?? 100) <= 60 + B3 || (nf.acne ?? 100) < 65) && !/\bgel\b|espum|foam|mousse/.test(nom) && (["crema", "locion", "balsamo", "aceite", "gel-crema"].includes(p.textura) || /crem|cream|creme|lait|leche|son lavant|caring wash|inconfort|lotion|locion|balm|baume|balsamo|aceite|huile/.test(nom))) base -= .6;
      if(["H", "H2"].includes(h.slot) && (sensible || madura) && !brillo){ const e = estado(p);
        if(!["crema", "balsamo"].includes(p.textura) || LIGERA.test(nom) || !["ceramidas", "escualano", "karite", "colesterol", "vaselina"].some(k => e[k])) base -= 1;
        if(SEBORREGULADORA.test(nom) || /gel/.test(p.textura || "")) base -= 1; }
      // R32 con piel grasa (Hugo, 24/11; revisión clínica C17-01): rojez <55 y brillo: ni gel ni crema densa, una emulsión o fluido ligero
      // Hugo, 25/11 (pregunta 12): R26 gana a R9. Con rojez y brillo, fuera los geles puros y las cremas ricas; emulsión ligera, fluido o gel-crema con calmantes
      // laboratorio (27/11, C061): R26/R32 también sin brillo. Con rojez <55, fuera los geles; el gel-crema, solo con brillo (≤60)
      if(["H", "H2"].includes(h.slot) && rojezB && !brillo && (/gel/.test(p.textura || "") || /water gel|aqua.?gel|gel.?cream|gel-crema/.test(nom)) && !((nf.brillo ?? 100) <= 60 && (p.textura === "gel-crema" || /gel.?cr[eè]m|gel.?cream/.test(nom)))) continue;
      if(["H", "H2"].includes(h.slot) && rojezB && brillo){
        const gelCrema = p.textura === "gel-crema" || /gel.?cr[eè]m|gel.?cream/.test(nom);
        if(!gelCrema && (p.textura === "gel" || /\bgel\b/.test(nom))) continue;
        if(["fluido", "locion", "gel-crema"].includes(p.textura) || gelCrema) base += .3;
        const e = estado(p); if(["centella", "pantenol", "niacinamida", "ectoina", "bisabolol", "madecasosido"].some(k => e[k])) base += .3; }
      // R36: con poco brillo (≥75), sin hidratantes matificantes; la crema de tarro de CeraVe, solo en piel muy seca
      if(["H", "H2"].includes(h.slot) && (nf.brillo ?? 0) >= 75 && (SEBORREGULADORA.test(nom) || /shine control/.test(nom))) base -= 1.5;
      // laboratorio (27/11, C062): R36 también en el solar. Con poco brillo (≥75), sin solares matificantes, «blur» ni de toque seco
      if(h.slot === "S" && (nf.brillo ?? 0) >= 75 && (SEBORREGULADORA.test(nom) || /blur|dry touch|toque seco|oil.?free|shine control/.test(nom))) base -= 1;
      if(["H", "H2"].includes(h.slot) && p.id === "cerave-crema-hidratante" && !((nf.hidratacion ?? 100) < 50)) base -= 1.5;
      // R33: con manchas bien y rojez por debajo de 55, nada de arbutina ni kójico; un sérum calmante (centella, ectoína, pantenol, niacinamida hasta 5 %)
      if((rojezB || h.slot !== "L") && (nf.manchas ?? 0) >= 70 - B3 && ["arbutina", "kojico"].some(k => lleva(p, k))) continue;   // R28: sin manchas, ningún producto sin aclarado con arbutina o kójico
      if(rojezB && h.deseo){ const e = estado(p); if(["centella", "ectoina", "pantenol"].some(k => e[k])) base += .3; if(e.niacinamida && e.niacinamida.pct > 5) base -= .5; }
      // piel que reacciona a veces: sin alcohol secante entre los tres primeros ingredientes de un producto sin aclarado (revisión clínica, C11-07)
      if(h.slot !== "L" && r.reactiva === "a_veces" && (p.inci_completo || []).slice(0, 3).some(i => /^(alcohol denat|alcohol|sd alcohol|isopropyl alcohol|ethanol)\b/.test(n(i)))) base -= .5;
      // sin granos ni brillo, nada de gamas antiimperfecciones en los pasos de tratamiento (revisión clínica, C13-03)
      // laboratorio (27/11, T1-01, T1-12): en la hidratante también con granos ≥60 y poco brillo; con piel seca (<45) o que reacciona siempre, fuera
      if(["H", "H2"].includes(h.slot) && (nf.acne ?? 0) >= 60 && ((nf.hidratacion ?? 100) < 45 || r.reactiva === "siempre") && /imperfec|blemish|cleanance|effaclar|sebium|hyseac|keracnyl|comedomed|normaderm|sebiaclear|acniben|acnestil|oil control|matif/.test(nom)) continue;
      if(h.slot !== "L" && h.slot !== "S" && ((nf.acne ?? 0) >= 70 && (nf.brillo ?? 0) >= 70 || ["H", "H2"].includes(h.slot) && (nf.acne ?? 0) >= 60 && ((nf.brillo ?? 0) >= 60 || (nf.hidratacion ?? 100) < 45 || r.reactiva === "siempre")) && /imperfec|blemish|cleanance|effaclar|sebium|hyseac|keracnyl|comedomed|normaderm|sebiaclear|acniben|acnestil/.test(nom)) base -= .5;
      // piel que reacciona casi siempre: sin mucina de caracol. Hito 1, propuesta 1 (Hugo, 27/11): el solar mineral ya no resta en esta piel; la AEDV y la AAD lo prefieren.
      // Lo que cuenta es SPF 50+, sin perfume y bien tolerado; minerales y mixtos, con o sin color, compiten igual.
      if(r.reactiva === "siempre" && (p.inci_completo || []).some(i => /snail/.test(n(i)))) base -= 1;
      // manchas en buen estado: sin despigmentantes que no hacen falta
      if((nf.manchas ?? 0) >= 70 - B3 && !h.deseo && ["arbutina", "tranexamico", "kojico", "thiamidol"].some(k => lleva(p, k))) base -= 1;
      if(h.deseo && (nf.manchas ?? 0) >= 70 - B3 && !["despigmentante", "azelaico_mixto"].includes(h.deseo.k) && ["arbutina", "tranexamico", "kojico", "thiamidol"].some(k => lleva(p, k))) base -= 1;
      // piel madura: sin solares de piel grasa
      if(h.slot === "S" && madura && (/aqua fresh|oil control|\bmat|toque seco|dry touch|sebum/.test(nom) || v2.piel === "grasa o mixta")) base -= .6;
      // solar mineral espeso: no primero en piel grasa, con granitos, con barba o deshidratada
      if(h.slot === "S" && p.tipo_filtro === "mineral" && !quiere("solar_mineral") && ((nf.brillo ?? 100) <= 60 || (nf.acne ?? 100) <= 69 || r.sexo === "hombre" || (nf.hidratacion ?? 100) < 55)) base -= .6;
      else if(h.slot === "S" && p.tipo_filtro === "mineral" && !quiere("solar_mineral") && !tiene(r, "sienta", "filtros_quimicos") && r.reactiva !== "siempre") base -= .6;   // R36: solar mineral puro solo cuando hace falta (con piel que reacciona siempre, no resta: propuesta 1)
      // sérum de día, de día; de noche, de noche
      if(h.deseo && h.deseo.turno === "PM" && DE_DIA.test(nom)) continue;
      if(h.deseo && h.deseo.turno === "AM" && /\bnoche\b|\bnight\b|\bnuit\b/.test(nom)) continue;
      // con retinoide por la noche, nada de glicólico o láctico de mañana
      if(h.deseo && h.deseo.turno === "AM" && hayRetinoide && ["glicolico", "lactico"].some(k => aDosis(p, k))) continue; }
    // tipo de piel: un producto pensado para un tipo no sale en el contrario
    // propuesta 8: tras un tratamiento en consulta, la crema reparadora puede ser de cualquier tipo de piel (manda la recuperación)
    if(["L", "H", "H2", "S"].includes(h.slot)){ const nfP = r.notas_foto || {}, delicada = ["H", "H2"].includes(h.slot) && ((nfP.rojez ?? 100) < 55 || (nfP.hidratacion ?? 100) < 45 || r.reactiva === "siempre" || c.reactiva);   // laboratorio (27/11, patrón G, C102): mixta o grasa con rojez, muy seca o reactiva: también cremas para piel normal a seca
      if(!PIEL_OK[c.piel].includes(v2.piel) && !(c.procedimiento && ["H", "H2"].includes(h.slot)) && !(delicada && v2.piel === "normal a seca")) continue; if(v2.piel !== "todas") base += .15; }
    else if((c.piel === "seca" && v2.piel === "grasa o mixta") || (c.piel === "grasa" && v2.piel === "seca")) continue;
    if(p.pvp_eur == null || p.pvp_eur > 400) continue;   // sin precio, o con un precio que solo puede ser un error de ficha
    base += p._preferencia || 0;   // SkinRead: lo que la farmacia tiene en stock va antes que lo que tendría que pedir
    for(const [k, w] of Object.entries(r.bonus_activos || {})) if(lleva(p, k)) base += w;   // SkinRead: puntos de las reglas de la foto (reglas-foto.json)
    // lo que resta sin vetar
    if(c.reactiva_a_veces && fragante(p)) base -= .3;
    if((c.piel === "seca" || c.sequedad_activa) && (p.alcohol_denat === true)) base -= .25;
    if(p.fragancia === false) base += .05;
    base += (p.transparencia || 0) / 100 + (p.evidencia_producto || 0) / 100;
    base -= Math.min(p.pvp_eur, 150) * CFG.peso_precio;                                  // a igualdad de lo demás, el que cuesta menos
    // preferencias: solo desempatan
    const tx = {ligera: ["gel", "gel-crema", "fluido", "locion"], media: ["gel-crema", "locion", "crema", "fluido"], rica: ["crema", "balsamo"]}[r.textura];
    const pref = tx && ["H", "S"].includes(h.slot) && tx.includes(p.textura) ? .08 : 0;
    // Paso 2: el producto se puntúa entero: lo demás que cubre de lo que esta piel necesita (sin contar el limpiador, que se aclara) y la calidad de su fórmula
    if(ctx.ing && h.slot !== "L"){ let cob = 0; for(const x of ctx.ing.ranking){ if(x.k === activo || !x.puntos || !aDosis(p, x.k)) continue; cob += x.puntos / ctx.ing.max * (x.clase === "tratamiento" ? 1 : .5); }
      desglose.cobertura = Math.round(PESO_PRODUCTO.cobertura * Math.min(1, cob) * (h.slot === "S" ? .5 : 1) * 100) / 100; base += desglose.cobertura; }   // en el solar manda la protección: lo que lleva de más cuenta la mitad (ciclo 3, diversidad)
    // R35 (Hugo): con manchas <60, el sérum de mañana que además lleva vitamina C, azelaico, tranexámico o thiamidol a dosis cubre ese paso dentro del mismo producto (fichas verificadas, 25/11)
    if(/^serum/.test(h.slot) && /AM/.test(h.turno || (h.deseo || {}).turno || "") && ((ctx.r.notas_foto || {}).manchas ?? 100) < 60
      && ["vitc_pura", "vitc_derivados", "azelaico", "tranexamico", "thiamidol"].some(k => k !== activo && !ctx.veto[k] && aDosis(p, k))){ desglose.manchas_am = .5; base += .5; }
    if((CALIDAD[p.id] || {}).revisar && ["H", "H2"].includes(h.slot)) base -= .3;   // hidratante con ficha de confianza baja (INCI incompleto o contaminado): solo si no hay otra igual de buena (ciclo 7)
    { const q = (CALIDAD[p.id] || {}).calidad; if(q != null){ desglose.calidad = Math.round(PESO_PRODUCTO.calidad * q / 10 * 100) / 100; base += desglose.calidad; } }
    out.push({p, score: base + pref, cubre, dosis, activo, extra: pegas, desglose});
  }
  // sin dosis declarada (activo de dosis media o muy baja): solo alternativa
  const fuertes = out.filter(x => !x.dosis || x.dosis.tipo !== "no_declarada"), flojos = out.filter(x => x.dosis && x.dosis.tipo === "no_declarada");
  // desempate estable por id de producto (Hugo, 24/11): nada de semillas calculadas con las notas
  const ord = a => a.sort((x, y) => (Math.round(y.score * 1e6) - Math.round(x.score * 1e6)) || x.p.id.localeCompare(y.p.id));
  return {principales: ord(fuertes), sin_dosis: ord(flojos)};
}

const TOPE = {bajo: 30, medio: 60, alto: Infinity};
const CARO = 50, CASI_IGUAL = .2;   // «muy caro» desde 50 €; «cumple casi igual» = como mucho 0,2 puntos menos y mismo activo (Hugo, 24/11)
const FUERTES_DUP = ["retinal", "retinol", "esteres_retinilo", "hpr", "glicolico", "lactico", "mandelico", "salicilico", "azelaico", "vitc_pura", "tranexamico", "thiamidol", "bakuchiol"];
const EMPATE = .15;   // Hugo, 25/11 (pregunta 14): margen de empate hasta 0,15, con 3 opciones como mucho. Antes, 0,05   // diferencia de puntos por debajo de la cual dos productos se consideran empatados (Hugo, 24/11: hasta 3 opciones)
function elegir(pa, ctx){
  const tope = TOPE[ctx.r.presupuesto] || 60;
  const cand = {}, sel = {}, usados = new Set(), sinProducto = [], repetidos = new Set();
  for(const h of pa.huecos){ cand[h.slot] = candidatos(h, ctx); }
  for(const h of pa.huecos){
    let l = cand[h.slot].principales.filter(x => !usados.has(x.p.id));
    // un sérum no repite el activo de otro sérum, ni uno que otro sérum ya lleva a dosis (p. ej. niacinamida dentro del glicólico)
    if(h.deseo && l.length){ const prev = Object.entries(sel).filter(([s]) => /^serum/.test(s)).map(([, e]) => e); const ya = prev.map(e => e.activo);
      const otros = l.filter(x => !ya.includes(x.activo) && !(x.activo && prev.some(e => aDosis(e.p, x.activo))));
      // …salvo que quitar la repetición deje solo activos que una regla de la foto pide evitar (C01-08: vitamina C pura con rojez)
      const bon = ctx.r.bonus_activos || {}, valeFoto = a => a.some(x => !(x.activo && (bon[x.activo] || 0) < 0));
      if(otros.length && (valeFoto(otros) || !valeFoto(l))) l = otros;
      // laboratorio (27/11, C104): si todos los candidatos repiten el activo de otro sérum (dos sérums de niacinamida), el hueco sobra: la función ya está cubierta
      else if(!otros.length && prev.length && l.every(x => x.activo && (ya.includes(x.activo) || prev.some(e => aDosis(e.p, x.activo))))){ repetidos.add(h.deseo.k); l = []; } }
    // laboratorio (27/11, C103): para calmar la rojez con granos por debajo de 60, el azelaico antes que la niacinamida (trata las dos cosas; Hito 1, propuesta 6)
    if(h.deseo && h.deseo.k === "calma" && l.length && (ctx.r.notas_foto || {}).acne < 60){ const az = l.filter(x => x.activo === "azelaico"); if(az.length) l = az.concat(l.filter(x => !az.includes(x))); }
    // la hidratante y el solar no repiten a dosis el activo que ya lleva un sérum (R12: el solar cuenta para los duplicados)
    if(["H", "H2", "S"].includes(h.slot) && l.length){ const act = Object.entries(sel).filter(([s]) => /^serum/.test(s)).map(([, e]) => e.activo).filter(Boolean);
      const otros = l.filter(x => !act.some(a => aDosis(x.p, a))); if(otros.length) l = otros; }
    // un solo producto sin aclarado con ácido exfoliante en toda la rutina (Hugo, 24/11): el ácido secundario de otro sérum también cuenta
    if((h.deseo || ["H", "H2", "S"].includes(h.slot)) && l.length){ const prev = Object.entries(sel).filter(([s]) => /^serum|^H/.test(s)).map(([, e]) => e.p);
      const esAcido = h.deseo && ["aha", "salicilico", "glicolico_afeitado"].includes(h.deseo.k), habra = pa.serums.some(x => ["aha", "salicilico", "glicolico_afeitado"].includes(x.k));
      if(prev.some(q => ACIDOS_EXF.some(k => llevaAcido(q, k))) || (habra && !esAcido)){ const otros = l.filter(x => !ACIDOS_EXF.some(k => llevaAcido(x.p, k))); if(otros.length) l = otros;
        else if(prev.some(q => ACIDOS_EXF.some(k => llevaAcido(q, k)))) l = []; } }   // el sérum exfoliante sobra si otro producto sin aclarado ya lleva ácido (R1): la cascada lo quita
    // ningún activo fuerte a dosis en dos productos sin aclarado, tampoco como secundario (fichas verificadas, 25/11: Blemish SOS lleva azelaico)
    if(h.slot !== "L" && h.slot !== "contorno" && l.length){ const prevP = Object.entries(sel).filter(([s]) => s !== "L" && s !== "contorno").map(([, e]) => e.p);
      const rep = x => FUERTES_DUP.some(k => aDosis(x.p, k) && prevP.some(q => aDosis(q, k)));
      const otros = l.filter(x => !rep(x)); if(otros.length) l = otros; }
    // un activo que una regla de la foto pide evitar solo entra si no hay otro producto válido para el hueco (ciclo 3)
    if(l.length){ const bon = ctx.r.bonus_activos || {}; const otros = l.filter(x => !(x.activo && (bon[x.activo] || 0) < 0) && x.score >= .5); if(otros.length && otros.length < l.length) l = otros; }
    if(!l.length){ sinProducto.push(h); continue; }
    // Escalado (Hugo, 27/11): la hidratante cubre con niacinamida la función que se quedó sin sérum, si hay una crema que la lleve a dosis y puntúe casi igual
    // escalado: un sérum nuevo no repite la niacinamida que ya lleva la hidratante del nivel anterior, si hay otro producto con un activo propio
    if(h.deseo && l.length && ctx.r._previo && ctx.r._previo.serums && !ctx.r._previo.serums.includes(h.deseo.k)){ const hp = ctx.r._previo.fijar && ctx.r._previo.fijar["s:H"] && (LISTA || CATALOGO).find(q => q.id === ctx.r._previo.fijar["s:H"]);
      if(hp && aDosis(hp, "niacinamida")){ const otros = l.filter(x => x.activo !== "niacinamida"); if(otros.length) l = otros; } }
    const cubreDe = x => (pa.cubrirH || []).filter(f => f.acts.some(a => aDosis(x.p, a)));
    if(h.slot === "H" && (pa.cubrirH || []).length){ const cn = l.filter(x => cubreDe(x).length && x.score >= l[0].score - 1).sort((a, b) => cubreDe(b).length - cubreDe(a).length || b.score - a.score || a.p.id.localeCompare(b.p.id)); if(cn.length) l = cn.concat(l.filter(x => !cn.includes(x))); }
    // …y el mismo producto para la misma función que en el nivel anterior, si aquí sigue siendo válido (el superior contiene al inferior)
    { const fj = ctx.r._previo && ctx.r._previo.fijar, id = fj && (h.deseo ? fj["d:" + h.deseo.k] : fj["s:" + h.slot]);
      const cubreH = h.slot === "H" && cubreDe(l[0]).length;
      const i = id ? l.findIndex(x => x.p.id === id) : -1;
      // sin ningún sérum en este nivel, la hidratante con activo propio no se cambia por la de otro nivel que no lo lleva (si no, el nivel se queda sin tratamiento)
      const unico = h.slot === "H" && !pa.serums.length && l[0].activo && !l[i < 0 ? 0 : i].activo;
      // de arriba abajo, el producto de la completa no sustituye al del nivel si el del nivel cubre además una función que aquí se queda sin sérum
      // (T06: en la básica, un sérum con niacinamida y vitamina C vale más que el de solo niacinamida que usa la completa, donde la vitamina C va aparte)
      const extraFuera = x => pa.fuera.filter(f => f.k && SOLO_SITIO.test(f.por) && ((F[f.k] || {}).activos || []).some(a => aDosis(x.p, a))).length;
      const masAmplio = !!(ctx.r._previo && ctx.r._previo.desdeArriba) && i > 0 && (h.deseo || h.slot === "H") && extraFuera(l[0]) > extraFuera(l[i]);
      if(i > 0 && !(cubreH && cubreDe(l[i]).length < cubreDe(l[0]).length) && !unico && !masAmplio) l = [l[i]].concat(l.filter((x, j) => j !== i)); }
    const e = l[0];
    sel[h.slot] = e; usados.add(e.p.id);
  }
  // con salicílico sin aclarado en otro producto, el limpiador no lleva salicílico (revisión previa de Hugo)
  if(sel.L && llevaAcido(sel.L.p, "salicilico") && Object.entries(sel).some(([s, e]) => s !== "L" && llevaAcido(e.p, "salicilico"))){
    const alt = cand.L.principales.find(x => !usados.has(x.p.id) && !llevaAcido(x.p, "salicilico")); if(alt){ usados.delete(sel.L.p.id); sel.L = alt; usados.add(alt.p.id); } }
  // presupuesto: no se supera (el solar va aparte)
  const cuenta = () => Object.entries(sel).filter(([s]) => s !== "S");
  const total = () => cuenta().reduce((a, [, e]) => a + e.p.pvp_eur, 0);
  const quitados = [];
  let vueltas = 0;
  while(total() > tope && vueltas++ < 60){
    let mejor = null;
    const falta = total() - tope;
    const minimo = cuenta().reduce((a, [slot, e]) => a + Math.min(e.p.pvp_eur, ...cand[slot].principales.filter(x => !usados.has(x.p.id)).map(x => x.p.pvp_eur)), 0);
    for(const suelo of (minimo <= tope ? [.5, -Infinity] : [.5])){   // si ni lo más barato entra, no se baja a productos flojos para nada   // primero sin bajar a productos que la piel apenas puntúa; si no hay, como antes
    for(const [slot, e] of cuenta()){
      for(const alt of cand[slot].principales){
        if(usados.has(alt.p.id) || alt.p.pvp_eur >= e.p.pvp_eur) continue;
        if(alt.score < suelo && alt.score < e.score) continue;
        const bon = ctx.r.bonus_activos || {}; if(alt.activo && (bon[alt.activo] || 0) < 0 && !((bon[e.activo] || 0) < 0)) continue;   // el ahorro no mete un activo que una regla de la foto pide evitar
        if(/^serum/.test(slot) && alt.activo && Object.entries(sel).some(([s2, e2]) => s2 !== slot && /^serum/.test(s2) && e2.activo === alt.activo)) continue;   // sin dos sérums con el mismo activo
        if(slot !== "L" && ACIDOS_EXF.some(k => llevaAcido(alt.p, k)) && Object.entries(sel).some(([s2, e2]) => s2 !== slot && s2 !== "L" && ACIDOS_EXF.some(k => llevaAcido(e2.p, k)))) continue;   // el ahorro no mete un segundo producto con ácido (R2)
        const ahorro = e.p.pvp_eur - alt.p.pvp_eur, perdida = Math.max(e.score - alt.score, .02);
        const cierra = ahorro >= falta;   // si un cambio basta para entrar en el presupuesto, el que menos calidad pierde
        const ratio = cierra ? 1e6 - perdida : ahorro / perdida;
        if(!mejor || ratio > mejor.ratio) mejor = {slot, alt, ratio};
      }
    }
    if(mejor) break; }
    if(mejor){ usados.delete(sel[mejor.slot].p.id); sel[mejor.slot] = mejor.alt; usados.add(mejor.alt.p.id); continue; }
    // no queda nada más barato: se quita el último paso opcional
    const opc = ["humectante", "H2", "contorno", "serum3", "serum2", "posafeitado"].find(s => sel[s]);
    if(!opc) break;
    quitados.push(pa.huecos.find(h => h.slot === opc)); usados.delete(sel[opc].p.id); delete sel[opc];
  }
  return {sel, cand, sinProducto, quitados, repetidos, total: Math.round(total() * 100) / 100, tope, dentro: total() <= tope};
}

/* ------------------------------------------------------------------ 6 · Resultado */
function calcular(r){
  const {problemas: P, derivacion} = detectar(r);
  const niveles = derivacion.map(d => d.nivel);
  const {c, veto} = condiciones(r, P);
  // Siempre hay rutina con activos. Si hay algo que consultar, la piel está irritada o hay un tratamiento con receta, la rutina es suave.
  const modo = (niveles.includes("sin_rutina") || niveles.includes("minima") || derivacion.some(x => x.suave) || P.includes("P24") || c.receta) ? "suave" : "normal";
  if(modo === "suave"){
    const m = c.receta ? "Mientras sigas un tratamiento con receta, no pongo activos fuertes encima." : c.procedimiento ? "Después de un tratamiento en consulta, sin activos hasta que te lo autoricen." : "Mientras lo consultas o la piel se recupera, sin activos fuertes.";
    for(const k of RETINOIDES.concat(["glicolico", "lactico", "mandelico", "salicilico", "lha", "vitc_pura", "bakuchiol"])) veto[k] = veto[k] || m;
  }
  if(modo === "suave" || c.rojez || c.reactiva || c.barrera){ veto.perfume = veto.perfume || "Rutina sin perfume."; if(modo === "suave") veto.alcohol = veto.alcohol || "Rutina sin alcohol."; }
  c.suave = modo === "suave";
  const ING = r.notas_foto && Object.keys(r.notas_foto).length ? NEC.puntuarIngredientes(r.notas_foto, r, veto, c) : null;
  Object.defineProperty(c, "ing", {value: ING, enumerable: false});
  // Si un sérum no tiene ningún producto que cumpla (dosis, perfume, tipo de piel…), entra otro activo en su lugar (Hugo, 24/11: primero el
  // mismo activo en otro producto, luego otro activo; si no hay, el hueco queda vacío). Se recalcula la pauta sin esa función, dos veces como mucho.
  let pa = pauta(r, P, c, veto, modo), el0 = null; const sinProd = [];
  for(let vuelta = 0; vuelta < 4; vuelta++){
    el0 = elegir(pa, {c, veto, P, r, serums: pa.serums, modo, ing: ING});
    const vacio = pa.huecos.find(h => h.deseo && !el0.sel[h.slot] && !el0.quitados.includes(h));   // también si los candidatos se cayeron por duplicados o ácidos (Hugo, 25/11: cascada mismo activo → otro activo → vacío)
    if(!vacio) break;
    const excl = (r._excluir || []).concat(vacio.deseo.k);
    const pa2 = pauta(Object.assign({}, r, {_excluir: excl}), P, c, veto, modo);
    if(!pa2.serums.length && pa.serums.length > 1) break;
    sinProd.push({k: vacio.deseo.k, que: nombreDeseo(vacio.deseo.k), por: el0.repetidos && el0.repetidos.has(vacio.deseo.k) ? "Su activo ya va en otro sérum de tu rutina: no hace falta repetirlo." : "Ahora mismo no lo tenemos en la farmacia en una versión adecuada para tu piel. Pregunta en el mostrador: pueden pedírtelo."});
    pa2.fuera = sinProd.concat(pa2.fuera.filter(f => !sinProd.some(x => x.que === f.que)));
    pa = pa2; r = Object.assign({}, r, {_excluir: excl});
  }
  const perfil = {
    problemas: pa.orden.map(id => ({id, nombre: PROBLEMAS[id].t, corto: CORTO[id], alcance: PROBLEMAS[id].alcance, plazo: PLAZOS[id] || ""})),
    primero: pa.orden.length > 1 ? PROBLEMAS[pa.orden[0]].t : null,
    condiciones: Object.entries(c).filter(([k, v]) => v === true && k !== "suave").map(([k]) => k), piel: c.piel
  };
  const no_recomiendo = agrupaVetos(veto);
  const ctx = {c, veto, P, r, serums: pa.serums, modo, ing: ING};
  const el = el0 && el0.sel ? el0 : elegir(pa, ctx);
  // Escalado (Hugo, 27/11): lo que cubre la hidratante con niacinamida deja de estar «fuera»
  pa.cubiertoH = el.sel.H ? (pa.cubrirH || []).filter(f => f.acts.some(a => aDosis(el.sel.H.p, a))) : [];
  { const sin = (pa.enHidratante || []).filter(f => !pa.cubiertoH.includes(f)); if(sin.length) pa.fuera = pa.fuera.concat(sin.map(f => Object.assign({}, f, {por: "No he encontrado una hidratante con niacinamida que te vaya bien para cubrirlo."}))); }
  if(pa.cubiertoH.length) pa.fuera = pa.fuera.filter(f => !pa.cubiertoH.some(x => x.k === f.k));
  const productos = [], queda_fuera = pa.fuera.map(f => ({que: f.que, por: f.por}));
  for(const h of pa.huecos){
    const e = el.sel[h.slot];
    if(!e){
      const q = el.quitados.includes(h);
      const alt = (el.cand[h.slot] || {sin_dosis: []}).sin_dosis.slice(0, 3);
      if(q) queda_fuera.push({que: h.etiqueta, por: "No cabía en tu presupuesto sin quitar algo más importante."});
      else productos.push({slot: h.slot, paso: h.etiqueta, turno: h.turno, producto: null, para: h.deseo ? h.deseo.para : "", activos_validos: h.deseo && h.deseo.activos ? h.deseo.activos.map(nombre) : [],
        motivo: alt.length ? "Ninguna marca declara la dosis de este activo. Estos lo llevan, pero no puedo asegurar que lleguen a la dosis eficaz." : "En el catálogo no hay ningún producto que cumpla lo que necesitas aquí.",
        alternativas: alt.map(a => ficha(a, h))});
      continue;
    }
    const libres = el.cand[h.slot].principales.filter(a => a.p.id !== e.p.id && !Object.values(el.sel).some(s => s.p.id === a.p.id));
    const alts = libres.slice(0, 2);
    // empate (Hugo, 24/11): si otros productos quedan a ≤0,05 puntos del elegido, se ofrecen hasta 3 opciones; mismo activo, dentro del presupuesto, orden por puntos y luego id
    const holgura = el.tope === Infinity ? Infinity : el.tope - el.total;
    const empate = libres.filter(a => Math.abs(a.score - e.score) <= EMPATE && a.activo === e.activo && (h.slot === "S" || a.p.pvp_eur - e.p.pvp_eur <= holgura))
      .sort((a, b) => b.score - a.score || a.p.id.localeCompare(b.p.id)).slice(0, 2);
    // opción económica (Hugo, 24/11): si el elegido es muy caro, uno con el mismo activo que cumpla casi igual y cueste mucho menos
    const economica = e.p.pvp_eur >= CARO ? libres.filter(a => a.activo === e.activo && a.score >= e.score - CASI_IGUAL && a.p.pvp_eur <= e.p.pvp_eur * .6 && !empate.includes(a))
      .sort((a, b) => b.score - a.score || a.p.pvp_eur - b.p.pvp_eur || a.p.id.localeCompare(b.p.id))[0] || null : null;
    const fc = ficha(e, h);
    const actH = h.slot === "H" && pa.cubiertoH.length ? pa.cubiertoH[0].acts.find(a => aDosis(e.p, a)) : null;
    if(actH){ fc.activo = fc.activo || nombre(actH); fc.activo_clave = fc.activo_clave || actH; }
    productos.push(Object.assign(fc, {slot: h.slot, paso: h.etiqueta, turno: h.turno, aparte: !!h.aparte, para: actH ? `Hidrata y, con su ${nombre(actH)}, ayuda a ${pa.cubiertoH.map(f => (F[f.k] || {}).para || f.que.toLowerCase()).filter((x, i, a) => a.indexOf(x) === i).join(" y ")}.` : paraQue(h, e, pa),
      alternativas: alts.map(a => ficha(a, h)).concat(el.cand[h.slot].sin_dosis.slice(0, 1).map(a => Object.assign(ficha(a, h), {sin_dosis: true}))),
      empate: empate.map(a => ficha(a, h)), economica: economica ? ficha(economica, h) : null}));
  }
  // frecuencia: el sérum de retinoide o de ácido dice cuántas noches va, igual que la semana
  const FREC = {L: "lunes", M: "martes", X: "miércoles", J: "jueves", V: "viernes", S: "sábado", D: "domingo"};
  pa.serums.forEach((sr, i) => { const pr = productos.find(x => x.slot === "serum" + (i + 1)); if(!pr) return;
    const noches = sr.k === "retinoide" ? pa.nochesRet : ["aha", "pha", "glicolico_afeitado"].includes(sr.k) ? pa.nochesAha : sr.k === "salicilico" ? pa.nochesSal : null;
    if(!noches || !noches.length || noches.length >= 7){
      // sérum diario que comparte la noche con un activo fuerte: va las otras noches
      const fuertes = pa.serums.filter(o => o !== sr && o.turno === sr.turno && sr.turno === "PM" && CON_FRECUENCIA.includes(o.k));
      if(!CON_FRECUENCIA.includes(sr.k) && fuertes.length){ const dias = pa.semana.filter(d => !d.noche.includes(etiquetaDeseo(fuertes[0].k))).map(d => d.dia); pr.noches = dias; pr.frecuencia = `Las noches sin ${nombreDeseo(fuertes[0].k).toLowerCase()} (${dias.map(d => FREC[d]).join(", ")})`; }
      else if(!CON_FRECUENCIA.includes(sr.k) && sr.turno === "AM" && pa.serums.some(o => o.k === "salicilico" && o.turno === "AM")) pr.frecuencia = "Las mañanas sin salicílico";
      return;
    }
    pr.noches = noches.slice();
    const unidad = sr.turno === "AM" ? ["Una mañana", "mañanas"] : ["Una noche", "noches"];
    // laboratorio (patrón F, C101): si el escalado sube de noches más adelante, la tarjeta dice que es para empezar, sin contradecir el aviso
    const empezar = sr.k === "retinoide" && pa.escalado && /Semanas 5-12: 3 noches|Techo: 3 noches/.test(pa.escalado) && noches.length < 3 ? " para empezar" : "";
    pr.frecuencia = noches.length === 1 ? `${unidad[0]} a la semana${empezar} (${FREC[noches[0]]})` : `${noches.length} ${unidad[1]} a la semana${empezar} (${noches.map(d => FREC[d]).join(", ")})`; });
  // en la semana, el sérum de cada noche se nombra por el activo que lleva el producto elegido
  pa.serums.forEach((sr, i) => { const pr = productos.find(x => x.slot === "serum" + (i + 1)); if(!pr || !pr.activo || !sr.flexible) return;
    const de = etiquetaDeseo(sr.k), a = pr.activo.charAt(0).toUpperCase() + pr.activo.slice(1);
    for(const dia of pa.semana) dia.noche = dia.noche.map(t => t === de ? a : t); });
  // orden de aplicación (Hugo, 25/11): el contorno va antes de los sérums, para que el activo no migre al ojo
  { const i = productos.findIndex(x => x.slot === "contorno"), j = productos.findIndex(x => /^serum/.test(x.slot)); if(i > j && j >= 0) productos.splice(j, 0, productos.splice(i, 1)[0]); }
  const manana = productos.filter(x => ["AM", "AMPM"].includes(x.turno)).map(x => x.paso), noche = productos.filter(x => ["PM", "AMPM"].includes(x.turno) && x.slot !== "contorno" || x.slot === "contorno").filter(x => x.turno !== "AM").map(x => x.paso);
  // laboratorio (27/11, L07 y L18): el recuento cuenta los productos que salen de verdad, solar incluido
  const avisos = pa.notas.map(t => { const m = /^Te pongo \d+ productos y no (\d+):/.exec(t); if(!m) return t;
    const real = productos.filter(x => x.id).length; return real >= +m[1] ? null : t.replace(/^Te pongo \d+/, `Te pongo ${real}`); }).filter(Boolean);
  // Retinoide propio (Hugo, 25/11, pregunta 15): si ya usa uno y la rutina no lo trae, se le dice qué hacer con él en lugar de ignorarlo
  if(["reciente", "tolera"].includes(r.retinoide_exp) && !c.menor18 && !c.receta && !Object.entries(el.sel || {}).some(([sl, e]) => sl !== "contorno" && e && e.p && RETINOIDES.some(k => aDosis(e.p, k)))){   // laboratorio (T1-34): el retinal del contorno no sustituye al retinoide de la cara
    const nfR = r.notas_foto || {};
    if(c.procedimiento) avisos.push("Deja tu retinoide actual hasta que quien te hizo el tratamiento te diga que puedes retomarlo.");
    else if(c.embarazo || c.barrera || (nfR.rojez ?? 100) < 45) avisos.push(c.embarazo ? `Suspende tu retinoide actual durante ${c.lactancia ? "la lactancia" : "el embarazo"}. Lo retomas después.` : "Suspende tu retinoide actual hasta que tu piel recupere la calma. Lo retomas después.");
    else if((nfR.hidratacion ?? 100) < 55 + B3 || c.sequedad_activa || r.reactiva === "siempre") avisos.push("Mantén tu retinoide actual 2 o 3 noches por semana, o aplícalo en sándwich sobre la hidratante, mientras recuperamos la hidratación de tu piel.");
    else { const act = productos.filter(x => /^serum/.test(x.slot) && x.producto && ["PM", "AMPM"].includes(x.turno) && x.activo && (x.frecuencia || ["ácido", "salicílico", "glicólico", "láctico", "azelaico"].some(w => x.activo.includes(w)))).map(x => x.activo);
      avisos.push(act.length ? `Puedes seguir con tu retinoide actual las noches que no uses ${act.join(" ni ")}, con al menos 1 o 2 noches de descanso a la semana.` : "Puedes seguir con tu retinoide actual por la noche, como hasta ahora."); }
  }
  // laboratorio (27/11, L05 y L06): un aviso «si tu rutina lleva retinoide» solo sale si la rutina lo lleva
  const llevaRet = productos.some(x => x.id && x.slot !== "contorno" && el.sel[x.slot] && el.sel[x.slot].p && RETINOIDES.some(k => aDosis(el.sel[x.slot].p, k)));
  for(let t of r.avisos_extra || []){ if(!t) continue;
    if(!llevaRet){ if(/^Si tu rutina lleva retinoide/.test(t)) continue; t = t.replace(/\s*El retinoide, mejor entre dos capas de crema al principio\./, ""); }   // laboratorio (T1-22, T1-30)
    if(!avisos.includes(t)) avisos.push(t); }   // SkinRead: avisos de las reglas de la foto
  { const fp = x => (LISTA || CATALOGO).find(q => q.id === x.id), perf = productos.filter(x => /^serum/.test(x.slot) && x.id && fp(x) && (fp(x).fragancia === true || lleva(fp(x), "perfume")));
    if(c.reactiva_a_veces && perf.length) avisos.push(`${perf.map(x => x.marca + " " + x.producto).join(" y ")} lleva perfume o alérgenos de fragancia (como la cumarina). Pruébalo antes en una zona pequeña, detrás de la oreja, 2 o 3 días. Empieza 2 noches por semana y déjalo mientras la piel esté irritada.`);
    // propuesta 11: aceites esenciales sin «parfum», con piel que reacciona a veces. Se nombra cuál lleva: no todos tienen la misma composición
    const ae = productos.filter(x => x.id && fp(x) && !perf.includes(x) && !perfumado(fp(x)) && lleva(fp(x), "aceite_esencial"));
    if(c.reactiva_a_veces && ae.length) avisos.push(`${ae.map(x => x.marca + " " + x.producto + " (" + aceitesEsenciales(fp(x)).slice(0, 2).join(", ") + ")").join(" y ")} lleva aceites esenciales, que perfuman y pueden llevar alérgenos de fragancia. Pruébalo antes en una zona pequeña 2 o 3 días y déjalo si te pica o enrojece.`); }
  // revisión externa (25/11, C16-04): retinoide con perfume o alérgenos de fragancia en piel con la barrera débil (hidratación <60, rojez o piel que reacciona)
  { const nfB = r.notas_foto || {}, retP = productos.filter(x => /^serum/.test(x.slot) && x.id && el.sel[x.slot] && RETINOIDES.some(k => aDosis(el.sel[x.slot].p, k)) && (el.sel[x.slot].p.fragancia === true || lleva(el.sel[x.slot].p, "perfume")));
    if(retP.length && ((nfB.hidratacion ?? 100) < 60 || (nfB.rojez ?? 100) < 60 || r.reactiva !== "nunca") && !c.reactiva_a_veces)
      avisos.push(`${retP.map(x => x.marca + " " + x.producto).join(" y ")} lleva alérgenos de fragancia (como la cumarina). Empieza solo con la piel tranquila y déjalo si notas picor, escozor o descamación que no se pasa. Si ya te ha dado alergia algún perfume, pide en el mostrador uno sin fragancia.`); }
  if(pa.serums.some(s => s.k === "pha")) avisos.push("El PHA es un exfoliante suave: una noche a la semana para empezar. Si escuece o enrojece, déjalo.");
  if(pa.escalado) avisos.push(pa.escalado + " Cantidad: un guisante para toda la cara. Si irrita, baja un escalón y refuerza la hidratante.");
  if(P.includes("P09")) avisos.push("Lo que más cuenta aquí es la técnica: a favor del pelo, sin tensar la piel, sin apurar, hoja afilada, agua templada y espuma, dos pasadas como mucho.");
  if(P.includes("P13")) avisos.push("El solar con color no es estético: frena la luz visible, que también oscurece estas manchas. Reaplícalo cada 2 horas al aire libre.");
  if(P.includes("P15")) avisos.push("Para las ojeras no hay un activo con respaldo sólido. Solar y no frotar es lo que más ayuda.");
  if(CFG.verano === "aviso" && pa.serums.some(s => s.k === "retinoide")) avisos.push("El retinoide va siempre de noche, con solar a la mañana siguiente.");
  if(CFG.peroxido_benzoilo === "mencionar" && ["P01", "P02"].some(x => P.includes(x)) && modo === "normal") { const conRet = !c.embarazo && !c.menor18 && productos.some(x => /^serum/.test(x.slot) && x.id && el.sel[x.slot] && RETINOIDES.some(k => aDosis(el.sel[x.slot].p, k)));
    avisos.push(`Si a las 6-8 semanas la rutina no basta, en la farmacia hay peróxido de benzoílo al 2,5 % sin receta: de mañana${conRet ? ", con el retinoide de noche" : ""}. Es un medicamento, no forma parte de esta rutina.`); }
  if(!el.dentro) avisos.push(`Con los productos que cumplen lo que necesitas, la rutina sale por ${fmt(el.total)} €, por encima de tu tope. No he encontrado una combinación más barata que siga cumpliendo.`);
  const op = opciones(P, pa, el, productos, veto, c, r);
  // Orden de aplicación por la mañana: la vitamina C va antes que el otro tratamiento. No cambia la prioridad.
  { const iC = productos.findIndex(x => /^serum/.test(x.slot) && x.activo_clave && x.activo_clave.startsWith("vitc")), iO = productos.findIndex(x => /^serum/.test(x.slot) && x.turno === "AM");
    if(iC > iO && iO >= 0){ const [v] = productos.splice(iC, 1); productos.splice(iO, 0, v); } }
  if(pa.serums.length > 1) avisos.unshift("No empieces todo a la vez. Primero la base y el activo principal; cada activo nuevo, con dos semanas de separación como mínimo. Si algo irrita, sabrás cuál ha sido.");
  if(modo === "suave") avisos.unshift(P.includes("P26") ? "Rutina suave mientras lo consultas. Con granitos alrededor de la boca, a menudo lo que más ayuda es usar pocas cosas: si algún producto lo empeora, retíralo."
    : c.receta ? "Rutina suave para acompañar tu tratamiento: no sustituye lo que te han recetado."
    : c.procedimiento ? "Rutina de recuperación tras tu tratamiento en consulta: limpiador suave, crema reparadora y protector solar 50+, sin activos ni perfume."
    : P.includes("P24") ? "Rutina suave hasta que la piel se recupere: dos semanas como mínimo. Después, un producto nuevo cada 1-2 semanas, empezando por el más suave."
    : "Rutina suave mientras lo consultas: pocos productos, sin perfume y con un solo activo nuevo cada vez. Si algo escuece, déjalo.");
  return {modo, perfil, derivacion, opciones: op.opciones, prioridad: op.prioridad, rutina: {manana, noche}, semana: pa.semana, escalado: pa.escalado || null, noches: {retinoide: pa.nochesRet, acido: pa.nochesAha}, productos, no_recomiendo, queda_fuera, avisos,
    ingredientes_piel: ING ? ING.ranking.filter(x => x.puntos > 0).slice(0, 10).map(x => ({k: x.k, nombre: x.nombre, clase: x.clase, puntos: x.puntos, porque: x.porque.slice(0, 3), penaliza: x.penaliza})) : null,
    necesidad: ING ? ING.necesidad : null, via_leve: !!pa.leve,
    total: el.total, tope: el.tope === Infinity ? null : el.tope, dentro_presupuesto: el.dentro, n_pedidos: pa.N0, n_aplicados: pa.N, _c: c, _veto: veto, _pauta: pa};
}
/* ------------------------------------------------------------------ 6 bis · Opciones y prioridad
   Lo que el resultado enseña antes de los productos: qué opciones tienen sentido, cuál va primero y por qué.
   Todo sale de la pauta: el orden de los problemas, los activos válidos de cada función, lo que no cabe y los vetos.
   No hay puntuaciones. Las limitaciones son las de las fichas de ingrediente y del catálogo. */
const FICHA_ING = {retinol: "retinol", retinal: "retinaldehido", esteres_retinilo: "retinol", azelaico: "acido-azelaico", niacinamida: "niacinamida", salicilico: "acido-salicilico",
  glicolico: "acido-glicolico", lactico: "acido-lactico", vitc_pura: "vitamina-c", vitc_derivados: "vitamina-c", tranexamico: "acido-tranexamico", bakuchiol: "bakuchiol"};
const FICHA_DESEO = {pha: "gluconolactona", barrera: "niacinamida", retinoide: "retinol", aha: "acido-glicolico", glicolico_afeitado: "acido-glicolico", salicilico: "acido-salicilico", vitc: "vitamina-c", bakuchiol: "bakuchiol", sebo: "niacinamida", azelaico_noche: "acido-azelaico"};
const LIMITE = {
  retinol: "Puede irritar al empezar: se introduce poco a poco.", retinal: "Sus ensayos son casi todos de una misma marca. Puede irritar al empezar.", esteres_retinilo: "Puede irritar al empezar: se introduce poco a poco.",
  retinoide: "Puede irritar al empezar: se introduce poco a poco.",
  azelaico: "Casi todos los estudios son del medicamento, al 15-20 %. En cosmética la evidencia es más limitada.",
  niacinamida: "Los ensayos son casi todos al 4-5 %. No he encontrado pruebas de que el 10 % funcione mejor.",
  salicilico: "Tiene pocos ensayos, aunque favorables, en puntos negros y granos leves.",
  glicolico: "Puede aumentar la sensibilidad al sol. Una noche a la semana, nunca la del retinoide.", lactico: "Puede picar en piel sensible. Una noche a la semana, nunca la del retinoide.",
  aha: "Una noche a la semana, dos como mucho, y nunca la del retinoide.",
  vitc_pura: "No hay una dosis de consenso. Se oxida con facilidad.", vitc_derivados: "No hay una dosis de consenso.", vitc: "No hay una dosis de consenso.",
  tranexamico: "El único ensayo de tranexámico solo, frente a la misma crema sin activo, no vio diferencia. Es la vía más lenta.",
  pha: "Sus estudios son casi todos del fabricante. En ellos se toleró mejor que el glicólico.",
  thiamidol: "Sus estudios son de la propia marca.", bakuchiol: "El ensayo que lo respalda lo pagó el proveedor del ingrediente."
};
const SIN_ALTERNATIVA = ["retinoide", "vitc", "aha", "pha", "barrera", "glicolico_afeitado", "humectante", "bakuchiol", "salicilico"];   // formas de un mismo ingrediente o función con un solo activo
function opciones(P, pa, el, productos, veto, c, r){
  const corto = id => CORTO[id] || PROBLEMAS[id].t;
  const deseoBase = k => k === "azelaico_noche" ? "retinoide" : k;
  const objetivos = (k, por) => { const l = pa.orden.filter(p => (DESEOS[p] || []).includes(deseoBase(k))); if(por && !l.includes(por)) l.unshift(por); return l.map(corto); };
  const may = t => t.charAt(0).toUpperCase() + t.slice(1);
  const out = [], vistos = new Set();
  pa.serums.forEach((s, i) => {
    const prod = productos.find(x => x.slot === "serum" + (i + 1)) || {};
    const clave = prod.activo_clave || null;
    const nom = prod.activo ? may(prod.activo) : etiquetaDeseo(s.k);
    const obj = objetivos(s.k, s.por);
    out.push({papel: i === 0 ? "prioridad" : "siguiente", nombre: nom, clave: clave || s.k, ficha: FICHA_ING[clave] || FICHA_DESEO[s.k] || null, turno: s.turno, objetivos: obj,
      por_que: `Para ${s.para}.` + (obj.length > 1 ? ` Encaja con ${obj.length} de tus objetivos.` : ""), limite: LIMITE[clave] || LIMITE[s.k] || null,
      motivo: i === 0 ? null : "Entra cuando lleves al menos dos semanas con el anterior y lo toleres.", sin_producto: !prod.producto});
    vistos.add(s.k);
    // alternativas: otro activo válido para la misma función, que no esté vetado y que tenga producto en el catálogo
    if(!SIN_ALTERNATIVA.includes(s.k) && clave){
      const cand = (el.cand["serum" + (i + 1)] || {principales: []}).principales;
      for(const a of (s.activos || [])){
        if(a === clave || veto[a] || out.some(o => o.clave === a) || !cand.some(x => x.activo === a)) continue;
        if(out.filter(o => o.papel === "alternativa").length >= 2) break;
        out.push({papel: "alternativa", nombre: may(nombre(a)), clave: a, ficha: FICHA_ING[a] || null, turno: s.turno, objetivos: obj, por_que: `Cumple la misma función: ${s.para}.`, limite: LIMITE[a] || null,
          motivo: `No la pongo primero porque, en tu caso, el producto con ${prod.activo} cumple mejor los criterios: dosis declarada, tipo de piel y presupuesto.`});
      }
    }
  });
  // Escalado (Hugo, 27/11): la función que cubre la hidratante sale como ingrediente de la rutina, no como «para más adelante»
  for(const f of pa.cubiertoH || []){ if(vistos.has(f.k)) continue; vistos.add(f.k);
    const a = f.acts.find(x => el.sel.H && aDosis(el.sel.H.p, x)) || f.acts[0];
    out.push({papel: "siguiente", nombre: may(nombre(a)), clave: a, ficha: FICHA_ING[a] || null, turno: "AMPM", objetivos: objetivos(f.k), por_que: `Para ${(F[f.k] || {}).para || f.que.toLowerCase()}. Va en la hidratante.`, limite: LIMITE[a] || null, motivo: null}); }
  // lo que queda para más adelante: funciones que tu piel pide y que ahora no entran (no caben, o hay que esperar). Lo vetado va aparte.
  const motivosVeto = new Set(Object.values(veto));
  for(const f of pa.fuera){
    const k = f.k || {"Retinoide": "retinoide", "Exfoliante con ácido": "aha", "Exfoliante": "pha", "Ácido salicílico": "salicilico"}[f.que];
    if(!k || vistos.has(k) || motivosVeto.has(f.por) || out.some(o => o.nombre === f.que)) continue;
    vistos.add(k);
    out.push({papel: "no_ahora", nombre: f.que, clave: k, ficha: FICHA_DESEO[k] || null, turno: (F[k] || {}).turno || null, objetivos: objetivos(k), por_que: F[k] ? `Para ${F[k].para}.` : "", limite: LIMITE[k] || null, motivo: f.por});
  }
  // la prioridad, explicada con las reglas que la han decidido
  let prioridad = null;
  const p0 = out.find(o => o.papel === "prioridad"), s0 = pa.serums[0];
  if(p0){
    const razones = [];
    if(s0.k === "azelaico_noche") razones.push("En el embarazo y la lactancia ocupa el lugar del retinoide.");
    if(s0.por === pa.orden[0] && pa.orden.length > 1) razones.push(`Responde a «${corto(s0.por).toLowerCase()}», que es lo primero que se trata.`);
    else if(s0.por && s0.por !== "P31") razones.push(`Responde a «${corto(s0.por).toLowerCase()}».`);
    if(p0.objetivos.length > 1) razones.push(`Encaja con ${p0.objetivos.length} de tus objetivos: ${p0.objetivos.join(", ").toLowerCase()}.`);
    if(pa.serums.length === 1 && pa.lista.length > 1) razones.push(pa.N <= 3 ? "Con tres productos solo cabe un activo, y así la rutina se queda corta y fácil de seguir." : "Es el único activo que entra ahora: los demás tienen que esperar.");
    const pr = productos.find(x => x.slot === "serum1");
    if(pr && pr.dosis_tipo === "declarada") razones.push("Hay un producto que declara la dosis, y está dentro del rango que busco.");
    if(Object.keys(veto).length) razones.push("Es compatible con lo que no puedes o no te conviene usar.");
    prioridad = {nombre: p0.nombre, ficha: p0.ficha, razones,
      despues: out.filter(o => o.papel === "siguiente").map(o => ({nombre: o.nombre, texto: "Cuando lleves al menos dos semanas con el anterior y lo toleres."}))
        .concat(out.filter(o => o.papel === "no_ahora").map(o => ({nombre: o.nombre, texto: o.motivo})))};
  }
  return {opciones: out, prioridad};
}

const nombreEn = (p, k) => { const ep = CFG.ensayo_producto[p.id]; return ep && ep.activo === k && ep.etiqueta ? ep.etiqueta : nombre(k); };
function ficha(e, h){
  // el solar siempre dice su SPF en el nombre (revisión externa, 25/11: «SVR Fluide Photo-Age» no parecía un fotoprotector)
  const nomP = h && h.slot === "S" && e.p.spf && !/\b(spf|fps|ip)\s*\d/i.test(e.p.producto) ? `${e.p.producto} SPF ${e.p.spf >= 50 ? "50+" : e.p.spf}` : e.p.producto;
  return {id: e.p.id, marca: e.p.marca, producto: nomP, spf: h && h.slot === "S" ? e.p.spf || null : undefined, precio: e.p.pvp_eur, formato_ml: e.p.formato_ml, foto: e.p.foto || null, compra: e.p.compra || null, url: e.p.url_producto || null,
    activo: e.activo ? nombreEn(e.p, e.activo) : null, activo_clave: e.activo || null, dosis: e.dosis ? e.dosis.txt : null, dosis_tipo: e.dosis ? e.dosis.tipo : null, funciones: e.cubre, ademas: e.extra || [], score: Math.round(e.score * 100) / 100,
    desglose: e.desglose || null, calidad: (CALIDAD[e.p.id] || {}).calidad ?? null};
}
function paraQue(h, e, pa){
  if(h.deseo) return `Para ${h.deseo.para}${e.activo ? `, con ${nombreEn(e.p, e.activo)}` : ""}.`;
  return {L: e.activo === "salicilico" ? "Limpia y, con su salicílico, ayuda a desobstruir el poro." : "Limpia sin resecar.", H: "Hidrata y cuida la barrera de la piel.", H2: "Crema más rica para la noche.",
    S: "Protege del sol. Es el paso que más cuida tu piel a largo plazo.", contorno: "Formulado para la piel del contorno de los ojos.", posafeitado: "Calma la piel después del afeitado, sin alcohol."}[h.slot] || "";
}
function agrupaVetos(veto){
  const g = {};
  for(const [k, m] of Object.entries(veto)) (g[m] = g[m] || []).push(nombre(k));
  return Object.entries(g).map(([motivo, activos]) => ({activos: [...new Set(activos)], claves: Object.keys(veto).filter(k => veto[k] === motivo), motivo}));
}
CFG.topes = CFG.topes || {barrera: 3, rojez_sensible: 5};

/* ------------------------------------------------------------------ 7 · Vista provisional (panel del test)
   Acepta respuestas a medias. No elige productos: devuelve lo que se va viendo (problemas, funciones, vetos).
   Calcula siempre con el máximo de pasos: el número de productos no cambia lo que la piel pide, solo lo que cabe. */
const CORTO = {P01: "Puntos negros", P02: "Granos", P03: "Granos del adulto", P04: "Bultos profundos", P05: "Granitos que pican", P06: "Brillo", P07: "Poros", P08: "Poros y firmeza",
  P09: "Pelos encarnados", P10: "Marcas oscuras", P11: "Marcas rojas", P12: "Manchas", P13: "Manchas hormonales", P14: "Tono apagado", P15: "Ojeras", P16: "Cicatrices hundidas",
  P17: "Líneas finas", P18: "Arrugas de expresión", P19: "Firmeza", P20: "Textura áspera", P21: "Rojez fija", P22: "Rojez con granitos", P23: "Piel sensible", P24: "Piel irritada",
  P25: "Descamación grasienta", P26: "Granitos junto a la boca", P27: "Zonas secas con picor", P28: "Piel seca", P29: "Piel deshidratada", P30: "Sequedad constante", P31: "Mantener"};
function provisional(r){
  r = r && typeof r === "object" ? r : {};
  if(r.edad === "-14") return {vacio: true, problemas: [], funciones: [], evita: [], fuera: []};
  let {problemas: P, derivacion} = detectar(r);
  if(!Array.isArray(r.preocupa)) P = P.filter(x => x !== "P31");
  const marcadas = (r.preocupa || []).filter(x => x !== "nada");
  if(!P.length || (P.length === 1 && P[0] === "P31" && marcadas.length)) return {vacio: true, pendiente: marcadas.length > 0, problemas: [], funciones: [], evita: [], fuera: []};
  const niveles = derivacion.map(d => d.nivel);
  const {c, veto} = condiciones(r, P);
  const modo = (niveles.includes("sin_rutina") || niveles.includes("minima") || derivacion.some(x => x.suave) || P.includes("P24") || c.receta) ? "suave" : "normal";
  if(modo === "suave") for(const k of RETINOIDES.concat(["glicolico", "lactico", "mandelico", "salicilico", "lha", "vitc_pura", "bakuchiol"])) veto[k] = veto[k] || "Mientras lo consultas o la piel se recupera, sin activos fuertes.";
  const pa = pauta(Object.assign({}, r, {productos: 6}), P, c, veto, modo);
  const sinActivos = c.menor18;
  const mensaje = c.menor18 ? "De 14 a 17 años la rutina es limpiador, hidratante ligera y solar."
    : modo === "suave" ? "Con lo que me cuentas, la rutina va a ser suave: pocos productos y activos que la piel sensible tolera." : null;
  const vistos = new Set();
  const fuera = pa.fuera.filter(f => !vistos.has(f.que) && vistos.add(f.que)).map(f => ({que: f.que, por: /^Con \d productos|No cabe sin/.test(f.por) ? null : f.por})).filter(f => f.por);
  return {modo, mensaje, consulta: derivacion.length > 0,
    problemas: pa.orden.map(id => ({id, nombre: CORTO[id] || PROBLEMAS[id].t})),
    funciones: sinActivos ? [] : pa.serums.map(s => ({k: s.k, nombre: etiquetaDeseo(s.k), para: s.para, turno: s.turno, por: CORTO[s.por] || ""})),
    evita: sinActivos ? [] : agrupaVetos(veto).map(g => g.activos).flat().filter((x, i, a) => a.indexOf(x) === i).slice(0, 8),
    fuera, retinoide: !sinActivos && pa.serums.some(s => s.k === "retinoide")};
}
/* SkinRead: calcula con una lista de productos concreta (el stock de la farmacia, con su PVP). Síncrono. */
function calcularCon(r, lista){
  LISTA = lista;
  try { return calcular(r); } finally { LISTA = null; }
}
/* Escalado entre niveles (Hugo, 27/11): «si hay un producto que es este o ninguno, repártelo en las tres; lo que no puede ser es que te quedes sin dirigir
   un ingrediente». Los niveles se calculan en orden: cada uno parte del anterior (mismos sérums primero y el mismo producto para la misma función,
   si sigue siendo válido) y solo suma. En la completa, lo que no cabe solo por sitio lo cubre la hidratante cuando se puede; si no, se dice por qué espera.
   niveles: [{productos, presupuesto}, …] de menor a mayor. Devuelve un resultado por nivel, en el mismo orden. */
function calcularNiveles(r, lista, niveles){
  const corre = (nv, previo) => calcularCon(Object.assign({}, r, {productos: nv.productos, presupuesto: nv.presupuesto, _escalado: true, _previo: previo, _top: nv === niveles[niveles.length - 1]}), lista);
  const deseosDe = o => o._pauta.serums.map(s => ({k: s.k, por: s.por, activos: s.activos ? s.activos.slice() : undefined, leve: s.leve}));
  const fijarDe = o => { const f = {}; for(const x of o.productos){ if(!x.id) continue; const m = /^serum(\d)$/.exec(x.slot);
    if(m){ const s = o._pauta.serums[+m[1] - 1]; if(s) f["d:" + s.k] = x.id; } else f["s:" + x.slot] = x.id; } return f; };
  // 1.ª pasada, de abajo arriba: qué funciones entran en cada nivel (cada uno parte del anterior)
  const outs = []; let previo = null;
  for(const nv of niveles){
    let o = corre(nv, previo);
    // un ingrediente nuevo no puede echar a uno del nivel anterior (p. ej. el retinal de la completa no puede quitar el azelaico de la media): si pasa, el nuevo espera
    const perdidos = () => previo ? previo.serums.filter(k => !o._pauta.serums.some(s => s.k === k) && !(o._pauta.cubiertoH || []).some(f => f.k === k)) : [];
    const nuevos = previo ? o._pauta.serums.map(s => s.k).filter(k => !previo.serums.includes(k)) : [], fuera = [];
    while(perdidos().length && nuevos.length){ const k = nuevos.pop(); fuera.push(k);
      o = calcularCon(Object.assign({}, r, {productos: nv.productos, presupuesto: nv.presupuesto, _escalado: true, _previo: previo, _top: nv === niveles[niveles.length - 1], _esperan: fuera.slice()}), lista); }
    // en la completa, si un sérum salió por «un sérum por momento del día» después de ocupar sitio, ese sitio es para lo siguiente de la lista (C060: el AHA antes que un contorno de relleno)
    if(nv === niveles[niveles.length - 1]){ const turno = o._pauta.fuera.concat(o._pauta.cubiertoH || []).filter(f => f.k && /^Un sérum por momento del día: (más capas|por la mañana)/.test(f.por)).map(f => f.k);
      if(turno.length && o._pauta.fuera.some(f => /No cabe sin pasar de 6/.test(f.por))){ const esp = fuera.concat(turno.filter(k => !fuera.includes(k)));
        const o2 = calcularCon(Object.assign({}, r, {productos: nv.productos, presupuesto: nv.presupuesto, _escalado: true, _previo: previo, _top: true, _esperan: esp}), lista);
        const pierde = previo && previo.serums.some(k => !o2._pauta.serums.some(s => s.k === k) && !(o2._pauta.cubiertoH || []).some(f => f.k === k) && o._pauta.serums.some(s => s.k === k));
        if(!pierde && o2._pauta.serums.length >= o._pauta.serums.length){ o = o2; fuera.splice(0, fuera.length, ...esp); } } }
    if(fuera.length) o._esperan = fuera;
    outs.push(o); previo = {serums: o._pauta.serums.map(s => s.k), deseos: deseosDe(o), fijar: fijarDe(o), esperan: fuera}; }
  // 2.ª pasada, de arriba abajo: los niveles de abajo usan, para cada función, el producto de la completa si en su nivel también vale.
  // Así un producto que se elige porque encaja con todo lo demás de la completa es el mismo en los tres niveles, y subir de nivel solo suma
  const top = outs[outs.length - 1], fTop = fijarDe(top);
  for(let i = outs.length - 2; i >= 0; i--){
    const ant = i > 0 ? outs[i - 1] : outs[i];
    outs[i] = corre(niveles[i], {serums: ant._pauta.serums.map(s => s.k), deseos: i > 0 ? deseosDe(ant) : null, fijar: fTop, desdeArriba: true});
  }
  return outs;
}
module.exports = {calcular, calcularCon, calcularNiveles, provisional, detectar, condiciones, pauta, PROBLEMAS, CORTO, candidatos};
