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

---

## Parte 7 — Objetivos específicos: un verbo por objetivo (#139, #143, #145)

El profesor marcó que un objetivo lleva **un solo verbo**. Hoy los objetivos b), c) y d) empiezan
con «Diseñar e implementar», que son dos.

| | Hoy | Propuesto |
|---|---|---|
| a) | Diagnosticar… | **Diagnosticar** — sin cambios |
| b) | ~~Diseñar e implementar~~ el motor de análisis heurístico | **Implementar** el motor de análisis heurístico de enlaces (URL Analyzer) |
| c) | ~~Diseñar e implementar~~ el núcleo pedagógico | **Construir** el núcleo pedagógico gamificado (Cyber-Academy) |
| d) | ~~Diseñar e implementar~~ el módulo de seguridad delegada | **Desarrollar** el módulo de seguridad delegada (Red Protegida) |
| e) | Validar… | **Validar** — sin cambios |

El verbo elegido no es arbitrario: el diseño de los tres módulos ya está en los capítulos 5 a 7,
así que lo que el objetivo compromete es la construcción, no el diseño. Eliminar «Diseñar» corrige
la redacción y además evita duplicar lo que otros capítulos ya cubren.

En el objetivo e) conviene revisar también el cuerpo, que arrastra el mismo problema
(«Evaluar la usabilidad […] **y medir** la efectividad pedagógica»). Propuesta:

> Validar el prototipo funcional integrado mediante pruebas con usuarios y evaluación técnica.
> La validación comprende tres mediciones: usabilidad del cliente web mediante el instrumento
> System Usability Scale, desempeño del motor de detección sobre conjuntos etiquetados, y
> efectividad pedagógica mediante la variación del Coeficiente de Resiliencia Digital conforme a
> los criterios de la sección 3.2.

---

## Parte 8 — El conjunto de evaluación (#144)

El comentario señala tres defectos en el objetivo b). Los tres tienen arreglo.

### 8.1 La frase duplicada

El texto actual repite palabra por palabra un fragmento completo:

> …y **evaluar su desempeño mediante las métricas de precisión, exhaustividad y tasa de falsos
> positivos** sobre un conjunto controlado de enlaces y **evaluar su desempeño mediante las
> métricas de precisión, exhaustividad y tasa de falsos positivos** construido a partir de
> repositorios públicos…

Es un error de edición: la segunda aparición debe eliminarse.

### 8.2 Redacción propuesta para el objetivo b)

> **Implementar** el motor de análisis heurístico de enlaces (URL Analyzer).
>
> Construir un algoritmo de clasificación que combine reglas heurísticas propias sobre la
> estructura de la URL con consultas a servicios externos de inteligencia de amenazas (Google Safe
> Browsing y VirusTotal) y con una base comunitaria de firmas alimentada por los reportes de los
> usuarios, orientado a los patrones de fraude del escenario chileno, y evaluar su desempeño
> mediante las métricas de precisión, exhaustividad y tasa de falsos positivos sobre dos conjuntos
> etiquetados independientes, cuya composición se especifica en la sección 3.2.4.

### 8.3 Especificación del conjunto de evaluación

El comentario pide fuentes concretas, tamaño, proporción y fecha de captura. Como la evaluación ya
se ejecutó, estos datos son reales y no proyectados. Conviene incorporarlos a §3.2.4:

| | Conjunto de afinamiento | Conjunto de validación |
|---|---|---|
| Tamaño | 77 enlaces | 45 enlaces |
| Proporción fraude / legítimo | 38 / 39 | 22 / 23 |
| Proporción nacional / internacional | 69 / 8 | 41 / 4 |
| Fecha de captura | Octubre 2026 | Noviembre 2026 |

**Fuentes.** Los enlaces legítimos son dominios oficiales reales de instituciones chilenas,
seleccionados entre las entidades suplantadas con mayor frecuencia (banca, Servicio de Impuestos
Internos, administradoras de fondos de pensiones, empresas de reparto, casas comerciales y
organismos públicos), incluyendo deliberadamente instituciones fuera de la lista blanca del motor.
Los enlaces fraudulentos se construyeron a partir de las tipologías de campañas chilenas
documentadas en el corpus del objetivo a).

**Independencia entre conjuntos.** El segundo conjunto se construyó con un criterio de muestreo
distinto y sin reutilizar ninguna institución del primero, de modo que permita estimar el sesgo
introducido por el ajuste de los indicadores sobre el primer conjunto.

**Limitación declarada.** Los enlaces fraudulentos son casos curados, no capturas en vivo de un
repositorio público verificado. La incorporación de una muestra de ese tipo queda como trabajo
pendiente y así se reporta en §9.5.

### 8.4 El criterio de éxito que falta para la precisión

El comentario observa que §3.2.4 fija umbrales para exhaustividad y falsos positivos, pero no para
la precisión, pese a que el objetivo b) la compromete como métrica. Propuesta de criterio
adicional, coherente con los otros dos:

> Precisión igual o superior al 90 % sobre el conjunto de validación, de modo que a lo más uno de
> cada diez enlaces marcados como amenaza resulte ser legítimo.

El valor medido es de 100 %, de modo que el criterio se cumple con holgura; fijarlo igualmente es
necesario para que la métrica sea evaluable y no meramente informativa.

---

## Parte 9 — Marco legal: la Ley 21.719 (#203)

> **Advertencia.** Lo que sigue es orientación general para redactar §4.2.1, no asesoría jurídica.
> El texto vigente debe verificarse en la Biblioteca del Congreso Nacional y conviene revisión de
> un especialista en derecho de datos antes de afirmar cumplimiento. El informe no debe declarar
> que la aplicación «cumple la ley»: debe indicar qué obligaciones aborda y cuáles no.

### 9.1 Por qué el comentario es crítico

§4.2.1 fundamenta el tratamiento de datos en la **Ley 19.628**, de 1999. Esa ley está siendo
reemplazada por la **Ley 21.719**, publicada el 13 de diciembre de 2024 y con **entrada en plena
vigencia el 1 de diciembre de 2026** — es decir, antes del cierre del año académico en que se
presenta este informe. Citar únicamente la norma anterior deja el marco desactualizado justo en el
momento en que el estándar exigible cambia.

La nueva ley reforma íntegramente la 19.628, se alinea con el Reglamento General de Protección de
Datos europeo y crea la **Agencia de Protección de Datos Personales**, con facultades de
fiscalización y sanción. Las multas alcanzan hasta 20.000 UTM, y hasta el 4 % de los ingresos
anuales en casos de reincidencia grave.

