<script lang="ts">
	import { onDestroy } from 'svelte';
	import type { MouthStep, ZoneId } from '$lib/content/types';

	let { step, onSettle, onNudge }: {
		step: MouthStep;
		onSettle: (teach?: string) => void;
		onNudge: (html: string, soft?: boolean) => void;
	} = $props();

	/** Zone centres and their label positions, in the SVG's 440×300 frame. */
	const ZONES: { id: ZoneId; cx: number; cy: number; tag: string; lx: number; ly: number; lead: string }[] = [
		{ id: 'labial',   cx: 62,  cy: 148, tag: 'lips',        lx: 46,  ly: 210, lead: 'M62,169 L52,200' },
		{ id: 'dental',   cx: 112, cy: 152, tag: 'teeth',       lx: 112, ly: 226, lead: 'M112,173 L112,216' },
		{ id: 'alveolar', cx: 160, cy: 126, tag: 'ridge',       lx: 160, ly: 82,  lead: 'M160,105 L160,92' },
		{ id: 'velar',    cx: 272, cy: 122, tag: 'soft palate', lx: 272, ly: 78,  lead: 'M272,101 L272,88' },
		{ id: 'glottal',  cx: 332, cy: 240, tag: 'throat',      lx: 392, ly: 244, lead: 'M353,240 L378,241' }
	];

	let wrong = $state<ZoneId | null>(null);
	let hover = $state<ZoneId | null>(null);
	let solved = $state(false);
	let wrongTimer = 0;

	const priorLabels = $derived(
		new Map((step.solved ?? []).map((s) => [s.zone, s.jamo]))
	);

	function labelFor(id: ZoneId): string {
		if (solved && id === step.zone) return step.jamo;
		return priorLabels.get(id) ?? '';
	}

	function pick(id: ZoneId) {
		if (solved) return;
		if (id === step.zone) {
			solved = true;
			wrong = null;
			onSettle();
			return;
		}
		wrong = id;
		window.clearTimeout(wrongTimer);
		wrongTimer = window.setTimeout(() => {
			if (wrong === id) wrong = null;
		}, 900);
		onNudge(
			step.miss ??
				'<p>Not there. Say the sound again slowly and notice what touches what.</p>'
		);
	}

	onDestroy(() => window.clearTimeout(wrongTimer));
</script>

