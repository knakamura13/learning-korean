<script lang="ts">
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
	let solved = $state(false);

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
			onSettle();
		} else {
			wrong = id;
			setTimeout(() => (wrong = null), 700);
			onNudge(
				step.miss ??
					'<p>Not there. Say the sound again slowly and notice what touches what.</p>'
			);
		}
	}
</script>

<svg
	class="mouth"
	viewBox="0 0 440 300"
	role="group"
	aria-label="cross-section of the mouth and throat, facing left"
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
			class:locked={solved || isPrior}
			cx={z.cx}
			cy={z.cy}
			r="21"
			role="button"
			tabindex={solved || isPrior ? -1 : 0}
			aria-label={z.tag}
			onclick={() => pick(z.id)}
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					pick(z.id);
				}
			}}
		/>
		<text class="tag" x={z.lx} y={z.ly}>{z.tag}</text>
		{#if label}
			<text class="jamo-label" x={z.cx} y={z.cy + 9}>{label}</text>
		{/if}
	{/each}
</svg>

<style>
	.mouth { display: block; width: 100%; max-width: 30rem; margin: 0 auto var(--s3); }

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
		cursor: pointer;
		transition: fill-opacity var(--fast) var(--ease), stroke-width var(--fast) var(--ease);
	}
	.zone:hover:not(.locked) { fill-opacity: 0.3; stroke-width: 2.4; }
	.zone.locked { cursor: default; pointer-events: none; }

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

	.tag {
		font-family: var(--sans);
		font-size: 12px;
		letter-spacing: 0.05em;
		fill: var(--ink-faint);
		text-anchor: middle;
		pointer-events: none;
	}
</style>