### 9.2 Por qué afecta de lleno a la Red Protegida

El módulo de seguridad delegada es el punto sensible, por tres razones:

1. **Trata datos de terceros, no solo del titular de la cuenta.** El administrador accede a
   información sobre la conducta de otra persona: qué enlaces analizó y cuándo.
2. **El público objetivo incluye personas mayores y menores de edad.** La nueva ley otorga
   protección reforzada a los datos de niños, niñas y adolescentes.
3. **Genera un registro conductual persistente**, que es precisamente lo que la ley somete a los
   principios de licitud, finalidad y proporcionalidad.

### 9.3 Qué obligaciones ya aborda el diseño

Conviene reconocerlo, porque son decisiones de arquitectura y no declaraciones:

- **Minimización y finalidad.** La Red no almacena datos personales propios: el nombre y el
  teléfono se leen del perfil del usuario y se editan solo allí. Las alertas guardan el enlace, el
  nivel de riesgo y la fecha, no el contenido de la navegación.
- **Consentimiento mediante acto positivo.** La persona protegida se incorpora voluntariamente
  introduciendo un código de invitación; no es posible añadirla sin su participación.
- **Transparencia hacia el supervisado.** La persona protegida ve sus propias alertas, de modo que
  no existe supervisión oculta.
- **Derecho de supresión.** Salir del grupo, o ser retirado de él, elimina también las alertas
  asociadas a esa persona.
- **Control de acceso.** Las políticas de seguridad a nivel de fila restringen cada consulta al
  grupo del administrador que la realiza.
- **Seguridad desde el diseño.** Las credenciales no se almacenan de forma reversible y el tráfico
  viaja cifrado.

### 9.4 Qué obligaciones NO están cubiertas

Deben declararse como limitaciones, no omitirse:

- **No hay registro de consentimiento.** Unirse con un código es un acto positivo, pero el sistema
  no conserva constancia de qué se consintió, cuándo ni para qué finalidad. La fiscalización mira
  evidencia operativa, no solo el diseño.
- **No hay verificación de edad ni consentimiento parental.** Si una persona menor de edad se
  incorpora a un grupo, el sistema no lo distingue ni recaba autorización de su representante
  legal, pese a que §2.4.1.b menciona expresamente a menores entre los supervisados.
- **No hay portabilidad.** El titular no puede exportar sus datos.
- **No hay detección ni procedimiento de notificación de brechas**, que la nueva ley exige sin
  dilación indebida.
- **No hay registro de auditoría** sobre qué administrador accedió a qué información y cuándo.
- **No se evaluó la necesidad de designar un delegado de protección de datos.**

### 9.5 Redacción propuesta para §4.2.1

> El tratamiento de datos personales en Chile se rige por la Ley N.º 19.628 sobre protección de la
> vida privada, actualmente en proceso de reemplazo por la **Ley N.º 21.719**, publicada el 13 de
> diciembre de 2024 y con entrada en plena vigencia el 1 de diciembre de 2026. Esta última reforma
> íntegramente el régimen anterior, se alinea con el estándar del Reglamento General de Protección
> de Datos europeo y crea la Agencia de Protección de Datos Personales con facultades de
> fiscalización y sanción.
>
> El diseño de Fishin't se orientó por el estándar de la nueva ley y no solo por el de la norma que
> reemplaza, dado que su entrada en vigencia es anterior al despliegue previsto de la solución. El
> módulo Red Protegida concentra las exigencias más altas, por tratar datos conductuales de
> terceros dentro de un público que incluye personas mayores y menores de edad, categoría esta
> última sujeta a protección reforzada.
>
> La arquitectura aborda los principios de minimización y finalidad (la Red no almacena datos
> personales propios y las alertas registran únicamente el enlace, su nivel de riesgo y la fecha),
> la incorporación mediante acto positivo del titular, la transparencia hacia la persona
> supervisada —que accede a sus propias alertas, de modo que no existe supervisión oculta—, el
> derecho de supresión y el control de acceso por fila.
>
> Quedan fuera del alcance de esta versión, y se declaran como limitaciones de cumplimiento, el
> registro formal de consentimiento, la verificación de edad y el consentimiento del representante
> legal para personas menores de edad, la portabilidad de los datos del titular, el procedimiento
> de detección y notificación de brechas, el registro de auditoría de accesos y la evaluación sobre
> la necesidad de designar un delegado de protección de datos. Su implementación es condición
> previa a cualquier despliegue en producción con usuarios reales y requiere revisión jurídica
> especializada.

Ese último párrafo es el que conviene no suavizar: un prototipo académico puede tener brechas de
cumplimiento declaradas, pero no puede afirmar que cumple.

---

## Parte 10 — Afirmaciones sin respaldo (#21, #28, #116, #239)

> **Nota sobre el método.** En esta sección no se inventa ninguna cita. Donde hace falta una fuente
> que el informe no tiene, se dice explícitamente «hay que buscarla» en vez de rellenar con una
> referencia plausible. Donde la afirmación puede sostenerse con datos que el informe **ya** cita o
> con mediciones del propio sistema, se reformula sobre esa base.

### 10.1 #21 — El contexto nacional (§1.1)

**Qué dice hoy.** Que, «conforme a las métricas provistas por el CSIRT gubernamental y diversos
informes de corporaciones de ciberseguridad», Chile «se sitúa de manera persistente en los primeros
lugares de los indicadores regionales». Y que la causa «no es una infraestructura deficiente, sino
un desajuste estructural en la alfabetización digital».

**Los dos problemas.** La atribución es genérica —«diversos informes» no es una fuente— y el
ranking regional no trae cifra. Pero el más serio es el segundo: se afirma una **causa**, y una
causa necesita evidencia que el informe no presenta.

**Qué hacer.** Dos caminos, y conviene tomarlos juntos:

1. **Reemplazar el ranking por la cifra que el informe ya tiene.** Kaspersky (2025) y los 37,7
   millones de detecciones en Chile aparecen citados en §1.3 y §2.7. Es un dato concreto, con
   fuente, y sostiene la magnitud sin necesidad de un ranking.
2. **Degradar la causa a hipótesis.** Es legítimo plantear la brecha de alfabetización como la
   explicación que el proyecto asume; no lo es presentarla como hecho establecido.

> Si quieren conservar la afirmación de «primeros lugares», **hace falta buscar la fuente
> específica**: un informe regional con ranking explícito, con año y cifra. No basta con citar al
> CSIRT en general. Si no aparece, el camino es eliminarla.

