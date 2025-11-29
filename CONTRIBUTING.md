# Contributing

Thanks for contributing! This file describes a lightweight workflow for two collaborators working on this repo.

Branching
- `main` — stable, release-ready code.
- `dev` — integration branch where merged features go before a release.
- Feature branches: `feature/<short-desc>` (one feature per branch).

Process
1. Create a feature branch from `dev` (or `main` if `dev` doesn't exist):

```powershell
git checkout -b feature/my-feature dev
```

2. Work locally and commit often with clear messages.
3. Push the branch and open a Pull Request into `dev`.
4. Request review from your collaborator; after approval, merge.

Code style and testing
- Keep code minimal and avoid breaking changes on `dev` without a PR explaining them.

Communication
- Use PR descriptions to explain why a change was made and how to test it locally.

Setting up reviewers / code owners
- Edit `.github/CODEOWNERS` to list the GitHub usernames responsible for parts of the codebase.
