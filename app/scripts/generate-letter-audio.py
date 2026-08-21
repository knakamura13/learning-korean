"""Synthesize vowel and final letter clips, plus mp3 siblings for every clip.

Original pedagogical synthesis — not a recording of a person, not runtime TTS,
and not scraped from any course. Lead `.opus` files are left untouched; this
script only adds `.mp3` next to them.

Re-run from app/:

    python3 scripts/generate-letter-audio.py
"""

from __future__ import annotations

import importlib.util
import shutil
import subprocess
import sys
import tempfile
from collections import defaultdict
from pathlib import Path

SR = 22050

# Task 1 slugs (must stay in lockstep with app/src/lib/audio/letters.ts).
LEAD_SLUGS = [
    "g",
    "kk",
    "n",
    "d",
    "tt",
    "r",
    "m",
    "b",
    "pp",
    "s",
    "ss",
    "silent",
    "j",
    "jj",
    "ch",
    "k",
    "t",
    "p",
    "h",
]

# Steady-state formants (F1, F2, F3). Merged sets share one tuple.
F_A = (750, 1200, 2500)  # ㅏ
F_EO = (580, 950, 2500)  # ㅓ
F_O = (450, 800, 2600)  # ㅗ
F_U = (350, 750, 2400)  # ㅜ
F_EU = (350, 1350, 2400)  # ㅡ — same numbers as generate-consonant-audio._eu_vowel
F_I = (280, 2300, 3000)  # ㅣ
F_AE = (500, 1900, 2650)  # ㅐ = ㅔ; ㅒ = ㅖ; ㅙ = ㅚ = ㅞ

# kind: steady | y-glide | w-glide | ㅡ→ㅣ diphthong. Merged jamo share `key`.
VOWEL_CLIPS: list[tuple[str, str, str]] = [
    ("ㅏ", "a", "a"),
    ("ㅐ", "ae", "ae"),
    ("ㅑ", "ya", "ya"),
    ("ㅒ", "yae", "yae"),
    ("ㅓ", "eo", "eo"),
    ("ㅔ", "e", "ae"),  # same synthesis as ㅐ
    ("ㅕ", "yeo", "yeo"),
    ("ㅖ", "ye", "yae"),  # same synthesis as ㅒ
    ("ㅗ", "o", "o"),
    ("ㅘ", "wa", "wa"),
    ("ㅙ", "wae", "wae"),
    ("ㅚ", "oe", "wae"),  # same synthesis as ㅙ
    ("ㅛ", "yo", "yo"),
    ("ㅜ", "u", "u"),
    ("ㅝ", "wo", "wo"),
    ("ㅞ", "we", "wae"),  # same synthesis as ㅙ
    ("ㅟ", "wi", "wi"),
    ("ㅠ", "yu", "yu"),
    ("ㅡ", "eu", "eu"),
    ("ㅢ", "ui", "ui"),
    ("ㅣ", "i", "i"),
]

FINAL_CLIPS: list[tuple[str, str]] = [
    ("ㄱ", "k"),
    ("ㄴ", "n"),
    ("ㄷ", "t"),
    ("ㄹ", "l"),
    ("ㅁ", "m"),
    ("ㅂ", "p"),
    ("ㅇ", "ng"),
]


def _load_consonant_mod():
    path = Path(__file__).resolve().parent / "generate-consonant-audio.py"
    spec = importlib.util.spec_from_file_location("generate_consonant_audio", path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"cannot load {path}")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    if mod.SR != SR:
        raise RuntimeError(f"SR mismatch: letter={SR} consonant={mod.SR}")
    return mod


C = _load_consonant_mod()


def require_ffmpeg() -> None:
    if shutil.which("ffmpeg"):
        return
    try:
        subprocess.run(["sudo", "apt-get", "install", "-y", "ffmpeg"], check=True)
    except (OSError, subprocess.CalledProcessError) as exc:
        raise SystemExit(
            "BLOCKED: ffmpeg is required (libopus + libmp3lame) and could not be installed: "
            f"{exc}"
        ) from exc
    if not shutil.which("ffmpeg"):
        raise SystemExit(
            "BLOCKED: ffmpeg is required (libopus + libmp3lame) but was not found after apt-get."
        )


def _ffmpeg(args: list[str]) -> None:
    result = subprocess.run(args, capture_output=True)
    if result.returncode != 0:
        err = result.stderr.decode("utf-8", "replace")
        raise RuntimeError(f"ffmpeg failed ({' '.join(args)}):\n{err}")


