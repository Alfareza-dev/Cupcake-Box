# Contributing to Cupcake Box

Contributions, bug reports, and feature improvements to **Cupcake Box** are welcome!

## Reporting Bugs

Before opening a new issue, please check existing issues to avoid duplicates. When filing a bug report, include:
1. **Clear title** summarizing the problem.
2. **Expected vs. actual behavior**.
3. **Steps to reproduce**, browser/OS details, and relevant logs or screenshots.

## Pull Request Guidelines

1. Fork the repository and create a dedicated feature/fix branch (`feat/...` or `fix/...`).
2. Keep pull requests focused on a single feature or fix.
3. Verify frontend and backend checks before submitting:
   ```bash
   # Frontend lint & build
   cd client/frontend
   yarn lint
   yarn build

   # Backend tests
   go test ./...
   ```
4. Provide a concise summary of changes and screenshots for UI updates.
