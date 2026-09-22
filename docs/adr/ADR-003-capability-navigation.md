# ADR-003: Capability-Aware Navigation

## Status
Accepted

## Context
Services must only be visible when the active emulator supports them.

## Decision
Navigation items filtered through getAvailableNavigationItems() which checks SERVICE_REGISTRY against active provider health/capability.

## Consequences
### Positive
- Honest UI - no fake working services
- Automatic catalog refresh on provider switch
- Clear disabled states with reasons

### Negative
- Complex filtering logic
- Requires accurate emulator capability reporting