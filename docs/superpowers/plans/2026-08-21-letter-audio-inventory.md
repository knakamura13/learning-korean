# Letter-audio inventory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship playback models for every letter/final the deck quizzes, with opus+mp3 and a visible play-failure state, using the existing play control.

**Architecture:** A pure lookup module `letters.ts` maps `(jamo, AudioSlot)` to static `{ opus, mp3 }` paths. `PlayButton` always passes `audioSlot`. The clip component plays opus then mp3 and keeps a disabled 44px control on error. Clips are original pedagogical synthesis from an extended generator, not runtime TTS.

**Tech Stack:** SvelteKit 2 + Svelte 5, TypeScript, Vitest, existing `hangul.ts`, Python 3 + ffmpeg (libopus + mp3) for generation only.

**Spec:** `docs/superpowers/specs/2026-08-21-letter-audio-inventory-design.md`

## File structure

- Create: `app/src/lib/audio/letters.ts` — slot lookup
- Create: `app/src/lib/audio/letters.test.ts`
- Modify: `app/src/lib/audio/consonants.ts` — re-export `consonantAudioSrc` from letters
- Modify: `app/src/lib/audio/consonants.test.ts` — keep lead-path contracts; drop “ㅏ is always null” as a global claim if it conflicts (lead slot for ㅏ stays null)
- Create: `app/scripts/generate-letter-audio.py` — vowels, finals, mp3 siblings
- Modify: `app/scripts/generate-consonant-audio.py` — thin wrapper that calls the new script’s lead+mp3 path, or delete after the new script covers leads’ mp3 without rewriting opus
- Create: `app/static/audio/vowels/*.{opus,mp3}`
- Create: `app/static/audio/finals/*.{opus,mp3}`
- Create: `app/static/audio/consonants/*.mp3` (19)
- Modify: `app/static/audio/consonants/LICENSE.txt` and add `app/static/audio/LICENSE.txt`
- Rename or evolve: `app/src/lib/components/ConsonantClip.svelte` → `AudioClip.svelte`
- Modify: `PlayButton.svelte`, `PlayButton.test.ts`, `Stage.svelte`, `MouthStep.svelte`, `BuildStep.svelte`, `review/+page.svelte`, `reference/+page.svelte`
- Modify: `app/src/lib/polish.test.ts`
- Modify: `RESOURCES.md` Gaps (audio line)

## Global Constraints

- No mic, no speech scoring, no runtime TTS, no scraped course audio.
- No word / sprint / pron clips.
- `audioSlot` is required on `PlayButton`: `'lead' | 'vowel' | 'final'`.
- Finals that share `batchimSound` share one clip slug.
- Existing `/audio/consonants/{slug}.opus` URLs stay valid.
- Failed playback keeps a 44px disabled control; missing mapping renders nothing.
- Two `<source>` tags: opus then mp3.
- Phone and desktop share the same control.
- Do not add PlayButton to `/drill`.
- TDD: failing test first, watch it fail, then implement.
- Work from repo root. App tests: `cd app && pnpm test <path>`.
- Commit per task. Do not change files outside the task Files list.
- Use Grok 4.6 for every subagent.

---

### Task 1: Letter audio lookup

**Files:**
- Create: `app/src/lib/audio/letters.ts`
- Create: `app/src/lib/audio/letters.test.ts`
- Modify: `app/src/lib/audio/consonants.ts`
- Modify: `app/src/lib/audio/consonants.test.ts` only if needed so `consonantAudioSrc('ㅏ')` remains null

**Interfaces:**
- Consumes: `LEADS`, `VOWELS`, `batchimSound`, `REPRESENTATIVE`, `CLUSTERS`, `assets` from `$app/paths`
- Produces:
  - `export type AudioSlot = 'lead' | 'vowel' | 'final'`
  - `export interface LetterSources { opus: string; mp3: string }`
  - `export function letterAudioSources(jamo: string, slot: AudioSlot): LetterSources | null`
  - `export const LEAD_AUDIO_SLUG`, `VOWEL_AUDIO_SLUG`, `FINAL_AUDIO_SLUG` as specified in the spec
  - `consonantAudioSrc` still exported from `consonants.ts`

