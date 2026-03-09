#!/usr/bin/env node
/**
 * Auto-Commit Agent – after each prompt, commits changed files and pushes,
 * linking to the GitHub issue tracked for this session.
 */

import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import path from "path";
import os from "os";

const TRACKING_FILE = path.join(process.cwd(), ".claude", "issue-tracking.json");
const SENSITIVE = [".env", ".env.local", ".env.production", "credentials", "secret"];

function run(cmd, opts = {}) {
  return execSync(cmd, { encoding: "utf8", timeout: 30000, ...opts }).trim();
}

function loadTracking() {
  if (existsSync(TRACKING_FILE)) {
    try { return JSON.parse(readFileSync(TRACKING_FILE, "utf8")); } catch { }
  }
  return {};
}

function hasChanges() {
  const status = run("git status --porcelain");
  return status.length > 0;
}

function getStagedAndUnstagedFiles() {
  const status = run("git status --porcelain");
  return status.split("\n").filter(Boolean).map(l => l.slice(3).trim());
}

function hasSensitiveFiles(files) {
  return files.some(f => SENSITIVE.some(s => f.toLowerCase().includes(s)));
}

function buildCommitMessage(sessionId, tracking) {
  // Get last prompt from transcript to craft message prefix
  const transcriptPath = sessionId
    ? path.join(os.homedir(), ".claude", "projects", "c--WoWLookup", `${sessionId}.jsonl`)
    : null;

  let lastPrompt = "";
  if (transcriptPath && existsSync(transcriptPath)) {
    try {
      const lines = readFileSync(transcriptPath, "utf8").split("\n").filter(Boolean);
      for (let i = lines.length - 1; i >= 0; i--) {
        try {
          const obj = JSON.parse(lines[i]);
          if (obj.type === "last-prompt" && obj.lastPrompt) {
            lastPrompt = obj.lastPrompt.replace(/\n/g, " ").trim().slice(0, 72);
            break;
          }
        } catch { }
      }
    } catch { }
  }

  // Determine conventional commit prefix from prompt
  let prefix = "feat";
  if (lastPrompt) {
    const lower = lastPrompt.toLowerCase();
    if (lower.match(/\b(fix|behebe|bug|fehler|korrigiere)\b/)) prefix = "fix";
    else if (lower.match(/\b(refactor|umbau|umstruktur)\b/)) prefix = "refactor";
    else if (lower.match(/\b(docs?|readme|dokumentat)\b/)) prefix = "docs";
    else if (lower.match(/\b(style|design|css|farbe|layout)\b/)) prefix = "style";
    else if (lower.match(/\b(test|spec)\b/)) prefix = "test";
    else if (lower.match(/\b(chore|setup|config|hook|agent)\b/)) prefix = "chore";
  }

  const subject = lastPrompt
    ? `${prefix}: ${lastPrompt.slice(0, 65)}`
    : `${prefix}: auto-commit changes`;

  // Changed files for commit body
  let changedFiles = "";
  try {
    const files = run("git diff --cached --name-only").split("\n").filter(Boolean);
    if (files.length > 0) {
      changedFiles = "\n\nGeaenderte Dateien:\n" + files.map(f => `- ${f}`).join("\n");
    }
  } catch { }

  // Diff stat summary
  let fullDiffStat = "";
  try {
    const stat = run("git diff --cached --stat --no-color");
    if (stat) fullDiffStat = "\n\n" + stat;
  } catch { }

  // Issue reference
  const sessionData = sessionId ? tracking[sessionId] : null;
  const issueRef = sessionData?.issueNumber ? `\n\nCloses #${sessionData.issueNumber}` : "";

  return `${subject}${changedFiles}${fullDiffStat}${issueRef}`;
}

async function main() {
  // Read stdin
  let hookData = {};
  try {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString("utf8").trim();
    if (raw) hookData = JSON.parse(raw);
  } catch { }

  const sessionId = hookData.session_id || hookData.sessionId || "";

  // Skip if nothing changed
  if (!hasChanges()) {
    process.exit(0);
  }

  const files = getStagedAndUnstagedFiles();

  // Safety check: never commit sensitive files
  if (hasSensitiveFiles(files)) {
    console.error("[auto-commit] Skipping – sensitive files detected:", files.filter(f => SENSITIVE.some(s => f.toLowerCase().includes(s))));
    process.exit(0);
  }

  const tracking = loadTracking();
  const commitMsg = buildCommitMessage(sessionId, tracking);

  try {
    // Stage all tracked + new non-sensitive files (.gitignore handles the rest)
    run("git add .");

    // Verify something is staged
    const staged = run("git diff --cached --name-only");
    if (!staged) {
      process.exit(0);
    }

    // Commit
    run(`git commit -m "${commitMsg.replace(/"/g, "'")}"`);
    console.log(`[auto-commit] Committed: ${commitMsg.split("\n")[0]}`);

    // Push
    run("git push");
    console.log("[auto-commit] Pushed to remote.");
  } catch (e) {
    console.error("[auto-commit] Failed:", e.message);
  }

  process.exit(0);
}

main().catch(e => {
  console.error("[auto-commit] Error:", e.message);
  process.exit(0);
});
