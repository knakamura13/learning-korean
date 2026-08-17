"""Synthesize short isolated Hangul lead-consonant clips (C + 으).

Original pedagogical synthesis — not a recording of a person and not scraped
from any course. Re-run from app/:

    python3 scripts/generate-consonant-audio.py
"""

from __future__ import annotations

import math
import struct
import subprocess
import tempfile
import wave
from pathlib import Path

SR = 22050

# Compatibility jamo → romanized stem used by the app mapping.
CLIPS: list[tuple[str, str]] = [
    ("ㄱ", "g"),
    ("ㄲ", "kk"),
    ("ㄴ", "n"),
    ("ㄷ", "d"),
    ("ㄸ", "tt"),
    ("ㄹ", "r"),
    ("ㅁ", "m"),
    ("ㅂ", "b"),
    ("ㅃ", "pp"),
    ("ㅅ", "s"),
    ("ㅆ", "ss"),
    ("ㅇ", "silent"),
    ("ㅈ", "j"),
    ("ㅉ", "jj"),
    ("ㅊ", "ch"),
    ("ㅋ", "k"),
    ("ㅌ", "t"),
    ("ㅍ", "p"),
    ("ㅎ", "h"),
]


def _hz(n: int, freq: float, amp: float, phase: float = 0.0) -> list[float]:
    if freq <= 0:
        return [0.0] * n
    return [amp * math.sin(phase + 2 * math.pi * freq * i / SR) for i in range(n)]


def _noise(n: int, amp: float, seed: int) -> list[float]:
    # Deterministic LCG so re-runs are bit-stable before opus encode.
    x = seed & 0xFFFFFFFF
    out = []
    for _ in range(n):
        x = (1664525 * x + 1013904223) & 0xFFFFFFFF
        out.append(amp * ((x / 0xFFFFFFFF) * 2 - 1))
    return out


def _lowpass(x: list[float], cutoff: float) -> list[float]:
    if not x:
        return x
    rc = 1 / (2 * math.pi * cutoff)
    dt = 1 / SR
    a = dt / (rc + dt)
    y = [0.0] * len(x)
    y[0] = x[0]
    for i in range(1, len(x)):
        y[i] = y[i - 1] + a * (x[i] - y[i - 1])
    return y


def _highpass(x: list[float], cutoff: float) -> list[float]:
    if not x:
        return x
    rc = 1 / (2 * math.pi * cutoff)
    dt = 1 / SR
    a = rc / (rc + dt)
    y = [0.0] * len(x)
    y[0] = x[0]
    for i in range(1, len(x)):
        y[i] = a * (y[i - 1] + x[i] - x[i - 1])
    return y


def _env(n: int, attack: float, release: float) -> list[float]:
    a = max(1, int(attack * SR))
    r = max(1, int(release * SR))
    out = []
    for i in range(n):
        if i < a:
            g = i / a
        elif i > n - r:
            g = max(0.0, (n - i) / r)
        else:
            g = 1.0
        out.append(g)
    return out


def _mul(a: list[float], b: list[float] | float) -> list[float]:
    if isinstance(b, float):
        return [x * b for x in a]
    return [x * y for x, y in zip(a, b)]


def _add(*parts: list[float]) -> list[float]:
    n = max(len(p) for p in parts)
    out = [0.0] * n
    for p in parts:
        for i, v in enumerate(p):
            out[i] += v
    return out


def _silence(sec: float) -> list[float]:
    return [0.0] * max(0, int(sec * SR))


def _eu_vowel(sec: float, amp: float, f0: float, tense: bool) -> list[float]:
    n = int(sec * SR)
    # 으: high back unrounded — F1 low, F2 mid.
    f1, f2, f3 = (350, 1350, 2400) if not tense else (320, 1450, 2500)
    buzz = [0.0] * n
    for h in range(1, 12):
        fall = 1 / (h**1.15)
        buzz = _add(buzz, _hz(n, f0 * h, amp * 0.22 * fall))
    form = _add(
        _lowpass(buzz, f1 * 1.4),
        _mul(_lowpass(_highpass(buzz, f1 * 0.6), f2 * 1.3), 0.55),
        _mul(_lowpass(_highpass(buzz, f2 * 0.8), f3 * 1.2), 0.22),
    )
    return _mul(form, _env(n, 0.02, 0.08))


def _burst(sec: float, amp: float, low: float, high: float, seed: int) -> list[float]:
    n = int(sec * SR)
    raw = _noise(n, amp, seed)
    band = _lowpass(_highpass(raw, low), high)
    return _mul(band, _env(n, 0.001, sec * 0.7))


