# Launch Plan — AWS Console Emulator Clone

**Status:** Pre-launch. No waitlist, no beta users, no analytics yet.

---

## Pre-launch checklist

- [ ] `replica/parity.md` shows 65.2/100 — 29 must-have features not done
  (dashboard cards, wizards, detail pages, networking services, storage
  services, management services)
- [ ] `replica/bugs.md` — no bugs reproduced yet; tests not run against local
  dev server
- [ ] No waitlist or beta list
- [ ] No analytics or error tracking configured
- [ ] No user evidence collected (replica/reviews.csv is empty)

## Where the original's unhappy users talk

No communities identified — no reviews collected. Potential sources to check:
- Reddit: r/aws, r/localstack, r/devops
- Hacker News: AWS and LocalStack threads
- G2, Capterra, Trustpilot: AWS Management Console reviews
- AWS re:Post and AWS forums

## Launch post

Leads with the fix, not parity features. No fix identified yet (no reviews
collected). Draft a post once `replica/feedback.md` has real themes.

## First 10 users to talk to by hand

None identified yet.

## Analytics and error tracking

Not yet configured. Add before launch so issues are visible.

## Launch criteria (do not ship until)

- [ ] All 29 must-have features done (parity score 100% for must-haves)
- [ ] No open S1 or S2 bugs
- [ ] E2E tests pass for F01–F11 core flows
- [ ] Contrast check passes on all screens
- [ ] Keyboard-only navigation verified on each service page

## Next step

`/replica-deploy` — production database, env vars, Stripe live mode (not
applicable — no payments), OAuth redirects, monitoring, mobile builds.
