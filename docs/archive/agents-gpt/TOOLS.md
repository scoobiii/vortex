# GPT Agent — Tool Truth Matrix

| Category | Tools | Current classification | Next proof |
|---|---|---|---|
| Code/runtime | JavaScript, Python, Bash | REAL code paths | isolated integration tests |
| Filesystem | read/write/list | REAL constrained path | traversal + permission tests |
| Network | web fetch / external API | REAL code path | controlled endpoint + timeout/hash test |
| Memory | store/search | REAL deterministic/local | persistence + retrieval tests |
| GitHub | issue/PR/star/fork | CONDITIONAL REAL | least-privilege token + disposable repo test |
| Scheduling | schedule/list | REAL code path | deterministic clock/test queue |
| Agents | spawn/delegate | REAL code path | parent-child provenance test |
| Energy | BESS calculation | DETERMINISTIC | numerical fixtures |
| Market | crypto analysis | DETERMINISTIC | fixture/candle tests |
| Charts | chart data generation | DETERMINISTIC | schema fixtures |
| Runtime inspection | NanoClaw diagnostics | REAL local observation | host/runtime fixture |
| Python simulation | executePythonSim | MOCK/LEGACY | remove; forbid as success path |

## Required status vocabulary

- `REAL`: implementation exists and a live execution path is demonstrated.
- `CONDITIONAL`: implementation exists but depends on credentials, runtime or external service.
- `DETERMINISTIC`: computation can execute locally without an external service; correctness still needs tests.
- `MOCK/LEGACY`: simulation/fallback only; never count as real execution.
- `UNPROVEN`: code exists or is claimed, but the required live evidence has not been captured.

## Critical gap

`executed: true` must be tied to observed side effects/results, not merely an input flag. Evidence must describe the actual result that was observed.
