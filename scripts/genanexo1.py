import json
import pathlib

d = json.loads(pathlib.Path("items.json").read_text(encoding="utf-8"))
NIV = {"basico": "Básico (w = 1)", "intermedio": "Intermedio (w = 2)", "avanzado": "Avanzado (w = 3)"}


def fichas(items, pref):
    """Cada item como tres parrafos, no como fila de tabla."""
    bloques = []
    for n, x in enumerate(items, 1):
        cls = "Fraude" if x["fraude"] else "Legítimo (distractor)"
        cab = "> **%s%02d · %s · %s · %s · %s**" % (
            pref, n, NIV[x["nivel"]], x["canal"], x["remitente"], cls)
        msg = "> **Mensaje:** «%s»" % x["mensaje"]
        fun = "> **Fundamento:** %s" % x["expl"]
        bloques.append("\n\n".join([cab, msg, fun]))
    return "\n\n".join(bloques)


def composicion(items):
    c = {"basico": 0, "intermedio": 0, "avanzado": 0}
    fr = sum(1 for x in items if x["fraude"])
    for x in items:
        c[x["nivel"]] += 1
    return c, fr, len(items) - fr


cA, frA, lgA = composicion(d["A"])
cB, frB, lgB = composicion(d["B"])

MD = """## ANEXOS — Instrumentos de medición

### ANEXO N° 1: Instrumento de medición del Coeficiente de Resiliencia Digital

> El instrumento consta de veinticuatro ítems de clasificación distribuidos en dos formas
> equivalentes de doce ítems cada una, con cuatro ítems de cada nivel de dificultad. Cada ítem
> presenta una comunicación real o verosímil del contexto chileno y la persona debe clasificarla
> como fraudulenta o legítima. La inclusión de comunicaciones legítimas como distractores es
> deliberada: si todos los ítems fueran fraude, el instrumento mediría desconfianza y no
> discernimiento.

> Los ítems se ponderan por dificultad conforme a la fórmula del componente de conocimiento. Se
> conserva únicamente el primer intento de cada ítem. La asignación de formas se contrabalancea: a
> la mitad de los participantes se administra la forma A como medición inicial y la forma B como
> final, y a la otra mitad el orden inverso.

> El campo «Fundamento» corresponde a la retroalimentación que el sistema entrega al cierre de la
> aplicación, nunca durante ella.

> **Tabla.** Composición del instrumento

| Forma | Básicos | Intermedios | Avanzados | Fraudulentos | Legítimos | Total |
|---|---|---|---|---|---|---|
| A | %d | %d | %d | %d | %d | %d |
| B | %d | %d | %d | %d | %d | %d |

> *Nota.* Elaboración propia.

#### Forma A

%s

#### Forma B

%s
""" % (
    cA["basico"], cA["intermedio"], cA["avanzado"], frA, lgA, len(d["A"]),
    cB["basico"], cB["intermedio"], cB["avanzado"], frB, lgB, len(d["B"]),
    fichas(d["A"], "A-"), fichas(d["B"], "B-"),
)

# El anexo 2 se mantiene igual: sus tablas son de 3 y 5 columnas con texto corto.
viejo = pathlib.Path("anexos.md").read_text(encoding="utf-8")
corte = viejo.index("### ANEXO N° 2:")
pathlib.Path("anexos.md").write_text(MD + "\n" + viejo[corte:], encoding="utf-8")
print("anexos.md regenerado: Anexo 1 en fichas, Anexo 2 sin cambios")
