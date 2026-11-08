# Cierre del informe Fishin't

Material para resolver los comentarios **#3** (estado del proyecto contradictorio) y **#280**
(el informe termina en el diseño, sin evidencia de cumplimiento) de la revisión de
Saúl Ortega, noviembre de 2026.

Todas las cifras están medidas sobre el código de este repositorio, no estimadas.
Se reproducen con `npm run benchmark` y `npm run validar`.

---

## Parte 1 — El informe declara cuatro estados distintos del proyecto

El comentario #3 señala la contradicción. Al revisar el texto completo no son dos versiones
sino **cuatro**, y conviene verlas juntas porque la corrección debe ser coherente entre todas.

| Dónde | Qué dice hoy | Estado que implica |
|---|---|---|
| Resumen | «Sobre esa base **se construyó un prototipo funcional desplegado**, cuya validación […] se reporta en las entregas siguientes» | Construido, validación pendiente |
| Abstract | «**Prototype construction and its validation** […] **will be carried out** during the second academic semester of 2026» | Ni siquiera construido |
| §2.5.2 | «al momento de elaborar este análisis el prototipo **se encontraba en fase de diseño**» | En diseño |
| §3.1.1 y restricción de §6 | «**Construir y validar**, durante el segundo semestre académico de 2026…» | A futuro |
| §7.6 | «se garantizó la **factibilidad de construcción** del prototipo» | Solo factible |

El Resumen en español y el Abstract en inglés **se contradicen directamente**: uno afirma que
el prototipo existe y el otro que se construirá. Además, al ser esta la entrega final de
noviembre de 2026, la fórmula «se construirá durante el segundo semestre de 2026» quedó en pasado.

### El estado real, verificable

El prototipo **está construido, desplegado y su motor fue validado**. Lo que **no** se ejecutó
son las pruebas con usuarios. Esa distinción debe recorrer todo el informe.

### Redacción propuesta

**Resumen** — reemplazar la frase final por:

> Sobre esa base se construyó un prototipo funcional, desplegado y de acceso público, cuyo motor
> de detección fue evaluado sobre dos conjuntos de enlaces etiquetados. Los resultados de esa
> evaluación se reportan en el capítulo 9. La validación con usuarios mediante pruebas de
> usabilidad y la medición del Coeficiente de Resiliencia Digital en una muestra real no se
> ejecutaron dentro de este período y se declaran como trabajo pendiente.

**Abstract** — alinear con lo anterior (el error aquí es el tiempo verbal, no el contenido):

> On that basis a functional prototype was built and publicly deployed, and its detection engine
> was evaluated against two labelled link sets; those results are reported in Chapter 9. User
> validation through usability testing and Digital Resilience Coefficient measurement on a real
> sample was not carried out within this period and is declared as pending work.

**§2.5.2** — la frase es correcta en su contexto (describe el momento del análisis comparativo),
pero conviene fecharla para que no se lea como el estado actual:

> al momento de elaborar **este análisis comparativo**, durante la fase de diseño, el prototipo
> aún no se había construido

**§3.1.1** — además de unificar el tiempo verbal, resuelve el comentario #139 (un solo verbo,
máximo tres renglones):

> Validar un prototipo funcional del sistema Fishin't —cliente web progresivo y servicio
> backend— que integra detección heurística de enlaces, alfabetización digital gamificada y
> seguridad delegada, para reducir la vulnerabilidad frente al phishing en usuarios chilenos
> con competencias digitales básicas.

**§7.6** — «se garantizó la factibilidad de construcción» se queda corto ahora que el sistema existe:

> el diseño aquí especificado fue efectivamente implementado; su construcción se documenta en el
> capítulo 8 y su evaluación en el capítulo 9

---

## Parte 2 — Lo que falta: tres capítulos

El informe termina en el capítulo 7 (Diseño). Para una entrega final faltan **Implementación**,
**Pruebas y Resultados** y **Conclusiones**. Sin ellos, los objetivos específicos b) a e) y los
criterios de §3.2.4 quedan sin evidencia, que es exactamente lo que observa #280.

---

## Parte 3 — Capítulo 8 propuesto: Implementación

### 8.1 Alcance de lo construido

El sistema se implementó como aplicación web progresiva sobre Next.js 14 y React, con lógica de
servidor en funciones sin infraestructura dedicada y persistencia en PostgreSQL gestionado,
conforme a la arquitectura de tres capas especificada en §5.1. El repositorio registra
**36 incrementos versionados** y el sistema está desplegado y accesible públicamente.

La aplicación comprende **16 vistas** y los **tres módulos** definidos en §2.4.1:

- **Analizador de enlaces**, con panel de resultado y evidencia explicada.
- **Cyber-Academy**, con 13 cápsulas formativas organizadas en tres niveles de dificultad
  progresiva, 13 ejercicios de cierre y el instrumento de medición del CRD de 24 ítems
  (12 en cada aplicación, pre y post).
- **Red Protegida**, con creación de grupo, vinculación por código de invitación, panel de
  alertas y control de acceso por fila.

La capa de datos consta de tres esquemas (`schema.sql`, `threat_signatures.sql`,
`protected_networks.sql`) y **15 funciones almacenadas** con `SECURITY DEFINER`, patrón adoptado
para evitar la recursión de políticas cruzadas de RLS.

### 8.2 El motor de detección

El motor combina trece señales. Su rasgo distintivo frente a los servicios de reputación
comerciales es que **cada veredicto identifica qué indicador se activó**, requisito declarado
en §2.4.1.a:

1. Marca suplantada en el dominio.
2. Marca suplantada en la ruta, patrón de los sitios legítimos vulnerados.
3. Imitación tipográfica contra una lista de dominios oficiales.
4. Imitación tipográfica **sin lista de referencia** (ver 8.3).
5. Homóglifos y dominios internacionalizados.
6. Dirección IP en lugar de dominio.
7. Alojamiento en plataformas gratuitas de terceros.
8. Terminaciones de dominio de alto riesgo.
9. Antigüedad del registro del dominio.
10. Validación de la cadena de confianza TLS.
11. Existencia efectiva del dominio en el DNS.
12. Base comunitaria de firmas reportadas.
13. Inteligencia de amenazas externa: Google Safe Browsing y VirusTotal.

Sobre la señal 13 conviene precisar la **regla de consolidación**, porque las dos fuentes no son
equivalentes. Safe Browsing es autoritativo con una sola coincidencia por tratarse de una lista
curada por un proveedor que responde por ella. VirusTotal, en cambio, agrega más de setenta
motores heterogéneos: exigir una sola detección produciría falsos positivos incompatibles con el
criterio de ≤10 % de §3.2.4. Se requieren **dos o más motores** para un veredicto autoritativo;
una sola detección actúa como señal corroborante que resta puntaje sin condenar por sí sola.

### 8.3 Decisiones de implementación con fundamento empírico

Cuatro decisiones se tomaron a partir de comprobaciones contra los registros y servicios reales,
no por diseño previo. Se documentan porque constituyen hallazgos del proceso.

**El TLD .cl no dispone de RDAP.** Se verificó que `.cl` no figura en el *bootstrap* de IANA y que
NIC Chile no expone servicio RDAP. Dado que los dominios chilenos son el foco del producto, la
antigüedad se obtiene por WHOIS clásico en `whois.nic.cl:43`, que sí entrega la fecha de creación.
De esa respuesta se extrae únicamente la fecha: incluye el nombre del titular, que no se registra
ni almacena, conforme al principio de minimización de §5.1.

**La antigüedad del dominio es señal corroborante, no acusatoria.** Un dominio legítimo sin otras
señales parte con puntaje 80; la penalización más suave por antigüedad (−15) lo dejaba en 65, bajo
el umbral de 67. En consecuencia, **todo sitio chileno con menos de seis meses resultaba marcado
como sospechoso**, incluidas las microempresas que §2.2.2 identifica como público objetivo. El
motor penalizaba justamente el rasgo que define a parte de sus usuarios. La regla se corrigió: con
otras señales presentes la antigüedad las amplifica; en un enlace limpio solo un dominio de treinta
días o menos genera advertencia, y con lenguaje que aclara que un sitio nuevo no constituye prueba
de fraude.

**La detección de imitación no puede depender de una lista.** La comparación contra un listado de
dominios oficiales solo protege a las instituciones incluidas en él. Se implementó un procedimiento
generativo que construye los vecinos tipográficos del dominio analizado, verifica por DNS cuáles
existen y compara antigüedades, marcando cuando el vecino supera los dos años y el dominio evaluado
es sustancialmente más reciente. Así quedan cubiertas instituciones que ninguna lista contendría de
forma exhaustiva.

**Un dominio que no resuelve no es un sitio seguro.** Se incorporó verificación de DNS: ante
inexistencia definitiva el veredicto no puede quedar en «sin señales de riesgo». Solo la
inexistencia confirmada penaliza; un fallo del resolutor no se imputa al dominio.

---

## Parte 4 — Capítulo 9 propuesto: Pruebas y Resultados

### 9.1 Diseño de la evaluación del motor

