# npm/pnpm Security Audit Patterns

## pnpm overrides: Major Version Bumps Break Transitive Consumers

**Context:** CI failed on `pnpm audit --audit-level=high` due to `minimatch` ReDoS CVE in eslint/typescript-eslint transitive deps. Attempted fix: `pnpm.overrides` to force `minimatch@<10.2.1` → `^10.2.1`.

**Learning:** Blanket overrides of utility packages across major versions are dangerous. `minimatch` 3.x uses `module.exports = function minimatch()` (default export), while 10.x uses `export { minimatch }` (named export). The override caused `eslint-plugin-jsx-a11y` to crash: `(0 , _minimatch.default) is not a function`.

**Rule:** Never override a transitive dependency across major versions unless you've verified every consumer is compatible. Utility packages like `minimatch`, `ajv`, `glob` are consumed by dozens of packages with different API expectations.

```json
// DANGEROUS — breaks consumers expecting old API
"pnpm": {
  "overrides": {
    "minimatch@<10.2.1": "^10.2.1"
  }
}

// SAFE — use --prod audit + ignoreCves instead
"pnpm": {
  "auditConfig": {
    "ignoreCves": ["CVE-XXXX-XXXXX"]
  }
}
```

**Apply when:** Transitive dependency has unfixable CVE and upstream hasn't updated.

---

## CI Audit: Use `--prod` to Skip Dev Tooling Vulnerabilities

**Context:** eslint, @typescript-eslint, stylelint all depend on vulnerable `minimatch` 3.x and `ajv` 6.x. These are dev-only — never ship to users. But `pnpm audit --audit-level=high` fails CI on them.

**Learning:** Use `pnpm audit --prod --audit-level=high` in CI. Dev tooling vulns (ReDoS in glob matching, schema validation) can't affect deployed applications. For any remaining production transitive CVEs (e.g., build-time plugins like `@sentry/bundler-plugin-core`), use `pnpm.auditConfig.ignoreCves`.

```yaml
# .github/workflows/ci.yml
- name: Security audit (production deps)
  run: pnpm audit --prod --audit-level=high
```

**Apply when:** Setting up CI audit steps for any Node.js project.

---

## pnpm.auditConfig.ignoreCves: Multi-Path Advisory Quirk

**Context:** `minimatch` CVE appeared via two paths: `eslint>minimatch` and `@typescript-eslint/...>minimatch`. Adding CVE to `ignoreCves` only ignored one path, leaving the other as a failure.

**Learning:** `pnpm.auditConfig.ignoreCves` may not reliably ignore all paths of a single advisory. Combine with `--prod` flag to eliminate dev dep paths entirely. For production transitive CVEs, the ignore works on the remaining single path.

**Apply when:** `pnpm audit` still fails after adding CVE to ignoreCves — check if multiple paths exist for the same advisory.
