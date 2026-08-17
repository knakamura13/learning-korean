<script lang="ts">
	import { onMount } from 'svelte';
	import ProgressBackup from '$lib/components/ProgressBackup.svelte';
	import {
		applyTheme,
		readThemePref,
		themeJournalLabel,
		writeThemePref,
		type ThemePref
	} from '$lib/theme';
	import { progress } from '$lib/stores/progress.svelte';
	import { fascicle } from '$lib/stores/fascicle.svelte';
	import { LABS } from '$lib/content';

	let pref = $state<ThemePref>('system');
	let root = $state<HTMLElement | undefined>();
	let hydrated = $state(false);

	function bindRoot(node: HTMLElement) {
		root = node;
		return () => {
			root = undefined;
		};
	}

	onMount(() => {
		pref = readThemePref();
		applyTheme(pref);
		hydrated = true;
		if (!progress.durable) fascicle.setColophon(true);
	});

	function setPref(next: ThemePref) {
		pref = next;
		writeThemePref(next);
		applyTheme(next);
	}

	function toggle() {
		const next = !fascicle.colophonOpen;
		fascicle.setColophon(next);
		if (next) root?.scrollIntoView({ block: 'nearest' });
	}

	const stats = $derived(progress.stats);

	const labsSet = $derived(
		hydrated ? LABS.filter((lab) => progress.isUnlocked(lab.unlocks)).length : null
	);

	const days = $derived.by(() => {
		if (!hydrated) return [];
		return Object.entries(progress.state.days)
			.sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0))
			.slice(0, 14);
	});

	const prefs: ThemePref[] = ['light', 'dark', 'system'];

	function dash(n: number | null): string {
		return n === null ? '—' : String(n);
	}
</script>

<section {@attach bindRoot} id="colophon" class="colophon">
	<button
		type="button"
		class="toggle"
		aria-expanded={fascicle.colophonOpen}
		onclick={toggle}
	>
		¶ Colophon
	</button>

	{#if fascicle.colophonOpen}
		{#if hydrated && !progress.durable}
			<p class="blocked" role="status">Record blocked. This browser will not keep a record.</p>
		{/if}

		<dl class="ledger">
			<div>
				<dt>Labs set</dt>
				<dd>{dash(labsSet)}</dd>
			</div>
			<div>
				<dt>Due</dt>
				<dd>{hydrated ? stats.queue : '—'}</dd>
			</div>
			<div>
				<dt>New left</dt>
				<dd>{hydrated ? stats.newLeft : '—'}</dd>
			</div>
			<div>
				<dt>Mastered</dt>
				<dd>{hydrated ? stats.mature : '—'}</dd>
			</div>
		</dl>
		{#if !hydrated}
			<p class="muted">Reading the local record…</p>
		{/if}

		<fieldset class="theme">
			<legend>Theme</legend>
			{#each prefs as option (option)}
				<label title={option === 'dark' ? 'Dark paper, same moss and rose meanings.' : undefined}>
					<input
						type="radio"
						name="fascicle-theme"
						value={option}
						checked={pref === option}
						onchange={() => setPref(option)}
					/>
					{themeJournalLabel(option)}
				</label>
			{/each}
		</fieldset>

		<div class="backup">
			<p class="keep">Keep a copy / Restore a copy</p>
			<ProgressBackup exportJson={() => progress.export()} importJson={(json) => progress.import(json)} />
		</div>

		{#if days.length > 0}
			<h3>Review days</h3>
			<ol class="timeline">
				{#each days as [date, count] (date)}
					<li>
						<span class="when">{date}</span>
						<span class="count">{count}</span>
					</li>
				{/each}
			</ol>
		{/if}
	{/if}
</section>

<style>
	.colophon {
		margin-top: var(--s7);
		border-block-start: 1px solid var(--rule-strong);
		padding-top: 0;
	}

	.toggle {
		appearance: none;
		border: 0;
		background: transparent;
		display: flex;
		align-items: center;
		min-height: 44px;
		padding: 0;
		font-family: var(--sans);
		font-size: 12px;
		font-weight: 600;
		letter-spacing: 0.08em;
		color: var(--ink-soft);
		cursor: pointer;
		text-decoration: underline;
		text-decoration-thickness: 1px;
	}
	.toggle:hover {
		color: var(--ink);
		text-decoration-thickness: 2px;
	}
	.toggle:active { color: var(--ink); }

	.blocked {
		margin: 0 0 var(--s4);
		padding: var(--s3);
		background: var(--bad-soft);
		color: var(--bad);
		font-size: 12px;
		border-radius: var(--r-sm);
	}

	.ledger {
		display: grid;
		gap: var(--s2);
		margin: 0 0 var(--s5);
	}
	.ledger div {
		display: flex;
		justify-content: space-between;
		gap: var(--s4);
		font-size: 12px;
	}
	dt {
		color: var(--ink-soft);
		font-weight: 400;
	}
	dd {
		margin: 0;
		font-family: var(--mono);
		font-variant-numeric: tabular-nums;
		min-width: 5ch;
		text-align: end;
	}

	.muted {
		font-size: 12px;
		color: var(--ink-soft);
	}

	.theme {
		border: 0;
		margin: 0 0 var(--s5);
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: var(--s2);
	}
	legend {
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--ink-faint);
		margin-bottom: var(--s2);
		padding: 0;
	}
	.theme label {
		display: inline-flex;
		align-items: center;
		gap: var(--s2);
		min-height: 44px;
		padding-inline: var(--s3);
		border: 1px solid var(--rule-strong);
		border-radius: var(--r-sm);
		font-size: 12px;
		cursor: pointer;
	}

	.keep {
		font-size: 12px;
		color: var(--ink-soft);
		margin: 0 0 var(--s2);
	}

	h3 {
		font-family: var(--sans);
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--ink-faint);
		margin: var(--s5) 0 var(--s2);
	}

	.timeline {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.timeline li {
		display: flex;
		justify-content: space-between;
		font-family: var(--mono);
		font-size: 11px;
		font-variant-numeric: tabular-nums;
		padding: var(--s1) 0;
		color: var(--ink-soft);
	}
	.count { min-width: 5ch; text-align: end; }

	@media (forced-colors: active) {
		.blocked { background: Canvas; color: ButtonText; }
		.theme label { border-color: ButtonBorder; }
	}
</style>
