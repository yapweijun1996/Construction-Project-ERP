# GITHUB PAGES

Target URL: `https://yapweijun1996.github.io/Construction-Project-ERP/`.

Deployment: `.github/workflows/deploy.yml` runs typecheck → tests → build → GitHub Pages
(actions/upload-pages-artifact + deploy-pages) on every push to `main`.

Vite base path, manifest URLs and service-worker scope are configured for repository-subpath hosting (`/Construction-Project-ERP/`, overridable via `BASE_PATH`). No hardcoded `/assets/...` paths. Verify the actual published URL, not only localhost.
