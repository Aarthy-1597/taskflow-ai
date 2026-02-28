# Fix 404 on Render (e.g. /dashboard)

This app is a single-page app (SPA). Render must serve `index.html` for every path so React Router can handle routes like `/dashboard`, `/board`, `/projects`.

## Option 1: Dashboard (fastest)

1. Open [Render Dashboard](https://dashboard.render.com/) → your **static site** (taskflow-drxb).
2. Go to **Redirects/Rewrites**.
3. Add a rule:
   - **Source:** `/*`
   - **Destination:** `/index.html`
   - **Action:** **Rewrite** (not Redirect)
4. Save. Redeploy if needed.

## Option 2: Blueprint (`render.yaml`)

This repo has a `render.yaml` that defines the same rewrite. If you use [Render Blueprints](https://render.com/docs/blueprint-spec), the rule is applied when you sync. If the site was created manually, use Option 1.
