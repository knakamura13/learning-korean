<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import SprintChoices from '$lib/components/SprintChoices.svelte';
	import { TIERS } from '$lib/domain/deck';
	import { millEligible, millMissingLab, millPool, pronTrialSource } from '$lib/domain/pronMill';
	import {
		answerRoundFrom,
		blockTrialSource,
		idleRound,
		sprintEligible,
		sprintInventory,
		sprintMissingLab,
		sprintScore,
		startRoundFrom,
		tickRound,
		type TrialSource
	} from '$lib/domain/sprint';
	import { progress } from '$lib/stores/progress.svelte';

	type Lane = 'blocks' | 'sounds';

	let ready = $state(false);
	let lane = $state<Lane>('blocks');
	let round = $state(idleRound());
	let running = $state(false);
	let now = $state(0);

	const unlocked = $derived(TIERS.map((t) => t.id).filter((tier) => progress.isUnlocked(tier)));
	const missing = $derived(lane === 'blocks' ? sprintMissingLab(unlocked) : millMissingLab(unlocked));
	const eligible = $derived(lane === 'blocks' ? sprintEligible(unlocked) : millEligible(unlocked));
	const score = $derived(sprintScore(round));
	const remaining = $derived(
		round.phase === 'running' ? Math.max(0, Math.ceil((round.endsAt - now) / 1000)) : 0
	);

	onMount(() => {
		progress.tick();
		ready = true;
	});

	$effect(() => {
		if (!running) return;
		const id = setInterval(() => {
			const t = Date.now();
			now = t;
			round = tickRound(round, t);
			if (round.phase !== 'running') running = false;
		}, 100);
		return () => clearInterval(id);
	});

	function source(): TrialSource {
		return lane === 'blocks'
			? blockTrialSource(sprintInventory(unlocked))
			: pronTrialSource(millPool(unlocked));
	}

	function pickLane(next: Lane) {
		if (running || lane === next) return;
		lane = next;
		round = idleRound();
	}

	function start() {
		progress.tick();
		round = startRoundFrom(Date.now(), source(), Math.random);
		running = round.phase === 'running';
		now = Date.now();
	}

	function pick(index: number) {
		round = answerRoundFrom(round, index, Date.now(), source(), Math.random);
		if (round.phase !== 'running') running = false;
	}
</script>

<svelte:head><title>Drill</title></svelte:head>

