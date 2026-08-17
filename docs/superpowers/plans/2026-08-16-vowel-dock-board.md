# Vowel Dock Board Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Lab 02 vowel parameter trays with a spatial stamp-and-dock board that still explores related vowels and works from the keyboard.

**Architecture:** Keep `buildVowel` as the letter table. A new pure `vowelBoard.ts` owns docks, stamps, lifts, and snap. `VowelStep.svelte` is a thin pointer/keyboard view over `BoardState`. Assemble and fusion stay on `Slots` + `Tray`.

**Tech Stack:** Svelte 5, TypeScript, Vitest + jsdom, existing Tray radiogroup and LabRunner settle/nudge.

## Global Constraints

- Vowel cards only. Do not change assemble, fusion, or `build` steps.
- `buildVowel` / `sidesFor` remain the source of truth; do not duplicate the vowel table.
- Valid-but-wrong vowels soft-nudge (`onNudge(html, true)`). Empty-space bounces are silent.
- Same board for pointer and keyboard. No leftover none/one/two or left/right trays on vowel cards.
- Pointer uses pointer events, not HTML5 drag-and-drop.
- Dock hit targets and snap radius floor at 44px. Snap radius is `max(0.20 * boardWidth, 44)`.
- Exhaustive `switch` on `Stamp` and `DockId` with a `never` default.
- Imports at top of file. No inline imports.
- Lab 02 hint for `ㅡ` becomes "Just the earth stroke — no ticks."
- Follow TDD: failing test, then minimal code.

## File map

- Create: `app/src/lib/domain/vowelBoard.ts` — docks, stamp/lift/snap, `vowelOf`
- Create: `app/src/lib/domain/vowelBoard.test.ts`
- Modify: `app/src/lib/a11y/shortcuts.ts` — ignore arrow card-jump inside `[data-dock-board]`
- Modify: `app/src/lib/a11y/shortcuts.test.ts`
- Modify: `app/src/lib/components/steps/VowelStep.svelte` — board + palette
- Create: `app/src/lib/components/steps/vowelStep.test.ts`
- Modify: `app/src/lib/components/tray.test.ts` — drop the old VowelStep tray suite
- Modify: `app/src/lib/content/lab02.ts` — `ㅡ` hint
- Modify: `app/src/lib/content/types.ts` — VowelStep comment

---

### Task 1: `vowelBoard` domain

**Files:**
- Create: `app/src/lib/domain/vowelBoard.ts`
- Test: `app/src/lib/domain/vowelBoard.test.ts`

**Interfaces:**
- Consumes: `buildVowel`, `sidesFor`, `TickSide` from `app/src/lib/domain/hangul.ts`
- Produces:

```ts
export type Stamp = 'ㅣ' | 'ㅡ' | 'tick';
export type BaseStroke = 'ㅣ' | 'ㅡ';
export type DockId = 'base' | TickSide | `${TickSide}2`;
export interface BoardState {
	base: BaseStroke | null;
	ticks: 0 | 1 | 2;
	side: TickSide | null;
}
export interface Lift { stamp: Stamp; count: 1 | 2 }
export const EMPTY_BOARD: BoardState;
export const PALETTE: readonly Stamp[];
export const SNAP_RADIUS_RATIO = 0.2;
export const SNAP_RADIUS_MIN_PX = 44;
export function dockPosition(id: DockId): { x: number; y: number };
export function visibleDocks(state: BoardState): DockId[];
export function occupant(state: BoardState, dock: DockId): Stamp | null;
export function applyStamp(state: BoardState, dock: DockId, stamp: Stamp): BoardState | null;
export function applyLift(state: BoardState, dock: DockId, lift: Lift): BoardState | null;
export function clearDock(state: BoardState, dock: DockId): BoardState;
export function liftDock(state: BoardState, dock: DockId): { lift: Lift; remaining: BoardState } | null;
export function vowelOf(state: BoardState): string;
export function snapRadiusPx(boardSizePx: number): number;
export function snapDock(
	state: BoardState,
	lift: Lift,
	x: number,
	y: number,
	boardSizePx: number
): DockId | null;
```

`applyStamp(state, dock, stamp)` is `applyLift(state, dock, { stamp, count: 1 })`.

Lifting the primary tick dock while `ticks === 2` lifts `{ stamp: 'tick', count: 2 }` so the iotation stack moves together. Lifting the secondary dock lifts one tick.

- [ ] **Step 1: Write the failing tests** in `vowelBoard.test.ts` covering: empty board only shows `base`; stamping `ㅣ` then a tick on `right` yields `ㅏ`; opposite primary moves the tick to `ㅓ`; second tick on `right2` yields `ㅑ`; `ㅡ` with no ticks is `ㅡ`; tick with no base returns null; replacing `ㅣ` with `ㅡ` clears ticks; snap hits nearest in-radius dock and misses outside.

