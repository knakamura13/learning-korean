<script lang="ts">
	import { onMount } from 'svelte';
	import { applyTheme, readThemePref, writeThemePref, type ThemePref } from '$lib/theme';

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
</script>

<div class="theme" role="radiogroup" aria-label="Theme">
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

<style>
	.theme {
		display: inline-flex;
		align-items: stretch;
		border: 1px solid var(--rule);
		border-radius: var(--r-sm);
		background: var(--paper-sunk);
		flex-shrink: 0;
	}

	button {
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

	button:hover { color: var(--ink); background: var(--paper-raised); }
	button:active { transform: translateY(0); }
	button.on {
		background: var(--paper-raised);
		color: var(--accent);
		box-shadow: var(--shadow-1);
	}
	button:focus-visible,
	button.on:focus-visible {
		outline: 2px solid var(--paper);
		outline-offset: 2px;
		box-shadow: 0 0 0 4px var(--blue);
	}

	@media (max-width: 30rem) {
		button { padding: 0 0.4rem; font-size: 0.66rem; }
	}

	@media (forced-colors: active) {
		.theme {
			background: Canvas;
			border: 1px solid ButtonBorder;
		}
		button { color: ButtonText; background: Canvas; }
		button.on {
			background: Highlight;
			color: HighlightText;
			box-shadow: none;
		}
		button:focus-visible,
		button.on:focus-visible {
			outline: 2px solid Highlight;
			box-shadow: none;
		}
	}
</style>
