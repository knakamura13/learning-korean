/** Hangul jamo, compatibility jamo, and syllables. */
const HANGUL_RUN = /[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7A3]+/g;

export function hasHangul(text: string): boolean {
	HANGUL_RUN.lastIndex = 0;
	return HANGUL_RUN.test(text);
}

export function splitKo(text: string): { text: string; ko: boolean }[] {
	const parts: { text: string; ko: boolean }[] = [];
	HANGUL_RUN.lastIndex = 0;
	let last = 0;
	let match: RegExpExecArray | null;
	while ((match = HANGUL_RUN.exec(text))) {
		if (match.index > last) {
			parts.push({ text: text.slice(last, match.index), ko: false });
		}
		parts.push({ text: match[0], ko: true });
		last = match.index + match[0].length;
	}
	if (last < text.length) parts.push({ text: text.slice(last), ko: false });
	return parts.length ? parts : [{ text, ko: false }];
}

/**
 * Wrap Hangul runs in `lang="ko"` so screen readers and fonts treat them as
 * Korean inside an `lang="en"` document. Skips text already inside `lang="ko"`
 * and characters that sit in a tag (attributes).
 */
export function withLangKo(html: string): string {
	HANGUL_RUN.lastIndex = 0;
	return html.replace(HANGUL_RUN, (run, offset: number) => {
		const before = html.slice(0, offset);
		const lastLt = before.lastIndexOf('<');
		const lastGt = before.lastIndexOf('>');
		if (lastLt > lastGt) return run;
		if (langKoDepth(before) > 0) return run;
		return `<span lang="ko">${run}</span>`;
	});
}

function langKoDepth(before: string): number {
	const tagRe = /<\/?([A-Za-z][A-Za-z0-9]*)\b([^>]*?)(\/)?>/g;
	let depth = 0;
	let match: RegExpExecArray | null;
	while ((match = tagRe.exec(before))) {
		const name = match[1].toLowerCase();
		const closing = match[0].startsWith('</');
		const selfClosing = Boolean(match[3]) || VOID_TAGS.has(name);
		if (closing) {
			depth = Math.max(0, depth - 1);
			continue;
		}
		if (selfClosing) continue;
		if (/\blang\s*=\s*(["']?)ko\1/i.test(match[2])) depth += 1;
		else if (depth > 0) depth += 1;
	}
	return depth;
}

const VOID_TAGS = new Set(['br', 'img', 'hr', 'input', 'meta', 'link', 'wbr']);
