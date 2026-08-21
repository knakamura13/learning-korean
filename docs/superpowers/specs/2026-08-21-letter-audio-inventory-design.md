# Letter-audio inventory

**Date:** 2026-08-21
**Status:** ready to implement
**Slice:** playback models for every jamo the letter/final deck quizzes. No word clips, no predict-then-hear, no mic, no runtime TTS, no Hangul composition, no sprint changes.

## Why this, why now

The win condition includes predicting sound from spelling. Review and labs still have models for only the 19 Lab 01 leads (`C+으` opus). Vowels, compounds, batchim, and clusters are silent. Lab 03’s mergers and Lab 07’s spoken forms cannot be checked by ear.

This slice fills the **letter** inventory and makes failure visible on a phone. Word-level clips stay a later addition (predict-then-hear).

## Constraints (locked)

- Hangul-first decoder. Playback only. No mic, no speech scoring, no XP/streaks/loot.
- Phone and desktop are equal. A control that exists on desktop and vanishes on iOS fails.
- One addition, one surface family: the existing play control, generalized. No new route.
- Do not scrape How To Study Korean or any course. Do not call a TTS API at runtime.
- Lessons still must not hard-code an answer the domain can derive. Clip *paths* are data; neutralization of finals uses `batchimSound`.
- Existing `static/audio/consonants/*.opus` URLs stay valid.

## Audio source (honest)

The 19 lead clips are **original pedagogical synthesis** (CC0), from `app/scripts/generate-consonant-audio.py`, not human recordings. This slice extends that same generator for vowels and finals, and adds an MP3 sibling for every clip.

Runtime speech synthesis is forbidden. Human native recordings are a later upgrade, not this slice. The ㄱ/ㅋ/ㄲ distinction stays in the existing formant/burst synthesizer, not in a generic TTS voice.

## Slot

The glyph `ㄱ` is both a lead and a batchim. Lookup **requires a slot**:

```ts
type AudioSlot = 'lead' | 'vowel' | 'final';
```

| Slot | Subjects | Carrier in the synthesizer | Directory |
| --- | --- | --- | --- |
| `lead` | 19 `LEADS` | `C+으` (unchanged) | `static/audio/consonants/` |
| `vowel` | 21 `VOWELS` (basic + compounds) | `ㅇ+V` (아, 어, 왜, …) | `static/audio/vowels/` |
| `final` | any jamo with `batchimSound(jamo)` | unreleased `아+대표음` | `static/audio/finals/` |

`letterAudioSources(jamo, slot)` returns `{ opus, mp3 }` or `null`.

- `lead` + non-lead → `null`
- `vowel` + non-vowel → `null`
- `final` + no `batchimSound` → `null` (empty string, ㄸ/ㅃ/ㅉ as leads-only, etc.)

Finals that neutralize together **share one clip**, keyed by `batchimSound(jamo)`:

| Representative | Slug | Includes |
| --- | --- | --- |
| ㄱ | `k` | ㄱ ㄲ ㅋ ㄳ ㄺ |
| ㄴ | `n` | ㄴ ㄵ ㄶ |
| ㄷ | `t` | ㄷ ㅅ ㅆ ㅈ ㅊ ㅌ ㅎ |
| ㄹ | `l` | ㄹ ㄼ ㄽ ㄾ ㅀ |
| ㅁ | `m` | ㅁ ㄻ |
| ㅂ | `p` | ㅂ ㅍ ㄿ ㅄ |
| ㅇ | `ng` | ㅇ |

Vowel slugs (ASCII stems):

`a ya eo yeo o yo u yu eu i ae yae e ye wa wae oe wo we wi ui`

Merged vowels (ㅐ/ㅔ, ㅒ/ㅖ, ㅙ/ㅚ/ㅞ) use **the same synthesis parameters** so the files are homophones, matching Lab 03. They remain separate files so each review card has a stable URL.

`consonantAudioSrc(jamo)` stays as `letterAudioSources(jamo, 'lead')?.opus ?? null` so old tests and any leftover call sites keep working.

## Player

Generalize `ConsonantClip.svelte` in place (keep the filename this slice, or rename to `AudioClip.svelte` and update the polish import — rename is allowed if tests follow).

