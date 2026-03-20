# ShowUp AI 🎯

> **You said you'd come. Now prove it.**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com)
[![Claude AI](https://img.shields.io/badge/Claude-Anthropic-orange)](https://anthropic.com)
[![Solana](https://img.shields.io/badge/Solana-Mock_Wallet-9945FF?logo=solana)](https://solana.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## The Problem (You Know This Pain)

You're in a group chat. Someone says *"let's hang this Saturday!"* Everyone's excited. Twelve thumbs up emojis.

Saturday comes.

Three people cancel the morning of. Two just ghost. One shows up and you have the most awkward two-person "group dinner" of your life.

**This is not a vibe problem. This is an accountability problem.**

ShowUp AI fixes it by making your flaky friends put money where their mouth is — locked on-chain, returned only if they actually show up. No show = no refund. Their loss, your gain (literally — you split their forfeited deposit).

---

## What Is ShowUp AI?

ShowUp AI is a **social hangout coordination app** built on Solana that combines:

- 🤖 **AI-powered event planning** — Claude picks the perfect date, venue, and full itinerary based on everyone's real availability and location
- 💰 **Solana deposit commitment** — lock SOL to prove you're serious, get it back when you show up
- 🗳️ **Democratic plan approval** — 75% of the squad must vote yes before the plan locks in
- ⚡ **Real-time nudges** — AI-written push notifications that call out the uncommitted members by name
- 🏆 **Forfeit redistribution** — no-shows' deposits split equally among those who actually came through

It's the app that turns *"yeah maybe"* into *"I literally cannot afford to flake."*

---

## Live Demo

🌐 **[showup-ai.vercel.app](https://showupai-nine.vercel.app/)** ← try it here

> Uses a mock Solana wallet — no real SOL is spent. Every new user gets ◎ 10 SOL airdropped to play with.

---

## How It Works

### The Full Flow

```
1. Create a Squad
   └─ Set deposit amount, event type, invite code

2. Invite Your Crew
   └─ Share a code or link — they join in one click

3. Everyone Submits Availability
   └─ Date + time picker, location, budget, vibe preferences

4. AI Generates the Perfect Plan
   └─ Claude reads everyone's data and picks:
      • Best overlapping date & time
      • Geographically central venue
      • Full itinerary with cost breakdown
      • Backup plan in case of rain ☔

5. The Squad Votes
   └─ 75% must approve the specific date & time
   └─ < 75%? Admin gets a "Replan" button — AI tries again

6. Lock Your Deposit
   └─ Animated Solana transaction: signing → broadcasting → confirmed
   └─ SOL deducted from mock wallet, held in escrow

7. Day Of: Check In
   └─ Tap check-in → deposit returned immediately ✅

8. Admin Closes the Event
   └─ No-shows: deposit marked FORFEITED ❌
   └─ Attendees: bonus share distributed 🏆
```

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Framework** | Next.js 15 (App Router) | Server components, API routes, edge-ready |
| **Language** | TypeScript | Because runtime errors at a hackathon demo are embarrassing |
| **Styling** | Tailwind CSS | Dark mode, custom design system, no fighting CSS |
| **Database** | Supabase (PostgreSQL) | Row-level security, realtime subscriptions, auth — all free tier |
| **AI** | Anthropic Claude Sonnet | Best at structured JSON output + actually fun responses |
| **Blockchain** | Mock Solana wallet | Full UX of Solana without testnet faucet drama |
| **Realtime** | Supabase Realtime | Live nudge delivery via postgres_changes |
| **Hosting** | Vercel | Zero-config Next.js deployment |

---

## Key Features Breakdown

### 🤖 AI Plan Generation
Claude receives each member's availability windows (specific date + time), location (GPS or typed), budget range, vibe preferences, dietary restrictions, and transport mode. It picks the date that works for the most people, finds a geographically central venue, and outputs a full structured JSON plan including itinerary, cost breakdown, logistics, and a backup plan.

### 🗳️ Democratic Voting
After plan generation, every member sees the proposed date, time, and venue and votes approve or veto. A live progress bar shows the 75% threshold. Once reached, the group status advances to `committing` and deposits open. If too many vetoes make 75% mathematically impossible, the admin gets a "Replan" button — AI generates a fresh plan and votes reset.

### 💸 Commitment & Forfeit Mechanics
```
Lock:     mock_sol_balance -= deposit_amount
Check-in: mock_sol_balance += deposit_amount  (returned immediately)
Close:    no_show_forfeit / attendee_count → each attendee gets a bonus
```
All transactions are logged with mock tx hashes, slot numbers, and block explorer links — the full Solana UX, simulated.

### 📲 AI Nudges
Admins can send AI-written nudges to: everyone, uncommitted members only, or non-availability-submitters. Claude writes personalised, slightly passive-aggressive messages. Members receive them in a full notification inbox with unread counts, group context, and "Go to squad" deep links.

### 🛡️ Security Architecture
- Cookie-based auth via `@supabase/ssr`
- All sensitive DB writes use a service role client (bypasses RLS correctly)
- RLS policies enforce member-only data access
- No private keys, no real funds, no OWASP nightmares

---

## Project Structure

```
showup-ai/
├── app/
│   ├── (auth)/              # /login, /signup, /onboarding
│   ├── (dashboard)/
│   │   ├── dashboard/       # Home feed
│   │   ├── groups/[id]/     # Squad detail page (the main arena)
│   │   ├── nudges/          # Notification inbox
│   │   └── profile/         # User profile
│   ├── join/[code]/         # Public invite landing page
│   └── api/
│       ├── commitments/     # POST — lock SOL deposit
│       ├── checkin/         # POST — attendance check-in
│       ├── groups/[id]/
│       │   ├── join/        # POST — join a squad
│       │   ├── availability/ # POST — submit availability
│       │   ├── vote/        # POST — approve/veto the plan
│       │   └── resolve/     # POST — close event & distribute forfeits
│       ├── nudges/          # GET nudges, PATCH mark read
│       └── ai/
│           ├── plan/        # POST — generate hangout plan
│           ├── chat/        # POST — AI planner chat
│           └── nudge/       # POST — send AI nudge to members
├── components/
│   ├── ai/                  # AvailabilityForm, PlanDisplay, PlannerChat
│   ├── groups/              # InviteModal, JoinByCode
│   ├── layout/              # Navbar
│   ├── ui/                  # Full component library (Button, Card, Badge, Modal…)
│   └── wallet/              # MockTransactionModal, WalletButton
├── lib/
│   ├── anthropic/           # Plan generation, chat, nudge AI, vote summary
│   ├── mock-solana/         # Wallet context, tx hash/slot generation
│   └── supabase/            # Server & client Supabase instances
├── supabase/
│   └── schema.sql           # Full DB schema + RLS policies
└── types/index.ts           # Every TypeScript type in the project
```

---

## The Deposit Mechanic — Plain English

| What happens | Effect on your wallet |
|---|---|
| Lock deposit | ◎ −0.1 SOL (deducted) |
| Check in on event day | ◎ +0.1 SOL (returned) |
| No-show, admin closes event | ◎ 0 (forfeited forever) |
| Attended + someone else no-showed | ◎ +0.1 SOL + bonus share 🏆 |

The more people flake, the more the loyal ones earn. It's self-reinforcing accountability.

---

## Why Solana?

Solana's speed and low fees make micro-deposit escrow viable in a way that other chains don't. A ◎ 0.1 SOL deposit at $150/SOL is $15 — enough to sting if you flake, not enough to feel like you're gambling. And the transaction confirmation time (sub-second) means the "locking" UX feels instant and satisfying, not like waiting for a bank transfer.

This version uses a mock wallet to demonstrate the full UX without testnet friction. Replacing the mock client with a real Solana wallet adapter (Phantom, Backpack) is a single file swap.

---

## Roadmap

- [ ] Real Solana wallet integration (Phantom / Backpack adapter)
- [ ] On-chain escrow smart contract (Anchor)
- [ ] Push notifications (Web Push API)
- [ ] Group reputation scores and reliability leaderboard
- [ ] Recurring hangout squads
- [ ] Split payment coordination for the actual event costs

---

## Built With ❤️ (and frustration about cancelled plans)

This project was built for the **Superteam hackathon**. The core thesis: social coordination is a solved problem technically, but an unsolved problem behaviourally. Blockchain-enforced accountability isn't about the money — it's about the signal. When you lock SOL, you're not just saying you'll come. You're *proving* it.

---

## License

MIT — do whatever you want with it, just show up.
