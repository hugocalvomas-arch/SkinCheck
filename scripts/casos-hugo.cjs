/* eslint-disable @typescript-eslint/no-require-imports */
/* Los 10 casos que corrigió Hugo (auditoría, 24/11). Uso: node scripts/casos-hugo.cjs [id]. No llama a ninguna API. */
"use strict";
const motor = require("../src/server/motor/motor.js");
const { aplicarAlMotor } = require("../src/server/motor/reglasFoto.js");
const { LISTA } = require("./casos-reglas-foto.cjs");
const B = o => ({ arrugas: 80, manchas: 80, textura: 80, rojez: 80, brillo: 80, firmeza: 80, hidratacion: 80, poros: 80, ojeras: 80, acne: 80, tono: 80, ...o });
const CASOS = [
  { id: "H01", nombre: "Lucía, 28, mixta con brillo y poros", edad: "25-39", tramo: "25-34", notas: B({ brillo: 54, poros: 58, textura: 66, hidratacion: 72, acne: 74, rojez: 76 }) },
  { id: "H02", nombre: "Marta, 19, granitos y marcas", edad: "18-24", tramo: "18-24", notas: B({ acne: 46, brillo: 52, textura: 60, poros: 60, manchas: 62, rojez: 64 }) },
  { id: "H03", nombre: "Elena, 38, deshidratada y apagada", edad: "25-39", tramo: "35-44", notas: B({ hidratacion: 52, tono: 58, textura: 63, ojeras: 66, arrugas: 70 }) },
  { id: "H04", nombre: "Carmen, 52, manchas de sol y arrugas", edad: "40-49", tramo: "45-54", notas: B({ manchas: 50, arrugas: 55, firmeza: 62, tono: 63, hidratacion: 64, textura: 66 }) },
  { id: "H05", nombre: "Pilar, 63, madura y seca", edad: "50+", tramo: "55+", notas: B({ firmeza: 47, arrugas: 48, hidratacion: 50, manchas: 58, tono: 59, textura: 60 }) },
  { id: "H06", nombre: "Sara, 33, rojeces, reactiva a veces", edad: "25-39", tramo: "25-34", reactiva: "a_veces", notas: B({ rojez: 45, hidratacion: 58, tono: 68, textura: 68 }) },
  { id: "H07", nombre: "Laura, 31, embarazada con manchas", edad: "25-39", tramo: "25-34", embarazo: "si", notas: B({ manchas: 49, tono: 62, textura: 72 }) },
  { id: "H08", nombre: "Javier, 45, hombre, grasa y poros", edad: "40-49", tramo: "45-54", sexo: "hombre", notas: B({ brillo: 42, poros: 44, textura: 58, arrugas: 64 }) },
  { id: "H09", nombre: "Ana, 41, casi perfecta", edad: "25-39", tramo: "35-44", notas: B({ arrugas: 78, manchas: 76, textura: 79, rojez: 80, brillo: 77, firmeza: 78, hidratacion: 77, poros: 76, ojeras: 72, acne: 85, tono: 80 }) },
  { id: "H10", nombre: "Nuria, 36, receta para granos", edad: "25-39", tramo: "35-44", receta: "si", notas: B({ acne: 44, brillo: 56, rojez: 60, hidratacion: 60 }) },
];
function respuestas(c){
  const r = { edad: c.edad, edad_tramo: c.tramo, sexo: c.sexo || "mujer", embarazo: c.embarazo || "no", lactancia: "no", receta: c.receta || "no", reactiva: c.reactiva || "nunca",
    sienta: ["nada"], retinoide_exp: "nunca", fototipo: "III", textura: "igual", preocupa: ["nada"], piel: "normal", kiosko: true };
  const rf = aplicarAlMotor(r, c.notas);
  return { r, rf };
}
function correr(c){
  const { r, rf } = respuestas(c);
  const res = { reglas: rf.reglas_aplicadas.map(x => x.id) };
  for(const [k, n, pres] of [["basica", 3, "bajo"], ["media", 4, "medio"], ["completa", 5, "alto"]]) res[k] = motor.calcularCon({ ...r, productos: n, presupuesto: pres }, LISTA);
  return res;
}
module.exports = { CASOS, respuestas, correr };
if(require.main === module){
  for(const c of CASOS.filter(c => !process.argv[2] || c.id === process.argv[2])){
    const res = correr(c);
    console.log(`\n## ${c.id} ${c.nombre}   [${res.reglas.join(", ")}]`);
    for(const k of ["basica", "media", "completa"]){
      const o = res[k];
      console.log(` ${k} (${o.modo}): ` + o.productos.map(p => `${p.paso}${p.turno ? " " + p.turno : ""}: ${p.producto ? p.marca + " · " + p.producto : "—"}${p.activo ? " [" + p.activo + "]" : ""}${p.frecuencia ? " {" + p.frecuencia + "}" : ""}`).join(" | "));
    }
  }
}
