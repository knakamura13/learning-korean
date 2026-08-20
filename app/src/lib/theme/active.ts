import { botanicalKorea } from './systems/botanicalKorea.ts';

/**
 * Build-time default look (Botanical Korea).
 *
 * `activeSystem` stamps no-JS `:root`, PWA manifests, header font preloads,
 * and the prerendered theme-color. Runtime look is `LOOKS` + `html[data-look]`
 * via LookPicker / `korean-look`. Do not reassign `activeSystem` to paint a
 * look — that would change the no-JS default and the manifests.
 *
 * Components keep using `var(--ink)` / `var(--paper)` / `var(--accent)` /
 * `var(--rose)`.
 */
export const activeSystem = botanicalKorea;