- [ ] **Step 2: Run** `cd app && pnpm test src/lib/domain/vowelBoard.test.ts` — expect FAIL (module missing).

- [ ] **Step 3: Implement** `vowelBoard.ts` to the interfaces above, delegating letters to `buildVowel`.

- [ ] **Step 4: Run tests** — expect PASS.

- [ ] **Step 5: Commit** `feat(domain): add vowel dock-board state`

---

### Task 2: Arrow-key guard for the dock board

**Files:**
- Modify: `app/src/lib/a11y/shortcuts.ts`
- Test: `app/src/lib/a11y/shortcuts.test.ts`

**Interfaces:**
- Consumes: existing `shouldIgnoreArrowNav`
- Produces: `shouldIgnoreArrowNav` also true for an enabled control inside `[data-dock-board]`

- [ ] **Step 1: Write a failing test** that a button inside `[data-dock-board]` keeps arrows, and a disabled one does not.

- [ ] **Step 2: Run** `cd app && pnpm test src/lib/a11y/shortcuts.test.ts` — expect FAIL.

- [ ] **Step 3: In `shouldIgnoreArrowNav`**, after the radio check, add:

```ts
const dockBoard = target.closest('[data-dock-board]');
if (dockBoard) return !isDisabledControl(target);
```

- [ ] **Step 4: Run tests** — expect PASS.

- [ ] **Step 5: Commit** `fix(a11y): keep arrow keys on the vowel dock board`

---

### Task 3: VowelStep board UI

**Files:**
- Modify: `app/src/lib/components/steps/VowelStep.svelte`
- Create: `app/src/lib/components/steps/vowelStep.test.ts`
- Modify: `app/src/lib/components/tray.test.ts` (delete `describe('VowelStep trays', ...)`)
- Modify: `app/src/lib/content/lab02.ts` (hint)
- Modify: `app/src/lib/content/types.ts` (comment)

**Interfaces:**
- Consumes: `vowelBoard.ts` exports, `Tray`, `Target`, `onSettle` / `onNudge`
- Produces: a board with `data-dock-board`, docks as buttons named `data-dock={id}`, palette radiogroup labeled "strokes" with items `ㅣ`, `ㅡ`, `tick`

UI behavior:
- Selected palette stamp + click/Enter on a dock calls `applyStamp`.
- Pointer-down on an occupied dock `liftDock`s; pointer-up on the board `snapDock`s then `applyLift`; miss restores `remaining` if it was a lift, or drops a palette drag.
- `vowelOf === step.target` → `onSettle()`; other real vowels → existing keep-going `onNudge(..., true)`.
- Frozen after settle.
- Win class on the board when `won`.
- Validate with Svelte MCP autofixer before finish.

- [ ] **Step 1: Write failing component tests** in `vowelStep.test.ts`: no ticks/side trays; palette labeled "strokes"; click `ㅣ` then base dock settles a target-`ㅣ` card; click tick then right dock builds `ㅏ` and settles; click left dock after that on an `ㅏ` card soft-nudges (does not settle) when target is `ㅏ` and the left tick made `ㅓ` — use a target-`ㅏ` step for the nudge case; two ticks via right then right2 build `ㅑ`.

- [ ] **Step 2: Run** `cd app && pnpm test src/lib/components/steps/vowelStep.test.ts` — expect FAIL.

- [ ] **Step 3: Rewrite `VowelStep.svelte`** to the board + palette. Remove `Slots`. Reuse `Tray` for the palette (`items={['ㅣ', 'ㅡ', 'tick']}`, label `"strokes"`). Tick chip may use `text` for the word "tick" by mapping display, or show a short mark — palette values stay `ㅣ` `ㅡ` `tick` so `applyStamp` can consume them. Easiest: custom palette in VowelStep rather than forcing Tray to render `tick` as Hangul. If Tray is used, pass `text` false and accept that `tick` renders as the letters t-i-c-k in Hangul font — **do not**. Build a small stamp row in VowelStep (still `role="radiogroup"`) so `ㅣ`/`ㅡ` are Hangul and `tick` is a short mark with aria-label "strokes: tick".

- [ ] **Step 4: Run vowelStep + tray tests.** Remove `VowelStep trays` from `tray.test.ts`. Update the `ㅡ` hint. Update the `VowelStep` comment in `types.ts` to "Stamp strokes onto docks to build a simple vowel."

- [ ] **Step 5: `cd app && pnpm test && pnpm check`**

- [ ] **Step 6: Commit** `feat(lab): spatial dock board for vowel cards`

---

### Task 4: Verify Lab 02 still authors reachable vowel targets

Existing `content.test.ts` already walks `buildVowel`. Run the full suite. No content-test changes unless a hint assertion exists (it does not).
