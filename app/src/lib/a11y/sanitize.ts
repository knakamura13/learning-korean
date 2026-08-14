import DOMPurify from 'isomorphic-dompurify';
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
	ensureClassHook();
	return DOMPurify.sanitize(html, CONFIG);
}

/** Wrap Hangul, then sanitize — the only string that should reach `{@html}`. */
export function labHtml(html: string): string {
	return sanitizeLabHtml(withLangKo(html));
}