def _fricative(sec: float, amp: float, low: float, high: float, seed: int) -> list[float]:
    n = int(sec * SR)
    raw = _noise(n, amp, seed)
    band = _lowpass(_highpass(raw, low), high)
    return _mul(band, _env(n, 0.012, 0.04))


def _nasal(sec: float, amp: float, f1: float, f2: float, f0: float) -> list[float]:
    n = int(sec * SR)
    hum = _add(_hz(n, f1, amp * 0.55), _hz(n, f2, amp * 0.22), _hz(n, f0, amp * 0.18))
    return _mul(hum, _env(n, 0.015, 0.04))


def render(jamo: str) -> list[float]:
    # Isolation vowel is 으. ㅇ as a lead is silent, so the clip is vowel-only.
    tense = jamo in {"ㄲ", "ㄸ", "ㅃ", "ㅆ", "ㅉ"}
    asp = jamo in {"ㅋ", "ㅌ", "ㅍ", "ㅊ", "ㅎ"}
    f0 = 155 if tense else 138
    vowel_amp = 0.22 if tense else 0.18
    vowel = _eu_vowel(0.32 if not tense else 0.26, vowel_amp, f0, tense)

    if jamo == "ㅇ":
        return _add(_silence(0.04), _eu_vowel(0.38, 0.16, 132, False))

    if jamo in {"ㅁ"}:
        return _add(_nasal(0.09, 0.2, 250, 1100, f0), vowel)
    if jamo in {"ㄴ"}:
        return _add(_nasal(0.08, 0.2, 270, 1700, f0), vowel)
    if jamo in {"ㄹ"}:
        tap = _mul(_add(_hz(int(0.03 * SR), 1400, 0.18), _hz(int(0.03 * SR), 500, 0.1)), 1.0)
        return _add(_silence(0.02), tap, vowel)

    if jamo in {"ㅅ"}:
        return _add(_fricative(0.11, 0.22, 3500, 8000, 11), vowel)
    if jamo in {"ㅆ"}:
        return _add(_fricative(0.07, 0.28, 4000, 8500, 12), vowel)
    if jamo in {"ㅎ"}:
        return _add(_fricative(0.1, 0.14, 800, 4500, 13), _eu_vowel(0.34, 0.14, 132, False))

    # Stops / affricates: closure + burst + optional aspiration + vowel.
    if jamo in {"ㅈ", "ㅉ", "ㅊ"}:
        fric = _fricative(0.05 if jamo != "ㅊ" else 0.09, 0.2 if jamo != "ㅉ" else 0.26, 2500, 7000, 21)
        vot = _fricative(0.07, 0.12, 2000, 6000, 22) if jamo == "ㅊ" else []
        return _add(_silence(0.04 if not tense else 0.06), fric, vot, vowel)

    # Place of burst
    if jamo in {"ㄱ", "ㄲ", "ㅋ"}:
        burst = _burst(0.012, 0.28 if tense else 0.18, 1200, 3500, 31)
    elif jamo in {"ㄷ", "ㄸ", "ㅌ"}:
        burst = _burst(0.01, 0.26 if tense else 0.17, 1800, 4500, 32)
    else:  # ㅂ ㅃ ㅍ
        burst = _burst(0.01, 0.24 if tense else 0.16, 400, 1800, 33)

    if tense:
        gap = _silence(0.005)
        asp_noise = []
    elif asp:
        gap = _silence(0.01)
        asp_noise = _fricative(0.085, 0.12, 600, 5000, 40)
    else:
        gap = _silence(0.018)
        asp_noise = _fricative(0.02, 0.05, 800, 4000, 41)

    return _add(_silence(0.04), burst, gap, asp_noise, vowel)


def _peak_norm(x: list[float], peak: float = 0.89) -> list[float]:
    m = max((abs(v) for v in x), default=1.0) or 1.0
    return [v * peak / m for v in x]


def write_wav(path: Path, samples: list[float]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "w") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        frames = b"".join(struct.pack("<h", max(-32767, min(32767, int(v * 32767)))) for v in samples)
        w.writeframes(frames)


def encode_opus(wav: Path, opus: Path) -> None:
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(wav),
            "-c:a",
            "libopus",
            "-b:a",
            "24k",
            "-ac",
            "1",
            "-application",
            "voip",
            str(opus),
        ],
        check=True,
        capture_output=True,
    )


def main() -> None:
    out_dir = Path(__file__).resolve().parents[1] / "static" / "audio" / "consonants"
    out_dir.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        for jamo, slug in CLIPS:
            samples = _peak_norm(render(jamo))
            wav = tmp_path / f"{slug}.wav"
            write_wav(wav, samples)
            encode_opus(wav, out_dir / f"{slug}.opus")
            print(f"wrote {slug}.opus ({jamo})")


if __name__ == "__main__":
    main()
