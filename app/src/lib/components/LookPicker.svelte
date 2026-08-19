<script lang="ts">
	import { onMount } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import {
		LOOKS,
		applyLook,
		applyTheme,
		readLookId,
		readThemePref,
		resolvedTheme,
		themePrefLabel,
		writeLookId,
		writeThemePref,
		type LookId,
		type ThemePref
	} from '$lib/theme';

	let { onPersistFail }: { onPersistFail?: () => void } = $props();

	let lookId = $state<LookId>('botanicalKorea');
	let pref = $state<ThemePref>('system');
	const darkScheme = new MediaQuery('prefers-color-scheme: dark');
	const resolved = $derived(resolvedTheme(pref, darkScheme.current));

	const colorOptions = ['light', 'dark', 'system'] as const satisfies readonly ThemePref[];

	onMount(() => {
		lookId = readLookId();
		pref = readThemePref();
		applyLook(lookId, pref);
		const mq = matchMedia('(prefers-color-scheme: dark)');
		const onChange = () => {
			if (readThemePref() === 'system') applyTheme('system', lookId);
		};
		mq.addEventListener('change', onChange);
		return () => mq.removeEventListener('change', onChange);
	});

	function chooseLook(id: LookId) {
		lookId = id;
		applyLook(id, pref);
		if (!writeLookId(id)) onPersistFail?.();
	}

	function chooseColor(next: ThemePref) {
		pref = next;
		applyTheme(next, lookId);
		if (!writeThemePref(next)) onPersistFail?.();
	}

	function onLookChange(event: Event) {
		const value = (event.currentTarget as HTMLInputElement).value;
		chooseLook(value as LookId);
	}

	function onColorChange(event: Event) {
		const value = (event.currentTarget as HTMLInputElement).value as ThemePref;
		chooseColor(value);
	}
</script>

<div class="picker">
	<fieldset class="looks">
		<legend>Look</legend>
		<div class="look-grid">
			{#each LOOKS as system (system.id)}
				{@const palette = resolved === 'dark' ? system.dark : system.light}
				<label class="look-card" data-look-card={system.id}>
					<input
						type="radio"
						name="look"
						value={system.id}
						checked={lookId === system.id}
						onchange={onLookChange}
					/>
					<span class="look-body">
						<span class="look-name">{system.name}</span>
						<span class="look-summary">{system.summary}</span>
						<span class="chips">
							<span
								class="chip"
								data-chip="paper"
								aria-hidden="true"
								style="background: {palette.paper}"
							></span>
							<span
								class="chip"
								data-chip="ink"
								aria-hidden="true"
								style="background: {palette.ink}"
							></span>
							<span
								class="chip"
								data-chip="accent"
								aria-hidden="true"
								style="background: {palette.accent}"
							></span>
							<span
								class="chip"
								data-chip="rose"
								aria-hidden="true"
								style="background: {palette.rose}"
							></span>
						</span>
					</span>
				</label>
			{/each}
		</div>
	</fieldset>

	<fieldset class="colors">
		<legend>Color</legend>
		<div class="color-row">
			{#each colorOptions as option (option)}
				<label class="color-option">
					<input
						type="radio"
						name="color"
						value={option}
						checked={pref === option}
						onchange={onColorChange}
					/>
					<span class="color-label">{themePrefLabel(option)}</span>
				</label>
			{/each}
		</div>
	</fieldset>
</div>

<style>
	.picker {
		display: grid;
		gap: var(--s6);
	}

	fieldset {
		margin: 0;
		padding: 0;
		border: none;
		min-inline-size: 0;
	}

	legend {
		padding: 0;
		margin-block-end: var(--s3);
		font-family: var(--display);
		font-size: 1.05rem;
		font-weight: 600;
		color: var(--ink);
	}

	.look-grid {
		display: grid;
		gap: var(--s3);
		grid-template-columns: 1fr;
	}

	@media (min-width: 40rem) {
		.look-grid {
			grid-template-columns: 1fr 1fr;
		}
	}

	.look-card {
		position: relative;
		display: flex;
		align-items: stretch;
		min-width: 44px;
		min-height: 44px;
		padding: var(--s4);
		border: 1px solid var(--rule);
		border-radius: var(--r-md);
		background: var(--paper-raised);
		color: var(--ink);
		cursor: pointer;
		transition:
			border-color var(--fast) var(--ease),
			background var(--fast) var(--ease),
			box-shadow var(--fast) var(--ease);
	}

	.look-card:hover {
		border-color: var(--rule-strong);
		background: var(--paper);
	}

	.look-card:has(input:checked) {
		border-color: var(--accent);
		box-shadow: var(--shadow-1);
	}

	.look-card:has(input:focus-visible) {
		outline: 2px solid var(--paper);
		outline-offset: 2px;
		box-shadow: var(--focus-ring);
	}

	.look-card input {
		position: absolute;
		inset-inline-start: var(--s4);
		inset-block-start: var(--s4);
		width: 1.1rem;
		height: 1.1rem;
		margin: 0;
		accent-color: var(--accent);
	}

	.look-body {
		display: grid;
		gap: var(--s2);
		padding-inline-start: calc(1.1rem + var(--s3));
		min-width: 0;
	}

	.look-name {
		font-family: var(--display);
		font-size: 1.05rem;
		font-weight: 600;
		line-height: 1.3;
	}

	.look-summary {
		font-size: 0.92rem;
		line-height: 1.45;
		color: var(--ink-soft);
	}

	.chips {
		display: flex;
		gap: var(--s2);
		margin-block-start: var(--s1);
	}

	.chip {
		width: 1.1rem;
		height: 1.1rem;
		border-radius: var(--r-sm);
		border: 1px solid var(--rule-strong);
		flex-shrink: 0;
	}

	.color-row {
		display: flex;
		flex-wrap: wrap;
		gap: var(--s3);
	}

	.color-option {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: var(--s2);
		min-width: 44px;
		min-height: 44px;
		padding-inline: var(--s3);
		border: 1px solid var(--rule);
		border-radius: var(--r-sm);
		background: var(--paper-raised);
		color: var(--ink);
		cursor: pointer;
		transition:
			border-color var(--fast) var(--ease),
			background var(--fast) var(--ease);
	}

	.color-option:hover {
		border-color: var(--rule-strong);
		background: var(--paper);
	}

	.color-option:has(input:checked) {
		border-color: var(--accent);
	}

	.color-option:has(input:focus-visible) {
		outline: 2px solid var(--paper);
		outline-offset: 2px;
		box-shadow: var(--focus-ring);
	}

	.color-option input {
		width: 1.1rem;
		height: 1.1rem;
		margin: 0;
		accent-color: var(--accent);
	}

	.color-label {
		font-size: 0.95rem;
		line-height: 1.2;
	}

	@media (prefers-reduced-motion: reduce) {
		.look-card,
		.color-option {
			transition: none;
		}
	}

	@media (forced-colors: active) {
		.look-card,
		.color-option {
			background: Canvas;
			border: 1px solid ButtonBorder;
			color: CanvasText;
		}
		.look-card:has(input:checked),
		.color-option:has(input:checked) {
			border-color: Highlight;
		}
		.look-card:has(input:focus-visible),
		.color-option:has(input:focus-visible) {
			outline: 2px solid Highlight;
			box-shadow: none;
		}
		.chip {
			border: 1px solid ButtonBorder;
			forced-color-adjust: none;
		}
	}
</style>
