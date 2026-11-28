/* Catálogo del motor v2: el catálogo original + las correcciones revisadas + los contornos de ojos nuevos + los datos v2.
   lib/catalogo.json no se toca: el motor publicado sigue usándolo tal cual. */
"use strict";
const PRECIOS = require("./precios.json");
const HUECO_H = new Set(["la-roche-posay-effaclar-duo-m", "avene-cleanance-comedomed", "uriage-hyseac-3-regul-plus"]);   // hidratantes de tratamiento (Hugo, 25/11, pregunta 19: también Hyséac 3-Regul+; Keracnyl PP+ ya es hidratante)
const BASE = require("./catalogo.json"), CORR = require("./correcciones.json"), VERIF = require("./fichas-verificadas.json"), NUEVOS = require("./contornos.json"), FICHAS = require("./fichas.json");
const n = s => String(s || "").toLowerCase();
// restos de la web pegados al final del INCI al fichar (HTML, scripts, reseñas, instrucciones): se corta en el primero
const BASURA_INCI = /se destacan en negrita|^seguridad$|^sin (perfume|conservantes|jab[oó]n|parabenos|alcohol|fragancia)|^testado|^formulado para|^microbiol[oó]gicamente|^realizado en un laboratorio|\bISO \d{4}|^hipoalerg[eé]nico$|^consejos$|^principios activos$|^comentarios publicados|<|>|addEventListener|function\s*\(|window\.|document\.|customer reviews|add a review|review for|^tu rutina$|^paso$|reseñas|^\d+([.,]\d+)?$|[{};]|=>|https?:|^c[oó]mo (utilizar|usar|aplicar)|^modo de (uso|empleo)|^paso \d/i;
const TENSIOACTIVO = /laur[ey]th sulfate|lauryl sulfate|coco-?betaine|cocamidopropyl betaine|coco-glucoside|decyl glucoside|lauryl glucoside|cocoamphoacetate|isethionate/i;
const SIN_ANCHO = /[\u200b-\u200d\ufeff]/g;
function limpiaInci(a0){ if(!Array.isArray(a0)) return a0; const a = a0.map(x => typeof x === "string" ? x.replace(SIN_ANCHO, "").trim() : x); const i = a.findIndex(x => BASURA_INCI.test(String(x)) || String(x).length > 150); return i < 0 ? a : a.slice(0, i); }
/* Fichas verificadas (revisión producto a producto de Hugo, 24-25/11/2026; scripts/fichas/cargar.cjs).
   Van antes que correcciones.json: lo revisado a mano manda. Solo traen lo comprobado en la web de la marca o de una farmacia. */
function verificar(p){
  const f = VERIF[p.id]; if(!f) return p;
  const q = Object.assign({}, p, {verificada: true});
  if(f.inci_completo) { q.inci_completo = f.inci_completo; q.url_inci_fuente = f.inci_fuente || q.url_inci_fuente; q.inci_confianza = "alta"; }
  if(f.spf) q.spf = f.spf;
  if(f.pct_declarados){
    q.activos = (p.activos || []).map(a => Object.assign({}, a));
    const PAT = require("./activos.js").A;
    for(const d of f.pct_declarados){
      const pats = (PAT[d.activo] || [[]])[0];
      const a = q.activos.find(x => pats.some(t => n(x.inci).includes(t)));
      if(a) { a.pct_declarado = d.pct; a.confianza = "alta"; }
      else q.activos.push({inci: d.inci, pct_declarado: d.pct, pct_estimado: null, confianza: "alta", posicion_inci: null, rol: "primario"});
    }
  }
  if(f.estudios_publicados) q.estudios_publicados = f.estudios_publicados;
  if(f.no_farmacia) q.no_farmacia = true;
  if(f.duplicado || f.descatalogado) q.retirado = true;
  return q;
}
function aplicar(p0){
  const p = verificar(p0);
  const c = CORR[p.id]; let q = p;
  if(c){
    q = Object.assign({}, p);
    for(const k of ["inci_completo", "spf", "categoria", "producto", "pvp_eur", "formato_ml"]) if(c[k] != null) q[k] = c[k];
    if(c.activos_declarados){
      // lo que la marca declara manda sobre lo que había fichado
      const otros = (p.activos || []).filter(a => (q.inci_completo || []).some(i => n(i).includes(n(a.inci))) && !c.activos_declarados.some(d => n(d.inci) === n(a.inci)));
      q.activos = c.activos_declarados.map(d => ({inci: d.inci, pct_declarado: d.pct_declarado, pct_estimado: null, confianza: "alta", posicion_inci: null, rol: "primario"})).concat(otros);
    }
    // el INCI de la ficha verificada (web de la marca o farmacia, 24-25/11) manda sobre el de correcciones.json, que venía del raspado antiguo
    if(VERIF[p.id] && VERIF[p.id].inci_completo) q.inci_completo = VERIF[p.id].inci_completo;
    q.retirado = !!c.retirar || !!p.retirado; q.sin_verificar = !!c.excluir_hasta_verificar;
  }
  // Precios buscados el 04/10/2026. Si no se vende en España (no hay ninguna tienda con precio), no se recomienda.
  const pr = PRECIOS[p.id];
  if(pr){
    if(q === p) q = Object.assign({}, p);
    if(pr.pvp_eur != null){ q.pvp_eur = pr.pvp_eur; if(pr.formato_ml != null && q.formato_ml == null) q.formato_ml = pr.formato_ml; }
    else q.sin_precio_es = true;
  }
  let v2 = FICHAS[p.id] || null;
  // una «hidratante» que por el nombre es un limpiador (Lavant, Nettoyant, Cleanser…)
  // crema-gel de tratamiento: ocupa el hueco de la hidratante, no el del sérum (Hugo, 24/11)
  if(v2 && HUECO_H.has(p.id)) v2 = Object.assign({}, v2, {hueco: "H"});
  // también por la espuma en el nombre o por un tensioactivo de lavado entre los tres primeros del INCI (Effaclar Gel Moussant, Normaderm Phytosolution)
  if(v2 && v2.hueco === "H" && (/lavant|nettoyant|limpiador|limpiadora|cleanser|cleansing|face wash|moussant|foaming/i.test(q.producto) || (q.inci_completo || []).slice(0, 3).some(i => TENSIOACTIVO.test(String(i))))) v2 = Object.assign({}, v2, {hueco: "L"});
  const inci = limpiaInci(q.inci_completo);
  return Object.assign({}, q, {v2}, inci !== q.inci_completo ? {inci_completo: inci} : {});
}
/* Productos con ficha verificada que no estaban en el catálogo (scripts/fichas/nuevos.cjs, 27/11/2026): marcas nuevas y gamas que faltaban.
   Su clasificación v2 es una propuesta automática (confianza baja) hasta que Hugo la revise; si fichas.json trae una revisada, manda esa. */
const NUEVOS_F = require("./nuevos-fichas.json"), NUEVOS_B = require("./nuevos-base.json");
const conocidos = new Set(BASE.map(p => p.id).concat(NUEVOS.map(p => p.id)));
const TODOS = BASE.map(aplicar).concat(NUEVOS.map(p => Object.assign({}, p, {v2: FICHAS[p.id] || null}, {inci_completo: limpiaInci(p.inci_completo)})))
  .concat(NUEVOS_F.filter(p => !conocidos.has(p.id)).map(p => Object.assign({}, p, {v2: FICHAS[p.id] || (p.v2_propuesta && p.v2_propuesta.hueco !== "fuera" ? p.v2_propuesta : null)}, {inci_completo: limpiaInci(p.inci_completo)})))
  // y los de marcas de farmacia que solo estaban en la base de Hugo (scripts/fichas/base-hugo.cjs, 28/11): INCI de su base, sacado de la web (fiable, Hugo 28/11); clasificación propuesta
  .concat(NUEVOS_B.filter(p => !conocidos.has(p.id) && !NUEVOS_F.some(q => q.id === p.id)).map(p => Object.assign({}, p, {v2: FICHAS[p.id] || (p.v2_propuesta && p.v2_propuesta.hueco !== "fuera" ? p.v2_propuesta : null)}, {inci_completo: limpiaInci(p.inci_completo)})));
// Marcas que no se venden en farmacia (Hugo, 24/11): no se recomiendan. Cruce con el filtro Facial de Atida/Mifarma y el índice de Farmacia Jiménez.
// Se excluyen aquí y no se borran de la base, para poder deshacerlo.
/* Solo dermofarmacia (lista de Hugo, 24/11): el motor recomienda únicamente estas marcas. Las demás quedan en TODOS con fuera_farmacia. */
const sinTilde = s => n(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
const MARCAS_FARMACIA = new Set(["La Roche-Posay", "Vichy", "CeraVe", "SkinCeuticals", "Avène", "Eau Thermale Avène", "A-Derma", "Ducray", "Dexeryl", "Bioderma", "Esthederm", "Institut Esthederm", "Etat Pur", "Uriage", "Apivita", "Cantabria Labs", "Cantabria Labs (Endocare)", "Endocare", "Heliocare", "Neoretin", "Biretix", "Skin Resist", "ISDIN", "Sensilis", "Rilastil", "Cumlaude", "Cumlaude Lab", "MartiDerm", "Sesderma", "Babé", "Leti", "Repavar", "Primaderm (Singuladerm)", "Primaderm", "Singuladerm", "Segle Clinical", "Bella Aurora", "Mi Rebotica", "Alma Secret", "Camaleon", "Skinfy", "NeoStrata", "Be+", "Farline", "Interapothek", "Acofarderm", "GH Gema Herrerías", "Arturo Alba", "5punto5", "Two Poles", "Bluevert", "Bimaio", "Skintsugi", "Caudalie", "Nuxe", "Filorga", "Lierac", "SVR", "Embryolisse", "Darphin", "Galénic", "Galenic", "Garancia", "Patyka", "Topicrem", "Jonzac", "Melvita", "Jowaé", "Eucerin", "Sebamed", "Weleda", "Bepanthol", "Medipharma", "Louis Widmer", "Dr. Hauschka", "Ceramol", "BioNike", "Korff", "Somatoline", "Cetaphil", "Neutrogena", "Bio-Oil", "RoC", "Medik8", "Perricone MD", "Talika", "Trofolastin", "Cicapost", "Blastoactiva", "Halibut", "Multilind"].map(sinTilde));
for(const p of TODOS) if(!MARCAS_FARMACIA.has(sinTilde(p.marca)) || p.no_farmacia) p.fuera_farmacia = true;
// Lo que el motor puede recomendar: ni retirados ni fichas que no se han podido verificar, ni marcas que no están en farmacia.
const CATALOGO = TODOS.filter(p => !p.retirado && !p.sin_verificar && !p.sin_precio_es && !p.fuera_farmacia);
module.exports = {HUECO_H, CATALOGO, TODOS};
