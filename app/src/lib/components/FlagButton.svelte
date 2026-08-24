<script lang="ts">
	let {
		active = false,
		disabled = false,
		label = 'Flag for review',
		onclick
	}: {
		active?: boolean;
		disabled?: boolean;
		label?: string;
		onclick: () => void;
	} = $props();
</script>

<button
	type="button"
	class="flag-btn"
	class:active
	{disabled}
	aria-pressed={active}
	aria-label={active ? 'Remove review flag' : label}
	title={active ? 'Remove review flag' : label}
	{onclick}
>
	<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
		{#if active}
			<path
				d="M3.5 1.5v13M3.5 1.5h7.2l-1.4 2.6 1.4 2.6H3.5"
				fill="currentColor"
				stroke="currentColor"
				stroke-width="1.4"
				stroke-linejoin="round"
			/>
		{:else}
			<path
				d="M3.5 1.5v13M3.5 1.5h7.2l-1.4 2.6 1.4 2.6H3.5"
				fill="none"
				stroke="currentColor"
				stroke-width="1.4"
				stroke-linejoin="round"
			/>
		{/if}
	</svg>
</button>

<style>
	.flag-btn {
		appearance: none;
		display: inline-grid;
		place-items: center;
		width: 44px;
		height: 44px;
		padding: 0;
		border: 1px solid transparent;
		border-radius: var(--r-md);
		background: transparent;
		color: var(--ink-faint);
		cursor: pointer;
		flex: 0 0 auto;
	}
	.flag-btn:hover:not(:disabled),
	.flag-btn:focus-visible {
		color: var(--ink);
		border-color: var(--rule);
		background: var(--paper-sunk);
	}
	.flag-btn.active {
		color: var(--rose);
	}
	.flag-btn:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
	.flag-btn svg {
		width: 1.05rem;
		height: 1.05rem;
	}

	@media (forced-colors: active) {
		.flag-btn {
			color: ButtonText;
			border-color: ButtonBorder;
		}
		.flag-btn.active {
			color: Highlight;
		}
	}
</style>
