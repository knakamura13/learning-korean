# Palette's Journal

## 2025-05-19 - Row Action Buttons Contextual ARIA Labels
**Learning:** Action buttons in repeating list/card rows (such as vocabulary packs) need explicit `aria-label` attributes containing the row entity name when visual button text alone ("Open · 15 cards") lacks sufficient context when navigated in screen reader button lists.
**Action:** Always include the row/card title in `aria-label` for action buttons inside repeating lists.

## 2025-05-18 - Toast Close Button Keyboard Focus & Touch Target Size
**Learning:** `ToastContainer` dismiss buttons need explicit `:focus-visible` ring styles and minimum touch targets (`min-width: 32px`, `min-height: 32px`). Without explicit focus states, keyboard users tabbing into floating toast notifications cannot discern which button is focused.
**Action:** Always ensure floating overlay action buttons (like toast dismiss actions) include design-system `:focus-visible` styles, hover feedback, and forced-colors rules.
