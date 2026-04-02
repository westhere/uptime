# VOiD Uptime

A self-hosted website uptime monitoring application. Monitor URLs at configurable intervals, receive email alerts when sites go down or slow, track uptime history, and share monitors with teammates.

---

## Features

- Monitor websites every 1, 5, 15, 30, or 60 minutes
- Status detection: **Up** (<15s), **Slow** (15–30s), **Down** (>30s or error)
- Email alerts on down, slow, and recovery events
- Per-monitor notification preferences
- Share monitors with other users (view or edit permission)
- Invite users by email with time-limited invitation links
- Hourly uptime timeline with configurable date range
- 4-year data retention with automated pruning (GDPR compliant)
- Admin panel: user management, system-wide stats

---

## Local Development

### Requirements

- PHP 8.2+
- Composer
- Node.js 20+
- Docker (for MariaDB)

### Setup

```bash
# 1. Clone the repo
git clone <repo-url>
cd uptime

# 2. Install PHP dependencies
composer install

# 3. Install Node dependencies
npm install --legacy-peer-deps

# 4. Copy environment file
cp .env.example .env
php artisan key:generate

# 5. Start the database
docker compose up -d

# 6. Run migrations and seed the admin user
php artisan migrate --seed

# 7. Start all dev processes (server, queue, vite, logs)
composer dev
```

The app will be available at **http://127.0.0.1:8000**

Default admin login: `nathan@voidapps.co.uk` / `Password1!`

> **Note:** To trigger monitoring checks locally, run `php artisan schedule:work` in a separate terminal.

---

## Running Tests

```bash
php artisan test
```

Tests use an in-memory SQLite database — no database setup required.

---

## Deploying to Plesk (VPS)

### Prerequisites

- Plesk Obsidian 18+ on your VPS
- A domain or subdomain pointed at the server
- PHP 8.2+ extension installed in Plesk
- Node.js extension installed in Plesk (or Node installed manually via SSH)
- A MariaDB database created in Plesk

---

### Step 1 — Create a Database in Plesk

1. Log in to **Plesk**.
2. Go to **Databases** → **Add Database**.
3. Set a database name (e.g. `void_uptime`), username, and password.
4. Note the credentials — you'll need them in Step 4.

---

### Step 2 — Create the Domain / Subdomain

1. In Plesk, go to **Websites & Domains** → **Add Domain** (or **Add Subdomain**).
2. Set the domain to e.g. `uptime.yourdomain.com`.
3. Set the **Document Root** to `<domain_root>/public` (this is important — Laravel serves from `/public`).
   - In Plesk: go to **Hosting Settings** → change the document root to `uptime.yourdomain.com/public`.
4. Enable **HTTPS** via Let's Encrypt (Plesk has a one-click button under **SSL/TLS Certificates**).

---

### Step 3 — Upload the Code

**Option A — Git (recommended)**

SSH into your server and clone into the domain root:

```bash
ssh user@yourserver.com
cd /var/www/vhosts/uptime.yourdomain.com
git clone <repo-url> .
```

**Option B — File Manager / FTP**

Upload all files (including hidden files like `.env.example`) into the domain root folder via Plesk File Manager or FTP. The `/public` folder should be directly inside the domain root.

---

### Step 4 — Configure the Environment

```bash
# SSH into the server
cp .env.example .env
```

Edit `.env` and set:

```env
APP_NAME="VOiD Uptime"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://uptime.yourdomain.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=void_uptime       # from Step 1
DB_USERNAME=void_uptime_user  # from Step 1
DB_PASSWORD=your_db_password  # from Step 1

MAIL_MAILER=smtp
MAIL_HOST=your.smtp.host
MAIL_PORT=587
MAIL_USERNAME=your@email.com
MAIL_PASSWORD=your_mail_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@yourdomain.com
MAIL_FROM_NAME="VOiD Uptime"

QUEUE_CONNECTION=database
SESSION_DRIVER=database
```

---

### Step 5 — Install Dependencies & Build

