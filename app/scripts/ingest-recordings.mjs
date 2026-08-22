#!/usr/bin/env node
/**
 * Ingest native-speaker letter recordings into the app.
 *
 * For each raw take this trims leading/trailing silence, loudness-normalizes,
 * and encodes `<slug>.opus` + `<slug>.mp3` into `static/audio/<dir>/`, then
 * regenerates `src/lib/audio/recorded.ts` — the availability gate that
 * `letters.ts` checks before returning clip URLs. Partial sessions are fine:
 * the gate always mirrors whatever finished clips are on disk.
 *
 * Usage (from app/):
 *   node scripts/ingest-recordings.mjs <raw-dir>   ingest every take in <raw-dir>
 *   node scripts/ingest-recordings.mjs --prompts   print the 47-slot recording sheet
 *   node scripts/ingest-recordings.mjs --sync      rewrite recorded.ts from disk (no ffmpeg)
 *
 * Raw takes are named by slug: `g.wav`, `a.m4a`, ... Slugs that exist in two
 * directories (k, n, m, t, p live in both consonants/ and finals/) must be
 * disambiguated, either with a `consonants/` / `vowels/` / `finals/`
 * subfolder inside <raw-dir> or with a filename prefix like `finals-k.wav`.
 *
 * Requires ffmpeg on PATH for ingest (`brew install ffmpeg`); the slug lists
 * are parsed out of src/lib/audio/letters.ts so this script, the recording
 * sheet, and the app cannot drift apart. No npm dependencies.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lettersPath = join(appRoot, 'src/lib/audio/letters.ts');
const recordedPath = join(appRoot, 'src/lib/audio/recorded.ts');
const audioRoot = join(appRoot, 'static/audio');

const DIRS = ['consonants', 'vowels', 'finals'];
const RAW_EXTENSIONS = new Set(['.wav', '.m4a', '.mp3', '.aac', '.flac', '.ogg', '.aiff', '.aif']);

// Trim silence off both ends (reverse trick trims the tail), then normalize
// perceived loudness so clips recorded across sessions sit at the same level.
const AUDIO_FILTERS = [
	'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05',
	'areverse',
	'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05',
	'areverse',
	'loudnorm=I=-18:TP=-1.5:LRA=7'
].join(',');

/** Parse a `{ ㄱ: 'g', ... }` slug map out of letters.ts source. */
function parseSlugMap(source, constName) {
	const decl = source.match(new RegExp(`export const ${constName}[^{]*\\{([^}]*)\\}`));
	if (!decl) throw new Error(`Could not find ${constName} in ${lettersPath}`);
	const entries = new Map();
	for (const m of decl[1].matchAll(/([ㄱ-ㅣ]):\s*'([a-z]+)'/gu)) {
		entries.set(m[1], m[2]);
	}
	if (entries.size === 0) throw new Error(`Parsed no entries for ${constName} in ${lettersPath}`);
	return entries;
}

function loadContract() {
	const source = readFileSync(lettersPath, 'utf8');
	const maps = {
		consonants: parseSlugMap(source, 'LEAD_AUDIO_SLUG'),
		vowels: parseSlugMap(source, 'VOWEL_AUDIO_SLUG'),
		finals: parseSlugMap(source, 'FINAL_AUDIO_SLUG')
	};
	const expectedSizes = { consonants: 19, vowels: 21, finals: 7 };
	for (const dir of DIRS) {
		if (maps[dir].size !== expectedSizes[dir]) {
			throw new Error(
				`Parsed ${maps[dir].size} ${dir} slugs from letters.ts, expected ${expectedSizes[dir]} — the parser and letters.ts have drifted.`
			);
		}
	}
	return maps;
}

/** Compose a Hangul syllable from compatibility jamo (lead, vowel, optional final). */
function composeSyllable(lead, vowel, final = '') {
	const CHOSEONG = [...'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'];
	const JUNGSEONG = [...'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'];
	const JONGSEONG = ['', ...'ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ'];
	const l = CHOSEONG.indexOf(lead);
	const v = JUNGSEONG.indexOf(vowel);
	const f = JONGSEONG.indexOf(final);
	if (l < 0 || v < 0 || f < 0) throw new Error(`Cannot compose ${lead}${vowel}${final}`);
	return String.fromCharCode(0xac00 + (l * 21 + v) * 28 + f);
}

