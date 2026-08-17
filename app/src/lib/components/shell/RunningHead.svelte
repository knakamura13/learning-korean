<script lang="ts">
	import { resolve } from '$app/paths';
	import { fascicle } from '$lib/stores/fascicle.svelte';
	import { folioPipTooltip, type FolioPip } from '$lib/domain/sitting';
	import type { ContinueAction } from '$lib/domain/courseNav';

	let {
		folio,
		pip,
		kind,
		sittingTitle
	}: {
		folio: string;
		pip: FolioPip;
		kind: ContinueAction['kind'];
		sittingTitle: string;
	} = $props();

	const pipTitle = $derived(folioPipTooltip(kind));

	function onKey(e: KeyboardEvent) {
		if (e.key === 'Escape' && (fascicle.tocOpen || fascicle.colophonOpen)) {
			fascicle.setToc(false);
			fascicle.setColophon(false);
		}
	}
</script>

<svelte:window onkeydown={onKey} />

<header class="running-head">
	<div class="inner">
		<div class="brand">
			<a class="name" href={resolve('/')} title={sittingTitle || 'Korean'}>Korean</a>
			<button
				type="button"
				class="han"
				lang="ko"
				title="Index of letters — does not leave the sitting."
				aria-expanded={fascicle.tocOpen}
				aria-controls="toc-flyleaf"
				onclick={() => fascicle.toggleToc()}
			>
				한
			</button>
		</div>

		<div class="folio" title={sittingTitle}>
			<span class="pip" data-tone={pip} title={pipTitle} aria-hidden="true"></span>
			{#key folio}
				<span class="folio-text">{folio}</span>
			{/key}
			<span class="vh">{pipTitle}</span>
		</div>

		<nav class="apparatus" aria-label="Fascicle apparatus">
			<button
				type="button"
				class="head-link"
				aria-expanded={fascicle.tocOpen}
				aria-controls="toc-flyleaf"
				onclick={() => fascicle.toggleToc()}
			>
				ToC
			</button>
			<button
				type="button"
				class="head-link"
				aria-expanded={fascicle.colophonOpen}
				aria-controls="colophon"
				onclick={() => fascicle.toggleColophon()}
			>
				¶
			</button>
		</nav>
	</div>
</header>

<style>
	.running-head {
		position: sticky;
		top: 0;
		z-index: 8;
		height: 44px;
		padding-top: env(safe-area-inset-top);
		background-color: color-mix(in srgb, var(--paper) 92%, transparent);
		background-image: var(--grain);
		border-block-end: 1px solid var(--rule-strong);
	}

	.inner {
		height: 44px;
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		width: min(100%, var(--spread));
		margin-inline: auto;
		padding-inline: max(var(--s4), env(safe-area-inset-left)) max(var(--s4), env(safe-area-inset-right));
		gap: var(--s2);
	}

	.brand {
		display: flex;
		align-items: center;
		gap: var(--s2);
		min-width: 0;
	}

	.name {
		font-family: var(--display);
		font-style: italic;
		font-size: 16px;
		font-weight: 400;
		color: var(--ink);
		text-decoration: none;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 42ch;
	}
	.name:hover {
		color: var(--ink);
		text-decoration: underline;
		text-decoration-thickness: 2px;
	}

	.han {
		appearance: none;
		border: 0;
		background: transparent;
		color: var(--accent);
		font-family: var(--hangul);
		font-size: 18px;
		font-weight: 500;
		line-height: 1;
		min-width: 44px;
		min-height: 44px;
		padding: 0;
		cursor: pointer;
	}
	.han:hover {
		color: color-mix(in srgb, var(--accent) 88%, var(--ink));
	}

	.folio {
		display: flex;
		align-items: center;
		gap: var(--s2);
		font-family: var(--mono);
		font-size: 11px;
		font-weight: 500;
		font-variant-numeric: tabular-nums;
		letter-spacing: 0.04em;
		color: var(--ink-soft);
		min-width: 0;
	}

	.folio-text {
		display: inline-block;
		min-width: 3ch;
		text-align: end;
		animation: folio-swap var(--med) var(--ease);
	}

	@keyframes folio-swap {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.pip {
		width: 6px;
		height: 6px;
		border-radius: var(--r-pill);
		flex: 0 0 auto;
		background: var(--accent);
	}
	.pip[data-tone='rose'] { background: var(--rose); }
	.pip[data-tone='good'] { background: var(--good); }
	.pip[data-tone='moss'] { background: var(--accent); }

	.apparatus {
		display: flex;
		justify-content: flex-end;
		gap: var(--s1);
	}

	.head-link {
		appearance: none;
		border: 0;
		background: transparent;
		min-width: 44px;
		min-height: 44px;
		padding: 0 var(--s2);
		font-family: var(--sans);
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--ink-soft);
		cursor: pointer;
		text-decoration: underline;
		text-decoration-thickness: 1px;
		text-underline-offset: 0.18em;
	}
	.head-link:hover {
		color: var(--ink);
		text-decoration-thickness: 2px;
	}
	.head-link:active {
		color: var(--ink);
	}

	.vh {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	@media (forced-colors: active) {
		.running-head {
			background: Canvas;
			background-image: none;
			border-block-end: 1px solid CanvasText;
		}
		.han { color: Highlight; }
		.pip[data-tone='moss'] { background: Highlight; }
		.pip[data-tone='rose'] { background: LinkText; }
		.pip[data-tone='good'] { background: Highlight; }
		.head-link { color: CanvasText; }
	}
</style>
