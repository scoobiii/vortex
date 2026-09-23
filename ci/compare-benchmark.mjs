// GOS3 · Vortex Foundation benchmark gate
import { readFile } from 'node:fs/promises';
const base = JSON.parse(await readFile(process.argv[2], 'utf8'));
const head = JSON.parse(await readFile(process.argv[3], 'utf8'));
const checks = [
  ['throughput', head.ops_per_sec >= base.ops_per_sec * 0.98, `ops/s ${head.ops_per_sec} >= ${base.ops_per_sec * 0.98}`],
  ['p95', head.p95_ms <= Math.max(1, base.p95_ms * 1.05), `p95 ${head.p95_ms}ms <= ${Math.max(1, base.p95_ms * 1.05)}ms`],
  ['p99', head.p99_ms <= Math.max(1, base.p99_ms * 1.10), `p99 ${head.p99_ms}ms <= ${Math.max(1, base.p99_ms * 1.10)}ms`],
  ['errors', head.error_rate <= base.error_rate + 0.001, `error rate ${head.error_rate} <= ${base.error_rate + 0.001}`],
  ['stress-errors', head.stress_errors === 0, `stress errors ${head.stress_errors} == 0`],
];
for (const [name, ok, detail] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${name}: ${detail}`);
if (checks.some(([, ok]) => !ok)) process.exit(1);
