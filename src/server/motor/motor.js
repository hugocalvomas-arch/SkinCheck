/* Motor v2 (catálogo v2 de problemas y pautas, 02/10/2026).
   Cadena: respuestas → derivación → problemas → condiciones y vetos → funciones → pauta por huecos y por semana → productos → preferencias.
   Lo que es criterio vive en config.js y en las tablas de este archivo (PROBLEMAS, DESEOS). */
"use strict";
const CFG = require("./config.js");
const {CATALOGO} = require("./catalogo.js");
// SkinRead: el catálogo que ve el motor se puede limitar al stock de una farmacia (calcularCon)
let LISTA = null;
const {RETINOIDES, ACIDOS, nombre, estado, lleva, aDosis, n} = require("./activos.js");

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
  }
  if(c.menor18) v(RETINOIDES.concat("bakuchiol"), "Con menos de 18 años no se usan retinoides ni rutina antiedad.");
  if(c.rojez) v(["glicolico", "lactico", "mandelico", "salicilico", "lha", "urea", "alcohol", "perfume", "mentol"], "Con rojez fija, los ácidos fuertes, el alcohol, el perfume y el mentol la empeoran.");
  if(c.reactiva) v(["glicolico", "lactico", "mandelico", "salicilico", "lha", "alcohol", "perfume"], "Tu piel reacciona con facilidad: sin exfoliantes fuertes, alcohol ni perfume.");
  if(r.reactiva === "siempre") v(["vitc_pura"], "Tu piel reacciona a menudo: la vitamina C pura escuece; mejor un derivado estable.");
  if(c.barrera) v(RETINOIDES.concat(ACIDOS, ["vitc_pura", "azelaico", "perfume"]), "Ahora tu piel tiene que recuperarse: sin retinoides, ácidos, vitamina C pura ni perfume.");
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
  barrera: {f: "F12", turno: "AM", activos: ["niacinamida"], para: "reforzar la barrera con un activo suave", flexible: true}
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
  if(c.menor18 && CFG.acne_14_17 === "limpiador_hidratante_solar") fuera.push({que: "Sérums de tratamiento", por: "De 14 a 17 años la rutina es limpiador, hidratante ligera y solar. Si los granos no mejoran, consulta en la farmacia o con un dermatólogo."});
  // Rutina suave (hay algo que consultar, la piel está irritada o hay un tratamiento con receta): siempre lleva un activo suave para la barrera.
  // Barrera dañada: tres productos y ninguno más. La niacinamida va dentro de la hidratante de barrera, no en un sérum aparte.
  if(suave && !c.menor18 && !c.barrera) lista.push({k: "barrera", por: orden[0]});
  if(!(c.menor18 && CFG.acne_14_17 === "limpiador_hidratante_solar")) for(const p of orden) for(const d of DESEOS[p] || []){
    let k = d;
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
      else if(c.menor25 && !motivoAcne){ fuera.push({que: "Retinoide", por: "Con menos de 25 años no hace falta un retinoide antiedad. Antioxidante de mañana y solar."}); continue; }
      else if(c.rojez){ fuera.push({que: "Retinoide", por: "Con rojez fija, el retinoide solo entra cuando esté estable, y eso no lo puedo saber desde aquí."}); continue; }
      else if(c.sequedad_activa){ fuera.push({que: "Retinoide", por: "Mientras dure la sequedad, el retinoide espera. Cuando la piel deje de tirar, 1-2 noches por semana."}); continue; }
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
  // Vitamina C junto a los despigmentantes: si el tratamiento de granos ya trabaja las marcas (azelaico o niacinamida), la vitamina C entra antes que un despigmentante aparte
  { const iD = lista.findIndex(x => x.k === "despigmentante"), iC = lista.findIndex(x => x.k === "vitc");
    if(lista.some(x => x.k === "antiacne") && iD >= 0 && iC > iD){ const t = lista[iD]; lista[iD] = lista[iC]; lista[iC] = t; } }
  // el ácido exfoliante es el último en entrar: nunca le quita el sitio al retinoide
  if(lista.some(x => x.k === "retinoide")) lista.sort((a, b) => (["aha", "pha"].includes(a.k) && a.por !== "P20") - (["aha", "pha"].includes(b.k) && b.por !== "P20"));
  // embarazo: azelaico ocupa el hueco del retinoide, de noche
  for(const x of lista) if(x.k === "antiacne_o_azelaico"){ x.k = "azelaico_noche"; }
  const deseo = k => k === "azelaico_noche" ? {f: "F10", turno: "PM", activos: ["azelaico"], para: "ocupar el lugar del retinoide durante el embarazo o la lactancia"} : F[k];

  // Reparto: 1 limpiador · 2 sérum principal · 3 hidratante · 4 sérum del otro turno · 5 contorno · 6 otro
  const huecos = [{slot: "L", etiqueta: "Limpiador", turno: "AMPM"}];
  const serums = [];
  const cabe = (d, usados) => {
    if(d.fuerte && usados.some(u => u.fuerte && u.turno === d.turno && !(u.k === "retinoide" && ["aha", "pha"].includes(d.k)) && !(d.k === "retinoide" && ["aha", "pha"].includes(u.k)))) return false;
    return true;
  };
  const ojos = ["P15", "P17", "P18", "P19"].some(x => P.includes(x));
  const tercero = N === 5 && !suave && !ojos && !c.reactiva && !c.rojez && lista.length > 2;   // quinto producto: otro tratamiento antes que un contorno que nadie ha pedido
  const maxSerums = c.barrera || c.receta ? 0 : N >= 6 || tercero ? 3 : N >= 4 ? 2 : 1;
  for(const x of lista){
    if(c.barrera || c.receta){ if(!fuera.some(f => f.k === x.k)) fuera.push({k: x.k, que: nombreDeseo(x.k), por: c.receta ? "Con un tratamiento con receta, limpiador, hidratante y solar. Los tratamientos se eligen después de revisar contigo lo que usas." : "Mientras la piel se recupera, nada más que limpiador, hidratante y solar. Entrará después, de uno en uno."}); continue; }
    if(serums.length >= maxSerums){ if(!fuera.some(f => f.k === x.k)) fuera.push({k: x.k, que: nombreDeseo(x.k), por: N0 < 6 ? `Con ${N0} productos no cabe. Entraría con más pasos.` : "No cabe sin sumar demasiados activos."}); continue; }
    const d = Object.assign({k: x.k, por: x.por}, deseo(x.k));
    if(suave && d.activos && serums.some(s => s.k === "barrera")) d.activos = d.activos.filter(a => a !== "niacinamida");
    if(d.k === "salicilico" && serums.some(s => s.k === "retinoide") && r.retinoide_exp !== "tolera"){
      fuera.push({k: "salicilico", que: "Loción de salicílico", por: "Mientras empiezas el retinoide, el salicílico va solo en el limpiador."}); continue; }
    if(d.k === "aha" || d.k === "pha"){
      const nom = d.k === "pha" ? "Exfoliante suave (PHA)" : "Exfoliante con ácido";
      if(serums.some(s => s.k === "retinoide") && r.retinoide_exp !== "tolera"){ fuera.push({k: d.k, que: nom, por: "El ácido entra cuando ya toleres el retinoide. Empezar los dos a la vez irrita."}); continue; }
      if(serums.some(s => s.k === "salicilico")){ fuera.push({k: d.k, que: nom, por: "Ya llevas salicílico sin aclarado; dos exfoliantes son demasiados."}); continue; }
    }
    // dos activos fuertes no se empiezan a la vez: si ya va un ácido o un salicílico sin aclarado, el retinoide nuevo espera
    if(d.k === "retinoide" && r.retinoide_exp !== "tolera" && serums.some(s => ["aha", "pha", "salicilico"].includes(s.k))){
      fuera.push({k: "retinoide", que: "Retinoide", por: serums.some(s => s.k === "salicilico") ? "Entra cuando lleves unas semanas con el salicílico y lo toleres. Empezar los dos a la vez irrita." : "Entra cuando ya toleres el exfoliante. Empezar los dos a la vez irrita."}); continue; }
    // el segundo sérum va al turno contrario
    if(serums.length >= 1 && d.flexible){ const am = serums.filter(s => s.turno === "AM").length, pm = serums.length - am; d.turno = am > pm ? "PM" : am < pm ? "AM" : d.k === "despigmentante" ? "PM" : (serums[serums.length - 1].turno === "AM" ? "PM" : "AM");
      // misma noche que el retinoide: despigmentante suave, no azelaico (el azelaico iría de mañana)
      if(d.turno === "PM" && serums.some(s => s.k === "retinoide")) d.activos = d.activos.filter(a => a !== "azelaico"); }
    if(serums.length >= 1 && !d.flexible && serums.some(s => s.turno === d.turno) && !(["aha", "pha"].includes(d.k) && serums.some(s => s.k === "retinoide")) && !(d.k === "retinoide" && serums.some(s => ["aha", "pha"].includes(s.k)))){
      // mismo turno y no se puede mover: solo si el que estaba es flexible
      const otro = serums.find(s => s.turno === d.turno && s.flexible);
      // la vitamina C comparte la mañana con un tratamiento suave antes que mandarlo a la noche del retinoide
      if(otro && d.k === "vitc" && serums.some(s => s.k === "retinoide")){ /* los dos de mañana */ }
      else if(otro) otro.turno = d.turno === "AM" ? "PM" : "AM";
      else { fuera.push({k: x.k, que: nombreDeseo(x.k), por: "Ocuparía el mismo turno que otro activo fuerte."}); continue; }
    }
    if(!cabe(d, serums)){ fuera.push({k: x.k, que: nombreDeseo(x.k), por: "Un solo activo fuerte por turno."}); continue; }
    serums.push(d);
  }
  serums.forEach((s, i) => huecos.push({slot: "serum" + (i + 1), etiqueta: s.turno === "PM" ? "Sérum de noche" : "Sérum de mañana", turno: s.turno, deseo: s}));
  huecos.push({slot: "H", etiqueta: "Hidratante", turno: "AMPM"});
  let contornoOjeras = false;
  if(P.includes("P15") && N < 5 && !suave && !c.menor18){
    if(serums.length < maxSerums) contornoOjeras = true;
    else fuera.push({que: "Contorno de ojos", por: `Con ${N0} productos no cabe: va antes el tratamiento de lo demás. Entraría con más pasos.`});
  }
  if(contornoOjeras) huecos.push({slot: "contorno", etiqueta: "Contorno de ojos", turno: "AMPM"});
  if(P.includes("P15") && suave) fuera.push({que: "Contorno de ojos", por: "Queda para más adelante: primero la consulta y que la piel esté tranquila."});
  if(P.includes("P09") && !suave) huecos.push({slot: "posafeitado", etiqueta: "Después del afeitado", turno: "AM"});
  // el contorno solo entra si lo que se quiere mejorar está en los ojos (ojeras, arrugas, firmeza)
  if(N >= 5 && ojos && !suave && !c.menor18) huecos.push({slot: "contorno", etiqueta: "Contorno de ojos", turno: "AMPM"});
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
    if(c.reactiva || c.reactiva_a_veces && false){ nochesRet = ["L", "J"]; escalado = "Piel sensible: 1-2 noches por semana, en sándwich (hidratante, retinoide, hidratante), durante 8 semanas. Techo: 3 noches."; }
    else if(acne){ nochesRet = ["L", "X", "V", "D"]; escalado = "Con granos, noches alternas desde el principio y, si lo toleras, cada noche. Espaciarlo le quita eficacia."; }
    // Acné del adulto (P03): la piel adulta se irrita antes (Dréno 2013, doi:10.1111/jdv.12061; Bagatin 2021, doi:10.1080/17512433.2021.1917376). Empieza más despacio que P01/P02 y llega a alternas, como dice el catálogo v2.
    else if(ret.por === "P03"){ nochesRet = ["L", "J"]; escalado = "Semanas 1-4: 2 noches no seguidas, entre dos capas de hidratante. Después, noches alternas si no irrita. Si la piel tira o escuece, vuelve a 2 noches."; }
    else if(r.retinoide_exp === "nunca" || !r.retinoide_exp){ nochesRet = ["L", "J"]; escalado = "Semanas 1-4: 2 noches no seguidas. Semanas 5-12: 3 noches. Desde la 13: 3 noches, que es el mantenimiento. Si lo toleras y quieres más, noches alternas."; }
    else { nochesRet = ["L", "X", "V"]; escalado = r.retinoide_exp === "reciente" ? "Ya lo usas desde hace poco: 3 noches por semana hasta la semana 12." : "Ya lo toleras: 3 noches por semana. Si quieres más, noches alternas."; }
    if(c.fototipo_oscuro && !acne && nochesRet.length > 2) nochesRet = ["L", "J"];
    if(c.mayor50 && nochesRet.length > 3) nochesRet = ["L", "X", "V"];
  }
  let nochesAha = [];
  if(aha){ nochesAha = aha.k === "glicolico_afeitado" ? (ret ? ["M", "S"] : ["M", "J", "S"]) : ["D"].filter(x => !nochesRet.includes(x)); if(aha.k !== "glicolico_afeitado" && !nochesAha.length) nochesAha = ["S"]; if(c.fototipo_oscuro) nochesAha = nochesAha.slice(0, 1); }
  const semana = DIAS.map(dia => {
    const paso = ["Limpiador"];
    for(const s of serums.filter(s => s.turno === "PM")){
      if((s.k === "retinoide") && !nochesRet.includes(dia)) continue;
      if((s.k === "aha" || s.k === "pha" || s.k === "glicolico_afeitado") && !nochesAha.includes(dia)) continue;
      paso.push(etiquetaDeseo(s.k));
    }
    paso.push(ret && nochesRet.includes(dia) && c.reactiva ? "Hidratante (antes y después)" : "Hidratante");
    return {dia, noche: paso};
  });
  const vistos = new Set(), fuera1 = fuera.filter(x => !vistos.has(x.que) && vistos.add(x.que));
  return {orden, N, N0, huecos, serums, semana, escalado, fuera: fuera1, notas, nochesRet, nochesAha, lista};
}
const NOMBRE_DESEO = {retinoide: "Retinoide", bakuchiol: "Bakuchiol", aha: "Exfoliante con ácido", salicilico: "Loción de salicílico", antiacne: "Azelaico o niacinamida",
  despigmentante: "Despigmentante", pha: "Exfoliante suave (PHA)", barrera: "Niacinamida", vitc: "Vitamina C", calma: "Niacinamida o azelaico", sebo: "Niacinamida", humectante: "Sérum hidratante", glicolico_afeitado: "Loción con glicólico", azelaico_noche: "Ácido azelaico"};
