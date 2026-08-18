<script lang="ts">
	import { onMount } from 'svelte';
	import ProgressBackup from '$lib/components/ProgressBackup.svelte';
	import { progress } from '$lib/stores/progress.svelte';

	let ready = $state(false);
	onMount(() => {
		progress.tick();
		ready = true;
	});
</script>

<footer class="site-foot">
	<details class="backup-fold" id="progress-backup" open={ready && !progress.durable}>
		<summary>Back up or restore your progress</summary>
		<p class="backup-note">
			Your progress lives only in this browser. Back it up before switching browsers or
			devices, clearing site data, or resetting this one — {progress.durable
				? 'as a precaution.'
				: 'right now, since this browser will not keep it for you.'}
		</p>
		<ProgressBackup exportJson={() => progress.export()} importJson={(json) => progress.import(json)} />
	</details>
</footer>

<style>
	.site-foot {
		max-width: var(--shell);
		margin: 0 auto;
		padding-block: var(--s5) max(var(--s6), env(safe-area-inset-bottom));
		padding-inline: max(var(--s5), env(safe-area-inset-left)) max(var(--s5), env(safe-area-inset-right));
		border-block-start: 1px solid var(--rule);
	}

	.backup-fold summary {
		display: flex;
		align-items: center;
		gap: var(--s2);
		min-height: 44px;
		cursor: pointer;
		font-size: 0.78rem;
		font-weight: 500;
		color: var(--ink-faint);
		padding: var(--s1) 0;
		list-style: none;
	}
	.backup-fold summary::-webkit-details-marker,
	.backup-fold summary::marker {
		display: none;
		content: none;
	}
	.backup-fold summary::after {
		content: '';
		flex: 0 0 auto;
		width: 0.35rem;
		height: 0.35rem;
		margin-inline-start: auto;
		border-inline-end: 2px solid currentColor;
		border-block-end: 2px solid currentColor;
		transform: rotate(45deg);
		transition: transform var(--fast) var(--ease);
	}
	.backup-fold[open] summary::after {
		transform: rotate(225deg);
	}
	.backup-fold[open] summary {
		color: var(--ink-soft);
	}
	.backup-fold summary:hover {
		color: var(--accent);
	}
	.backup-fold summary:active {
		color: var(--ink);
	}
	.backup-fold summary:focus-visible {
		outline: 2px solid var(--paper);
		outline-offset: 2px;
		box-shadow: var(--focus-ring);
		border-radius: 3px;
	}

	.backup-note {
		font-size: 0.82rem;
		color: var(--ink-soft);
		line-height: 1.55;
		margin: var(--s2) 0 0;
		max-width: var(--measure);
	}

	@media (prefers-reduced-motion: reduce) {
		.backup-fold summary::after {
			transition: none;
		}
	}

	@media (forced-colors: active) {
		.site-foot {
			border-block-start: 1px solid ButtonBorder;
		}
		.backup-fold summary {
			color: CanvasText;
		}
	}
</style>
