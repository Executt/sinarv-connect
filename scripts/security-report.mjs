#!/usr/bin/env node
/**
 * Security Report Generator
 * ----------------------------------------------------------------------------
 * Consolidates `npm audit` + (optional) Supabase scan JSON into:
 *   - reports/security-report.json   machine-readable summary
 *   - reports/security-report.html   human-readable dashboard
 *
 * Inputs (env):
 *   SUPABASE_SCAN_FILE   Path to backend scan JSON. Optional.
 *   OUT_DIR              Output directory. Default: "reports".
 */

import { execSync } from "node:child_process";
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT_DIR = process.env.OUT_DIR ?? "reports";
mkdirSync(OUT_DIR, { recursive: true });

// ── npm audit ───────────────────────────────────────────────────────────────
let audit = { metadata: { vulnerabilities: {} }, vulnerabilities: {} };
try {
  const raw = execSync("npm audit --json", {
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
  });
  audit = JSON.parse(raw);
} catch (err) {
  if (err.stdout) {
    try { audit = JSON.parse(err.stdout.toString()); } catch {}
  }
}

const auditVulns = Object.entries(audit.vulnerabilities ?? {}).map(([name, v]) => ({
  name,
  severity: v.severity,
  via: Array.isArray(v.via) ? v.via.map((x) => (typeof x === "string" ? x : x.title ?? x.name)).filter(Boolean) : [],
  range: v.range,
  fixAvailable: !!v.fixAvailable,
}));

// ── Supabase scan ───────────────────────────────────────────────────────────
let supabase = [];
const scanFile = process.env.SUPABASE_SCAN_FILE;
if (scanFile && existsSync(scanFile)) {
  try {
    const data = JSON.parse(readFileSync(scanFile, "utf8"));
    const findings = Array.isArray(data) ? data : data.findings ?? [];
    supabase = findings.map((f) => {
      const node = f.finding ?? f;
      return {
        scanner: f.scanner_name ?? "supabase",
        id: node.id ?? node.internal_id,
        name: node.name,
        level: (node.level ?? "").toLowerCase(),
        description: node.description,
        link: node.link,
      };
    });
  } catch (err) {
    console.error(`Could not parse ${scanFile}: ${err.message}`);
  }
}

// ── Summary ─────────────────────────────────────────────────────────────────
const meta = audit.metadata?.vulnerabilities ?? {};
const summary = {
  generatedAt: new Date().toISOString(),
  commit: process.env.GITHUB_SHA ?? null,
  branch: process.env.GITHUB_REF_NAME ?? null,
  audit: {
    critical: meta.critical ?? 0,
    high: meta.high ?? 0,
    moderate: meta.moderate ?? 0,
    low: meta.low ?? 0,
    info: meta.info ?? 0,
    total: meta.total ?? auditVulns.length,
  },
  supabase: {
    error: supabase.filter((s) => s.level === "error" || s.level === "critical").length,
    warn: supabase.filter((s) => s.level === "warn" || s.level === "warning").length,
    info: supabase.filter((s) => s.level === "info").length,
    total: supabase.length,
  },
};
summary.criticalTotal = summary.audit.critical + summary.audit.high + summary.supabase.error;
summary.passed = summary.criticalTotal === 0;

// ── JSON report ─────────────────────────────────────────────────────────────
const json = { summary, npmAudit: auditVulns, supabase };
writeFileSync(join(OUT_DIR, "security-report.json"), JSON.stringify(json, null, 2));

// ── HTML report ─────────────────────────────────────────────────────────────
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const badge = (label, value, tone) =>
  `<span class="badge ${tone}"><strong>${value}</strong> ${esc(label)}</span>`;

const sevTone = (sev) => ({
  critical: "danger", high: "danger", error: "danger",
  moderate: "warn", warn: "warn", warning: "warn",
  low: "info", info: "info",
}[sev] ?? "muted");

const auditRows = auditVulns.length
  ? auditVulns
      .sort((a, b) => sevRank(b.severity) - sevRank(a.severity))
      .map(
        (v) => `<tr>
          <td><code>${esc(v.name)}</code></td>
          <td><span class="badge ${sevTone(v.severity)}">${esc(v.severity)}</span></td>
          <td>${esc(v.range ?? "")}</td>
          <td>${esc(v.via.join(", "))}</td>
          <td>${v.fixAvailable ? "✔" : "—"}</td>
        </tr>`,
      )
      .join("")
  : `<tr><td colspan="5" class="empty">No dependency vulnerabilities detected.</td></tr>`;