const nombreDeseo = k => NOMBRE_DESEO[k] || k;
const etiquetaDeseo = k => ({retinoide: "Retinoide", pha: "PHA (exfoliante suave)", barrera: "Niacinamida", aha: "Ácido exfoliante", glicolico_afeitado: "Glicólico", despigmentante: "Despigmentante", azelaico_noche: "Azelaico", antiacne: "Azelaico o niacinamida", calma: "Niacinamida o azelaico", sebo: "Niacinamida", bakuchiol: "Bakuchiol", humectante: "Sérum hidratante"}[k] || nombreDeseo(k));

/* ------------------------------------------------------------------ 5 · Productos */
// Marcas que Hugo no recomienda (copiado de lib/motor.js de su web)
const MARCAS_EXCLUIDAS = ["Labelist","LÆRA","Laera","Nivea","Dove","Deliplus","Mixa","Diadermine","Babaria","Byphasse","Ziaja","7 Days"];
const normMarca = s => n(s).replace(/[^a-z0-9]/g, "");
const EXCL_MARCA = new Set([...MARCAS_EXCLUIDAS].map(normMarca));
const PROHIBIDOS_UE = ["zinc pyrithione", "hydroquinone", "4-methylbenzylidene camphor", "butylphenyl methylpropional"];
const CUERPO = /corporal|body|cuerpo|manos|hand |pies|champu|shampoo|capilar|cabello|labios|labial/;
const NO_HIDRATANTE = /\bserum\b|\bsarum\b|tonico|toner|essence|esencia|ampoule|ampolla|callosidades|mascarilla|\bmask\b/;
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
/** ¿Hay en el catálogo un sérum de bakuchiol que se pueda recomendar? Si no, el retinoide queda fuera sin dejar un paso vacío. */
function hayBakuchiol(veto, c){
  return (LISTA || CATALOGO).some(p => p.v2 && p.v2.protagonista === "bakuchiol" && ["AM", "PM", "AM/PM"].includes(p.v2.hueco) && !vetado(p, veto) && dosisDe(p, "bakuchiol", R.bakuchiol, c));
}
function rangoPara(k, deseo){
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
  for(const k of Object.keys(veto)){
    if(k === "perfume"){ if(p.fragancia === true || lleva(p, "perfume")) return "lleva perfume"; continue; }
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
    if(h.slot === "L"){
      if(v2.hueco !== "L") continue;
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
      if(["glicolico", "lactico", "mandelico", "pha", "salicilico", "lha"].some(k => aDosis(p, k)) || v2.exfoliante) continue;   // la hidratante no exfolia
      if(NO_HIDRATANTE.test(n(p.producto)) || /corporal/.test(n(p.subcategoria)) || (p.textura === "aceite" && /\boil\b|aceite|huile/.test(n(p.producto)) && !/oil.free|oil control|anti.oil/.test(n(p.producto)))) continue;   // sérums, tónicos, aceites y productos de cuerpo no son la hidratante
      if(hayRetinoide && RETINOIDES.concat("bakuchiol").some(k => lleva(p, k))) continue;       // un solo retinoide en la rutina, y retinoide o bakuchiol, no los dos
      if(!hayRetinoide && RETINOIDES.concat("bakuchiol").some(k => aDosis(p, k)) && (c.menor25 || ctx.modo !== "normal" || hayAcido || !["P08", "P17", "P18", "P19"].some(x => P.includes(x)))) continue;   // una hidratante antiedad solo si hay un motivo antiedad
      base = 1;
      const e = estado(p);
      if(quiere("h_niacinamida") && e.niacinamida && e.niacinamida.estado !== "tras_linea" && !(e.niacinamida.pct > 5 && (c.reactiva || c.rojez || c.barrera))){ base += .35; cubre.push("F8"); }
      if(quiere("h_barrera") || c.reactiva || c.barrera){ if(["ceramidas", "pantenol", "bisabolol", "karite"].some(k => e[k]) && p.fragancia === false){ base += .4; cubre.push("F12"); } else if(ctx.modo !== "normal" || c.barrera) base -= .3; }
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
      if(quiere("solar_color_oblig")){ if(!color) continue; cubre.push("F3"); }
      else if(quiere("solar_color_pref") || c.fototipo_oscuro){ if(color){ base += .4; cubre.push("F3"); } }
      else if(color) base -= .15;
      if((quiere("solar_mineral") || tiene(r, "sienta", "filtros_quimicos")) ){ if(p.tipo_filtro === "mineral") base += .5; else if(tiene(r, "sienta", "filtros_quimicos")) continue; }
      if(quiere("solar_mate") || c.piel === "grasa"){ if(["fluido", "gel", "gel-crema"].includes(p.textura)) base += .25; }
      if(p.uva_pf_ok) base += .1;
      if(typeof p.cosmeticidad === "number") base += p.cosmeticidad / 50;
      cubre.push("F2");
    } else if(h.slot === "contorno"){
      if(v2.hueco !== "contorno de ojos") continue;
      if(P.includes("P15") && !(v2.preocupacion || p.preocupacion || []).includes("ojeras")) continue;   // con ojeras, un contorno formulado para ojeras
      if(hayRetinoide && RETINOIDES.concat("bakuchiol").some(k => lleva(p, k))) continue;
      base = 1; const pr = v2.preocupacion || p.preocupacion || [];
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
        : (CFG.ensayo_producto[p.id] && CFG.ensayo_producto[p.id].funciones.includes(h.deseo.k) && (ctx.modo !== "suave" || h.deseo.activos.includes(CFG.ensayo_producto[p.id].activo))) ? CFG.ensayo_producto[p.id].activo
        : h.deseo.activos.find(a => v2.protagonista === a);
      if(!k) continue;
      if((p.inci_completo || []).some(i => /\bmica\b|ci 7749|iron oxides/.test(n(i)))) continue;   // gotas con color o iluminadoras: son maquillaje, no un sérum de tratamiento
      const ep0 = CFG.ensayo_producto[p.id];
      if(ep0 && !ep0.funciones.includes(h.deseo.k)) continue;                            // el ensayo vale para la función estudiada, no para otras
      const ep = ep0 && (!ep0.problemas || ep0.problemas.includes(h.deseo.por)) ? ep0 : null;
      if(hayRetinoide && h.deseo.k !== "retinoide" && RETINOIDES.some(x => lleva(p, x))) continue;   // un solo retinoide en la rutina, también entre sérums
      if(v2.exfoliante && !["aha", "pha", "salicilico", "glicolico_afeitado"].includes(h.deseo.k)) continue;   // un exfoliante no vale como sérum de otra función
      if(k === "thiamidol"){
        if(h.deseo.por === "P12" || !["P10", "P13"].some(x => P.includes(x))) continue;
        if(/dermopure/.test(n(p.producto)) && !(c.piel === "grasa" || c.piel === "mixta")) continue;
      }
      if(k === "niacinamida" && h.deseo.k === "despigmentante" && c.fototipo_oscuro) base -= .2;
      if(k === "azelaico" && c.fototipo_oscuro) base += .3;
      dosis = dosisDe(p, k, rangoPara(k, h.deseo), c, ep);
      if(!dosis) continue;
      if(k === "retinol" && estado(p).retinol.pct > CFG.retinol_max) continue;
      activo = k; base = 1 + dosis.ok + (ep ? (ep.control === false ? .1 : .2) : dosis.tipo === "estudiada" ? .2 : 0); cubre.push(h.deseo.f);
      // una regla de la foto que «evita» este activo (avoid) pesa de verdad cuando es el protagonista del sérum: entra solo si no hay otra opción
      if(((r.bonus_activos || {})[k] || 0) < 0) base -= 1;
      if(ep) pegas.push("la eficacia está estudiada en el producto acabado");
      if(h.deseo.turno === "AM" && RETINOIDES.some(x => lleva(p, x))) continue;        // retinoides, solo de noche
      // un solo activo fuerte por producto y por turno: el sérum no trae otro ácido o retinoide a dosis
      const otros = RETINOIDES.concat(ACIDOS).filter(x => x !== k && aDosis(p, x) && !(RETINOIDES.includes(k) && RETINOIDES.includes(x)));
      // un producto con ensayo propio se juzga como fórmula entera (su LHA y salicílico a dosis baja van incluidos en lo estudiado); en rutina suave o piel reactiva sigue sin entrar
      if(otros.length && (ctx.modo === "suave" || c.reactiva || !ep && (c.reactiva_a_veces || c.fototipo_oscuro || hayRetinoide && !RETINOIDES.includes(k)))) continue;
      if(otros.length && hayRetinoide && h.deseo.k === "despigmentante") continue;   // un despigmentante que además exfolia (glicólico, mandélico, PHA) no se suma a la rutina del retinoide, aunque tenga ensayo propio
      if(otros.length && !ep) base -= .25;
      // secundarios que suman
      const e = estado(p);
      if(k === "vitc_pura" && (e.vitamina_e || e.ferulico)){ base += .2; pegas.push("lleva además vitamina E o ferúlico, que refuerzan a la vitamina C"); }
      if(RETINOIDES.includes(k) && (e.ceramidas || e.pantenol)){ base += .15; pegas.push("lleva además ceramidas o pantenol, que ayudan a tolerarlo"); }
      if(k !== "niacinamida" && e.niacinamida && e.niacinamida.estado !== "tras_linea" && ["P06", "P07", "P10", "P13", "P21"].some(x => P.includes(x))){ base += .2; pegas.push("lleva además niacinamida, que también te ayuda"); }
      if(c.reactiva && k === "retinol") base -= .2;
      // quien nunca ha usado un retinoide empieza por la dosis baja: retinal hasta 0,05 % o retinol por debajo de 0,3 %
      if(h.deseo.k === "retinoide" && (!r.retinoide_exp || r.retinoide_exp === "nunca")){ const pc = (e[k] || {}).pct; if((k === "retinal" && pc > 0.05) || (k === "retinol" && pc >= 0.3)) base -= .3; }                                      // en piel reactiva, mejor retinal o ésteres
    } else continue;

    const v = vetado(p, veto, h.slot); if(v) continue;
    // tipo de piel: un producto pensado para un tipo no sale en el contrario
    if(["L", "H", "H2", "S"].includes(h.slot)){ if(!PIEL_OK[c.piel].includes(v2.piel)) continue; if(v2.piel !== "todas") base += .15; }
    else if((c.piel === "seca" && v2.piel === "grasa o mixta") || (c.piel === "grasa" && v2.piel === "seca")) continue;
    if(p.pvp_eur == null || p.pvp_eur > 400) continue;   // sin precio, o con un precio que solo puede ser un error de ficha
    base += p._preferencia || 0;   // SkinRead: lo que la farmacia tiene en stock va antes que lo que tendría que pedir
    for(const [k, w] of Object.entries(r.bonus_activos || {})) if(lleva(p, k)) base += w;   // SkinRead: puntos de las reglas de la foto (reglas-foto.json)
    // lo que resta sin vetar
    if(c.reactiva_a_veces && (p.fragancia === true || lleva(p, "perfume"))) base -= .3;
    if((c.piel === "seca" || c.sequedad_activa) && (p.alcohol_denat === true)) base -= .25;
    if(p.fragancia === false) base += .05;
    base += (p.transparencia || 0) / 100 + (p.evidencia_producto || 0) / 100;
    base -= Math.min(p.pvp_eur, 150) * CFG.peso_precio;                                  // a igualdad de lo demás, el que cuesta menos
    // preferencias: solo desempatan
    const tx = {ligera: ["gel", "gel-crema", "fluido", "locion"], media: ["gel-crema", "locion", "crema", "fluido"], rica: ["crema", "balsamo"]}[r.textura];
    const pref = tx && ["H", "S"].includes(h.slot) && tx.includes(p.textura) ? .08 : 0;
    out.push({p, score: base + pref, cubre, dosis, activo, extra: pegas});
  }
  // sin dosis declarada (activo de dosis media o muy baja): solo alternativa
  const fuertes = out.filter(x => !x.dosis || x.dosis.tipo !== "no_declarada"), flojos = out.filter(x => x.dosis && x.dosis.tipo === "no_declarada");
  const ord = a => a.sort((x, y) => y.score - x.score || x.p.pvp_eur - y.p.pvp_eur || x.p.id.localeCompare(y.p.id));
  return {principales: ord(fuertes), sin_dosis: ord(flojos)};
}

