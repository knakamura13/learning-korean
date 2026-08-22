# Letter-recording runbook (for Sally)

One sitting, 47 short clips, maybe 20 minutes. These become the play buttons
next to every Korean letter in the app — the old machine-generated clips were
removed because they were meaningless noise, so yours will be the only audio.

## Setup

- **Quiet room.** No fan, no music, window closed. A closet full of clothes is
  a great recording booth.
- **Any decent mic.** A phone's voice-memo app (record in a "lossless" or
  "high quality" setting if offered) or a USB mic both work. Hold the mic a
  hand's width from your mouth, slightly off to the side to avoid pops.
- **File format doesn't matter.** wav, m4a, mp3, flac — the ingest script
  accepts all of them.
- Say each item **clearly and naturally**, about one second long, with a short
  pause of silence before and after (the script trims the silence).

## What to say

Each slot is one syllable:

- **Leads (1–19):** the consonant with ㅡ after it — e.g. ㄱ is spoken **그**.
- **Vowels (20–40):** the vowel with silent ㅇ in front — e.g. ㅏ is spoken **아**.
- **Finals (41–47):** 어 with the final consonant. For the three stop finals
  (억, 얻, 업), **stop on the consonant without releasing it** — no puff at
  the end. The others (언, 얼, 엄, 엉) have no release to hold back; just say
  them naturally.

Two quirks, both fine: slot 12 (ㅇ as a lead) sounds identical to slot 38
(the bare vowel ㅡ) because ㅇ is silent at the start of a syllable — record
both anyway, they live at different URLs. And 애/에 sounding identical to you
is expected — modern Korean merged them — and the same goes for 얘/예 and
왜/외/웨; just say each one naturally.

## How to capture

Pick whichever is easier:

1. **One continuous take (easiest on a phone).** Record everything in one go,
   saying the slot number before each syllable ("one — 그 … two — 끄 …").
   Kyle will split the take into per-slot files afterward (any audio editor
   works) and then ingest those — the script itself only accepts per-slot
   files. No renaming for you at all.
2. **One file per slot.** Record each syllable as its own file and name it by
   the file name in the table below (the extension can be whatever your
   recorder produces: `g.wav`, `g.m4a`, ...). Fair warning: that is 47 renames
   on a phone. For the five names that appear twice (k, n, m, t, p exist as
   both a lead and a final), either put the files in subfolders named
   `consonants/`, `vowels/`, `finals/`, or prefix the name: `finals-k.m4a`
   vs `consonants-k.m4a`.

**When you're done:** get the folder (or the one long take) to Kyle however is
easiest — AirDrop, shared drive, or a message. He runs the ingest script; you
never touch it.

Redoing a slot later is painless: re-record just that file and ingest again;
the new clip overwrites the old one.

## The 47 prompts

Generated with `node scripts/ingest-recordings.mjs --prompts` (run from
`app/`) — regenerate instead of hand-editing if the app's letter maps ever
change.