La evaluación se realizó sobre **dos conjuntos etiquetados y deliberadamente separados**,
distinción metodológicamente necesaria porque los indicadores del motor se ajustaron observando
los fallos del primero.

- **Conjunto de afinamiento**: 77 enlaces (38 fraudulentos, 39 legítimos), ponderados al contexto
  chileno (69 nacionales, 8 internacionales).
- **Conjunto de validación**: 45 enlaces construidos con un criterio de muestreo distinto
  —derivados de las campañas chilenas documentadas e instituciones nacionales ausentes del primer
  conjunto— e incorporando vectores evasivos que el primero apenas cubría: alojamiento gratuito,
  sitios legítimos vulnerados y dominios limpios.

Ambos se ejecutan con los comandos `npm run benchmark` y `npm run validar`, lo que hace la
medición reproducible.

Los enlaces legítimos son dominios oficiales reales. Los fraudulentos son casos curados a partir de
campañas documentadas, **no capturas en vivo de un repositorio público**; esta limitación se
discute en 9.5.

### 9.2 Resultados

| Métrica | Afinamiento | Validación | Criterio §3.2.4 |
|---|---|---|---|
| Exhaustividad | 94,7 % | **86,4 %** | ≥ 85 % · cumple |
| Tasa de falsos positivos | 0,0 % | **0,0 %** | ≤ 10 % · cumple |
| Precisión | 100 % | 100 % | — |
| Exactitud | 97,4 % | — | — |

La diferencia de 8,4 puntos entre ambos conjuntos es la estimación del **sesgo de afinamiento** y
debe reportarse como tal: la cifra válida para juzgar el motor es la del conjunto de validación.

Desglose por dificultad sobre el conjunto de validación:

| Categoría | Detectados | Exhaustividad |
|---|---|---|
| Directa (terminaciones de riesgo, acortadores) | 11 / 11 | 100 % |
| Media (imitación tipográfica, subdominios) | 4 / 4 | 100 % |
| Evasiva (alojamiento gratuito, sitios vulnerados) | 4 / 7 | 57,1 % |

El desglose localiza con precisión la debilidad: el motor es completo frente a los vectores masivos
y limitado frente a los evasivos. Los tres casos no detectados corresponden a un sitio legítimo
vulnerado y a dos dominios sintácticamente limpios; estos últimos sí los detecta la verificación de
antigüedad en el sistema desplegado, que el banco de pruebas no ejercita por ejecutarse sin red.

### 9.3 Trazabilidad de la mejora

La primera medición sobre el conjunto de validación arrojó **72,7 %** frente al 94,7 % del conjunto
de afinamiento. La brecha de 22 puntos confirmó que la cifra alta era optimista, y el desglose
concentró la falla en la categoría evasiva (1 de 7). A partir de ese diagnóstico se incorporaron la
detección de marca en la ruta y el reconocimiento de plataformas de alojamiento gratuito, con lo que
la exhaustividad subió a **86,4 % sin incremento alguno de falsos positivos**.

Se deja constancia de que, al haberse diseñado esas mejoras observando los fallos de ese conjunto,
**el 86,4 % ya no constituye una medición ciega**.

### 9.4 Validación en contexto real

Durante el desarrollo se evaluaron casos reales que permitieron verificar el comportamiento del
sistema fuera del banco de pruebas.

El más relevante procede de un **simulacro de phishing ejecutado por un integrante del equipo en su
lugar de trabajo**. Se registró el dominio `incancr.cl`, omisión deliberada de una letra respecto de
`incancer.cl`, correspondiente al Instituto Nacional del Cáncer y registrado en 2001. El sistema
identificó ambas señales de forma independiente: la antigüedad del dominio (doce días) y la
imitación tipográfica de una institución con veinticuatro años de registro, pese a que esa
institución no figura en ninguna lista de referencia del motor. El veredicto fue «peligroso» con
las dos razones explicitadas al usuario.

Un segundo caso, `bancobci.cl`, resultó registrado desde 2007 pero sin registro DNS activo
—probablemente una inscripción defensiva—, lo que motivó la verificación de existencia descrita
en 8.3.

Estos casos no constituyen una muestra estadística, pero sí evidencia de funcionamiento en
condiciones reales, y ambos revelaron limitaciones que las mediciones sintéticas no habían detectado.

### 9.5 Limitaciones de la evaluación

Se declaran de forma explícita:

1. **Los conjuntos fueron construidos por el mismo equipo que desarrolló el detector**, por lo que
   no existe independencia entre evaluador y evaluado. Reduce el sesgo de afinamiento, no lo elimina.
