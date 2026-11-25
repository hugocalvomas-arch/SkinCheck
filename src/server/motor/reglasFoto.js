/* eslint-disable @typescript-eslint/no-require-imports */
/* SkinRead · Reglas de la foto (base de conocimiento, anexo JSON en reglas-foto.json).
   Convierte las 11 notas de Perfect Corp (0-100, más alto = mejor) y las respuestas de seguridad
   en lo que entiende el motor de Hugo: problemas, vetos, puntos por activo, avisos y prioridad.
   Es determinista: se evalúan todas las reglas y se suman sus efectos. Las reglas se editan en el JSON. */
"use strict";
const BASE = require("./reglas-foto.json");

const ASPECTOS = ["arrugas", "manchas", "textura", "rojez", "brillo", "firmeza", "hidratacion", "poros", "ojeras", "acne", "tono"];
const MAYOR_25 = ["25-39", "40-49", "50+"];

// Banda de duda (Hugo, 24/11): a ±3 puntos de un umbral se elige la opción prudente. Una regla prudente (veta, deriva, protege la barrera,
// pide solar con color o mantenimiento) se aplica 3 puntos antes; una que permite algo (un tope que deja entrar el retinal) se aplica 3 puntos después.
const BANDA = 3;
const PRUDENTE = new Set(["veto", "refer", "moisturizer", "tinted_spf", "maintenance"]), PROBLEMA_PRUDENTE = new Set(["P21", "P23", "P24", "P28", "P29"]);
function sentido(x){
  const ef = x.effect || [];
  if(ef.some(e => e.action === "limit")) return -1;
  if(ef.some(e => PRUDENTE.has(e.action) || (e.action === "add_problem" && PROBLEMA_PRUDENTE.has(e.problem)))) return 1;
  return 0;
}
function cumpleNota(c, notas, sh = 0){
  const v = notas[c.aspect];
  if(typeof v !== "number") return false;
  const b = sh * BANDA;
  if(c.operator === "lte") return v <= c.max + b;
  if(c.operator === "gte") return v >= c.min - b;
  if(c.operator === "between") return v >= c.min - b && v <= c.max + b;
  return false;
}
function cumpleCliente(cl, r){
  // la edad vale en los dos vocabularios: el tramo del motor (25-39…) y el que pregunta el iPad (25-34…)
  return Object.entries(cl || {}).every(([k, vals]) => vals.includes(r[k]) || (k === "edad" && r.edad_tramo != null && vals.includes(r.edad_tramo)));
}
/** Embarazo y lactancia por separado: embarazo = "si" en los dos casos (vetos prudentes), lactancia = "si" solo al dar el pecho. */
function normalizar(r){
  const lact = r.embarazo === "lactancia" || r.lactancia === "si";
  return {...r, embarazo: lact || r.embarazo === "si" ? "si" : "no", lactancia: lact ? "si" : "no"};
}
function cuenta(cc, notas, sh = 0){
  const asp = cc.aspects || ASPECTOS;
  // prudente: «ninguna por debajo de» cuenta con el umbral 3 puntos más bajo; «al menos N por debajo de», 3 puntos más alto
  const max = cc.max + sh * BANDA * (cc.at_most != null && cc.at_least == null ? -1 : 1);
  const k = asp.filter(a => typeof notas[a] === "number" && notas[a] <= max).length;
  if(cc.at_least != null && k < cc.at_least) return false;
  if(cc.at_most != null && k > cc.at_most) return false;
  return true;
}
function cumpleBase(cond, notas, r, sh = 0){
  if(!cond) return true;
  if(cond.scores && !cond.scores.every(c => cumpleNota(c, notas, sh))) return false;
  if(cond.client && !cumpleCliente(cond.client, r)) return false;
  if(cond.client_not && Object.entries(cond.client_not).some(([k, vals]) => vals.includes(r[k]))) return false;
  if(cond.count_lte && !cuenta(cond.count_lte, notas, sh)) return false;
  if(cond.any && !cond.any.some(sub => cumpleBase(sub, notas, r, sh))) return false;
  return true;
}

