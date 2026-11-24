/* Catálogo del motor v2: el catálogo original + las correcciones revisadas + los contornos de ojos nuevos + los datos v2.
   lib/catalogo.json no se toca: el motor publicado sigue usándolo tal cual. */
"use strict";
const PRECIOS = require("./precios.json");
const HUECO_H = new Set(["la-roche-posay-effaclar-duo-m", "avene-cleanance-comedomed"]);
const BASE = require("./catalogo.json"), CORR = require("./correcciones.json"), NUEVOS = require("./contornos.json"), FICHAS = require("./fichas.json");
const n = s => String(s || "").toLowerCase();
// restos de la web pegados al final del INCI al fichar (HTML, scripts, reseñas, instrucciones): se corta en el primero
const BASURA_INCI = /<|>|addEventListener|function\s*\(|window\.|document\.|customer reviews|add a review|review for|^tu rutina$|^paso$|reseñas|^\d+([.,]\d+)?$|[{};]|=>|https?:|^c[oó]mo (utilizar|usar|aplicar)|^modo de (uso|empleo)|^paso \d/i;
const TENSIOACTIVO = /laur[ey]th sulfate|lauryl sulfate|coco-?betaine|cocamidopropyl betaine|coco-glucoside|decyl glucoside|lauryl glucoside|cocoamphoacetate|isethionate/i;
function limpiaInci(a){ if(!Array.isArray(a)) return a; const i = a.findIndex(x => BASURA_INCI.test(String(x)) || String(x).length > 150); return i < 0 ? a : a.slice(0, i); }
function aplicar(p){
  const c = CORR[p.id]; let q = p;
  if(c){
    q = Object.assign({}, p);
    for(const k of ["inci_completo", "spf", "categoria", "producto", "pvp_eur", "formato_ml"]) if(c[k] != null) q[k] = c[k];
    if(c.activos_declarados){
      // lo que la marca declara manda sobre lo que había fichado
      const otros = (p.activos || []).filter(a => (q.inci_completo || []).some(i => n(i).includes(n(a.inci))) && !c.activos_declarados.some(d => n(d.inci) === n(a.inci)));
      q.activos = c.activos_declarados.map(d => ({inci: d.inci, pct_declarado: d.pct_declarado, pct_estimado: null, confianza: "alta", posicion_inci: null, rol: "primario"})).concat(otros);
    }
    q.retirado = !!c.retirar; q.sin_verificar = !!c.excluir_hasta_verificar;
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
const TODOS = BASE.map(aplicar).concat(NUEVOS.map(p => Object.assign({}, p, {v2: FICHAS[p.id] || null}, {inci_completo: limpiaInci(p.inci_completo)})));
// Marcas que no se venden en farmacia (Hugo, 24/11): no se recomiendan. Cruce con el filtro Facial de Atida/Mifarma y el índice de Farmacia Jiménez.
// Se excluyen aquí y no se borran de la base, para poder deshacerlo.
const MARCAS_FUERA_FARMACIA = new Set(["Paula's Choice", "Kiehl's", "The Ordinary", "Dermalogica", "The INKEY List", "Natura Bissé", "Some By Mi", "Round Lab", "Isntree", "Innisfree", "Drunk Elephant", "Transparent Lab", "Pai", "La Mer", "Yepoda", "Byoma", "Glow Recipe", "Rituals", "Guerlain", "Mario Badescu", "Pyunkang Yul", "Collistar", "Deliplus", "First Aid Beauty", "Ma:nyo", "Rowse", "Mary&May", "iUNIK", "Dior", "Cocunat", "Pixi", "Augustinus Bader", "Tatcha", "Goodal", "Rhode", "Fresh", "AESTURA", "Summer Fridays", "Fenty Skin", "Youth To The People", "Bulldog", "Supergoop!", "Recipe for Men", "Holika Holika", "Proraso", "Lab Series", "Clinique for Men", "Peace Out", "Hawaiian Tropic", "Acqua di Parma", "Timeless", "Ole Henriksen"].map(n));
for(const p of TODOS) if(MARCAS_FUERA_FARMACIA.has(n(p.marca).trim())) p.fuera_farmacia = true;
// Lo que el motor puede recomendar: ni retirados ni fichas que no se han podido verificar, ni marcas que no están en farmacia.
const CATALOGO = TODOS.filter(p => !p.retirado && !p.sin_verificar && !p.sin_precio_es && !p.fuera_farmacia);
module.exports = {CATALOGO, TODOS};
