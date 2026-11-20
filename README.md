# AQMS — Appointment Queue Management System

A web system for booking appointments and tracking your place in the queue in real time. Users book a service and time slot, get a queue number, and watch the live queue. Admins manage services, time slots, the appointment flow, and reports.

This repository is the **React frontend**. It talks to a **PHP + MySQL REST API** (the `AppointmenManagements` backend, run on XAMPP).

## Features

### Users
- **Sign up and log in** with email and password
- **Book an appointment:** choose a service, pick an available time slot, confirm, and receive a queue number
- **My Queue (live):** your number, who is being served now, people ahead of you, and estimated wait. Refreshes every 15 seconds.
- **Cancel** a pending or confirmed appointment (the slot seat is released)
- **Past appointments** with details
- **Profile:** edit name and phone number, change password

### Admins
- **Dashboard overview** of today's activity
- **Services:** add, edit, activate/deactivate, delete
- **Time slots:** generate slots in bulk per service, set capacity, delete unused slots
- **Appointments:** confirm, start serving, complete, archive. Warns before serving two people at once for the same service.
- **Reports:** wait time, service demand, status breakdown, and peak hours (charts)

Appointment statuses: `Pending → Confirmed → Serving → Completed`, or `Cancelled`.

## Tech stack

| Part | Technology |
|---|---|
| Frontend | React 18, TypeScript, React Router 6, Recharts, Vite |
| Backend | PHP 8 REST API, `vlucas/phpdotenv` |
| Database | MySQL / MariaDB (XAMPP), stored procedures |
| Hosting | Frontend on Vercel; backend on XAMPP, exposed through ngrok |

## Security

| Area | How it is protected |
|---|---|
| Passwords | Hashed with **bcrypt** (`password_hash`). Never stored or returned in plain text. |
| Personal data | **Email, phone number and appointment notes are encrypted** in the database with **AES-256-GCM**. Each value has a random IV; the GCM tag detects tampering. The key lives in `.env`, not in code. |
| Email lookup | Login finds the user by an **HMAC-SHA256** hash of the email, so emails do not have to be decrypted to search. |
| Session | Signed **JWT (HS256)** stored in an **HttpOnly cookie**. JavaScript cannot read it, so an XSS script cannot steal it. Expiry is set by `JWT_EXPIRY`. |
| Brute force | After **5 failed logins**, the account is **locked for 15 minutes**. Failures for unknown emails are counted too, so attackers cannot tell which emails exist. |
| CORS | Only origins listed in `ALLOWED_ORIGINS` may call the API from a browser. |
| CSRF | Every request that changes data must send the `X-Requested-With: AQMS` header, which other websites cannot add. |
| Password policy | At least 8 characters, with at least one letter and one number (checked in the frontend and the API). |
| Access control | Admin endpoints check the role **on the server**. Users can only see and cancel their own appointments. Public sign-up always creates a regular user; admin accounts are created separately. |
| SQL injection | All queries use prepared statements / stored procedures. |
| Error handling | The API returns generic messages; PHP errors and stack traces are logged, not shown. |
| Secrets | `.env`, `config/`, `sql/` and `vendor/` are blocked by `.htaccess` and excluded from Git. |

## Project structure

```
src/
├── api/
│   ├── config.ts            # API base URL (VITE_API_BASE or local XAMPP)
│   └── routes.ts            # All API calls; typed, allow-listed response fields
├── pages/                   # Landing, Login, Signup, Dashboard, MyQueue, Services,
│                            # Profile, AdminLogin, AdminDashboard
├── components/              # Booking flow, queue status, admin management screens, reports
├── contexts/                # Appointments, Services, Slots state; Toast and Confirm dialogs
├── utils/                   # Date formatting, password policy
├── App.tsx                  # Routes and login state
└── main.tsx                 # Entry point and context providers
```

## Getting started

### Requirements
- Node.js 18 or newer
- XAMPP (Apache + MySQL/MariaDB, PHP 8)
- Composer (for the backend's dependencies)

### 1. Backend (XAMPP)
1. Put the backend folder at `C:\xampp\htdocs\AppointmenManagements` and run `composer install` inside it.
2. In phpMyAdmin, as root:
   - import the database (`appointmentmanagement` holds the tables, `appointmentexecutor` holds the stored procedures),
   - run `sql/user_panel_procedures.sql`,
   - run `sql/login_lockout.sql`.
3. Create `config/.env`:

   ```env
   SERVER=localhost
   DATABASE=appointmentexecutor
   USER=<database user>
   PWORD=<database password>
   CHARSET=utf8mb4
   JWT_SECRET=<random string, at least 32 characters>
   JWT_EXPIRY=86400
   ENCRYPTION_KEY_HEX=<64 hex characters = 32-byte AES key>
   ALLOWED_ORIGINS=http://localhost:3000,https://<your-app>.vercel.app
   ```

   Generate the secrets with, for example, `php -r "echo bin2hex(random_bytes(32));"`. **Do not change `JWT_SECRET` or `ENCRYPTION_KEY_HEX` once users exist**: existing logins and encrypted data depend on them.
4. Start Apache and MySQL in the XAMPP Control Panel. The API is at `http://localhost/AppointmenManagements/api`.

### 2. Frontend
```bash
npm install
npm run dev
```
The app opens at `http://localhost:3000`.

To use a different backend (e.g. an ngrok URL), set `VITE_API_BASE`, in a `.env.local` file locally or in the Vercel project settings:

```env
VITE_API_BASE=https://<your-ngrok-domain>/AppointmenManagements/api
```

### Build
```bash
npm run build
```
The production build is written to `dist/`.

## API endpoints (summary)

| Method | Endpoint | Access |
|---|---|---|
| POST | `/auth/register`, `/auth/login`, `/auth/logout` | Public |
| GET, PUT | `/users/profile` | User |
| PUT | `/users/password` | User |
| GET | `/services`, `/slots` | Public |
| POST, PUT, DELETE | `/services`, `/slots` | Admin |
| POST | `/appointments` | User |
| GET | `/appointments/user/{id}`, `/appointments/queue` | Owner |
| PUT | `/appointments/cancel` | Owner |
| PUT, DELETE | `/appointments` (status, archive) | Admin |
| GET | `/appointments/archived`, `/admin/appointments`, `/admin/slots` | Admin |
| GET | `/reports/wait-time`, `/reports/service-demand` | Admin |

## Troubleshooting

- **"Too many failed login attempts":** wait 15 minutes, or clear the lock in phpMyAdmin: `DELETE FROM appointmentmanagement.login_attempts;`
- **"Origin not allowed" (403):** add the frontend's URL to `ALLOWED_ORIGINS` in the backend `.env`.
- **Logged out right after logging in on the hosted site:** the browser is blocking the API's cookie. The frontend and API must both use HTTPS, and the frontend URL must be in `ALLOWED_ORIGINS`.

## Future enhancements
- Email or SMS notifications when your turn is near
- Real-time updates over WebSockets instead of polling
- Appointment rescheduling
- Two-factor authentication for admin accounts

## License

MIT