**Redacción propuesta:**

> La situación en Chile expone un escenario complejo. Durante 2025, Kaspersky reportó el bloqueo de
> 37,7 millones de intentos de phishing dirigidos a usuarios en el país (Kaspersky, 2025), cifra
> que da cuenta de la magnitud del fenómeno. El presente proyecto parte de la premisa de que esta
> exposición no se explica principalmente por deficiencias de infraestructura tecnológica, sino por
> una brecha en la alfabetización digital de la población: mientras las instituciones financieras y
> las grandes organizaciones capacitan sistemáticamente a su personal, los usuarios particulares
> carecen de formación equivalente. Esta premisa orienta el diseño de la solución y su validación
> empírica queda fuera del alcance de este trabajo.

El cambio clave es «parte de la premisa» en lugar de afirmarlo. Una premisa declarada no exige
prueba; una afirmación causal sí.

### 10.2 #28 — «La gran mayoría de los encuestados» (§1.3)

**Qué dice hoy.** Tras la cifra de Kaspersky: «La gran mayoría de los encuestados manifestó haber
sido destinatario de enlaces fraudulentos o haber resultado afectado por alguna estafa informática
(Central Web, 2026)».

**El problema.** No se identifica la encuesta, la muestra ni el instrumento, y Central Web es un
medio de comunicación, no la fuente primaria del estudio.

**Qué hacer.** La recomendación es **eliminar la frase**, no arreglarla. Razón: la oración anterior
ya trae un dato sólido y con fuente (37,7 millones de detecciones). La frase sobre «encuestados»
no agrega evidencia nueva y sí agrega una vulnerabilidad: es el tipo de afirmación que un evaluador
puede desmontar pidiendo la ficha técnica.

**Redacción propuesta:**

> ¿Cuánto sucede? Se trata de una problemática de alcance masivo: solo durante 2025, Kaspersky
> reportó el bloqueo de 37,7 millones de intentos de phishing dirigidos a usuarios en Chile
> (Kaspersky, 2025). Esa magnitud evidencia un estado de exposición generalizado y la falta de
> herramientas de verificación accesibles en el momento en que el usuario enfrenta el enlace.

> Si el equipo quiere conservar el dato de percepción, **debe ubicar el estudio primario** —con
> institución responsable, año, tamaño muestral y método— y citarlo directamente, no a través del
> medio que lo difundió.

### 10.3 #116 — «Consume mínimos recursos de hardware» (§2.7.3)

Este es el único de los cuatro donde **no hace falta moderar: se puede medir**.

**Qué dice hoy.** «El proyecto demuestra su pertinencia técnica al integrar […] dentro de un
entorno móvil optimizado que consume mínimos recursos de hardware (batería, procesamiento y datos
móviles)».

**El problema.** «Demuestra» exige evidencia, y de los tres recursos mencionados **ninguno fue
medido**. En particular, el consumo de batería no se midió en absoluto.

**Lo que sí se puede afirmar, con medición.** El proceso de construcción del sistema reporta el
peso exacto de lo que el usuario descarga:

| Vista | Carga inicial |
|---|---|
| Código compartido por toda la aplicación | 87,4 kB |
| Vista más liviana | 88,2 kB |
| Vista del analizador (la más pesada) | 154 kB |
| Mediana de las vistas | ≈ 140 kB |

A esto se suman dos hechos **arquitectónicos**, que no requieren medición porque se derivan del
diseño:

- **No hay instalación.** La aplicación no descarga un paquete nativo, que en una solución de
  seguridad convencional ocupa decenas de megabytes.
- **No hay proceso residente.** A diferencia de un agente antivirus de los descritos en §1.3.1
  —cuya crítica central en ese mismo apartado es el «consumo elevado de recursos de hardware»—,
  Fishin't solo se ejecuta mientras el usuario lo tiene abierto y el análisis ocurre en el
  servidor, no en el dispositivo.

**Redacción propuesta:**

> El sistema integra servicios de inteligencia de amenazas y un motor heurístico propio dentro de
> un cliente deliberadamente liviano. La carga inicial de la vista más pesada —el analizador de
> enlaces— alcanza 154 kB, con 87,4 kB de código compartido por toda la aplicación. A diferencia
> de las suites de seguridad convencionales analizadas en §1.3.1, cuya principal limitación
> operativa es el consumo de recursos del dispositivo, la solución no requiere instalación de un
> paquete nativo ni mantiene procesos residentes: el análisis se ejecuta en el servidor y el
> cliente solo opera mientras el usuario lo utiliza. El consumo de batería y de datos móviles en
> uso sostenido no fue medido y se identifica como trabajo pendiente.

Nótese que la última frase **declara lo que no se midió**. Eso es lo que convierte el párrafo en
defendible: el resto son cifras verificables ejecutando la construcción del proyecto.

### 10.4 #239 — El dato que parecía debilitar la decisión (§4.2.3)

Este comentario es el más agudo de los cuatro y merece una respuesta de fondo, no un ajuste de
redacción.

**Qué observa el profesor.** El texto usa un dato —solo la mitad de las personas mayores de 60 años
posee teléfono inteligente (Observatorio del Envejecimiento UC–Confuturo, 2024)— para justificar
una PWA **móvil**. Pero si la mitad del segmento prioritario no tiene smartphone, una aplicación
móvil no les llega. El dato, tal como está empleado, **argumenta en contra** de la decisión.

**Tiene razón, y el argumento está mal construido.** Pero la decisión sí es defendible: lo que
falla es el razonamiento, no la elección técnica. Dos hechos lo sostienen:

1. **Una PWA no es una aplicación móvil: es una aplicación web.** Se ejecuta en cualquier navegador,
   incluido el de un computador de escritorio. Para la mitad del segmento que no tiene smartphone,
   la PWA sigue siendo alcanzable; una aplicación nativa compilada para iOS y Android **no lo
   sería**. El dato, correctamente leído, es un argumento **a favor** de la web y en contra del
   desarrollo nativo que se descartó.
2. **La arquitectura ya contempla que parte del segmento no opere la tecnología por sí mismo.** Ese
   es exactamente el propósito del módulo Red Protegida descrito en §2.4.1.b: el integrante con
   mayor competencia digital del grupo familiar es quien administra la protección. El proyecto no
   supone que cada adulto mayor manejará la herramienta; supone que alguien de su círculo lo hará
   por él.

