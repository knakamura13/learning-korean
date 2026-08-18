<script lang="ts">
	import { onMount } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import {
		applyTheme,
		nextThemePref,
		readThemePref,
		themeToggleGlyph,
		themeToggleLabel,
		writeThemePref,
		type ThemePref
	} from '$lib/theme';

	let pref = $state<ThemePref>('system');
	const darkScheme = new MediaQuery('prefers-color-scheme: dark');

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

	const glyph = $derived(themeToggleGlyph(pref, darkScheme.current));
	const label = $derived(themeToggleLabel(pref, darkScheme.current));
</script>

<button type="button" class="theme" aria-label={label} title={label} onclick={cycle}>
	{#if glyph === 'sun'}
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
	{:else}
		<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">
			<path
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linejoin="round"
				d="M16.5 13.5A7 7 0 0 1 10.2 4.1 7 7 0 1 0 19.9 13.8a7 7 0 0 1-3.4-.3z"
			/>
		</svg>
	{/if}
</button>

<style>
	.theme {
		display: inline-flex;
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
		transition:
			background var(--fast) var(--ease),
			color var(--fast) var(--ease);
	}
	.theme:hover {
		background: var(--paper-raised);
		color: var(--ink);
	}
	.theme:active { transform: translateY(1px); }
	.theme:focus-visible {
		outline: 2px solid var(--paper);
		outline-offset: 2px;
		box-shadow: var(--focus-ring);
	}

	.ico {
		width: 1.15rem;
		height: 1.15rem;
		display: block;
	}

	@media (prefers-reduced-motion: reduce) {
		.theme {
			transition: none;
		}
		.theme:active {
			transform: none;
		}
	}

	@media (forced-colors: active) {
		.theme {
			background: Canvas;
			border: 1px solid ButtonBorder;
			color: ButtonText;
		}
		.theme:focus-visible {
			outline: 2px solid Highlight;
			box-shadow: none;
		}
	}
</style>
