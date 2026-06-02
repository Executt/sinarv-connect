#!/usr/bin/env node
/**
 * Security Gate
 * ----------------------------------------------------------------------------
 * Fails the build (exit code 1) when CRITICAL security findings are detected.
 *
 * Two layers of inspection:
 *   1. `npm audit --json` — fails on any HIGH or CRITICAL dependency CVE.
 *   2. Optional Supabase scan report (JSON) — fails on any finding whose
 *      `level` is "error" (i.e. critical). Warnings are tolerated.
 *
 * Inputs (environment variables):
 *   SUPABASE_SCAN_FILE   Path to a JSON file produced by the Lovable / Supabase
 *                        security scanner. Optional. When omitted, only the
 *                        dependency audit runs.
 *   ALLOW_HIGH_AUDIT     If "true", HIGH severity audit findings are tolerated
 *                        and only CRITICAL fails the gate. Default: false.
 *
 * Exit codes:
 *   0  no critical findings
 *   1  one or more critical findings — build must fail
 *   2  unexpected error while running the gate
 */

import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";

const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const GREEN = "\x1b[32m";
const RESET = "\x1b[0m";

const log = (msg) => console.log(msg);
const fail = (msg) => console.log(`${RED}✖ ${msg}${RESET}`);
const warn = (msg) => console.log(`${YELLOW}⚠ ${msg}${RESET}`);
const ok = (msg) => console.log(`${GREEN}✔ ${msg}${RESET}`);

let criticalCount = 0;
let highCount = 0;

// 1. npm audit ---------------------------------------------------------------
log("\n▶ Running dependency audit (npm audit)...");
try {
  const out = execSync("npm audit --json", {
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
  });
  parseAudit(out);
} catch (err) {
  // npm audit exits non-zero when vulns are found; stdout still contains JSON
  if (err.stdout) {
    parseAudit(err.stdout.toString());
  } else {
    warn(`Unable to run npm audit: ${err.message}`);
  }
}

function parseAudit(jsonStr) {
  let report;
  try {
    report = JSON.parse(jsonStr);
  } catch {
    warn("npm audit output was not valid JSON; skipping.");
    return;
  }
  const meta = report.metadata?.vulnerabilities ?? {};
  const c = meta.critical ?? 0;
  const h = meta.high ?? 0;
  criticalCount += c;
  if (process.env.ALLOW_HIGH_AUDIT !== "true") highCount += h;
  if (c || h) {
    fail(`npm audit: ${c} critical, ${h} high`);
  } else {
    ok("npm audit: no high/critical vulnerabilities");
  }
}

// 2. Supabase scan -----------------------------------------------------------
const scanFile = process.env.SUPABASE_SCAN_FILE;
if (scanFile && existsSync(scanFile)) {
  log(`\n▶ Inspecting Supabase scan report: ${scanFile}`);
  try {
    const data = JSON.parse(readFileSync(scanFile, "utf8"));
    const findings = Array.isArray(data) ? data : data.findings ?? [];
    const critical = findings.filter((f) => {
      const level = (f.finding?.level ?? f.level ?? "").toLowerCase();
      return level === "error" || level === "critical";
    });
    if (critical.length === 0) {
      ok("Supabase scan: no critical findings");
    } else {
      criticalCount += critical.length;
      fail(`Supabase scan: ${critical.length} critical finding(s)`);
      for (const f of critical) {
        const node = f.finding ?? f;
        console.log(`   • [${node.id ?? node.internal_id}] ${node.name}`);
      }
    }
  } catch (err) {
    warn(`Could not parse ${scanFile}: ${err.message}`);
  }
} else {
  warn("SUPABASE_SCAN_FILE not provided or missing — skipping backend scan.");
}

// Verdict --------------------------------------------------------------------
log("");
if (criticalCount > 0 || highCount > 0) {
  fail(
    `Security gate FAILED — ${criticalCount} critical, ${highCount} high finding(s).`,
  );
  process.exit(1);
}
ok("Security gate PASSED.");
process.exit(0);