| # | Slot | Letter | Say | File name |
| --- | --- | --- | --- | --- |
| 1 | lead | ㄱ | 그 | `consonants/g.wav` |
| 2 | lead | ㄲ | 끄 | `consonants/kk.wav` |
| 3 | lead | ㄴ | 느 | `consonants/n.wav` |
| 4 | lead | ㄷ | 드 | `consonants/d.wav` |
| 5 | lead | ㄸ | 뜨 | `consonants/tt.wav` |
| 6 | lead | ㄹ | 르 | `consonants/r.wav` |
| 7 | lead | ㅁ | 므 | `consonants/m.wav` |
| 8 | lead | ㅂ | 브 | `consonants/b.wav` |
| 9 | lead | ㅃ | 쁘 | `consonants/pp.wav` |
| 10 | lead | ㅅ | 스 | `consonants/s.wav` |
| 11 | lead | ㅆ | 쓰 | `consonants/ss.wav` |
| 12 | lead | ㅇ | 으 | `consonants/silent.wav` |
| 13 | lead | ㅈ | 즈 | `consonants/j.wav` |
| 14 | lead | ㅉ | 쯔 | `consonants/jj.wav` |
| 15 | lead | ㅊ | 츠 | `consonants/ch.wav` |
| 16 | lead | ㅋ | 크 | `consonants/k.wav` |
| 17 | lead | ㅌ | 트 | `consonants/t.wav` |
| 18 | lead | ㅍ | 프 | `consonants/p.wav` |
| 19 | lead | ㅎ | 흐 | `consonants/h.wav` |
| 20 | vowel | ㅏ | 아 | `vowels/a.wav` |
| 21 | vowel | ㅐ | 애 | `vowels/ae.wav` |
| 22 | vowel | ㅑ | 야 | `vowels/ya.wav` |
| 23 | vowel | ㅒ | 얘 | `vowels/yae.wav` |
| 24 | vowel | ㅓ | 어 | `vowels/eo.wav` |
| 25 | vowel | ㅔ | 에 | `vowels/e.wav` |
| 26 | vowel | ㅕ | 여 | `vowels/yeo.wav` |
| 27 | vowel | ㅖ | 예 | `vowels/ye.wav` |
| 28 | vowel | ㅗ | 오 | `vowels/o.wav` |
| 29 | vowel | ㅘ | 와 | `vowels/wa.wav` |
| 30 | vowel | ㅙ | 왜 | `vowels/wae.wav` |
| 31 | vowel | ㅚ | 외 | `vowels/oe.wav` |
| 32 | vowel | ㅛ | 요 | `vowels/yo.wav` |
| 33 | vowel | ㅜ | 우 | `vowels/u.wav` |
| 34 | vowel | ㅝ | 워 | `vowels/wo.wav` |
| 35 | vowel | ㅞ | 웨 | `vowels/we.wav` |
| 36 | vowel | ㅟ | 위 | `vowels/wi.wav` |
| 37 | vowel | ㅠ | 유 | `vowels/yu.wav` |
| 38 | vowel | ㅡ | 으 | `vowels/eu.wav` |
| 39 | vowel | ㅢ | 의 | `vowels/ui.wav` |
| 40 | vowel | ㅣ | 이 | `vowels/i.wav` |
| 41 | final | ㄱ | 억 | `finals/k.wav` |
| 42 | final | ㄴ | 언 | `finals/n.wav` |
| 43 | final | ㄷ | 얻 | `finals/t.wav` |
| 44 | final | ㄹ | 얼 | `finals/l.wav` |
| 45 | final | ㅁ | 엄 | `finals/m.wav` |
| 46 | final | ㅂ | 업 | `finals/p.wav` |
| 47 | final | ㅇ | 엉 | `finals/ng.wav` |

## Ingesting the takes (Kyle's half)

Requires ffmpeg on PATH (`brew install ffmpeg`). From `app/`:

```sh
node scripts/ingest-recordings.mjs ~/path/to/raw-takes
```

For every take the script trims leading/trailing silence, loudness-normalizes,
and writes `<slug>.opus` + `<slug>.mp3` into `app/static/audio/<dir>/`. It
validates every file name against the slug maps in
`app/src/lib/audio/letters.ts` (unknown or ambiguous names abort the run
before anything is written) and finishes by regenerating
`app/src/lib/audio/recorded.ts` — the availability set `letterAudioSources`
checks. The moment a slot lands in that set, its play button appears in the
app; slots not yet recorded simply show no button, so partial sessions ship
cleanly.

`--sync` rebuilds `recorded.ts` from whatever clips are on disk without
touching audio (useful after deleting a bad clip); `--prompts` reprints the
table above. Afterward run `pnpm test` from `app/` — the audio tests assert
that `recorded.ts` and the files on disk mirror each other exactly — then spot
check the clips on `/reference`.