**Redacción propuesta:**

> En primer lugar, elimina la barrera de instalación: el acceso mediante navegador evita la
> búsqueda, descarga y concesión de permisos en una tienda de aplicaciones. Esta decisión adquiere
> particular relevancia a la luz de la cobertura real del segmento prioritario: solo alrededor de
> la mitad de las personas mayores de 60 años en Chile posee un teléfono inteligente y un 21 %
> maneja ClaveÚnica (Observatorio del Envejecimiento UC–Confuturo, 2024). Lejos de debilitar la
> elección, ese dato la fundamenta: una aplicación web progresiva se ejecuta en cualquier
> navegador, incluido el de un equipo de escritorio, mientras que un desarrollo nativo compilado
> para iOS y Android habría excluido por completo a la fracción del segmento que no dispone de
> teléfono inteligente. A ello se suma que el módulo Red Protegida (§2.4.1.b) no presupone que cada
> persona mayor opere la herramienta: contempla que lo haga el integrante del grupo con mayor
> competencia digital.

> Queda pendiente un ajuste de coherencia: si la cobertura de escritorio es parte del argumento,
> conviene revisar que el informe no describa la solución como «exclusivamente móvil» en otros
> apartados. El diseño es *mobile-first*, que no es lo mismo que *solo móvil*.

### 10.5 Resumen de la sección

| Comentario | Tratamiento | ¿Requiere buscar fuente? |
|---|---|---|
| #21 | Reemplazar ranking por cifra ya citada; degradar la causa a premisa | Solo si se conserva «primeros lugares» |
| #28 | Eliminar la frase; el dato de Kaspersky basta | Solo si se conserva el dato de percepción |
| #116 | **Medir en vez de moderar**: cifras reales de carga + hechos arquitectónicos | No |
| #239 | Reconstruir el argumento: el dato favorece a la web frente a lo nativo | No |

Tres de los cuatro se resuelven sin fuentes nuevas. El único que las necesita es #21, y solo si el
equipo decide conservar la afirmación del ranking regional.

---

## Parte 11 — Diseño de validación y componentes del CRD (#146, #149)

### 11.1 #149 — El componente D no mide resiliencia

El comentario observa que los topes y las ponderaciones carecen de justificación, y agrega una
objeción de fondo: **D depende de la exposición a amenazas, no de la resiliencia**. Esa objeción es
correcta y obliga a modificar la fórmula, no solo a justificarla.

**Por qué es correcta.** El componente de uso se define hoy como:

> U = mín(100; 40·mín(A,15)/15 + 30·mín(R,8)/8 + 30·mín(D,10)/10)

donde A son los enlaces analizados, R las amenazas reportadas y D las amenazas detectadas. A y R
son **conductas**: la persona decide analizar y decide reportar. D no lo es. D cuenta cuántos de
los enlaces que la persona analizó resultaron peligrosos, y eso depende de qué le llegó al teléfono,
no de lo que hizo.

Dos usuarios con conducta idéntica —quince enlaces analizados cada uno— obtienen puntajes distintos
si a uno le llegaron diez estafas y al otro ninguna. El indicador premia haber sido blanco de
delincuentes, que es precisamente lo contrario de lo que pretende medir. El problema no es de
calibración: es de validez de constructo.

**Corrección propuesta.** Eliminar D y redistribuir su peso entre las dos conductas que sí dependen
del usuario:

> U = mín(100; 55·mín(A,15)/15 + 45·mín(R,8)/8)

El rango de U permanece entre 0 y 100, de modo que la escala del CRD y sus cortes de interpretación
no requieren recalibración. La ponderación 55/45 reconoce que analizar es la conducta preventiva
básica, accesible a cualquier usuario, mientras que reportar exige una iniciativa adicional y
beneficia a terceros.

> Esta corrección implica una modificación en el código: la función que calcula el componente de
> uso. Es un cambio de una línea y no altera ninguna otra parte del sistema.

**Sobre los topes y las ponderaciones restantes.** Aquí la respuesta honesta no es justificarlos,
porque no hay con qué: se fijaron por juicio de los autores a partir del volumen de interacción
esperado, no por evidencia. El propio comentario ofrece la salida correcta —«declararlos parámetros
a calibrar»— y es la que conviene tomar.

**Redacción propuesta para §3.2.1:**

> Los topes de cada actividad (quince enlaces analizados y ocho amenazas reportadas) y las
> ponderaciones entre componentes (65 % conocimiento y 35 % uso) constituyen **parámetros de
> diseño establecidos por juicio experto**, no derivados de evidencia empírica previa. Su función
> es doble: evitar que la repetición mecánica de una misma acción domine el indicador, y expresar
> la premisa central del proyecto, según la cual la resiliencia descansa principalmente en la
> competencia adquirida por la persona y solo de manera complementaria en su uso de la
> herramienta. Se declaran explícitamente como parámetros sujetos a calibración: su ajuste
> requiere datos de uso real que este trabajo no alcanzó a recoger, y constituye una línea de
> trabajo posterior.

### 11.2 #146 — El protocolo de validación

El comentario identifica cinco carencias en el objetivo e). Se abordan una por una, y al final se
declara cuál es la situación real.

#### a) Tamaño y criterio de selección de la muestra

**Propuesta.** Muestreo intencionado, no probabilístico, de entre doce y dieciséis participantes
distribuidos en los dos perfiles que define §2.2.1:

| Estrato | Perfil | Participantes |
|---|---|---|
| 1 | Personas de 55 años o más, con uso de banca digital | 6 a 8 |
| 2 | Usuarios financieros emergentes, 18 a 35 años | 6 a 8 |

El rango responde al instrumento SUS, cuyo promedio se estabiliza razonablemente a partir de una
docena de respuestas. **Debe declararse que es una muestra pequeña y no probabilística**: permite
caracterizar la experiencia de uso, no generalizar a la población.

#### b) Grupo control

El comentario es exacto: un diseño pre-post sin control no permite atribuir el cambio al módulo
formativo, porque el efecto de práctica —simplemente haber respondido antes un instrumento
parecido— produce mejoras por sí solo.

**Dos caminos, y conviene ser realista sobre cuál es viable.** Con una muestra de doce a dieciséis
personas, dividirla en dos grupos deja seis u ocho por rama, cantidad insuficiente para inferencia
estadística. Añadir un grupo control no rescataría la causalidad; solo daría la apariencia de un
experimento que la muestra no sostiene.

