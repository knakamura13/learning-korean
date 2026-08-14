import { env } from '$env/dynamic/public';
import { base } from '$app/paths';

/**
 * Public origin of a deployed build, including `kit.paths.base`, no trailing slash.
 * Read from `PUBLIC_SITE_URL`. Empty when unset — do not guess a host.
 */
export function siteUrl(): string {
	return normalizeSiteUrl(env.PUBLIC_SITE_URL);
}

export function normalizeSiteUrl(raw: string | undefined): string {
	return (raw ?? '').trim().replace(/\/+$/, '');
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