/** The 47 recording prompts, derived from the letters.ts maps. */
function buildPrompts(maps) {
	const prompts = [];
	for (const [jamo, slug] of maps.consonants) {
		prompts.push({ dir: 'consonants', jamo, slug, say: composeSyllable(jamo, 'ㅡ') });
	}
	for (const [jamo, slug] of maps.vowels) {
		prompts.push({ dir: 'vowels', jamo, slug, say: composeSyllable('ㅇ', jamo) });
	}
	for (const [jamo, slug] of maps.finals) {
		prompts.push({ dir: 'finals', jamo, slug, say: composeSyllable('ㅇ', 'ㅓ', jamo) });
	}
	return prompts;
}

function printPrompts(maps) {
	const prompts = buildPrompts(maps);
	console.log('| # | Slot | Letter | Say | File name |');
	console.log('| --- | --- | --- | --- | --- |');
	prompts.forEach((p, i) => {
		const label = { consonants: 'lead', vowels: 'vowel', finals: 'final' }[p.dir];
		console.log(`| ${i + 1} | ${label} | ${p.jamo} | ${p.say} | \`${p.dir}/${p.slug}.wav\` |`);
	});
}

/** Map every expected slug to the directories that use it (k/n/m/t/p collide). */
function slugDirectories(maps) {
	const bySlug = new Map();
	for (const dir of DIRS) {
		for (const slug of maps[dir].values()) {
			if (!bySlug.has(slug)) bySlug.set(slug, []);
			bySlug.get(slug).push(dir);
		}
	}
	return bySlug;
}

/** Find raw takes in rawDir and resolve each to {dir, slug, path}. */
function collectTakes(rawDir, maps) {
	const bySlug = slugDirectories(maps);
	const takes = [];
	const problems = [];

	const classify = (filePath, forcedDir) => {
		const ext = extname(filePath).toLowerCase();
		if (!RAW_EXTENSIONS.has(ext)) return;
		let name = basename(filePath, extname(filePath)).toLowerCase();
		let dir = forcedDir ?? null;
		for (const d of DIRS) {
			if (name.startsWith(`${d}-`)) {
				dir = d;
				name = name.slice(d.length + 1);
			}
		}
		const owners = bySlug.get(name);
		if (!owners) {
			problems.push(`${basename(filePath)}: "${name}" is not a slug in letters.ts`);
			return;
		}
		if (dir && !owners.includes(dir)) {
			problems.push(`${basename(filePath)}: slug "${name}" does not belong to ${dir}/`);
			return;
		}
		if (!dir && owners.length > 1) {
			problems.push(
				`${basename(filePath)}: slug "${name}" is ambiguous (${owners.join(', ')}) — use a subfolder or a "${owners[0]}-${name}" style prefix`
			);
			return;
		}
		takes.push({ dir: dir ?? owners[0], slug: name, path: filePath });
	};

	for (const entry of readdirSync(rawDir)) {
		const full = join(rawDir, entry);
		if (statSync(full).isDirectory()) {
			if (!DIRS.includes(entry)) continue;
			for (const inner of readdirSync(full)) {
				if (!statSync(join(full, inner)).isDirectory()) classify(join(full, inner), entry);
			}
		} else {
			classify(full);
		}
	}
	return { takes, problems };
}

function requireFfmpeg() {
	const probe = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' });
	if (probe.error || probe.status !== 0) {
		console.error(
			'ffmpeg is required to ingest recordings but was not found on PATH.\n' +
				'Install it first (macOS: `brew install ffmpeg`) and re-run.'
		);
		process.exit(1);
	}
}

function encode(take) {
	const outDir = join(audioRoot, take.dir);
	mkdirSync(outDir, { recursive: true });
	const jobs = [
		{ out: join(outDir, `${take.slug}.opus`), codec: ['-c:a', 'libopus', '-b:a', '48k', '-ar', '48000'] },
		{ out: join(outDir, `${take.slug}.mp3`), codec: ['-c:a', 'libmp3lame', '-q:a', '4', '-ar', '44100'] }
	];
	for (const job of jobs) {
		const args = ['-hide_banner', '-loglevel', 'error', '-y', '-i', take.path, '-af', AUDIO_FILTERS, '-ac', '1', ...job.codec, job.out];
		const run = spawnSync('ffmpeg', args, { stdio: ['ignore', 'inherit', 'inherit'] });
		if (run.status !== 0) {
			throw new Error(`ffmpeg failed for ${take.path} -> ${job.out}`);
		}
	}
}