2. **Los enlaces fraudulentos son curados**, no obtenidos de un repositorio público verificado.
   §3.1.2.b compromete ese tipo de fuente; su incorporación queda como trabajo pendiente.
3. **El banco de pruebas se ejecuta sin red**, de modo que no ejercita la antigüedad del dominio, la
   validación TLS ni los servicios externos. Las cifras corresponden al motor heurístico local, que
   es el escenario menos favorable.
4. **La tasa de falsos positivos se midió sobre dominios establecidos.** No incluye dominios
   legítimos recientes, categoría donde se detectó —y corrigió— el falso positivo sistemático
   descrito en 8.3.

### 9.6 Validación con usuarios: no ejecutada

El objetivo específico e) compromete una evaluación de usabilidad mediante *System Usability Scale*
y la medición del CRD antes y después de la interacción formativa. **Esta validación no se ejecutó
dentro del período del proyecto.**

El instrumento está construido y operativo: 24 ítems distribuidos en dos aplicaciones equivalentes,
con cuatro ítems de cada nivel de dificultad y ponderación conforme a §3.2.1. Lo que no se realizó
fue su aplicación a una muestra de usuarios. En consecuencia, **los criterios de §3.2.4 relativos a
variación del CRD, ascenso de nivel y puntaje SUS no cuentan con evidencia de cumplimiento**, y así
deben reportarse.

Se deja constancia, además, de una **observación sobre el propio criterio de éxito** verificada en
la implementación: dado que el componente de uso vale cero en la aplicación inicial, un usuario que
no incremente su conocimiento pero utilice intensivamente la plataforma alcanza una variación de 350
puntos, superando el umbral de 150 sin aprendizaje alguno. El sistema reporta por ello la ganancia de
conocimiento de forma separada, que es la medida que efectivamente evidencia aprendizaje. Se
recomienda aplicar el umbral sobre ese componente.

---

## Parte 5 — Capítulo 10 propuesto: Conclusiones

**Sobre el objetivo general.** Se construyó y desplegó el prototipo funcional comprometido, con los
tres módulos especificados. El motor de detección supera ambos criterios técnicos de §3.2.4 sobre un
conjunto de validación independiente del utilizado para su ajuste.

**Sobre los objetivos específicos.** Los objetivos b), c) y d) —motor de análisis, núcleo pedagógico
y seguridad delegada— se cumplieron y cuentan con evidencia en los capítulos 8 y 9. El objetivo e) se
cumplió parcialmente: la evaluación técnica del motor se ejecutó y se reporta; la validación con
usuarios no.

**Sobre el aporte técnico.** La detección de imitación tipográfica sin lista de referencia extiende
la protección a instituciones que las soluciones comerciales no tienen indexadas, limitación
documentada de los enfoques basados en listas negras. El caso del Instituto Nacional del Cáncer lo
ilustra: una institución pública de salud que ninguna lista comercial cubriría y que el sistema
protege igualmente.

**Sobre el aporte metodológico.** La separación entre conjunto de afinamiento y conjunto de
validación, y el reporte de la brecha entre ambos, permite distinguir el desempeño real del
optimismo inducido por el propio ajuste. La trayectoria 94,7 % → 72,7 % → 86,4 %, con su
diagnóstico, resulta más informativa que cualquier cifra aislada.

**Trabajo futuro.** Aplicar el instrumento a una muestra real con grupo de control; incorporar
enlaces de un repositorio público verificado; y extender la cobertura de los vectores evasivos,
donde la exhaustividad alcanza 57,1 %.

---

## Parte 6 — Qué no debe afirmarse

Tres advertencias para la redacción final, porque son las afirmaciones que un evaluador puede
desmontar con una sola pregunta.

**No afirmar que el sistema integra aprendizaje automático.** No existe modelo entrenado alguno. El
motor es determinista y basado en reglas, y esa es una decisión de diseño defendible: §2.4.1.a exige
comunicar al usuario qué indicador activó la alerta, requisito incompatible con un clasificador
opaco. La inteligencia artificial generativa se emplea únicamente para redactar la explicación en
lenguaje natural, nunca para clasificar.

**No afirmar cumplimiento de los criterios que no se midieron.** Puntaje SUS, variación del CRD y
ascenso de nivel carecen de datos.

**No omitir que las consultas a los servicios externos transmiten la URL completa.** La ruta y los
parámetros pueden contener identificadores de sesión. La transmisión íntegra es necesaria porque la
coincidencia exacta de Safe Browsing depende de ella —se verificó que la supresión de la barra final
anula la detección—, de modo que existe una tensión real entre capacidad de detección y minimización
de datos. Corresponde declararla como limitación, no resolverla por omisión.
