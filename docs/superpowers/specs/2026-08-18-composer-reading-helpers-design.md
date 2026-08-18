# Composer reading helpers

**Date:** 2026-08-18
**Status:** implemented 2026-08-18 — Visual A (plate caption) + Interface 1 (`jamoReading`)
**Request:** independent pronunciation labels on letter-building slots (`yeo` under ㅕ, `i` under ㅣ), or the same helpers as a hover/focus popover
**Surfaces:** Lab 03 fusion composer first; Assemble uses the same `Slots` primitive

This document is the UI design brainstorm plus an interface-shape comparison that shipped. Caption type in `Slots.svelte` is 0.72rem / 600 (0.62rem under 34rem): spec A’s 0.62/500 vanished at sitting size once Hangul was isolated onto `.slot-value`. Filled batchim keeps the blue border and drops the `--blue-soft` wash so `--ink-faint` stays on paper.

---

## Context

This is a ten-minute Hangul lab, not a consumer language app. The learner is one person (Kyle): a software engineer who already learned a non-Latin script (JLPT N5 Japanese), wants to derive the writing system rather than memorize lists, and rejected lessons that read like articles. Every lab card must demand an action; explanation arrives as feedback on what he just did. Sessions are bursty, completable in one sitting, and mixed pointer/touch.

The emotional register is Botanical Korea — herbarium paper by day, night forest by dark — moss for action, rose for attention, Hangul as the specimen. It should feel like a determination desk, not Duolingo. The standing teaching stance is **trust the Hangul, distrust the romanization**: Lab 02 warns that ㅓ is not an "o" despite `eo`; Lab 04 notes that 김 is romanized Kim while the letter is closer to `g`. Romanization still exists as a scaffold. The composer target already says “Fuse ㅖ — ye”. `/reference` prints a mono reading under every jamo. Review answers are typed Revised Romanization, ASCII, so no Korean IME is required.

Locked brand and stack, inherited from the 2026-08-17 Botanical Korea spec and the running app:

- Light: paper `#faf5ee`, ink `#3e352c`, moss `#315c45`, good `#2f6b45`, blue `#3d5a7a`, rose `#7a3e46`. Dark: paper `#1a2420`, ink `#f5edd9`, sage `#a6c1ae`.
- Type: Newsreader italic for display; Noto Serif KR for English headings; **Noto Sans KR for Hangul (never replace)**; system sans; SF Mono / `ui-monospace` for `.rom` (prose wraps RR in brackets).
- Radii 6 / 10 / 16 / pill. Motion 130 / 240 / 420ms, `cubic-bezier(0.22, 1, 0.36, 1)`.
- Captions (`--ink-faint` vs `--paper`) stay ≥ 7:1 (`polish.test.ts`). Semantic text ≥ 4.5:1. Token-only colors in components. Forced-colors and `prefers-reduced-motion` keep working. No grain on slots, trays, or glyphs.
- Svelte 5 / SvelteKit, CSS custom properties, theme systems.

Competitive context: Duolingo and Drops put romanization first and Hangul as decoration. How to Study Korean and Talk To Me In Korean keep RR as a permanent parallel track. This product inverts that. The new helper has to remain a scaffold, not a second lesson written in English.

The in-scope surface is the letter-building equation in the lab well. Lab 03 fusion is the screenshot: dashed specimen boxes `FIRST ㅕ + SECOND ㅣ = ㅖ`, with first/second vowel trays underneath. Slots are ~4.2rem square (3.8×3.6rem under 34rem) and already carry a 0.5rem uppercase role label (`FIRST` / `SECOND`) at the top of the box. Choice-stage glyphs already have a cousin pattern: `StageItem.caption`, 0.66rem uppercase sans in `--ink-faint` under giant Hangul. `/reference` cells use `.rom2` (0.76rem mono, `--accent`) under the jamo. Fusion appears eight times in Lab 03; Assemble shares `Slots` in Labs 01–04.

