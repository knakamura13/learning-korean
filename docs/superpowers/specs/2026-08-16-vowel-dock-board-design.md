# Vowel dock board

Lab 02 vowel cards stop being a parameter mixer (base / ticks / side trays plus an equation readout) and become a spatial dock board. The learner places the Hangul vowel coordinate system instead of clicking labels for it.

## Goal

On `type: 'vowel'` cards, the learner stamps a long stroke onto the center of a square, then stamps ticks onto docks around it. The board is the same state for pointer and keyboard. Valid-but-wrong placements still compose a real vowel and soft-nudge, matching today's exploration contract.

Success is: the five Lab 02 vowel cards are solvable by placing strokes in space, still completable inside the lab's ~9 minute budget, and still solvable with no pointer.

## Non-goals

- Assemble, fusion, and consonant `build` cards. Assemble is the first later extension; it is not in this change.
- Handwriting, stroke order, or freeform pixel-matching.
- A new step type. Cards stay `type: 'vowel'`.
- Changing Lab 02's targets, teach copy, or card order, except the one hint that names the old "none" control.

## Locked decisions

- Empty placeholders are remaining docks for **this card's target** (`n − m`). Occupied docks are quiet magnets (glyph shows through; focus ring stays). A finished letter shows no slots.
- Snap uses those board docks, not every geometrically valid Hangul dock. Opposite-side exploration happens on the next Lab 02 card (ㅓ after ㅏ), not by opening a left hole on the ㅏ card.
- A finished wrong letter soft-nudges (`onNudge(..., true)` → **Not quite**). A correct unfinished recipe (bare `ㅣ` while building `ㅏ`) is silent.
- Stamp palette: `ㅣ`, `ㅡ`, and one tick. The tick may be stamped 0, 1, or 2 times. It orients to the current base (horizontal tick on `ㅣ`, vertical tick on `ㅡ`). Earth-vowel cards start with `ㅡ` selected.
- Pointer drag and keyboard operate the same board state. Click stamps the selected palette piece when that stamp can seat; otherwise the dock matches Enter (a tick hole seats immediately; the base opens a picker on the selected stroke).
- `buildVowel` in `hangul.ts` remains the source of truth for which pieces make which letter.

## Board state

State is the same triple the current widget already holds:

```ts
interface BoardState {
  base: 'ㅣ' | 'ㅡ' | null;
  ticks: 0 | 1 | 2;
  side: TickSide | null; // 'left' | 'right' | 'above' | 'below'
}
```

`vowelOf(state)` is `buildVowel(base, side, ticks)` when `base` is set, otherwise `''`.

## Docks

| Dock id | Role |
|---|---|
| `base` | Centre. Accepts `ㅣ` or `ㅡ`. |
| `left` `right` | Primary tick docks when base is `ㅣ`. |
| `above` `below` | Primary tick docks when base is `ㅡ`. |
| `left2` `right2` `above2` `below2` | Second-tick dock on the occupied side (iotation). |

`visibleDocks(state)` is full Hangul geometry (used by stamp/lift rules):

- No base: only `base`.
- Base `ㅣ`: `base`, `left`, `right`. If `ticks >= 1` and `side` is `left` or `right`, also `${side}2`.
- Base `ㅡ`: `base`, `above`, `below`. If `ticks >= 1` and `side` is `above` or `below`, also `${side}2`.

The widget renders `boardDocks(state, target)`:

- Empty board: remaining recipe docks for the target (silhouette). ㅏ shows `base` + `right`; ㅛ shows `base` + `above` + `above2`.
- Matching base seated: remaining recipe tick holes plus occupied magnets.
- Wrong base seated: only the occupied `base` magnet. Tick holes the current stroke cannot take stay hidden.
- Complete letter: none.

A tick dock that is not on the board is not a drop target, except the outer iotation hole on an empty iotated silhouette: empty ㅛ/ㅑ/ㅠ/ㅕ boards show both tick holes, and the outer one may seat the first tick (count 1). A second stamp on it adds the glide.

Normalized positions on a unit square, used for layout and snap. `dockPosition(id, shown)` uses letter geometry when both pair members are in `shown`; a lone tick stays on the midline.

- `base` → (0.50, 0.50)
- Lone `left` → (0.22, 0.50), lone `right` → (0.78, 0.50)
- Lone `above` → (0.50, 0.22), lone `below` → (0.50, 0.78)
- Paired ㅛ: `above` → (0.35, 0.22), `above2` → (0.65, 0.22)
- Paired ㅠ: `below` → (0.35, 0.78), `below2` → (0.65, 0.78)
- Paired ㅑ: `right` → (0.78, 0.35), `right2` → (0.78, 0.65)
- Paired ㅕ: `left` → (0.22, 0.35), `left2` → (0.22, 0.65)

Spatial arrows follow those pixels: Right between ㅛ ticks, Down between ㅑ ticks. They do not wrap.

Snap radius is 0.20 of the board's CSS width, and at least 44px. Nearest compatible visible dock inside the radius wins. Otherwise the drop bounces (state unchanged).

## Stamp rules

`applyStamp(state, dock, stamp)` returns the next state, or `null` to reject.

- `ㅣ` or `ㅡ` on `base`: set that base. If the base changed, clear ticks and side.
- `ㅣ` or `ㅡ` on a tick dock: reject.
- `tick` on `base`, or `tick` with no base: reject.
- `tick` on a visible primary dock: set `side` to that dock's side and `ticks` to `max(1, current ticks)`. Stamping the opposite primary **moves** existing ticks to that side (count preserved). That is "move the tick and watch."
- `tick` on a secondary dock whose side is legal for the base: if `ticks` is 0, seat one tick on that side; otherwise set `ticks` to 2. Empty iotated boards show both holes, so the outer hole must be able to take the first tick.

