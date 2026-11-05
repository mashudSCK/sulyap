# Sulyap Passing Line Implementation Plan

> **For agentic workers:** use the approved design brief as authority and implement task-by-task.

**Goal:** Carry the “A Passing Line” idea through a chat-first Komiks conversation design from arrival through feedback.

**Architecture:** Keep the existing static HTML/CSS/JS and socket-driven flow. Add a small, decorative inline SVG line motif at the key visual moments and set a semantic `data-moment` on the document as screens change. Use CSS states for short, restrained movement and static reduced-motion fallbacks.

**Tech Stack:** HTML, CSS, browser JavaScript, Socket.IO already in use.

**Spec:** `docs/superpowers/specs/2026-11-05-sulyap-passing-line-design.md`

## Global Constraints

- Preserve anonymous matching, messaging, replies, referral, and feedback behavior.
- Do not redesign the admin dashboard or add dependencies or raster assets.
- Use a warm print palette, confident ink outlines, expressive chat bubbles, and restrained halftone accents throughout the public experience.
- Keep the line out of message content and keep core meaning in text.
- Respect narrow layouts, keyboard access, screen readers, and reduced motion.
- Retain numeric 1–5 feedback values.

## Review Focus

- Every screen and overlay maps to an appropriate `data-moment` without stale state after cancel/reconnect.
- The arrival screen makes a fleeting chat clear before the visitor joins.
- Rating controls remain keyboard-accessible and submit the same integer rating.
- The line never covers controls or messages at narrow viewport sizes.
- Reduced-motion mode shows clear static states without animation.
- Existing social-share and copy actions remain unchanged.

### Task 1: Establish journey moments and signature line markup

**Files:** `frontend/index.html`, `frontend/app.js`

- Add semantic line SVG marks to landing, waiting, chat header, goodbye, exit confirmation, feedback, and thank-you surfaces.
- Set `body.dataset.moment` from `showScreen()` and the feedback/thank-you modal handlers.
- Replace emoji-only system/status decorations and the emoji star presentation with text and line-led, accessible controls.

### Task 2: Style the line and state transitions

**Files:** `frontend/styles.css`

- Use the selected Komiks conversation palette with a small warm accent at the match moment.
- Style line marks with crisp SVG geometry, use short purposeful movement for waiting/match/goodbye, and avoid movement over chat content.
- Add small-screen layout and `prefers-reduced-motion` static fallbacks.

### Task 3: Review the rendered public flow

**Files:** existing browser view at `http://localhost:3000/`

- Refresh the local page and visually inspect arrival and representative in-flow states where available.
- Confirm that the running page is serving the edited workspace files; report any inaccessible state or build limitation.
- No automated tests are added or run under the workspace instruction for this session.
