<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { fly, fade } from 'svelte/transition';
	import type { Lab } from '$lib/content/types';
	import { focusWhen, shouldIgnoreShortcut } from '$lib/a11y/shortcuts';
	import { labSession } from '$lib/stores/labSession.svelte';
	import { progress } from '$lib/stores/progress.svelte';

	import { withLangKo } from '$lib/a11y/lang';
	import {
		emptyOutcomes,
		holdFurthest,
		pipIsJumpTarget,
		pipKind,
		pipLabel,
		type CardOutcome
	} from '$lib/domain/pipState';
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
	let furthest = $state(0);
	let outcomes = $state<(CardOutcome | null)[]>([]);

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
			finished: done,
			outcomes: outcomes.slice()
		});
	}

	onMount(() => {
		const saved = labSession.forLab(lab.id);
		if (saved) {
			firstTry = saved.firstTry;
			elapsedMs = saved.elapsedMs;
			startedAt = Date.now();
			outcomes = saved.outcomes.slice();
			furthest = saved.nextIndex;
			if (saved.finished || saved.nextIndex >= lab.steps.length) {
				finish();
			} else {
				index = saved.nextIndex;
				showResumeNote = saved.nextIndex > 0;
			}
		} else {
			outcomes = emptyOutcomes(lab.steps.length);
		}
		ready = true;
	});

	onDestroy(() => {
		if (!ready || finished || settled) return;
		if (furthest === 0 && firstTry === 0 && outcomes.every((o) => o == null)) return;
		// Mid-card leave: keep the furthest card, not a card the learner jumped back to.
		persist(furthest);
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
		const firstVisit = outcomes[index] == null;
		if (firstVisit && correct && !missedHere) firstTry += 1;
		outcomes[index] = correct ? 'right' : 'wrong';
		feedback = {
			tone: correct ? 'right' : 'wrong',
			html: overrideTeach ?? step.teach,
			blocking: false
		};
		furthest = holdFurthest(furthest, index, true, lab.steps.length);
		// Advance the saved place now so leaving before Next still resumes
		// on the following card. Last card: unlock immediately so a Review
		// peek cannot swallow the sitting.
		if (isLast) {
			released = progress.unlock([lab.unlocks]);
			persist(lab.steps.length, true);
		} else {
			persist(furthest);
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
		furthest = holdFurthest(furthest, index, false, lab.steps.length);
		settled = false;
		missedHere = false;
		feedback = null;
		showResumeNote = false;
	}

	function jumpTo(i: number) {
		if (i === index || i < 0 || i > furthest) return;
		index = i;
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
		furthest = 0;
		outcomes = emptyOutcomes(lab.steps.length);
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
	<div class="finish card" in:fly={{ y: 12, duration: 300 }}>
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
	<nav class="rail-wrap" aria-label="Lab cards">
		<ol class="rail">
			{#each lab.steps as _, i (i)}
				{@const kind = pipKind(i, outcomes, furthest)}
				{@const selected = i === index}
				<li>
					{#if pipIsJumpTarget(kind) || selected}
						<button
							type="button"
							class="pip"
							data-kind={kind}
							data-selected={selected || undefined}
							aria-current={selected ? 'step' : undefined}
							aria-label={pipLabel(kind, i + 1, selected)}
							onclick={() => jumpTo(i)}
						>
							<span class="pip-n">{i + 1}</span>
						</button>
					{:else}
						<span class="pip" data-kind={kind}>
							<span class="pip-n" aria-hidden="true">{i + 1}</span>
							<span class="vh">{pipLabel(kind, i + 1)}</span>
						</span>
					{/if}
				</li>
			{/each}
		</ol>
		<span class="where">{index + 1} / {lab.steps.length}</span>
	</nav>

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
	.rail-wrap {
		display: flex;
		align-items: center;
		gap: var(--s2);
		margin-bottom: var(--s5);
		flex-wrap: wrap;
	}

	.rail {
		display: flex;
		align-items: center;
		flex: 1 1 auto;
		flex-wrap: wrap;
		min-width: 0;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.rail li { display: flex; }

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

	/* Status mark. Centered with inset so selected pulse/glow can use
	   transform + drop-shadow on this one box — no second ring. */
	.pip::before {
		content: '';
		position: absolute;
		display: block;
		top: 0;
		right: 0;
		bottom: 0;
		left: 0;
		margin: auto;
		width: 1.55rem;
		height: 1.55rem;
		border-radius: 50%;
		border: 2px solid transparent;
		background: transparent;
		pointer-events: none;
		transform-origin: center;
		--pip-glow: var(--accent);
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
		--pip-glow: var(--accent);
	}
	.pip[data-kind='visited'][data-selected]::before,
	button.pip[data-kind='visited']:focus-visible::before {
		border-color: var(--accent);
	}
	.pip[data-kind='upcoming'] { font-weight: 500; }
	.pip-n { position: relative; z-index: 1; }

	button.pip:not([data-selected]):not(:focus-visible):hover::before {
		transform: scale(1.03);
	}

	.pip[data-selected]::before,
	button.pip:focus-visible::before {
		animation: pip-pulse 1.8s var(--ease-in-out) infinite;
		filter: drop-shadow(0 0 6px color-mix(in srgb, var(--pip-glow) 42%, transparent));
	}
	.pip:focus-visible {
		outline: none;
		box-shadow: none;
		border-radius: 0;
	}

	@keyframes pip-pulse {
		0%,
		100% {
			transform: scale(1);
			filter: drop-shadow(0 0 6px color-mix(in srgb, var(--pip-glow) 42%, transparent));
		}
		50% {
			transform: scale(1.06);
			filter: drop-shadow(0 0 10px color-mix(in srgb, var(--pip-glow) 58%, transparent));
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.pip[data-selected]::before,
		button.pip:focus-visible::before {
			animation: none;
			width: calc(1.55rem + 2px);
			height: calc(1.55rem + 2px);
			border-width: 3px;
			filter: drop-shadow(0 0 8px color-mix(in srgb, var(--pip-glow) 50%, transparent));
		}
		button.pip:not([data-selected]):not(:focus-visible):hover::before {
			transform: none;
		}
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
		.pip[data-kind='upcoming'] { color: GrayText; }
		.pip[data-kind='right'] { color: Canvas; }
		.pip[data-kind='right']::before { background: Highlight; border-color: Highlight; }
		.pip[data-kind='wrong'] { color: ButtonText; }
		.pip[data-kind='wrong']::before { background: Canvas; border-color: ButtonText; }
		.pip[data-selected]::before,
		button.pip:focus-visible::before { border-color: ButtonText; }
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
	.finish { padding: var(--s7) var(--s5); text-align: center; }

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
