# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of this emulator console seriously. If you believe you've found a security vulnerability, please report it responsibly.

### How to Report

1. **Do not** open a public GitHub issue for security vulnerabilities.
2. Email us at **security@your-org.com** (or use GitHub's [private vulnerability reporting](https://github.com/your-org/aws-console/security/advisories/new)).
3. Include as much detail as possible:
   - Description of the vulnerability
   - Steps to reproduce
   - Affected components or files
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- You'll receive an acknowledgment within 48 hours.
- We'll provide an initial assessment within 5 business days.
- We'll keep you informed of our progress toward a fix.
- If the report is confirmed, we'll credit you (if you'd like) in the release notes.

### Disclosure Policy

We follow coordinated disclosure:

- We'll work with you to understand and fix the issue.
- We ask that you not disclose the vulnerability publicly until we've had reasonable time to address it.
- We'll notify you before publishing any fix or advisory.

## Security Best Practices for This Console

This is an **emulator console** for local development:

- ❌ **Never** connect this console to real AWS credentials.
- ❌ **Never** deploy this console to production with default `root`/`root123` credentials.
- ✅ Always change the `NEXT_PUBLIC_ROOT_PASSWORD` environment variable before any shared deployment.
- ✅ Use strong, unique passwords for local emulator accounts.
- ✅ Keep LocalStack/MiniStack emulator versions updated.
- ✅ Review and rotate any emulator access keys regularly.

## Third-Party Dependencies

This project uses:

- **Next.js** (MIT)
- **React** (MIT)
- **Cloudscape Design System** (Apache-2.0)
- **AWS SDK for JavaScript** (Apache-2.0)
- **AWS Architecture Icons** (AWS trademark guidelines)
- **LocalStack** (see LocalStack license)
- **MiniStack** (see MiniStack license)

See `LICENSE` for our project license and `package.json` for dependency licenses.
