# Local AWS Emulator Console

An open-source, Cloudscape-based web console for AWS-compatible services running in LocalStack or MiniStack.

The project follows the information architecture of the AWS Management Console while staying honest about emulator support. Services, operations, resource links, and mutation controls are shown only when the active provider reports them as available.

## Scope

- LocalStack and MiniStack workflows
- Provider health and capability-aware service navigation
- Cloudscape tables, filters, wizards, details, dialogs, notifications, and responsive layouts
- Capability-aware links between related local resources
- No AWS account login, MFA, billing, production credentials, or real AWS endpoint mode

See [PRD.md](PRD.md) for product requirements and acceptance criteria.

## Quick start

```bash
pnpm install
pnpm dev:localstack
```

For MiniStack:

```bash
pnpm install
pnpm dev:ministack
```

Open `http://localhost:3000`. The console reads provider health and capability information before enabling service links or write actions.

MiniStack uses one gateway on port `4566`. Its `/_ministack/health` endpoint reports liveness and service availability; `/_ministack/ready` reports readiness after initialization scripts finish. The default slim image and the `:full` image expose different optional engines, so the console treats edition and operation coverage as capability data rather than assuming full parity.

Provider references:

- [MiniStack documentation](https://ministack.org/docs/)
- [MiniStack service catalog](https://ministack.org/docs/services/)
- [MiniStack limitations](https://ministack.org/docs/limitations/)
- [LocalStack service catalog](https://docs.localstack.cloud/aws/services/)
- [LocalStack feature coverage](https://docs.localstack.cloud/references/coverage/)

## Commands

```bash
pnpm dev
pnpm build
pnpm lint
pnpm test
```

## Project principles

- Cloudscape components and design tokens for all visible UI.
- No fabricated resources, metrics, events, relationships, or operation success.
- Provider errors remain visible and actionable.
- Responsive and keyboard-accessible workflows are required.
- Local emulator boundaries are explicit in the UI.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. Please include the provider capability impact and responsive/accessibility considerations for UI changes.

## License

MIT. See [LICENSE](LICENSE).

This project is independent and is not affiliated with or endorsed by Amazon Web Services, LocalStack, or MiniStack.
