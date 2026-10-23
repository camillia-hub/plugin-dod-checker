import test from "node:test";
import assert from "node:assert/strict";
import {
  buildReport,
  findMissingSignals,
  hooks,
  mentionsDocs,
  mentionsTests,
  taskImplementationFinished,
} from "../index.js";

test("hooks map registers task.implementation_finished", () => {
  assert.deepEqual(Object.keys(hooks), ["task.implementation_finished"]);
  assert.equal(typeof hooks["task.implementation_finished"], "function");
});

test("passes silently when all signals are present", async () => {
  const ops = await taskImplementationFinished({
    taskDescription: "Added unit tests and updated the docs.",
    runId: "run-123",
  });
  assert.deepEqual(ops, []);
});

test("detects the individual signals", () => {
  assert.ok(mentionsTests("covered by unit tests"));
  assert.ok(mentionsTests("e2e run finished"));
  assert.ok(!mentionsTests("no quality notes here"));
  assert.ok(mentionsDocs("see the readme"));
  assert.ok(!mentionsDocs("nothing written down"));
});

test("blocks the task and lists what is missing", async () => {
  const ops = await taskImplementationFinished({
    taskTitle: "Rework billing",
    taskDescription: "Changed the billing module.",
  });
  assert.equal(ops.length, 2);
  assert.equal(ops[0].type, "comment");
  assert.ok(ops[0].value.includes("tests"));
  assert.ok(ops[0].value.includes("docs"));
  assert.ok(ops[0].value.includes("runId"));
  assert.deepEqual(ops[1], { type: "set_status", value: "Blocked" });
});

test("only reports the signals that are actually missing", async () => {
  const allPresent = findMissingSignals({ taskDescription: "Updated docs, covered by tests.", runId: "r1" });
  assert.deepEqual(allPresent, []);
  const ops = await taskImplementationFinished({ taskDescription: "Updated docs, covered by tests." });
  assert.equal(ops.length, 2);
  assert.ok(ops[0].value.includes("runId"));
  assert.ok(!ops[0].value.includes("- tests:"));
  assert.ok(!ops[0].value.includes("- docs:"));
});

test("report explains each missing signal", () => {
  const report = buildReport({ taskTitle: "T" }, ["tests", "docs", "runId"]);
  assert.ok(report.includes("Definition-of-done"));
  assert.ok(report.includes("Blocked"));
  assert.equal(findMissingSignals({ taskTitle: "T" }).length, 3);
});

test("never throws on missing or malformed events", async () => {
  assert.deepEqual(await taskImplementationFinished(undefined), []);
  assert.deepEqual(await taskImplementationFinished(null), []);
  assert.deepEqual(await taskImplementationFinished("nope"), []);
  assert.deepEqual(await taskImplementationFinished({}), []);
});