const TOPE = {bajo: 30, medio: 60, alto: Infinity};
function elegir(pa, ctx){
  const tope = TOPE[ctx.r.presupuesto] || 60;
  const cand = {}, sel = {}, usados = new Set(), sinProducto = [];
  for(const h of pa.huecos){ cand[h.slot] = candidatos(h, ctx); }
  // variedad: entre candidatos casi empatados se reparte de forma estable según el perfil
  const semilla = hash(JSON.stringify(ctx.r));
  for(const h of pa.huecos){
    let l = cand[h.slot].principales.filter(x => !usados.has(x.p.id));
    // un sérum no repite el activo de otro sérum, ni uno que otro sérum ya lleva a dosis (p. ej. niacinamida dentro del glicólico)
    if(h.deseo && l.length){ const prev = Object.entries(sel).filter(([s]) => /^serum/.test(s)).map(([, e]) => e); const ya = prev.map(e => e.activo);
      const otros = l.filter(x => !ya.includes(x.activo) && !(x.activo && prev.some(e => aDosis(e.p, x.activo)))); if(otros.length) l = otros; }
    // la hidratante no repite a dosis el activo que ya lleva un sérum (tres productos con niacinamida no suman)
    if(["H", "H2"].includes(h.slot) && l.length){ const act = Object.entries(sel).filter(([s]) => /^serum/.test(s)).map(([, e]) => e.activo).filter(Boolean);
      const otros = l.filter(x => !act.some(a => aDosis(x.p, a))); if(otros.length) l = otros; }
    if(!l.length){ sinProducto.push(h); continue; }
    const mejores = l.filter(x => x.score >= l[0].score - .12).slice(0, 6);
    const e = mejores[(semilla + hash(h.slot)) % mejores.length];
    sel[h.slot] = e; usados.add(e.p.id);
  }
  // presupuesto: no se supera (el solar va aparte)
  const cuenta = () => Object.entries(sel).filter(([s]) => s !== "S");
  const total = () => cuenta().reduce((a, [, e]) => a + e.p.pvp_eur, 0);
  const quitados = [];
  let vueltas = 0;
  while(total() > tope && vueltas++ < 60){
    let mejor = null;
    for(const [slot, e] of cuenta()){
      for(const alt of cand[slot].principales){
        if(usados.has(alt.p.id) || alt.p.pvp_eur >= e.p.pvp_eur) continue;
        if(/^serum/.test(slot) && alt.activo && Object.entries(sel).some(([s2, e2]) => s2 !== slot && /^serum/.test(s2) && e2.activo === alt.activo)) continue;   // sin dos sérums con el mismo activo
        const ahorro = e.p.pvp_eur - alt.p.pvp_eur, perdida = Math.max(e.score - alt.score, .02);
        const ratio = ahorro / perdida;
        if(!mejor || ratio > mejor.ratio) mejor = {slot, alt, ratio};
      }
    }
    if(mejor){ usados.delete(sel[mejor.slot].p.id); sel[mejor.slot] = mejor.alt; usados.add(mejor.alt.p.id); continue; }
    // no queda nada más barato: se quita el último paso opcional
    const opc = ["humectante", "H2", "contorno", "serum3", "serum2", "posafeitado"].find(s => sel[s]);
    if(!opc) break;
    quitados.push(pa.huecos.find(h => h.slot === opc)); usados.delete(sel[opc].p.id); delete sel[opc];
  }
  return {sel, cand, sinProducto, quitados, total: Math.round(total() * 100) / 100, tope, dentro: total() <= tope};
}
function hash(s){ let h = 7; for(let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }

/* ------------------------------------------------------------------ 6 · Resultado */
function calcular(r){
  const {problemas: P, derivacion} = detectar(r);
  const niveles = derivacion.map(d => d.nivel);
  const {c, veto} = condiciones(r, P);
  // Siempre hay rutina con activos. Si hay algo que consultar, la piel está irritada o hay un tratamiento con receta, la rutina es suave.
  const modo = (niveles.includes("sin_rutina") || niveles.includes("minima") || derivacion.some(x => x.suave) || P.includes("P24") || c.receta) ? "suave" : "normal";
  if(modo === "suave"){
    const m = c.receta ? "Mientras sigas un tratamiento con receta, no pongo activos fuertes encima." : "Mientras lo consultas o la piel se recupera, sin activos fuertes.";
    for(const k of RETINOIDES.concat(["glicolico", "lactico", "mandelico", "salicilico", "lha", "vitc_pura", "bakuchiol"])) veto[k] = veto[k] || m;
  }
  if(modo === "suave" || c.rojez || c.reactiva || c.barrera){ veto.perfume = veto.perfume || "Rutina sin perfume."; if(modo === "suave") veto.alcohol = veto.alcohol || "Rutina sin alcohol."; }
  c.suave = modo === "suave";
  const pa = pauta(r, P, c, veto, modo);
  const perfil = {
    problemas: pa.orden.map(id => ({id, nombre: PROBLEMAS[id].t, corto: CORTO[id], alcance: PROBLEMAS[id].alcance, plazo: PLAZOS[id] || ""})),
    primero: pa.orden.length > 1 ? PROBLEMAS[pa.orden[0]].t : null,
    condiciones: Object.entries(c).filter(([k, v]) => v === true && k !== "suave").map(([k]) => k), piel: c.piel
  };
  const no_recomiendo = agrupaVetos(veto);
  const ctx = {c, veto, P, r, serums: pa.serums, modo};
  const el = elegir(pa, ctx);
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
    const alts = el.cand[h.slot].principales.filter(a => a.p.id !== e.p.id && !Object.values(el.sel).some(s => s.p.id === a.p.id)).slice(0, 2);
    productos.push(Object.assign(ficha(e, h), {slot: h.slot, paso: h.etiqueta, turno: h.turno, aparte: !!h.aparte, para: paraQue(h, e, pa),
      alternativas: alts.map(a => ficha(a, h)).concat(el.cand[h.slot].sin_dosis.slice(0, 1).map(a => Object.assign(ficha(a, h), {sin_dosis: true})))}));
  }
  // frecuencia: el sérum de retinoide o de ácido dice cuántas noches va, igual que la semana
  const FREC = {L: "lunes", M: "martes", X: "miércoles", J: "jueves", V: "viernes", S: "sábado", D: "domingo"};
  pa.serums.forEach((sr, i) => { const pr = productos.find(x => x.slot === "serum" + (i + 1)); if(!pr) return;
    const noches = sr.k === "retinoide" ? pa.nochesRet : ["aha", "pha", "glicolico_afeitado"].includes(sr.k) ? pa.nochesAha : null;
    if(!noches || !noches.length || noches.length >= 7) return;
    pr.noches = noches.slice();
    pr.frecuencia = noches.length === 1 ? `Una noche a la semana (${FREC[noches[0]]})` : `${noches.length} noches a la semana (${noches.map(d => FREC[d]).join(", ")})`; });
  // en la semana, el sérum de cada noche se nombra por el activo que lleva el producto elegido
  pa.serums.forEach((sr, i) => { const pr = productos.find(x => x.slot === "serum" + (i + 1)); if(!pr || !pr.activo || !sr.flexible) return;
    const de = etiquetaDeseo(sr.k), a = pr.activo.charAt(0).toUpperCase() + pr.activo.slice(1);
    for(const dia of pa.semana) dia.noche = dia.noche.map(t => t === de ? a : t); });
  const manana = productos.filter(x => ["AM", "AMPM"].includes(x.turno)).map(x => x.paso), noche = productos.filter(x => ["PM", "AMPM"].includes(x.turno) && x.slot !== "contorno" || x.slot === "contorno").filter(x => x.turno !== "AM").map(x => x.paso);
  const avisos = pa.notas.slice();
  for(const t of r.avisos_extra || []) if(t && !avisos.includes(t)) avisos.push(t);   // SkinRead: avisos de las reglas de la foto
  if(pa.serums.some(s => s.k === "pha")) avisos.push("El PHA es un exfoliante suave: una noche a la semana para empezar. Si escuece o enrojece, déjalo.");
  if(pa.escalado) avisos.push(pa.escalado + " Cantidad: un guisante para toda la cara. Si irrita, baja un escalón y refuerza la hidratante.");
  if(P.includes("P09")) avisos.push("Lo que más cuenta aquí es la técnica: a favor del pelo, sin tensar la piel, sin apurar, hoja afilada, agua templada y espuma, dos pasadas como mucho.");
  if(P.includes("P13")) avisos.push("El solar con color no es estético: frena la luz visible, que también oscurece estas manchas. Reaplícalo cada 2 horas al aire libre.");
  if(P.includes("P15")) avisos.push("Para las ojeras no hay un activo con respaldo sólido. Solar y no frotar es lo que más ayuda.");
  if(CFG.verano === "aviso" && pa.serums.some(s => s.k === "retinoide")) avisos.push("El retinoide va siempre de noche, con solar a la mañana siguiente.");
  if(CFG.peroxido_benzoilo === "mencionar" && ["P01", "P02"].some(x => P.includes(x)) && modo === "normal") avisos.push("Si a las 6-8 semanas la rutina no basta, en la farmacia hay peróxido de benzoílo al 2,5 % sin receta: de mañana, con el retinoide de noche. Es un medicamento, no forma parte de esta rutina.");
  if(!el.dentro) avisos.push(`Con los productos que cumplen lo que necesitas, la rutina sale por ${fmt(el.total)} €, por encima de tu tope. No he encontrado una combinación más barata que siga cumpliendo.`);
  const op = opciones(P, pa, el, productos, veto, c, r);
  // Orden de aplicación por la mañana: la vitamina C va antes que el otro tratamiento. No cambia la prioridad.
  { const iC = productos.findIndex(x => /^serum/.test(x.slot) && x.activo_clave && x.activo_clave.startsWith("vitc")), iO = productos.findIndex(x => /^serum/.test(x.slot) && x.turno === "AM");
    if(iC > iO && iO >= 0){ const [v] = productos.splice(iC, 1); productos.splice(iO, 0, v); } }
  if(pa.serums.length > 1) avisos.unshift("No empieces todo a la vez. Primero la base y el activo principal; cada activo nuevo, con dos semanas de separación como mínimo. Si algo irrita, sabrás cuál ha sido.");
  if(modo === "suave") avisos.unshift(P.includes("P26") ? "Rutina suave mientras lo consultas. Con granitos alrededor de la boca, a menudo lo que más ayuda es usar pocas cosas: si algún producto lo empeora, retíralo."
    : c.receta ? "Rutina suave para acompañar tu tratamiento: no sustituye lo que te han recetado."
    : P.includes("P24") ? "Rutina suave hasta que la piel se recupere: dos semanas como mínimo. Después, un producto nuevo cada 1-2 semanas, empezando por el más suave."
    : "Rutina suave mientras lo consultas: pocos productos, sin perfume y con un solo activo nuevo cada vez. Si algo escuece, déjalo.");
  return {modo, perfil, derivacion, opciones: op.opciones, prioridad: op.prioridad, rutina: {manana, noche}, semana: pa.semana, escalado: pa.escalado || null, noches: {retinoide: pa.nochesRet, acido: pa.nochesAha}, productos, no_recomiendo, queda_fuera, avisos,
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
  return {id: e.p.id, marca: e.p.marca, producto: e.p.producto, precio: e.p.pvp_eur, formato_ml: e.p.formato_ml, foto: e.p.foto || null, compra: e.p.compra || null, url: e.p.url_producto || null,
    activo: e.activo ? nombreEn(e.p, e.activo) : null, activo_clave: e.activo || null, dosis: e.dosis ? e.dosis.txt : null, dosis_tipo: e.dosis ? e.dosis.tipo : null, funciones: e.cubre, ademas: e.extra || [], score: Math.round(e.score * 100) / 100};
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
module.exports = {calcular, calcularCon, provisional, detectar, condiciones, pauta, PROBLEMAS, CORTO, candidatos};
