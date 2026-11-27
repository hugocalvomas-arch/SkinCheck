// Cuestionario de mostrador. Copiado de las preguntas del test de Hugo (public/app.js de su web, motor v2):
// las claves de respuesta son las que lee el motor. Quitadas "productos" y "presupuesto": las 3 rutinas
// (básica, media y completa) ya cubren esas opciones.
/* eslint-disable @typescript-eslint/no-explicit-any */
export type Respuestas = Record<string, any>
type Op = (string | number)[]
export type Pregunta = { id: string; bloque: string; t: string; nota?: string; multi?: boolean; cond?: (r: Respuestas) => boolean; ops: Op[] | ((r: Respuestas) => Op[]) }
const tiene = (r: Respuestas, k: string, v: string) => (r[k] || []).includes(v);
const ES_HOMBRE = (r: Respuestas) => r.sexo === "hombre";
const SE_AFEITA = (r: Respuestas) => ["diario", "a_veces"].includes(r.afeita) && r.sexo !== "mujer";
const MAYOR_25 = (r: Respuestas) => ["25-39", "40-49", "50+"].includes(r.edad);
/* La pregunta del retinoide solo sale si la pauta va a llevar uno. Lo sabe el motor
   (vista provisional); mientras no haya contestado, se decide con lo que ya se sabe aquí. */
const PUEDE_RETINOIDE = (r: Respuestas) => r.edad !== "14-17" && r.embarazo !== "si" && r.receta !== "si" && !tiene(r, "sienta", "retinoide");

