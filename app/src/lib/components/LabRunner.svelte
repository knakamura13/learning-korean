<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { fly, fade } from 'svelte/transition';
	import type { Lab } from '$lib/content/types';
	import { focusWhen, shouldIgnoreShortcut } from '$lib/a11y/shortcuts';
	import { labSession } from '$lib/stores/labSession.svelte';
	import { progress } from '$lib/stores/progress.svelte';

	import { withLangKo } from '$lib/a11y/lang';
	import MouthStep from './steps/MouthStep.svelte';
	import ChoiceStep from './steps/ChoiceStep.svelte';
	import BuildStep from './steps/BuildStep.svelte';
	import AssembleStep from './steps/AssembleStep.svelte';
	import VowelStep from './steps/VowelStep.svelte';
	import FusionStep from './steps/FusionStep.svelte';
	import ClusterStep from './steps/ClusterStep.svelte';
	import ReadStep from './steps/ReadStep.svelte';

	let { lab }: { lab: Lab } = $props();

	let index = $state(0);
	let settled = $state(false);
	let missedHere = $state(false);
	let firstTry = $state(0);
	let startedAt = $state(Date.now());
	let elapsedMs = $state(0);
	let finished = $state(false);
	let released = $state(0);
	let ready = $state(false);
	let showResumeNote = $state(false);
	let elapsedMinutes = $state(1);

	/** null = no feedback yet; `blocking` false means the learner may advance. */
	let feedback = $state<{ tone: 'right' | 'wrong'; html: string; blocking: boolean } | null>(null);

	const step = $derived(lab.steps[index]);
	const isLast = $derived(index === lab.steps.length - 1);
	let choiceRef = $state<ChoiceStep | undefined>();

	function segmentElapsed() {
		return elapsedMs + Math.max(0, Date.now() - startedAt);
	}

	function persist(nextIndex: number, done = false) {
		labSession.save(lab.id, {
			nextIndex,
			firstTry,
			elapsedMs: segmentElapsed(),
			finished: done
		});
	}

	onMount(() => {
		const saved = labSession.forLab(lab.id);
		if (saved) {
			firstTry = saved.firstTry;
			elapsedMs = saved.elapsedMs;
			startedAt = Date.now();
			if (saved.finished || saved.nextIndex >= lab.steps.length) {
				finish();
			} else {
				index = saved.nextIndex;
				showResumeNote = saved.nextIndex > 0;
			}
		}
		ready = true;
	});

	onDestroy(() => {
		if (!ready || finished || settled) return;
		if (index === 0 && firstTry === 0) return;
		// Mid-card leave: keep this card. A settle already wrote nextIndex + 1.
		persist(index);
	});

	/**
	 * Resolve the step. `correct` is false only for step types where a wrong
	 * answer still advances (choice and read cards teach through the
	 * explanation rather than through retrying). An earlier miss dents the
	 * first-try tally but must not turn a correct final answer into a
	 * "not quite" — the learner did get there, and saying otherwise is just
	 * discouraging.
	 */
	function onSettle(overrideTeach?: string, correct = true) {
		if (settled) return;
		settled = true;
		if (correct && !missedHere) firstTry += 1;
		feedback = {
			tone: correct ? 'right' : 'wrong',
			html: overrideTeach ?? step.teach,
			blocking: false
		};
		// Advance the saved place now so leaving before Next still resumes
		// on the following card. Last card: unlock immediately so a Review
		// peek cannot swallow the sitting.
		if (isLast) {
			released = progress.unlock([lab.unlocks]);
			persist(lab.steps.length, true);
		} else {
			persist(index + 1);
		}
	}

	/** A wrong answer that should not advance. `soft` means "exploration, not error". */
	function onNudge(html: string, soft = false) {
		if (settled) return;
		if (!soft) missedHere = true;
		feedback = { tone: 'wrong', html, blocking: true };
	}

	function next() {
		if (!settled) return;
		if (isLast) return finish();
		index += 1;
		settled = false;
		missedHere = false;
		feedback = null;
		showResumeNote = false;
	}

	function finish() {
		elapsedMinutes = Math.max(1, Math.round(segmentElapsed() / 60_000));
		if (released === 0) released = progress.unlock([lab.unlocks]);
		finished = true;
		labSession.clear(lab.id);
	}

	function restart() {
		labSession.clear(lab.id);
		index = 0;
		settled = false;
		missedHere = false;
		feedback = null;
		firstTry = 0;
		finished = false;
		released = 0;
		elapsedMs = 0;
		elapsedMinutes = 1;
		showResumeNote = false;
		startedAt = Date.now();
	}

	function onKey(e: KeyboardEvent) {
		if (e.metaKey || e.ctrlKey || e.altKey) return;
		if (shouldIgnoreShortcut(e.target)) return;
		if (settled && (e.key === 'Enter' || e.key === ' ')) {
			e.preventDefault();
			next();
			return;
		}
		if (!settled && /^[1-9]$/.test(e.key) && step.type === 'choice') {
			e.preventDefault();
			choiceRef?.key(Number(e.key));
		}
	}

