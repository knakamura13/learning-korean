/**
 * Gate Svelte transition params for prefers-reduced-motion.
 * CSS cannot collapse WAAPI-backed in:/out:/transition: durations.
 */

type MotionParams = {
	duration?: number;
	[key: string]: unknown;
};

export function motion<T extends MotionParams>(params?: T): T {
	const base = (params ?? {}) as T;
	const reduce =
		typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
	if (!reduce) return base;
	return { ...base, duration: 0 };
}