`clearDock(state, dock)`:

- Clear `base`: empty board.
- Clear a primary tick dock: `ticks = 0`, `side = null` (secondary disappears).
- Clear a secondary tick dock: `ticks = 1`, `side` unchanged.
- Clear an empty dock: no-op, return the same state.

Opposite-side ticks never coexist. Two ticks always sit on one side. That is Hangul; do not invent a plus-sign letter.

## Pointer

Primary: pointer-driven drag (not HTML5 drag-and-drop — that fails on touch).

- Pointer-down on a palette stamp starts a drag of that stamp.
- Pointer-down on an occupied dock picks the occupant up (temporarily `clearDock`) and drags it.
- Pointer-up over the board: `snapDock`; if a dock accepts the stamp, `applyStamp`; else restore any picked-up occupant.
- Dragging a piece off the board, or releasing outside the snap radius with no dock, removes it if it came from the board, or returns it to the palette if it came from the palette.

Secondary, same state: click a palette stamp to select it, then click a dock. If that stamp can seat, `applyStamp`. If not, the dock matches keyboard Enter: a single compatible stamp seats immediately; the base opens the shape picker.

After the card has settled (`won`), the board does not accept stamps or clears.

## Keyboard

Palette radiogroup (`ㅣ`, `ㅡ`, tick). Earth-vowel cards preselect `ㅡ`.

Docks are buttons inside a `data-dock-board` group. One tab stop; arrow keys move focus between **board** docks by geometry (no wrap). Enter/Space: a dock that only accepts a tick seats it; a dock that accepts `ㅣ` and `ㅡ` opens a wrapping picker starting on the selected palette stroke. Escape closes the picker. Delete or Backspace clears the focused dock.

LabRunner currently treats any focused `button` as a card-jump target for Left/Right. `shouldIgnoreArrowNav` must also return true for an enabled control inside `[data-dock-board]`, the same way it already protects `[role="radio"]`.

The Enter that seats the letter `preventDefault`s, so `shouldAdvanceOnEnter` must ignore `defaultPrevented` and not skip the teach step. After settle, docks disable and a later Enter advances as today.

## Visual

The equation row (`base + ticks = result` from `Slots.svelte`) goes away on vowel cards. `Slots` stays for assemble and fusion.

The building zone is one square. A seated base or tick always yields a real simple vowel (`buildVowel` of a base with 0–2 ticks), so the seated visual is always the Unicode jamo, never a DIY plus-sign sitting on top of the letter.

- Empty: dashed square plus the target silhouette (remaining recipe holes).
- Occupied: the Unicode jamo from `vowelOf(state)` large in the center. Occupied docks are quiet magnets (not labeled boxes) and remain hit targets with a visible focus ring. They do not draw a second copy of the tick on top of the glyph.
- During a drag, a ghost of the stamp follows the pointer.
- Win: the same green treatment the old result box used (`--good` border and fill).

Palette chips show the two long strokes as Hangul `ㅣ` and `ㅡ`, and the tick as a short mark labeled "tick". Do not bring back "none / one / two" or "left / right".

`Target` above the board is unchanged.

## Feedback

`VowelStep` settle/nudge rules:

- `vowelOf(state) === step.target` → `onSettle()` once.
- A different **finished** real vowel → `onNudge(keep-going HTML, true)` (**Not quite**, not **Try again**).
- A correct prefix of the target (`towardTarget`) is silent, including base-only when the target still needs ticks.
- Empty board or base-only when the target is a bare stroke is a win for that bare stroke (`ㅡ` / `ㅣ`).

Wrong-orientation and empty-space drops are silent: the piece bounces. No miss tally.

## Content

In Lab 02, the `ㅡ` card hint currently says "Set the ticks to none." Change it to "Just the earth stroke — no ticks." No other lab copy changes.

## Architecture

New pure module `app/src/lib/domain/vowelBoard.ts`: docks, visibility, stamp/clear/snap, `vowelOf`. It calls `buildVowel` / `sidesFor`; it does not duplicate the vowel table.

`VowelStep.svelte` owns pointer, keyboard, and rendering. It holds `BoardState` and a selected stamp. It does not reimplement composition.

The palette is a custom stamp row in `VowelStep` (Hangul strokes plus a labeled tick mark), not `Tray`.

`shouldIgnoreArrowNav` in `app/src/lib/a11y/shortcuts.ts` gains the dock-board exception.

No domain changes to `hangul.ts` beyond existing `buildVowel`.

## Testing

Domain tests in `vowelBoard.test.ts` cover: all ten simple vowels via stamps; bounce cases; moving ticks across sides; second tick = iotation; replacing the base clears ticks; snap nearest-in-radius vs bounce; `vowelOf` delegates to `buildVowel`.

Component tests replace the old VowelStep tray assertions: palette exists; tick-side / none-one-two trays do not; click-to-place builds `ㅣ` (bare) and `ㅏ`; moving the tick to the other side builds `ㅓ` and soft-nudges; two ticks on the right build `ㅑ`; keyboard stamp on a dock works; Left/Right on a dock do not need to be asserted through LabRunner if the shortcuts unit test covers the guard.

Existing `content.test.ts` reachability via `buildVowel` stays. Tray tests for Fusion and Assemble stay.

## Risks

- Docks that look like the old labeled slots. Keep chrome quiet: magnets, not "LEFT" boxes.
- Snap too tight on touch. Floor the radius at 44px.
- Two-tick vs one-tick confusion. Empty iotated boards show both holes in letter geometry; the first tick on either hole is still one tick, and the second hole is the glide.
