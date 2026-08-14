<script lang="ts">
	import { onMount } from 'svelte';
	import {
		applyTheme,
		nextThemePref,
		readThemePref,
		themePrefLabel,
		writeThemePref,
		type ThemePref
	} from '$lib/theme';

	const options = [
		{ value: 'light', label: 'Light' },
		{ value: 'dark', label: 'Dark' },
		{ value: 'system', label: 'System' }
	] as const;

	let pref = $state<ThemePref>('system');

	onMount(() => {
		pref = readThemePref();
		applyTheme(pref);
		const mq = matchMedia('(prefers-color-scheme: dark)');
		const onChange = () => {
			if (readThemePref() === 'system') applyTheme('system');
		};
		mq.addEventListener('change', onChange);
		return () => mq.removeEventListener('change', onChange);
	});

	function setPref(next: ThemePref) {
		pref = next;
		writeThemePref(next);
		applyTheme(next);
	}

	function cycle() {
		setPref(nextThemePref(pref));
	}

	const compactLabel = $derived(
		`Theme: ${themePrefLabel(pref)}. Next: ${themePrefLabel(nextThemePref(pref))}`
	);
</script>

<div class="theme wide" role="radiogroup" aria-label="Theme">
	{#each options as option (option.value)}
		<button
			type="button"
			role="radio"
			aria-checked={pref === option.value}
			class:on={pref === option.value}
			onclick={() => setPref(option.value)}
		>
			{option.label}
		</button>
	{/each}
</div>

<button
	type="button"
	class="theme compact"
	aria-label={compactLabel}
	title={compactLabel}
	onclick={cycle}
>
	{#if pref === 'light'}
		<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">
			<circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2" />
			<path
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				d="M12 3v2M12 19v2M5 12H3M21 12h-2M6.2 6.2 7.6 7.6M16.4 16.4l1.4 1.4M6.2 17.8 7.6 16.4M16.4 7.6l1.4-1.4"
			/>
		</svg>
	{:else if pref === 'dark'}
		<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">
			<path
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linejoin="round"
				d="M16.5 13.5A7 7 0 0 1 10.2 4.1 7 7 0 1 0 19.9 13.8a7 7 0 0 1-3.4-.3z"
			/>
		</svg>
	{:else}
		<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">
			<rect
				x="3"
				y="4"
				width="18"
				height="14"
				rx="2"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			/>
			<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M8 21h8M12 18v3" />
		</svg>
	{/if}
</button>

<style>
	.theme.wide {
		display: inline-flex;
		align-items: stretch;
		border: 1px solid var(--rule);
		border-radius: var(--r-sm);
		background: var(--paper-sunk);
		flex-shrink: 0;
	}

	.wide button {
		appearance: none;
		border: 0;
		background: transparent;
		color: var(--ink-soft);
		min-width: 44px;
		min-height: 44px;
		padding: 0 0.55rem;
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.02em;
		cursor: pointer;
		border-radius: calc(var(--r-sm) - 1px);
		transition: background var(--fast) var(--ease), color var(--fast) var(--ease),
			transform var(--fast) var(--ease);
	}

	.wide button:hover { color: var(--ink); background: var(--paper-raised); }
	.wide button:active { transform: translateY(0); }
	.wide button.on {
		background: var(--paper-raised);
		color: var(--accent);
		box-shadow: var(--shadow-1);
	}
	.wide button:focus-visible,
	.wide button.on:focus-visible {
		outline: 2px solid var(--paper);
		outline-offset: 2px;
		box-shadow: 0 0 0 4px var(--blue);
	}

	.compact {
		display: none;
		appearance: none;
		align-items: center;
		justify-content: center;
		width: 44px;
		min-width: 44px;
		min-height: 44px;
		padding: 0;
		border: 1px solid var(--rule);
		border-radius: var(--r-sm);
		background: var(--paper-sunk);
		color: var(--accent);
		cursor: pointer;
		flex-shrink: 0;
		transition: background var(--fast) var(--ease), color var(--fast) var(--ease);
	}
	.compact:hover { background: var(--paper-raised); color: var(--ink); }
	.compact:focus-visible {
		outline: 2px solid var(--paper);
		outline-offset: 2px;
		box-shadow: 0 0 0 4px var(--blue);
	}

	.ico {
		width: 1.15rem;
		height: 1.15rem;
		display: block;
	}

	@media (max-width: 40rem) {
		.theme.wide { display: none; }
		.compact { display: inline-flex; }
	}

	@media (max-width: 30rem) {
		.wide button { padding: 0 0.4rem; font-size: 0.66rem; }
	}

	@media (forced-colors: active) {
		.theme.wide,
		.compact {
			background: Canvas;
			border: 1px solid ButtonBorder;
			color: ButtonText;
		}
		.wide button { color: ButtonText; background: Canvas; }
		.wide button.on {
			background: Highlight;
			color: HighlightText;
			box-shadow: none;
		}
		.wide button:focus-visible,
		.wide button.on:focus-visible,
		.compact:focus-visible {
			outline: 2px solid Highlight;
			box-shadow: none;
		}
	}
</style>