```bash
# Install PHP dependencies (no dev packages in production)
composer install --no-dev --optimize-autoloader

# Generate app key
php artisan key:generate

# Install Node dependencies and build assets
npm install --legacy-peer-deps
npm run build

# Run migrations and seed the admin user
php artisan migrate --seed --force

# Cache config and routes for performance
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

### Step 6 — Set File Permissions

```bash
# Make sure the web server can write to storage and cache
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
# (User may be 'apache' or 'psaserv' depending on your Plesk setup — check with: ps aux | grep php)
```

---

### Step 7 — Configure the Queue Worker & Scheduler

The monitor checks run via Laravel's scheduler dispatching jobs to the queue. You need both a cron entry and a persistent queue worker.

#### Scheduler Cron — Plesk Scheduled Tasks

1. In Plesk, go to **Scheduled Tasks** (under the domain or under **Tools & Settings** for server-wide).
2. Add a new **Cron Job** running **every minute**:

```
* * * * * /opt/plesk/php/8.2/bin/php /var/www/vhosts/uptime.yourdomain.com/artisan schedule:run >> /dev/null 2>&1
```

> Adjust the PHP path to match your Plesk PHP version. You can find it with: `which php` or check Plesk → **PHP Settings** for the domain.

#### Queue Worker — Supervisor (recommended)

```bash
# Install supervisor
apt-get install supervisor

# Create a config file
nano /etc/supervisor/conf.d/void-uptime-worker.conf
```

Paste the following:

```ini
[program:void-uptime-worker]
process_name=%(program_name)s_%(process_num)02d
command=/opt/plesk/php/8.2/bin/php /var/www/vhosts/uptime.yourdomain.com/artisan queue:work database --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=1
redirect_stderr=true
stdout_logfile=/var/www/vhosts/uptime.yourdomain.com/storage/logs/worker.log
stopwaitsecs=3600
```

Start it:

```bash
supervisorctl reread
supervisorctl update
supervisorctl start void-uptime-worker:*
```

#### Queue Worker — Without Supervisor (simple alternative)

If Supervisor is not available, add a second cron job in Plesk to restart the worker every hour:

```
0 * * * * /opt/plesk/php/8.2/bin/php /var/www/vhosts/uptime.yourdomain.com/artisan queue:work database --stop-when-empty >> /dev/null 2>&1
```

---

### Step 8 — Configure Apache (if needed)

Plesk uses Apache by default. Laravel includes a `public/.htaccess` file that handles URL rewriting. Ensure **mod_rewrite** is enabled:

1. Go to **Websites & Domains** → your domain → **Apache & nginx Settings**.
2. Under **Additional Apache directives**, add if not already present:

```apache
<Directory /var/www/vhosts/uptime.yourdomain.com/public>
    AllowOverride All
</Directory>
```

---

### Step 9 — Verify the Deployment

1. Visit `https://uptime.yourdomain.com` in your browser.
2. Log in with `nathan@voidapps.co.uk` / `Password1!`.
3. **Change the admin password immediately** via the Profile page.
4. Add a test monitor and wait for the first check to confirm the queue worker is running.

---

## Updating the Application

When deploying new code changes:

```bash
ssh user@yourserver.com
cd /var/www/vhosts/uptime.yourdomain.com

git pull

composer install --no-dev --optimize-autoloader
npm install --legacy-peer-deps
npm run build

php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache

supervisorctl restart void-uptime-worker:*
```

---

## Troubleshooting

| Issue | Fix |
|---|---|
| Blank white page | Check `storage/logs/laravel.log`. Ensure `APP_DEBUG=false` and `APP_KEY` is set. |
| 500 errors | Run `php artisan config:cache` after any `.env` changes. Check permissions on `storage/`. |
| Emails not sending | Verify SMTP credentials in `.env`. Test with `php artisan tinker` → `Mail::raw('test', fn($m) => $m->to('you@test.com')->subject('test'))` |
| Monitor checks not running | Verify the cron job is active in Plesk Scheduled Tasks. Check `storage/logs/worker.log`. |
| Queue jobs stuck | Run `php artisan queue:restart` then `supervisorctl restart void-uptime-worker:*`. |
| CSS/JS not loading | Run `npm run build` and ensure `public/build/` is present. Verify `APP_URL` matches your domain exactly. |
| 404 on all pages | The Document Root must point to `/public`, not the project root. Check Plesk Hosting Settings. |