- [ ] **Step 1: Write the failing tests**

Create `app/src/lib/audio/letters.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { CLUSTERS, LEADS, REPRESENTATIVE, VOWELS, batchimSound } from '$lib/domain/hangul';
import {
	FINAL_AUDIO_SLUG,
	LEAD_AUDIO_SLUG,
	VOWEL_AUDIO_SLUG,
	letterAudioSources,
	type AudioSlot
} from './letters';
import { consonantAudioSrc } from './consonants';

describe('letterAudioSources', () => {
	it('maps every lead in the lead slot to consonants/{slug}.opus and .mp3', () => {
		expect(LEADS).toHaveLength(19);
		for (const jamo of LEADS) {
			const src = letterAudioSources(jamo, 'lead');
			expect(src, jamo).not.toBeNull();
			expect(src!.opus).toMatch(
				new RegExp(`/audio/consonants/${LEAD_AUDIO_SLUG[jamo]}\\.opus$`)
			);
			expect(src!.mp3).toMatch(
				new RegExp(`/audio/consonants/${LEAD_AUDIO_SLUG[jamo]}\\.mp3$`)
			);
		}
	});

	it('maps every vowel in the vowel slot', () => {
		expect(VOWELS).toHaveLength(21);
		for (const jamo of VOWELS) {
			const src = letterAudioSources(jamo, 'vowel');
			expect(src, jamo).not.toBeNull();
			expect(src!.opus).toMatch(
				new RegExp(`/audio/vowels/${VOWEL_AUDIO_SLUG[jamo]}\\.opus$`)
			);
		}
	});

	it('shares one final clip per batchimSound representative', () => {
		for (const r of REPRESENTATIVE) {
			const src = letterAudioSources(r, 'final');
			expect(src, r).not.toBeNull();
			expect(src!.opus).toMatch(
				new RegExp(`/audio/finals/${FINAL_AUDIO_SLUG[r]}\\.opus$`)
			);
		}
		expect(letterAudioSources('ㄲ', 'final')?.opus).toBe(letterAudioSources('ㄱ', 'final')?.opus);
		expect(letterAudioSources('ㅅ', 'final')?.opus).toBe(letterAudioSources('ㄷ', 'final')?.opus);
		for (const c of CLUSTERS) {
			const rep = batchimSound(c);
			expect(letterAudioSources(c, 'final')?.opus).toBe(letterAudioSources(rep, 'final')?.opus);
		}
	});

	it('returns null when the slot does not match the glyph', () => {
		expect(letterAudioSources('ㅏ', 'lead')).toBeNull();
		expect(letterAudioSources('ㄱ', 'vowel')).toBeNull();
		expect(letterAudioSources('ㅏ', 'final')).toBeNull();
		expect(letterAudioSources('', 'lead')).toBeNull();
		expect(letterAudioSources('가', 'lead')).toBeNull();
	});

	it('keeps consonantAudioSrc as the lead opus path', () => {
		expect(consonantAudioSrc('ㄱ')).toMatch(/\/audio\/consonants\/g\.opus$/);
		expect(consonantAudioSrc('ㅏ')).toBeNull();
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /workspace/app && pnpm test src/lib/audio/letters.test.ts`

Expected: FAIL — cannot find module `./letters`

- [ ] **Step 3: Write letters.ts and wire consonants.ts**

`app/src/lib/audio/letters.ts`:

```ts
import { assets } from '$app/paths';
import {
	CLUSTERS,
	LEADS,
	REPRESENTATIVE,
	VOWELS,
	batchimSound,
	type Lead,
	type Representative,
	type Vowel
} from '$lib/domain/hangul';

export type AudioSlot = 'lead' | 'vowel' | 'final';

export interface LetterSources {
	opus: string;
	mp3: string;
}

export const LEAD_AUDIO_SLUG: Record<Lead, string> = {
	ㄱ: 'g', ㄲ: 'kk', ㄴ: 'n', ㄷ: 'd', ㄸ: 'tt', ㄹ: 'r', ㅁ: 'm',
	ㅂ: 'b', ㅃ: 'pp', ㅅ: 's', ㅆ: 'ss', ㅇ: 'silent', ㅈ: 'j', ㅉ: 'jj',
	ㅊ: 'ch', ㅋ: 'k', ㅌ: 't', ㅍ: 'p', ㅎ: 'h'
};

export const VOWEL_AUDIO_SLUG: Record<Vowel, string> = {
	ㅏ: 'a', ㅐ: 'ae', ㅑ: 'ya', ㅒ: 'yae', ㅓ: 'eo', ㅔ: 'e', ㅕ: 'yeo',
	ㅖ: 'ye', ㅗ: 'o', ㅘ: 'wa', ㅙ: 'wae', ㅚ: 'oe', ㅛ: 'yo', ㅜ: 'u',
	ㅝ: 'wo', ㅞ: 'we', ㅟ: 'wi', ㅠ: 'yu', ㅡ: 'eu', ㅢ: 'ui', ㅣ: 'i'
};

export const FINAL_AUDIO_SLUG: Record<Representative, string> = {
	ㄱ: 'k', ㄴ: 'n', ㄷ: 't', ㄹ: 'l', ㅁ: 'm', ㅂ: 'p', ㅇ: 'ng'
};

function pair(dir: string, slug: string): LetterSources {
	return {
		opus: `${assets}/audio/${dir}/${slug}.opus`,
		mp3: `${assets}/audio/${dir}/${slug}.mp3`
	};
}

export function letterAudioSources(jamo: string, slot: AudioSlot): LetterSources | null {
	switch (slot) {
		case 'lead': {
			if (!(LEADS as readonly string[]).includes(jamo)) return null;
			return pair('consonants', LEAD_AUDIO_SLUG[jamo as Lead]);
		}
		case 'vowel': {
			if (!(VOWELS as readonly string[]).includes(jamo)) return null;
			return pair('vowels', VOWEL_AUDIO_SLUG[jamo as Vowel]);
		}
		case 'final': {
			const rep = batchimSound(jamo);
			if (!rep) return null;
			if (!(REPRESENTATIVE as readonly string[]).includes(rep)) return null;
			return pair('finals', FINAL_AUDIO_SLUG[rep]);
		}
		default: {
			const _never: never = slot;
			return _never;
		}
	}
}
```

`consonants.ts` becomes:

```ts
import { letterAudioSources } from './letters';
import { LEADS, type Lead } from '$lib/domain/hangul';

export { LEAD_AUDIO_SLUG as CONSONANT_AUDIO_SLUG } from './letters';

export function isConsonantLead(jamo: string): jamo is Lead {
	return (LEADS as readonly string[]).includes(jamo);
}

export function consonantAudioSrc(jamo: string): string | null {
	return letterAudioSources(jamo, 'lead')?.opus ?? null;
}
```

Keep `consonants.test.ts` passing: `CONSONANT_AUDIO_SLUG` still exists as the alias; `consonantAudioSrc('ㅏ')` is still null.

- [ ] **Step 4: Run tests**

Run: `cd /workspace/app && pnpm test src/lib/audio/letters.test.ts src/lib/audio/consonants.test.ts`

Expected: PASS. File-existence globs for new mp3/vowel/final files are Task 2.

- [ ] **Step 5: Commit**

```bash
git add app/src/lib/audio/letters.ts app/src/lib/audio/letters.test.ts app/src/lib/audio/consonants.ts app/src/lib/audio/consonants.test.ts
git commit -m "feat: map letter audio by slot to opus and mp3 paths"
```

---

### Task 2: Generate vowel, final, and mp3 assets

