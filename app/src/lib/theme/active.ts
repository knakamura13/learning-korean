import { botanicalKorea } from './systems/botanicalKorea.ts';

/**
 * The design system currently painted onto the app.
 *
 * To prototype a new look:
 * 1. Add `src/lib/theme/systems/<name>.ts` exporting a `DesignSystem`
 * 2. Point `activeSystem` at it
 * 3. Reload — CSS tokens, theme-color, font preloads, and PWA manifests
 *    all come from that object
 *
 * Components keep using `var(--ink)` / `var(--paper)` / `var(--accent)` /
 * `var(--rose)`.
 */
export const activeSystem = botanicalKorea;
