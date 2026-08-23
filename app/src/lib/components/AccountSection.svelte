<script lang="ts">
	import { page } from '$app/state';
	import { focusWhen } from '$lib/a11y/shortcuts';
	import { attachModalDialog } from '$lib/a11y/attachModalDialog';
	import { session } from '$lib/stores/session.svelte';
	import { progress } from '$lib/stores/progress.svelte';

	let newPerDay = $state(progress.studyPrefs.newPerDay);
	let reviewsPerSitting = $state(progress.studyPrefs.reviewsPerSitting);
	let prefsStatus = $state<{ tone: 'right' | 'wrong'; message: string } | null>(null);
	let confirmingDelete = $state(false);
	let deleteStatus = $state<{ tone: 'right' | 'wrong'; message: string } | null>(null);
	let saving = $state(false);

	const authFailed = $derived(page.url.searchParams.get('auth') === 'failed');

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

	async function confirmDelete() {
		confirmingDelete = false;
		const ok = await session.deleteAccount();
		deleteStatus = ok
			? {
					tone: 'right',
					message: 'Account deleted. Progress in this browser is untouched and works signed out.'
				}
			: {
					tone: 'wrong',
					message: 'Could not delete the account — check your connection and try again.'
				};
	}
</script>

{#if session.status !== 'unknown' && session.accountsAvailable}
	<section id="account" class="account" aria-labelledby="account-heading">
		<h2 id="account-heading">Account</h2>

		{#if session.status === 'guest'}
			<p class="note">
				Sign in to keep your review deck and lab place synced across devices. Signing in adopts
				the progress already in this browser — nothing is lost.
			</p>
			{#if authFailed}
				<p class="status" data-tone="wrong" role="status" aria-live="polite">
					Google sign-in didn't complete. Nothing changed — try again.
				</p>
			{/if}
			<a class="btn" href="/api/auth/google" data-sveltekit-reload data-sveltekit-preload-data="off">
				Sign in with Google
			</a>
		{:else}
			<p class="note">
				Signed in as <strong>{session.user?.email}</strong>. Progress syncs to your account and
				follows you to any signed-in device.
			</p>

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

			<div class="actions">
				<button type="button" class="btn ghost" onclick={() => void session.signOut()}>
					Sign out
				</button>
				<button type="button" class="btn ghost danger" onclick={() => (confirmingDelete = true)}>
					Delete account…
				</button>
			</div>

			{#if confirmingDelete}
				<dialog
					class="confirm"
					aria-labelledby="delete-copy"
					{@attach (node: HTMLDialogElement) => attachModalDialog(node, () => (confirmingDelete = false))}
				>
					<p id="delete-copy">
						Delete your account and its synced copy of your progress? The deck in this browser
						stays and keeps working signed out. This cannot be undone.
					</p>
					<div class="actions">
						<button
							type="button"
							class="btn ghost"
							use:focusWhen={true}
							onclick={() => (confirmingDelete = false)}
						>
							Cancel
						</button>
						<button type="button" class="btn" onclick={() => void confirmDelete()}>
							Delete account
						</button>
					</div>
				</dialog>
			{/if}
		{/if}

		{#if deleteStatus}
			<p class="status" data-tone={deleteStatus.tone} role="status" aria-live="polite">
				{deleteStatus.message}
			</p>
		{/if}
	</section>
{/if}

<style>
	.account h2 {
		margin: 0 0 var(--s4);
		font-family: var(--display);
		font-size: 1.25rem;
		font-weight: 400;
		color: var(--ink);
	}

	#account {
		margin-block-start: var(--s7);
		scroll-margin-block-start: calc(48px + env(safe-area-inset-top) + 0.75rem);
	}

	.note {
		font-size: 0.82rem;
		color: var(--ink-soft);
		line-height: 1.55;
		margin: 0 0 var(--s4);
		max-width: var(--measure);
	}
	.note strong { color: var(--ink); font-weight: 600; }

	.prefs { margin-block-end: var(--s3); }

	.fields {
		display: flex;
		gap: var(--s4);
		flex-wrap: wrap;
		margin-block-end: var(--s3);
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

	.actions {
		display: flex;
		gap: var(--s2);
		flex-wrap: wrap;
		margin-block-start: var(--s3);
	}

	.danger { color: var(--rose); }

	.confirm {
		margin-top: var(--s3);
		padding: var(--s3) var(--s4);
		max-width: 36rem;
		width: min(36rem, calc(100% - 2rem));
		border-radius: var(--r-md);
		border: none;
		border-inline-start: 3px solid var(--warn);
		background: var(--warn-soft);
		color: inherit;
		font-size: 0.87rem;
		line-height: 1.6;
		overscroll-behavior: contain;
	}
	.confirm::backdrop {
		background: color-mix(in srgb, var(--ink) 35%, transparent);
	}
	.confirm p { margin: 0 0 var(--s3); }
	.confirm .actions { margin: 0; }

	.status {
		margin: var(--s3) 0 0;
		padding: var(--s2) var(--s3);
		border-radius: var(--r-sm);
		font-size: 0.85rem;
		line-height: 1.5;
		border-inline-start: 3px solid var(--good);
		background: var(--good-soft);
		color: var(--good);
	}
	.status[data-tone='wrong'] {
		border-inline-start-color: var(--bad);
		background: var(--bad-soft);
		color: var(--bad);
	}

	@media (forced-colors: active) {
		.confirm { background: Canvas; border-inline-start-color: ButtonText; }
		.status { background: Canvas; border-inline-start-color: Highlight; color: CanvasText; }
		.fields input { border-color: ButtonBorder; }
	}
</style>
