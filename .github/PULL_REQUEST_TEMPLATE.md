## Description

<!-- Provide a clear and concise description of the changes in this PR. -->

## Related Issue(s)

<!-- Link related issues using "Fixes #123" or "Closes #123". -->
Fixes #

## Type of Change

<!-- Mark the appropriate option: -->
- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📝 Documentation update
- [ ] 🧹 Refactoring (no functional changes)
- [ ] 🎨 Style/UI improvement (no functional changes)
- [ ] 🧪 Test changes
- [ ] 🏗️ Architectural changes

## Checklist

<!-- Mark items as completed: -->

- [ ] My code follows the project's coding standards (TypeScript strict mode, Cloudscape components)
- [ ] I have performed a self-review of my own code
- [ ] I have added tests that cover my changes
- [ ] All new and existing tests pass (`pnpm test`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Build succeeds (`pnpm build`)
- [ ] I have updated documentation if needed
- [ ] I have added/updated E2E tests for new features
- [ ] Visual regression tests pass or baselines updated
- [ ] No real AWS endpoints are touched
- [ ] Capability-aware navigation is respected

## Changes Summary

<!-- Provide a brief summary of all changes made in this PR. -->

| File | Change |
|------|--------|
| | |

## Screenshots (if UI changed)

<!-- Add screenshots of the UI changes here. -->

| Before | After |
|--------|-------|
| | |

## Backend Impact

<!-- How does this change affect LocalStack and MiniStack support? -->

- LocalStack: [full / partial / no change]
- MiniStack: [full / partial / no change]

## Testing

<!-- Describe the tests you ran and how to verify this PR manually. -->

### Manual Testing
1. Run `pnpm dev:localstack`
2. Go to http://localhost:3000
3. [Steps to test the feature]
4. [Expected result]

### Automated Testing
```bash
pnpm test -- --run          # Unit + integration
pnpm test:e2e               # E2E tests
pnpm test:vrt               # Visual regression
pnpm a11y:axe               # Accessibility
```

## Security Notes

<!-- Were any security-related changes made? If so, describe. -->

- [ ] No security implications
- [ ] Security review completed

## Additional Notes

<!-- Any other information for reviewers. -->