/** Qué problema añadir para un aspecto en Leve cuando faltan objetivos (la regla de la banda Leve: solo si sobra hueco). */
function problemaLeve(a, notas, r){
  const joven = !MAYOR_25.includes(r.edad);
  switch(a){
    case "acne": return "P01";
    case "poros": return (notas.brillo ?? 100) >= 50 && ["40-49", "50+"].includes(r.edad) ? "P08" : "P07";
    case "brillo": return "P06";
    case "manchas": return (notas.acne ?? 100) <= 64 && ["14-17", "18-24", "25-39"].includes(r.edad) ? "P10" : "P12";
    case "tono": return "P14";
    case "arrugas": return joven ? "P29" : "P17";
    case "firmeza": return joven ? null : "P19";
    case "textura": return "P20";
    case "hidratacion": return "P29";
    default: return null;   // rojez leve y ojeras leves no gastan un paso de la rutina
  }
}

/**
 * @param {Record<string, number>} notas nota de Perfect Corp por aspecto (0-100, más alto = mejor)
 * @param {{edad?: string, sexo?: string, embarazo?: string, receta?: string, reactiva?: string}} r respuestas
 * @param {{reglas?: any[], minimoObjetivos?: number}} [op]
 */
function aplicarReglasFoto(notas, r0, op = {}){
  const r = normalizar(r0 || {});
  const reglas = op.reglas || BASE.rules;
  const alcance = BASE.aspect_reach;
  const minimo = op.minimoObjetivos ?? 2;
  const banda = op.banda !== false;
  const base = new Map(reglas.map(x => [x.id, cumpleBase(x.conditions, notas, r, banda ? sentido(x) : 0)]));
  const activa = x => {
    if(!base.get(x.id)) return false;
    const no = x.conditions && x.conditions.not;
    if(!no) return true;
    if(no.rule && base.get(no.rule)) return false;
    if(no.any_rule && no.any_rule.some(id => base.get(id))) return false;
    return true;
  };

  const out = {problemas: [], quitar: [], veto: {}, bonus: {}, derivacion: [], avisos: [], piel: null, factor: {}, aspectoDe: {}, aplicadas: [], limites: {}, mantenimiento: false, solar_color: false, hidratante: []};
  for(const x of reglas){
    if(!activa(x)) continue;
    const asp = x.conditions && x.conditions.scores && x.conditions.scores[0] && x.conditions.scores[0].aspect;
    out.aplicadas.push({id: x.id, nombre: x.name, motivo: x.reason_for_client, evidencia: x.evidence_level, validar: !!x.requires_expert_validation});
    for(const e of x.effect){
      switch(e.action){
        case "add_problem": if(!out.problemas.includes(e.problem)){ out.problemas.push(e.problem); if(asp) out.aspectoDe[e.problem] = asp; } break;
        case "remove_problem": out.quitar.push(e.problem); break;
        case "veto": if(!out.veto[e.active]) out.veto[e.active] = e.message || x.reason_for_client; break;
        case "prefer": case "avoid": out.bonus[e.active] = Math.round(((out.bonus[e.active] || 0) + (e.weight || 0)) * 100) / 100; break;
        case "set_skin": out.piel = e.value; break;   // la última regla que fija la piel manda (el JSON pone las más específicas al final)
        case "refer": if(!out.derivacion.some(d => d.texto === e.text)) out.derivacion.push({nivel: "consulta", texto: e.text}); break;
        case "notice": if(!out.avisos.includes(e.text)) out.avisos.push(e.text); break;
        case "priority": out.factor[e.aspect] = (out.factor[e.aspect] || 1) * (e.factor || 1); break;
        // tope que impone el código (Hugo, P-03): solo esa forma, % declarado máximo, noches, sándwich e hidratante reparadora
        case "maintenance": if(ASPECTOS.every(a => typeof notas[a] !== "number" || notas[a] >= 85)) out.mantenimiento = true; break;   // Hugo, 25/11 (pregunta 8): mantenimiento puro solo con todo ≥85; entre 70 y 84, un activo suave a la nota más baja
        case "tinted_spf": out.solar_color = true; break;
        case "moisturizer": out.hidratante.push({one_of: e.one_of || null, texture: e.texture || null, fragrance_free: !!e.fragrance_free, regla: x.id}); break;
        case "limit": out.limites[e.slot] = {activo: e.active, max_pct: e.max_pct, noches: e.max_nights, sandwich: !!e.sandwich, hidratante: e.moisturizer || null, mensaje: e.message || x.reason_for_client, regla: x.id}; break;
      }
    }
  }
  out.problemas = out.problemas.filter(p => !out.quitar.includes(p));

  // Banda Leve: si hay menos objetivos que el mínimo, entran los aspectos Leve más bajos
  if(out.problemas.length < minimo && !out.mantenimiento){
    const leves = ASPECTOS.filter(a => typeof notas[a] === "number" && notas[a] >= 50 && notas[a] <= 74).sort((a, b) => notas[a] - notas[b]);
    for(const a of leves){
      if(out.problemas.length >= minimo) break;
      const p = problemaLeve(a, notas, r);
      if(!p || out.problemas.includes(p)) continue;
      out.problemas.push(p); out.aspectoDe[p] = a;
      out.aplicadas.push({id: "LEVE-" + a, nombre: "Aspecto leve como objetivo", motivo: "Es lo que más margen de mejora tiene, con activos suaves.", evidencia: "C", validar: true});
    }
  }

  // Prioridad = (100 - nota) × alcance cosmético × factores de las reglas
  const prioridad = {};
  for(const p of out.problemas){
    const a = out.aspectoDe[p];
    if(!a || typeof notas[a] !== "number") continue;
    prioridad[p] = Math.round((100 - notas[a]) * (alcance[a] ?? 0.7) * (out.factor[a] || 1) * 10) / 10;
  }
  return {
    problemas_extra: out.problemas,
    veto_extra: out.veto,
    bonus_activos: out.bonus,
    derivacion_extra: out.derivacion,
    avisos_extra: out.avisos,
    prioridad_foto: prioridad,
    limites: out.limites,
    mantenimiento: out.mantenimiento,
    solar_color: out.solar_color,
    hidratante_req: out.hidratante,
    notas_foto: notas,
    aspecto_problema: out.aspectoDe,
    piel: out.piel,
    reglas_aplicadas: out.aplicadas,
    version_reglas: BASE.version,
  };
}