**Recomendación.** Declarar el diseño por su nombre: **preexperimental de un solo grupo con
medición antes y después**, y enunciar expresamente las amenazas a la validez interna que ello
implica —efecto de práctica, maduración e instrumentación—. Reportar la variación observada como
resultado **descriptivo**, sin atribuirla causalmente al módulo. Un diseño con grupo control y
muestra suficiente queda como trabajo posterior.

Esta es la opción honesta. Un diseño preexperimental declarado como tal es metodológicamente
aceptable en un trabajo de prototipo; uno presentado como experimental sin serlo, no.

#### c) Equivalencia de las formas pre y post

**Aquí hay un hallazgo de la revisión del código.** El sistema administra siempre la forma A como
pre-test y la forma B como post-test, en orden fijo. Eso significa que, si una de las dos formas
resulta más fácil, esa diferencia queda **perfectamente confundida** con el aprendizaje que se
pretende medir: no habría manera de distinguir una mejora real de un instrumento más benévolo.

**Solución: contrabalanceo.** Asignar aleatoriamente a la mitad de los participantes la forma A
como pre-test y a la otra mitad la forma B, invirtiendo el orden en la segunda aplicación. Con eso,
cualquier diferencia residual entre las formas se distribuye entre ambos momentos y deja de
sesgar el resultado.

Es la corrección más rentable de toda esta sección: no cuesta nada, no requiere participantes
adicionales y elimina un factor de confusión que de otro modo invalidaría la medición. Requiere un
ajuste menor en el código, que hoy fija el orden.

Las dos formas ya comparten estructura —cuatro ítems de cada nivel de dificultad, con la misma
ponderación— y fueron construidas sobre las mismas tipologías de suplantación. Eso respalda su
equivalencia de contenido, aunque no la demuestra psicométricamente; el contrabalanceo hace
innecesaria esa demostración.

#### d) Consentimiento informado y resguardos éticos

Deben especificarse, con particular atención al estrato de personas mayores:

- **Consentimiento informado por escrito**, en lenguaje sencillo y sin tecnicismos, que indique el
  propósito del estudio, qué datos se registran, cuánto dura la sesión y quién tendrá acceso a los
  resultados.
- **Participación voluntaria con derecho a retirarse** en cualquier momento y sin expresión de
  causa, incluyendo el retiro de los datos ya entregados.
- **Anonimización**: los resultados se analizan de forma agregada y no se vinculan a la identidad
  de los participantes.
- **Minimización**: no se recogen datos sensibles ni información que exceda lo necesario para las
  dos mediciones.
- **Acompañamiento durante la sesión**, de modo que ningún participante quede expuesto a la
  sensación de estar siendo evaluado personalmente. Conviene enunciar explícitamente que lo que se
  evalúa es la herramienta, no la persona.

Estos resguardos conectan con las obligaciones de la Ley 21.719 descritas en la Parte 9: el
registro del consentimiento es, precisamente, una de las brechas de cumplimiento allí declaradas.

#### e) La situación real

Por coherencia con §9.6, debe quedar claro que **este protocolo especifica cómo se realizaría la
validación, no cómo se realizó**. El instrumento está construido y operativo; su aplicación a una
muestra no se ejecutó dentro del período del proyecto.

**Redacción propuesta para cerrar el apartado:**

> El protocolo de validación aquí especificado no alcanzó a ejecutarse dentro del período del
> proyecto. El instrumento de medición se encuentra construido y operativo —veinticuatro ítems
> distribuidos en dos formas equivalentes—, pero no fue administrado a una muestra de
> participantes. En consecuencia, los criterios de éxito definidos en §3.2.4 relativos a variación
> del Coeficiente de Resiliencia Digital, ascenso de nivel y puntaje SUS no cuentan con evidencia
> de cumplimiento. Su aplicación conforme al protocolo descrito constituye la primera línea de
> trabajo posterior.

### 11.3 Resumen de la sección

| Carencia señalada | Tratamiento |
|---|---|
| Componente D mide exposición, no resiliencia | **Eliminarlo** y redistribuir su peso (55/45) |
| Topes y ponderaciones sin justificación | Declararlos parámetros de diseño sujetos a calibración |
| Tamaño y criterio de muestra | 12 a 16 participantes, muestreo intencionado en dos estratos |
| Ausencia de grupo control | Declarar el diseño como **preexperimental** y no atribuir causalidad |
| Equivalencia de las formas pre/post | **Contrabalanceo aleatorio** del orden de administración |
| Consentimiento y ética | Protocolo explícito, con atención al estrato de personas mayores |
| Ejecución | Declarar que no se realizó (coherente con §9.6) |

Dos de estos requieren modificar el código: eliminar D del componente de uso, y aleatorizar el
orden de las formas del instrumento.

---

## Parte 12 — Metodología (#210, #214)

### 12.1 #210 — Las fases del HCD están mal atribuidas

**Qué dice hoy (§4.2.2):**

> Diseño Centrado en el Humano (HCD): Metodología de innovación orientada a modelar soluciones
> tecnológicas a partir del análisis profundo de las necesidades. **Estructurar** su ejecución en
> **cinco fases sucesivas: empatía, definición, ideación, prototipado y validación**. […] (IDEO, 2015).

**Dos errores, y el segundo es de fondo.**

El primero es gramatical: «Estructurar» es infinitivo y deja la oración sin verbo conjugado. Debe
decir «Estructura».

El segundo es de atribución. Las cinco fases enumeradas —empatizar, definir, idear, prototipar y
evaluar— corresponden al modelo de *Design Thinking* difundido por la escuela de diseño de
Stanford, no a la guía de IDEO que el informe cita. **The Field Guide to Human-Centered Design**
(IDEO, 2015) organiza el proceso en **tres fases: Inspiración, Ideación e Implementación**. Se está
citando una fuente que dice otra cosa.

**Dos caminos.**

1. **Usar las tres fases de IDEO.** Es la opción recomendada: la referencia ya está en la
   bibliografía, no requiere fuentes nuevas y elimina la discrepancia.
2. **Conservar las cinco fases** y atribuirlas a su origen real, añadiendo la referencia
   correspondiente a la escuela de diseño de Stanford. Esto obliga a incorporar una referencia que
   el informe hoy no tiene, y habría que ubicarla y citarla correctamente.

**Redacción propuesta (camino 1):**