**Files:**
- Create: `app/scripts/generate-letter-audio.py`
- Create: files under `app/static/audio/vowels/`, `app/static/audio/finals/`, and `app/static/audio/consonants/*.mp3`
- Create: `app/static/audio/LICENSE.txt`
- Modify: `app/static/audio/consonants/LICENSE.txt`
- Modify: `app/src/lib/audio/letters.test.ts` — add disk-existence tests
- Modify: `app/scripts/generate-consonant-audio.py` — print a pointer to the new script; do not delete the old synthesizer if Task 2 imports it. Prefer: new script imports `render` / helpers from a shared module **or** copies the lead `render` by importing if you extract functions. Simplest allowed approach: new script contains vowel+final renderers and ffmpeg-encodes mp3 from existing consonant opus without regenerating those opus files.

**Interfaces:**
- Consumes: Task 1 slugs
- Produces: on-disk opus+mp3 for 19 leads (mp3 new), 21 vowels, 7 finals

- [ ] **Step 1: Write failing disk tests**

Append to `letters.test.ts`:

```ts
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const audioRoot = join(dirname(fileURLToPath(import.meta.url)), '../../../static/audio');

it('ships opus and mp3 for every mapped slug', () => {
	const need: string[] = [];
	for (const slug of Object.values(LEAD_AUDIO_SLUG)) {
		need.push(`consonants/${slug}.opus`, `consonants/${slug}.mp3`);
	}
	for (const slug of Object.values(VOWEL_AUDIO_SLUG)) {
		need.push(`vowels/${slug}.opus`, `vowels/${slug}.mp3`);
	}
	for (const slug of Object.values(FINAL_AUDIO_SLUG)) {
		need.push(`finals/${slug}.opus`, `finals/${slug}.mp3`);
	}
	for (const rel of need) {
		expect(existsSync(join(audioRoot, rel)), rel).toBe(true);
	}
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /workspace/app && pnpm test src/lib/audio/letters.test.ts`

Expected: FAIL on missing mp3/vowel/final files.

- [ ] **Step 3: Implement generator and run it**

Write `app/scripts/generate-letter-audio.py`. Requirements:

- `SR = 22050`
- Vowels: voiced formant buzz like `_eu_vowel` but with per-vowel F1/F2/F3. Merged sets share numbers:
  - ㅐ and ㅔ same
  - ㅒ and ㅖ same
  - ㅙ, ㅚ, ㅞ same
- Finals: short 아 (F1/F2 for ㅏ) then unreleased coda: ㄱ/ㄷ/ㅂ very short stop; ㄴ/ㅁ/ㅇ nasal tail; ㄹ lateral. Peak-normalize.
- Encode with ffmpeg: opus `libopus` 24k voip; mp3 `libmp3lame` 48k mono.
- For leads: **do not overwrite** existing `.opus`. `ffmpeg -y -i consonants/g.opus consonants/g.mp3` (etc.) for all 19 slugs.
- `ffmpeg` must exist; if missing, install via `sudo apt-get install -y ffmpeg` only if the environment allows, otherwise fail with a clear error.

LICENSE.txt at `app/static/audio/LICENSE.txt`: CC0 original pedagogical synthesis, generator `app/scripts/generate-letter-audio.py`. Update `consonants/LICENSE.txt` to say leads plus mp3 siblings, and point at the parent LICENSE.

Run: `cd /workspace/app && python3 scripts/generate-letter-audio.py`

- [ ] **Step 4: Re-run tests**

Run: `cd /workspace/app && pnpm test src/lib/audio/letters.test.ts src/lib/audio/consonants.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/scripts/generate-letter-audio.py app/scripts/generate-consonant-audio.py app/static/audio app/src/lib/audio/letters.test.ts
git commit -m "feat: synthesize vowel and final clips with mp3 fallbacks"
```

Binary audio files must be committed.

---

### Task 3: PlayButton slot, dual sources, visible failure

**Files:**
- Create: `app/src/lib/components/AudioClip.svelte` (move from ConsonantClip)
- Delete: `app/src/lib/components/ConsonantClip.svelte` after the new file works
- Modify: `app/src/lib/components/PlayButton.svelte`
- Modify: `app/src/lib/components/PlayButton.test.ts`
- Create: `app/src/lib/components/AudioClip.test.ts`
- Modify: `app/src/lib/polish.test.ts` — import `AudioClip.svelte?raw` instead of ConsonantClip; assert `.play` 44px and a `[aria-disabled='true']` or `.failed` rule

