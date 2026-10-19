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

const MAX_CACHE_SIZE = 500;
const labHtmlCache = new Map<string, string>();

/** Wrap Hangul, then sanitize — the only string that should reach `{@html}`. */
export function labHtml(html: string): string {
	const cached = labHtmlCache.get(html);
	if (cached !== undefined) return cached;
	const result = sanitizeLabHtml(withLangKo(html));
	if (labHtmlCache.size >= MAX_CACHE_SIZE) {
		const firstKey = labHtmlCache.keys().next().value;
		if (firstKey !== undefined) labHtmlCache.delete(firstKey);
	}
	labHtmlCache.set(html, result);
	return result;
}
