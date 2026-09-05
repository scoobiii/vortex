#!/usr/bin/env python3
# Data:            2026-08-16
# Diretório:       scripts/scrape_repo.py
# Responsabilidade: Gera snapshot/dump de código do repositório com metadados git opcionais.
# Versão:          1.0.0
# Assinatura:      scoobiii <sobrinhosj@gmail.com>

# **GOS3** · agente: scoobiii · papel: PO / DevOps
# fase: Sprint 2 - Governance Retroativo · data: 2026-08-16
# assinatura: scoobiii · PO · GOS3

"""
scrape_repo.py — Snapshot/dump genérico de código, arquivos ou repositórios.
"""
import argparse
import pathlib
import subprocess

def main():
    p = argparse.ArgumentParser()
    p.add_argument("path", nargs="?", default=".")
    p.add_argument("--git-meta", action="store_true")
    p.add_argument("--out", default="snapshot.md")
    args = p.parse_args()

    root = pathlib.Path(args.path)
    out = pathlib.Path(args.out)

    lines = []
    if args.git_meta:
        try:
            log = subprocess.check_output(["git","log","--oneline","-20"], text=True)
            lines.append("# Git log\n```\n"+log+"```\n")
            status = subprocess.check_output(["git","status","--short"], text=True)
            lines.append("# Git status\n```\n"+status+"```\n")
        except Exception as e:
            lines.append(f"# git-meta error {e}\n")

    for f in sorted(root.rglob("*")):
        if f.is_file() and ".git" not in str(f) and f.name not in ("snapshot.md",) and f.suffix in (".py",".yml",".yaml",".md",".json",".sh"):
            try:
                if f.stat().st_size < 200000:
                    txt = f.read_text(errors="ignore")
                    lines.append(f"\n## {f}\n```{f.suffix}\n{txt[:20000]}\n```\n")
            except Exception:
                pass

    out.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {out} {out.stat().st_size} bytes")

if __name__ == "__main__":
    main()