> Diseño Centrado en el Humano (Human-Centered Design, HCD): metodología de innovación que modela
> soluciones a partir del análisis profundo de las necesidades de las personas. Estructura su
> ejecución en tres fases sucesivas —inspiración, ideación e implementación—, en las que la
> comprensión del contexto precede a la definición de la solución y el prototipado se somete
> iterativamente a la validación de los propios usuarios (IDEO, 2015). Constituye un enfoque de
> alta idoneidad para aplicaciones orientadas a mitigar brechas de alfabetización digital, donde
> la arquitectura de la experiencia de usuario determina la tasa de adopción.

> **Revisar también §5.2 y la nota de la Figura 1**, que citan a IDEO (2015) para el enfoque
> general. Esas menciones son correctas, pero conviene verificar que ninguna repita el esquema de
> cinco fases.

### 12.2 #214 — La matriz gana por construcción

Este es el comentario metodológicamente más serio de los dos, porque no se corrige reescribiendo
una frase: el problema está en cómo está armada la tabla.

**Qué observa el profesor.** La Tabla 3 compara cuatro columnas —Cascada, SCRUM, HCD e Híbrido
SCRUM+HCD— y a la columna del híbrido le asigna, en cada criterio, el máximo de sus dos
componentes:

| Criterio | Peso | Cascada | SCRUM | HCD | Híbrido |
|---|---|---|---|---|---|
| Validación constante con el usuario | 25 % | 1 | 3 | 5 | **5** |
| Capacidad de adaptación al cambio | 20 % | 1 | 5 | 4 | **5** |

Construida así, **la columna del híbrido no puede perder**: por definición vale lo mismo que el
mejor de sus componentes en cada fila. Que obtenga el puntaje más alto no es un hallazgo, es una
consecuencia aritmética de cómo se llenó la tabla. El comentario lo resume con precisión: el
puntaje no fundamenta la elección.

El profesor señala además que en rigor documental el híbrido recibe un 4, **superior a ambos
componentes**. Eso es indefendible sin explicación: una combinación no puede superar a las dos
partes que la forman salvo que se describa el mecanismo de sinergia que lo produce.

Y hay un tercer problema que el comentario también anota: **la matriz no registra ningún costo de
integración**. Combinar dos marcos tiene costos reales —ceremonias duplicadas, sobrecarga de
coordinación, un equipo de tres personas asumiendo a la vez los roles de SCRUM y el trabajo de
campo del HCD— que en la tabla simplemente no existen.

**La corrección propuesta.** Sacar el híbrido de la matriz. No es una cuarta alternativa: es una
síntesis de dos de ellas, y ponerla a competir contra sus propios componentes es un error de
categoría.

Lo interesante es que **el argumento queda más fuerte, no más débil**. Una matriz de tres columnas
muestra lo siguiente:

| Criterio | Peso | Cascada | SCRUM | HCD |
|---|---|---|---|---|
| Validación constante con el usuario | 25 % | 1 | 3 | **5** |
| Capacidad de adaptación al cambio | 20 % | 1 | **5** | 4 |
| Viabilidad en equipos reducidos | 15 % | … | … | … |
| Rigor en documentación académica | 15 % | … | … | … |
| Idoneidad para interfaces móviles | 15 % | … | … | … |
| Gestión de requerimientos evolutivos | 10 % | … | … | … |

Lo que fundamenta combinar SCRUM y HCD no es que la combinación puntúe más alto —eso sería
circular—, sino que **cada uno domina criterios distintos y ninguno cubre el conjunto**: SCRUM
lidera en adaptación al cambio y cadencia de construcción; el HCD lidera en validación con usuarios,
que es además el criterio de mayor peso. Un perfil de fortalezas complementarias es evidencia de
que conviene combinarlos; una columna que gana en todo no prueba nada.

**Redacción propuesta para el párrafo de cierre:**

> El resultado descarta el modelo en cascada, cuya única fortaleza relevante es el rigor
> documental, insuficiente frente al peso conjunto de la validación con usuarios y la adaptación
> al cambio. Entre los dos marcos restantes, la matriz no arroja un ganador único sino un **perfil
> de fortalezas complementarias**: SCRUM domina los criterios de adaptación y cadencia de
> construcción, mientras que el Diseño Centrado en el Humano domina la validación con usuarios,
> que concentra el mayor peso por ser el que sostiene el objetivo específico de mayor exigencia.
> Ninguno de los dos cubre por sí solo el conjunto de criterios.
>
> Esa complementariedad —y no un puntaje superior, que una combinación obtendría por construcción—
> es lo que fundamenta adoptar una estrategia híbrida. La decisión no es gratuita: integrar ambos
> marcos impone costos de coordinación, duplicación de instancias de planificación y una carga
> adicional sobre un equipo de tres integrantes que debe asumir simultáneamente los roles del marco
> ágil y el trabajo de campo del enfoque centrado en el humano. Esos costos se asumen
> deliberadamente, por considerarse menores que el riesgo de renunciar a la validación temprana con
> usuarios o a la capacidad de adaptación durante el ciclo.

El párrafo final es el que cambia la naturaleza del argumento: pasa de «el híbrido puntuó más» a
«los marcos son complementarios y asumimos el costo de integrarlos». Lo segundo es una decisión de
ingeniería fundamentada; lo primero era una tautología.

### 12.3 Resumen de la sección

| Comentario | Problema | Corrección |
|---|---|---|
| #210 | «Estructurar» sin conjugar | «Estructura» |
| #210 | Cinco fases atribuidas a IDEO, que usa tres | Adoptar las tres fases de IDEO (sin fuentes nuevas) |
| #214 | El híbrido toma el máximo de sus componentes y gana por construcción | Sacarlo de la matriz |
| #214 | Un 4 en rigor documental, superior a ambos componentes | Eliminar ese puntaje con la columna |
| #214 | Costos de integración ausentes | Declararlos en el párrafo de cierre |

Ninguna de estas correcciones requiere buscar fuentes nuevas, salvo que se decida conservar las
cinco fases del modelo de Stanford.

---

## Parte 13 — Diccionario de datos (#269)

El comentario observa que §7.3.1 contiene solo una imagen sin número, título ni fuente, y que falta
el diccionario propiamente tal. Lo que sigue se generó leyendo los tres archivos de esquema del
repositorio (`schema.sql`, `threat_signatures.sql`, `protected_networks.sql`), de modo que cada
tipo, restricción y clave es verificable contra el código fuente y no una transcripción aproximada.

La base de datos relacional comprende **siete tablas** en el esquema `public`, más la tabla
`auth.users` administrada por el proveedor de autenticación, a la que las demás referencian.

