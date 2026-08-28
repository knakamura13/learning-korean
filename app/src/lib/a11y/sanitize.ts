import DOMPurify from 'dompurify';
import { withLangKo } from './lang';

/** Tags `withLangKo` and authored lab copy actually emit. */
const ALLOWED_TAGS = ['p', 'strong', 'em', 'span', 'br'];
const ALLOWED_ATTR = ['lang', 'class'];
const ALLOWED_CLASSES = new Set(['jamo', 'hg', 'rom']);

const CONFIG = {
	ALLOWED_TAGS,
	ALLOWED_ATTR,
	ALLOW_DATA_ATTR: false
};

let hooked = false;

function ensureClassHook() {
	if (hooked) return;
	hooked = true;
	DOMPurify.addHook('afterSanitizeAttributes', (node) => {
		if (!('getAttribute' in node)) return;
		const el = node as Element;
		if (!el.hasAttribute('class')) return;
		const kept = (el.getAttribute('class') ?? '').split(/\s+/).filter((c) => ALLOWED_CLASSES.has(c));
		if (kept.length) el.setAttribute('class', kept.join(' '));
		else el.removeAttribute('class');
	});
}

/** Strip anything lab HTML does not use. `lang="ko"` and jamo/hg/rom classes stay. */
export function sanitizeLabHtml(html: string): string {
	if (typeof window === 'undefined') return html;
	ensureClassHook();
	return DOMPurify.sanitize(html, CONFIG);
}

/**
 * Bounded LRU cache for sanitization and Hangul tagging.
 * Sanitizing string copy with DOMPurify in DOM/jsdom environments takes ~0.15ms-0.2ms per call.
 * Memoizing `labHtml` results eliminates redundant DOMPurify parsing and regex passes
 * across re-renders and step transitions.
 */
const LAB_HTML_CACHE = new Map<string, string>();
const MAX_CACHE_SIZE = 500;

/** Wrap Hangul, then sanitize — the only string that should reach `{@html}`. */
export function labHtml(html: string): string {
	const cached = LAB_HTML_CACHE.get(html);
	if (cached !== undefined) {
		return cached;
	}

	const result = sanitizeLabHtml(withLangKo(html));

	if (LAB_HTML_CACHE.size >= MAX_CACHE_SIZE) {
		// Evict the oldest entry (first insertion key in Map iterator)
		const oldestKey = LAB_HTML_CACHE.keys().next().value;
		if (oldestKey !== undefined) {
			LAB_HTML_CACHE.delete(oldestKey);
		}
	}
	LAB_HTML_CACHE.set(html, result);

	return result;
}