**Interfaces:**
- Consumes: `letterAudioSources`, `AudioSlot`
- Produces: `<PlayButton jamo audioSlot src?: string | null />`

- [ ] **Step 1: Failing PlayButton / AudioClip tests**

Update `PlayButton.test.ts`:

```ts
/**
 * @vitest-environment jsdom
 */
import { mount, unmount } from 'svelte';
import { describe, expect, it } from 'vitest';
import PlayButton from './PlayButton.svelte';

describe('PlayButton', () => {
	it('does not render a lead control for a vowel glyph', () => {
		const host = document.createElement('div');
		document.body.appendChild(host);
		const app = mount(PlayButton, {
			target: host,
			props: { jamo: 'ㅏ', audioSlot: 'lead' }
		});
		expect(host.querySelector('button')).toBeNull();
		unmount(app);
		host.remove();
	});

	it('renders a control for a vowel in the vowel slot', () => {
		const host = document.createElement('div');
		document.body.appendChild(host);
		const app = mount(PlayButton, {
			target: host,
			props: { jamo: 'ㅏ', audioSlot: 'vowel' }
		});
		expect(host.querySelector('button')).not.toBeNull();
		expect(host.querySelectorAll('source').length).toBe(2);
		unmount(app);
		host.remove();
	});

	it('does not render when an explicit src is missing', () => {
		const host = document.createElement('div');
		document.body.appendChild(host);
		const app = mount(PlayButton, {
			target: host,
			props: { jamo: 'ㄱ', audioSlot: 'lead', src: null }
		});
		expect(host.querySelector('button')).toBeNull();
		unmount(app);
		host.remove();
	});
});
```

`AudioClip.test.ts`: mount with opus+mp3 props, dispatch `error` on the audio element, expect the button to remain with `aria-disabled="true"` and label matching `/Couldn't play/`.

- [ ] **Step 2: Run tests — expect FAIL** (PlayButton missing `audioSlot`)

- [ ] **Step 3: Implement**

`PlayButton.svelte`: required `audioSlot: AudioSlot`. `resolved = letterAudioSources(jamo, audioSlot)`. If `src !== undefined`, treat `src === null` as hide, else pass a single-url override as both opus and mp3 only in that test hook — production ignores string override unless you keep it for tests: if `src` is a string, `{ opus: src, mp3: src }`.

`AudioClip.svelte`: props `{ jamo: string; opus: string; mp3: string }`. Template:

```svelte
<button type="button" class="play" class:failed aria-disabled={failed} ...>
<audio preload="none" {@attach clip} onerror={() => failed = true}>
  <source src={opus} type="audio/opus" />
  <source src={mp3} type="audio/mpeg" />
</audio>
```

When `failed`, do not `{#if !failed}`-destroy the button. Set `failed` class, `aria-label={"Couldn't play " + jamo}`, skip `audio.play()`.

Copy layout/CSS from ConsonantClip, add `.play[aria-disabled='true']` muted styles. Keep 44px.

Delete `ConsonantClip.svelte`. Update polish import.

MouthStep and BuildStep still use PlayButton without `audioSlot` — they will fail typecheck until Task 4. **This task must update MouthStep and BuildStep to `audioSlot="lead"`** because otherwise `pnpm check` is red. Include those two call sites in this task even though full wiring is Task 4.

- [ ] **Step 4: Run** `cd /workspace/app && pnpm test src/lib/components/PlayButton.test.ts src/lib/components/AudioClip.test.ts src/lib/polish.test.ts && pnpm check`

Expected: PASS (or check fails only on remaining Stage/review/reference — if so, pass `audioSlot` there too in this task’s Step 3 as a compile fix, and Task 4 still adds the extra reference/review kind branches). **Prefer: add `audioSlot` at every existing PlayButton call site in this task so check is green, using `lead` as the conservative default where Task 4 will correct review/reference/stage.**

