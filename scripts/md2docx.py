"""Genera el Word con los bloques que hay que pegar en el informe.

Lee las secciones de la guia y emite un .docx con estilos Titulo 1/2/3 y
tablas nativas, de modo que al copiar y pegar en el informe el formato se
conserve. Las notas que NO deben pegarse quedan marcadas en rojo.

Uso:  python scripts/md2docx.py <salida.docx>
"""
import re
import sys
import pathlib

from docx import Document
from docx.shared import Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn

CUERPO = "Arial"
PT_CUERPO = 12
PT_TITULO = 14


PT_TABLA = 10

# Atributos de fuente-de-tema. Word les da prioridad sobre la fuente
# explicita, asi que hay que borrarlos o los encabezados salen en Calibri.
TEMA = ("w:asciiTheme", "w:hAnsiTheme", "w:cstheme", "w:eastAsiaTheme")
EXPLICITA = ("w:ascii", "w:hAnsi", "w:cs", "w:eastAsia")


def forzar_rfonts(rpr):
    rfonts = rpr.get_or_add_rFonts()
    for attr in TEMA:
        if rfonts.get(qn(attr)) is not None:
            del rfonts.attrib[qn(attr)]
    for attr in EXPLICITA:
        rfonts.set(qn(attr), CUERPO)


def fijar_fuente(estilo, tamano, negrita=None):
    estilo.font.size = Pt(tamano)
    estilo.font.color.rgb = RGBColor(0, 0, 0)
    if negrita is not None:
        estilo.font.bold = negrita
    forzar_rfonts(estilo.element.get_or_add_rPr())


def aplicar_formato(doc):
    # 1. El valor por defecto del documento.
    defaults = doc.styles.element.find(qn("w:docDefaults"))
    if defaults is not None:
        rpr_def = defaults.find(qn("w:rPrDefault"))
        if rpr_def is not None:
            rpr = rpr_def.find(qn("w:rPr"))
            if rpr is None:
                rpr = rpr_def.makeelement(qn("w:rPr"), {})
                rpr_def.append(rpr)
            forzar_rfonts(rpr)

    # 2. Todos los estilos de parrafo y caracter, no solo los que uso.
    for estilo in doc.styles:
        el = getattr(estilo, "element", None)
        if el is not None and hasattr(el, "get_or_add_rPr"):
            forzar_rfonts(el.get_or_add_rPr())

    # 3. El tema, que es de donde Word saca la fuente cuando no hay otra.
    for parte in doc.part.package.iter_parts():
        if "theme" in parte.partname and str(parte.partname).endswith(".xml"):
            xml = parte.blob.decode("utf-8")
            xml = re.sub(r'(<a:(?:latin|ea|cs)\b[^>]*typeface=")[^"]*(")',
                         r"\g<1>" + CUERPO + r"\g<2>", xml)
            parte._blob = xml.encode("utf-8")

    # 4. Los tamanos.
    fijar_fuente(doc.styles["Normal"], PT_CUERPO)
    for nombre in ("Heading 1", "Heading 2", "Heading 3"):
        fijar_fuente(doc.styles[nombre], PT_TITULO, negrita=True)
    for nombre in ("List Bullet", "List Number"):
        try:
            fijar_fuente(doc.styles[nombre], PT_CUERPO)
        except KeyError:
            pass

SCRATCH = pathlib.Path(sys.argv[2]) if len(sys.argv) > 2 else pathlib.Path(".")


def runs(par, texto):
    """Escribe el texto en el parrafo resolviendo los **negrita**."""
    for i, trozo in enumerate(re.split(r"\*\*(.+?)\*\*", texto)):
        if not trozo:
            continue
        r = par.add_run(trozo.replace("`", ""))
        r.bold = bool(i % 2)


