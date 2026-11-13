"""Convierte una seccion de la guia a HTML pegable en Word.

Toma solo lo que va al informe: el texto dentro de blockquotes y las tablas.
Las notas con advertencia quedan marcadas en rojo para no pegarlas.
"""
import re, sys, html, pathlib

def inline(s):
    s = html.escape(s)
    s = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", s)
    s = re.sub(r"(?<!\*)\*([^*]+?)\*(?!\*)", r"<em>\1</em>", s)
    s = s.replace("`", "")
    return s

def convertir(lineas, titulo_h1):
    out = [f"<h1>{html.escape(titulo_h1)}</h1>"]
    buf, lista, tabla = [], [], []
    orden = [False]

    def cerrar_parrafo():
        if buf:
            out.append("<p>" + " ".join(buf) + "</p>")
            buf.clear()

    def cerrar_lista():
        if lista:
            et = "ol" if orden[0] else "ul"
            out.append(f"<{et}>" + "".join(f"<li>{x}</li>" for x in lista) + f"</{et}>")
            lista.clear(); orden[0] = False

    def cerrar_tabla():
        if not tabla:
            return
        filas = [[c.strip() for c in f.strip().strip("|").split("|")] for f in tabla]
        filas = [f for f in filas if not all(re.fullmatch(r":?-{2,}:?", c or "-") for c in f)]
        if filas:
            th = "".join(f"<th>{inline(c)}</th>" for c in filas[0])
            cuerpo = "".join(
                "<tr>" + "".join(f"<td>{inline(c)}</td>" for c in fila) + "</tr>"
                for fila in filas[1:]
            )
            out.append(f'<table border="1" cellspacing="0" cellpadding="5">'
                       f"<tr>{th}</tr>{cuerpo}</table>")
        tabla.clear()

    for ln in lineas:
        s = ln.rstrip()
        if s.lstrip().startswith("|"):
            cerrar_parrafo(); cerrar_lista()
            tabla.append(s.lstrip())
            continue
        cerrar_tabla()

        m = re.match(r"^(#{3,4})\s+(.*)", s)
        if m:
            cerrar_parrafo(); cerrar_lista()
            nivel = "h2" if len(m.group(1)) == 3 else "h3"
            out.append(f"<{nivel}>{inline(m.group(2))}</{nivel}>")
            continue

        if s.startswith(">"):
            crudo = s[1:]
            if crudo.startswith(" "):
                crudo = crudo[1:]
            sangria = len(crudo) - len(crudo.lstrip())
            t = crudo.strip()
            # linea de continuacion de una vinenta: se une al item anterior
            if lista and sangria >= 2 and t and not t.startswith("- "):
                lista[-1] += " " + inline(t)
                continue
            if not t:
                cerrar_parrafo(); cerrar_lista()
                continue
            if t.startswith("⚠️"):
                cerrar_parrafo(); cerrar_lista()
                out.append('<div class="nota">NO PEGAR — nota para ti: '
                           + inline(t.replace("⚠️", "").strip()) + "</div>")
                continue
            if t.startswith("- ") or re.match(r"^\d+\.\s", t):
                cerrar_parrafo()
                if not lista:
                    orden[0] = bool(re.match(r"^\d+\.\s", t))
                lista.append(inline(re.sub(r"^(- |\d+\.\s)", "", t)))
                continue
            cerrar_lista()
            buf.append(inline(t))
            continue

        cerrar_parrafo(); cerrar_lista()

    cerrar_parrafo(); cerrar_lista(); cerrar_tabla()
    return "\n".join(out)

CSS = """body{font-family:Calibri,Arial,sans-serif;font-size:11pt;max-width:900px;margin:2rem auto;padding:0 1rem;color:#000}
h1{font-size:18pt}h2{font-size:14pt}h3{font-size:12pt}
table{border-collapse:collapse;width:100%;margin:.6rem 0;font-size:10pt}
th{background:#eee;text-align:left}
.nota{border:2px solid #c00;background:#fff3f3;color:#900;padding:.6rem;margin:.6rem 0;font-weight:bold}
.aviso{border:1px solid #888;background:#f6f6f6;padding:.8rem;margin-bottom:1.5rem;font-size:10pt}"""

def main():
    src = pathlib.Path(sys.argv[1])
    desde, hasta, titulo, destino = sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5]
    txt = src.read_text(encoding="utf-8").split("\n")
    i = next(n for n, l in enumerate(txt) if l.startswith(desde))
    try:
        j = next(n for n, l in enumerate(txt) if n > i and l.startswith(hasta))
    except StopIteration:
        j = len(txt)
    cuerpo = convertir(txt[i + 1:j], titulo)
    aviso = ('<div class="aviso">Selecciona desde el titulo de abajo hasta el final '
             '(Ctrl+A funciona), copia con Ctrl+C y pega en Word. Los recuadros rojos '
             'son notas para ti: borralos despues de pegar.</div>')
    pathlib.Path(destino).write_text(
        f"<!doctype html><html lang=es><meta charset=utf-8>"
        f"<title>{html.escape(titulo)}</title><style>{CSS}</style>{aviso}{cuerpo}</html>",
        encoding="utf-8")
    print("escrito:", destino)

main()
