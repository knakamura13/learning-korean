/** Strip legacy "Act N · " prefix from step eyebrow labels at display time. */
const LEGACY_ACT_PREFIX = /^Act \d+ · /;

export function formatStepEyebrow(label: string): string {
	return label.replace(LEGACY_ACT_PREFIX, '');
}