<div class="mouth-wrap">
	<svg
		class="mouth"
		viewBox="0 0 440 300"
		aria-hidden="true"
		focusable="false"
	>
		<!-- the air cavity sound travels through -->
		<path
			class="cavity"
			d="M74,126 L96,128 C152,110 212,106 260,116 C296,124 316,144 322,176
			   C326,208 318,236 300,252 C250,240 190,214 140,186 C104,166 82,148 74,126 Z"
		/>
		<!-- hard palate arcing into the soft palate -->
		<path class="anat" d="M68,120 L96,124 C152,106 212,102 260,112 C296,120 318,142 324,178" />
		<!-- back wall of the pharynx -->
		<path class="anat" d="M352,152 C358,202 354,252 342,292" />
		<!-- jaw / floor of the mouth -->
		<path class="anat" d="M66,182 L96,190 C152,272 244,292 304,294" />
		<!-- lips -->
		<path class="anat" d="M66,120 C54,128 52,142 58,150" />
		<path class="anat" d="M64,182 C52,174 50,160 58,150" />
		<!-- teeth -->
		<rect class="tooth" x="84" y="122" width="10" height="18" rx="2" />
		<rect class="tooth" x="84" y="162" width="10" height="18" rx="2" />
		<!-- tongue -->
		<path
			class="tongue"
			d="M100,176 C138,150 182,140 218,147 C256,154 284,178 300,210
			   C312,234 312,256 302,270 L124,270 C108,266 100,248 100,226 Z"
		/>

		{#each ZONES as z (z.id)}
			{@const label = labelFor(z.id)}
			{@const isPrior = priorLabels.has(z.id) && !(solved && z.id === step.zone)}
			<path class="lead" d={z.lead} />
			<circle
				class="zone"
				class:right={!!label}
				class:prior={isPrior}
				class:wrong={wrong === z.id}
				class:hot={hover === z.id && !solved && !isPrior}
				cx={z.cx}
				cy={z.cy}
				r="21"
			/>
			{#if label}
				<text class="jamo-label" lang="ko" x={z.cx} y={z.cy + 9}>{label}</text>
			{/if}
		{/each}
	</svg>

	<div class="zones" role="group" aria-label="place of articulation">
		{#each ZONES as z (z.id)}
			{@const label = labelFor(z.id)}
			{@const isPrior = priorLabels.has(z.id) && !(solved && z.id === step.zone)}
			{@const locked = solved || isPrior}
			<button
				type="button"
				class="hit"
				class:locked
				class:wrong={wrong === z.id}
				disabled={locked}
				style="--cx: {z.cx / 440}; --cy: {z.cy / 300}; --lx: {z.lx / 440}; --ly: {z.ly / 300};"
				aria-label={label ? `${z.tag}, ${label}` : z.tag}
				onmouseenter={() => (hover = z.id)}
				onmouseleave={() => {
					if (hover === z.id) hover = null;
				}}
				onfocus={() => (hover = z.id)}
				onblur={() => {
					if (hover === z.id) hover = null;
				}}
				onclick={() => pick(z.id)}
			>
				<span class="callout">{z.tag}</span>
				<span class="dot" aria-hidden="true"></span>
			</button>
		{/each}
	</div>
</div>

<div class="miss-slot">
	{#if wrong}
		<p class="local-miss">Not there. Try another spot.</p>
	{/if}
</div>

<style>
	.mouth-wrap {
		position: relative;
		width: 100%;
		max-width: 30rem;
		margin: 0 auto;
	}

	.mouth { display: block; width: 100%; height: auto; }

	/* The anatomy stays neutral — only the zones carry colour, or the drawing
	   reads as an unidentifiable coloured blob. */
	.anat { fill: none; stroke: var(--ink-faint); stroke-width: 2; stroke-linecap: round; }
	.tongue { fill: var(--paper-sunk); stroke: var(--ink-faint); stroke-width: 1.6; }
	.cavity { fill: var(--ink); opacity: 0.05; }
	.tooth { fill: var(--paper); stroke: var(--ink-faint); stroke-width: 1.3; }
	.lead { fill: none; stroke: var(--ink-faint); stroke-width: 1; opacity: 0.5; }

	.zone {
		fill: var(--blue);
		fill-opacity: 0.13;
		stroke: var(--blue);
		stroke-width: 1.6;
		stroke-dasharray: 4 3;
		pointer-events: none;
		transition: fill-opacity var(--fast) var(--ease), stroke-width var(--fast) var(--ease);
	}
	.zone.hot { fill-opacity: 0.3; stroke-width: 2.4; }

	.zone.right {
		fill: var(--good);
		fill-opacity: 0.34;
		stroke: var(--good);
		stroke-dasharray: none;
		stroke-width: 2.4;
	}
	.zone.prior { fill-opacity: 0.12; stroke-opacity: 0.45; }

	.zone.wrong {
		fill: var(--bad);
		fill-opacity: 0.3;
		stroke: var(--bad);
		stroke-dasharray: none;
	}

	.jamo-label {
		font-family: var(--hangul);
		font-size: 26px;
		font-weight: 600;
		fill: var(--good);
		text-anchor: middle;
		pointer-events: none;
	}

	.zones {
		position: absolute;
		inset: 0;
		container-type: size;
	}

	/* Include :active so a global `button:active { transform }` cannot replace
	   the centering translate — that jump drops the click on mouseup. */
	.hit,
	.hit:active:not(:disabled) {
		appearance: none;
		-webkit-appearance: none;
		position: absolute;
		left: calc(var(--lx) * 100%);
		top: calc(var(--ly) * 100%);
		transform: translate(-50%, -50%);
		margin: 0;
		padding: 0;
		border: 0;
		background: transparent;
		color: inherit;
		cursor: pointer;
		overflow: visible;
	}
	.hit.locked { cursor: default; }

	.callout {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 44px;
		padding: 0.3rem 0.55rem;
		border: 1px solid var(--rule-strong);
		border-radius: var(--r-pill);
		background: var(--paper-raised);
		box-shadow: var(--shadow-1);
		font-family: var(--sans);
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.04em;
		color: var(--ink-soft);
		white-space: nowrap;
		line-height: 1;
		transition: border-color var(--fast) var(--ease), background var(--fast) var(--ease),
			color var(--fast) var(--ease);
	}

	.dot {
		position: absolute;
		left: calc(50% + (var(--cx) - var(--lx)) * 100cqw);
		top: calc(50% + (var(--cy) - var(--ly)) * 100cqh);
		width: 2.75rem;
		height: 2.75rem;
		transform: translate(-50%, -50%);
		border-radius: 50%;
	}

	.hit:hover:not(:disabled) .callout,
	.hit:focus-visible .callout {
		border-color: var(--accent);
		color: var(--ink);
	}

	.hit.wrong .callout {
		border-color: var(--bad);
		background: var(--bad-soft);
		color: var(--bad);
	}

	.hit.locked .callout {
		opacity: 0.55;
		box-shadow: none;
	}

	.hit:focus-visible {
		outline: none;
		box-shadow: none;
	}
	.hit:focus-visible .callout {
		outline: 2px solid var(--paper);
		outline-offset: 2px;
		box-shadow: 0 0 0 4px var(--blue);
	}
	.hit:focus-visible .dot {
		box-shadow: 0 0 0 4px var(--blue);
	}

	.miss-slot {
		min-height: 1.4em;
		margin: var(--s2) auto 0;
		max-width: 30rem;
		text-align: center;
	}
	.local-miss {
		margin: 0;
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--bad);
	}

	@media (forced-colors: active) {
		.zone {
			fill: Canvas;
			fill-opacity: 1;
			stroke: ButtonText;
			stroke-dasharray: none;
			stroke-width: 2;
		}
		.zone.right { fill: Highlight; stroke: HighlightText; }
		.zone.wrong { stroke: ButtonText; stroke-width: 3; }
		.callout {
			background: ButtonFace;
			color: ButtonText;
			border: 1px solid ButtonText;
		}
		.hit.wrong .callout {
			border-width: 3px;
		}
		.hit:focus-visible .callout {
			outline: 2px solid Highlight;
			box-shadow: none;
		}
	}
</style>
