<script lang="ts">
	import { session } from '$lib/stores/session.svelte';
	import { progress } from '$lib/stores/progress.svelte';

	let newPerDay = $state(progress.studyPrefs.newPerDay);
	let reviewsPerSitting = $state(progress.studyPrefs.reviewsPerSitting);
	let prefsStatus = $state<{ tone: 'right' | 'wrong'; message: string } | null>(null);
	let saving = $state(false);

	// Refresh the steppers when /api/me lands account pacing after mount.
	$effect(() => {
		newPerDay = progress.studyPrefs.newPerDay;
		reviewsPerSitting = progress.studyPrefs.reviewsPerSitting;
	});

	async function savePrefs(event: SubmitEvent) {
		event.preventDefault();
		prefsStatus = null;
		const next = { newPerDay: Math.trunc(newPerDay), reviewsPerSitting: Math.trunc(reviewsPerSitting) };
		if (
			!Number.isInteger(next.newPerDay) ||
			!Number.isInteger(next.reviewsPerSitting) ||
			next.newPerDay < 0 ||
			next.newPerDay > 50 ||
			next.reviewsPerSitting < 1 ||
			next.reviewsPerSitting > 100
		) {
			prefsStatus = { tone: 'wrong', message: 'New cards 0–50 and reviews 1–100.' };
			return;
		}
		saving = true;
		const ok = await session.savePrefs(next);
		saving = false;
		prefsStatus = ok
			? { tone: 'right', message: 'Study pace saved to your account.' }
			: { tone: 'wrong', message: 'Could not save — check your connection and try again.' };
	}
</script>

{#if session.status === 'signed-in'}
	<section id="review-pace" class="review" aria-labelledby="review-heading">
		<h2 id="review-heading">Review</h2>

		<form class="prefs" novalidate onsubmit={savePrefs}>
			<div class="fields">
				<label>
					<span>New cards per day</span>
					<input type="number" min="0" max="50" step="1" bind:value={newPerDay} />
				</label>
				<label>
					<span>Reviews per sitting</span>
					<input type="number" min="1" max="100" step="1" bind:value={reviewsPerSitting} />
				</label>
			</div>
			<button type="submit" class="btn" disabled={saving}>Save study pace</button>
		</form>
		{#if prefsStatus}
			<p class="status" data-tone={prefsStatus.tone} role="status" aria-live="polite">
				{prefsStatus.message}
			</p>
		{/if}
	</section>
{/if}

<style>
	.review h2 {
		margin: 0 0 var(--s4);
		font-family: var(--display);
		font-size: 1.25rem;
		font-weight: 400;
		color: var(--ink);
	}

	#review-pace {
		margin-block-start: 0;
		margin-block-end: var(--s7);
		max-width: var(--measure);
		min-width: 0;
		scroll-margin-block-start: calc(48px + env(safe-area-inset-top) + 0.75rem);
	}

	.prefs {
		display: grid;
		justify-items: start;
		gap: var(--s3);
	}

	.fields {
		display: flex;
		gap: var(--s4);
		flex-wrap: wrap;
	}

	.fields label {
		display: flex;
		flex-direction: column;
		gap: var(--s1);
		font-size: 0.78rem;
		color: var(--ink-soft);
	}

	.fields input {
		inline-size: 7.5rem;
		min-block-size: 44px;
		padding: var(--s1) var(--s2);
		font: inherit;
		font-variant-numeric: tabular-nums;
		color: var(--ink);
		background: var(--paper-raised);
		border: 1px solid var(--rule-strong);
		border-radius: var(--r-sm);
	}
	.fields input:focus-visible {
		outline: 2px solid var(--paper);
		outline-offset: 2px;
		box-shadow: var(--focus-ring);
	}

	.status {
		margin: var(--s3) 0 0;
		padding: var(--s2) var(--s3);
		border-radius: var(--r-sm);
		font-size: 0.85rem;
		line-height: 1.5;
		border: 1px solid var(--rule-strong);
		background: var(--good-soft);
		color: var(--good);
	}
	.status[data-tone='wrong'] {
		background: var(--bad-soft);
		color: var(--bad);
	}

	@media (forced-colors: active) {
		.status { background: Canvas; border-color: Highlight; color: CanvasText; }
		.fields input { border-color: ButtonBorder; }
	}
</style>