def bloque(doc, lineas):
    """Convierte las lineas de una seccion de la guia en contenido del doc."""
    buf, lista, orden, tabla = [], [], [False], []

    def cerrar_parrafo():
        if buf:
            runs(doc.add_paragraph(), " ".join(buf))
            buf.clear()

    def cerrar_lista():
        if lista:
            estilo = "List Number" if orden[0] else "List Bullet"
            for it in lista:
                runs(doc.add_paragraph(style=estilo), it)
            lista.clear()
            orden[0] = False

    def cerrar_tabla():
        if not tabla:
            return
        filas = [[c.strip() for c in f.strip().strip("|").split("|")] for f in tabla]
        filas = [f for f in filas
                 if not all(re.fullmatch(r":?-{2,}:?", c or "-") for c in f)]
        tabla.clear()
        if not filas:
            return
        t = doc.add_table(rows=len(filas), cols=len(filas[0]))
        t.style = "Table Grid"
        for i, fila in enumerate(filas):
            for j, celda in enumerate(fila[: len(filas[0])]):
                p = t.cell(i, j).paragraphs[0]
                runs(p, celda)
                for r in p.runs:
                    r.font.name = CUERPO
                    r.font.size = Pt(PT_TABLA)
                    forzar_rfonts(r.element.get_or_add_rPr())
                    if i == 0:
                        r.bold = True

    for ln in lineas:
        s = ln.rstrip()
        if s.lstrip().startswith("|"):
            cerrar_parrafo()
            cerrar_lista()
            tabla.append(s.lstrip())
            continue
        cerrar_tabla()

        m = re.match(r"^(#{3,4})\s+(.*)", s)
        if m:
            cerrar_parrafo()
            cerrar_lista()
            doc.add_heading(m.group(2).replace("**", "").replace("`", ""),
                            level=2 if len(m.group(1)) == 3 else 3)
            continue

        if s.startswith(">"):
            crudo = s[1:]
            if crudo.startswith(" "):
                crudo = crudo[1:]
            sangria = len(crudo) - len(crudo.lstrip())
            t = crudo.strip()
            if lista and sangria >= 2 and t and not t.startswith("- "):
                lista[-1] += " " + t
                continue
            if not t:
                cerrar_parrafo()
                cerrar_lista()
                continue
            if t.startswith("⚠️"):
                cerrar_parrafo()
                cerrar_lista()
                nota(doc, "NO PEGAR — nota para ti: " + t.replace("⚠️", "").strip())
                continue
            if t.startswith("- ") or re.match(r"^\d+\.\s", t):
                cerrar_parrafo()
                if not lista:
                    orden[0] = bool(re.match(r"^\d+\.\s", t))
                lista.append(re.sub(r"^(- |\d+\.\s)", "", t))
                continue
            cerrar_lista()
            buf.append(t)
            continue

        cerrar_parrafo()
        cerrar_lista()

    cerrar_parrafo()
    cerrar_lista()
    cerrar_tabla()


def nota(doc, texto):
    p = doc.add_paragraph()
    r = p.add_run(texto.replace("**", "").replace("`", ""))
    r.bold = True
    r.font.color.rgb = RGBColor(0xC0, 0x00, 0x00)
    r.font.size = Pt(9)


def separador(doc, titulo, instruccion):
    doc.add_page_break()
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run("▼ " + titulo + " ▼")
    r.bold = True
    r.font.color.rgb = RGBColor(0xC0, 0x00, 0x00)
    nota(doc, instruccion)


def seccion(src, desde, hasta):
    txt = pathlib.Path(src).read_text(encoding="utf-8").split("\n")
    i = next(n for n, l in enumerate(txt) if l.startswith(desde))
    try:
        j = next(n for n, l in enumerate(txt) if n > i and l.startswith(hasta))
    except StopIteration:
        j = len(txt)
    return txt[i + 1:j]


