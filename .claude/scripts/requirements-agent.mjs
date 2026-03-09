#!/usr/bin/env node
/**
 * Requirements Agent – reads transcript, detects feature/bug requests,
 * creates or updates GitHub issues automatically.
 */

import { execSync } from "child_process";
import { readFileSync, writeFileSync, existsSync, createReadStream } from "fs";
import { createInterface } from "readline";
import path from "path";
import os from "os";

const TRACKING_FILE = path.join(process.cwd(), ".claude", "issue-tracking.json");
const REPO = "Grigo1707/WoWLookup";

// Keywords that indicate a requirement/feature/bug request
const REQUIREMENT_KEYWORDS_DE = [
  "füge", "erstelle", "implementiere", "mach", "baue", "zeige", "behebe",
  "feature", "funktion", "soll", "muss", "brauche", "benötige", "wünsche",
  "bug", "fehler", "problem", "issue", "verbessere", "optimiere", "ändere",
  "neue", "hinzu", "support", "unterstütze",
];
const REQUIREMENT_KEYWORDS_EN = [
  "add", "create", "implement", "build", "show", "fix", "feature",
  "should", "must", "need", "want", "bug", "error", "problem",
  "improve", "optimize", "change", "new", "support", "display",
];

const ALL_KEYWORDS = [...REQUIREMENT_KEYWORDS_DE, ...REQUIREMENT_KEYWORDS_EN];

function isRequirementPrompt(prompt) {
  if (!prompt || prompt.length < 10) return false;
  const lower = prompt.toLowerCase();
  // Skip short meta-prompts or continuations
  if (lower.startsWith("mach weiter") || lower.startsWith("continue") ||
      lower.startsWith("ja") || lower.startsWith("nein") ||
      lower.startsWith("ok") || lower.length < 20) return false;
  return ALL_KEYWORDS.some(kw => lower.includes(kw));
}

function extractTitle(prompt) {
  // Take first 80 chars, clean up
  const first = prompt.replace(/\n/g, " ").trim().slice(0, 100);
  return first.length > 80 ? first.slice(0, 77) + "..." : first;
}

function loadTracking() {
  if (existsSync(TRACKING_FILE)) {
    try { return JSON.parse(readFileSync(TRACKING_FILE, "utf8")); } catch { }
  }
  return {};
}

function saveTracking(data) {
  try {
    writeFileSync(TRACKING_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("[requirements-agent] Failed to save tracking:", e.message);
  }
}

function getExistingIssues() {
  try {
    const out = execSync(
      `gh issue list --repo ${REPO} --state open --json title,number --limit 50`,
      { encoding: "utf8", timeout: 10000 }
    );
    return JSON.parse(out);
  } catch {
    return [];
  }
}

function isSimilarIssue(prompt, issues) {
  const promptWords = prompt.toLowerCase().split(/\s+/).filter(w => w.length > 4);
  for (const issue of issues) {
    const titleWords = issue.title.toLowerCase().split(/\s+/);
    const matches = promptWords.filter(w => titleWords.some(tw => tw.includes(w) || w.includes(tw)));
    if (matches.length >= 2) return issue.number;
  }
  return null;
}

function readLastPromptFromTranscript(transcriptPath) {
  if (!transcriptPath || !existsSync(transcriptPath)) return null;
  try {
    const lines = readFileSync(transcriptPath, "utf8").split("\n").filter(Boolean);
    // Find last-prompt entry
    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const obj = JSON.parse(lines[i]);
        if (obj.type === "last-prompt" && obj.lastPrompt) {
          return obj.lastPrompt;
        }
      } catch { }
    }
    // Fallback: find last user message
    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const obj = JSON.parse(lines[i]);
        if (obj.type === "user" && obj.message?.role === "user") {
          const content = obj.message.content;
          if (typeof content === "string") return content;
          if (Array.isArray(content)) {
            const text = content.find(c => c.type === "text");
            if (text?.text) return text.text;
          }
        }
      } catch { }
    }
  } catch (e) {
    console.error("[requirements-agent] Failed to read transcript:", e.message);
  }
  return null;
}

async function main() {
  // Read stdin (Claude Code passes hook data as JSON)
  let hookData = {};
  try {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString("utf8").trim();
    if (raw) hookData = JSON.parse(raw);
  } catch { }

  const sessionId = hookData.session_id || hookData.sessionId || "";
  const transcriptPath = hookData.transcript_path ||
    (sessionId ? path.join(os.homedir(), ".claude", "projects", "c--WoWLookup", `${sessionId}.jsonl`) : null);

  const prompt = readLastPromptFromTranscript(transcriptPath);
  if (!prompt) {
    process.exit(0);
  }

  if (!isRequirementPrompt(prompt)) {
    process.exit(0);
  }

  const tracking = loadTracking();

  // Check if we already created an issue for this session
  if (sessionId && tracking[sessionId]) {
    process.exit(0);
  }

  // Check for similar existing issues
  const existingIssues = getExistingIssues();
  const similarIssueNum = isSimilarIssue(prompt, existingIssues);

  if (similarIssueNum) {
    // Comment on existing issue
    try {
      execSync(
        `gh issue comment ${similarIssueNum} --repo ${REPO} --body "Related prompt: ${prompt.slice(0, 200)}"`,
        { encoding: "utf8", timeout: 10000 }
      );
      console.log(`[requirements-agent] Updated existing issue #${similarIssueNum}`);
      if (sessionId) {
        tracking[sessionId] = { issueNumber: similarIssueNum, prompt: prompt.slice(0, 100) };
        saveTracking(tracking);
      }
    } catch (e) {
      console.error("[requirements-agent] Failed to comment:", e.message);
    }
    process.exit(0);
  }

  // Create new issue
  try {
    const title = extractTitle(prompt);
    // Determine label from keywords
    let label = "enhancement";
    const lower = prompt.toLowerCase();
    if (lower.includes("bug") || lower.includes("fehler") || lower.includes("problem") || lower.includes("behebe") || lower.includes("fix")) {
      label = "bug";
    }

    const body = `## Anforderung\n${prompt.slice(0, 1000)}\n\n_Automatisch erstellt von requirements-agent_`;
    const out = execSync(
      `gh issue create --repo ${REPO} --title "${title.replace(/"/g, "'")}" --body "${body.replace(/"/g, "'").replace(/\n/g, "\\n")}" --label "${label}"`,
      { encoding: "utf8", timeout: 15000 }
    );
    const issueUrl = out.trim();
    const issueMatch = issueUrl.match(/\/issues\/(\d+)/);
    const issueNumber = issueMatch ? parseInt(issueMatch[1]) : null;

    console.log(`[requirements-agent] Created issue: ${issueUrl}`);

    if (sessionId && issueNumber) {
      tracking[sessionId] = { issueNumber, prompt: prompt.slice(0, 100), url: issueUrl };
      saveTracking(tracking);
    }
  } catch (e) {
    console.error("[requirements-agent] Failed to create issue:", e.message);
  }

  process.exit(0);
}

main().catch(e => {
  console.error("[requirements-agent] Error:", e.message);
  process.exit(0);
});