- `<audio>` contains two `<source>` elements: opus first (`type="audio/opus"`), then mp3 (`type="audio/mpeg"`).
- `preload="none"`.
- 44×44 px minimum hit target, same on phone and desktop.
- **Visible failed state:** on `error` (and non-AbortError play failure) do **not** unmount the control. Disable it, keep 44px, `aria-label` becomes `Couldn't play {jamo}`, muted/disabled styling. A phone that cannot decode opus must either play the mp3 or show this state — never a missing gap where the desktop has a button.
- `PlayButton` gains required `slot: AudioSlot` (prop name `slot` conflicts with Svelte snippets — use `audioSlot`).

```svelte
<PlayButton jamo="ㄱ" audioSlot="lead" />
```

Optional `src` override remains for tests (`src={null}` hides the control; a string override is the opus URL only in tests — production always uses `letterAudioSources`).

When `letterAudioSources` is null, render nothing (no failed state — there is no clip). Failed state is only for a clip that was offered and then failed to play.

## Call sites

| Place | `audioSlot` |
| --- | --- |
| Review, `kind === 'consonant'` | `lead` |
| Review, `kind === 'vowel' \| 'compound' \| 'build'` | `vowel` |
| Review, `kind === 'batchim' \| 'cluster'` | `final` |
| Review, `block` / `pron` | no button |
| Reference consonants grid | `lead` |
| Reference simple + compound vowel grids | `vowel` |
| Reference batchim table, each representative key | `final` |
| Reference cluster rows, cluster glyph | `final` |
| `Stage.svelte` | `vowel` if glyph is in `VOWELS`, else `lead` if in `LEADS`, else `final` if `batchimSound`, else none. Keep the “only if `items.length <= 2`” spam guard. |
| `MouthStep` / `BuildStep` | `lead` (these steps are consonants) |

Do not add a PlayButton to `/drill`.

## Generator

Extend `app/scripts/generate-consonant-audio.py` (rename to `generate-letter-audio.py` if the plan prefers one script). Responsibilities:

1. Leave existing consonant `.opus` files in place unless the lead synthesizer changes. Add `.mp3` siblings for those 19 via ffmpeg from the current opus (or from a fresh wav of the same `render()`).
2. Synthesize 21 vowel clips (`ㅇ+V` formants; merged sets share parameter blocks).
3. Synthesize 7 final clips (`아` + unreleased 대표음).
4. Write `static/audio/{consonants,vowels,finals}/{slug}.opus` and `.mp3`.
5. LICENSE text at `static/audio/LICENSE.txt` covering all three folders (CC0, original synthesis, generator path). Keep `consonants/LICENSE.txt` as a pointer to the parent file or update it in place so it does not claim “19 files only.”

ffmpeg with libopus and mp3 (libmp3lame or similar) is required at generate time, not at app runtime.

## Out of scope

- Word / sound-change / sprint-block audio.
- Predict-then-hear withhold.
- Mic, shadowing, dictation.
- Replacing Review’s typed RR.
- Accounts, sync, PWA service worker.
- Regenerating a “more native” voice pack.

## Testing

- `letterAudioSources`: every `LEADS`×lead, every `VOWELS`×vowel, every `REPRESENTATIVE` and every cluster×final; null cases; shared slug for neutralized finals; `consonantAudioSrc` still matches `/audio/consonants/{slug}.opus`.
- Glob (or `existsSync`) that every mapped opus **and** mp3 file is on disk.
- `PlayButton`: vowel `ㅏ` with `audioSlot="vowel"` renders a control; `audioSlot="lead"` for `ㅏ` renders none; explicit `src={null}` still renders none.
- Clip component: two `<source>` tags; failed state keeps a button (jsdom: dispatch `error` on `audio`).
- Review page source: PlayButton for non-block, non-pron cards uses `audioSlot` from kind; block/pron have no PlayButton.
- Reference: PlayButton in vowel and batchim sections.
- Stage: uses `audioSlot` (or equivalent) rather than `isConsonantLead` alone.
- Polish: play control still 44px; failed styles exist.

## Error handling

- Missing mapping: no control.
- Decode/play error: visible couldn’t-play control.
- Hydration: same as today; audio is static files, no extra ready-gate.
