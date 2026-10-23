// plugin-dod-checker
// Checks definition-of-done signals when implementation finishes. When signals
// are missing it posts a comment listing what looks missing and moves the task
// to Blocked.
// Grants requested: edit-task (move the task to Blocked) and comment-task (report).

const TEST_PATTERNS = [
  /\btests?\b/i,
  /\btested\b/i,
  /\bspec\b/i,
  /\bcoverage\b/i,
  /\be2e\b/i,
];

const DOC_PATTERNS = [
  /\bdocs?\b/i,
  /\bdocumentation\b/i,
  /\breadme\b/i,
  /\bchangelog\b/i,
  /\bguide\b/i,
];

const SIGNAL_EXPLANATIONS = {
  tests: 'no mention of tests (expected words like "test", "tested", "coverage" or "e2e" in the description)',
  docs: 'no mention of documentation (expected words like "docs", "readme" or "changelog" in the description)',
  runId: "no implementation run id on the event",
};

function asString(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : "";
}

export function mentionsTests(text) {
  return typeof text === "string" && TEST_PATTERNS.some((regex) => regex.test(text));
}

export function mentionsDocs(text) {
  return typeof text === "string" && DOC_PATTERNS.some((regex) => regex.test(text));
}

export function findMissingSignals(event) {
  if (!event || typeof event !== "object") return [];
  const description = typeof event.taskDescription === "string" ? event.taskDescription : "";
  const identifiable = description.trim().length > 0 || asString(event.taskTitle) || asString(event.taskId);
  if (!identifiable) return [];
  const missing = [];
  if (!mentionsTests(description)) missing.push("tests");
  if (!mentionsDocs(description)) missing.push("docs");
  if (!asString(event.runId)) missing.push("runId");
  return missing;
}

export function buildReport(event, missing) {
  const title = event && typeof event === "object" ? asString(event.taskTitle) : "";
  const lines = [];
  lines.push("### Definition-of-done check");
  lines.push("Implementation finished" + (title ? " for **" + title + "**" : "") + ", but some DoD signals look missing:");
  for (const signal of missing) {
    lines.push("- " + signal + ": " + SIGNAL_EXPLANATIONS[signal]);
  }
  lines.push("");
  lines.push("Moving the task to **Blocked**. Please add the missing pieces and set it back to InReview.");
  return lines.join("\n");
}

export async function taskImplementationFinished(event) {
  const missing = findMissingSignals(event);
  if (missing.length === 0) return [];
  return [
    { type: "comment", value: buildReport(event, missing) },
    { type: "set_status", value: "Blocked" },
  ];
}

export const hooks = {
  "task.implementation_finished": taskImplementationFinished,
};
