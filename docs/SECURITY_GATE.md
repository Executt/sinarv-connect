# Security Gate

CI check that **fails the build when any critical security finding is detected**.

## What it checks

1. **Dependency CVEs** — runs `npm audit --json` and fails on any HIGH or CRITICAL vulnerability. Set `ALLOW_HIGH_AUDIT=true` to only fail on CRITICAL.
2. **Backend scan** — if `SUPABASE_SCAN_FILE` points to a JSON report from the Lovable / Supabase security scanner, fails on any finding whose `level` is `error` (warnings are tolerated).

## How it runs

GitHub Actions workflow: [`.github/workflows/security-gate.yml`](../.github/workflows/security-gate.yml)

Triggers:
- every push to `main`
- every pull request targeting `main`
- daily at 06:00 UTC (catches new CVEs against unchanged code)
- manual `workflow_dispatch`

## Local usage

```bash
# Dependency audit only
node scripts/security-gate.mjs

# Include a Supabase scan report
SUPABASE_SCAN_FILE=supabase/scan-report.json node scripts/security-gate.mjs
```

Exit codes: `0` pass · `1` critical findings · `2` runtime error.

## Adding the backend scan report

Export the JSON output of the Lovable security scanner to
`supabase/scan-report.json` (committed or uploaded as a CI artifact). The
workflow auto-detects the file and forwards it to the gate.