export const PREGUNTAS: Pregunta[] = [
  /* --- Tú --- */
  {id:"edad", bloque:"Tú", t:"Para empezar: ¿qué edad tienes?",
   ops:[["-14","Menos de 14"],["14-17","Entre 14 y 17"],["18-24","Entre 18 y 24"],["25-39","Entre 25 y 39"],["40-49","Entre 40 y 49"],["50+","50 o más"]]},
  {id:"sexo", bloque:"Tú", t:"¿Eres hombre o mujer?",
   nota:"Solo lo uso para saber si tengo que preguntarte por el afeitado o por el embarazo.",
   ops:[["hombre","Hombre"],["mujer","Mujer"],["nd","Prefiero no decirlo"]]},
  {id:"afeita", bloque:"Tú", cond:(r: Respuestas)=>r.sexo==="hombre" || r.sexo==="nd", t:"¿Te afeitas la cara?",
   ops:[["diario","A diario o casi"],["a_veces","De vez en cuando"],["no","No"]]},
  {id:"tras_afeitar", bloque:"Tú", cond:SE_AFEITA, multi:true,
   t:"Después de afeitarte, ¿te pasa algo de esto?",
   nota:"Marca lo que te pase de verdad, aunque lo tengas asumido.",
   ops:[["encarnado","Granitos con un pelo en el centro, que se repiten"],
        ["infeccion","Granos con dolor, calor, hinchazón o costras"],
        ["irritacion","Irritación que se va en uno o dos días"],
        ["nada","Nada"]]},

  /* --- Qué notas en tu piel --- */
  {id:"preocupa", bloque:"Qué notas en tu piel", multi:true,
   t:"¿Qué te gustaría mejorar?",
   nota:"Marca todo lo que te pase. Luego te pregunto por cada cosa.",
   ops:[["granos","Granos o puntos negros"],["brillo","Brillo"],["poros","Poros"],["marcas","Marcas que dejaron los granos"],
        ["manchas","Manchas"],["tono","Tono apagado"],["ojeras","Ojeras"],["arrugas","Arrugas o líneas"],
        ["firmeza","Falta de firmeza"],["aspera","Piel áspera"],["rojez","Rojez"],["escozor","Me escuece o me pica casi todo"],
        ["sequedad","Sequedad o tirantez"],["nada","Nada en concreto"]]},
  {id:"granos", bloque:"Qué notas en tu piel", multi:true, cond:(r: Respuestas)=>tiene(r,"preocupa","granos"),
   t:"¿Cómo son esos granos?",
   nota:"Marca todos los que reconozcas.",
   ops:[["comedones","Puntos negros y bultitos del color de la piel"],
        ["rojos","Granos rojos o con pus, pocos"],
        ["muchos","Muchos, o también en el pecho o la espalda"],
        ["nodulos","Bultos profundos que duelen o dejan cicatriz"],
        ["iguales_pican","Granitos pequeños, todos iguales, que pican","En la frente o en la línea del pelo"],
        ["perioral","Granitos alrededor de la boca","Con el borde del labio limpio"],
        ["sobre_rojez","Granos sobre rojez en mejillas y nariz","Sin puntos negros"]]},
  {id:"granos_adulto", bloque:"Qué notas en tu piel", multi:true, cond:(r: Respuestas)=>tiene(r,"preocupa","granos") && tiene(r,"granos","rojos") && MAYOR_25(r),
   t:"¿Encaja algo de esto?",
   nota:"Marca todo lo que te pase.",
   ops:(r: Respuestas)=>[["mandibula", ES_HOMBRE(r) ? "Me salen en la mandíbula y la barbilla" : "Me salen en la mandíbula y la barbilla, y brotan antes de la regla"]]
     .concat(ES_HOMBRE(r) ? [] : [["reglas_irregulares","Tengo reglas irregulares"]])
     .concat([["debut_adulto","Han empezado de adulto"],["whey","Tomo proteína whey, anabolizantes o un medicamento nuevo"],["nada","Nada de esto"]])},
  {id:"marcas", bloque:"Qué notas en tu piel", multi:true, cond:(r: Respuestas)=>tiene(r,"preocupa","marcas") || tiene(r,"preocupa","granos"),
   t:"Presiona una marca con el dedo. ¿Qué pasa?",
   nota:"La marca marrón y la roja son cosas distintas, y lo que va bien para una no siempre sirve para la otra.",
   ops:(r: Respuestas)=>[["oscura","Es marrón y no cambia"],["roja","Es roja o rosa y se aclara al presionar"],["hoyo","Es un hoyito que hace sombra con la luz de lado"]]
     .concat(tiene(r,"preocupa","marcas") ? [] : [["nada","No me quedan marcas"]])},
  {id:"manchas", bloque:"Qué notas en tu piel", multi:true, cond:(r: Respuestas)=>tiene(r,"preocupa","manchas"),
   t:"¿Cómo son esas manchas?",
   nota:"Marca todas las que reconozcas.",
   ops:[["sol","Sueltas, planas y bien delimitadas","Están todo el año"],
        ["melasma","Parches grandes e iguales en los dos lados","En las mejillas, la frente o el labio superior"],
        ["post","Están donde hubo un grano o una herida"],
        ["alarma","Una es reciente, crece, tiene varios tonos o sangra"]]},
  {id:"lineas", bloque:"Qué notas en tu piel", cond:(r: Respuestas)=>tiene(r,"preocupa","arrugas"),
   t:"Estira la piel con los dedos. ¿Qué pasa con las líneas?",
   nota:"Así distingo una piel deshidratada de una arruga, que se tratan de forma distinta.",
   ops:[["desaparecen","Desaparecen"],["reposo","Siguen ahí aunque estire"],["gesto","Solo se marcan cuando gesticulo"]]},
  {id:"rojez", bloque:"Qué notas en tu piel", multi:true, cond:(r: Respuestas)=>tiene(r,"preocupa","rojez") || tiene(r,"preocupa","escozor"),
   t:"¿Cómo es esa rojez o ese escozor?",
   nota:"Descripciones, no diagnósticos. Marca lo que te suene.",
   ops:[["fija","Rojez fija en mejillas y nariz, con venitas","Peor con el calor o el alcohol"],
        ["sensible","No se ve nada, pero me escuece, pica o tira"],
        ["seborreica","Escamas grasas y amarillentas","Junto a la nariz o en las cejas"],
        ["atopica","Zonas secas que pican mucho, desde la infancia"],
        ["ojo","Me duele un ojo, lo tengo rojo o veo borroso"],
        ["corticoide","He usado crema con corticoide en la cara"]]},
  {id:"irritada", bloque:"Qué notas en tu piel", cond:(r: Respuestas)=>["rojez","escozor","sequedad"].some(k=>tiene(r,"preocupa",k)),
   t:"¿Has empezado productos nuevos o muchos activos, y ahora te escuece lo que antes tolerabas?",
   nota:"Si es así, lo primero es parar y dejar que la piel se recupere.",
   ops:[["si","Sí"],["no","No"]]},
  {id:"sequedad", bloque:"Qué notas en tu piel", cond:(r: Respuestas)=>tiene(r,"preocupa","sequedad"),
   t:"¿Cómo es esa sequedad?",
   ops:[["estable","Tira y está áspera siempre"],["brilla_tira","Brilla y a la vez tira"],["no_mejora","No mejora aunque hidrate bien","Con picor o grietas"]]},

  /* --- Tu piel y tus condiciones --- */
  {id:"piel", bloque:"Tu piel y tus condiciones", t:"Te lavas la cara solo con agua y no te pones nada. Media hora después, ¿cómo la notas?",
   nota:"Mucha gente no tiene claro cómo es su piel. Esto lo comprueba sin que tengas que adivinarlo.",
   ops:[["tirante","Tirante, incómoda, como si me quedara pequeña"],["normal","Normal, ni la noto"],["brillo_T","Bien, y empieza a brillarme la frente y la nariz"],["brillo_total","Me brilla casi toda la cara"]]},
  {id:"reactiva", bloque:"Tu piel y tus condiciones", t:"Cuando pruebas un producto nuevo en la cara, ¿cómo suele sentarte?",
   nota:"Así sé si tengo que empezar por lo más suave.",
   ops:[["nunca","Casi nunca me sienta mal"],["a_veces","A veces me pica o me enrojece"],["siempre","Casi siempre reacciono"]]},
  {id:"sienta", bloque:"Tu piel y tus condiciones", multi:true, t:"¿Hay algo que te siente mal?",
   nota:"Marca todo lo que te pase. Si no lo sabes, marca la última.",
   ops:[["perfume","El perfume"],["alcohol","El alcohol"],
        ["filtros_quimicos","Los protectores solares me pican o me irritan los ojos"],
        ["retinoide","Los retinoides ya me irritaron"],["acidos","Los exfoliantes con ácido ya me irritaron"],["vitc","La vitamina C ya me irritó"],
        ["nada","Nada, que yo sepa"]]},
  {id:"embarazo", bloque:"Tu piel y tus condiciones", cond:(r: Respuestas)=>!ES_HOMBRE(r) && ["14-17","18-24","25-39","40-49"].includes(r.edad),
   t:"¿Estás embarazada o dando el pecho?",
   nota:"Hay ingredientes que no se usan en el embarazo, y otros que conviene evitar mientras das el pecho.",
   ops:[["si","Estoy embarazada"],["lactancia","Estoy dando el pecho"],["no","No"]]},
  {id:"receta", bloque:"Tu piel y tus condiciones", t:"¿Usas ahora algo para la piel que te haya mandado un médico?",
   nota:"Si es así, no pongo activos encima de tu tratamiento.",
   ops:[["no","No"],["si","Sí"]]},
  // Hito 1 (Hugo, 27/11): tratamiento en consulta en las últimas 2 semanas, cuál y cuándo
  {id:"procedimiento", bloque:"Tu piel y tus condiciones", t:"¿Te has hecho algún tratamiento en consulta en las últimas 2 semanas?",
   nota:"Después de un peeling, un láser o microagujas, la piel necesita una rutina distinta durante un tiempo.",
   ops:[["no","No"],["peeling","Un peeling"],["laser","Láser o luz pulsada"],["microagujas","Microagujas o radiofrecuencia con agujas"],["limpieza","Una limpieza facial"],["otro","Otro, o no sé cuál"]]},
  {id:"procedimiento_cuando", bloque:"Tu piel y tus condiciones", cond:(r: Respuestas)=>!!r.procedimiento && r.procedimiento!=="no", t:"¿Cuándo te lo hiciste?",
   ops:[["semana","Hace menos de una semana"],["dos_semanas","Hace una o dos semanas"]]},
  {id:"retinoide_exp", bloque:"Tu piel y tus condiciones", cond:PUEDE_RETINOIDE, t:"¿Usas ya un retinoide?",
   nota:"El retinol y el retinal son retinoides. De esto depende por cuántas noches a la semana empiezas.",
   ops:[["nunca","No, nunca"],["reciente","Sí, desde hace menos de 3 meses"],["tolera","Sí, y lo tolero bien"]]},
  {id:"fototipo", bloque:"Tu piel y tus condiciones", t:"El primer día fuerte de sol, sin protección, tu piel:",
   ops:[["I","Se quema siempre y no se pone morena nunca"],["II","Se quema con facilidad y coge poco color"],["III","A veces se quema, y va cogiendo color poco a poco"],["IV","Casi nunca se quema y se pone morena bien"],["V","Se pone muy morena y rara vez se quema"],["VI","No se quema nunca"]]},

  /* --- Cómo lo quieres --- */
  {id:"textura", bloque:"Cómo lo quieres", t:"Cuando te pones crema en la cara, ¿qué te gusta más?",
   nota:"Una crema que no te gusta acaba en el cajón.",
   ops:[["ligera","Que sea ligera y desaparezca enseguida, casi como un gel"],
        ["media","Un término medio: que hidrate pero sin notarla encima"],
        ["rica","Que sea untuosa y se note, me gusta esa sensación"],
        ["igual","Me da igual"]]}
];

export const BLOQUES = [...new Set(PREGUNTAS.map((q) => q.bloque))]
export const visibles = (r: Respuestas) => PREGUNTAS.filter((q) => !q.cond || q.cond(r))
export const opciones = (q: Pregunta, r: Respuestas) => (typeof q.ops === 'function' ? q.ops(r) : q.ops)
/** Preguntas visibles sin contestar */
export const pendientes = (r: Respuestas) =>
  visibles(r).filter((q) => (q.multi ? !(r[q.id] || []).length : r[q.id] == null || r[q.id] === ''))
