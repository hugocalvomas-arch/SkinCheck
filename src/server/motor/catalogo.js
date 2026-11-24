/* Catálogo del motor v2: el catálogo original + las correcciones revisadas + los contornos de ojos nuevos + los datos v2.
   lib/catalogo.json no se toca: el motor publicado sigue usándolo tal cual. */
"use strict";
const PRECIOS = require("./precios.json");
const HUECO_H = new Set(["la-roche-posay-effaclar-duo-m", "avene-cleanance-comedomed"]);
const BASE = require("./catalogo.json"), CORR = require("./correcciones.json"), NUEVOS = require("./contornos.json"), FICHAS = require("./fichas.json");
const n = s => String(s || "").toLowerCase();
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
  if(v2 && v2.hueco === "H" && /lavant|nettoyant|limpiador|limpiadora|cleanser|cleansing|face wash/i.test(q.producto)) v2 = Object.assign({}, v2, {hueco: "L"});
  return Object.assign({}, q, {v2});
}
const TODOS = BASE.map(aplicar).concat(NUEVOS.map(p => Object.assign({}, p, {v2: FICHAS[p.id] || null})));
// Lo que el motor puede recomendar: ni retirados ni fichas que no se han podido verificar.
const CATALOGO = TODOS.filter(p => !p.retirado && !p.sin_verificar && !p.sin_precio_es);
module.exports = {CATALOGO, TODOS};
