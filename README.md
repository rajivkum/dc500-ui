# DC500 UI

Frontend UI for the DC500 Controller — static HTML, CSS and JavaScript.

This repository contains the dashboard and login UI used by the DC500 controller frontend.

Quick start (local)

- Open `dashboard.html` or `login.html` in a browser (static files).

Collaboration & workflow

- Branches: Use `main` for stable releases and `dev` for ongoing integration.
- Feature branches: `feature/<short-desc>` (create PRs into `dev`).
- Pull Requests: require at least one approving review before merging to `dev`, and CI passing (if configured).
- Commits: use conventional-ish messages (e.g. `feat: add header quicklinks`, `fix: login floating label`).

Adding this repo to GitHub

1. Initialize locally (already done if you see a `.git` directory), then push to a new remote:

```powershell
cd /d d:\dc500-ui
git remote add origin https://github.com/<your-org-or-user>/<repo-name>.git
git push -u origin main
```

2. Invite collaborators via GitHub -> Settings -> Collaborators, or use the GitHub CLI (`gh`) to add users.

See `CONTRIBUTING.md` for contribution guidelines.
