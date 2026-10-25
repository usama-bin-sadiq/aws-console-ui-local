# Bugs

No bugs reproduced yet. Tests have not been run against the local dev server.

## To check (not yet reproduced)

- Verify all 174 "yes" features in features.csv actually work end to end
- Verify contrast on every screen at 390px and 1440px widths
- Verify keyboard-only navigation on each service page
- Verify axe-core accessibility scan passes on each screen

## Bug format (when found)

### BUG-001: {{short title}}

- Severity: {{S1 | S2 | S3 | S4}}
- Flow / case: {{F01 / F01-E1 / ...}}
- Screen: {{S07}}
- Build: {{commit}} Browser / device: {{Chrome 140, 1440px}}

Steps
1. {{exact step}}
2. {{exact step}}

Expected: {{what should happen}}
Actual: {{what happened}}
Evidence: {{replica/bugs/BUG-001.png, console error text, failing test name}}
Suspected cause: {{optional}}
Status: {{open | fixed in abc1234 | won't fix: reason}}
