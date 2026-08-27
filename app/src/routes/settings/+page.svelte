<script lang="ts">
	import { onMount } from 'svelte';
	import AccountSection from '$lib/components/AccountSection.svelte';
	import LookPicker from '$lib/components/LookPicker.svelte';
	import MasterySnapshot from '$lib/components/MasterySnapshot.svelte';
	import ProgressBackup from '$lib/components/ProgressBackup.svelte';
	import ProgressReset from '$lib/components/ProgressReset.svelte';
	import { applyImportedBackup, wrapExport } from '$lib/domain/backup';
	import { labSession, LAB_STEP_COUNTS } from '$lib/stores/labSession.svelte';
	import { progress } from '$lib/stores/progress.svelte';
	import { session } from '$lib/stores/session.svelte';

	/** Cleared when look/color localStorage writes fail this visit (Backup note). */
	let appearanceSaved = $state(true);
	let ready = $state(false);

	onMount(() => {
		progress.tick();
		ready = true;
	});

	const tiers = $derived(progress.tierProgress);

	function exportJson(): string {
		return wrapExport(progress.export(), labSession.snapshot);
	}

	function importJson(json: string): boolean {
		const plan = applyImportedBackup(json, LAB_STEP_COUNTS);
		if (!plan) return false;
		if (!progress.import(plan.srsText)) return false;
		labSession.replaceAll(plan.sessions);
		return true;
	}
</script>

<svelte:head><title>Settings</title></svelte:head>

<div class="shell">
	<header class="head">
		<h1>Settings</h1>
	</header>

	<section class="progress" aria-labelledby="progress-heading">
		<h2 id="progress-heading">Progress</h2>
		<p class="progress-note">
			Mastery across letter families. Green stretches mean a 21-day gap is holding.
		</p>
		<MasterySnapshot
			{tiers}
			{ready}
			emptyCopy="Letters land here after you finish a lab. Lab 01 unlocks consonants."
		/>
	</section>

	<section class="appearance" aria-labelledby="appearance-heading">
		<h2 id="appearance-heading">Appearance</h2>
		<LookPicker onPersistFail={() => (appearanceSaved = false)} />
	</section>

	<AccountSection />

	{#if session.status !== 'unknown'}
		<section id="backup" class="backup" aria-labelledby="backup-heading">
			<h2 id="backup-heading">Backup</h2>
			<p class="backup-note">
				{#if progress.corrupt || labSession.corrupt}
					Saved progress could not be read. Back it up now — reviews will not overwrite it
					until you restore or reset.
				{:else if session.status === 'signed-in'}
					A file backup still matters: it survives a reset, a lost session, or a browser that
					is not signed in{progress.durable && labSession.durable
						? '.'
						: ' — and this browser will not keep a local copy.'}
				{:else}
					Your progress lives only in this browser. Back it up before switching browsers or
					devices, clearing site data, or resetting this one — {progress.durable &&
					labSession.durable
						? 'as a precaution.'
						: 'right now, since this browser will not keep it for you.'}
				{/if}
				{#if !appearanceSaved}
					This browser did not save your look or color.
				{/if}
			</p>
			<div class="file-actions">
				<ProgressBackup {exportJson} {importJson} />
				<div id="reset">
					<ProgressReset
						onReset={() => {
							progress.reset();
							labSession.reset();
						}}
					/>
				</div>
			</div>
		</section>
	{/if}
</div>

<style>
	.shell {
		max-width: var(--shell);
		min-width: 0;
		width: 100%;
	}

	.head {
		margin-block-end: var(--s6);
	}

	.head h1 {
		margin: 0;
		font-family: var(--display);
		font-size: clamp(1.75rem, 1.4rem + 1.2vw, 2.25rem);
		font-weight: 400;
		line-height: 1.2;
		color: var(--ink);
	}

	.progress,
	.appearance,
	.backup {
		margin-block-end: var(--s7);
		max-width: var(--measure);
		min-width: 0;
	}

	.progress h2,
	.progress h2,
	.appearance h2,
	.backup h2 {
		margin: 0 0 var(--s4);
		font-family: var(--display);
		font-size: 1.25rem;
		font-weight: 400;
		color: var(--ink);
	}

	.progress-note {
		font-size: 0.82rem;
		color: var(--ink-soft);
		line-height: 1.55;
		margin: 0 0 var(--s4);
		max-width: var(--measure);
	}

	.file-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-start;
		gap: var(--s2);
	}

	.file-actions :global(.backup),
	.file-actions :global(.reset) {
		margin-top: 0;
	}

	#backup {
		margin-block-start: 0;
		scroll-margin-block-start: calc(48px + env(safe-area-inset-top) + 0.75rem);
	}

	#reset {
		scroll-margin-block-start: calc(48px + env(safe-area-inset-top) + 0.75rem);
	}

	.backup-note {
		font-size: 0.82rem;
		color: var(--ink-soft);
		line-height: 1.55;
		margin: 0 0 var(--s4);
		max-width: var(--measure);
	}
</style>
