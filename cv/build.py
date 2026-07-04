#!/usr/bin/env python3
"""Build the CV (no bibliography)."""
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent
MAIN_TEX = "resume.tex"
AUX_BASENAME = pathlib.Path(MAIN_TEX).stem
AUX_SUFFIXES = [".aux", ".log", ".out", ".synctex.gz", ".fls", ".fdb_latexmk"]


def run(cmd):
    print(">", " ".join(cmd))
    subprocess.run(cmd, cwd=ROOT, check=True)


def cleanup_aux_files():
    removed = []
    for suffix in AUX_SUFFIXES:
        path = ROOT / f"{AUX_BASENAME}{suffix}"
        if path.exists():
            path.unlink()
            removed.append(path.name)
    print("Removed:", ", ".join(removed) if removed else "(none)")


def main():
    try:
        run(["pdflatex", "-synctex=1", "-interaction=nonstopmode", "-halt-on-error", MAIN_TEX])
        run(["pdflatex", "-synctex=1", "-interaction=nonstopmode", "-halt-on-error", MAIN_TEX])
        cleanup_aux_files()
        print("Build succeeded:", ROOT / f"{AUX_BASENAME}.pdf")
    except FileNotFoundError:
        print("Error: pdflatex not found. Install a LaTeX distribution first.")
        return 127
    except subprocess.CalledProcessError as exc:
        print(f"Build failed with code {exc.returncode}")
        return exc.returncode
    return 0


if __name__ == "__main__":
    sys.exit(main())