/** Nota de Perfect Corp por aspecto a partir del resultado guardado (ui) o, si falta, de la intensidad (100 - nota). */
function notasDe(foto){
  const n = {};
  for(const a of ASPECTOS){
    if(foto && foto.ui && typeof foto.ui[a] === "number") n[a] = foto.ui[a];
    else if(foto && foto.puntuaciones && typeof foto.puntuaciones[a] === "number") n[a] = 100 - foto.puntuaciones[a];
  }
  return n;
}

/**
 * Pasa a las respuestas todo lo que deciden las reglas de la foto, tal y como lo lee el motor.
 * Es el único sitio donde se hace: la app, los scripts de casos y las pruebas lo llaman igual, así ninguna regla se queda fuera.
 * @returns el resultado de aplicarReglasFoto
 */
function aplicarAlMotor(r, notas, op = {}){
  const rf = aplicarReglasFoto(notas, r, op);
  r.problemas_extra = [...new Set([...(r.problemas_extra || []), ...rf.problemas_extra])];
  r.veto_extra = {...rf.veto_extra, ...(r.veto_extra || {})};
  r.derivacion_extra = [...(r.derivacion_extra || []), ...rf.derivacion_extra];
  Object.assign(r, {bonus_activos: rf.bonus_activos, avisos_extra: rf.avisos_extra, prioridad_foto: rf.prioridad_foto, limites: rf.limites, mantenimiento: rf.mantenimiento,
    solar_color: rf.solar_color, hidratante_req: rf.hidratante_req, notas_foto: rf.notas_foto, aspecto_problema: rf.aspecto_problema,
    reglas_foto: {version: rf.version_reglas, ids: rf.reglas_aplicadas.map(x => x.id)}});
  if(op.fijarPiel !== false && rf.piel) r.piel = rf.piel;
  return rf;
}

module.exports = {aplicarReglasFoto, aplicarAlMotor, notasDe, ASPECTOS, REGLAS: BASE};
