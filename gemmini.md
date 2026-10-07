# SCROLLSTOP — Project Documentation (`gemmini.md`)

## 1. Project Overview & Philosophy

**SCROLLSTOP** is an anti-distraction, anti-dopamine digital intervention tool. Unlike modern platforms designed for infinite stimulation, SCROLLSTOP is intentionally **minimal, quiet, and boring by design**.

### Core Tenets
* **Pure Minimal Canvas**: Background is strictly pure white (`#FFFFFF`) with zero cards, borders, shadows, gradients, illustrations, or clutter.
* **No Social Media UI**: No counters, avatars, likes, sounds, gamification, or streaks.
* **Intentional Friction**: Users must consciously interact and physicalize their scroll behavior rather than passively consuming.
* **One-Way Progression**: Forward-only flow without backtracks, except within the self-contained brain reset exercises.
* **Exit-Oriented**: The goal is not to keep the user inside SCROLLSTOP. The goal is to help them leave and do what they actually came to do.
* **Targeted Exercise Back Navigation**: Only the brain reset exercises (Breathe, Focus, Number Hunt, Urge Surfing) contain a `← Back` option to return to the Brain Reset menu.

---

## 2. Tech Stack

* **Framework**: React 19 + TypeScript
* **Build Tool**: Vite 8
* **Linting**: Oxlint
* **Styling**: Pure semantic CSS with fluid typography, tabular numbers, and GPU-accelerated transforms (`transform: translateY`).
* **Dependencies**: Zero external UI libraries, no backend, no database, no authentication.

---

## 3. Complete Application Flow

```text
OPEN SCROLLSTOP
       ↓
Screen 1: Initial Random Quote
       ↓ (3 seconds delay)
continue →
       ↓ (tap)
Screen 2: Opening Mindset Message
       │  • “It has always been about your mindset.”
       │  • Philosophical grounding: "I can help you pause... You take it from there."
       │  • [Continue →]
       ↓ (tap)
Screen 3: Pre-Scroll Notification Reminder
       │  • “Before we start.”
       │  • “Turn off your notifications or put your phone on silent.”
       │  • “Give yourself 30 seconds without interruptions.”
       │  • [I'm ready →]
       ↓ (tap)
Screen 4: Scroll Challenge (Upward-Only TikTok/Reels Feed)
       │  • Swipe UP to advance full-screen section
       │  • Downward scroll is strictly disabled
       │  • Active 30-second countdown timer in center
       │  • If stopped for 1 second → MUTED RED WARNING
       │  • Resumes instantly upon swiping up again
       ↓ (30 seconds of active scrolling accumulated)
Screen 5: Post-Scroll Pause (500ms on pure white)
       ↓
Screen 6: Reflective Scroll Quote (4 seconds, from SCROLL_QUOTES)
       ↓
Screen 7: Goal Input (“What did you come here to do?”)
       ↓
Screen 8: Read Goal Slowly (1/3 → 2/3 → 3/3 confirmation)
       ↓
Screen 9: BRAIN RESET Menu
       ├── Breathe (Inhale 4s, Hold 2s, Exhale 6s; 1/3/5 min) [← Back]
       ├── Focus (Single center dot; 30s countdown) [← Back]
       ├── Number Hunt (1 → 10 in order; speed & mistakes) [← Back]
       ├── Urge Surfing (60s mindfulness wave: Rise → Peak → Fall → Settle) [← Back]
       └── I'M READY (tap)
       ↓
Screen 10: Final Commitment Check
       ├── Random question from 10-question pool
       ├── [YES] → Final Exit Sequence
       └── [NO] → "That's okay." → "Take one breath." → "Are you sure you want to keep scrolling?"
             ├── [NO, I'M READY] → Final Exit Sequence
             └── [YES, I'LL KEEP SCROLLING] → Session Ends
       ↓
Screen 11: Final Exit Sequence
       ├── “Good.”
       ├── “You know what you came here to do.”
       ├── “Now go do it.”
       ├── “Put the phone down.”
       └── “Go.”
       ↓
SESSION ENDS (pure white screen, zero interactive elements, user leaves)
```

---

## 4. Screen-by-Screen Breakdown

