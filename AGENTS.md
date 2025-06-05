# AGENTS.md — ScryVault AI Agent Configuration

## 📦 Project Overview

ScryVault is a mobile-first SaaS platform for professional book resellers. It offers real-time ISBN scanning, eBay market pricing, inventory management, and automated financial tracking. The goal is to become the "QuickBooks for Book Resellers."

## 🧠 Codex Agent Instructions

You are Codex, an AI developer working on this TypeScript monorepo. Prioritize clean, scalable, and secure code. Maintain architectural consistency and avoid unnecessary complexity.

### 🔧 Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL using Drizzle ORM
- **State Management**: TanStack Query
- **Auth**: JWT (1h access / 7d refresh) w/ database-stored sessions
- **External APIs**:
  - eBay Finding API (live pricing)
  - Google Vision API (OCR receipts, coming soon)
  - Plaid (banking integration, Phase 5)
- **Storage**: AWS S3 (for receipts and images)

### 🗂️ Directory Structure

- `/client` – React frontend
  - `/src/hooks/` – custom auth and pricing hooks
  - `/src/lib/` – shared utilities
- `/server` – Express backend
  - `auth-middleware.ts` – JWT session validation
  - `pricing-service.ts` – eBay integration and caching logic
  - `routes.ts` – All REST API endpoints
- `/shared` – schema, types, validation
  - `schema.ts` – Drizzle ORM schema
- `drizzle.config.ts` – DB connection and push settings

### ✅ Safe-To-Modify Zones

You may:
- Add routes under `/server/routes.ts`
- Add validation with Zod in `/shared/schema.ts`
- Modify React components inside `/client/src/`
- Suggest new hooks or utilities in `/client/src/hooks` or `/lib`

### 🚫 Do Not Touch

- Do not remove or rename any files without permission.
- Avoid altering JWT logic unless explicitly told.
- Don’t modify `package.json` or deployment configs unless asked.

### 📦 Install & Run

To install:
```bash
npm install
