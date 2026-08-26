# Contributing to Cool Log Viewer

Thanks for helping improve Cool Log Viewer. Bug reports, focused feature requests, documentation improvements, and code contributions are welcome.

## Before opening an issue

- Search existing issues to avoid duplicates.
- Use the bug or feature-request form when possible.
- Do not disclose security vulnerabilities in a public issue. Follow [SECURITY.md](SECURITY.md) instead.

## Development setup

1. Install Node.js 22.12 or later.
2. Fork and clone the repository.
3. Install the locked dependencies with `npm ci`.
4. Create a focused branch from the latest `main`.
5. Run the application with `npm run dev`.

## Pull requests

- Keep each pull request focused on one change.
- Explain the problem, the approach, and any user-visible impact.
- Add or update tests for behavioral changes.
- Update documentation when commands, behavior, or supported platforms change.
- Run `npm run check` and `npm run test:e2e` before requesting review.
- Resolve review conversations and keep the branch current with `main`.

Pull requests are squash-merged after the required checks pass.
