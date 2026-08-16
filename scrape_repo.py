#!/usr/bin/env python3
"""
scrape_repo.py — Snapshot/dump genérico de código, arquivos ou repositórios.

Aceita:
  • diretório local
  • arquivo local
  • URL Git
  • URL GitHub /blob/
  • URL GitHub /tree/

Exemplos:

  # Repo local
  python3 scrape_repo.py ~/vortex

  # Pasta local
  python3 scrape_repo.py ~/vortex/src

  # Arquivo local
  python3 scrape_repo.py ~/vortex/README.md

  # Repo Git remoto
  python3 scrape_repo.py https://github.com/user/repo.git

  # Arquivo dentro de repo GitHub
  python3 scrape_repo.py https://github.com/user/repo/blob/main/src/app.py

  # Pasta dentro de repo GitHub
  python3 scrape_repo.py https://github.com/user/repo/tree/main/src

  # Markdown
  python3 scrape_repo.py ~/vortex --out vortex_dump.md

  # JSON
  python3 scrape_repo.py ~/vortex --json --out vortex_dump.json

  # Somente determinados tipos
  python3 scrape_repo.py ~/vortex --ext .py,.md,.json

  # Limitar tamanho
  python3 scrape_repo.py ~/vortex --max-bytes 500000

  # Mostrar estrutura sem gerar dump
  python3 scrape_repo.py ~/vortex --tree

  # Estatísticas
  python3 scrape_repo.py ~/vortex --stats

  # Metadados Git
  python3 scrape_repo.py ~/vortex --git-meta

  # Ajuda
  python3 scrape_repo.py --help
"""

import argparse
import fnmatch
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from urllib.parse import urlparse


DEFAULT_EXCLUDE_DIRS = {
    ".git",
    ".hg",
    ".svn",
    "node_modules",
    "dist",
    "build",
    "target",
    "__pycache__",
    ".venv",
    "venv",
    ".next",
    ".cache",
    "coverage",
}

BINARY_EXTS = {
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
    ".ico",
    ".bmp",
    ".pdf",
    ".zip",
    ".tar",
    ".gz",
    ".bz2",
    ".xz",
    ".7z",
    ".woff",
    ".woff2",
    ".ttf",
    ".otf",
    ".mp3",
    ".mp4",
    ".avi",
    ".mov",
    ".mkv",
    ".sqlite",
    ".db",
    ".so",
    ".a",
    ".o",
    ".class",
}


def is_url(value: str) -> bool:
    return value.startswith(("http://", "https://", "git://", "ssh://"))


def parse_github_url(url: str):
    """
    Retorna:
        repo_url
        branch
        subpath

    Exemplos:

    https://github.com/user/repo
      -> repo, None, ""

    https://github.com/user/repo/blob/main/src/a.py
      -> repo, main, src/a.py

    https://github.com/user/repo/tree/main/src
      -> repo, main, src
    """

    parsed = urlparse(url)

    if parsed.netloc.lower() not in {
        "github.com",
        "www.github.com",
    }:
        return None

    parts = parsed.path.strip("/").split("/")

    if len(parts) < 2:
        return None

    owner = parts[0]
    repo = parts[1]

    if repo.endswith(".git"):
        repo = repo[:-4]

    repo_url = f"https://github.com/{owner}/{repo}.git"

    branch = None
    subpath = ""

    if len(parts) >= 4 and parts[2] in {"blob", "tree"}:
        branch = parts[3]
        subpath = "/".join(parts[4:])

    return repo_url, branch, subpath


def clone_remote(url: str, temp_dir: Path):
    """
    Clona uma URL Git para temp_dir.

    Retorna:
        root, branch, subpath
    """

    github = parse_github_url(url)

    if github:
        repo_url, branch, subpath = github
    else:
        repo_url = url
        branch = None
        subpath = ""

    cmd = [
        "git",
        "clone",
        "--depth",
        "1",
    ]

    if branch:
        cmd += ["--branch", branch]

    cmd += [repo_url, str(temp_dir)]

    print(f"[scrape] clone: {repo_url}", file=sys.stderr)

    try:
        subprocess.run(
            cmd,
            check=True,
            stdout=subprocess.DEVNULL,
        )
    except FileNotFoundError:
        raise RuntimeError("git não está instalado.")
    except subprocess.CalledProcessError as exc:
        raise RuntimeError(
            f"falha ao clonar repositório: {repo_url}"
        ) from exc

    return temp_dir, branch, subpath


