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
	aria-describedby="settings-tooltip"
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
	<span id="settings-tooltip" class="tooltip" role="tooltip">Settings</span>
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

	.tooltip {
		position: absolute;
		top: calc(100% + 6px);
		inset-inline-end: 0;
		z-index: 20;
		padding: 0.25rem 0.5rem;
		font-size: 0.75rem;
		font-weight: 500;
		line-height: 1;
		color: var(--ink);
		background: var(--paper-raised);
		border: 1px solid var(--rule-strong);
		border-radius: var(--r-sm);
		box-shadow: var(--shadow-1);
		white-space: nowrap;
		pointer-events: none;
		opacity: 0;
		transform: translateY(-4px);
		transition:
			opacity var(--fast) var(--ease),
			transform var(--fast) var(--ease);
	}

	.settings:hover .tooltip,
	.settings:focus-visible .tooltip {
		opacity: 1;
		transform: translateY(0);
	}

	@media (prefers-reduced-motion: reduce) {
		.tooltip {
			transition: none;
		}
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
		.tooltip {
			background: Canvas;
			color: CanvasText;
			border: 1px solid ButtonBorder;
			box-shadow: none;
		}
	}
</style>
