# Palette's Journal

## 2025-05-18 - Toast Close Button Keyboard Focus & Touch Target Size
**Learning:** `ToastContainer` dismiss buttons need explicit `:focus-visible` ring styles and minimum touch targets (`min-width: 32px`, `min-height: 32px`). Without explicit focus states, keyboard users tabbing into floating toast notifications cannot discern which button is focused.
**Action:** Always ensure floating overlay action buttons (like toast dismiss actions) include design-system `:focus-visible` styles, hover feedback, and forced-colors rules.

## 2026-09-01 - Async State Feedback for Destructive & Form Actions
**Learning:** Confirmation dialogs for account deletion and form submit buttons must maintain `disabled={busy}` and dynamic label updates (`Deleting…`, `Saving…`) during in-flight network requests. Closing dialogs early or leaving static button text allows duplicate interactions and leaves users without feedback.
**Action:** Always keep confirmation modals open and disable action controls with clear pending labels while async operations are in flight.