Existing call sites: PlayButton.svelte consumers = Stage, MouthStep, BuildStep, review, reference. Passing `audioSlot="lead"` everywhere this task keeps check green; Task 4 changes the wrong ones.

- [ ] **Step 5: Commit**

```bash
git add app/src/lib/components app/src/lib/polish.test.ts app/src/lib/components/steps/MouthStep.svelte app/src/lib/components/steps/BuildStep.svelte
git commit -m "feat: play letter audio with opus/mp3 and visible failure"
```

If Stage/review/reference were touched only for a required `audioSlot="lead"` default, include them in this commit and let Task 4 change the slots.

---

### Task 4: Wire review, reference, and stage slots

**Files:**
- Modify: `app/src/routes/review/+page.svelte`
- Modify: `app/src/routes/review/reviewAnswerField.test.ts` (or a small `review-page.test.ts` if that is the pattern — follow existing review tests)
- Modify: `app/src/routes/reference/+page.svelte`
- Create or modify a reference page source test if one exists; otherwise add assertions in `polish.test.ts`
- Modify: `app/src/lib/components/Stage.svelte`
- Modify: `RESOURCES.md` (repo root) audio Gaps bullet
- Modify: `app/README.md` only if it mentions “19 clips”

**Interfaces:**
- Consumes: Task 3 `PlayButton` + `audioSlot`
- Produces: correct slot per spec table

Review mapping:

```ts
function reviewAudioSlot(kind: Card['kind']): AudioSlot | null {
	switch (kind) {
		case 'consonant': return 'lead';
		case 'vowel':
		case 'compound':
		case 'build': return 'vowel';
		case 'batchim':
		case 'cluster': return 'final';
		case 'block':
		case 'pron': return null;
		default: {
			const _never: never = kind;
			return _never;
		}
	}
}
```

Put this in the review page (or a 10-line helper next to it). Exhaustive switch required.

Stage: if `VOWELS.includes(glyph)` → vowel; else if `LEADS` → lead; else if `batchimSound(glyph)` → final; else none. Keep `items.length <= 2`.

Reference: PlayButton on consonant cells (`lead`), simple vowel cells (`vowel`), compound vowel cells (`vowel`), each representative key in batchim (`final`), each cluster key (`final`).

- [ ] **Step 1: Failing source tests**

Add to polish or a dedicated test file using `?raw` imports:

- `review` contains `audioSlot={reviewAudioSlot` or `reviewAudioSlot(` and does not wrap PlayButton in `isConsonantLead` only
- `review` does not render PlayButton for block/pron (null slot)
- `reference` contains `audioSlot="vowel"` and `audioSlot="final"`
- `stage` no longer uses `isConsonantLead` as the only audio gate
- `drill` page raw source has no `PlayButton`

- [ ] **Step 2: Run — FAIL**

- [ ] **Step 3: Implement wiring + RESOURCES.md**

RESOURCES.md Gaps: replace “Audio is only the 19 Lab 01 consonant leads” with “Letter inventory ships (leads, vowels, neutralized finals). Word-level / sound-change clips are still missing.”

- [ ] **Step 4: Run** `cd /workspace/app && pnpm test && pnpm check`

Expected: all pass, 0 check errors.

- [ ] **Step 5: Commit**

```bash
git add app/src/routes/review app/src/routes/reference app/src/lib/components/Stage.svelte app/src/lib/polish.test.ts RESOURCES.md app/README.md
git commit -m "feat: attach letter audio to review, reference, and stages"
```

---

## Plan self-review

- Spec coverage: lookup, slots, shared finals, dual codec, visible failure, call sites, generator, tests, out-of-scope words — each has a task.
- No TBD.
- `AudioSlot` / `letterAudioSources` / `audioSlot` names are consistent across tasks.
- Task 3 may add a temporary `audioSlot="lead"` on review/reference/stage so `pnpm check` passes; Task 4 corrects slots. That is allowed.
