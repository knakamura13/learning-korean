/**
 * rateLimit.ts — a fixed-window in-memory limiter, sized for one small
 * deployment. State is per-process and resets on deploy, which is fine for
 * its only job: stopping a broken error reporter from flooding the log.
 */

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;

const windows = new Map<string, { start: number; count: number }>();

export function allowReport(ip: string, now: number): boolean {
	const w = windows.get(ip);
	if (!w || now - w.start >= WINDOW_MS) {
		if (windows.size > 1000) windows.clear();
		windows.set(ip, { start: now, count: 1 });
		return true;
	}
	w.count += 1;
	return w.count <= MAX_PER_WINDOW;
}
