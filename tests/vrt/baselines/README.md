# VRT Baselines — Visual Regression Reference Images

Per PRD Appendix F (§F.1 Source of Truth, §F.3 VRT Process) and Appendix H (§H.1 Test Pyramid).

## Directory Contents

| File | Page / Component | Theme | Viewport | Reference Source |
|---|---|---|---|---|
| `ec2-table-baseline.png` | EC2 Instances Table (`/console/ec2`) | Light (default) | 1440x900 | Cloudscape layout reference |
| `s3-bucket-baseline.png` | S3 Buckets (`/console/s3`) | Light (default) | 1440x900 | Cloudscape layout reference |
| `lambda-wizard-baseline.png` | Lambda Create Function (`/console/lambda`) | Light (default) | 1440x900 | Cloudscape layout reference |
| `iam-user-baseline.png` | IAM Users (`/console/iam`) | Light (default) | 1440x900 | Cloudscape layout reference |

## Tolerance Settings (per PRD Appendix F §F.3)

- **Static chrome** (header, sidebar, footer): ≤ 0.1% pixel difference
- **Data-bearing regions** (tables, wizard forms): ≤ 1% pixel difference (seed data varies)
- **Theme support**: Light and dark baselines must both be maintained; this repo currently stores light-theme baselines. Dark-theme baselines (`*-dark-baseline.png`) should be added before release.

## How to Update Baselines

When a reference screenshot changes (AWS UI update or design token change), run:

```bash
npm run test:vrt:baseline
```

This executes Playwright with `updateSnapshots` mode, writing new `.png` files to this directory. Each baseline update must be accompanied by a PR explanation referencing the design token change (per PRD §F.2).

## Baseline Verification Checklist (Phase 23)

- [x] `ec2-table-baseline.png` exists
- [x] `s3-bucket-baseline.png` exists
- [x] `lambda-wizard-baseline.png` exists
- [x] `iam-user-baseline.png` exists
- [x] Each baseline matches the exact viewport and theme settings in `tests/vrt/playwright.config.ts`
- [x] Tolerance thresholds documented above match PRD Appendix F §F.3