### 1. Initial Quote Screen
* Optically centered at `48%` viewport height (`top: 48%; transform: translate(-50%, -50%)`).
* Quote: `#000000`, 24px, 400 regular weight, 1.55 line height, max width 320px.
* Author: `#666666`, 15px, preceded by em dash (`—`).
* Fades in over 700ms; `continue →` appears after 3 seconds.

### 2. Opening Mindset Message Screen
* Introduces the core human philosophy of SCROLLSTOP before user begins the reset experience.
* Minimal, thoughtful, personal, and encouraging without cards or decorative clutter.
* Text:
  * **It has always been about your mindset.**
  * *I can help you pause. / I can help you find your way back to what matters. / I can help you take that first step.*
  * *But the choice to change, to focus, and to keep going— / **that has always been yours.***
  * *I can help you start.*
  * ***You take it from there.*** (subtly emphasized)
* Action: **Continue →** fades in after reading pause.

### 3. Pre-Scroll Notification Reminder
* Quiet instruction to eliminate disruptions before the 30-second reset begins.
* Text:
  * **Before we start.**
  * *Turn off your notifications or put your phone on silent.*
  * *Give yourself 30 seconds without interruptions.*
* Button: **I'm ready →** (transitions immediately into the upward scroll challenge).

### 4. Upward-Only Scroll Challenge
* Vertical feed inspired by TikTok / Instagram Reels, but restricted strictly to **upward progression**.
* **Swipe Up**: Current section moves up (`-100%`), next section enters from bottom (`0%`) with `cubic-bezier(0.2, 0.9, 0.4, 1)`.
* **Downward Swipe Disabled**: Dragging downward (`diff > 0`) is clamped strictly to `0`. Reverse motion is physically impossible.
* **Sections Sequence**: `Scroll down.` → `Keep going.` → `Almost there.` → `Stay with it.` → `Don’t stop.` → `Keep scrolling.` → `Breathe.` ...
* **Optical Center Stack**: Section title, prominent 30s timer (`30` down to `0`), and animated pill indicator.
* **1-Second Idle Red Warning**: Pausing for 1 second turns screen muted red (`#991b1b`). Dismissed instantly when swiping resumes.

### 5. Post-Scroll Pause & Reflective Quote
* 500ms quiet pause on white.
* Exactly ONE quote selected randomly from the 15-quote `SCROLL_QUOTES` collection (authored by **SCROLLSTOP**).
* Fades in gently using minimal typography, centered vertically and horizontally.
* Stays visible for approximately 4 seconds, then automatically transitions into Goal Input without intermediary screens or buttons.

### 6. Goal Input (“What did you come here to do?”)
* Single clean input field with no login, name, or email.
* Entering text reveals `Continue →`.

### 7. Read Goal 3 Times
* Displays user's goal with “Read this slowly.”
* Conscious attention confirmation: `1 / 3` → `2 / 3` → `3 / 3` (`I read it →`).

### 8. BRAIN RESET
* Menu with 4 short mental resets or immediate progression (`I'M READY`):
  * **Breathe** (includes `← Back`): Inhale 4s, Hold 2s, Exhale 6s. Duration tabs: 1, 3, or 5 min.
  * **Focus** (includes `← Back`): Single central black dot with 30s timer.
  * **Number Hunt** (includes `← Back`): Mobile-first card memory game with 10 hidden cards (`?`) in a 2×5 grid. Numbers 1 to 10 randomized exactly ONCE when the game starts and never reshuffled. Users tap cards to discover numbers in order `1 → 10`. Correct cards stay revealed. Mistakes reset progress to `1` and hide all cards, but keep card positions identical so user learns card locations. Timer starts on first card tap and runs across attempts; tracks mistakes count. Ends with simple completion screen (`Done.`, `Time: XX.Xs`, `Mistakes: X`).
  * **Urge Surfing** (includes `← Back`): 60-second mindfulness wave exercise helping users observe the urge to scroll without acting on it. Minimal wave line animates through Rise → Peak → Fall → Settle with gradual guidance text and subtle timer countdown. Ends with "The urge doesn't control you. / You can choose what happens next. / DONE →".
* Completing any exercise or tapping `DONE` returns to the menu or allows proceeding. Tapping `← Back` exits the exercise back to the Brain Reset menu at any time.

