# Palette's Journal

## 2025-05-18 - Toast Close Button Keyboard Focus & Touch Target Size
**Learning:** `ToastContainer` dismiss buttons need explicit `:focus-visible` ring styles and minimum touch targets (`min-width: 32px`, `min-height: 32px`). Without explicit focus states, keyboard users tabbing into floating toast notifications cannot discern which button is focused.
**Action:** Always ensure floating overlay action buttons (like toast dismiss actions) include design-system `:focus-visible` styles, hover feedback, and forced-colors rules.

## 2025-05-19 - Segmented Progress Track Tooltips & Color Swatch Legend
**Learning:** Multi-segment progress bars (mastered / learning / unseen) require segment `title` tooltips with raw counts and percentages alongside a visual `.legend` block with `.sw` swatches. Without both, users cannot interpret color meaning or inspect exact progress figures per segment.
**Action:** When creating or updating multi-status progress tracks, pair segment tooltips with a `.legend` element and high-contrast (`forced-colors`) swatch overrides.
