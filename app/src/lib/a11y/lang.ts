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

/** Pre-compiled patterns for single-pass HTML tokenization and tag parsing. */
const HTML_OR_HANGUL = /<[^>]*>|[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7A3]+/g;
const TAG_PARSER = /^<\/?([A-Za-z][A-Za-z0-9]*)\b([^>]*?)(\/)?>/;
const LANG_KO_ATTR = /\blang\s*=\s*(["']?)ko\1/i;
const VOID_TAGS = new Set(['br', 'img', 'hr', 'input', 'meta', 'link', 'wbr']);

/**
 * Wrap Hangul runs in `lang="ko"` so screen readers and fonts treat them as
 * Korean inside an `lang="en"` document. Skips text already inside `lang="ko"`
 * and characters that sit in a tag (attributes).
 *
 * Optimized to O(N) by single-pass token replacement, tracking tag depth and
 * attributes in a single traversal instead of re-scanning previous tags on each match.
 */
export function withLangKo(html: string): string {
	let depth = 0;
	HTML_OR_HANGUL.lastIndex = 0;
	return html.replace(HTML_OR_HANGUL, (token) => {
		if (token.charCodeAt(0) === 60 /* '<' */) {
			const match = TAG_PARSER.exec(token);
			if (match) {
				const name = match[1].toLowerCase();
				const closing = token.startsWith('</');
				const selfClosing = Boolean(match[3]) || VOID_TAGS.has(name);
				if (closing) {
					depth = Math.max(0, depth - 1);
				} else if (!selfClosing) {
					if (LANG_KO_ATTR.test(match[2])) {
						depth += 1;
					} else if (depth > 0) {
						depth += 1;
					}
				}
			}
			return token;
		}
		if (depth > 0) return token;
		return `<span lang="ko">${token}</span>`;
	});
}
