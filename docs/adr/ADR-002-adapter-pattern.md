# ADR-002: Adapter Pattern for Multi-Backend Support

## Status
Accepted

## Context
Need to support both LocalStack and MiniStack with different capability profiles.

## Decision
Implement adapter pattern with factory (createAdapter) that provides endpoint resolution, auth injection, request mapping, response normalization per backend.

## Consequences
### Positive
- Clean separation of backend concerns
- Easy to add new backends
- Capability-aware navigation built on adapter metadata

### Negative
- Additional abstraction layer
- Request/response mapping complexity