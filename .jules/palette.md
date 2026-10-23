# Palette's Journal

## 2025-05-18 - Async Action Feedback & Modal State in Confirmation Dialogs
**Learning:** Closing confirmation modals immediately prior to async requests removes visual context and allows repeat triggers. Keeping the modal open with `aria-busy`, disabled action buttons, and updated label ("Deleting…") provides clear user feedback during network latency.
**Action:** Track pending async state in confirmation modals, disable cancel/submit actions during in-flight requests, and set `aria-busy` until resolved.

## 2025-05-18 - Toast Close Button Keyboard Focus & Touch Target Size
**Learning:** `ToastContainer` dismiss buttons need explicit `:focus-visible` ring styles and minimum touch targets (`min-width: 32px`, `min-height: 32px`). Without explicit focus states, keyboard users tabbing into floating toast notifications cannot discern which button is focused.
**Action:** Always ensure floating overlay action buttons (like toast dismiss actions) include design-system `:focus-visible` styles, hover feedback, and forced-colors rules.