const supabaseRows = supabase.length
  ? supabase
      .sort((a, b) => sevRank(b.level) - sevRank(a.level))
      .map(
        (s) => `<tr>
          <td><span class="badge ${sevTone(s.level)}">${esc(s.level || "n/a")}</span></td>
          <td><code>${esc(s.id)}</code></td>
          <td>${esc(s.name)}<div class="desc">${esc(s.description ?? "")}</div></td>
          <td>${s.link ? `<a href="${esc(s.link)}" target="_blank" rel="noreferrer">Docs ↗</a>` : ""}</td>
        </tr>`,
      )
      .join("")
  : `<tr><td colspan="4" class="empty">No backend scan findings (or no report supplied).</td></tr>`;

function sevRank(s) {
  return { critical: 5, error: 5, high: 4, warn: 3, warning: 3, moderate: 3, low: 2, info: 1 }[s] ?? 0;
}

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Security Report — ${esc(summary.commit?.slice(0, 7) ?? "local")}</title>
<style>
  :root { color-scheme: light dark; }
  body { font: 14px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; margin: 0; background: #0f172a; color: #e2e8f0; }
  header { padding: 24px 32px; background: linear-gradient(135deg, #1e293b, #0f172a); border-bottom: 1px solid #334155; }
  h1 { margin: 0 0 4px; font-size: 22px; }
  .meta { color: #94a3b8; font-size: 12px; }
  .status { display: inline-block; padding: 4px 12px; border-radius: 999px; font-weight: 600; margin-left: 8px; }
  .status.pass { background: #14532d; color: #bbf7d0; }
  .status.fail { background: #7f1d1d; color: #fecaca; }
  main { padding: 24px 32px; max-width: 1200px; margin: 0 auto; }
  section { margin-bottom: 32px; }
  h2 { font-size: 16px; margin: 0 0 12px; color: #f1f5f9; }
  .badges { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
  .badge { display: inline-flex; gap: 6px; padding: 4px 10px; border-radius: 6px; font-size: 12px; background: #1e293b; color: #cbd5e1; }
  .badge.danger { background: #450a0a; color: #fecaca; }
  .badge.warn   { background: #422006; color: #fed7aa; }
  .badge.info   { background: #1e3a8a; color: #bfdbfe; }
  .badge.muted  { background: #1e293b; color: #94a3b8; }
  table { width: 100%; border-collapse: collapse; background: #1e293b; border-radius: 8px; overflow: hidden; }
  th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #334155; vertical-align: top; }
  th { background: #0f172a; font-size: 12px; text-transform: uppercase; letter-spacing: .05em; color: #94a3b8; }
  tr:last-child td { border-bottom: none; }
  code { background: #0f172a; padding: 1px 6px; border-radius: 4px; font-size: 12px; }
  .desc { color: #94a3b8; font-size: 12px; margin-top: 4px; }
  .empty { text-align: center; color: #64748b; padding: 24px; }
  a { color: #93c5fd; }
</style>
</head>
<body>
<header>
  <h1>Security Report
    <span class="status ${summary.passed ? "pass" : "fail"}">${summary.passed ? "PASSED" : "FAILED"}</span>
  </h1>
  <div class="meta">
    Generated ${esc(summary.generatedAt)} ·
    ${summary.commit ? `commit <code>${esc(summary.commit.slice(0, 7))}</code> · ` : ""}
    ${summary.branch ? `branch <code>${esc(summary.branch)}</code>` : ""}
  </div>
</header>
<main>
  <section>
    <h2>Summary</h2>
    <div class="badges">
      ${badge("critical (deps)", summary.audit.critical, "danger")}
      ${badge("high (deps)", summary.audit.high, "danger")}
      ${badge("moderate (deps)", summary.audit.moderate, "warn")}
      ${badge("low (deps)", summary.audit.low, "info")}
      ${badge("error (backend)", summary.supabase.error, "danger")}
      ${badge("warn (backend)", summary.supabase.warn, "warn")}
    </div>
  </section>

  <section>
    <h2>Dependency vulnerabilities (npm audit)</h2>
    <table>
      <thead><tr><th>Package</th><th>Severity</th><th>Range</th><th>Via</th><th>Fix</th></tr></thead>
      <tbody>${auditRows}</tbody>
    </table>
  </section>

  <section>
    <h2>Backend scan (Supabase / Lovable)</h2>
    <table>
      <thead><tr><th>Level</th><th>ID</th><th>Finding</th><th>Docs</th></tr></thead>
      <tbody>${supabaseRows}</tbody>
    </table>
  </section>
</main>
</body>
</html>`;

writeFileSync(join(OUT_DIR, "security-report.html"), html);

console.log(`Wrote ${OUT_DIR}/security-report.json and ${OUT_DIR}/security-report.html`);
console.log(`Status: ${summary.passed ? "PASS" : "FAIL"} (critical total: ${summary.criticalTotal})`);