</script>

<svelte:window onkeydown={onKey} />

{#if finished}
	<div class="done card" in:fly={{ y: 12, duration: 300 }}>
		<span class="seal" lang="ko">한글</span>
		<h2>{lab.finish.title}</h2>
		<p class="summary">{lab.finish.summary}</p>

		<div class="tally">
			<div><b>{firstTry}/{lab.steps.length}</b><span>first try</span></div>
			<div><b>~{elapsedMinutes}m</b><span>elapsed</span></div>
			{#if released > 0}<div><b>+{released}</b><span>cards unlocked</span></div>{/if}
		</div>

		<p class="unlocked">
			{#if released > 0}
				<strong>{released} new cards</strong> just entered your review deck.
			{:else}
				These cards are already in your deck.
			{/if}
			You have <strong>{progress.stats.queue}</strong> waiting.
		</p>

		<div class="actions">
			<a class="btn" href="/review">Review now →</a>
			<button class="btn ghost" onclick={restart}>Run the lab again</button>
		</div>
	</div>
{:else if !ready}
	<div class="card step loading" aria-busy="true">
		<div class="skel line-ph" aria-hidden="true"></div>
		<div class="skel work-ph" aria-hidden="true"></div>
		<p class="muted">Loading the lab…</p>
	</div>
{:else}
	{#if showResumeNote}
		<p class="resume" role="status">
			Picking up at card {index + 1} of {lab.steps.length}.
		</p>
	{/if}
	<div class="rail-row">
		<div
			class="rail"
			role="progressbar"
			aria-label="progress"
			aria-valuemin={1}
			aria-valuemax={lab.steps.length}
			aria-valuenow={index + 1}
			aria-valuetext="{index + 1} of {lab.steps.length}"
		>
			{#each lab.steps as _, i (i)}
				<span class="pip" class:done={i < index} class:now={i === index}></span>
			{/each}
			<span class="where">{index + 1} / {lab.steps.length}</span>
		</div>
		{#if index > 0 || showResumeNote}
			<button type="button" class="textish" onclick={restart}>Start over</button>
		{/if}
	</div>

	{#key index}
		<div class="card step" in:fly={{ y: 10, duration: 260 }}>
			{#if step.act}<p class="eyebrow">{step.act}</p>{/if}
			<h2 class="do">{@html withLangKo(step.do)}</h2>
			{#if step.hint}<p class="hint">{@html withLangKo(step.hint)}</p>{/if}

			<div class="work">
				{#if step.type === 'mouth'}
					<MouthStep {step} {onSettle} {onNudge} />
				{:else if step.type === 'choice'}
					<ChoiceStep bind:this={choiceRef} {step} {onSettle} {onNudge} />
				{:else if step.type === 'build'}
					<BuildStep {step} {onSettle} {onNudge} />
				{:else if step.type === 'assemble'}
					<AssembleStep {step} {onSettle} {onNudge} />
				{:else if step.type === 'vowel'}
					<VowelStep {step} {onSettle} {onNudge} />
				{:else if step.type === 'fusion'}
					<FusionStep {step} {onSettle} {onNudge} />
				{:else if step.type === 'cluster'}
					<ClusterStep {step} {onSettle} {onNudge} />
				{:else if step.type === 'read'}
					<ReadStep {step} {onSettle} {onNudge} />
				{:else}
					{@const _exhaustive: never = step}
				{/if}
			</div>

			{#if feedback}
				<div
					class="fb"
					data-tone={feedback.tone}
					in:fade={{ duration: 180 }}
					aria-live="polite"
					aria-atomic="true"
				>
					<span class="verdict">
						{feedback.tone === 'right' ? 'Yes' : feedback.blocking ? 'Try again' : 'Not quite'}
					</span>
					{@html withLangKo(feedback.html)}
				</div>
			{/if}

			{#if settled}
				<div class="foot" in:fade={{ duration: 160 }}>
					<button class="btn" use:focusWhen={true} onclick={next}>{isLast ? 'Finish' : 'Next'}</button>
					<span class="kb">or press Enter</span>
				</div>
			{/if}
		</div>
	{/key}
{/if}

<style>
	.rail-row {
		display: flex;
		align-items: center;
		gap: var(--s3);
		margin-bottom: var(--s5);
		flex-wrap: wrap;
	}

	.rail {
		display: flex;
		align-items: center;
		gap: var(--s1);
		flex: 1 1 auto;
		flex-wrap: wrap;
		min-width: 0;
	}

	.pip {
		width: 1.6rem;
		height: 3px;
		border-radius: 2px;
		background: var(--rule);
		transition: background var(--slow) var(--ease);
	}
	.pip.done { background: var(--good); }
	.pip.now { background: var(--accent); }

	@media (forced-colors: active) {
		.pip { background: GrayText; }
		.pip.done { background: Highlight; }
		.pip.now { background: ButtonText; }
		.fb { background: Canvas; border-left-color: ButtonBorder; }
		.fb[data-tone='right'] { background: Canvas; border-left-color: Highlight; }
		.fb[data-tone='wrong'] { background: Canvas; border-left-color: ButtonText; }
	}

	.where {
		margin-left: auto;
		font-size: 0.68rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--ink-faint);
		font-variant-numeric: tabular-nums;
	}

	.resume {
		margin: 0 0 var(--s3);
		font-size: 0.82rem;
		color: var(--ink-soft);
	}

	.textish {
		appearance: none;
		border: 0;
		background: none;
		padding: 0.2rem 0;
		min-height: 44px;
		font: inherit;
		font-size: 0.68rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--ink-faint);
		cursor: pointer;
		text-decoration: underline;
		text-underline-offset: 0.16em;
	}
	.textish:hover { color: var(--ink); }

	.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--s3);
		padding: var(--s7) var(--s5);
		text-align: center;
	}
	.loading .line-ph {
		width: 14rem;
		max-width: 80%;
		height: 0.85rem;
	}
	.loading .work-ph {
		width: 100%;
		max-width: 22rem;
		height: 8rem;
		border-radius: var(--r-md);
	}
	.loading .muted { margin: var(--s2) 0 0; }

	.step { padding: var(--s6) var(--s5) var(--s5); }

	.do {
		font-size: clamp(1.15rem, 2.8vw, 1.45rem);
		line-height: 1.34;
		margin: var(--s2) 0 var(--s1);
	}

	.hint {
		font-size: 0.86rem;
		color: var(--ink-soft);
		margin: 0 0 var(--s4);
	}

	.work { margin-top: var(--s4); }

	.fb {
		margin-top: var(--s4);
		padding: var(--s3) var(--s4);
		border-radius: var(--r-md);
		border-left: 3px solid var(--rule-strong);
		background: var(--paper-sunk);
		font-size: 0.9rem;
		line-height: 1.6;
	}
	.fb[data-tone='right'] { border-left-color: var(--good); background: var(--good-soft); }
	.fb[data-tone='wrong'] { border-left-color: var(--bad); background: var(--bad-soft); }

	.verdict {
		display: block;
		font-size: 0.64rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		margin-bottom: var(--s1);
	}
	.fb[data-tone='right'] .verdict { color: var(--good); }
	.fb[data-tone='wrong'] .verdict { color: var(--bad); }

	.foot {
		margin-top: var(--s4);
		display: flex;
		align-items: center;
		gap: var(--s3);
		flex-wrap: wrap;
	}

	.kb { font-size: 0.7rem; color: var(--ink-faint); margin-left: auto; }

	/* --- finish --- */
	.done { padding: var(--s7) var(--s5); text-align: center; }

	.seal {
		font-family: var(--hangul);
		font-size: 3.4rem;
		line-height: 1;
		display: block;
		margin-bottom: var(--s3);
	}

	.summary {
		font-size: 0.95rem;
		color: var(--ink-soft);
		line-height: 1.65;
		max-width: 32rem;
		margin: 0 auto var(--s5);
	}

	.tally {
		display: flex;
		justify-content: center;
		gap: var(--s6);
		flex-wrap: wrap;
		margin-bottom: var(--s4);
	}
	.tally b {
		font-family: var(--mono);
		font-size: 1.2rem;
		font-weight: 500;
		display: block;
		font-variant-numeric: tabular-nums;
	}
	.tally span {
		font-size: 0.6rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--ink-faint);
	}

	.unlocked {
		font-size: 0.88rem;
		color: var(--ink-soft);
		max-width: 30rem;
		margin: 0 auto var(--s5);
	}

	.actions { display: flex; gap: var(--s3); justify-content: center; flex-wrap: wrap; }
</style>