<div class="shell narrow">
	<header class="head" class:compact={running}>
		<p class="eyebrow">Timed drill</p>
		<h1>{lane === 'blocks' ? 'Block sprint' : 'Sound-change mill'}</h1>
		{#if ready && !running}
			<div class="lanes" role="group" aria-label="Drill lanes">
				<button
					type="button"
					class="lane"
					aria-pressed={lane === 'blocks'}
					onclick={() => pickLane('blocks')}
				>Blocks</button>
				<button
					type="button"
					class="lane"
					aria-pressed={lane === 'sounds'}
					onclick={() => pickLane('sounds')}
				>Sound changes</button>
			</div>
		{/if}
		{#if ready && eligible && round.phase === 'idle'}
			<p class="standfirst">
				{#if lane === 'blocks'}
					Read each block, tap its sound. One minute. The number is your median time.
				{:else}
					Read each written word, tap how it is actually said. Same clock, same score.
				{/if}
			</p>
		{/if}
	</header>

	{#if !ready}
		<div class="card empty loading" aria-busy="true">
			<div class="skel glyph-ph" aria-hidden="true"></div>
			<div class="skel line-ph" aria-hidden="true"></div>
			<p class="muted">Loading drill…</p>
		</div>
	{:else if missing}
		<div class="card empty">
			<span class="big" lang="ko">한</span>
			<h2>{lane === 'blocks' ? 'Sprint is locked' : 'The mill is locked'}</h2>
			<p>
				{#if lane === 'blocks'}
					Finish Lab 0{missing.number} to unlock the sprint.
				{:else}
					The mill quizzes sound changes — finish Lab 0{missing.number} to unlock the first ones.
				{/if}
			</p>
			<a class="btn" href={resolve('/lab/[id]', { id: missing.id })}>Start Lab 0{missing.number}</a>
		</div>
	{:else if round.phase === 'running' && round.trial}
		<div class="card drill">
			<p class="timer" role="timer" aria-live="off">{remaining}</p>
			<div class="glyph" class:word={lane === 'sounds'} lang="ko">{round.trial.block}</div>
			{#key round.trial.block + round.seen}
				<SprintChoices options={round.trial.options} onPick={pick} />
			{/key}
		</div>
	{:else if round.phase === 'done'}
		<div class="card empty">
			<p class="median">{score.medianMs === null ? '—' : `${score.medianMs} ms`}</p>
			<p>{score.correct} of {score.seen} correct</p>
			<button class="btn" type="button" onclick={start}>Another round</button>
			<p class="links">
				<a href={resolve('/')}>Labs</a>
				<a href={resolve('/review')}>Review</a>
			</p>
		</div>
	{:else if eligible}
		<div class="card empty">
			<button class="btn" type="button" onclick={start}>Start 60-second round</button>
		</div>
	{/if}
</div>

<style>
	.narrow {
		max-width: 40rem;
	}
	.head {
		margin-bottom: var(--s5);
	}
	.head.compact {
		margin-bottom: var(--s4);
	}
	.head.compact h1 {
		margin-bottom: 0;
	}
	h1 {
		margin: var(--s2) 0 var(--s3);
		font-family: var(--display);
		font-style: italic;
		font-weight: 400;
		color: var(--ink);
	}
	.standfirst {
		font-family: var(--display);
		font-style: italic;
		font-size: 1.05rem;
		color: var(--ink);
		margin: 0;
	}

	.lanes {
		display: flex;
		gap: var(--s2);
		margin: 0 0 var(--s3);
	}
	.lane {
		appearance: none;
		min-height: 44px;
		padding: var(--s1) var(--s3);
		font: inherit;
		font-size: 0.84rem;
		color: var(--ink-soft);
		background: var(--paper-raised);
		border: 1px solid var(--rule);
		border-radius: var(--r-pill);
		cursor: pointer;
		transition: color var(--fast) var(--ease), border-color var(--fast) var(--ease);
	}
	.lane:hover {
		color: var(--ink);
		border-color: var(--rule-strong);
	}
	.lane:focus-visible {
		outline: 2px solid var(--paper);
		outline-offset: 2px;
		box-shadow: var(--focus-ring);
	}
	.lane[aria-pressed='true'] {
		color: var(--accent);
		background: var(--accent-soft);
		border-color: var(--accent);
	}

	.drill {
		padding: var(--s5);
	}

	.timer {
		margin: 0 0 var(--s3);
		text-align: center;
		font-family: var(--mono);
		font-size: 1.15rem;
		font-variant-numeric: tabular-nums;
		color: var(--accent);
	}

	.glyph {
		font-family: var(--hangul);
		font-size: clamp(3.2rem, 10vw + 1.5rem, 6.5rem);
		font-weight: 500;
		line-height: 1.05;
		text-align: center;
		color: var(--ink);
		margin: 0 0 var(--s4);
	}
	/* Words run longer than single blocks; keep them on the card. */
	.glyph.word {
		font-size: clamp(2.2rem, 6vw + 1rem, 4rem);
	}

	@media (max-height: 52rem) {
		.glyph {
			font-size: clamp(2.6rem, 6vw + 1rem, 4rem);
		}
		.glyph.word {
			font-size: clamp(1.9rem, 4.5vw + 0.8rem, 3rem);
		}
	}

	.empty {
		padding: var(--s7) var(--s5);
		text-align: center;
	}
	.empty .big {
		font-family: var(--hangul);
		font-size: 3.2rem;
		display: block;
		margin-bottom: var(--s3);
		color: var(--ink);
	}
	.empty h2 {
		margin-bottom: var(--s2);
		color: var(--ink);
	}
	.empty p:not(.median) {
		color: var(--ink);
		font-size: 0.92rem;
		max-width: 28rem;
		margin: 0 auto var(--s4);
	}

	.median {
		font-family: var(--mono);
		font-size: clamp(2.2rem, 6vw + 1rem, 3.4rem);
		font-variant-numeric: tabular-nums;
		color: var(--ink);
		margin: 0 0 var(--s3);
	}

	.links {
		display: flex;
		justify-content: center;
		gap: var(--s4);
		margin: var(--s4) auto 0;
	}

	.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--s3);
	}
	.loading .muted {
		margin: var(--s2) 0 0;
	}

	@media (prefers-reduced-motion: reduce) {
		.lane {
			transition: none;
		}
	}

	@media (forced-colors: active) {
		.timer,
		.glyph,
		.median,
		.empty h2,
		.empty p {
			color: CanvasText;
		}
		.lane {
			background: ButtonFace;
			color: ButtonText;
			border-color: ButtonBorder;
		}
		.lane[aria-pressed='true'] {
			background: Highlight;
			color: HighlightText;
		}
	}
</style>
