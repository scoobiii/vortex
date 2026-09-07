#!/usr/bin/env python3
# Data:            2026-09-05
# Diretório:       scripts/governance/retrofit_headers.py
# Responsabilidade: Insere cabeçalho de governança retroativo nos arquivos legados que reprovam o gate.
# Versão:          1.0.0
# Assinatura:      ASSINATURA-DESCONHECIDA (sem histórico git)

"""
Data:            2026-09-05
Diretório:       scripts/governance/retrofit_headers.py
Responsabilidade: Inserir cabeçalho de governança retroativo (Data, Diretório,
                   Responsabilidade, Versão, Assinatura) nos arquivos legados
                   que reprovam o gate de scripts/lint/check_header.js.
                   Data/Diretório/Assinatura são extraídos de `git log` real
                   (primeiro commit do arquivo) — nunca inventados. O campo
                   Responsabilidade é deixado como TODO explícito quando o
                   script não pode ler e entender semanticamente o conteúdo
                   do arquivo, para não fabricar descrição de código não
                   revisado (mesmo princípio anti-fabricação do GOS3).
Versão:          1.0.0
Assinatura:      vortex <sobrinhosj@gmail.com>

Uso:
    python3 scripts/governance/retrofit_headers.py --check   # roda o lint e lista quem falha
    python3 scripts/governance/retrofit_headers.py --apply arquivo1.py arquivo2.ts ...
"""

import argparse
import subprocess
import sys
from pathlib import Path

COMMENT_STYLE = {
    ".py": ("#", "#", "#"),
    ".sh": ("#", "#", "#"),
    ".js": ("/**", " *", " */"),
    ".mjs": ("/**", " *", " */"),
    ".cjs": ("/**", " *", " */"),
    ".ts": ("/**", " *", " */"),
}

TODO_RESPONSABILIDADE = "TODO: preencher em 1 linha o que este arquivo faz — não gerado automaticamente para evitar fabricação de descrição de código não revisado."


def get_git_field(filepath: Path, fmt: str) -> str:
    """Pega o primeiro commit real do arquivo (criação), não o mais recente."""
    result = subprocess.run(
        ["git", "log", "--follow", "--format=" + fmt, "--", str(filepath)],
        capture_output=True, text=True, cwd=filepath.parent.resolve()
    )
    lines = [l for l in result.stdout.strip().split("\n") if l]
    if not lines:
        return ""
    return lines[-1]  # último da lista = commit mais antigo


def build_header(filepath: Path, repo_root: Path, responsabilidade: str = None) -> str:
    ext = filepath.suffix
    if ext not in COMMENT_STYLE:
        raise ValueError(f"extensão não suportada: {ext}")
    open_c, mid_c, close_c = COMMENT_STYLE[ext]

    data = get_git_field(filepath, "%ad") 
    data_result = subprocess.run(
        ["git", "log", "--follow", "--format=%ad", "--date=format:%Y-%m-%d", "--", str(filepath)],
        capture_output=True, text=True, cwd=filepath.parent.resolve()
    )
    dates = [l for l in data_result.stdout.strip().split("\n") if l]
    data_val = dates[-1] if dates else "2026-09-05"

    author_result = subprocess.run(
        ["git", "log", "--follow", "--format=%an <%ae>", "--", str(filepath)],
        capture_output=True, text=True, cwd=filepath.parent.resolve()
    )
    authors = [l for l in author_result.stdout.strip().split("\n") if l]
    assinatura_val = authors[-1] if authors else "ASSINATURA-DESCONHECIDA (sem histórico git)"

    rel_dir = str(filepath.relative_to(repo_root)).replace("\\", "/")
    resp = responsabilidade or TODO_RESPONSABILIDADE

    if ext == ".py" or ext == ".sh":
        lines = [
            f"# Data:            {data_val}",
            f"# Diretório:       {rel_dir}",
            f"# Responsabilidade: {resp}",
            f"# Versão:          1.0.0",
            f"# Assinatura:      {assinatura_val}",
            "",
        ]
    else:
        lines = [
            "/**",
            f" * Data:            {data_val}",
            f" * Diretório:       {rel_dir}",
            f" * Responsabilidade: {resp}",
            f" * Versão:          1.0.0",
            f" * Assinatura:      {assinatura_val}",
            " */",
            "",
        ]
    return "\n".join(lines)


def insert_header(filepath: Path, header: str):
    original = filepath.read_text(encoding="utf-8")
    # Preserva shebang se existir, cabeçalho vai depois dele
    if original.startswith("#!"):
        first_line, rest = original.split("\n", 1)
        new_content = first_line + "\n" + header + "\n" + rest
    else:
        new_content = header + "\n" + original
    filepath.write_text(new_content, encoding="utf-8")


def run_check():
    result = subprocess.run(["node", "scripts/lint/check_header.js"], capture_output=True, text=True)
    print(result.stdout)
    fails = [line.split(" ", 1)[1] for line in result.stdout.split("\n") if line.startswith("FAIL ")]
    return fails


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="Só lista os arquivos que falham no gate")
    parser.add_argument("--apply", nargs="*", default=None, help="Aplica cabeçalho retroativo nos arquivos dados")
    parser.add_argument("--repo-root", default=".", help="Raiz do repositório (default: diretório atual)")
    args = parser.parse_args()

    repo_root = Path(args.repo_root).resolve()

    if args.check:
        fails = run_check()
        print(f"\n{len(fails)} arquivo(s) sem cabeçalho:")
        for f in fails:
            print(f"  {f}")
        return

    if args.apply is not None:
        targets = args.apply if args.apply else run_check()
        for rel in targets:
            filepath = (repo_root / rel).resolve()
            if not filepath.exists():
                print(f"aviso: {rel} não encontrado, pulando")
                continue
            header = build_header(filepath, repo_root)
            insert_header(filepath, header)
            print(f"cabeçalho inserido em {rel} (Responsabilidade marcada como TODO — edite manualmente antes de commitar)")
        return

    parser.print_help()


if __name__ == "__main__":
    main()
