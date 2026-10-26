<script lang="ts">
	import { page } from '$app/state';
	import { focusWhen } from '$lib/a11y/shortcuts';
	import { attachModalDialog } from '$lib/a11y/attachModalDialog';
	import { session } from '$lib/stores/session.svelte';

	let confirmingDelete = $state(false);
	let deleteStatus = $state<{ tone: 'right' | 'wrong'; message: string } | null>(null);

	const authFailed = $derived(page.url.searchParams.get('auth') === 'failed');

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

			<div class="actions">
				<button type="button" class="btn ghost" onclick={() => void session.signOut()}>
					Sign out
				</button>
				<button type="button" class="btn ghost danger" aria-haspopup="dialog" onclick={() => (confirmingDelete = true)}>
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
		margin-block-start: 0;
		margin-block-end: var(--s7);
		max-width: var(--measure);
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

	.actions {
		display: flex;
		gap: var(--s2);
		flex-wrap: wrap;
	}

	.danger { color: var(--rose); }

	.confirm {
		margin-top: var(--s3);
		padding: var(--s3) var(--s4);
		max-width: 36rem;
		width: min(36rem, calc(100% - 2rem));
		border-radius: var(--r-md);
		border: 1px solid var(--rule-strong);
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
		border: 1px solid var(--rule-strong);
		background: var(--good-soft);
		color: var(--good);
	}
	.status[data-tone='wrong'] {
		background: var(--bad-soft);
		color: var(--bad);
	}

	@media (forced-colors: active) {
		.confirm { background: Canvas; border-color: ButtonText; }
		.status { background: Canvas; border-color: Highlight; color: CanvasText; }
	}
</style>