def main_1011():
    """Segunda entrega: los capitulos 10 y 11."""
    salida = sys.argv[1]
    src = SCRATCH / "cap1011.md"
    doc = Document()
    aplicar_formato(doc)

    doc.add_heading("Bloques para pegar — capítulos 10 y 11", level=1)
    nota(doc, "Este archivo NO es parte del informe. Copia desde el encabezado que sigue al "
              "título rojo hasta el final de ese bloque. Borra los textos en rojo.")
    p = doc.add_paragraph()
    runs(p, "Los dos capítulos van **entre el 9 y el 12**, en orden. Si ya pegaste el 12 y el 13, "
            "colócalos justo antes del 12.")

    separador(doc, "BLOQUE 5 — CAPÍTULO 10",
              "Va después del capítulo 9 y antes del 12. Título «10 Gestión del Cambio» en "
              "estilo Título 1.")
    doc.add_heading("10 GESTIÓN DEL CAMBIO", level=1)
    bloque(doc, seccion(src, "## CAP10", "## CAP11"))

    separador(doc, "BLOQUE 6 — CAPÍTULO 11",
              "Va inmediatamente después del capítulo 10 y antes del 12.")
    doc.add_heading("11 GESTIÓN DE RIESGOS", level=1)
    bloque(doc, seccion(src, "## CAP11", "ZZZZZ"))

    doc.save(salida)
    print("escrito:", salida)


def main():
    salida = sys.argv[1]
    p9 = SCRATCH / "paso9b.md"
    pd = SCRATCH / "parteD.md"
    doc = Document()
    aplicar_formato(doc)

    doc.add_heading("Bloques para pegar en el informe Fishin't", level=1)
    nota(doc, "Este archivo NO es parte del informe. Cada bloque empieza en una página "
              "nueva con un título rojo. Copia desde el encabezado que sigue al título rojo "
              "hasta el final de esa página, y pega en el lugar indicado. Borra siempre los "
              "textos en rojo: son notas para ti.")
    p = doc.add_paragraph()
    runs(p, "Orden de trabajo: **Bloque 1** capítulo 9 al final del documento · "
            "**Bloque 2** capítulo 12 después del 9 · **Bloque 3** capítulo 13 después del 12 · "
            "**Bloque 4** ocho correcciones puntuales repartidas por el documento.")

    separador(doc, "BLOQUE 1 — CAPÍTULO 9",
              "Va al final del documento, después de «8.5 Conclusión del Capítulo» y antes de "
              "la BIBLIOGRAFÍA. El título «9 INGENIERÍA DE QA» debe quedar en estilo Título 1.")
    doc.add_heading("9 INGENIERÍA DE QA", level=1)
    bloque(doc, seccion(p9, "## 9.A", "## 9.B"))

    separador(doc, "BLOQUE 2 — CAPÍTULO 12",
              "Va inmediatamente después del capítulo 9. Los capítulos 10 y 11 se escriben "
              "aparte y se insertan entre medio cuando estén listos.")
    doc.add_heading("12 RESULTADOS Y EVALUACIÓN FINAL", level=1)
    bloque(doc, seccion(p9, "## 9.B", "## 9.C"))

    separador(doc, "BLOQUE 3 — CAPÍTULO 13",
              "Va inmediatamente después del capítulo 12 y antes de la BIBLIOGRAFÍA.")
    doc.add_heading("13 CONCLUSIONES", level=1)
    bloque(doc, seccion(p9, "## 9.C", "ZZZZZ"))

    separador(doc, "BLOQUE 4 — OCHO CORRECCIONES PUNTUALES",
              "Cada una reemplaza o agrega un párrafo en el lugar que indica su título. "
              "Los títulos de las correcciones NO se pegan.")
    bloque(doc, pathlib.Path(pd).read_text(encoding="utf-8").split("\n"))

    doc.save(salida)
    print("escrito:", salida)


if __name__ == "__main__":
    if len(sys.argv) > 3 and sys.argv[3] == "1011":
        main_1011()
    else:
        main()
