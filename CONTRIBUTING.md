# Contributing to Local AWS Emulator Console

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to this project.

## 🤝 Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the maintainers.

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+ (or npm 10+)
- Docker (for emulator integration testing)
- Git

### Development Setup

```bash
# 1. Fork and clone
git clone https://github.com/YOUR_USERNAME/aws-console.git
cd aws-console

# 2. Install dependencies
pnpm install

# 3. Set up the database (creates seed users)
mkdir -p data && touch data/console.db

# 4. Start LocalStack (recommended)
pnpm dev:localstack

# Or start MiniStack
pnpm dev:ministack

# 5. Open http://localhost:3000
# Login: root / root123
```

### Verify Setup

```bash
# Run linting
pnpm lint

# Run tests
pnpm test

# Build
pnpm build
```

## 📐 Coding Standards

### TypeScript

- Use **strict mode** — no `any`, explicit types everywhere
- Prefer `const` over `let`, avoid `var`
- Use functional patterns over class methods where possible
- Use `undefined` for optional values, not `null`

```typescript
// ✅ Good
const getUsers = async (): Promise<User[]> => { ... }
const user: User | undefined = await findUser(id);

// ❌ Bad
const getUsers = async () => { ... }  // No return type
const user: any = await findUser(id);
```

### React/Next.js

- Use **App Router** (`src/app/`) — not Pages Router
- Use **Client Components** (`"use client"`) only when needed
- Use **Server Components** for data fetching
- Use Cloudscape components for all UI

```tsx
// ✅ Good: Server component
export default async function Page() {
  const data = await fetchData();
  return <ResourceTable data={data} />;
}

// ✅ Good: Client component with "use client"
"use client";
export default function SearchBar() {
  const [query, setQuery] = useState("");
  return <Autosuggest value={query} onChange={...} />;
}
```

### Cloudscape Design

- **All visible UI** must use Cloudscape components
- Use Cloudscape design tokens for colors, spacing, typography
- No custom CSS for standard controls
- Follow Cloudscape accessibility guidelines

```tsx
// ✅ Good
import { Table, Header, Button, SpaceBetween } from "@cloudscape-design/components";

// ❌ Bad
<div className="custom-table">...</div>;
```

### Testing

- **Unit tests**: Test hooks, utilities, adapters
- **Integration tests**: Test API routes with database
- **E2E tests**: Test critical user flows with Playwright
- **Visual regression**: Test UI parity with VRT

### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `security`

Examples:

```
feat(ec2): add instance launch wizard
fix(auth): resolve bcrypt hash verification issue
docs(readme): add MiniStack quick start guide
test(auth): add rate limiting integration tests
```

## 📁 Project Structure Reference

| Path              | Purpose                                                  |
| ----------------- | -------------------------------------------------------- |
| `src/app/`        | Next.js App Router pages and API routes                  |
| `src/components/` | React components organized by service                    |
| `src/lib/`        | Core utilities (db, adapters, mfa, rate-limiter)         |
| `src/hooks/`      | Custom React hooks                                       |
| `src/constants/`  | Configuration (navigation, service-compatibility, icons) |
| `src/stores/`     | Zustand state management                                 |
| `src/context/`    | React Context providers                                  |
| `public/icons/`   | AWS Architecture Service Icons                           |
| `docs/adr/`       | Architecture Decision Records                            |
| `tests/`          | Unit, integration, E2E, VRT tests                        |

## 🐛 Reporting Bugs

1. Check existing [issues](https://github.com/your-org/aws-console/issues) first
2. Use the **Bug Report** issue template
3. Include:
   - LocalStack/MiniStack version
   - Node.js version
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots (if applicable)
   - Console errors

## 💡 Requesting Features

1. Use the **Feature Request** issue template
2. Describe:
   - The problem you're trying to solve
   - Proposed solution and alternatives considered
   - Impact on existing functionality

## 🔀 Pull Request Process

1. **Create a branch**: `feat/your-feature-name` or `fix/your-bug-fix`
2. **Make changes**: Follow coding standards above
3. **Add tests**: Cover new functionality
4. **Run checks**:
   ```bash
   pnpm lint && pnpm test && pnpm test:coverage
   ```
5. **Update documentation** if needed
6. **Submit PR** with the PR template filled out

### PR Review Checklist

- [ ] Code follows project coding standards
- [ ] Tests added and passing
- [ ] No new lint errors
- [ ] Documentation updated
- [ ] Cloudscape components used for UI
- [ ] TypeScript strict mode compliant
- [ ] No real AWS endpoints touched
- [ ] Capability-aware navigation respected

## 🎨 Adding a New Service Page

1. Create page in `src/app/{service}/page.tsx`
2. Register in `src/constants/navigation.ts`
3. Add to `src/constants/service-compatibility.ts`
4. Add icon to `src/constants/service-icons.ts`
5. Create components in `src/components/{service}/`
6. Add hooks if needed in `src/hooks/use{Service}Service.ts`
7. Add API route in `src/app/api/{service}/route.ts`
8. Write tests

## 🏗️ Architecture Changes

For significant architectural changes, please:

1. Open a **RFC** (Request for Comments) issue
2. Discuss with maintainers
3. Create an ADR in `docs/adr/`
4. Implement after community feedback

## 📝 Documentation

- Keep docs close to code
- Update README when adding features
- Update this CONTRIBUTING.md when changing workflows
- Use [Keep a Changelog](CHANGELOG.md) format

## 🙏 Recognition

Contributors are recognized in:

- This README's contributors section
- Release notes
- Project documentation

---

## 🙏 Thank You

Every contribution, no matter how small, makes this project better. Thank you for helping build an open-source AWS Console experience!