Just removed (#86): a dashed “Need a letter? Look it up in Reference” callout from lab sittings. This feature is not that helper in a smaller box. It is an in-place reading of a **filled** composer piece.

Anti-goals: flashy consumer language-app chrome; making RR the thing the eye solves; hover-only (sittings are mixed pointer and touch); labels on empty slots (that would teach before the action); new webfonts; IPA unless justified; changing card order, teach copy, SRS, or the Lab 02 vowel dock board; resurrecting lab-wide Reference chrome.

Assumptions, stated so they can be rejected:

- A reading appears only after a slot is filled. It names what was picked, not the hidden target parts.
- Readings are derived from `hangul.ts` (`VOWEL_RR` / `LEAD_RR` / `FINAL_RR` today; `romanizeSyllable` returns empty for bare jamo). Cards never author `yeo`.
- Isolated vowels use `VOWEL_RR` (ㅕ → `yeo`, ㅣ → `i`). Consonants are slot-aware: lead ㄱ is `g`, batchim ㄱ is `k`; lead ㅇ is silent; batchim ㅇ is `ng`.
- Trays stay Hangul-only in v1. Printed readings on unpicked chips would let someone solve “Fuse ye” from English. Filled-slot labels are feedback; tray labels would be a spoiler.
- The result box does not need its own caption. `Target` already prints the goal reading (`— ye`).
- Touch and keyboard must work without hover. Drag-from-tray is the primary pointer gesture, which makes hover-on-slot a poor exclusive channel.
- Visual chrome uses existing tokens and type roles. No third webfont.

---

## The actual tension

Kyle asked for a little `yeo` under ㅕ and a little `i` under ㅣ, or the same facts as a hover popover. Both are trying to make fusion *audible as arithmetic* (“the y-glide survives”) without turning the well into a romanization worksheet.

Three facts about the current composer matter more than the chrome:

1. **The goal reading is already on stage.** `Target` prints `Fuse ㅖ — ye`. The missing piece is the *parts*, not the product.
2. **Filled-slot labels are feedback; tray labels would be a spoiler.** Labs must not teach before the action. A caption on an unpicked chip lets someone match English names in the trays to the English name in the target. A caption that appears *after* a pick names what you just did — the same contract as teach-copy.
3. **Hover is a weak channel here.** The primary pointer gesture is dragging a tray chip onto a slot. You are not hovering the slot while you fill it. Touch has no hover. Keyboard users get `focus-visible`, not hover. Read-step cards already use **tap-to-reveal** readings under syllable blocks; fusion is a different job (build, don’t decode), so copying that pattern would add a click that fights slot-fill.

So the interesting design question is not “labels vs tooltips” as a binary. It is: how quiet can a filled-slot reading be, where does it sit relative to `FIRST`/`SECOND`, and how much of the composer (slots, result, trays) is allowed to speak English.

---

## Domain: one reading function

`romanizeSyllable` only accepts composed syllable blocks. Isolated jamo currently have no public reader; `VOWEL_RR` / `LEAD_RR` / `FINAL_RR` are private. `/reference` duplicates a `SOUND` map in the page module (`ㅇ` as lead is `—`). Whatever chrome we pick, cards must not grow `yeo` strings. A single exported reader belongs in `hangul.ts`.

Position is part of the answer, not an optional extra:

| Glyph | Lead | Vowel | Batchim |
|---|---|---|---|
| ㅕ | — | yeo | — |
| ㅣ | — | i | — |
| ㄱ | g | — | k |
| ㅇ | *(silent, render nothing)* | — | ng |
| ㄹ | r | — | l |

Fusion slots are always vowels. Assemble’s third slot is `bottom: true` batchim. That is enough to pick the column. Do not take a romanization string from step data.

Silent lead ㅇ: if a helper would be empty, omit the helper. Do not print `silent`, `ng`, or `—` on a composer slot in v1 (reference may keep `—`; that page is a table).

Batchim helpers use representative RR (`ㅌ` → `t`). That is isolation pronunciation, not a spoiler of Lab 04’s later point that spelling preserves identity when a vowel follows.

---

## Surfaces

| Surface | v1 helper? | Why |
|---|---|---|
| Fusion filled slots | **Yes** | The request. Eight Lab 03 cards. |
| Assemble filled slots | **Yes, free** | Same `Slots` component. |
| Result box | No | `Target` already names the goal. |
| Empty slots | No | No spoiler, no fake `?` reading. |
| Tray chips | No | Would leak. Keep Hangul-only. |
| Build-step chain | No | Derivation, not fusion; audio button already present. |
| Vowel dock board | No | Explicitly out of scope. |
| Cluster / liaison picks | No | Different question. |
| Choice `Stage` captions | Unchanged | Already authored (`a`, `bright`). Do not auto-replace. |
| Review glyphs | No | The answer *is* the reading. |
| `/reference` `.rom2` | Unchanged | Should eventually call the same reader; not this sitting. |

---

## Visual approaches

Four directions. They do not depend on each other. Type and color stay inside Botanical Korea; Hangul stays `Noto Sans KR`.

---

### Approach A — Plate caption

**Movement:** Editorial / herbarium. A determination line printed on the specimen plate itself, like the Latin name under a pressed flower — always there once the plate has a specimen, never a floating OS chrome.

**One-liner:** After a slot fills, a quiet mono reading sits at the bottom of that same box, where the eye already looks for `FIRST`.

**Philosophy:** Romanization may *name a piece you already placed*. It may not name pieces still in the tray, may not out-shout Hangul, and may not wear brackets in a 4.2rem box (brackets are a prose convention for `.rom`). Hangul stays the 2.3rem object; the reading is a 0.62rem footnote on the plate.

**Color**

| Role | Light | Dark | Token |
|---|---|---|---|
| Caption on filled slot | `#5c5047` on `#fffdf8` / paper-raised | `#b8c4b0` on `#24302b` | `--ink-faint` on `--paper-raised` (≥ 7:1 vs `--paper` by contract; still ≥ 7:1 on raised) |
| Caption does *not* turn moss or good | — | — | Hangul takes `--accent` / `--good`; RR stays faint |
| Dead fusion | unchanged caption | unchanged | Result box carries `--bad`; do not paint `yeo` red |

No new tokens.

**Typography:** `var(--mono)` (`SF Mono`, `ui-monospace`, `JetBrains Mono`, Menlo, monospace), 0.62rem, weight 500, tracking 0.04em, line-height 1, lowercase, no brackets, no uppercase. This is a third cousin of two existing voices, on purpose: stage `.cap` is 0.66rem uppercase sans (role/english labels like `bright`); `.rom2` is 0.76rem mono in `--accent` (reference *answers*). Composer helpers must recede, so they take mono (they are RR) and faint (they are not the answer).

**Layout:** Inside the slot, below `.slot-value`, still above the box’s padding edge. The existing column is `slot-name` (top) → glyph (middle) → *new* `slot-reading` (bottom). Padding stays `0.4rem 0.9rem`. Reserve 0.72rem at the bottom of every slot so filling does not jump the equation. Gap between glyph and reading: 0.12rem. At ≤34rem, caption 0.55rem; slots already shrink. Result box: no caption. `+` and `=` stay vertically centered on the glyph, not on the whole including caption — align the row with `align-items: flex-end` on the glyph baseline, or keep `center` and accept the caption as part of the plate (prefer **center on the plate**: the box is the object, the caption is inside it).

**Surfaces:** Filled slots only. Not trays, not result, not dock, not review.

**Motion:** Caption `opacity` 0→1 over `--fast` (130ms) `var(--ease)`. Swap: instant replace, no exit. Win/dead: no extra motion on the caption. `prefers-reduced-motion`: opacity 1 immediately.

**States**

- Empty: reserved blank band, no em-dash, no `?`.
- Filled: `yeo` / `i` in faint mono.
- Hot (drag over slot): caption unchanged; border already handles heat.
- Win: Hangul and border go `--good`; caption stays faint.
- Dead: n/a on slots (dead is the result `✕`).
- Forced-colors: caption `CanvasText`; no color meaning.

**Accessibility:** Visible caption `aria-hidden="true"`. Slot `aria-label` becomes `first: ㅕ, yeo` when filled (`first: empty` unchanged). Caption is not a tab stop. Contrast via `--ink-faint` floor. No 44px issue — it is not a control.

**Pedagogy:** Once ㅕ is in FIRST, `yeo` makes the later teach line “the glide rides along” already sitting in the well. Kyle still has to pick ㅕ from a Hangul tray. He can check a wrong pick (`ㅑ` → `ya`) without waiting for the nudge paragraph.

**Risks:** Always-on RR can become the line the eye prefers, especially `eo`/`yeo` pairs. Reserved empty band slightly inflates the plate. Assemble inherits captions automatically, including `k` under batchim ㄱ.

**What this gets right**

- Lands on the screenshot arrows with almost no new chrome.
- Touch and keyboard get the fact for free.
- Matches “explanation as feedback on the action.”
- Reuses tokens and the slot’s existing column.
- Quiet enough to keep Hangul as the specimen.

---

### Approach B — Vitrine annotation

**Movement:** Geometric / Swiss-international. The plate stays Hangul-only. A glass-case annotation — numbered, rectangular, hairline — appears when the specimen is inspected. Cool instrument on warm paper.

**One-liner:** Hangul is unmarked until you inspect a filled slot; then a measured overlay says `yeo`.

**Philosophy:** Concealment is the point. RR is a lookup, not furniture. That honors “distrust the romanization” more fiercely than Approach A. The cost is that fusion arithmetic is invisible unless you inspect both parts.

**Color**

| Role | Light | Dark |
|---|---|---|
| Overlay fill | `#fffdf8` (`--paper-raised`) | `#24302b` |
| Overlay border | 1px `#c4b8a5` (`--rule-strong`) | `#3d4f47` |
| Overlay type | `#3e352c` (`--ink`) | `#f5edd9` |
| Caret | same as border | same |
| Focus ring | existing `--focus-ring` (blue mix) | existing |

Overlay type is ink, not faint: a popover you opened should be readable as a sentence, not a whisper. Ink vs raised paper exceeds 7:1.

**Typography:** Overlay: `var(--mono)`, 0.75rem, weight 500, tracking 0.02em, lowercase, no brackets. Optional second line in 0.58rem sans `--ink-soft`: the slot role (`first`). Do not repeat the Hangul glyph inside the overlay (the slot is still visible behind/beside it).

**Layout:** Anchor to the slot box, prefer **below**, align start with the slot. Max-width 8.5rem. Padding 0.4rem 0.55rem. 6px caret. Radius `--r-sm` (6px). z-index above the sticky well content, below the site header. Collision: the trays sit directly under the equation — a below-overlay will cover the first tray row. **Flip above** if the overlay would overlap `.tray`. At ≤34rem, still flip; never cover `Target`.

Open delay 80ms (avoid drag flicker), close delay 100ms. Drag in progress: overlay suppressed (`trayLift.current` set).

Touch/keyboard cannot be hover. This approach therefore adds **tap-to-toggle on a filled slot** (second tap elsewhere dismisses) and **focus-visible on the slot**. Slots are not buttons today. They must become `tabindex="0"` only when filled, `role="button"` + `aria-expanded`, without breaking drop targets. That is the expensive part of the geometry.

No persistent “show readings” control. A lab-wide toggle would be the #86 callout in a new coat.

**Surfaces:** Filled slots only. Trays stay Hangul-only (a tray overlay would leak). Result: no overlay (`Target` already names it).

**Motion:** Overlay `opacity` 0→1 and `translateY(4px→0)` over `--fast` `var(--ease)`. Reduced-motion: opacity only, 0ms transform. Usable without animation.

**States**

- Empty: not inspectable, not a tab stop.
- Filled idle: Hangul only.
- Hover (fine pointer, not dragging): overlay.
- Focus-visible: overlay.
- Touch-open: overlay until dismiss.
- Win/dead: overlay still allowed; does not recolor to good/bad.
- Forced-colors: overlay `Canvas` / `CanvasText` / `ButtonText` border.

**Accessibility:** `aria-expanded` on the slot. Overlay `role="tooltip"` when hover/focus (non-interactive) and not a focus trap. Do not steal the tray radiogroup. Accessible name: `first: ㅕ` idle, `first: ㅕ, yeo` when expanded. Keyboard: Tab to filled slot, overlay on focus; Escape dismisses. 44×44px hit target is the slot itself (already ≥ 4.2rem).

**Pedagogy:** Best at preventing RR from becoming the default read. Worst at the glide lesson: nothing in the well says `yeo + i` unless both overlays are open (impossible with one hover). Kyle may finish Lab 03 never discovering inspect.

**Risks:** Discoverability in a 10-minute lab. Overlay covering trays. Open-delay fighting drags. Making slots buttons plus drop targets is the fiddliest a11y in the composer. Hover was the user’s alternate idea; on this surface it is the weakest exclusive channel.

**What this gets right**

- Hangul stays unmarked — strongest brand of “trust the letter.”
- Inspect matches how `/reference` is used: look it up when you need it.
- Keyboard and touch are specified, not left as hover-only.
- No reserved caption band, so plates stay today’s size.

---

### Approach C — Determination slip

**Movement:** Warm / organic. Each filled plate grows a hanging herbarium ticket — a determination slip tied under the mount. Physical, pinchable, always on after fill. Not Art Brut: radii stay 6px, no kraft, no wobble, no 40px pebbles.

**One-liner:** The reading is a small paper tag hanging off the slot, like a plant label staked under a specimen.

**Philosophy:** Parts are ingredients with names. The ticket makes `yeo` feel like a label on a jar, not UI chrome. Hangul remains the mount; English is the slip a curator added after identifying the sample.

**Color**

| Role | Light | Dark |
|---|---|---|
| Ticket paper | `#f5edd9` (`--paper-sunk`) — distinct from slot `#fffdf8` | `#141c19` against slot `#24302b` |
| Ticket rule | 1px `#c4b8a5` | `#3d4f47` |
| Stem | 1px `--rule-strong` | same |
| Type | `--ink-faint` | `--ink-faint` |
| Win ticket | border `--good`, fill `--good-soft` | same tokens |

**Typography:** `var(--mono)`, 0.58rem, weight 500, tracking 0.06em, lowercase, no brackets. Ticket min-height 1rem, padding 0.15rem 0.4rem. Slot-name stays the uppercase sans inside the plate; the ticket never repeats `FIRST`.

**Layout:** A 6×1px stem from the slot’s bottom-center, then the ticket, radius `--r-sm`. Ticket `width: max-content; min-width: 2.4rem; max-width: 4.2rem` (match slot). Equation `padding-bottom` grows from `--s5` (1.5rem) to ~2.4rem so tickets do not collide with the first tray. At ≤34rem, stem 4px, ticket 0.52rem type. Result box: no ticket. Align tickets under slots only; `+`/`=` have no slips.

**Surfaces:** Filled slots only.

**Motion:** Ticket `translateY(-4px)` + opacity 0→1 over `--med` (240ms) `var(--ease)` when a vowel seats (a small settle). Reduced-motion: appear at rest, 0ms transform. No bounce. Swap: 130ms replace.

**States**

- Empty: no stem, no ticket.
- Filled: sunk ticket with `yeo`.
- Hot: stem/ticket unchanged.
- Win: ticket wash `--good-soft` (the one place this approach lets RR share the success color — because the ticket is a physical object that “got filed”).
- Dead: slots unchanged.
- Forced-colors: ticket `ButtonFace` / `ButtonText`.

**Accessibility:** Same as A (`aria-hidden` ticket, slot name includes reading). Ticket is not a control. Keep 44px on trays; do not let the ticket steal clicks (`pointer-events: none` on the slip).

**Pedagogy:** Ingredients-with-labels is a good fusion metaphor. The extra chrome can read as cute, which this product has been careful not to be.

**Risks:** Height collision with trays on small wells. Win-green on RR slightly promotes English at the success moment. Two papers (plate + slip) can look busy next to already-named trays. Closest to the Art Brut seasoning the botanical spec forbade, even if radii stay legal.

**What this gets right**

- Always-on, touch-safe, arrow-accurate (under the box).
- Ticket paper ≠ slot paper, so the reading is a distinct object.
- Fits the herbarium metaphor already chosen for the product.
- Empty slots stay visually empty (no reserved band).

---

### Approach D — Figured equation

**Movement:** Bold / experimental, still a lab notebook. Pronunciation is not glued onto each box. It is a **second register** of the same math, like figured bass under a score.

```
  ㅕ   +   ㅣ   =   ㅖ
 yeo  +   i   =   ye
```

**One-liner:** The composer is two aligned equations; Hangul is the one you solve.

**Philosophy:** Fusion’s actual lesson is arithmetic of sounds (`yeo + i = ye`, the glide survives; `o + a = wa`, rounding becomes `w`). A second register teaches that without a paragraph. The danger is that Kyle solves the Latin line and ignores Hangul. Countermeasures: Hangul 2.3–3.2rem vs phonetic 0.7rem; phonetic in faint; empty phonetic cells are blank (not the target’s parts); trays still Hangul-only; result phonetic appears only when the result glyph exists (derived from `fuse`, not from `targetName`).

**Color:** Hangul row uses existing slot colors. Phonetic row is always `--ink-faint` (never `--good`, never `--accent`). On win, only the Hangul result goes `--good`; the `ye` under it stays faint. Light `#5c5047` / dark `#b8c4b0`.

**Typography:** Phonetic: `var(--mono)`, 0.7rem, weight 500, tracking 0.06em, lowercase, no brackets, `text-align: center`. Operators in the phonetic row: 0.7rem `--ink-faint`, not the 1.2rem Hangul operators. Do not use Noto Serif KR here — serif italic would make the Latin line feel like a heading, which would invert the hierarchy.

**Layout:** One CSS grid, five columns (`slot | op | slot | op | out`), two rows. Column centers shared, so `yeo` sits under ㅕ, `+` under `+`. Empty phonetic cell: empty (no `—`), grid row still 1rem so the row does not jump. Result phonetic: only when `result` is a real jamo (partial or win), using the vowel reader, not `step.targetName` (wrong picks must show the fused sound, e.g. ㅑ+ㅣ → `yae`). At ≤34rem the Hangul equation already wraps; the phonetic row must wrap *with* its parent columns (grid, not a second independent flex). Min-height of the phonetic row: 1rem.

**Surfaces:** The equation only. Trays are not a register. Choice stages already have captions; do not double.

**Motion:** Phonetic cell fades in `--fast`. Win: Hangul result scales as today (`1.04`); phonetic does not scale.

**States**

- Empty/empty: Hangul `?` in the out box; phonetic result blank.
- One slot filled: one phonetic cell lives; the other blank.
- Partial real fusion: both parts + result phonetic (this is the teaching state).
- Win: same, Hangul result green.
- Dead: Hangul `✕`; phonetic result blank (there is no sound).
- Forced-colors: phonetic `GrayText`.

**Accessibility:** Phonetic row `aria-hidden="true"`. Each slot’s accessible name includes its reading. The out box `aria-label` includes the fused reading when real (`result: ㅖ, ye`). One status on `Target` already announces the goal; do not add a second live region for the phonetic row.

**Pedagogy:** This is the approach most likely to make “the y-glide survives” visible before teach-copy. It is also the approach most likely to become a crutch: `yeo + i` is easier than ㅕ + ㅣ for a Latin-script engineer. Hierarchy has to be ruthless.

**Risks:** Wrapping on small screens desyncs the two rows if not a shared grid. Wrong-but-real fusions print a phonetic result, which is correct and also more English on screen. Assemble with a batchim slot is a three-term equation; the second register still works (`g + i + m`) but starts to look like a worksheet.

**What this gets right**

- Directly serves the fusion lesson, not just “what is this letter.”
- Always-on, no hover, no extra inspect gesture.
- Result reading comes from `fuse`, so a wrong pair teaches too.
- No interior crowding of `FIRST` vs `yeo` inside one box.

---

## Interface approaches

Same module, four shapes. Visual chrome is out of scope here; this is how callers ask for a reading.

Callers today: `FusionStep` → `Slots` (two named vowel slots). `AssembleStep` → `Slots` (lead, vowel, optional `bottom` batchim). `Tray` is a radiogroup of strings. Tests in `tray.test.ts` assert slot values and radio labels.

---

### Interface 1 — `jamoReading` (minimize)

```ts
export type JamoSlot = 'lead' | 'vowel' | 'batchim';

export function jamoReading(jamo: string, slot: JamoSlot): string;
```

`Slots` calls it. Fusion passes vowel; assemble maps `bottom` → `batchim`, else `name === 'vowel'` → `vowel`, else `lead`. Empty string means “render no helper.”

**Usage**

```ts
// hangul.ts — the maps become the implementation, not a second SOUND table
jamoReading('ㅕ', 'vowel')    // 'yeo'
jamoReading('ㄱ', 'lead')     // 'g'
jamoReading('ㄱ', 'batchim')  // 'k'
jamoReading('ㅇ', 'lead')     // ''
jamoReading('ㅖ', 'vowel')    // 'ye'

// Slots.svelte — no new props. Infer the column; do not parse `name`.
// Fusion uses name 'first' | 'second', not 'vowel'.
function column(slot: Slot): JamoSlot {
  if (slot.bottom) return 'batchim';
  if (slot.value && VOWELS.includes(slot.value as Vowel)) return 'vowel';
  return 'lead';
}
reading = slot.value ? jamoReading(slot.value, column(slot)) : ''
```

FusionStep does not change. Tests hit `jamoReading` directly; composer tests assert a `.slot-reading` text node.

**Hides:** RR tables, silent ㅇ, the `first`/`second` vs `vowel` naming mismatch, the fact that syllable `romanizeSyllable` is a different function.

**Trade-offs:** Tiny, deep, correct-by-default for every `Slots` caller. Cannot represent hover vs always-on (that is CSS). Cannot omit assemble without a new `Slots` prop (see locked visual: we *want* assemble for free). Misuse: passing `'vowel'` for a consonant yields `''` (safe); passing `'lead'` for ㅕ yields `''` (safe). Wrong slot for ㄱ is the real misuse (`g` vs `k`) — `bottom` already encodes it. Inferring from `VOWELS` membership is safer than matching `name === 'vowel'`, which would miss fusion.

**Out:** reveal mode, IPA, tray, `targetName`, popover APIs.

---

### Interface 2 — `ReadingHint` policy (maximize)

```ts
type Reveal = 'always' | 'inspect' | 'never';
type Scheme = 'rr' | 'ipa';
type Density = 'slot' | 'tray' | 'result' | 'all';

interface ReadingHintProps {
  jamo: string | null;
  slot: JamoSlot;
  reveal: Reveal;
  scheme?: Scheme;
  density?: Density;
  openDelayMs?: number;
  inspectLabel?: string;
}
```

Plus `useReading(jamo, slot, scheme)` and a `<ReadingHint>` that owns popover vs caption.

**Usage:** Fusion always-on, Tray inspect, Assemble batchim inspect with `scheme: 'rr'`.

**Hides:** positioning math, hover vs focus vs tap.

**Trade-offs:** Every caller must choose policy. Easy to ship tray spoilers (`density: 'all'`). Easy to leave `reveal` defaulting to hover and fail touch. Shallow: a large interface over two CSS display modes. This is the flexible design’s usual failure.

**Still out:** authoring per-card strings, changing lab content types.

---

### Interface 3 — Fusion-only caption (common case)

```ts
// FusionStep.svelte only
<Slots
  slots={[
    { value: a, name: 'first', reading: a ? jamoReading(a, 'vowel') : '' },
    { value: b, name: 'second', reading: b ? jamoReading(b, 'vowel') : '' }
  ]}
  ...
/>

// Slots.svelte
interface Slot {
  value: string | null;
  name?: string;
  bottom?: boolean;
  reading?: string; // optional, caller-supplied
}
```

**Usage:** FusionStep computes two strings. Assemble unchanged (no helpers). Hover is unrepresentable.

**Hides:** almost nothing — the caller owns the reading.

**Trade-offs:** Smallest visual diff for the screenshot. Paints into a corner: Assemble must copy the same wiring or diverge. `reading?: string` lets a card author `yeo` in `lab03.ts` (the exact foot-gun the domain rule exists to prevent). Easy to use for fusion; easy to misuse by passing a literal.

**Out:** trays, popovers, assemble, result.

---

### Interface 4 — Specimen (dictionary / herbarium)

```ts
interface Specimen {
  glyph: string | null;
  role: 'first' | 'second' | 'consonant' | 'vowel' | 'batchim';
  reading: string; // always derived, never caller-authored
}

function specimenOf(glyph: string | null, role: Specimen['role']): Specimen;

// Slots takes Specimen[] instead of { value, name?, bottom? }
```

`reading` is filled by `specimenOf`, which infers `JamoSlot` from `role`. Stage’s `{ glyph, caption? }` stays a different type: those captions are authored English (`bright`), not RR.

**Usage:** `slots={ [specimenOf(a, 'first'), specimenOf(b, 'second')] }`. Tray stays `string[]` in v1 (Hangul-only).

**Hides:** slot→column mapping (`first`/`second` → vowel).

**Trade-offs:** Pretty metaphor. Migrating `Slots` breaks every test that builds `{ value, name }`. `reading` on the object still looks caller-settable unless the field is omitted and computed inside `Slots`. Depth is questionable: this is `jamoReading` plus a rename of `name`. Cute if the visual is Approach C; otherwise extra type for one string.

**Out:** putting `caption` and `reading` on the same field (Stage would break).

---

## Comparison

### Visual

Always-on (A, C, D) beats inspect (B) on this surface. The user-offered tooltip is a real idea — it is how you look up a letter on `/reference` — but the composer is a build, not a dictionary. Hover fights drag; touch has no hover; fusion wants both parts visible at once.

Among always-on:

- **A** is the smallest chrome change and lands on the arrows. Hierarchy is correct if the caption stays faint mono, not accent like `.rom2`.
- **C** is the most “botanical,” and the most likely to feel like extra furniture in a well that already has slot-names, tray labels, and `Target`.
- **D** is the best fusion teacher and the highest crutch risk. It also forces a layout rewrite of `.asm` from flex to a two-row grid, including wrap.

Brand alignment: A and C. Differentiation: D. Feasibility: A. Audience (system-learner who asked for `yeo`/`i` on the plates): A or D, with A safer.

### Interface

Simplicity: 1 and 3. Depth: **1** (one function hides the tables; `Slots` stays the compositor). 3 is shallow and invites authored strings. 2 is a kit. 4 is a costume on 1.

Ease of correct use: 1, because FusionStep does not have to remember to pass readings. Ease of misuse: 2 and 3 (policies and literals). Assemble-for-free is a feature of 1, not a bug, if the visual is “filled slots.”

Efficiency: all four can paint A. Only 2 can paint B without a second component.

### Where they diverge

The real fork is **inspect vs always-on**, not ticket vs caption. Always-on + `jamoReading` gets A or D with CSS. Inspect requires Interface 2’s policy object *and* slots-as-buttons. Do not buy that unless we reject always-on.

A second fork: **inside the plate (A) vs second register (D)**. Inside the plate matches the screenshot. Second register matches the teach copy. They can meet: A’s captions, centered under each glyph, already let a careful eye read `yeo + i` without a formal second operator row. That is enough.

---

## Evaluation

Weights: Audience fit 0.30, Brand alignment 0.25, Differentiation 0.20, Feasibility 0.15, Completeness 0.10.

Scores 0–1, then weighted. Normalized so visual approaches sum to ~1.0 and interface approaches sum to ~1.0 separately (they answer different questions).

### Visual

| | Aud 0.30 | Brand 0.25 | Diff 0.20 | Feas 0.15 | Comp 0.10 | Weighted | P(select) |
|---|---|---|---|---|---|---|---|
| A Plate caption | 0.90 | 0.88 | 0.45 | 0.95 | 0.90 | 0.813 | **0.29** |
| B Vitrine overlay | 0.40 | 0.70 | 0.70 | 0.40 | 0.80 | 0.575 | 0.20 |
| C Determination slip | 0.72 | 0.85 | 0.60 | 0.70 | 0.80 | 0.734 | 0.26 |
| D Figured equation | 0.80 | 0.55 | 0.90 | 0.55 | 0.85 | 0.725 | 0.25 |

P(select) is the weighted score divided by 2.847. A leads. C and D are clustered. B loses on audience fit (the request was to *see* `yeo` on that card) and feasibility (slots as inspect buttons). If A and C feel tied, pick A: less new furniture, same always-on contract.

### Interface

| | Aud 0.30 | Brand 0.25 | Diff 0.20 | Feas 0.15 | Comp 0.10 | Weighted | P(select) |
|---|---|---|---|---|---|---|---|
| 1 `jamoReading` | 0.92 | 0.80 | 0.40 | 0.95 | 0.85 | 0.784 | **0.30** |
| 2 Policy kit | 0.55 | 0.50 | 0.75 | 0.45 | 0.90 | 0.598 | 0.23 |
| 3 Fusion-only prop | 0.70 | 0.60 | 0.30 | 0.90 | 0.55 | 0.610 | 0.23 |
| 4 Specimen type | 0.50 | 0.75 | 0.65 | 0.50 | 0.70 | 0.613 | 0.24 |

P(select) is the weighted score divided by 2.605. Audience and feasibility pull **1** ahead. Brand for 4 is the metaphor, not the product’s actual type system. 3 looks cheap and fails the “never author RR in content” rule the moment someone types `reading: 'yeo'`.

---

## Recommendation

**Visual A + Interface 1.**

Always-visible, quiet, mono, inside the filled slot, under the glyph, `--ink-faint`, no brackets, reserved band so the equation does not jump. No helper on empty slots, trays, or the result box. `jamoReading(jamo, slot)` in `hangul.ts`; `Slots` derives the caption; FusionStep unchanged; Assemble inherits.

Reject hover as the exclusive channel. It is a good dictionary pattern and a bad composer pattern. If inspect is wanted later, Read-step already owns tap-to-reveal for *decoding*; do not copy it onto drop targets.

Do not ship D’s second operator row in v1. A’s captions already form a readable `yeo … i` under the plates. Revisit D only if, after using A, the glide lesson still fails to land before teach-copy.

Do not ship C’s hanging tickets. The herbarium story is already in paper, ticks, and moss. A second paper object under every slot is furniture.

### Locked for a future implementation plan (only after this spec is approved)

- Export `jamoReading(jamo: string, slot: 'lead' | 'vowel' | 'batchim'): string` from `hangul.ts`. Empty string = no caption. Tests: ㅕ/vowel `yeo`, ㅣ/vowel `i`, ㄱ/lead `g`, ㄱ/batchim `k`, ㅇ/lead `''`, ㅇ/batchim `ng`.
- `Slots` infers the column (`bottom` → batchim; else `VOWELS` membership → vowel; else lead). Do not switch on `name` (`first`/`second` would miss). Renders `.slot-reading` when the string is non-empty; `aria-hidden` on the visible caption; `aria-label` includes the reading.
- Type: 0.62rem `var(--mono)`, 500, tracking 0.04em, lowercase, `--ink-faint`.
- Reserve 0.72rem under the glyph in every slot.
- No `reading` string prop (prevents authored literals).
- No new tokens, webfonts, or hex in `.svelte`.
- `tray.test.ts` keeps passing; add assertions that a filled fusion slot shows `yeo` / `i` and that tray radios do not.
- `/reference` `SOUND` map is a later consumer of `jamoReading`, not this sitting.

### Open for review (pick one)

1. **Assemble inheritance** — keep (recommended) or pass a silent `Slots` flag to limit captions to fusion. Independent drafts split: infer-from-glyph inherits; an explicit `as?: JamoSlot` or `fusionReadings` flag opts in so unused `Slots` stay mute. Inheritance is simpler; batchim `k`/`t`/`ng` is honest isolation RR.
2. **Caption color** — `--ink-faint` (recommended, recedes) vs `--accent` like `.rom2` (louder, more reference-like). Do not put `--ink-faint` on `--paper-sunk` (fails the 7:1 caption floor). Do not paint RR `--good` on win (the Hangul result already carries the grade).
3. **Result-box reading** — omit (recommended: `Target` already names the assignment) vs label only when `fuse`/`compose` returns a real glyph (the assignment and the specimen produced are different sentences; a miss should read `ae` under ㅐ while the target still says `ye`). Never concatenate `yeo`+`i`. Never label `?` or `✕`.

---

## Independent drafts

Four visual directions and four interface shapes were written in isolation, then scored above. They agree on the spine: Hangul-only trays, filled-only helpers, derived RR (never authored in `lab03.ts`), no hover-only exclusive channel.

| Draft | One-line |
|---|---|
| Herbarium epithet | Always-on italic plate caption *inside* the filled mount |
| Vitrine registration | Inspect overlay (`[yeo]`) on hover / focus / tap-toggle; idle Hangul only |
| Determination hang-tickets | Always-on paper slip under a 1px stem; tickets never go green |
| Graphite stave | Second equation register (`yeo + i = ye`); result RR withheld until Hangul exists |
| Minimize | `romanizeJamo(jamo, slot)` + optional `Slot.as` |
| Fusion common-case | `romanizeVowel` + `fusionReadings` flag; assemble stays unlabeled |
| Maximize | Three-layer policy kit — honest that it is easy to teach the wrong sound |
| Specimen | Branded `collect(identity, collection)`; deep only if `caption` dies |

The recommendation (plate caption + one domain function) is the overlap of the always-on visuals with the small interfaces. Inspect, tickets, the stave, the policy kit, and the specimen type remain on the record as rejected for v1, not as unread.

---

## Spec self-review

- No TBD/TODO left in the locked section. The three open questions are explicit.
- Visual A does not contradict Interface 1: no `reading` prop, no hover API.
- Scope is one sitting: one function, one component, fusion+assemble. Not trays, not dock, not reference migration.
- “Hover vs labels” is resolved as “labels; hover is the wrong exclusive channel,” not as “maybe both.”
- Assumptions about trays-as-spoilers and result-already-named are stated so they can be rejected without a rewrite of the rest.

---

## Next

Shipped as Visual A + `jamoReading` on `Slots`. Open leftovers: `/reference` `SOUND` map as a later consumer; result-box RR still omitted.
