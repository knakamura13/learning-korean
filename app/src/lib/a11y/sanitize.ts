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

const CACHE_LIMIT = 500;
const LAB_HTML_CACHE = new Map<string, string>();

/** Wrap Hangul, then sanitize — the only string that should reach `{@html}`. Memoized for performance. */
export function labHtml(html: string): string {
	const cached = LAB_HTML_CACHE.get(html);
	if (cached !== undefined) return cached;
	const sanitized = sanitizeLabHtml(withLangKo(html));
	if (LAB_HTML_CACHE.size >= CACHE_LIMIT) {
		const firstKey = LAB_HTML_CACHE.keys().next().value;
		if (firstKey !== undefined) LAB_HTML_CACHE.delete(firstKey);
	}
	LAB_HTML_CACHE.set(html, sanitized);
	return sanitized;
}
