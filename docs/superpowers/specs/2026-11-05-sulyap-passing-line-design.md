# Sulyap “A Passing Line” UI Design — Komiks Conversation

## Intent

Make the public Sulyap journey feel fun, creative, and meaningful from first arrival through goodbye. The memorable idea is a brief conversation between strangers: two people meet for a moment, then the conversation disappears when it ends.

## Approaches

- **A passing line — selected experience idea:** one line links arrival, matching, conversation, and goodbye to make the fleeting encounter recognizable.
- **Two little windows — considered:** a changing illustration frames each state. More immediately expressive, but heavier and more likely to compete with the chat.
- **A tiny encounter, told in words — considered:** state-specific copy carries the personality. Clear and inexpensive, but leaves the visual identity less distinctive.

### Visual direction update (2026-11-05)

The user chose **Komiks conversation** from a browser comparison after clarifying that quiet editorial felt like a news publication instead of a fleeting chat. This replaces the original quiet editorial art direction. The passing-line concept remains as a supporting signature.

## Goals and boundaries

- Apply to the public chat journey: landing, waiting, matched chat, end confirmation, ended/referral, feedback, and thank-you states.
- Keep the current anonymous matching, messaging, reply, referral, and feedback behavior intact.
- Give the public journey an expressive, chat-first komiks language: warm print color, confident ink outlines, lively message shapes, and restrained halftone accents.
- Make the conversation legible from the landing screen with a clearly labeled illustrative exchange; keep the live messages as the focal point during chat.
- Do not redesign the separate admin dashboard in this pass.
- Avoid publication-like landing layouts, generic gradients, mascot art, intrusive motion, or ornamental linework behind message content.

## Experience and interaction

- **Arrival:** the Sulyap wordmark, a short promise of a fleeting chat, an example exchange, and the start action establish the purpose immediately. Keep privacy information and optional name easy to scan.
- **Waiting:** the stroke extends toward a second endpoint and pauses; status text explains what is happening and cancel stays obvious.
- **Match:** the endpoints meet in one brief, warm accent moment. The connection is also stated in text and announced accessibly.
- **Conversation:** expressive, clearly differentiated message bubbles and an inked chat header make the exchange the focal point. Keep the passing line as a small signature; never place it behind or between message text.
- **Ending:** confirmation keeps the connection intact until the user chooses. On goodbye, the endpoints separate and the line recedes, paired with clear language that the conversation is gone.
- **Referral and feedback:** retain both as optional next steps with clear actions. Replace decorative emoji/star styling with controls that fit the line-and-editorial language while preserving the existing 1–5 feedback value.
- Keep transitions brief and purposeful. Under reduced-motion preferences, show the completed static state without drawing or movement; the meaning must remain in labels and copy.

## Constraints and open implementation calls

- Existing public UI uses static HTML, CSS, and JavaScript. Prefer a small inline SVG path and CSS state classes; do not add dependencies or generated raster assets.
- Support narrow mobile screens, keyboard focus, screen readers, and existing socket-driven state transitions.
- Komiks expression should come from the message composition, print palette, and selective ink/halftone details. Avoid childish comic conventions and clutter. The exact path geometry, duration, and final copy remain implementation details, provided they preserve the sequence and product claims above.
- The current browser view appears to show the previous UI treatment, so the built result must be visually checked against the running page before calling the refresh complete.

## Approval

The user approved the passing-line experience and later selected the Komiks conversation visual direction in the comparison board. Implementation updates the public frontend only; the admin dashboard remains outside this visual pass.