def encode_mp3(src: Path, mp3: Path) -> None:
    mp3.parent.mkdir(parents=True, exist_ok=True)
    _ffmpeg(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(src),
            "-c:a",
            "libmp3lame",
            "-b:a",
            "48k",
            "-ac",
            "1",
            str(mp3),
        ]
    )


def encode_pair(wav: Path, opus: Path, mp3: Path) -> None:
    C.encode_opus(wav, opus)
    encode_mp3(wav, mp3)


def _formant_buzz(n: int, amp: float, f0: float, f1: float, f2: float, f3: float) -> list[float]:
    buzz = [0.0] * n
    for h in range(1, 12):
        fall = 1 / (h**1.15)
        buzz = C._add(buzz, C._hz(n, f0 * h, amp * 0.22 * fall))
    return C._add(
        C._lowpass(buzz, f1 * 1.4),
        C._mul(C._lowpass(C._highpass(buzz, f1 * 0.6), f2 * 1.3), 0.55),
        C._mul(C._lowpass(C._highpass(buzz, f2 * 0.8), f3 * 1.2), 0.22),
    )


def _steady(sec: float, amp: float, f0: float, formants: tuple[float, float, float]) -> list[float]:
    n = int(sec * SR)
    return C._mul(_formant_buzz(n, amp, f0, *formants), C._env(n, 0.02, 0.08))


def _glide(
    sec: float,
    amp: float,
    f0: float,
    start: tuple[float, float, float],
    end: tuple[float, float, float],
    glide_frac: float,
) -> list[float]:
    n = int(sec * SR)
    a = _formant_buzz(n, amp, f0, *start)
    b = _formant_buzz(n, amp, f0, *end)
    g = max(1, int(n * glide_frac))
    mixed: list[float] = []
    for i in range(n):
        t = 1.0 if i >= g else (i / g) ** 0.7
        mixed.append(a[i] * (1.0 - t) + b[i] * t)
    return C._mul(mixed, C._env(n, 0.02, 0.08))


def render_vowel(key: str) -> list[float]:
    """ㅇ + V. Isolation f0 matches the silent-ㅇ lead clip."""
    amp, f0, sec = 0.16, 132.0, 0.42
    if key == "a":
        return _steady(sec, amp, f0, F_A)
    if key == "ae":
        return _steady(sec, amp, f0, F_AE)
    if key == "eo":
        return _steady(sec, amp, f0, F_EO)
    if key == "o":
        return _steady(sec, amp, f0, F_O)
    if key == "u":
        return _steady(sec, amp, f0, F_U)
    if key == "eu":
        return _steady(sec, amp, f0, F_EU)
    if key == "i":
        return _steady(sec, amp, f0, F_I)
    if key == "ya":
        return _glide(0.46, amp, f0, F_I, F_A, 0.32)
    if key == "yae":
        return _glide(0.46, amp, f0, F_I, F_AE, 0.32)
    if key == "yeo":
        return _glide(0.46, amp, f0, F_I, F_EO, 0.32)
    if key == "yo":
        return _glide(0.46, amp, f0, F_I, F_O, 0.32)
    if key == "yu":
        return _glide(0.46, amp, f0, F_I, F_U, 0.32)
    if key == "wa":
        return _glide(0.46, amp, f0, F_U, F_A, 0.32)
    if key == "wae":
        return _glide(0.46, amp, f0, F_U, F_AE, 0.32)
    if key == "wo":
        return _glide(0.46, amp, f0, F_U, F_EO, 0.32)
    if key == "wi":
        return _glide(0.46, amp, f0, F_U, F_I, 0.32)
    if key == "ui":
        return _glide(0.48, amp, f0, F_EU, F_I, 0.55)
    raise KeyError(f"unknown vowel key {key!r}")


