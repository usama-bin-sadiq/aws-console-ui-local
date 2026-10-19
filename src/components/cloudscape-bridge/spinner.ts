/**
 * Bridge: re-exports the design-markup shim where one exists, otherwise the
 * real Cloudscape component. Aliased via tsconfig `paths` so every call site
 * picks this up without a per-file edit.
 *
 * GENERATED - run: node scripts/generate-cloudscape-bridge.mjs
 */
export { Spinner as default, Spinner } from "./shims";
export * from "./shims";
