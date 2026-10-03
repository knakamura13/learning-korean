# Palette's Journal

## 2025-05-18 - Toast Close Button Keyboard Focus & Touch Target Size
**Learning:** `ToastContainer` dismiss buttons need explicit `:focus-visible` ring styles and minimum touch targets (`min-width: 32px`, `min-height: 32px`). Without explicit focus states, keyboard users tabbing into floating toast notifications cannot discern which button is focused.
**Action:** Always ensure floating overlay action buttons (like toast dismiss actions) include design-system `:focus-visible` styles, hover feedback, and forced-colors rules.

## 2025-05-19 - Row Action Buttons and Entity Context in ARIA Labels
**Learning:** Repeated row action buttons (like "Open · 20 cards") lack surrounding row context when navigated out of flow via screen reader button lists or rotor controls.
**Action:** Always add an explicit `aria-label` combining the action, entity label, and metadata (e.g., `aria-label="Open {pack.label} pack ({pack.size} cards)"`).
