/** Long-lived cache for self-hosted look fonts. Filenames change when the face does. */
export const IMMUTABLE_CACHE_CONTROL = 'public,max-age=31536000,immutable';

/** `adapter-node` only stamps this on `/_app/immutable/*`; `/fonts/*.woff2` needs it too. */
export function isImmutableStaticAsset(urlPath: string): boolean {
	const path = urlPath.split('?')[0] ?? '';
	return path.startsWith('/fonts/') && /\.woff2$/i.test(path);
}
