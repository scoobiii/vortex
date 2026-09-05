#!/usr/bin/env node
/**
 * Data:            2026-09-05
 * Diretório:       scripts/lint/check_header.js
 * Responsabilidade: Validar presença, formato e coerência do cabeçalho de
 *                   governança (Data, Diretório, Responsabilidade, Versão,
 *                   Assinatura) nos arquivos de código do repositório.
 *                   Falha fechado: qualquer arquivo alvo sem o cabeçalho
 *                   completo e coerente com seu path real reprova o gate.
 * Versão:          1.0.0
 * Assinatura:      vortex <sobrinhosj@gmail.com>
 */

const fs = require("node:fs");
const path = require("node:path");

const REQUIRED_FIELDS = ["Data", "Diretório", "Responsabilidade", "Versão", "Assinatura"];
const FIELD_REGEX = /^\s*(?:\/\/|\*|\/\*)?\s*([A-Za-zÀ-ÿ]+):\s*(.+)/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}/;

// Extensões de arquivo que este lint audita. Ajuste conforme o repo crescer.
const TARGET_EXTENSIONS = new Set([".js", ".mjs", ".cjs", ".ts", ".py"]);

// Diretórios ignorados ao varrer recursivamente, por nome (qualquer nível).
const IGNORED_DIR_NAMES = new Set(["node_modules", ".git", "dist", "build"]);

// Caminhos ignorados por posição exata relativa à raiz do repo (ex: pasta de
// saída de proof gerada em runtime, não código-fonte).
const IGNORED_ROOT_PATHS = new Set(["proof"]);

function validateHeader(filePath, repoRoot) {
  const content = fs.readFileSync(filePath, "utf8");
  const headerLines = content.split("\n").slice(0, 20);
  const foundFields = {};

  for (const line of headerLines) {
    const match = line.match(FIELD_REGEX);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (REQUIRED_FIELDS.includes(key) && !(key in foundFields)) {
        foundFields[key] = value;
      }
    }
  }

  const errors = [];

  const missingFields = REQUIRED_FIELDS.filter((field) => !foundFields[field]);
  if (missingFields.length > 0) {
    errors.push(`campos ausentes: ${missingFields.join(", ")}`);
  }

  if (foundFields["Data"] && !DATE_REGEX.test(foundFields["Data"])) {
    errors.push(`formato de Data inválido ("${foundFields["Data"]}"), esperado YYYY-MM-DD`);
  }

  if (foundFields["Diretório"]) {
    const declaredDir = foundFields["Diretório"].trim();
    const actualPath = path.relative(repoRoot, filePath).split(path.sep).join("/");
    if (declaredDir !== actualPath) {
      errors.push(`Diretório declarado ("${declaredDir}") não bate com o path real ("${actualPath}")`);
    }
  }

  return errors;
}

function collectTargetFiles(root, dir = root, acc = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".") && entry.name !== ".githooks") continue;
    const fullPath = path.join(dir, entry.name);
    const relFromRoot = path.relative(root, fullPath).split(path.sep).join("/");
    if (entry.isDirectory()) {
      if (IGNORED_DIR_NAMES.has(entry.name)) continue;
      if (IGNORED_ROOT_PATHS.has(relFromRoot)) continue;
      collectTargetFiles(root, fullPath, acc);
    } else if (TARGET_EXTENSIONS.has(path.extname(entry.name))) {
      acc.push(fullPath);
    }
  }
  return acc;
}

function main() {
  const args = process.argv.slice(2);
  const repoRoot = process.cwd();
  let targets;

  if (args.length > 0) {
    // Modo explícito: arquivos passados como argumento (uso típico em pre-commit,
    // recebendo a lista de arquivos staged).
    targets = args.map((p) => path.resolve(p));
  } else {
    // Modo varredura completa: usado em CI para auditar o repo inteiro.
    targets = collectTargetFiles(repoRoot);
  }

  let failed = false;
  const results = [];

  for (const filePath of targets) {
    if (!fs.existsSync(filePath)) {
      console.error(`Erro: arquivo não encontrado em ${filePath}`);
      failed = true;
      continue;
    }
    const errors = validateHeader(filePath, repoRoot);
    const rel = path.relative(repoRoot, filePath);
    if (errors.length > 0) {
      failed = true;
      results.push(`FAIL ${rel}\n  - ${errors.join("\n  - ")}`);
    } else {
      results.push(`PASS ${rel}`);
    }
  }

  console.log(results.join("\n"));
  console.log(failed ? "\nGATE: FAIL" : "\nGATE: PASS");
  process.exit(failed ? 1 : 0);
}

main();