def resolve_source(source: str):
    """
    Resolve a origem.

    Retorna:
        root
        target
        cleanup_dir

    root:
        raiz do repo ou diretório

    target:
        arquivo/pasta efetivamente solicitado

    cleanup_dir:
        diretório temporário que deve ser removido depois
    """

    if not is_url(source):
        path = Path(source).expanduser().resolve()

        if not path.exists():
            raise RuntimeError(f"Origem não existe: {path}")

        # Arquivo individual
        if path.is_file():
            return path.parent, path, None

        # Diretório
        return path, path, None

    if not shutil.which("git"):
        raise RuntimeError(
            "URL remota exige git. Instale com: pkg install git"
        )

    temp = Path(
        tempfile.mkdtemp(prefix="scrape_repo_")
    )

    try:
        root, branch, subpath = clone_remote(
            source,
            temp,
        )

        target = root

        if subpath:
            target = root / subpath

            if not target.exists():
                raise RuntimeError(
                    f"Alvo da URL não existe no clone: {subpath}"
                )

        return root, target, temp

    except Exception:
        shutil.rmtree(temp, ignore_errors=True)
        raise


def git_tracked_and_untracked(root: Path):
    """
    Lista arquivos Git tracked + untracked não ignorados.
    """

    try:
        out = subprocess.run(
            [
                "git",
                "-C",
                str(root),
                "ls-files",
                "--cached",
                "--others",
                "--exclude-standard",
            ],
            capture_output=True,
            text=True,
            check=True,
        )

        return [
            root / line
            for line in out.stdout.splitlines()
            if line.strip()
        ]

    except (
        subprocess.CalledProcessError,
        FileNotFoundError,
    ):
        return None


def walk_fallback(root: Path):
    files = []

    for dirpath, dirnames, filenames in os.walk(root):

        dirnames[:] = [
            d
            for d in dirnames
            if d not in DEFAULT_EXCLUDE_DIRS
            and not d.startswith(".")
        ]

        for filename in filenames:
            files.append(
                Path(dirpath) / filename
            )

    return files


def is_probably_binary(
    path: Path,
    sniff_bytes: int = 4096,
) -> bool:

    if path.suffix.lower() in BINARY_EXTS:
        return True

    try:
        with open(path, "rb") as fh:
            chunk = fh.read(sniff_bytes)

        return b"\x00" in chunk

    except OSError:
        return True


def matches_ext(path: Path, exts):
    if not exts:
        return True

    return path.suffix.lower() in exts


def relative_to_target(
    path: Path,
    root: Path,
    target: Path,
):
    """
    Retorna caminho relativo ao root.
    """

    try:
        return path.relative_to(root)
    except ValueError:
        return path


def collect_files(
    root: Path,
    target: Path,
    args,
):

    # Arquivo individual
    if target.is_file():
        candidates = [target]

    else:
        # Tenta usar Git quando estamos na raiz de um repo.
        files = git_tracked_and_untracked(root)

        if files is None:
            print(
                "[scrape] Git indisponível/não detectado; "
                "usando filesystem.",
                file=sys.stderr,
            )
            files = walk_fallback(root)

        # Se target for uma subpasta, restringe ao alvo.
        try:
            target_rel = target.relative_to(root)
        except ValueError:
            target_rel = Path(".")

        candidates = []

        for path in files:

            if not path.is_file():
                continue

            try:
                path.relative_to(target)
                candidates.append(path)
            except ValueError:
                pass

    return sorted(set(candidates))


def should_exclude(
    path: Path,
    root: Path,
    args,
):

    try:
        rel = path.relative_to(root)
    except ValueError:
        rel = path

    if any(
        part in DEFAULT_EXCLUDE_DIRS
        for part in rel.parts
    ):
        return True

    if any(
        fnmatch.fnmatch(part, pattern)
        for part in rel.parts
        for pattern in args.exclude
    ):
        return True

    return False


def read_entries(
    root: Path,
    target: Path,
    files,
    args,
):

    entries = []
    skipped = []

    for fpath in files:

        if should_exclude(
            fpath,
            root,
            args,
        ):
            continue

        if not matches_ext(
            fpath,
            args.exts,
        ):
            continue

        try:
            rel = fpath.relative_to(root)
        except ValueError:
            rel = fpath

        try:
            size = fpath.stat().st_size
        except OSError:
            continue

        if size > args.max_bytes:
            skipped.append(
                (
                    str(rel),
                    f"too_large({size}b)",
                )
            )
            continue

        if is_probably_binary(fpath):
            skipped.append(
                (
                    str(rel),
                    "binary",
                )
            )
            continue

        try:
            content = fpath.read_text(
                encoding="utf-8",
                errors="replace",
            )

        except OSError as exc:
            skipped.append(
                (
                    str(rel),
                    f"read_error({exc})",
                )
            )
            continue

        entries.append(
            {
                "path": str(rel),
                "size": size,
                "content": content,
            }
        )

    return entries, skipped


