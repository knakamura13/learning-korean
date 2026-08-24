<script lang="ts">
	import { onDestroy, onMount, tick } from 'svelte';
	import { fly, fade } from 'svelte/transition';
	import { resolve } from '$app/paths';
	import type { Lab } from '$lib/content/types';
	import { firstWellControl } from '$lib/a11y/firstWellControl';
	import { motion } from '$lib/a11y/motion';
	import { focusWhen, shouldAdvanceOnEnter, shouldIgnoreArrowNav } from '$lib/a11y/shortcuts';
	import { labHtml } from '$lib/a11y/sanitize';
	import { revealAdvance, shouldRevealAdvance } from '$lib/a11y/revealAdvance';
	import { attachModalDialog } from '$lib/a11y/attachModalDialog';
	import { labSession } from '$lib/stores/labSession.svelte';
	import { progress } from '$lib/stores/progress.svelte';
	import {
		hydrateLabRunner,
		labProgressFromRunner,
		placeAfterCorrectSettle,
		shouldPersistOnLeave,
		sittingElapsedMinutes
	} from '$lib/domain/labRunnerSession';
	import { followingLab, toCourseLab } from '$lib/domain/courseNav';
	import { labFinishCopy } from '$lib/domain/labFinishCopy';
	import { LABS } from '$lib/content';
	import {
		emptyOutcomes,
		holdFurthest,
		stepCardIndex,
		type CardOutcome
	} from '$lib/domain/pipState';
	import MouthStep from './steps/MouthStep.svelte';
	import ChoiceStep from './steps/ChoiceStep.svelte';
	import BuildStep from './steps/BuildStep.svelte';
	import AssembleStep from './steps/AssembleStep.svelte';
	import VowelStep from './steps/VowelStep.svelte';
	import FusionStep from './steps/FusionStep.svelte';
	import ClusterStep from './steps/ClusterStep.svelte';
	import LiaisonStep from './steps/LiaisonStep.svelte';
	import ContactStep from './steps/ContactStep.svelte';
	import HMergeStep from './steps/HMergeStep.svelte';
	import FlowStep from './steps/FlowStep.svelte';
	import ReadStep from './steps/ReadStep.svelte';
	import LabSpread from './shell/LabSpread.svelte';
	import LabPipRail from './LabPipRail.svelte';
	import KoText from './KoText.svelte';
	import FlagButton from './FlagButton.svelte';
	import { conceptsForStep } from '$lib/domain/labStepConcepts';
	import { phaseAt } from '$lib/domain/labPhase';

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
	const alreadyDone = $derived(progress.isUnlocked(lab.unlocks));
	const compactHead = $derived(!ready || index > 0 || showResumeNote);
	const course = LABS.map(toCourseLab);
	const nextLab = $derived(followingLab(course, lab.id));
	const finishCopy = $derived(labFinishCopy(released, progress.stats));
	/** Gate for the review handoff: is there anything in the next sitting? */
	const dueNow = $derived(progress.stats.sitting);
	const promptLive = $derived(step.do.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
	const stepConcepts = $derived(conceptsForStep(step, [lab.unlocks]));
	const stepFlagged = $derived(progress.areFlagged(stepConcepts));
	const verdictLive = $derived.by(() => {
		if (!feedback) return '';
		const label =
			feedback.tone === 'right' ? 'Yes' : feedback.blocking ? 'Try again' : 'Not quite';
		const detail = feedback.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
		return detail ? `${label}. ${detail}` : label;
	});
	let cardEl = $state<HTMLDivElement>();
	let workEl = $state<HTMLDivElement>();
	let confirmingRestart = $state(false);
	let restartButton = $state<HTMLButtonElement>();

	/**
	 * Scroll and focus are managed in exactly one place: here. Advancing or
	 * pip-jumping remounts the card via {#key index}, which would otherwise
	 * keep whatever scroll depth the previous card happened to leave (burying
	 * the new instruction above the fold) and drop focus to <body>. On every
	 * card change we park the prompt under the sticky header, announce the
	 * new instruction, and focus the first control in the well — a real widget,
	 * not the heading. Settle reveals are revealAdvance's job; settle focus
	 * is focusWhen's.
	 */
	let managedIndex: number | null = null;
	$effect(() => {
		const i = index;
		if (!ready || finished) return;
		const el = cardEl;
		if (!el) return;
		// First ready render (fresh load or resume) is not a card change:
		// leave scroll and focus where the browser put them.
		if (managedIndex === null || managedIndex === i) {
			managedIndex = i;
			return;
		}
		managedIndex = i;
		const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;
		const chrome = document.querySelector('header.bar')?.getBoundingClientRect().bottom ?? 0;
		const top = Math.max(0, el.getBoundingClientRect().top + window.scrollY - chrome - 8);
		window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
		void tick().then(() => {
			if (index !== i || finished) return;
			const well = workEl?.isConnected ? workEl : document.querySelector('.work');
			firstWellControl(well)?.focus({ preventScroll: true });
		});
	});

	function segmentElapsed() {
		return elapsedMs + Math.max(0, Date.now() - startedAt);
	}

	function persist(nextIndex: number, done = false) {
		labSession.save(
			lab.id,
			labProgressFromRunner({
				nextIndex,
				firstTry,
				elapsedMs: segmentElapsed(),
				finished: done,
				outcomes: outcomes.slice()
			})
		);
	}

	onMount(() => {
		const restored = hydrateLabRunner(labSession.forLab(lab.id), lab.steps.length);
		firstTry = restored.firstTry;
		elapsedMs = restored.elapsedMs;
		startedAt = Date.now();
		outcomes = restored.outcomes;
		furthest = restored.furthest;
		if (restored.shouldFinish) {
			finish();
		} else {
			index = restored.index;
			showResumeNote = restored.showResumeNote;
		}
		ready = true;
	});

	onDestroy(() => {
		if (!shouldPersistOnLeave({ ready, finished, settled, furthest, firstTry, outcomes })) return;
		persist(furthest);
	});

	/**
	 * Resolve the step. Choice, read, cluster, liaison, and contact retry until
	 * correct — a miss nudges without advancing. An earlier miss dents the
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
		const place = placeAfterCorrectSettle(isLast, furthest, lab.steps.length);
		if (place.finished) {
			released = progress.unlock([lab.unlocks]);
		}
		persist(place.nextIndex, place.finished);
	}

	/** A wrong answer that should not advance. `soft` means "exploration, not error". */
	function onNudge(html: string, soft = false) {
		if (settled) return;
		if (!html) {
			feedback = null;
			return;
		}
		if (!soft) missedHere = true;
		feedback = { tone: 'wrong', html, blocking: !soft };
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
		elapsedMinutes = sittingElapsedMinutes(segmentElapsed());
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

	function requestRestart() {
		confirmingRestart = true;
	}

	async function cancelRestart() {
		confirmingRestart = false;
		await tick();
		restartButton?.focus();
	}

	function confirmRestart() {
		confirmingRestart = false;
		restart();
	}

	function onKey(e: KeyboardEvent) {
		if (e.metaKey || e.ctrlKey || e.altKey) return;
		if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
			// Finish hides the pip rail; leave arrows to the browser there.
			if (!ready || finished) return;
			if (shouldIgnoreArrowNav(e.target)) return;
			e.preventDefault();
			jumpTo(stepCardIndex(index, e.key === 'ArrowLeft' ? -1 : 1, furthest));
			return;
		}
		if (shouldAdvanceOnEnter(e, settled)) {
			e.preventDefault();
			next();
			return;
		}
	}

</script>

<svelte:window onkeydown={onKey} />

{#if finished}
	<LabSpread>
		{#snippet article()}
			<div class="finish card" in:fly={motion({ y: 12, duration: 300 })}>
				<span class="seal" lang="ko">한글</span>
				<h1>{lab.finish.title}</h1>
				<p class="summary">{lab.finish.summary}</p>

				<div class="tally" role="region" aria-label="Lab results summary">
					<div><b>{firstTry}/{lab.steps.length}</b><span>first try</span></div>
					<div><b>~{elapsedMinutes}m</b><span>elapsed</span></div>
					{#if released > 0}<div><b>+{released}</b><span>cards unlocked</span></div>{/if}
				</div>

				<p class="unlocked">
					{finishCopy.lead}
					{finishCopy.detail}
				</p>

				<div class="actions">
					{#if dueNow > 0}
						<a class="btn" href={resolve('/review')}>Review now →</a>
					{/if}
					{#if nextLab}
						<a class={dueNow > 0 ? 'btn ghost' : 'btn'} href={resolve('/lab/[id]', { id: nextLab.id })}>Next lab</a>
					{/if}
					{#if confirmingRestart}
						<dialog
							class="restart-confirm"
							aria-labelledby="restart-confirmation"
							{@attach (node: HTMLDialogElement) =>
								attachModalDialog(node, () => {
									void cancelRestart();
								})}
						>
							<p id="restart-confirmation">Start over? Your completed lab summary will be cleared.</p>
							<div class="restart-confirm-actions">
								<button class="btn ghost" type="button" use:focusWhen={true} onclick={cancelRestart}>
									Cancel
								</button>
								<button class="btn" type="button" onclick={confirmRestart}>Start over</button>
							</div>
						</dialog>
					{:else}
						<button
							bind:this={restartButton}
							class="btn ghost"
							type="button"
							onclick={requestRestart}
						>
							Run the lab again
						</button>
					{/if}
				</div>
			</div>
		{/snippet}
	</LabSpread>
{:else}
	<LabSpread>
		{#snippet article()}
			<header class="head" class:compact={compactHead}>
				<p class="eyebrow">
					Lab {String(lab.number).padStart(2, '0')} · ~{lab.minutes} minutes
					{#if showResumeNote}
						· picking up at card {index + 1}
					{:else if alreadyDone}
						· completed
					{/if}
				</p>
				<h1>{lab.title}</h1>
				{#if !compactHead}
					<p class="standfirst">{lab.standfirst}</p>
				{/if}
			</header>
			{#if !ready}
				<div class="loading" aria-busy="true">
					<div class="skel line-ph" aria-hidden="true"></div>
					<p class="muted">Loading the lab…</p>
				</div>
			{:else}
				{#if showResumeNote}
					<p class="vh" role="status">
						Picking up at card {index + 1} of {lab.steps.length}.
					</p>
				{/if}
				<LabPipRail
					stepCount={lab.steps.length}
					{index}
					{outcomes}
					{furthest}
					phases={lab.phases}
					onJump={jumpTo}
				/>
				<p class="vh" data-prompt-live aria-live="polite" aria-atomic="true"><KoText text={promptLive} /></p>
				{#key index}
					<div class="prompt" bind:this={cardEl} in:fly={motion({ y: 10, duration: 260 })}>
						<p class="phase-title">{phaseAt(lab.phases, index).title}</p>
						<h2 class="do">{@html labHtml(step.do)}</h2>
						{#if step.hint}<p class="hint">{@html labHtml(step.hint)}</p>{/if}
					</div>
				{/key}
			{/if}
		{/snippet}
		{#snippet well()}
			{#if ready}
				{#key index}
					<div class="work" bind:this={workEl}>
						{#if step.type === 'mouth'}
							<MouthStep {step} {onSettle} {onNudge} />
						{:else if step.type === 'choice'}
							<ChoiceStep {step} {onSettle} {onNudge} />
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
						{:else if step.type === 'liaison'}
							<LiaisonStep {step} {onSettle} {onNudge} />
						{:else if step.type === 'contact'}
							<ContactStep {step} {onSettle} {onNudge} />
						{:else if step.type === 'hmerge'}
							<HMergeStep {step} {onSettle} {onNudge} />
						{:else if step.type === 'flow'}
							<FlowStep {step} {onSettle} {onNudge} />
						{:else if step.type === 'read'}
							<ReadStep {step} {onSettle} {onNudge} />
						{:else}
							{@const _exhaustive: never = step}
						{/if}
					</div>
				{/key}
			{:else}
				<div class="work work-skel" aria-hidden="true">
					<div class="skel line-ph"></div>
					<div class="skel mouth-ph"></div>
				</div>
			{/if}
		{/snippet}
		{#snippet after()}
			{#if ready}
				<p class="vh" data-verdict-live aria-live="polite" aria-atomic="true">{verdictLive}</p>
				{#key index}
					{#if feedback || settled}
						<div
							class="advance"
							use:revealAdvance={shouldRevealAdvance(settled, feedback?.tone)}
						>
							{#if feedback}
								<div
									class="fb"
									data-tone={feedback.tone}
									in:fade={motion({ duration: 180 })}
								>
									<div class="fb-head">
										<span class="verdict">
											{feedback.tone === 'right' ? 'Yes' : feedback.blocking ? 'Try again' : 'Not quite'}
										</span>
										{#if stepConcepts.length > 0}
											<FlagButton
												active={stepFlagged}
												onclick={() => progress.toggleFlagged(stepConcepts)}
											/>
										{/if}
									</div>
									{@html labHtml(feedback.html)}
								</div>
							{/if}

							{#if settled}
								<div class="foot" in:fade={motion({ duration: 160 })}>
									<span class="kb">or press Enter</span>
									<button
										class="btn"
										use:focusWhen={{ active: true, preventScroll: true }}
										onclick={next}
									>{isLast ? 'Finish' : 'Next'}</button>
								</div>
							{/if}
						</div>
					{/if}
				{/key}
			{/if}
		{/snippet}
	</LabSpread>
{/if}

<style>
	.head { margin-bottom: var(--s5); }
	.head.compact { margin-bottom: var(--s3); }
	.head h1 {
		margin: var(--s2) 0 var(--s3);
		font-family: var(--display);
		font-style: italic;
		font-weight: 400;
	}
	.head.compact h1 {
		margin: 0;
		font-size: 1.15rem;
		line-height: 1.25;
	}

	.standfirst {
		font-family: var(--display);
		font-size: 1.1rem;
		font-style: italic;
		color: var(--ink-soft);
		line-height: 1.5;
		margin: 0;
		max-width: var(--measure);
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
	.loading .muted { margin: var(--s2) 0 0; }

	.prompt { min-width: 0; }

	.phase-title {
		font-family: var(--sans);
		font-size: 0.85rem;
		font-weight: 600;
		letter-spacing: normal;
		text-transform: none;
		color: var(--accent);
		line-height: 1.35;
		margin: 0 0 var(--s2);
	}

	.do {
		font-family: var(--sans);
		font-style: normal;
		/* rem in the preferred term so 200% text zoom scales it (see polish.test). */
		font-size: clamp(1.15rem, 1.15rem + 0.9vw, 1.45rem);
		line-height: 1.34;
		margin: var(--s2) 0 var(--s1);
	}

	/* {@html} em is invisible to scoped CSS; :global is required. */
	.do :global(em) {
		font-style: italic;
		font-weight: 600;
	}

	.hint {
		font-size: 0.86rem;
		color: var(--ink-soft);
		margin: 0 0 var(--s4);
	}

	.work {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		flex: 1 1 auto;
		width: 100%;
		min-width: 0;
		margin-top: 0;
	}

	.work-skel .line-ph {
		width: 14rem;
		max-width: 80%;
		height: 0.85rem;
	}
	.work-skel .mouth-ph {
		width: 100%;
		min-height: 16rem;
		aspect-ratio: 1;
	}

	.advance {
		scroll-margin-bottom: max(var(--s4), env(safe-area-inset-bottom));
	}

	.fb {
		margin-top: var(--s4);
		padding: var(--s3) var(--s4);
		border-radius: var(--r-md);
		border-inline-start: 3px solid var(--rule-strong);
		background: var(--paper-sunk);
		font-size: 0.9rem;
		line-height: 1.6;
	}
	.fb[data-tone='right'] { border-inline-start-color: var(--good); background: var(--good-soft); }
	.fb[data-tone='wrong'] { border-inline-start-color: var(--bad); background: var(--bad-soft); }

	.verdict {
		display: block;
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		margin-bottom: 0;
	}
	.fb-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--s2);
		margin-bottom: var(--s1);
	}
	.fb-head :global(.flag-btn) {
		width: 36px;
		height: 36px;
		margin: calc(-1 * var(--s1)) calc(-1 * var(--s2)) 0 0;
	}
	.fb[data-tone='right'] .verdict { color: var(--good); }
	.fb[data-tone='wrong'] .verdict { color: var(--bad); }

	@media (forced-colors: active) {
		.fb { background: Canvas; border-inline-start-color: ButtonBorder; }
		.fb[data-tone='right'] { background: Canvas; border-inline-start-color: Highlight; }
		.fb[data-tone='wrong'] { background: Canvas; border-inline-start-color: ButtonText; }
		.fb[data-tone='right'] .verdict { color: CanvasText; }
		.fb[data-tone='wrong'] .verdict { color: CanvasText; }
	}

	.foot {
		margin-top: var(--s4);
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: var(--s3);
		flex-wrap: wrap;
	}

	.kb { font-size: 0.7rem; color: var(--ink-faint); margin-inline-end: auto; }

	@media (pointer: coarse) {
		.kb { display: none; }
	}

	/* --- finish --- */
	.finish {
		padding: var(--s7) var(--s5);
		text-align: center;
		max-width: var(--measure);
		width: 100%;
	}
	.finish h1 {
		font-family: var(--display);
		font-style: italic;
		font-weight: 400;
		font-size: clamp(1.35rem, 1.35rem + 1.2vw, 1.6rem);
		margin: 0 0 var(--s3);
	}

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
	/* The finish beat: results rise in quietly, one after another. The global
	   prefers-reduced-motion block collapses these to 0.01ms. */
	.tally > div {
		animation: finish-rise 0.4s var(--ease) backwards;
	}
	.tally > div:nth-child(2) {
		animation-delay: 0.09s;
	}
	.tally > div:nth-child(3) {
		animation-delay: 0.18s;
	}
	@keyframes finish-rise {
		from {
			opacity: 0;
			translate: 0 6px;
		}
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
	.restart-confirm {
		display: grid;
		gap: var(--s2);
		padding: var(--s3);
		border: 1px solid var(--rule-strong);
		border-radius: var(--r-md);
		background: var(--paper-sunk);
		color: inherit;
		inset: 0;
		width: min(22rem, calc(100% - 2rem));
		max-width: 100%;
		height: fit-content;
		margin: auto;
		box-shadow: var(--shadow-2);
		overscroll-behavior: contain;
	}
	.restart-confirm::backdrop {
		background: color-mix(in srgb, var(--ink) 42%, transparent);
	}
	.restart-confirm p { margin: 0; }
	.restart-confirm-actions { display: flex; gap: var(--s2); flex-wrap: wrap; justify-content: center; }
</style>