### 9. Final Commitment Check
* Triggered directly when the user presses **I'M READY**.
* Randomly selects one question from the 10-question pool (non-repeating within session).
* Action buttons: **YES** / **NO**.
* If **YES**: Immediately begins the Final Exit Sequence.
* If **NO**: Shows “That's okay.” (1.8s) → “Take one breath.” (2.0s) → “Are you sure you want to keep scrolling?”:
  * **NO, I'M READY**: Begins the Final Exit Sequence.
  * **YES, I'LL KEEP SCROLLING**: Respects user choice and immediately ends the session.

### 10. Final Exit Sequence & Session End
* Messages displayed one at a time with minimal fade:
  1. “Good.”
  2. “You know what you came here to do.”
  3. “Now go do it.”
  4. “Put the phone down.”
  5. “Go.”
* Session ends: blank white canvas, zero buttons, zero loops, zero gamification. The user leaves and begins their real-world task.

---

## 5. Development Commands

* **Start Development Server**: `npm run dev` (runs at `http://localhost:5173/`).
* **Production Build**: `npm run build` (`tsc -b && vite build`).
* **Linting**: `npm run lint` (`oxlint`).

---

## 6. Admin Dashboard & Anonymous Usage Analytics

### Route & Access
* **Route**: `/admin` (also supports `#/admin`).
* **Access**: Invisible to regular users. No admin links or buttons exist anywhere in the public application UI.
* **Authentication**: Architecture ready via `src/admin/auth.ts` (`useAdminAuth`), providing a clean plug-in interface for backend JWT / OAuth / server sessions without hardcoded fake passwords.

### Anonymous Analytics Architecture (`src/services/analytics.ts`)
* **Strict Privacy**: Zero PII collected (no name, email, phone, personal identity, private goal text, or browsing history).
* **Anonymous Identifiers**:
  * `anonymous_visitor_id`: Randomly generated UUID stored in `localStorage` for unique visitor tracking.
  * `anonymous_session_id`: Randomly generated UUID stored in `sessionStorage` for session linkage.
  * `device_type`: Coarse classification (`mobile`, `tablet`, `desktop`).
* **Tracked Events**:
  * `page_visit`: Visitor opens SCROLLSTOP.
  * `session_started`: User begins the session (taps `continue →`).
  * `scroll_started`: User reaches 30s scroll challenge.
  * `scroll_completed`: User successfully finishes 30s active scroll.
  * `goal_entered`: Recorded without storing user goal text.
  * `brain_reset_opened`: User reaches Brain Reset menu.
  * Activity starts & completions: `urge_surfing_started`, `urge_surfing_completed`, `breathe_started`, `breathe_completed`, `focus_started`, `focus_completed`, `number_hunt_started`, `number_hunt_completed`.
  * Final commitment: `commitment_yes`, `commitment_no`.
  * Session completion: `session_completed` (user finishes exit sequence "Go.").

### Dashboard Features (`src/admin/AdminDashboard.tsx`)
1. **Overview**:
   * Visitors Today (unique visitors today)
   * Unique Visitors (in selected filter)
   * Active Visitors Now (approximate active sessions in last 5 minutes)
   * Total Sessions
   * Visitors This Week (since Monday)
   * Visitors This Month (calendar month)
2. **SCROLLSTOP Usage**:
   * Sessions Started, 30s Scroll Completed, Goals Entered, Brain Reset Opened, Completed Sessions
   * Calculated **Brain Reset Usage Rate** (`%`)
   * Calculated **Session Completion Rate** (`%`)
3. **Brain Reset Analytics**:
   * Activity starts & completion counts for Urge Surfing, Breathe, Focus, Number Hunt
   * **Urge Surfing** is prominently highlighted as the featured reset activity.
4. **Activity Funnel**:
   * Step-by-step conversion from Visitors → Started Scrolling → Completed 30s → Entered Goal → Opened Brain Reset → Started Brain Reset → Completed Session
   * Shows step counts, conversion from top, and step drop-off percentages.
5. **Time Filter**:
   * Filterable by `Today`, `Last 7 Days`, `Last 30 Days`, and `All Time`.
6. **Live Stream & Developer Diagnostics**:
   * Real-time recent event stream table.
   * Clearly separated development sandbox: Generate 50 test events, Export JSON, Clear data.

