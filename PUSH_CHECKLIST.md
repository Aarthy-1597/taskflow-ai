# Pre-Push Checklist ✓

## Precautions Taken

### 1. **Sensitive Data**
- ✓ `.env` added to `.gitignore` (never commit secrets)
- ✓ `.env.local` and `.env.*.local` ignored
- ✓ No API keys or passwords in code (only `VITE_API_BASE_URL` from env)
- ✓ `.env.example` is safe (no secrets, only placeholder)

### 2. **Files to Commit**
- `.gitignore` (updated with .env, dist, logs)
- `.env.example` (API config template)
- `docs/Time_Tracking_API.postman_collection.json`
- `src/api/timeEntries.ts` (API service)
- `src/lib/api.ts` (base API client)
- `src/components/time/*` (TimeEntryForm, TimeTracker, TimeReports, TimesheetFilters)
- `src/components/board/BoardFilters.tsx` (Tag icon)
- `src/context/AppContext.tsx` (API integration)
- `src/pages/time/TimePage.tsx` (full time tracking page)

### 3. **Commands to Run**

```powershell
# 1. Stage all changes
git add .

# 2. Verify what's staged (ensure .env is NOT listed)
git status

# 3. Commit with descriptive message
git commit -m "feat: Time Tracking MVP with API integration

- Manual time entry (task, hours, date, description, billable)
- Start/stop timer with API support
- Timesheet filters (user, project, date range)
- Reports (time by user, project, billable breakdown, weekly/monthly)
- API integration: CRUD, start/stop timer, list with filters
- Fallback to local state when API unavailable
- Postman collection in docs/"

# 4. Pull latest (if working with others)
git pull origin main --rebase

# 5. Push
git push origin main
```

### 4. **Before Pushing**
- Close any other git processes (IDEs, terminals)
- Ensure you're on the correct branch: `git branch`
- If remote has new commits: `git pull --rebase` first