/** Scan static/audio for complete opus+mp3 pairs matching the contract. */
function scanRecorded(maps) {
	const recorded = [];
	const warnings = [];
	for (const dir of DIRS) {
		const slugs = new Set(maps[dir].values());
		const dirPath = join(audioRoot, dir);
		if (!existsSync(dirPath)) continue;
		const files = new Set(readdirSync(dirPath));
		const seen = new Set();
		for (const file of files) {
			const clip = file.match(/^(.+)\.(opus|mp3)$/);
			if (!clip) continue;
			const slug = clip[1];
			if (seen.has(slug)) continue;
			seen.add(slug);
			if (!slugs.has(slug)) {
				warnings.push(`${dir}/${file}: not a slug in letters.ts — ignored`);
				continue;
			}
			if (!files.has(`${slug}.opus`) || !files.has(`${slug}.mp3`)) {
				warnings.push(`${dir}/${slug}: missing its ${files.has(`${slug}.opus`) ? 'mp3' : 'opus'} sibling — ignored`);
				continue;
			}
			recorded.push(`${dir}/${slug}`);
		}
	}
	return { recorded: recorded.sort(), warnings };
}

function writeRecorded(recorded) {
	const literal =
		recorded.length === 0
			? 'new Set([])'
			: `new Set([\n${recorded.map((entry) => `\t'${entry}'`).join(',\n')}\n])`;
	const content = `/**
 * Which letter clips actually exist under \`static/audio/\` — the
 * recording-availability gate read by \`letters.ts\`.
 *
 * AUTO-GENERATED by \`app/scripts/ingest-recordings.mjs\`. Do not edit by hand:
 * ingest (or re-sync) recordings and let the script rewrite this file.
 *
 * Entries are \`<dir>/<slug>\` (e.g. \`consonants/g\`, \`vowels/a\`, \`finals/k\`),
 * and each entry promises that both \`<slug>.opus\` and \`<slug>.mp3\` are on
 * disk. Empty until Sally's native-speaker recordings are ingested — see
 * docs/recording/sally-runbook.md.
 */
export const RECORDED: ReadonlySet<string> = ${literal};
`;
	writeFileSync(recordedPath, content);
}

function summarize(maps, recorded, warnings) {
	for (const warning of warnings) console.warn(`warning: ${warning}`);
	const total = DIRS.reduce((n, dir) => n + maps[dir].size, 0);
	console.log(`recorded.ts updated: ${recorded.length}/${total} slots recorded.`);
	const missing = [];
	for (const dir of DIRS) {
		for (const [jamo, slug] of maps[dir]) {
			if (!recorded.includes(`${dir}/${slug}`)) missing.push(`${dir}/${slug} (${jamo})`);
		}
	}
	if (missing.length > 0 && missing.length <= 12) {
		console.log(`still missing: ${missing.join(', ')}`);
	} else if (missing.length > 12) {
		console.log(`still missing ${missing.length} slots — run --prompts for the full sheet.`);
	}
}

function main() {
	const arg = process.argv[2];
	const maps = loadContract();

	if (arg === '--prompts') {
		printPrompts(maps);
		return;
	}

	if (arg === '--sync') {
		const { recorded, warnings } = scanRecorded(maps);
		writeRecorded(recorded);
		summarize(maps, recorded, warnings);
		return;
	}

	if (!arg || arg.startsWith('--')) {
		console.error('Usage: node scripts/ingest-recordings.mjs <raw-dir> | --prompts | --sync');
		process.exit(1);
	}

	const rawDir = resolve(arg);
	if (!existsSync(rawDir) || !statSync(rawDir).isDirectory()) {
		console.error(`Not a directory: ${rawDir}`);
		process.exit(1);
	}

	requireFfmpeg();

	const { takes, problems } = collectTakes(rawDir, maps);
	if (problems.length > 0) {
		for (const problem of problems) console.error(`error: ${problem}`);
		console.error('Fix the file names above and re-run; nothing was ingested.');
		process.exit(1);
	}
	if (takes.length === 0) {
		console.error(`No raw takes (${[...RAW_EXTENSIONS].join(' ')}) found in ${rawDir}.`);
		process.exit(1);
	}

	for (const take of takes) {
		console.log(`ingesting ${take.dir}/${take.slug} <- ${basename(take.path)}`);
		encode(take);
	}

	const { recorded, warnings } = scanRecorded(maps);
	writeRecorded(recorded);
	summarize(maps, recorded, warnings);
}

main();
