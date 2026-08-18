# Solo sitting layout

**Date:** 2026-08-18
**Status:** ready to implement
**Problem:** On wide lab sittings (`≥72rem`, `--sitting: 90rem`), screens with no right-column well leave a vacant column. The known case is the lab finish card: a `--measure` (36rem) plaque, left-aligned, with the 01–06 rail still showing.

## Inventory

| Screen | Frame | Right column | Empty-right bug? |
|---|---|---|---|
| Lab in progress | `--sitting` + rail + `LabSpread` | Interactive well (or loading skeleton) | No |
| **Lab finish** | `--sitting` + rail, **not** in `LabSpread` | None | **Yes** — 36rem card, start-aligned |
| Lab prerequisite gate | Full sitting main, above the spread | N/A (banner, not a column) | No — too wide if anything, not vacant |
| Home | `--shell` + rail | Content fills main | No |
| Review | `.shell.narrow` (40rem), centered; no rail | N/A | No — leftover paper is already mat |
| Reference | `--shell`, content fills | N/A | No |
| Error | `--shell`, card fills shell | N/A | No |

There is one empty-right instance: **lab finish** inside a sitting that was sized for a two-column spread.

## Constraints

- In-progress spread stays `article (~36rem) | sticky well (minmax(280px, 1fr))` at `≥72rem`.
- Keep `--measure` for readable prose. Do not stretch Hangul instruction to 90rem.
- Existing test: `.finish { max-width: var(--measure) }`.
- Existing `LabSpread` source contracts: tickless well, `'article spread-col'`, sticky `spread-col`.
- Header on lab routes stays `--sitting`. Rail stays. Do not two-column Review or Reference.
- Visible chrome must not say Colophon / ToC / folio / fascicle.

Product-owner visual options to consider: widen the left column, span both columns, or center the content with generous horizontal whitespace.

## Four interfaces

### 1. Unpaired `LabSpread` (minimize props)

```ts
LabSpread({ article: Snippet; well?: Snippet; after?: Snippet })
```

Omission of `well` is the layout. No mode enum. Paired = today’s desk. Unpaired = one sitting-wide track whose article is `--measure` and centered. Finish always sits in `LabSpread` and simply does not mention a well.

**Hides:** grid templates, sticky well chrome, the vacant-column problem.
**Cost:** finish remounts inside the compositor; a well-less full-bleed diagram cannot fill `--sitting` without a new prop (accepted).

### 2. Geometry algebra (maximize flexibility)

`LabSitting` (frame + rail + banner) plus `LabSpread` with `layout: 'split' | 'solo' | 'span' | 'custom'`, occupancy, tracks, presets (`work`, `ceremony`, `read`, `span`).

**Hides:** compile step from props to CSS.
**Cost:** a layout engine for one screen. Shallow: large interface, thin per-call implementation. Rejected (YAGNI).

### 3. `.solo` class (optimize for the finish card)

```css
.solo { margin-inline: auto; }
```

Finish stays out of `LabSpread`. `.finish` keeps `--measure`. One class, one property.

**Hides:** sitting math from the card.
**Cost:** the next unpaired sitting can forget the class. Shallow module.

### 4. Closing mount (print-informed)

Discriminated `imposition: 'spread' | 'closing'`. Closing plate is `--plate: 44rem`, centered in the type area (sitting minus rail), optionally vertically centered. Header and rail do not shrink.

**Hides:** that widen + span + center are one closing imposition.
**Cost:** new token, vertical theater the screenshot does not ask for, and a second named snippet (`plate`) beside `article`.

## Comparison

Interface simplicity favors 1 and 3 (one optional snippet, or one class). 2 is the opposite. 4 is a second scene type.

Depth favors 1: a small compositor that already owns sitting geometry also owns the unpaired state. 3 is a one-line CSS patch that does not teach the next caller. 2 is a large interface over the same CSS. 4 is deep but specialized to a “closing plate” metaphor we do not need in chrome.

Ease of correct use: 1 makes the vacant well unrepresentable (do not pass `well`). 2 can still draw a ghost column. 3 is easy to misuse by omitting `.solo`. 4 cannot represent “spread with no well,” which is good.

Implementation efficiency: all four can paint the same pixels for finish. 1 reuses the existing grid host. 3 is the fewest bytes. Neither 2 nor 4 buys a second known caller.

Visual choice for finish: **center a `--measure` plaque in sitting main**. Widening a left-aligned card still leaves a hole. Spanning `--sitting` inflates a ceremony card into empty chrome. Review already proved centered leftover paper reads as margin, not a missing widget. Do not widen past `--measure` (locked by line length and the existing finish test). Do not shrink the header or drop the rail — those are sheet furniture, not spread columns.

## Synthesis (locked)

Use **interface 1** with **visual 3**:

1. `well` becomes optional. `{#if well}` mounts the sticky sunk column. Omission is unpaired — never an empty `.well`.
2. Unpaired root gets class `solo`: `max-width: var(--measure); width: 100%; margin-inline: auto` at every width. The leftover sitting is symmetric mat in the type area (to the right of the 01–06 rail).
3. Lab finish wraps the existing `.finish.card` in `LabSpread` with `article` only. `.finish` keeps `max-width: var(--measure)`.
4. `after` without `well` stacks under the article inside the same centered measure (finish omits `after`).
5. In-progress call site unchanged: `article` + `well` + `after`.
6. Review, home, reference, error, and the gate banner stay off this compositor.

Success: at `≥72rem`, finishing Lab 01 shows a 36rem card optically centered in the main column, with balanced paper on both sides of the plaque, rail still in the gutter, and the in-progress two-column desk untouched.
