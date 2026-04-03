# VOiD Uptime — Claude Context

> **Keep this file up to date.** After every session that changes the codebase, update the relevant sections so this file always reflects the current state of the project. A future Claude session should be able to read only this file and be fully productive immediately.

---

## What This Project Is

**VOiD Uptime** is a self-hosted website uptime monitoring application built with Laravel + Inertia.js + React. Users register, add URLs to monitor, configure check frequency, and receive email alerts when sites go down, slow, or recover. Monitors can be shared with other users with view or edit permissions. There is a public marketing homepage and an admin panel for managing users.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Laravel 13 (PHP 8.2+) |
| Frontend | React 18 + TypeScript, Inertia.js v2 |
| Styling | Tailwind CSS v3 |
| Build | Vite 6 (pinned — see constraint below) |
| Database | MariaDB (production), SQLite in-memory (tests) |
| Queue | Laravel database queue |
| Auth | Laravel Breeze (Inertia + React) |

**Critical version constraint:** `npm install` must always use `--legacy-peer-deps`. Vite is pinned to `^6.4.1` and `laravel-vite-plugin` to `^1.3.0` because the dev machine runs Node 20.18.3 and Vite 8 requires Node 20.19+. Do not upgrade Vite without first upgrading Node.

---

## Running Locally

```bash
# Start the MariaDB Docker container (port 3307 — 3306 was already in use)
docker compose up -d

# Start everything (Laravel server + queue worker + Vite + log tail)
composer dev

# Separate terminal — required for monitor checks to fire
php artisan schedule:work
```

App is at **http://127.0.0.1:8000**
Admin login: `nathan@voidapps.co.uk` / `Password1!`

---

## Database

Local DB runs in Docker on **port 3307** (not 3306 — already in use on the dev machine).

```
DB_HOST=127.0.0.1
DB_PORT=3307
DB_DATABASE=void_uptime
DB_USERNAME=void_uptime
DB_PASSWORD=void_uptime_secret
```

Tests use SQLite in-memory — configured in `phpunit.xml`. No database setup needed to run tests.

---

## Project Structure

```
app/
  Console/Commands/PruneMonitorData.php   # Deletes checks/incidents older than 4 years (GDPR)
  Http/Controllers/
    DashboardController.php               # Single-action: owned + shared monitors
    MonitorController.php                 # CRUD + notification preferences
    InvitationController.php             # Send/accept/manage invitations and shares
    AdminController.php                  # Admin panel: stats + remove users
  Http/Middleware/AdminMiddleware.php     # Guards /admin routes (is_admin = true)
  Jobs/CheckMonitorJob.php               # Core monitoring logic — HTTP check, status, incidents, notifications
  Models/
    Monitor.php                          # Route key = public_id (not id). Has HasFactory trait.
    MonitorShare.php                     # view | edit permissions
    MonitorCheck.php                     # Individual check records (no timestamps)
    MonitorIncident.php                  # Down/slow incidents (opened/resolved, no timestamps)
    Invitation.php                       # Email invitations with expiry tokens
    NotificationPreference.php           # Per-user, per-monitor alert settings
  Notifications/
    MonitorDownNotification.php
    MonitorSlowNotification.php
    MonitorRecoveredNotification.php
    MonitorInvitationNotification.php
  Policies/MonitorPolicy.php             # view/update/delete gate checks

resources/js/
  Pages/
    Home.tsx                             # Public marketing homepage
    Dashboard.tsx                        # My Monitors + Shared With Me tables
    Monitors/Show.tsx                    # Uptime %, timeline, incidents, notification prefs
    Monitors/Create.tsx                  # Add monitor form
    Monitors/Edit.tsx                    # Edit monitor form
    Monitors/Invitations.tsx             # Manage access / send invites
    Invitations/Accept.tsx               # Accept invite landing page
    Invitations/Expired.tsx              # Expired invite page
    Admin/Dashboard.tsx                  # Stats cards + user management table
    Auth/Login.tsx                       # Split-panel: login left, register right (single page)
  Layouts/
    AuthenticatedLayout.tsx              # Uses AppHeader + AppFooter
    GuestLayout.tsx                      # Uses AppHeader + AppFooter
  Components/
    AppHeader.tsx                        # Shared sticky header — nav, user dropdown, mobile menu
    AppFooter.tsx                        # Shared footer — copyright, links
    StatusBadge.tsx                      # up | down | slow | pending pill badge

database/
  migrations/                            # Ordered by date prefix
  factories/
    UserFactory.php                      # Built-in Breeze factory
    MonitorFactory.php                   # Must pass user_id explicitly (see Factory note below)
  seeders/
    AdminUserSeeder.php                  # nathan@voidapps.co.uk / Password1!

routes/
  web.php                                # All web routes (home, monitors, invitations, admin)
  auth.php                               # Auth routes — /register GET redirects to /login
  console.php                            # Scheduler: dispatch checks every minute, prune daily
```

---

## Key Design Decisions

### Public homepage
`/` renders `Pages/Home.tsx` — a public marketing page with hero, features, how-it-works, and CTA sections. It is not behind auth. Authenticated users who visit `/` see the same page; they navigate to `/dashboard` from the header. Logout redirects to `/`.

### Login + Register are one page
There is no separate `/register` page. The login page (`Pages/Auth/Login.tsx`) has two side-by-side panels — login on the left, register on the right. GET `/register` redirects to `/login`. Both forms post to their respective backend routes as normal.

