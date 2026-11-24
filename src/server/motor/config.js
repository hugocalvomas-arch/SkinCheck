/* Motor v2 · Decisiones del dueño (sección 6 del catálogo v2 y respuestas de Hugo del 02-03/10/2026).
   Todo lo que es criterio y no mecánica vive aquí, para cambiarlo sin tocar el motor. */
"use strict";
module.exports = {
  // Sección 6 del catálogo: opción por defecto de cada decisión
  embarazo_acidos: "permitir",            // 1 · salicílico ≤2 % y AHA faciales, sin peelings. Alternativa: "vetar"
  embarazo_veta_arbutina_kojico: true,    // se mantiene el veto que ya había (Hugo, 03/10)
  acne_14_17: "limpiador_hidratante_solar", // 2 · sin retinoide. Alternativa: "minima_y_derivar"
  retinoide_inicio: [{semanas: [1, 4], noches: 2}, {semanas: [5, 12], noches: 3}, {semanas: [13, null], noches: 3}], // 3
  retinoide_techo: 3,                     // 4 · noches por defecto; diario opcional
  retinoide_y_acido_misma_noche: false,   // 5
  retinoide_con_rojez_o_sequedad: "fuera_hasta_estabilizar", // 6 · el test no sabe si está estable: no se incluye y se dice en «qué queda fuera»
  melasma: "rutina_y_consulta",           // 7
  peroxido_benzoilo: "mencionar",         // 8 · paso de farmacia en P01-P02, fuera de la rutina
  exfoliante_aparte_en_acne: false,       // 9
  fps_defecto: 50, fps_minimo: 30,        // 10
  solar_color: {obligatorio: ["P13"], recomendado: ["P10", "fototipo_oscuro"]},
  pausa_barrera_semanas: 2,               // 11
  jerarquia: ["barrera", "rojez", "acne", "manchas", "arrugas_textura"], // 12
  // Respuestas de Hugo
  fototipo_oscuro: {fototipos: ["V", "VI"], o_marcas_oscuras: true},   // «las dos cosas»
  verano: "aviso",                        // no veta empezar el retinoide: de noche, con solar al día siguiente, no hay problema
  retinoides_solo_de_noche: true,
  retinol_max: 0.3,
  receta_medica: "sin_activos",
  sexo_como_puerta: true,
  // Rangos de dosis por activo (función entre paréntesis)
  rangos: {
    niacinamida: {sebo: [2, 5], resto: [4, 5], aceptable_hasta: 10, aceptable_solo_reactividad: "baja"},
    vitc_pura: [10, 20], vitc_derivados: [2, 20],   // derivados: mínimo 2 % para ser protagonista (propuesta 24/11, pendiente de Hugo)
    retinol: [0.1, 0.3], retinal: [0.05, 0.1],
    // Hugo, 24/11: quien nunca ha usado un retinoide empieza por la concentración baja; quien ya lo usa, sigue o sube
    retinal_inicio: [0.01, 0.05], retinal_retinizada: [0.05, 0.2], bakuchiol: [0.5, 1],
    glicolico: [4, 10], lactico: [5, 10], salicilico: [0.5, 2],
    azelaico: [8, 10], tranexamico: [3, 5], thiamidol: [0.1, 0.2]
  },
  // Productos cuya eficacia está estudiada en el producto acabado, aunque la marca no declare la dosis: cuentan como elección principal en la función indicada.
  ensayo_producto: {
    "la-roche-posay-effaclar-duo-m": {activo: "niacinamida", funciones: ["antiacne"], refs: ["10.1111/jocd.16052", "10.2147/CCID.S474331"]},
    "la-roche-posay-mela-b3-serum": {activo: "niacinamida", funciones: ["despigmentante"], refs: ["10.1007/s13555-025-01473-4", "10.1111/jocd.16735"]},
    "vichy-liftactiv-specialist-b3-serum": {activo: "niacinamida", funciones: ["despigmentante"], refs: ["10.1111/jocd.70097"]},
    // ensayos sin grupo control, o sin diferencia frente al comparador: cuentan, con menos peso (control: false)
    "avene-cleanance-comedomed": {activo: "silybum", etiqueta: "extracto de cardo mariano", funciones: ["antiacne"], control: false, refs: ["10.1111/jocd.15705"]},
    "isdin-isdinceutics-melaclear-serum": {activo: "tranexamico", funciones: ["despigmentante"], control: false, refs: ["10.1111/jocd.16148"]},
    "ducray-keracnyl-serum": {activo: "azelaico", funciones: ["antiacne"], control: false, refs: ["10.1111/jdv.18795"]},
    // ensayo frente a vehículo en melasma: vale como retinoide solo cuando el motivo es una mancha o marca
    "neoretin-discrom-control-serum-booster-fluid": {activo: "retinol", funciones: ["retinoide"], problemas: ["P10", "P12", "P13"], refs: ["10.1111/jocd.12110"]},
    "skinceuticals-c-e-ferulic": {activo: "vitc_pura", funciones: ["vitc"], refs: ["10.1016/j.jaad.2008.05.004", "10.1111/j.0022-202X.2005.23768.x"]},
    "skinceuticals-discoloration-defense": {activo: "tranexamico", funciones: ["despigmentante"], control: false, refs: ["PMID 31141852"]}
  },
  thiamidol: {valido_en: ["P10", "P13"], excluido_en: ["P12"], excepcion_eucerin_sin_dosis: true, dermopure_solo_piel_grasa: true},
  solo_secundarios: ["kojico", "arbutina", "zinc"],
  // Línea del 1 %: primer ingrediente que por ley o por uso va por debajo
  linea_1pct: ["phenoxyethanol", "sodium benzoate", "potassium sorbate", "dehydroacetic", "chlorphenesin", "edta", "carbomer", "xanthan gum"],
  clases_dosis: {
    alta: ["niacinamida", "vitc_pura", "vitc_derivados", "azelaico", "glicolico", "lactico", "tranexamico", "urea", "pantenol"],
    media: ["retinol", "bakuchiol", "salicilico", "vitamina_e", "ferulico", "ceramidas", "hialuronico"],
    muy_baja: ["retinal", "hpr", "thiamidol", "peptidos"]
  },
  // Número de productos (Hugo, 03/10/2026). El solar va siempre aparte y no cuenta.
  solar_aparte: true,
  productos: {
    opciones: [3, 4, 5, 6],                 // la última se enseña como «6 o más»
    3: ["limpiador", "serum", "hidratante"],
    4: ["limpiador", "serum_noche", "serum_manana", "hidratante"],   // el sérum de mañana, solo si vale la pena y es distinto al de noche
    5: ["limpiador", "serum_noche", "serum_manana", "hidratante", "contorno_ojos"],   // el contorno, solo si hay ojeras, arrugas o falta de firmeza (Hugo, 05/10)
    6: ["limpiador", "serum_noche", "serum_manana", "hidratante", "contorno_ojos", "segunda_hidratante_u_otro"]
  },
  contorno_ojos: "incluir",
  topes: {barrera: 3, rojez_sensible: 5},
  solares_excluidos: ["garnier"],         // solares de gran consumo que Hugo no quiere recomendar
  peso_precio: 0.002,                       // cuánto resta cada euro al puntuar un producto (desempate calidad/precio)
  presupuesto: {bajo: 30, medio: 60, alto: null}                  // hay que fichar productos: hoy el catálogo tiene uno
};
