# Security Policy

## Supported Versions

| Version | Status |
|---------|--------|
| 1.0.x | Active |
| 0.x.x | End-of-life |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please report it responsibly.

### How to Report

1. **Email**: Send your report to [security@your-org.com](mailto:security@your-org.com)
2. **PGP**: You can encrypt your report using our PGP key (available on request)
3. **Do NOT** report security vulnerabilities through public GitHub issues

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (optional but helpful)

### Our Process

1. **Acknowledgment**: We'll confirm receipt within 48 hours
2. **Assessment**: We'll investigate within 7 days
3. **Fix**: We'll develop a patch (timeline depends on severity)
4. **Disclosure**: Coordinated disclosure after fix is released
5. **Credit**: We will credit you in the release notes

## Vulnerability Categories

We accept reports for:

- **Injection**: SQL, NoSQL, command, template injection
- **Authentication**: Bypass, session management, credential exposure
- **Authorization**: IDOR, privilege escalation, permission bypass
- **Secrets**: Hardcoded credentials, exposed API keys
- **Cross-Site**: XSS, CSRF, open redirects
- **Dependencies**: Known vulnerabilities in packages
- **Data Exposure**: PII leaks, sensitive data in logs

## Security Architecture

### Authentication

- **Local authentication** via SQLite database
- **bcrypt password hashing** (12 rounds)
- **TOTP MFA** support via otplib
- **Rate limiting** on auth endpoints (5 attempts/15min)
- **No real AWS credentials** in the application

### Data Protection

- **Local storage only** — no external data transmission
- **No analytics or telemetry**
- **Secrets are redacted** in logs and error messages
- **Database file** stored in `data/` directory (gitignored)

### Network Security

- **Emulator-only** connections (no real AWS endpoints)
- **Local network** communication only
- **No external URLs** in the application

## Security Testing

```bash
# Run dependency audit
npm audit

# Run security tests
pnpm test -- --security

# Scan for secrets
npx trufflehog . --maxDepth=1
```

## Security Headers

The application implements:

- `Content-Security-Policy` headers via Next.js
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security` (when behind TLS proxy)

## Known Limitations

This is a **local emulator console**. It has different security characteristics than production AWS:

- **No production security controls** — designed for local development
- **SQLite storage** — not suitable for sensitive production data
- **Local-only** — no external access by default
- **No authentication provider** — uses local database

## Contact

Security inquiries: [security@your-org.com](mailto:security@your-org.com)
PGP Key ID: [available on request]

## Acknowledgments

This security policy follows best practices from:
- [OWASP](https://owasp.org/)
- [GitHub Security Policy Guide](https://docs.github.com/en/free-pro-team@latest/github/administering-a-repository/about-security-policies)
- [Contributor Covenant Code of Conduct](https://www.contributorcommunity.com/code-of-conduct)