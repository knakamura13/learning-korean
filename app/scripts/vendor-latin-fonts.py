#!/usr/bin/env python3
"""Download official Newsreader sources and subset Latin woff2 for the app."""

from __future__ import annotations

import subprocess
import sys
import tempfile
import urllib.request
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "static" / "fonts"
UA = (
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
	"AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
)

# Latin + punctuation the UI actually uses (Google latin extras, arrows, dashes).
UNICODES = (
	"U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,"
	"U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2190-2193,"
	"U+2212,U+2215,U+FEFF,U+FFFD"
)

# Official OFL sources (Google Fonts mirrors of upstream).
SOURCES: list[tuple[str, str]] = [
	(
		"Newsreader[opsz,wght].ttf",
		"https://raw.githubusercontent.com/google/fonts/main/ofl/newsreader/Newsreader%5Bopsz%2Cwght%5D.ttf",
	),
	(
		"Newsreader-Italic[opsz,wght].ttf",
		"https://raw.githubusercontent.com/google/fonts/main/ofl/newsreader/Newsreader-Italic%5Bopsz%2Cwght%5D.ttf",
	),
]

OUTPUTS: list[tuple[str, str]] = [
	("Newsreader[opsz,wght].ttf", "Newsreader-latin.woff2"),
	("Newsreader-Italic[opsz,wght].ttf", "Newsreader-Italic-latin.woff2"),
]


def fetch(url: str, dest: Path) -> None:
	req = urllib.request.Request(url, headers={"User-Agent": UA})
	with urllib.request.urlopen(req, timeout=120) as res, dest.open("wb") as fh:
		fh.write(res.read())
	if dest.stat().st_size < 10_000:
		raise RuntimeError(f"{url} too small: {dest.stat().st_size} bytes")


def pin_weight(src: Path, dest: Path) -> None:
	"""Instance wght=400; keep opsz for font-optical-sizing: auto."""
	cmd = [
		sys.executable,
		"-m",
		"fontTools.varLib.instancer",
		str(src),
		"wght=400",
		f"--output={dest}",
	]
	subprocess.run(cmd, check=True)
	if dest.stat().st_size < 10_000:
		raise RuntimeError(f"instanced font too small: {dest}")


def subset(src: Path, dest: Path) -> None:
	cmd = [
		sys.executable,
		"-m",
		"fontTools.subset",
		str(src),
		f"--unicodes={UNICODES}",
		"--layout-features=kern,liga,calt,onum,tnum,case,ss01",
		"--flavor=woff2",
		f"--output-file={dest}",
	]
	subprocess.run(cmd, check=True)
	if dest.stat().st_size < 1_000:
		raise RuntimeError(f"subset too small: {dest}")


def main() -> None:
	OUT.mkdir(parents=True, exist_ok=True)
	with tempfile.TemporaryDirectory(prefix="latin-fonts-") as tmp:
		tmp_path = Path(tmp)
		by_name: dict[str, Path] = {}
		for name, url in SOURCES:
			dest = tmp_path / name.replace("[", "_").replace("]", "_")
			print(f"fetch {name}")
			fetch(url, dest)
			by_name[name] = dest
		for src_name, out_name in OUTPUTS:
			out = OUT / out_name
			pinned = tmp_path / f"pinned-{out_name}.ttf"
			print(f"instance wght=400 → {out_name}")
			pin_weight(by_name[src_name], pinned)
			print(f"subset {out_name}")
			subset(pinned, out)
			print(f"  {out_name}: {out.stat().st_size} bytes")


if __name__ == "__main__":
	main()
