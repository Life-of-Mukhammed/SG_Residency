# 🚀 Startup Residency Management System

Production-ready SaaS platform for managing startup accelerator/residency programs.

## ⚡ Quick Start

```bash
npm install
node scripts/seed.mjs    # seed demo data (optional)
npm run dev
```

Open http://localhost:3000

## 🔐 Demo Credentials (after seeding)

| Role | Email | Password |
|---|---|---|
| Super Admin | admin@residency.uz | password123 |
| Manager | manager@residency.uz | password123 |
| Founder (MVP) | aisha@gmail.com | password123 |
| Founder (Growth) | jasur@gmail.com | password123 |
| Founder (Scale) | zulfiya@gmail.com | password123 |

## 📁 Key Files

- `lib/auth-options.ts` — NextAuth config
- `lib/sprint-data.ts` — 60-task sprint roadmap  
- `lib/gtm-data.ts` — 40 prompts, campaigns, KPIs
- `middleware.ts` — role-based route protection
- `scripts/seed.mjs` — database seeder
- `app/api/` — all API routes
- `app/dashboard/` — user pages
- `app/manager/` — manager panel
- `app/super-admin/` — admin panel

## 🔐 Roles

- **user** → apply, sprint, gtm, reports, meetings, books
- **manager** → everything + manage startups, review reports, create slots, analytics
- **super_admin** → everything + user role management

## 🛠️ Stack

Next.js 14 · TypeScript · TailwindCSS · MongoDB · NextAuth · Recharts · FullCalendar
