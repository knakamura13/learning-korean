<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	const onSettings = $derived(
		page.url.pathname === '/settings' || page.url.pathname === '/settings/'
	);
</script>

<a
	href={resolve('/settings')}
	class="settings"
	aria-label="Settings"
	title="Settings"
	aria-current={onSettings ? 'page' : undefined}
>
	<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">
		<circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" stroke-width="2" />
		<path
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			d="M5.5 20.5c1.2-3.2 3.4-5 6.5-5s5.3 1.8 6.5 5"
		/>
	</svg>
</a>

<style>
	.settings {
		position: relative;
		display: inline-flex;
		appearance: none;
		align-items: center;
		justify-content: center;
		width: 44px;
		min-width: 44px;
		min-height: 44px;
		padding: 0;
		border: none;
		border-radius: var(--r-sm);
		background: transparent;
		color: var(--accent);
		cursor: pointer;
		flex-shrink: 0;
		text-decoration: none;
		transition: color var(--fast) var(--ease);
	}
	.settings::before {
		content: '';
		position: absolute;
		inset: 0.25rem;
		border: 1px solid var(--rule-strong);
		border-radius: var(--r-sm);
		background: var(--paper);
		pointer-events: none;
		transition:
			background var(--fast) var(--ease),
			border-color var(--fast) var(--ease);
	}
	.settings:hover {
		color: var(--ink);
	}
	.settings:hover::before {
		background: var(--paper-raised);
		border-color: var(--accent);
	}
	.settings:active { transform: translateY(1px); }
	.settings:focus-visible {
		outline: none;
		box-shadow: none;
	}
	.settings:focus-visible::before {
		outline: 2px solid var(--paper);
		outline-offset: 2px;
		box-shadow: var(--focus-ring);
	}

	.ico {
		position: relative;
		z-index: 1;
		width: 1.05rem;
		height: 1.05rem;
		display: block;
	}

	@media (prefers-reduced-motion: reduce) {
		.settings,
		.settings::before {
			transition: none;
		}
		.settings:active {
			transform: none;
		}
	}

	@media (forced-colors: active) {
		.settings {
			background: transparent;
			border: none;
			color: ButtonText;
		}
		.settings::before {
			background: Canvas;
			border: 1px solid ButtonBorder;
		}
		.settings:focus-visible::before {
			outline: 2px solid Highlight;
			box-shadow: none;
		}
	}
</style>
