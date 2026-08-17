/**
 * jamoIndex.ts — ToC flyleaf catalog. Unmet labs stay closed; lookup is not a quiz.
 */

import {
	CLUSTERS,
	LEADS,
	REPRESENTATIVE,
	VOWELS,
	romanizeJamo
} from './hangul';
import { labCardState, type CourseLab, type CourseNavView } from './courseNav';
import { padFolio } from './sitting';

const COMPOUNDS = new Set(['ㅐ', 'ㅒ', 'ㅔ', 'ㅖ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅢ']);

export interface JamoIndexEntry {
	jamo: string;
	rom: string;
	plateNumber: number;
	plateId: string;
	locked: boolean;
	current: boolean;
	caption: string;
}

function labByNumber(labs: CourseLab[], number: number): CourseLab | undefined {
	return labs.find((lab) => lab.number === number);
}

function pushGroup(
	out: JamoIndexEntry[],
	jamo: readonly string[],
	labs: CourseLab[],
	view: CourseNavView,
	currentLabId: string | null,
	plateNumber: number
) {
	const lab = labByNumber(labs, plateNumber);
	if (!lab) return;
	const card = labCardState(lab, labs, view);
	for (const glyph of jamo) {
		const rom = romanizeJamo(glyph);
		out.push({
			jamo: glyph,
			rom,
			plateNumber,
			plateId: lab.id,
			locked: card.locked,
			current: currentLabId === lab.id,
			caption: card.locked
				? 'Not yet derived.'
				: `Plate ${padFolio(plateNumber)} · ${lab.title}`
		});
	}
}

export function jamoIndexEntries(
	labs: CourseLab[],
	view: CourseNavView,
	currentLabId: string | null
): JamoIndexEntry[] {
	const simple = VOWELS.filter((v) => !COMPOUNDS.has(v));
	const compounds = VOWELS.filter((v) => COMPOUNDS.has(v));
	const out: JamoIndexEntry[] = [];
	pushGroup(out, LEADS, labs, view, currentLabId, 1);
	pushGroup(out, simple, labs, view, currentLabId, 2);
	pushGroup(out, compounds, labs, view, currentLabId, 3);
	pushGroup(out, REPRESENTATIVE, labs, view, currentLabId, 4);
	pushGroup(out, CLUSTERS, labs, view, currentLabId, 5);
	return out;
}

export function filterJamoIndex(entries: JamoIndexEntry[], query: string): JamoIndexEntry[] {
	const q = query.trim().toLowerCase();
	if (!q) return entries;
	return entries.filter((entry) => {
		return (
			entry.jamo.includes(q) ||
			entry.rom.toLowerCase().includes(q) ||
			entry.caption.toLowerCase().includes(q) ||
			String(entry.plateNumber) === q ||
			padFolio(entry.plateNumber) === q
		);
	});
}
