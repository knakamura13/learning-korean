# Palette's Journal

## 2025-05-18 - Toast Close Button Keyboard Focus & Touch Target Size
**Learning:** `ToastContainer` dismiss buttons need explicit `:focus-visible` ring styles and minimum touch targets (`min-width: 32px`, `min-height: 32px`). Without explicit focus states, keyboard users tabbing into floating toast notifications cannot discern which button is focused.
**Action:** Always ensure floating overlay action buttons (like toast dismiss actions) include design-system `:focus-visible` styles, hover feedback, and forced-colors rules.
