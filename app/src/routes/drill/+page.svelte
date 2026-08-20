<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { shouldIgnoreShortcut } from '$lib/a11y/shortcuts';
	import SprintChoices from '$lib/components/SprintChoices.svelte';
	import {
		answerRound,
		idleRound,
		sprintEligible,
		sprintInventory,
		sprintMissingLab,
		sprintScore,
		startRound,
		tickRound
	} from '$lib/domain/sprint';
	import { progress } from '$lib/stores/progress.svelte';

	let ready = $state(false);
	let round = $state(idleRound());
	let running = $state(false);
	let now = $state(0);
	let choices = $state<SprintChoices | undefined>();

	const unlocked = $derived(
		['lab01', 'lab02', 'lab03', 'lab04', 'lab05', 'lab06'].filter((tier) =>
			progress.isUnlocked(tier)
		)
	);
	const missing = $derived(sprintMissingLab(unlocked));
	const eligible = $derived(sprintEligible(unlocked));
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

	function start() {
		progress.tick();
		const unlocked = ['lab01', 'lab02', 'lab03', 'lab04', 'lab05', 'lab06'].filter((tier) =>
			progress.isUnlocked(tier)
		);
		const blocks = sprintInventory(unlocked);
		round = startRound(Date.now(), blocks, Math.random);
		running = round.phase === 'running';
		now = Date.now();
	}

	function pick(index: number) {
		const blocks = sprintInventory(unlocked);
		round = answerRound(round, index, Date.now(), blocks, Math.random);
		if (round.phase !== 'running') running = false;
	}

	function onKey(e: KeyboardEvent) {
		if (!running) return;
		if (shouldIgnoreShortcut(e.target)) return;
		choices?.keyPick(e.key);
	}
</script>

<svelte:head><title>Block sprint</title></svelte:head>
<svelte:window onkeydown={onKey} />

<div class="shell narrow">
	<header class="head" class:compact={running}>
		<p class="eyebrow">Timed drill</p>
		<h1>Block sprint</h1>
		{#if ready && eligible && round.phase === 'idle'}
			<p class="standfirst">
				Read each block, tap its sound. One minute. The number is your median time.
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
			<h2>Sprint is locked</h2>
			<p>Finish Lab 0{missing.number} to unlock the sprint.</p>
			<a class="btn" href={resolve('/lab/[id]', { id: missing.id })}>Start Lab 0{missing.number}</a>
		</div>
	{:else if round.phase === 'running' && round.trial}
		<div class="card drill">
			<p class="timer" role="timer" aria-live="off">{remaining}</p>
			<div class="glyph" lang="ko">{round.trial.block}</div>
			{#key round.trial.block + round.seen}
				<SprintChoices bind:this={choices} options={round.trial.options} onPick={pick} />
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

	@media (max-height: 52rem) {
		.glyph {
			font-size: clamp(2.6rem, 6vw + 1rem, 4rem);
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
	.loading .glyph-ph {
		width: 4.5rem;
		height: 4.5rem;
		border-radius: var(--r-md);
	}
	.loading .line-ph {
		width: 12rem;
		max-width: 80%;
		height: 0.7rem;
	}
	.loading .muted {
		margin: var(--s2) 0 0;
	}

	@media (forced-colors: active) {
		.timer,
		.glyph,
		.median,
		.empty h2,
		.empty p {
			color: CanvasText;
		}
	}
</style>
