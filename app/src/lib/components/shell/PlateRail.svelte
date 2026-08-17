<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	import type { PlateView } from '$lib/domain/plateCatalog';

	let { plates }: { plates: PlateView[] } = $props();
</script>

<nav class="rail" aria-label="Plate numbers">
	<ol>
		{#each plates as plate, i (plate.id)}
			<li style:--stagger="{i}">
				{#if plate.locked}
					<span
						class="pip"
						data-tone={plate.tone}
						title={plate.tooltip}
					>
						{plate.label}
					</span>
				{:else}
					<a
						class="pip"
						data-tone={plate.tone}
						href={resolve(plate.href as Pathname)}
						title={plate.tooltip}
						aria-current={plate.tone === 'current' ? 'page' : undefined}
					>
						{plate.label}
					</a>
				{/if}
			</li>
		{/each}
	</ol>
</nav>

<style>
	.rail {
		min-width: 0;
	}

	ol {
		display: flex;
		gap: var(--s2);
		list-style: none;
		margin: 0;
		padding: var(--s2) 0;
		overflow-x: auto;
		overscroll-behavior-x: contain;
		scrollbar-width: thin;
		scroll-snap-type: x proximity;
	}

	li {
		flex: 0 0 auto;
		scroll-snap-align: start;
		animation: pip-in var(--med) var(--ease) both;
		animation-delay: calc(var(--stagger) * 40ms);
	}

	@keyframes pip-in {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.pip {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		position: relative;
		width: 44px;
		height: 44px;
		min-width: 44px;
		min-height: 44px;
		font-family: var(--mono);
		font-size: 11px;
		font-weight: 500;
		font-variant-numeric: tabular-nums;
		text-decoration: none;
		color: var(--accent);
		border: 0;
		background: transparent;
	}
	.pip:hover {
		color: color-mix(in srgb, var(--accent) 88%, var(--ink));
		text-decoration: none;
	}

	.pip[data-tone='locked'] {
		color: var(--ink-faint);
		opacity: 0.55;
		cursor: default;
	}
	.pip[data-tone='done'] { color: var(--good); }
	.pip[data-tone='in-progress'],
	.pip[data-tone='start'],
	.pip[data-tone='current'] { color: var(--accent); }
	.pip[data-tone='due'] { color: var(--rose); }

	.pip[data-tone='current']::before {
		content: '';
		position: absolute;
		inset-inline-start: 0;
		top: 50%;
		width: 2px;
		height: 12px;
		margin-block-start: -6px;
		background: var(--accent);
	}

	@media (min-width: 72rem) {
		.rail {
			position: sticky;
			top: 56px;
			width: 56px;
			padding-top: var(--s7);
		}
		ol {
			flex-direction: column;
			overflow: visible;
			gap: var(--s2);
			padding: 0;
		}
	}

	@media (forced-colors: active) {
		.pip[data-tone='locked'] { color: GrayText; opacity: 1; }
		.pip[data-tone='done'] { color: Highlight; }
		.pip[data-tone='due'] { color: LinkText; }
		.pip[data-tone='current']::before { background: Highlight; }
	}
</style>
