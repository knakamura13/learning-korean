<script lang="ts">
	import { onMount } from 'svelte';
	import AccountSection from '$lib/components/AccountSection.svelte';
	import LookPicker from '$lib/components/LookPicker.svelte';
	import ProgressBackup from '$lib/components/ProgressBackup.svelte';
	import ProgressReset from '$lib/components/ProgressReset.svelte';
	import { applyImportedBackup, wrapExport } from '$lib/domain/backup';
	import { labSession, LAB_STEP_COUNTS } from '$lib/stores/labSession.svelte';
	import { progress } from '$lib/stores/progress.svelte';
	import { session } from '$lib/stores/session.svelte';

	/** Cleared when look/color localStorage writes fail this visit (Backup note). */
	let appearanceSaved = $state(true);

	onMount(() => {
		progress.tick();
	});

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
			<ProgressBackup {exportJson} {importJson} />
			<div id="reset">
				<ProgressReset
					onReset={() => {
						progress.reset();
						labSession.reset();
					}}
				/>
			</div>
		</section>
	{/if}
</div>

<style>
	.shell {
		max-width: var(--shell);
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

	.appearance h2,
	.backup h2 {
		margin: 0 0 var(--s4);
		font-family: var(--display);
		font-size: 1.25rem;
		font-weight: 400;
		color: var(--ink);
	}

	#backup {
		margin-block-start: var(--s7);
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