def git_metadata(root: Path):

    try:
        status = subprocess.run(
            [
                "git",
                "-C",
                str(root),
                "status",
                "--short",
            ],
            capture_output=True,
            text=True,
        ).stdout

        log = subprocess.run(
            [
                "git",
                "-C",
                str(root),
                "log",
                "--oneline",
                "-20",
            ],
            capture_output=True,
            text=True,
        ).stdout

        branch = subprocess.run(
            [
                "git",
                "-C",
                str(root),
                "branch",
                "--show-current",
            ],
            capture_output=True,
            text=True,
        ).stdout.strip()

        return {
            "branch": branch,
            "status": status,
            "log": log,
        }

    except FileNotFoundError:
        return None


def render_markdown(
    root,
    target,
    entries,
    skipped,
    git_meta,
    args,
):

    lines = []

    lines.append(
        f"# Dump: `{root.name}`"
    )
    lines.append("")

    lines.append(
        f"- **Root:** `{root}`"
    )

    lines.append(
        f"- **Target:** `{target}`"
    )

    lines.append(
        f"- **Arquivos incluídos:** {len(entries)}"
    )

    lines.append(
        f"- **Ignorados:** {len(skipped)}"
    )

    lines.append("")

    if git_meta:

        lines.append("## Git")
        lines.append("")

        lines.append(
            f"**Branch:** `{git_meta['branch']}`"
        )

        lines.append("")
        lines.append("### Status")
        lines.append("")
        lines.append("```text")
        lines.append(
            git_meta["status"]
            or "(clean)"
        )
        lines.append("```")
        lines.append("")

        lines.append("### Log")
        lines.append("")
        lines.append("```text")
        lines.append(git_meta["log"])
        lines.append("```")
        lines.append("")

    if skipped:

        lines.append(
            "## Arquivos ignorados"
        )
        lines.append("")

        for path, reason in skipped:
            lines.append(
                f"- `{path}` — {reason}"
            )

        lines.append("")

    lines.append("---")
    lines.append("")

    for entry in entries:

        suffix = (
            Path(entry["path"])
            .suffix
            .lstrip(".")
        )

        lang = suffix or "text"

        lines.append(
            f"## `{entry['path']}` "
            f"({entry['size']} bytes)"
        )

        lines.append("")
        lines.append(f"```{lang}")
        lines.append(entry["content"])
        lines.append("```")
        lines.append("")

    return "\n".join(lines)


def print_tree(root: Path, target: Path):

    files = git_tracked_and_untracked(root)

    if files is None:
        files = walk_fallback(root)

    for path in sorted(files):

        try:
            path.relative_to(target)
        except ValueError:
            continue

        if should_skip_tree(path, root):
            continue

        try:
            rel = path.relative_to(root)
        except ValueError:
            rel = path

        print(rel)


def should_skip_tree(path: Path, root: Path):

    try:
        rel = path.relative_to(root)
    except ValueError:
        return False

    return any(
        part in DEFAULT_EXCLUDE_DIRS
        for part in rel.parts
    )


def print_stats(entries, skipped):

    total_bytes = sum(
        e["size"]
        for e in entries
    )

    print("")
    print("=== ESTATÍSTICAS ===")
    print(f"Arquivos incluídos : {len(entries)}")
    print(f"Arquivos ignorados : {len(skipped)}")
    print(f"Bytes incluídos    : {total_bytes:,}")
    print("")


