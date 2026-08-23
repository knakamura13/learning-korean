import { env } from '$env/dynamic/public';
import { base } from '$app/paths';

export const SITE_DESCRIPTION = 'Interactive labs and spaced repetition for reading Korean.';

/** Alt text for `static/og.png` — cream card, moss tile with 한, title. */
export const OG_IMAGE_ALT =
	'Cream card with a moss-green tile showing 한 and the title Korean — labs and review';

/**
 * Public origin of a deployed build, including `kit.paths.base`, no trailing slash.
 * Read from `PUBLIC_SITE_URL`. Empty when unset — do not guess a host.
 * A hostname without a scheme is stored as `https://…` so OG tags stay absolute.
 */
export function siteUrl(): string {
	return normalizeSiteUrl(env.PUBLIC_SITE_URL);
}

export function normalizeSiteUrl(raw: string | undefined): string {
	const trimmed = (raw ?? '').trim();
	if (!trimmed) return '';
	const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed)
		? trimmed
		: `https://${trimmed.replace(/^\/+/, '')}`;
	return withScheme.replace(/\/+$/, '');
}

/** Absolute page URL, or undefined when `PUBLIC_SITE_URL` is not set. */
export function absolutePageUrl(root: string, pathname: string, basePath = ''): string | undefined {
	if (!root) return undefined;
	let path = pathname || '/';
	if (basePath && path.startsWith(basePath)) {
		path = path.slice(basePath.length) || '/';
	}
	if (!path.startsWith('/')) path = `/${path}`;
	return path === '/' ? `${root}/` : `${root}${path}`;
}

export function absoluteAssetUrl(root: string, file: string): string | undefined {
	if (!root) return undefined;
	const name = file.startsWith('/') ? file : `/${file}`;
	return `${root}${name}`;
}

export function pageCanonical(pathname: string): string | undefined {
	return absolutePageUrl(siteUrl(), pathname, base);
}

export function siteAsset(file: string): string | undefined {
	return absoluteAssetUrl(siteUrl(), file);
}

/** Per-page share title. Matches the document `<title>` so OG/Twitter are not site-wide. */
export function pageShareTitle(
	pathname: string,
	lab?: { number: number; title: string } | null
): string {
	if (pathname.startsWith('/review')) return 'Daily review';
	if (pathname.startsWith('/drill')) return 'Drill';
	if (pathname.startsWith('/settings')) return 'Settings';
	if (pathname.startsWith('/reference')) return 'Reference — every letter and rule';
	if (pathname.startsWith('/lab/') && lab) return `Lab ${lab.number} — ${lab.title}`;
	if (pathname.startsWith('/lab/')) return 'Lab';
	return 'Korean — labs and review';
}
