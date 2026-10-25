# Test plan: aws-console (AWS Console Emulator Clone)

Build: local  Date: 2026-10-20  Env: local dev server, LocalStack/Ministack emulator, seed data

| case | flow | type | steps | expected | auto | result |
| --- | --- | --- | --- | --- | --- | --- |
| F01-H1 | Browse and open a service | happy | Home → Services overlay → click EC2 → EC2 list loads | EC2 instances table, service header "EC2", counter, create button | e2e | |
| F01-E1 | Browse and open a service | edge: disabled service | Services overlay → disabled (checking) service → tooltip/reason | Service not clickable, reason shown | e2e | |
| F02-H1 | Search for a service | happy | Search field → type "EC2" → select result | EC2 list page loads | e2e | |
| F02-E1 | Search for a service | edge: no matches | Search → type "zzznothing" → results | "No services match" empty state | e2e | |
| F03-H1 | List resources, then create one | happy | EC2 list → Launch instances → wizard steps → submit → EC2 list | New instance appears in table, counter incremented | e2e | |
| F03-E1 | List resources, then create one | edge: very long name | Wizard → name field → 200+ chars | Input accepts or truncates gracefully, no crash | e2e | |
| F03-E2 | List resources, then create one | edge: empty required field | Wizard → submit with empty required field | Inline error, field highlighted, no submission | e2e | |
| F03-E3 | List resources, then create one | edge: double click submit | Wizard → double click create button | One resource created, not two | e2e | |
| F03-E4 | List resources, then create one | edge: refresh mid-flow | Wizard → browser refresh mid-wizard | Wizard resets to step 1 or preserves state (no crash) | e2e | |
| F03-E5 | List resources, then create one | edge: mobile width | View at 390px → wizard → submit | Wizard usable, buttons reachable, no overflow | e2e | |
| F03-N1 | List resources, then create one | negative: emulator unreachable | EC2 list → create → backend 5xx | Error alert, retry action, no partial state | e2e | |
| F04-H1 | View a resource detail | happy | EC2 list → click instance row → instance detail | Detail page with instance attributes, tabs (Details/Tags/Monitoring) | e2e | |
| F04-E1 | View a resource detail | edge: long content | Detail → 60+ char name, long ARN | Text wraps/truncates gracefully, no layout break | e2e | |
| F04-E2 | View a resource detail | edge: tabs switch | Detail → click Tags, Monitoring | Tab content switches, no full page reload | e2e | |
| F05-H1 | Delete one or more resources | happy | EC2 list → select instances → Actions → Delete → confirm | Instances removed from table, counter decremented | e2e | |
| F05-E1 | Delete one or more resources | edge: no selection | EC2 list → Actions → Delete (nothing selected) | Delete disabled or no-op | e2e | |
| F05-E2 | Delete one or more resources | edge: confirm cancel | EC2 list → select → Delete → Cancel | Instances remain, no deletion | e2e | |
| F05-N1 | Delete one or more resources | negative: emulator error | EC2 list → select → Delete → confirm → backend 5xx | Error alert, instances not removed | e2e | |
| F06-H1 | Change region | happy | Region selector → pick different region → region pill updates | All pages reflect new region, service list reloads | e2e | |
| F06-E1 | Change region | edge: region unavailable | Region selector → unreachable region | Error or disabled state | manual | |
| F07-H1 | Sign out | happy | Account menu → Sign out → login page | Login page, session cleared | e2e | |
| F08-H1 | Add to favorites | happy | Services overlay → favorite star → Console Home | Service appears in Favorites section | e2e | |
| F08-E1 | Add to favorites | edge: persist across reload | Favorite → reload → Console Home | Favorite still present | e2e | |
| F09-H1 | Global search keyboard shortcut | happy | Alt+S → search field focused | Search field has focus, cursor in input | e2e | |
| F09-E1 | Global search keyboard shortcut | edge: search closed then open | Alt+S when closed → opens search overlay | Search overlay visible, field focused | e2e | |
| F10-H1 | Theme toggle | happy | Theme button → dark/light toggle | Colors invert, persists on reload | e2e | |
| F11-H1 | Terminal panel | happy | Terminal button → terminal opens → type command | xterm output, command executed | e2e | |
| F11-E1 | Terminal panel | edge: terminal close then open | Terminal → close → reopen | State preserved or fresh terminal | e2e | |

Negative cases applicable across all flows:
- N1: emulator unreachable (backend 5xx) → error alert, retry
- N2: expired session → redirect to login
- N3: second user's data must be invisible (data isolation)

Accessibility (every screen, every flow):
- A1: keyboard-only navigation completes the flow
- A2: visible focus indicators on all interactive elements
- A3: axe-core scan passes with zero violations on each screen
- A4: images have alt text, buttons have accessible names
- A5: color is never the only means of conveying information

Result column: e2e = automated via Playwright, manual = human verification
