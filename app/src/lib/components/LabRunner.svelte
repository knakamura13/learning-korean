<script lang="ts">
	import { onDestroy, onMount, tick, type Snippet } from 'svelte';
	import { fly, fade } from 'svelte/transition';
	import type { Lab } from '$lib/content/types';
	import { isChoiceShortcutKey } from '$lib/a11y/choiceKeys';
	import { focusWhen, shouldAdvanceOnEnter, shouldIgnoreArrowNav, shouldIgnoreShortcut } from '$lib/a11y/shortcuts';
	import { labHtml } from '$lib/a11y/sanitize';
	import { revealAdvance, shouldRevealAdvance } from '$lib/a11y/revealAdvance';
	import { labSession } from '$lib/stores/labSession.svelte';
	import { progress } from '$lib/stores/progress.svelte';
	import {
		pipRailCenteredScrollLeft,
		pipRailEdgeFades,
		pipRailMaxScroll,
		pipRailSnapScrollLeft
	} from '$lib/domain/pipRail';
	import { followingLab, toCourseLab } from '$lib/domain/courseNav';
	import { labFinishCopy } from '$lib/domain/labFinishCopy';
	import { LABS } from '$lib/content';
	import {
		emptyOutcomes,
		holdFurthest,
		pipIsJumpTarget,
		pipKind,
		pipLabel,
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
	import ReadStep from './steps/ReadStep.svelte';

	let { lab, letterAsk }: { lab: Lab; letterAsk?: Snippet } = $props();

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
	const dueNow = $derived(progress.stats.queue);
	let choiceRef = $state<ChoiceStep | undefined>();
	let fadeLeft = $state(false);
	let fadeRight = $state(false);
	let cardEl = $state<HTMLDivElement>();
	let confirmingRestart = $state(false);
	let restartButton = $state<HTMLButtonElement>();

	/**
	 * Scroll and focus are managed in exactly one place: here. Advancing or
	 * pip-jumping remounts the card via {#key index}, which would otherwise
	 * keep whatever scroll depth the previous card happened to leave (burying
	 * the new instruction above the fold) and drop focus to <body>, so
	 * keyboard users resume from a browser heuristic and screen-reader users
	 * hear nothing. On every card change we focus the new instruction heading
	 * (without scrolling) and park the card just under the sticky header.
	 * Settle reveals are revealAdvance's job; settle focus is focusWhen's.
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
		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const chrome = document.querySelector('header.bar')?.getBoundingClientRect().bottom ?? 0;
		const top = Math.max(0, el.getBoundingClientRect().top + window.scrollY - chrome - 8);
		el.querySelector('h2')?.focus({ preventScroll: true });
		window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
	});

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
	 * explanation rather than through retrying). Cluster and liaison are
	 * retry-until-correct. An earlier miss dents the first-try tally but must
	 * not turn a correct final answer into a "not quite" — the learner did get
	 * there, and saying otherwise is just discouraging.
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
		if (shouldIgnoreShortcut(e.target)) return;
		if (!settled && step.type === 'choice' && isChoiceShortcutKey(e.key, step.options)) {
			e.preventDefault();
			choiceRef?.key(e.key);
		}
	}

	/** Keep the current pip in view and fade overflowing rail edges. */
	function keepSelectedVisible(node: HTMLOListElement) {
		function applyFades() {
			const max = pipRailMaxScroll(node.scrollWidth, node.clientWidth);
			const fades = pipRailEdgeFades(node.scrollLeft, max);
			fadeLeft = fades.left;
			fadeRight = fades.right;
		}

		function scrollSelected() {
			const pip = node.querySelector<HTMLElement>('[data-selected]');
			if (!pip) {
				applyFades();
				return;
			}
			const pipRect = pip.getBoundingClientRect();
			const railRect = node.getBoundingClientRect();
			const max = pipRailMaxScroll(node.scrollWidth, node.clientWidth);
			const first = node.querySelector('li');
			const stride = first?.getBoundingClientRect().width ?? 0;
			const startPad = first?.offsetLeft ?? 0;
			node.scrollLeft = pipRailSnapScrollLeft(
				pipRailCenteredScrollLeft(
					pipRect.left,
					pipRect.width,
					railRect.left,
					railRect.width,
					node.scrollLeft,
					max
				),
				stride,
				max,
				startPad
			);
			applyFades();
		}

		$effect(() => {
			const ro =
				typeof ResizeObserver === 'function'
					? new ResizeObserver(() => scrollSelected())
					: null;
			ro?.observe(node);
			node.addEventListener('scroll', applyFades, { passive: true });
			return () => {
				ro?.disconnect();
				node.removeEventListener('scroll', applyFades);
			};
		});

		$effect(() => {
			void index;
			const raf = requestAnimationFrame(() => scrollSelected());
			return () => cancelAnimationFrame(raf);
		});
	}

</script>

<svelte:window onkeydown={onKey} />

{#if finished}
	<div class="finish card" in:fly={{ y: 12, duration: 300 }}>
		<span class="seal" lang="ko">한글</span>
		<h2>{lab.finish.title}</h2>
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
				<a class="btn" href="/review">Review now →</a>
			{/if}
			{#if nextLab}
				<a class={dueNow > 0 ? 'btn ghost' : 'btn'} href="/lab/{nextLab.id}">Next lab</a>
			{/if}
			{#if confirmingRestart}
				<div class="restart-confirm" role="group" aria-labelledby="restart-confirmation">
					<p id="restart-confirmation">Start over? Your completed lab summary will be cleared.</p>
					<div class="restart-confirm-actions">
						<button class="btn ghost" type="button" use:focusWhen={true} onclick={cancelRestart}>
							Cancel
						</button>
						<button class="btn" type="button" onclick={confirmRestart}>Start over</button>
					</div>
				</div>
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
{:else}
	<header class="head" class:compact={compactHead}>
		<p class="eyebrow">
			Lab {String(lab.number).padStart(2, '0')} · ~{lab.minutes} minutes
			{#if alreadyDone}· completed{/if}
			{#if showResumeNote}
				· picking up at card {index + 1}
			{/if}
		</p>
		<h1>{lab.title}</h1>
		{#if !compactHead}
			<p class="standfirst">{lab.standfirst}</p>
		{/if}
	</header>
	{#if !ready}
		<div class="card step loading" aria-busy="true">
			<div class="skel line-ph" aria-hidden="true"></div>
			<div class="skel work-ph" aria-hidden="true"></div>
			<p class="muted">Loading the lab…</p>
		</div>
	{:else}
	{#if showResumeNote}
		<p class="vh" role="status">
			Picking up at card {index + 1} of {lab.steps.length}.
		</p>
	{/if}
	<nav class="rail-wrap" aria-label="Lab card navigation">
		<div class={['rail-clip', { 'fade-left': fadeLeft, 'fade-right': fadeRight }]}>
			<ol class="rail" {@attach keepSelectedVisible}>
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
		</div>
		<span class="where">Card {index + 1} of {lab.steps.length}</span>
	</nav>

	{#key index}
		<div class="card step" bind:this={cardEl} in:fly={{ y: 10, duration: 260 }}>
			{#if step.act}<p class="eyebrow">{step.act}</p>{/if}
			<h2 class="do" tabindex="-1">{@html labHtml(step.do)}</h2>
			{#if step.hint}<p class="hint">{@html labHtml(step.hint)}</p>{/if}

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
				{:else if step.type === 'liaison'}
					<LiaisonStep {step} {onSettle} {onNudge} />
				{:else if step.type === 'read'}
					<ReadStep {step} {onSettle} {onNudge} />
				{:else}
					{@const _exhaustive: never = step}
				{/if}
			</div>

			{#if feedback || settled}
				<div
					class="advance"
					use:revealAdvance={shouldRevealAdvance(settled, feedback?.tone)}
				>
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
							{@html labHtml(feedback.html)}
						</div>
					{/if}

					{#if settled}
						<div class="foot" in:fade={{ duration: 160 }}>
							<button
								class="btn"
								use:focusWhen={{ active: true, preventScroll: true }}
								onclick={next}
							>{isLast ? 'Finish' : 'Next'}</button>
							<span class="kb">or press Enter</span>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	{/key}
	{/if}
{/if}

{#if !finished}
	{@render letterAsk?.()}
{/if}

<style>
	.head { margin-bottom: var(--s5); }
	.head.compact { margin-bottom: var(--s3); }
	.head h1 { margin: var(--s2) 0 var(--s3); }
	.head.compact h1 {
		margin: 0;
		font-size: 1.15rem;
		line-height: 1.25;
	}

	.standfirst {
		font-family: var(--serif);
		font-size: 1.1rem;
		font-style: italic;
		color: var(--ink-soft);
		line-height: 1.5;
		margin: 0;
		max-width: var(--measure);
	}

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
		padding: 0.45rem 0;
		list-style: none;
		overflow-x: auto;
		overflow-y: hidden;
		overscroll-behavior-x: contain;
		scrollbar-width: none;
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
		display: none;
		height: 0;
	}

	/* Narrow viewports: later pips are off-screen. Keep a thin scrollbar so
	   remaining cards are discoverable; upcoming pips stay non-buttons. */
	@media (max-width: 30rem) {
		.rail {
			scrollbar-width: thin;
			scrollbar-color: var(--rule-strong) transparent;
			padding-bottom: 0.35rem;
		}
		.rail::-webkit-scrollbar {
			display: block;
			height: 4px;
		}
		.rail::-webkit-scrollbar-thumb {
			background: var(--rule-strong);
			border-radius: 2px;
		}
	}

	.rail li { display: flex; flex: 0 0 auto; }

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
		min-width: 2.25rem;
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
		.fb { background: Canvas; border-left-color: ButtonBorder; }
		.fb[data-tone='right'] { background: Canvas; border-left-color: Highlight; }
		.fb[data-tone='wrong'] { background: Canvas; border-left-color: ButtonText; }
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

	/* Programmatically focused on card change for SR/keyboard orientation;
	   it is not an interactive control, so no ring. */
	.do:focus { outline: none; }

	.hint {
		font-size: 0.86rem;
		color: var(--ink-soft);
		margin: 0 0 var(--s4);
	}

	.work { margin-top: var(--s4); }

	.advance {
		scroll-margin-bottom: max(var(--s4), env(safe-area-inset-bottom));
	}

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

	.kb { font-size: 0.7rem; color: var(--ink-faint); margin-inline-start: auto; }

	@media (pointer: coarse) {
		.kb { display: none; }
	}

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
	.restart-confirm {
		display: grid;
		gap: var(--s2);
		padding: var(--s3);
		border: 1px solid var(--rule-strong);
		border-radius: var(--r-md);
		background: var(--paper-sunk);
	}
	.restart-confirm p { margin: 0; }
	.restart-confirm-actions { display: flex; gap: var(--s2); flex-wrap: wrap; justify-content: center; }
</style>