### Shared header and footer
`AppHeader` and `AppFooter` are used by both `AuthenticatedLayout` and `GuestLayout`. The header shows the "Sign in / Get started" buttons when the user is a guest, and the nav + user dropdown when authenticated. The Admin nav link only appears when `user.is_admin === true`.

### Monitor URLs use `public_id`, not `id`
Monitor primary keys are integers internally (for FK performance), but all routes use a 12-character random `public_id` (e.g. `/monitors/aB3kLmNx9Qrz`). The model overrides `getRouteKeyName()` to return `public_id`. Passing a numeric ID to any monitor route will 404. All controllers pass `$monitor->public_id` as the `id` field in Inertia props — never `$monitor->id`.

### Timeline granularity (dynamic bucket size)
The `buildTimeline(Monitor $monitor, Carbon $from, Carbon $to)` method in `MonitorController` adjusts bucket size based on the selected timeframe so shorter ranges show finer detail:

| Timeframe | Bucket size |
|---|---|
| ≤ 1 hour | Per minute |
| 2–6 hours | Per 5 minutes |
| 7–24 hours | Per 15 minutes |
| 25+ hours | Per hour |

Each bucket includes `bucket`, `bucket_label`, `status`, `up/slow/down` counts, `uptime_pct`, and `avg_response_ms`. The frontend displays a hint below the chart title ("Each bar = 1 minute" etc.) and uses `bucket_label` from the first item.

### Custom date range for timeline
The timeline supports both preset and custom time ranges:

- **Presets** (`?hours=N`): 1, 3, 6, 12, 24, 48, 168 (7d), 720 (30d). Invalid values default to 12.
- **Custom** (`?from=YYYY-MM-DDTHH:mm&to=YYYY-MM-DDTHH:mm`): arbitrary range. Backend clamps `to` to `now()` if in future, and shifts `from` back 1 hour if it equals or exceeds `to`.

The `show()` method passes `range_from` (ISO), `range_to` (ISO), and `is_custom` (bool) as Inertia props. The frontend (`Monitors/Show.tsx`) uses these to:
- Pre-populate the datetime-local inputs when the page loads with a custom range
- Show the "Custom range…" option as selected in the dropdown
- Reveal/hide the inline From/To inputs + Apply button based on `showCustom` state

The `toDatetimeLocal(iso)` helper converts ISO strings to `YYYY-MM-DDTHH:mm` for datetime-local inputs.

### Monitor status thresholds
- HTTP 200 + response < 15 seconds = **up**
- HTTP 200 + response 15–30 seconds = **slow**
- Any non-200 HTTP status, response > 30 seconds, or connection error = **down**

> **Important:** Only HTTP 200 is treated as healthy. A 201, 301, 404, 500, etc. all result in **down**. `allow_redirects` is enabled so the final resolved URL must return 200.

### Incidents
A `MonitorIncident` is opened when status transitions from healthy to unhealthy, and resolved when it returns to `up`. Only one open incident per monitor at a time. The job closes any existing open incident before opening a new one (handles slow → down transitions).

### Notifications
Sent only on status *change*, not on every check. The job compares `last_status` before deciding whether to send. Users with no `NotificationPreference` row receive all notifications by default (owner defaults to all-on).

### Sharing model
- `monitor_shares` links a monitor to a user with `view | edit` permission.
- `invitations` are separate — email + token until accepted, then a `MonitorShare` is created.
- Only the monitor **owner** can send invitations and manage shares. Edit-permission users can edit monitor settings but cannot invite others.

### Data retention
`php artisan monitors:prune` (scheduled daily) deletes `monitor_checks` and `monitor_incidents` older than 4 years for GDPR compliance.

### Admin users
`is_admin = true` in the `users` table. `AdminMiddleware` blocks non-admins from `/admin/*`. Admins cannot be deleted through the admin panel.

---

## Running Tests

```bash
php artisan test
```

79 tests in `tests/Feature/`. Uses `RefreshDatabase` with SQLite in-memory. HTTP calls in `CheckMonitorJobTest` are faked with `Http::fake()`.

| Test file | What it covers |
|---|---|
| `AuthTest.php` | Register, login, wrong password, redirects, logout |
| `MonitorTest.php` | CRUD, public_id routing, 404 on numeric id, auth/sharing rules |
| `InvitationTest.php` | Send, accept, expired, wrong user, permission update, revoke |
| `AdminTest.php` | Access control, stats, delete user, cascade to monitors |
| `CheckMonitorJobTest.php` | HTTP check logic, incidents, notifications, non-200 = down |

### Factory note
`MonitorFactory` does **not** support `for($user)` (relationship is named `owner`, not `user`). Always use:
```php
Monitor::factory()->create(['user_id' => $user->id])
// or with extra attrs:
Monitor::factory()->create(array_merge(['user_id' => $user->id], $attrs))
```

---

## Deployment (Plesk VPS)

See [README.md](README.md) for the full step-by-step guide. Key points:
- Document Root must point to `/public`
- Queue worker should run via Supervisor (`queue:work database`)
- Scheduler runs via a `* * * * *` cron calling `schedule:run`
- Always use `npm install --legacy-peer-deps`
- After code changes: `migrate --force`, `npm run build`, cache config/routes/views, restart Supervisor worker
