# Palette's Journal

## 2025-05-19 - Screen Reader Voice Switching for Mixed-Language Option Buttons
**Learning:** Monolithic `aria-label` strings combining English prefixes (e.g., "Option A:") with Hangul text prevent screen reader TTS engines from correctly switching language synthesizers, degrading speech pronunciation.
**Action:** Use separate DOM elements for prefix (`<span class="vh" lang="en">`) and content (`<span lang="ko">`) rather than single `aria-label` strings on interactive elements.

## 2025-05-18 - Toast Close Button Keyboard Focus & Touch Target Size
**Learning:** `ToastContainer` dismiss buttons need explicit `:focus-visible` ring styles and minimum touch targets (`min-width: 32px`, `min-height: 32px`). Without explicit focus states, keyboard users tabbing into floating toast notifications cannot discern which button is focused.
**Action:** Always ensure floating overlay action buttons (like toast dismiss actions) include design-system `:focus-visible` styles, hover feedback, and forced-colors rules.