def render_final(jamo: str) -> list[float]:
    """Short 아 + unreleased 대표음. Peak-normalized by the caller."""
    vowel = _steady(0.18, 0.18, 138.0, F_A)
    if jamo in {"ㄱ", "ㄷ", "ㅂ"}:
        # Unreleased stop: very short muffled place cue, then closure.
        if jamo == "ㄱ":
            stop = C._burst(0.012, 0.10, 1200, 3500, 71)
        elif jamo == "ㄷ":
            stop = C._burst(0.010, 0.09, 1800, 4500, 72)
        else:
            stop = C._burst(0.010, 0.09, 400, 1800, 73)
        coda = C._add(stop, C._silence(0.08))
    elif jamo == "ㄴ":
        coda = C._nasal(0.16, 0.2, 270, 1700, 138)
    elif jamo == "ㅁ":
        coda = C._nasal(0.16, 0.2, 250, 1100, 138)
    elif jamo == "ㅇ":
        coda = C._nasal(0.16, 0.2, 220, 800, 138)
    elif jamo == "ㄹ":
        n = int(0.16 * SR)
        lat = C._add(C._hz(n, 400, 0.16), C._hz(n, 1200, 0.08), C._hz(n, 2500, 0.04))
        coda = C._mul(lat, C._env(n, 0.01, 0.05))
    else:
        raise KeyError(f"unknown final {jamo!r}")
    # Concatenate: short 아, then unreleased coda. Do not mix from t=0 with C._add.
    return vowel + coda


def _rms(xs: list[float]) -> float:
    if not xs:
        return 0.0
    return (sum(v * v for v in xs) / len(xs)) ** 0.5


def check_render_final() -> None:
    """Batchim clips must be 아 then coda (concat), not mix-from-t=0."""
    vowel_only = _steady(0.18, 0.18, 138.0, F_A)
    samples = render_final("ㄱ")
    if len(samples) <= len(vowel_only):
        raise AssertionError(
            f"render_final('ㄱ') must be longer than 아-only "
            f"({len(samples)} <= {len(vowel_only)})"
        )
    n = int(0.12 * SR)
    head = samples[:n]
    voice = _rms(head)
    if voice < 0.02:
        raise AssertionError(f"first 0.12s should be voiced 아, rms={voice}")
    delta = _rms([a - b for a, b in zip(head, vowel_only[:n])])
    if delta > 1e-9:
        raise AssertionError(
            f"first 0.12s must match 아-only before the stop, rms-delta={delta}"
        )


def _write_clips(tmp: Path, out_dir: Path, slug: str, samples: list[float]) -> None:
    wav = tmp / f"{slug}.wav"
    C.write_wav(wav, C._peak_norm(samples))
    encode_pair(wav, out_dir / f"{slug}.opus", out_dir / f"{slug}.mp3")


def write_finals(tmp: Path, finals: Path) -> None:
    check_render_final()
    for jamo, slug in FINAL_CLIPS:
        _write_clips(tmp, finals, slug, render_final(jamo))
        print(f"wrote finals/{slug}.opus + .mp3 ({jamo})")


def convert_lead_mp3(consonants: Path) -> None:
    for slug in LEAD_SLUGS:
        opus = consonants / f"{slug}.opus"
        if not opus.is_file():
            raise FileNotFoundError(f"missing lead opus (will not regenerate): {opus}")
        mp3 = consonants / f"{slug}.mp3"
        encode_mp3(opus, mp3)
        print(f"wrote consonants/{slug}.mp3 (from existing opus)")


def main() -> None:
    require_ffmpeg()
    audio_root = Path(__file__).resolve().parents[1] / "static" / "audio"
    consonants = audio_root / "consonants"
    vowels = audio_root / "vowels"
    finals = audio_root / "finals"
    vowels.mkdir(parents=True, exist_ok=True)
    finals.mkdir(parents=True, exist_ok=True)

    convert_lead_mp3(consonants)

    grouped: dict[str, list[tuple[str, str]]] = defaultdict(list)
    for jamo, slug, key in VOWEL_CLIPS:
        grouped[key].append((jamo, slug))

    with tempfile.TemporaryDirectory() as tmp_dir:
        tmp = Path(tmp_dir)
        for key, items in grouped.items():
            samples = render_vowel(key)
            for jamo, slug in items:
                _write_clips(tmp, vowels, slug, samples)
                print(f"wrote vowels/{slug}.opus + .mp3 ({jamo})")
        write_finals(tmp, finals)


def generate_finals_only() -> None:
    require_ffmpeg()
    finals = Path(__file__).resolve().parents[1] / "static" / "audio" / "finals"
    finals.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp_dir:
        write_finals(Path(tmp_dir), finals)


if __name__ == "__main__":
    if "--check" in sys.argv:
        check_render_final()
        print("check_render_final: ok")
    elif "--finals-only" in sys.argv:
        generate_finals_only()
    else:
        main()