def build_parser():

    ap = argparse.ArgumentParser(
        prog="scrape_repo.py",
        description=(
            "Cria um snapshot auditável de um "
            "arquivo, pasta ou repositório Git."
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
RECURSOS
--------
  • caminho local de arquivo
  • caminho local de pasta
  • repositório Git remoto
  • URL GitHub /blob/
  • URL GitHub /tree/
  • Markdown ou JSON
  • filtros por extensão
  • limite de tamanho
  • exclusões
  • metadados Git
  • árvore do projeto
  • estatísticas
  • fallback sem Git

EXEMPLOS
--------
  Repo local:
    python3 scrape_repo.py ~/vortex

  Pasta:
    python3 scrape_repo.py ~/vortex/src

  Arquivo:
    python3 scrape_repo.py ~/vortex/README.md

  GitHub:
    python3 scrape_repo.py https://github.com/user/repo

  Arquivo GitHub:
    python3 scrape_repo.py https://github.com/user/repo/blob/main/src/app.py

  Pasta GitHub:
    python3 scrape_repo.py https://github.com/user/repo/tree/main/src

  JSON:
    python3 scrape_repo.py ~/vortex --json

  Apenas código:
    python3 scrape_repo.py ~/vortex --ext .py,.ts,.tsx

  Estrutura:
    python3 scrape_repo.py ~/vortex --tree

  Estatísticas:
    python3 scrape_repo.py ~/vortex --stats

  Git:
    python3 scrape_repo.py ~/vortex --git-meta

  Tudo:
    python3 scrape_repo.py ~/vortex \\
      --out vortex_dump.md \\
      --git-meta \\
      --stats

SAÍDA
-----
  Markdown:
    --out repo_dump.md

  JSON:
    --json --out repo_dump.json

EXCLUSÕES PADRÃO
----------------
  .git
  node_modules
  dist
  build
  target
  __pycache__
  .venv
  venv
  .next
  .cache
  coverage

OBSERVAÇÃO
----------
URLs GitHub /blob/ e /tree/ são clonadas localmente.
O dump é produzido sobre o clone temporário e o clone
é removido ao final.
""",
    )

    ap.add_argument(
        "source",
        nargs="?",
        default=".",
        help=(
            "Arquivo, pasta, repo Git ou URL GitHub "
            "(default: .)"
        ),
    )

    ap.add_argument(
        "--out",
        default="repo_dump.md",
        help="Arquivo de saída (default: repo_dump.md)",
    )

    ap.add_argument(
        "--json",
        action="store_true",
        help="Gera JSON estruturado.",
    )

    ap.add_argument(
        "--ext",
        default="",
        help=(
            "Extensões separadas por vírgula. "
            "Ex: .py,.ts,.md"
        ),
    )

    ap.add_argument(
        "--max-bytes",
        type=int,
        default=300_000,
        help=(
            "Ignora arquivos maiores que N bytes "
            "(default: 300000)."
        ),
    )

    ap.add_argument(
        "--exclude",
        action="append",
        default=[],
        help=(
            "Exclusão adicional por glob. "
            "Pode repetir. Ex: --exclude '*.lock'"
        ),
    )

    ap.add_argument(
        "--git-meta",
        "--include-git-meta",
        dest="git_meta",
        action="store_true",
        help="Inclui branch, status e últimos commits.",
    )

    ap.add_argument(
        "--tree",
        action="store_true",
        help="Somente mostra a árvore de arquivos.",
    )

    ap.add_argument(
        "--stats",
        action="store_true",
        help="Mostra estatísticas do snapshot.",
    )

    ap.add_argument(
        "--stdout",
        action="store_true",
        help="Escreve Markdown no stdout em vez de arquivo.",
    )

    return ap


def main():

    parser = build_parser()
    args = parser.parse_args()

    args.exts = (
        {
            e.strip().lower()
            if e.strip().startswith(".")
            else "." + e.strip().lower()
            for e in args.ext.split(",")
            if e.strip()
        }
        if args.ext
        else None
    )

    cleanup_dir = None

    try:

        root, target, cleanup_dir = resolve_source(
            args.source
        )

        print(
            f"[scrape] root   : {root}",
            file=sys.stderr,
        )

        print(
            f"[scrape] target : {target}",
            file=sys.stderr,
        )

        if args.tree:
            print_tree(root, target)
            return

        files = collect_files(
            root,
            target,
            args,
        )

        entries, skipped = read_entries(
            root,
            target,
            files,
            args,
        )

        meta = (
            git_metadata(root)
            if args.git_meta
            else None
        )

        if args.json:

            payload = {
                "tool": "scrape_repo.py",
                "version": "1.0",
                "root": str(root),
                "target": str(target),
                "file_count": len(entries),
                "skipped_count": len(skipped),
                "skipped": skipped,
                "files": entries,
            }

            if meta:
                payload["git"] = meta

            output = json.dumps(
                payload,
                ensure_ascii=False,
                indent=2,
            )

        else:

            output = render_markdown(
                root,
                target,
                entries,
                skipped,
                meta,
                args,
            )

        if args.stdout:

            print(output)

        else:

            out_path = Path(
                args.out
            ).expanduser().resolve()

            # Evita que o dump seja incluído
            # numa execução futura dentro do próprio repo.
            if out_path.exists():
                pass

            out_path.write_text(
                output,
                encoding="utf-8",
            )

            print(
                f"OK: {len(entries)} arquivos "
                f"→ {out_path}",
                file=sys.stderr,
            )

        if args.stats:
            print_stats(
                entries,
                skipped,
            )

    except KeyboardInterrupt:
        print(
            "\nInterrompido.",
            file=sys.stderr,
        )
        sys.exit(130)

    except Exception as exc:
        print(
            f"ERRO: {exc}",
            file=sys.stderr,
        )
        sys.exit(1)

    finally:

        if cleanup_dir:
            shutil.rmtree(
                cleanup_dir,
                ignore_errors=True,
            )


if __name__ == "__main__":
    main()