### 13.1 Diagrama de relaciones

```mermaid
erDiagram
    auth_users ||--o| profiles : "tiene perfil"
    auth_users ||--o{ url_scans : "registra"
    auth_users ||--o{ reports : "emite"
    auth_users ||--o{ protected_networks : "administra"
    auth_users ||--o{ network_members : "integra"
    auth_users ||--o{ member_alerts : "origina"
    protected_networks ||--o{ network_members : "agrupa"
    protected_networks ||--o{ member_alerts : "recibe"

    profiles {
        uuid id PK_FK
        text name
        text email
        text phone
        int crd_score
    }
    threat_signatures {
        uuid id PK
        text normalized_url UK
        text host
        text signature
        int report_count
    }
    protected_networks {
        uuid id PK
        text name
        uuid admin_id FK
        text invite_code UK
    }
    network_members {
        uuid id PK
        uuid network_id FK
        uuid user_id FK
        text role
    }
    member_alerts {
        uuid id PK
        uuid network_id FK
        uuid member_id FK
        text url
        text risk_level
        bool resolved
    }
```

`threat_signatures` no mantiene relación formal con las demás tablas: es un repositorio comunitario
cuyas filas no pertenecen a ningún usuario, decisión deliberada que se explica en 13.4.

### 13.2 Tablas

#### profiles — datos de perfil del usuario

Extiende `auth.users` con la información que la aplicación necesita mostrar. Se crea
automáticamente al registrarse, mediante el disparador descrito en 13.5.

| Columna | Tipo | Nulo | Predeterminado | Restricciones |
|---|---|---|---|---|
| id | UUID | No | — | PK; FK → `auth.users(id)` ON DELETE CASCADE |
| name | TEXT | No | — | — |
| email | TEXT | No | — | — |
| avatar_url | TEXT | Sí | — | — |
| phone | TEXT | Sí | — | Visible para el administrador de la red que integra |
| birth_date | DATE | Sí | — | — |
| crd_score | INTEGER | No | 500 | CHECK entre 0 y 1000 |
| created_at | TIMESTAMPTZ | No | NOW() | — |
| updated_at | TIMESTAMPTZ | No | NOW() | — |

#### url_scans — historial de análisis

| Columna | Tipo | Nulo | Predeterminado | Restricciones |
|---|---|---|---|---|
| id | UUID | No | uuid_generate_v4() | PK |
| user_id | UUID | Sí | — | FK → `auth.users(id)` ON DELETE CASCADE |
| url | TEXT | No | — | — |
| risk_score | INTEGER | No | — | CHECK entre 0 y 1000 |
| risk_level | TEXT | No | — | CHECK ∈ {safe, suspicious, dangerous} |
| reasons | JSONB | Sí | `[]` | — |
| metadata | JSONB | Sí | `{}` | — |
| created_at | TIMESTAMPTZ | No | NOW() | — |

#### reports — reportes de amenazas

| Columna | Tipo | Nulo | Predeterminado | Restricciones |
|---|---|---|---|---|
| id | UUID | No | uuid_generate_v4() | PK |
| user_id | UUID | Sí | — | FK → `auth.users(id)` ON DELETE SET NULL |
| url | TEXT | No | — | — |
| type | TEXT | No | — | CHECK ∈ {phishing, smishing, vishing, scam} |
| description | TEXT | Sí | — | — |
| status | TEXT | No | `pending` | CHECK ∈ {pending, confirmed, rejected} |
| created_at | TIMESTAMPTZ | No | NOW() | — |
| updated_at | TIMESTAMPTZ | No | NOW() | — |

El borrado de la cuenta pone `user_id` en nulo en lugar de eliminar la fila: el reporte ya benefició
a la comunidad y su valor no depende de quién lo emitió.

#### threat_signatures — base comunitaria de firmas

| Columna | Tipo | Nulo | Predeterminado | Restricciones |
|---|---|---|---|---|
| id | UUID | No | uuid_generate_v4() | PK |
| normalized_url | TEXT | No | — | **UNIQUE** |
| url | TEXT | No | — | — |
| host | TEXT | No | — | Indexado |
| signature | TEXT | No | — | Indexado; permite hallar enlaces estructuralmente similares |
| anatomy | JSONB | Sí | `{}` | — |
| risk_level | TEXT | No | `suspicious` | CHECK ∈ {safe, suspicious, dangerous} |
| score | INTEGER | No | 1 | CHECK entre 1 y 7 |
| report_count | INTEGER | No | 1 | Se incrementa en cada reporte del mismo enlace |
| created_at | TIMESTAMPTZ | No | NOW() | — |
| updated_at | TIMESTAMPTZ | No | NOW() | — |

La unicidad de `normalized_url` es lo que permite el comportamiento acumulativo: reportar un enlace
ya existente no duplica la fila, sino que incrementa su contador.

#### protected_networks — grupos de protección

| Columna | Tipo | Nulo | Predeterminado | Restricciones |
|---|---|---|---|---|
| id | UUID | No | uuid_generate_v4() | PK |
| name | TEXT | No | — | — |
| admin_id | UUID | No | — | FK → `auth.users(id)` ON DELETE CASCADE; indexado |
| invite_code | TEXT | No | — | **UNIQUE**; seis caracteres |
| created_at | TIMESTAMPTZ | No | NOW() | — |

#### network_members — pertenencia a un grupo

| Columna | Tipo | Nulo | Predeterminado | Restricciones |
|---|---|---|---|---|
| id | UUID | No | uuid_generate_v4() | PK |
| network_id | UUID | No | — | FK → `protected_networks(id)` ON DELETE CASCADE; indexado |
| user_id | UUID | No | — | FK → `auth.users(id)` ON DELETE CASCADE; indexado |
| role | TEXT | No | `protegido` | CHECK ∈ {admin, protegido} |
| display_name | TEXT | Sí | — | Solo respaldo; el nombre se lee de `profiles` |
| created_at | TIMESTAMPTZ | No | NOW() | — |
| — | — | — | — | **UNIQUE (network_id, user_id)**: impide duplicar la pertenencia |

#### member_alerts — alertas generadas por una persona protegida

