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
		{ id: 'labial',   cx: 62,  cy: 148, tag: 'lips',        lx: 36,  ly: 214, lead: 'M62,169 L42,202' },
		{ id: 'dental',   cx: 112, cy: 152, tag: 'teeth',       lx: 112, ly: 236, lead: 'M112,173 L112,224' },
		{ id: 'alveolar', cx: 160, cy: 126, tag: 'ridge',       lx: 168, ly: 40,  lead: 'M160,105 L166,52' },
		{ id: 'velar',    cx: 272, cy: 122, tag: 'soft palate', lx: 318, ly: 44,  lead: 'M272,101 L308,54' },
		{ id: 'glottal',  cx: 332, cy: 240, tag: 'throat',      lx: 400, ly: 248, lead: 'M353,240 L386,244' }
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
		<clipPath id="mouth-airway">
			<path
				d="M68,147
				   C86,136 104,130 124,130
				   C146,130 154,134 160,126
				   C176,112 226,108 272,122
				   C294,132 316,160 326,198
				   C334,228 334,254 328,274
				   C296,266 244,246 194,224
				   C144,202 104,176 80,160
				   C70,152 68,148 68,147 Z"
			/>
		</clipPath>

		<!-- nasal tunnel and oral/pharyngeal airway sit behind the tissue -->
		<path
			class="nasal"
			d="M36,130
			   C56,114 96,96 148,86
			   C204,76 256,84 286,108
			   C272,116 230,104 176,106
			   C122,108 78,118 52,130
			   C44,132 38,132 36,130 Z"
		/>
		<path
			class="cavity"
			d="M68,147
			   C86,136 104,130 124,130
			   C146,130 154,134 160,126
			   C176,112 226,108 272,122
			   C294,132 316,160 326,198
			   C334,228 334,254 328,274
			   C296,266 244,246 194,224
			   C144,202 104,176 80,160
			   C70,152 68,148 68,147 Z"
		/>

		<!--
			Midsagittal face: nose, upper lip, palate, velum.
			The cranial vault is cut away so this reads as a mouth, not a head.
			The even-odd hole is the nasal cavity, open toward the nostril.
		-->
		<path
			class="flesh"
			fill-rule="evenodd"
			d="M96,28
			   C72,34 58,52 54,72
			   C50,88 40,100 24,112
			   C8,122 6,132 20,138
			   C32,142 44,138 48,146
			   C36,148 28,154 38,160
			   C50,164 66,156 78,148
			   C96,138 112,133 126,132
			   C146,130 154,134 160,126
			   C174,112 222,106 258,114
			   C270,118 274,120 276,128
			   C282,144 292,162 300,176
			   C304,186 300,192 294,186
			   C288,176 290,162 296,152
			   C314,158 334,186 340,224
			   C346,252 344,274 332,290
			   C360,278 378,240 374,190
			   C370,128 348,72 300,42
			   C230,16 150,14 96,28 Z
			   M36,130
			   C56,114 96,96 148,86
			   C204,76 256,84 286,108
			   C272,116 230,104 176,106
			   C122,108 78,118 52,130
			   C44,132 38,132 36,130 Z"
		/>

		<!-- mandible: lower lip, chin, floor of the mouth -->
		<path
			class="flesh"
			d="M76,156
			   C56,158 32,164 30,178
			   C30,194 38,210 52,224
			   C72,244 104,262 146,274
			   C196,288 256,292 314,282
			   C304,264 272,248 230,236
			   C180,220 128,192 96,172
			   C86,164 80,158 76,156 Z"
		/>

		<path class="turbinate" d="M58,124 C100,108 160,100 220,106" />
		<path class="turbinate" d="M70,130 C112,118 168,112 222,116" />

		<!-- alveolar bump → hard palate → hanging velum -->
		<path
			class="anat"
			d="M100,133
			   C122,129 146,133 160,126
			   C176,112 226,108 272,122
			   C288,130 304,150 312,172"
		/>
		<path
			class="uvula"
			d="M296,152 C302,166 302,182 296,192 C290,180 286,164 292,152 Z"
		/>
		<path class="anat" d="M352,168 C362,220 356,266 340,294" />
		<path class="anat" d="M300,198 C308,206 312,218 308,230" />
		<ellipse class="nostril" cx="22" cy="132" rx="7" ry="5" transform="rotate(-22 22 132)" />

		<g clip-path="url(#mouth-airway)">
			<path
				class="tongue"
				d="M118,168
				   C130,150 152,136 176,142
				   C214,150 252,168 280,200
				   C298,224 302,250 294,266
				   C264,274 216,268 170,254
				   C136,242 116,216 112,188
				   C110,176 112,170 118,168 Z"
			/>
			<path class="tongue-line" d="M128,174 C166,156 218,168 256,202" />
		</g>

		<!-- lip tissue in profile — comma-shaped pads, not floating ovals -->
		<path
			class="lip"
			d="M72,140
			   C52,134 36,138 30,146
			   C28,151 40,154 62,150
			   C70,148 76,144 72,140 Z"
		/>
		<path
			class="lip"
			d="M62,150
			   C44,154 30,162 32,174
			   C36,184 54,180 70,166
			   C76,158 72,152 62,150 Z"
		/>

		<!-- sagittal incisors: shovel crowns planted in the gum -->
		<path
			class="tooth"
			d="M104,128 L110,124 L118,124 L122,130 L120,152 C118,158 114,160 110,160 C106,160 104,156 102,150 Z"
		/>
		<path
			class="tooth"
			d="M104,176 L110,180 L118,180 L122,174 L120,154 C118,148 114,146 110,146 C106,146 104,150 102,154 Z"
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

	/* Anatomy stays in paper/ink so only the zones carry meaning-colour. */
	.flesh {
		fill: var(--paper-sunk);
		stroke: var(--ink-faint);
		stroke-width: 1.7;
		stroke-linejoin: round;
	}
	.nasal { fill: var(--ink); fill-opacity: 0.06; }
	.cavity { fill: var(--ink); fill-opacity: 0.08; }
	.tongue {
		fill: var(--paper-raised);
		stroke: var(--ink-faint);
		stroke-width: 1.5;
		stroke-linejoin: round;
	}
	.tongue-line {
		fill: none;
		stroke: var(--ink-faint);
		stroke-width: 1.1;
		stroke-linecap: round;
		opacity: 0.55;
	}
	.lip {
		fill: var(--paper-raised);
		stroke: var(--ink-faint);
		stroke-width: 1.4;
		stroke-linejoin: round;
	}
	.uvula {
		fill: var(--paper-sunk);
		stroke: var(--ink-faint);
		stroke-width: 1.3;
		stroke-linejoin: round;
	}
	.tooth {
		fill: var(--paper);
		stroke: var(--ink-faint);
		stroke-width: 1.15;
		stroke-linejoin: round;
	}
	.anat {
		fill: none;
		stroke: var(--ink-faint);
		stroke-width: 1.7;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.turbinate {
		fill: none;
		stroke: var(--ink-faint);
		stroke-width: 1.1;
		stroke-linecap: round;
		opacity: 0.65;
	}
	.nostril {
		fill: var(--ink);
		fill-opacity: 0.12;
		stroke: var(--ink-faint);
		stroke-width: 1.1;
	}
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

	.hit {
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
		.flesh,
		.tongue,
		.lip,
		.uvula,
		.tooth,
		.nostril {
			fill: Canvas;
			stroke: ButtonText;
		}
		.nasal,
		.cavity {
			fill: Canvas;
			fill-opacity: 1;
			stroke: ButtonText;
			stroke-dasharray: 3 3;
		}
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
