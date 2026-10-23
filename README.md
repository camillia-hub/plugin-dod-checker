# DoD Checker

Guards the definition of done. When a task's implementation finishes, the
plugin looks for simple signals in the event fields and, if any are missing,
posts a comment listing what looks incomplete and moves the task to
`Blocked`.

## Hook registered

- `task.implementation_finished` → `taskImplementationFinished(event)` via
  the exported `hooks` map.

## Grants requested

- `edit-task` — needed to `set_status` to `Blocked` when signals are missing.
- `comment-task` — needed to post the report of what looks missing.

## Signals checked

- **tests** — the description mentions tests via simple patterns such as
  `test`, `tested`, `spec`, `coverage` or `e2e`.
- **docs** — the description mentions documentation via patterns such as
  `docs`, `documentation`, `readme`, `changelog` or `guide`.
- **runId** — the event carries the id of the implementation run.

## Behaviour

- All signals present → no-op (`[]`), the plugin stays silent.
- Signals missing → exactly two operations: a `comment` listing what looks
  missing, then `set_status` to `Blocked`. The comment asks the team to add
  the missing pieces and set the task back to `InReview`.
- An event with no title, id or description at all is treated as malformed
  and returns `[]`; the plugin never throws.

## Example

Event:

```json
{
  "hook": "task.implementation_finished",
  "taskTitle": "Rework billing",
  "taskDescription": "Changed the billing module."
}
```

Operations returned:

```json
[
  {
    "type": "comment",
    "value": "### Definition-of-done check\nImplementation finished for **Rework billing**, but some DoD signals look missing:\n- tests: no mention of tests (expected words like \"test\", \"tested\", \"coverage\" or \"e2e\" in the description)\n- docs: no mention of documentation (expected words like \"docs\", \"readme\" or \"changelog\" in the description)\n- runId: no implementation run id on the event\n\nMoving the task to **Blocked**. Please add the missing pieces and set it back to InReview."
  },
  { "type": "set_status", "value": "Blocked" }
]
```

## Install

Install from the Camillia marketplace (or upload the files listed in
`hub.json`: `plugin.json`, `index.js`, `package.json`) and enable the plugin
for your workspace. Requires Node.js 22 or newer to run the tests with
`npm test`.
