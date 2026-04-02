# VOiD Uptime — Claude Context

## What This Project Is

**VOiD Uptime** is a self-hosted website uptime monitoring application built with Laravel + Inertia.js + React. Users register, add URLs to monitor, configure check frequency, and receive email alerts when sites go down, slow, or recover. Monitors can be shared with other users with view or edit permissions.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Laravel 13 (PHP 8.2+) |
| Frontend | React 18 + TypeScript, Inertia.js v2 |
| Styling | Tailwind CSS v3 |
| Build | Vite 6 (pinned — Vite 8 requires Node 20.19+, server runs 20.18) |
| Database | MariaDB (production), SQLite in-memory (tests) |
| Queue | Laravel database queue |
| Auth | Laravel Breeze (Inertia + React) |

**Important version constraint:** `npm install` must use `--legacy-peer-deps`. Vite is pinned to `^6.4.1` and `laravel-vite-plugin` to `^1.3.0` because Node 20.18.3 is in use and Vite 8 requires Node 20.19+. Do not upgrade Vite without first upgrading Node.

---

## Running Locally

```bash
# Start the MariaDB Docker container (port 3307 — 3306 was taken)
docker compose up -d

# Start everything (server + queue + vite + log tail)
composer dev

# In a separate terminal — needed for monitor checks to fire
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
  Console/Commands/PruneMonitorData.php   # Deletes checks/incidents older than 4 years
  Http/Controllers/
    DashboardController.php               # Single-action: owned + shared monitors
    MonitorController.php                 # CRUD + notification preferences
    InvitationController.php             # Send/accept/manage invitations and shares
    AdminController.php                  # Admin panel: stats + remove users
  Http/Middleware/AdminMiddleware.php     # Guards /admin routes (is_admin = true)
  Jobs/CheckMonitorJob.php               # Core monitoring logic — HTTP check + status + incidents + notifications
  Models/
    Monitor.php                          # Route key = public_id (not id)
    MonitorShare.php                     # view | edit permissions
    MonitorCheck.php                     # Individual check records
    MonitorIncident.php                  # Down/slow incidents (opened/resolved)
    Invitation.php                       # Email invitations with expiry tokens
    NotificationPreference.php           # Per-user, per-monitor alert settings
  Notifications/
    MonitorDownNotification.php
    MonitorSlowNotification.php
    MonitorRecoveredNotification.php
    MonitorInvitationNotification.php
  Policies/MonitorPolicy.php             # view/update/delete authorization

resources/js/
  Pages/
    Dashboard.tsx                        # My Monitors + Shared With Me
    Monitors/Show.tsx                    # Uptime %, timeline, incidents, notif prefs
    Monitors/Create.tsx
    Monitors/Edit.tsx
    Monitors/Invitations.tsx             # Manage access / send invites
    Invitations/Accept.tsx
    Invitations/Expired.tsx
    Admin/Dashboard.tsx                  # Stats + user management table
  Components/StatusBadge.tsx             # up | down | slow | pending pill badge

database/
  migrations/                            # Ordered by date prefix
  factories/
    UserFactory.php                      # Built-in Breeze factory
    MonitorFactory.php                   # Requires user_id — use create(['user_id' => $user->id])
  seeders/
    AdminUserSeeder.php                  # nathan@voidapps.co.uk / Password1!

routes/
  web.php                                # All web routes
  console.php                            # Scheduler: dispatch checks every minute, prune daily
```

---

## Key Design Decisions

### Monitor URLs use `public_id`, not `id`
Monitor primary keys are integers internally (for FK performance), but URLs use a 12-character random `public_id` (e.g. `/monitors/aB3kLmNx9Qrz`). The model overrides `getRouteKeyName()` to return `public_id`. Passing a numeric ID to a monitor route will 404.

### Monitor status thresholds
- Response < 15 seconds + 2xx HTTP = **up**
- Response 15–30 seconds = **slow**
- Response > 30 seconds or any error/non-2xx = **down**

### Incidents
A `MonitorIncident` is opened when status transitions from healthy to unhealthy, and resolved when it returns to `up`. Only one open incident per monitor at a time. The job closes any open incident when a new type begins (e.g. slow → down).

### Notifications
Notifications (down, slow, recover) are only sent on status *change*, not on every check. The job compares the previous `last_status` before sending. Users with no `NotificationPreference` row still receive notifications (owner defaults to all-on).

### Sharing model
- `monitor_shares` table links a monitor to a user with a `view | edit` permission.
- `invitations` are separate — they hold the email + token until accepted, then a `MonitorShare` is created.
- Only the monitor **owner** can send invitations and manage shares. Edit-permission users can edit the monitor settings but cannot invite others.

### Data retention
`php artisan monitors:prune` (scheduled daily) deletes `monitor_checks` and `monitor_incidents` older than 4 years for GDPR compliance.

### Admin users
Admin users have `is_admin = true` in the `users` table. The `AdminMiddleware` blocks non-admins from `/admin/*`. Admins cannot be deleted through the admin panel (`abort(403)` if target `is_admin = true`).

---

## Running Tests

```bash
php artisan test
```

78 tests, all in `tests/Feature/`. No mocking of the database — uses `RefreshDatabase` with SQLite in-memory. HTTP calls in `CheckMonitorJobTest` are faked with `Http::fake()`.

### Factory note
`MonitorFactory` does **not** use `for($user)` — use:
```php
Monitor::factory()->create(['user_id' => $user->id])
```

---

## Deployment (Plesk VPS)

See [README.md](README.md) for the full step-by-step guide. Key points:
- Document Root must point to `/public`
- Queue worker should run via Supervisor (`queue:work database`)
- Scheduler runs via a `* * * * *` cron calling `schedule:run`
- Run `npm install --legacy-peer-deps` on the server
- After code changes: migrate, rebuild assets, cache config/routes, restart supervisor worker
