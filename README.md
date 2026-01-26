# 🌊 Hiro Marine Protection System

**"Defending the Blue Heart of our planet."**

Hiro Marine is a gamified conservation platform designed to mobilize "Operatives" (users) for real-world marine protection missions. It combines a high-fidelity "Sci-Fi Marine" UI with robust data tracking (Supabase) to manage coastal cleanups, biodiversity monitoring, and community clans.

![Hiro Marine Login Screen](/public/w_hiro-logo.png)

## 🚀 Features

### for Operatives (Users)

- **Mission System**: Accept and complete real-world tasks (e.g., "Ghost Net Hunter", "Mangrove Planting").
- **Encyclopedia**: Unlock data on rare species (Javan Rhino, Dugong) as you level up.
- **Rank Progression**: Earn "Ocean Shells" and XP to advance from *Scout* to *Captain*.
- **Community Clans**: Join regional factions (Maung Laut, Sura Buaya) and compete on leaderboards.

### for Command (Admins)

- **Database Management**: CRUD operations for News, Missions, and Specimens.
- **Verification Console**: Review and approve/reject user mission submissions.
- **System Alerts**: Broadcast ocean anomalies or bleaching events globally.

## 🛠️ Tech Stack

- **Frontend**: React (TypeScript) + Vite
- **Styling**: Tailwind CSS (Custom "Deep Ocean" Theme) + Framer Motion (Animations)
- **Backend & Auth**: Supabase (PostgreSQL, RLS, Auth)
- **Desktop Wrapper**: Tauri v2 (Rust)
- **Icons**: Lucide React

## 📦 Installation & Setup

### 1. Prerequisite

- Node.js & npm/pnpm
- Rust (if building for Desktop/Tauri)
- Supabase Account

### 2. Clone & Install

```bash
git clone https://github.com/Rageronee/hiros_marine_v2.git
cd hiros_marine_v2
npm install
```

### 3. Environment Setup

Create a `.env` file in the root (copied from `.env.example` if available):

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Database Initialization

Run the SQL scripts located in the root folder via your Supabase SQL Editor in this order:

1. `delete_all.sql` (Optional: Clear old data)
2. `schema.sql` (Create Tables, RLS, and Functions)
3. `seed.sql` (Populate initial data)

### 5. Run Development Server

```bash
npm run dev
```

## 🚢 Deployment

### Web (Vercel)

This project is optimized for Vercel.

- **Framework Preset**: `Vite`
- **Output Directory**: `dist` (default)
- **Environment Variables**: Add your Supabase keys in Vercel Project Settings.

### Desktop (Tauri)

To build the native executable:

```bash
npm run tauri build
```

## 🔒 Security

- **Strict Auth**: Login requires valid Supabase Auth AND a record in the public `players` table.
- **Self-Healing**: Accounts missing profile data (due to DB resets) are automatically repaired on login.
- **RLS**: Row Level Security ensures users can only edit their own data, while Admins have full access.

---
*Built with 💙 by [Afnan] for the Ocean.*