| Columna | Tipo | Nulo | Predeterminado | Restricciones |
|---|---|---|---|---|
| id | UUID | No | uuid_generate_v4() | PK |
| network_id | UUID | No | — | FK → `protected_networks(id)` ON DELETE CASCADE |
| member_id | UUID | Sí | — | FK → `auth.users(id)` ON DELETE SET NULL |
| member_name | TEXT | Sí | — | Solo respaldo cuando la cuenta ya no existe |
| url | TEXT | No | — | — |
| risk_level | TEXT | No | — | CHECK ∈ {safe, suspicious, dangerous} |
| resolved | BOOLEAN | No | FALSE | — |
| created_at | TIMESTAMPTZ | No | NOW() | Indexado junto a `network_id`, en orden descendente |

### 13.3 Índices

| Índice | Tabla | Columnas | Consulta que optimiza |
|---|---|---|---|
| idx_url_scans_user_id | url_scans | user_id | Historial de un usuario |
| idx_url_scans_created_at | url_scans | created_at DESC | Análisis recientes |
| idx_reports_user_id | reports | user_id | Reportes de un usuario |
| idx_reports_status | reports | status | Reportes por estado de revisión |
| idx_threat_host | threat_signatures | host | Coincidencia por dominio |
| idx_threat_signature | threat_signatures | signature | Coincidencia por estructura |
| idx_network_admin | protected_networks | admin_id | Redes que administra un usuario |
| idx_member_user | network_members | user_id | Grupos a los que pertenece |
| idx_member_network | network_members | network_id | Integrantes de un grupo |
| idx_alert_network | member_alerts | network_id, created_at DESC | Panel de alertas del administrador |

### 13.4 Seguridad a nivel de fila

Las **siete** tablas tienen activado el control de acceso por fila. El tratamiento, sin embargo,
sigue dos estrategias distintas y la diferencia es deliberada.

**Estrategia A — políticas declarativas** (tablas del esquema base):

| Tabla | Política | Efecto |
|---|---|---|
| profiles | Users can view own profile | Cada usuario lee solo su perfil |
| profiles | Users can update own profile | Cada usuario modifica solo su perfil |
| url_scans | Users can view own scans | Cada usuario lee solo sus análisis |
| url_scans | Users can create own scans | Solo puede insertar los propios |
| reports | Authenticated users can create reports | Cualquier autenticado puede reportar |
| reports | Users can view own reports | Cada usuario lee solo sus reportes |
| threat_signatures | Threat signatures are public to read | **Lectura pública**: el analizador consulta la base comunitaria sin sesión |

**Estrategia B — sin políticas de lectura directa** (tablas de la Red Protegida):
`protected_networks`, `network_members` y `member_alerts` tienen el control activado pero **no
declaran políticas de SELECT**. Todo el acceso ocurre a través de funciones con privilegios de
definidor que verifican internamente la identidad de quien llama.

La razón es técnica y vale explicitarla: una política sobre `network_members` que consultara
`protected_networks` para decidir el acceso, combinada con una política sobre `protected_networks`
que consultara `network_members`, produce una recursión mutua que el motor no puede resolver.
Concentrar la verificación dentro de funciones evita ese ciclo y mantiene la lógica de autorización
en un solo lugar auditable.

### 13.5 Funciones almacenadas y disparador

Todas las funciones se ejecutan con privilegios de definidor y verifican internamente la identidad
del solicitante.

| Función | Parámetros | Propósito |
|---|---|---|
| handle_new_user | — | **Disparador** sobre `auth.users`: crea el perfil al registrarse |
| register_threat | url, normalized, host, signature, risk_level, score, anatomy | Inserta o incrementa una firma comunitaria |
| match_threats | normalized, signature, host | Devuelve coincidencia exacta o estructuralmente similar |
| gen_invite_code | — | Genera un código de invitación de seis caracteres |
| create_protected_network | name | Crea el grupo y registra al creador como administrador |
| join_protected_network | code, name | Incorpora al solicitante como persona protegida |
| get_my_network | — | Devuelve el grupo del solicitante y su rol |
| get_network_members | network_id | Integrantes, solo para el administrador del grupo |
| get_network_alerts | network_id | Alertas del grupo, solo para su administrador |
| get_my_alerts | — | Alertas propias de la persona protegida |
| record_member_alert | url, risk, name | Registra una alerta en los grupos del solicitante |
| resolve_member_alert | alert_id | Marca una alerta como atendida |
| leave_protected_network | network_id | Abandona el grupo y elimina sus alertas |
| remove_network_member | network_id, user_id | Retira a un integrante, solo el administrador |
| delete_protected_network | network_id | Elimina el grupo completo |

El disparador `on_auth_user_created` se ejecuta después de cada inserción en `auth.users`.

### 13.6 Estado de uso: lo declarado frente a lo utilizado

Esta sección existe porque un diccionario que enumere estructuras sin indicar si se usan induce a
error. La revisión del código fuente arroja lo siguiente:

| Estructura | Estado |
|---|---|
| profiles | **En uso.** Lectura y escritura directa desde el cliente |
| reports | **En uso.** Inserción al reportar |
| threat_signatures | **En uso**, exclusivamente a través de `register_threat` y `match_threats` |
| protected_networks, network_members, member_alerts | **En uso**, exclusivamente a través de sus funciones |
| **url_scans** | **Declarada y no utilizada.** El historial de análisis no se persiste |
| profiles.crd_score | **Reservada.** El coeficiente se calcula en el cliente y no se guarda |
| profiles.birth_date, profiles.avatar_url | **Declaradas y no utilizadas** |

**Sobre `url_scans`.** La tabla, sus dos índices y sus dos políticas existen, pero ninguna vista
escribe en ella: el resultado de cada análisis se muestra y se descarta, y los contadores de
actividad viven en el almacenamiento local del navegador. Esto tiene dos consecuencias que conviene
declarar en lugar de omitir:

1. El componente de uso del Coeficiente de Resiliencia Digital se calcula sobre datos locales, de
   modo que **no sobrevive a un cambio de dispositivo ni al borrado de los datos del navegador**.
2. No existe un historial de análisis consultable por el usuario.

Persistir los análisis es una decisión abierta y no meramente una omisión: hacerlo mejora la
continuidad del indicador, pero construye un registro de la navegación de cada persona, lo que
tensiona el principio de minimización declarado en §5.1 y las obligaciones descritas en la Parte 9.
Si se adopta, debe acompañarse del consentimiento correspondiente y de una política de retención.

**Recomendación para el informe.** Incluir el diccionario completo —tablas, atributos, tipos, claves
y restricciones—, reemplazar la imagen actual por una figura numerada y titulada con fuente
declarada, e incorporar la sección de estado de uso. Declarar que `url_scans` está definida pero no
utilizada es preferible a presentarla como parte operativa del sistema.
