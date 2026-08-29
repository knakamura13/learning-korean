<script lang="ts">
	import { attachPipRail } from '$lib/components/labRunnerPipRail.svelte';
	import type { LabPhase } from '$lib/content/types';
	import { cardInActivePhase, phaseAt } from '$lib/domain/labPhase';
	import { pipIsJumpTarget, pipKind, pipLabel, type CardOutcome } from '$lib/domain/pipState';

	let {
		stepCount,
		index,
		outcomes,
		furthest,
		phases,
		onJump
	}: {
		stepCount: number;
		index: number;
		outcomes: (CardOutcome | null)[];
		furthest: number;
		phases: LabPhase[];
		onJump: (i: number) => void;
	} = $props();

	let fadeLeft = $state(false);
	let fadeRight = $state(false);

	const keepSelectedVisible = attachPipRail(
		() => index,
		() => furthest,
		(left, right) => {
			fadeLeft = left;
			fadeRight = right;
		}
	);
</script>

<nav class="rail-wrap" aria-label="Lab card navigation, {phaseAt(phases, index).title}">
	<div class={['rail-clip', { 'fade-left': fadeLeft, 'fade-right': fadeRight }]}>
		<ol class="rail" {@attach keepSelectedVisible}>
			{#each { length: stepCount }, i (i)}
				{@const kind = pipKind(i, outcomes, furthest)}
				{@const selected = i === index}
				{@const inPhase = cardInActivePhase(phases, i, index)}
				<li>
					{#if pipIsJumpTarget(kind) || selected}
						<button
							type="button"
							class="pip"
							data-kind={kind}
							data-phase={inPhase ? 'current' : 'other'}
							data-selected={selected || undefined}
							aria-current={selected ? 'step' : undefined}
							aria-label={pipLabel(kind, i + 1, selected)}
							onclick={() => onJump(i)}
						>
							<span class="pip-n">{i + 1}</span>
						</button>
					{:else}
						<span class="pip" data-kind={kind} data-phase={inPhase ? 'current' : 'other'}>
							<span class="pip-n" aria-hidden="true">{i + 1}</span>
							<span class="vh">{pipLabel(kind, i + 1)}</span>
						</span>
					{/if}
				</li>
			{/each}
		</ol>
	</div>
	<span class="where">Card {index + 1} of {stepCount}</span>
</nav>

<style>
	.rail-wrap {
		--rail-feather: 0.75rem;
		display: flex;
		align-items: center;
		gap: var(--s2);
		margin-bottom: var(--s4);
		flex-wrap: nowrap;
		min-width: 0;
	}

	.rail-clip {
		position: relative;
		flex: 1 1 auto;
		min-width: 0;
		overflow: hidden;
		background-color: var(--paper);
		/* Always feather both ends so the selected pip's glow is not
		   hard-clipped when that side has nothing left to scroll.
		   Overflowing sides use a longer fade to hide pip slivers. */
		-webkit-mask-repeat: no-repeat;
		mask-repeat: no-repeat;
		-webkit-mask-size: 100% 100%;
		mask-size: 100% 100%;
		-webkit-mask-image: linear-gradient(
			to right,
			transparent,
			#000 0.75rem,
			#000 calc(100% - 0.75rem),
			transparent
		);
		mask-image: linear-gradient(
			to right,
			transparent,
			#000 0.75rem,
			#000 calc(100% - 0.75rem),
			transparent
		);
	}
	.rail-clip.fade-right {
		-webkit-mask-image: linear-gradient(
			to right,
			transparent,
			#000 0.75rem,
			#000 calc(100% - 1.15rem),
			transparent
		);
		mask-image: linear-gradient(
			to right,
			transparent,
			#000 0.75rem,
			#000 calc(100% - 1.15rem),
			transparent
		);
	}
	.rail-clip.fade-left {
		-webkit-mask-image: linear-gradient(
			to right,
			transparent,
			#000 0.9rem,
			#000 calc(100% - 0.75rem),
			transparent
		);
		mask-image: linear-gradient(
			to right,
			transparent,
			#000 0.9rem,
			#000 calc(100% - 0.75rem),
			transparent
		);
	}
	.rail-clip.fade-left.fade-right {
		-webkit-mask-image: linear-gradient(
			to right,
			transparent,
			#000 0.9rem,
			#000 calc(100% - 1.15rem),
			transparent
		);
		mask-image: linear-gradient(
			to right,
			transparent,
			#000 0.9rem,
			#000 calc(100% - 1.15rem),
			transparent
		);
	}

	.rail {
		display: flex;
		align-items: center;
		flex-wrap: nowrap;
		min-width: 0;
		margin: 0;
		padding: 0.45rem 0 0.35rem;
		list-style: none;
		overflow-x: auto;
		overflow-y: hidden;
		overscroll-behavior-x: contain;
		scrollbar-width: thin;
		scrollbar-color: var(--rule-strong) transparent;
		background-color: var(--paper);
	}
	.rail::before,
	.rail::after {
		content: '';
		flex: 0 0 var(--rail-feather);
		align-self: stretch;
		pointer-events: none;
	}
	.rail::-webkit-scrollbar {
		height: 4px;
	}
	.rail::-webkit-scrollbar-thumb {
		background: var(--rule-strong);
		border-radius: 2px;
	}

	.rail li { display: flex; flex: 0 0 auto; padding-inline: 0.5rem; }

	.pip {
		appearance: none;
		-webkit-appearance: none;
		box-sizing: border-box;
		isolation: isolate;
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		margin: 0;
		border: 0;
		border-radius: 0;
		background: transparent;
		min-width: 44px;
		min-height: 44px;
		padding: 0;
		overflow: visible;
		font: inherit;
		font-size: 0.72rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		line-height: 1;
		color: var(--ink-faint);
		cursor: default;
	}
	button.pip { cursor: pointer; }
	/* Hover filter stays off the selected pip so it cannot clip the glow. */
	button.pip:not([data-selected]):hover { filter: brightness(1.08); }
	button.pip:not([data-selected]):active {
		filter: brightness(0.96);
	}

	/* Status mark. Centered with inset so selected pulse/glow can use
	   transform + drop-shadow on this one box — no second ring. */
	.pip::before {
		content: '';
		position: absolute;
		display: block;
		inset: 0;
		margin: auto;
		width: 1.55rem;
		height: 1.55rem;
		border-radius: 50%;
		border: 2px solid transparent;
		background: transparent;
		pointer-events: none;
		transform-origin: center;
		--pip-glow: var(--ink-faint);
	}
	.pip[data-kind='upcoming']::before { content: none; }

	.pip[data-kind='right'] { color: var(--paper); }
	.pip[data-kind='right']::before {
		background: var(--good);
		border-color: var(--good);
		--pip-glow: var(--good);
	}
	.pip[data-kind='wrong'] { color: var(--bad); }
	.pip[data-kind='wrong']::before {
		background: transparent;
		border-color: var(--bad);
		--pip-glow: var(--bad);
	}
	.pip[data-kind='visited'] { color: var(--ink-soft); }
	.pip[data-kind='visited']::before {
		border-color: var(--rule-strong);
		--pip-glow: var(--ink-faint);
	}
	.pip[data-kind='upcoming'] { font-weight: 500; }
	.pip-n { position: relative; z-index: 1; }
	.pip[data-phase='other'] { opacity: 0.4; }

	button.pip:not([data-selected]):not(:focus-visible):hover::before {
		transform: scale(1.03);
	}

	.pip[data-selected]::before,
	button.pip:focus-visible::before {
		filter: drop-shadow(0 0 8px color-mix(in srgb, var(--pip-glow) 50%, transparent));
		animation: pip-pulse 1.8s var(--ease-in-out) infinite;
	}
	.pip:focus-visible {
		outline: 2px solid var(--paper);
		outline-offset: 2px;
		box-shadow: var(--focus-ring);
		border-radius: 0;
	}

	@keyframes pip-pulse {
		0%,
		100% { transform: scale(1); }
		50% { transform: scale(1.08); }
	}

	@media (prefers-reduced-motion: reduce) {
		.pip[data-selected]::before,
		button.pip:focus-visible::before {
			animation: none;
			width: calc(1.55rem + 2px);
			height: calc(1.55rem + 2px);
			border-width: 3px;
		}
		button.pip:not([data-selected]):not(:focus-visible):hover::before {
			transform: none;
		}
	}

	@media (forced-colors: active) {
		.rail-clip {
			-webkit-mask-image: none;
			mask-image: none;
		}
		.pip[data-kind='upcoming'] { color: GrayText; }
		.pip[data-kind='right'] { color: Canvas; }
		.pip[data-kind='right']::before { background: Highlight; border-color: Highlight; }
		.pip[data-kind='wrong'] { color: ButtonText; }
		.pip[data-kind='wrong']::before { background: Canvas; border-color: ButtonText; }
		.pip[data-selected]::before,
		button.pip:focus-visible::before { border-color: ButtonText; }
		.pip[data-phase='other'] {
			opacity: 1;
			color: GrayText;
		}
		.pip[data-phase='other']::before {
			background: Canvas;
			border-color: GrayText;
		}
	}

	.where {
		flex: 0 0 auto;
		margin-inline-start: 0;
		min-width: 5.8rem;
		font-size: 0.7rem;
		letter-spacing: 0.03em;
		text-transform: uppercase;
		color: var(--ink-faint);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
		text-align: end;
	}

	@media (max-width: 40rem) {
		.rail-wrap {
			margin-bottom: var(--s2);
		}
	}
</style>
