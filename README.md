# Local AWS Emulator Console

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![Cloudscape](https://img.shields.io/badge/Cloudscape-3.0-orange.svg)](https://cloudscape.design/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang/)

An open-source, **Cloudscape-based** web console for AWS-compatible services running in **LocalStack** or **MiniStack**. Provides exact AWS Management Console UI/UX parity for local development and testing.

> **⚠️ Important**: This is an emulator console, not an AWS production console. It connects to local emulators only. No real AWS credentials, billing, or production data involved.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎯 **Exact AWS Console Parity** | Cloudscape Design System — same components AWS uses |
| 🔌 **Multi-Backend Support** | LocalStack (full) + MiniStack (partial) via adapter pattern |
| 🔐 **Local Authentication** | SQLite-backed auth with MFA, no verification required |
| 📦 **150+ Services** | Capability-aware navigation — only shows what your emulator supports |
| 🔗 **Cross-Service Linking** | Resource relationships (EC2→VPC, Lambda→CloudWatch, etc.) |
| 🌙 **Dark/Light Mode** | Full theme support with Cloudscape tokens |
| 📱 **Fully Responsive** | Works at 320px, 400% zoom, touch-friendly |
| ♿ **WCAG 2.1 AA** | Accessible by default via Cloudscape |
| 🖥️ **Integrated Terminal** | xterm.js-based CloudShell alternative |
| 🔍 **Global Search** | Service + resource search with Autosuggest |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker (for LocalStack/MiniStack)
- pnpm (recommended) or npm

### Option 1: LocalStack (Recommended — Full Service Coverage)

```bash
# Clone and install
git clone https://github.com/your-org/aws-console.git
cd aws-console
pnpm install

# Start LocalStack + Console
pnpm dev:localstack

# Open http://localhost:3000
# Login: root / root123
```

### Option 2: MiniStack (Lightweight — Partial Coverage)

```bash
pnpm install
pnpm dev:ministack

# Open http://localhost:3000
```

### Option 3: Docker Compose (Production-like)

```bash
# LocalStack mode
docker compose -f docker-compose.localstack.yml up -d

# MiniStack mode
docker compose -f docker-compose.ministack.yml up -d

# Both
docker compose -f docker-compose.both.yml up -d
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Next.js 15 App Router                   │
├─────────────────────────────────────────────────────────────┤
│  Cloudscape UI Layer (AppLayout, TopNav, SideNav, Pages)    │
├─────────────────────────────────────────────────────────────┤
│  Capability-Aware Navigation (Registry + Health Checks)     │
├─────────────────────────────────────────────────────────────┤
│  Adapter Layer ────────────────────────────────────────────┐│
│  ┌─────────────────┐  ┌─────────────────┐                 ││
│  │  LocalStack     │  │  MiniStack      │  (pluggable)    ││
│  │  Adapter        │  │  Adapter        │                 ││
│  └────────┬────────┘  └────────┬────────┘                 ││
└───────────┼────────────────────┼───────────────────────────┘
            │                    │
            ▼                    ▼
    ┌───────────────┐    ┌───────────────┐
    │  LocalStack   │    │  MiniStack    │
    │  (port 4566)  │    │  (port 4566)  │
    └───────────────┘    └───────────────┘
```

### Key Architectural Decisions

| ADR | Decision | Status |
|-----|----------|--------|
| [ADR-001](docs/adr/ADR-001-cloudscape-ui.md) | Cloudscape Design System for UI | ✅ Accepted |
| [ADR-002](docs/adr/ADR-002-adapter-pattern.md) | Adapter Pattern for Multi-Backend | ✅ Accepted |
| [ADR-003](docs/adr/ADR-003-capability-navigation.md) | Capability-Aware Navigation | ✅ Accepted |
| [ADR-004](docs/adr/ADR-004-sqlite-auth.md) | SQLite for Local Auth (with bcrypt) | ✅ Accepted |
| [ADR-005](docs/adr/ADR-005-nextjs-react19.md) | Next.js App Router + React 19 | ✅ Accepted |

---

## 📁 Project Structure

```
aws-console/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes (auth, health, services)
│   │   ├── [service]/         # Dynamic service pages
│   │   ├── ec2/, s3/, lambda/ # Service-specific pages
│   │   ├── login/             # AWS-exact sign-in page
│   │   └── layout.tsx         # Root layout with providers
│   ├── components/            # React components
│   │   ├── AppShell.tsx       # Main shell (TopNav, SideNav, Footer)
│   │   ├── AwsConsoleSidebar.tsx
│   │   ├── Dashboard.tsx      # Console home
│   │   ├── ec2/, s3/, lambda/ # Service components
│   │   └── widgets/           # Dashboard widgets
│   ├── context/               # React Context providers
│   │   ├── AuthContext.tsx    # Authentication state
│   │   └── NotificationContext.tsx
│   ├── hooks/                 # Custom React hooks
│   │   ├── useAwsApi.ts       # AWS SDK wrapper
│   │   ├── useGlobalSearch.ts # Global search
│   │   └── useResourceCounts.ts
│   ├── lib/                   # Core utilities
│   │   ├── db.ts              # SQLite + bcrypt
│   │   ├── rate-limiter.ts    # In-memory rate limiting
│   │   ├── localstack-adapter/ # Multi-backend adapter
│   │   └── mfa.ts             # TOTP MFA utilities
│   ├── constants/             # Configuration
│   │   ├── navigation.ts      # Service navigation (150 services)
│   │   ├── service-compatibility.ts # Capability registry
│   │   ├── service-icons.ts   # AWS Architecture icons
│   │   └── regions.ts         # AWS regions
│   ├── stores/                # Zustand stores
│   └── types/                 # TypeScript types
├── public/
│   └── icons/                 # AWS Architecture Service Icons
├── docs/
│   ├── adr/                   # Architecture Decision Records
│   └── architecture.md        # System architecture docs
├── data/                      # SQLite database (gitignored)
├── docker-compose*.yml        # Docker configurations
└── package.json
```

---

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ACTIVE_BACKEND` | `localstack` | `localstack` or `ministack` |
| `LOCALSTACK_HOSTNAME` | `localhost` | LocalStack host |
| `LOCALSTACK_EDGE_PORT` | `4566` | LocalStack edge port |
| `MINSTACK_HOSTNAME` | `localhost` | MiniStack host |
| `MINSTACK_EDGE_PORT` | `4566` | MiniStack edge port |
| `AWS_REGION` | `us-east-1` | Default AWS region |
| `NEXT_PUBLIC_ROOT_USERNAME` | `root` | Default root username |
| `NEXT_PUBLIC_ROOT_PASSWORD` | `root123` | Default root password |

### Backend Capability Differences

| Service | LocalStack | MiniStack |
|---------|------------|-----------|
| S3 | ✅ Full | ✅ Full |
| DynamoDB | ✅ Full | ✅ Full |
| Lambda | ✅ Full | ✅ Full |
| EC2 | ✅ Full | ⚠️ Partial |
| RDS | ✅ Full | ✅ Full |
| CloudFormation | ✅ Full | ✅ Full |
| IAM | ✅ Full | ✅ Full |
| CloudWatch | ✅ Full | ✅ Full |
| API Gateway | ✅ Full | ⚠️ Partial |
| EventBridge | ✅ Full | ⚠️ Partial |
| Step Functions | ✅ Full | ⚠️ Partial |
| ... | ... | ... |

> See [service-compatibility.ts](src/constants/service-compatibility.ts) for full 150-service registry.

---

## 🧪 Testing

```bash
# Unit + Integration tests
pnpm test

# With coverage
pnpm test:coverage

# E2E tests (requires running emulator)
pnpm test:e2e

# Responsive E2E (320px, 400% zoom)
pnpm test:e2e:responsive

# Visual regression tests
pnpm test:vrt

# Update VRT baselines
pnpm test:vrt:baseline

# Accessibility audit
pnpm a11y:axe

# UI parity audit
pnpm audit:ui
```

---

## 📦 Building & Deployment

```bash
# Production build
pnpm build

# Start production server
pnpm start

# Docker build
docker build -t aws-console .
docker run -p 3000:3000 aws-console
```

### Standalone Output
Next.js `output: "standalone"` creates a minimal deployment bundle in `.next/standalone/`.

---

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) first.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/amazing-feature`
3. Make your changes with tests
4. Run quality checks: `pnpm lint && pnpm test`
5. Submit a PR with a clear description

### Code Standards

- **TypeScript strict mode** — no `any`, explicit types
- **Cloudscape components only** — no custom CSS for UI
- **Conventional Commits** — `feat:`, `fix:`, `docs:`, `refactor:`
- **Test new features** — unit + integration + E2E where applicable

---

## 🔒 Security

- **No real AWS credentials** — local emulators only
- **bcrypt password hashing** — 12 rounds
- **Rate limiting** — 5 attempts/15min on auth endpoints
- **MFA support** — TOTP with QR codes
- **CSP headers** — configured via Next.js

See [SECURITY.md](SECURITY.md) for vulnerability reporting.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

> **Attribution**: This project uses the AWS Cloudscape Design System and AWS Architecture Icons. AWS, Amazon Web Services, and the "Powered by AWS" logo are trademarks of Amazon.com, Inc. or its affiliates. This project is independent and not affiliated with or endorsed by AWS, LocalStack, or MiniStack.

---

## 🙏 Acknowledgments

- **AWS Cloudscape Design System** — The component library powering the AWS Console
- **LocalStack** — The most comprehensive local AWS emulator
- **MiniStack** — Lightweight AWS-compatible emulator
- **AWS Architecture Icons** — Official service icons
- **All contributors** — Thank you for making this better!

---

## 📞 Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/your-org/aws-console/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/your-org/aws-console/discussions)
- 📖 **Documentation**: [/docs](docs/)
- 💬 **Community**: [Discord](https://discord.gg/your-invite)