<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { fly, fade } from 'svelte/transition';
	import { resolve } from '$app/paths';
	import { focusWhen, shouldIgnoreShortcut } from '$lib/a11y/shortcuts';
	import { progress } from '$lib/stores/progress.svelte';
	import { labSession } from '$lib/stores/labSession.svelte';
	import PlayButton from '$lib/components/PlayButton.svelte';
	import SprintChoices from '$lib/components/SprintChoices.svelte';
	import { isConsonantLead } from '$lib/audio/consonants';
	import { checkAnswer, type Card } from '$lib/domain/deck';
	import { DEFAULT_NEW_PER_DAY, attemptSpeed } from '$lib/domain/srs';
	import { sprintEligible, sprintInventory, trialForBlock, type SprintTrial } from '$lib/domain/sprint';
	import { blockInventory } from '$lib/domain/blockDeck';
	import { LABS } from '$lib/content';
	import {
		REVIEW_ANSWER_MAX_LENGTH,
		reviewAnswerPlaceholder,
		reviewBody,
		reviewChrome,
		reviewIntervalCopy,
		sittingQueueAfterGrade
	} from '$lib/domain/reviewChrome';

	let queue = $state<Card[]>([]);
	let index = $state(0);
	let shown = $state(0);
	let right = $state(0);
	let typed = $state('');
	let answered = $state(false);
	let verdict = $state<{ ok: boolean; speed: string; when: string } | null>(null);
	let startedAt = 0;
	let sittingNew = $state(false);
	let input = $state<HTMLInputElement | undefined>();
	let ready = $state(false);
	let emptyHint = $state(false);
	let blockTrial = $state<SprintTrial | null>(null);
	let choices = $state<SprintChoices | undefined>();

	const card = $derived(queue[index]);
	const pronCard = $derived(card?.kind === 'pron');
	const blockCard = $derived(card?.kind === 'block');
	const stats = $derived(progress.stats);
	const unlockedTiers = $derived(
		(['lab01', 'lab02', 'lab03', 'lab04', 'lab05', 'lab06', 'lab07'] as const).filter((tier) =>
			progress.isUnlocked(tier)
		)
	);
	const drillOpen = $derived(sprintEligible(unlockedTiers));
	const body = $derived(
		reviewBody({
			ready,
			unlocked: stats.unlocked,
			sittingLength: queue.length,
			index,
			remainingDue: stats.queue
		})
	);
	const inSession = $derived(body === 'sitting');
	const chrome = $derived(
		reviewChrome({
			ready,
			unlocked: stats.unlocked,
			inSession
		})
	);

	onMount(() => {
		progress.tick();
		start();
		ready = true;
	});

	function start() {
		progress.tick();
		queue = progress.queue;
		index = 0;
		shown = 0;
		right = 0;
		reset();
	}

	function cumulativeInventory(tier: string): string[] {
		const order = ['lab01', 'lab02', 'lab03', 'lab04', 'lab05', 'lab06', 'lab07'];
		const idx = order.indexOf(tier);
		return sprintInventory(order.slice(0, Math.max(idx + 1, 2)));
	}

	function makeBlockTrial(front: string, tier: string): SprintTrial | null {
		const rng = Math.random;
		return (
			trialForBlock(front, blockInventory(tier), rng) ??
			trialForBlock(front, cumulativeInventory(tier), rng)
		);
	}

	async function reset() {
		typed = '';
		answered = false;
		verdict = null;
		emptyHint = false;
		startedAt = Date.now();
		blockTrial = null;
		const current = queue[index];
		if (current?.kind === 'block') {
			blockTrial = makeBlockTrial(current.front, current.tier);
		}
		sittingNew = Boolean(current && !progress.state.cards[current.id]);
		await tick();
		if (!current || current.kind === 'block') {
			/* do not focus the missing input */
		} else {
			input?.focus({ preventScroll: true });
		}
	}

	function submit() {
		if (answered) return next();
		const value = typed.trim();
		if (!value) {
			emptyHint = true;
			return;
		}
		emptyHint = false;

		const ms = Date.now() - startedAt;
		const ok = checkAnswer(card, value);
		const result = progress.answer(card.id, ok, ms);

		answered = true;
		shown += 1;
		if (ok) right += 1;

		verdict = {
			ok,
			speed: ok ? attemptSpeed(ms) : '',
			when: reviewIntervalCopy(result.card.ivl)
		};
	}

	function next() {
		// A missed card returns at the end of this sitting, not only in 10 minutes.
		queue = sittingQueueAfterGrade(queue, index, Boolean(verdict && !verdict.ok));
		index += 1;
		if (index >= queue.length) progress.tick();
		reset();
	}

	function pickBlock(index: number) {
		if (answered || !blockTrial || !card) return;
		if (card.kind === 'block') {
			const value = blockTrial.options[index];
			if (!value) return;
			const ms = Date.now() - startedAt;
			const ok = checkAnswer(card, value);
			const result = progress.answer(card.id, ok, ms);
			answered = true;
			shown += 1;
			if (ok) right += 1;
			verdict = {
				ok,
				speed: ok ? attemptSpeed(ms) : '',
				when: reviewIntervalCopy(result.card.ivl)
			};
		}
	}

	function onKey(e: KeyboardEvent) {
		if (shouldIgnoreShortcut(e.target)) return;
		if (e.key === 'Enter' && answered) {
			e.preventDefault();
			next();
			return;
		}
		if (blockCard && !answered) {
			choices?.keyPick(e.key);
			return;
		}
	}

	const nextDue = $derived(progress.nextDue);

	const whenNext = $derived.by(() => {
		if (nextDue === null) return 'later';
		const hours = Math.max(0, Math.round((nextDue - Date.now()) / 3.6e6));
		if (hours < 1) return 'in under an hour';
		if (hours < 24) return `in about ${hours} hour${hours === 1 ? '' : 's'}`;
		const days = Math.round(hours / 24);
		return `in ${days} day${days === 1 ? '' : 's'}`;
	});
</script>

<svelte:head><title>Daily review</title></svelte:head>
<svelte:window onkeydown={onKey} />

<div class="shell narrow">
	<header class="head" class:compact={inSession}>
		<p class="eyebrow">Spaced repetition</p>
		<h1>Daily Review</h1>
		{#if chrome.showStandfirst}
			<p class="standfirst">
				Type the sound. The clock grades you — a slow correct answer comes back sooner than a
				fast one, because hesitation is the honest signal.
			</p>
		{/if}
	</header>

	{#if ready && (progress.corrupt || labSession.corrupt)}
		<div class="warn card">
			<strong>Saved progress could not be read.</strong> Back it up now — reviews will not
			overwrite the unread file until you restore or reset.
			<a href="{resolve('/settings')}#backup">Download a backup</a>
			<a href="{resolve('/settings')}#reset">Reset progress</a>
		</div>
	{:else if ready && (!progress.durable || !labSession.durable)}
		<div class="warn card">
			<strong>Progress will not be saved.</strong> This browser is blocking storage on this
			origin, so your review history will vanish when you close the tab.
			<a href="{resolve('/settings')}#backup">Download a backup</a>
			before you do anything else, and serve the built app over HTTP rather than
			opening the files directly.
		</div>
	{/if}

	{#if chrome.showStats}
		<div class="strip" role="region" aria-label="Review session statistics">
			<div class="stat" class:hot={stats.queue > 0}><b>{stats.queue}</b><span>to review</span></div>
			<div class="stat"><b>{stats.mature}</b><span>mastered</span></div>
			<div class="stat"><b>{stats.seen}</b><span>reviewed</span></div>
			<div class="stat"><b>{stats.streak}</b><span>day streak</span></div>
		</div>
	{/if}

	{#if body === 'loading'}
		<div class="card empty loading" aria-busy="true">
			<div class="skel glyph-ph" aria-hidden="true"></div>
			<div class="skel line-ph" aria-hidden="true"></div>
			<div class="skel field-ph" aria-hidden="true"></div>
			<p class="muted">Loading Review…</p>
		</div>
	{:else if body === 'locked'}
		<div class="card empty" in:fade>
			<span class="big" lang="ko">한</span>
			<h2>Nothing in Review yet</h2>
			<p>
				Cards unlock as you finish labs, so Review never quizzes you on something you have
				not met. Finish Lab 01 and {LABS[0].steps.length > 0 ? 19 : 0} consonants drop in.
			</p>
			<a class="btn" href={resolve('/lab/[id]', { id: '0001' })}>Start Lab 01</a>
		</div>
	{:else if body === 'check-for-more'}
		<div class="card empty" in:fade>
			<span class="big" lang="ko">{right / Math.max(shown, 1) >= 0.8 ? '좋아' : '또'}</span>
			<h2>{right} of {shown} first time</h2>
			<p>
				{#if right / Math.max(shown, 1) >= 0.9}
					That review is in good shape. The gaps will stretch out on their own.
				{:else if right / Math.max(shown, 1) >= 0.6}
					The ones you missed are already re-queued for a shorter gap. That is the system
					working, not you failing.
				{:else}
					A rough round means the material is still fresh, not that it is lost — missed cards
					come back fast on purpose.
				{/if}
			</p>
			<button class="btn" onclick={start}>Check for more</button>
		</div>
	{:else if body === 'clear'}
		<div class="card empty" in:fade>
			<span class="big" lang="ko">쉬어</span>
			<h2>Review is clear</h2>
			<p>Nothing is due. The next card comes back <strong>{whenNext}</strong>.</p>
			<p class="muted tiny">
				Reviewing early would only weaken the spacing — the gap is doing the work.
				{#if stats.newLeft === 0 && stats.unseen > 0}
					You have also hit today’s cap of {DEFAULT_NEW_PER_DAY} new cards, which keeps sessions short.
				{/if}
			</p>
			{#if drillOpen}
				<p>
					<a class="btn" href={resolve('/drill')}>Read blocks against the clock</a>
				</p>
				<p class="muted tiny">The sprint is not review — it does not write the Review schedule.</p>
			{/if}
		</div>
	{:else if body === 'sitting'}
		{#key index}
			<div class="card review" in:fly={{ y: 10, duration: 220 }} aria-labelledby="review-card-tag">
				<div
					class="bar"
					role="progressbar"
					aria-label="Review progress"
					aria-valuenow={index + 1}
					aria-valuemin={1}
					aria-valuemax={queue.length}
					aria-valuetext="Card {index + 1} of {queue.length}"
				><i style="width:{((index + 1) / queue.length) * 100}%"></i></div>

				<p id="review-card-tag" class="tag" class:isnew={sittingNew}>
					{sittingNew ? 'new card' : 'review'} · {index + 1} of {queue.length}
				</p>

				<div class="glyph-row">
					<div class="glyph" lang="ko">{card.front}</div>
					{#if card.kind === 'consonant' || isConsonantLead(card.front)}
						<PlayButton jamo={card.front} audioSlot="lead" />
					{/if}
				</div>
				<p class="ask">{card.ask}</p>

				{#if !blockCard || !blockTrial}
					<form
						onsubmit={(e) => {
							e.preventDefault();
							submit();
						}}
					>
						<label class="answer-label" for="review-answer">Your answer</label>
						<div class="answer-controls">
							<input
								id="review-answer"
								bind:this={input}
								bind:value={typed}
								class="in"
								class:right={verdict?.ok}
								class:wrong={verdict && !verdict.ok}
								disabled={answered}
								required
								type="text"
								inputmode="text"
								autocapitalize="off"
								autocorrect="off"
								spellcheck="false"
								maxlength={REVIEW_ANSWER_MAX_LENGTH}
								placeholder={reviewAnswerPlaceholder(card.kind)}
								aria-describedby={emptyHint ? 'empty-hint' : undefined}
								aria-invalid={emptyHint ? true : undefined}
								oninvalid={(e) => {
									e.preventDefault();
									emptyHint = true;
								}}
								oninput={() => {
									emptyHint = false;
								}}
							/>
							<button class="btn" type="submit" use:focusWhen={answered}>{answered ? 'Next' : 'Check'}</button>
							{#if answered}
								<span class="kb">or press Enter</span>
							{/if}
						</div>
						{#if emptyHint}
							<p id="empty-hint" class="empty-hint" role="status">
								{pronCard
									? 'Type hyphenated cuts, or Hangul, then Check.'
									: 'Type a romanization, then Check.'}
							</p>
						{/if}
					</form>
				{:else if blockTrial}
					<div class="block-answer">
						{#key index}
							<SprintChoices
								bind:this={choices}
								options={blockTrial.options}
								onPick={pickBlock}
								disabled={answered}
							/>
						{/key}
						{#if answered}
							<button class="btn" type="button" use:focusWhen={answered} onclick={next}>Next</button>
							<span class="kb">or press Enter</span>
						{/if}
					</div>
				{/if}

				{#if verdict}
					<div
						class="fb"
						data-tone={verdict.ok ? 'right' : 'wrong'}
						in:fade={{ duration: 150 }}
						aria-live="polite"
						aria-atomic="true"
					>
						<span class="v">{verdict.ok ? `Correct · ${verdict.speed}` : 'Missed'}</span>
						<span class="ans">
							{card.answers[0]}
							{#if card.answers.length > 1}
								<em>also: {card.answers.slice(1).join(', ')}</em>
							{/if}
						</span>
						<span class="note">{card.note}</span>
						<span class="sched">{verdict.ok ? '' : 'reset — '}{verdict.when}</span>
					</div>
				{/if}
			</div>
		{/key}
	{/if}
</div>

<style>
	.narrow { max-width: 40rem; }
	.head { margin-bottom: var(--s5); }
	.head.compact { margin-bottom: var(--s4); }
	.head.compact h1 { margin-bottom: 0; }
	h1 { margin: var(--s2) 0 var(--s3); font-family: var(--display); font-style: italic; font-weight: 400; }
	.standfirst {
		font-family: var(--display);
		font-style: italic;
		font-size: 1.05rem;
		color: var(--ink-soft);
		margin: 0;
	}

	.warn {
		border-color: var(--bad);
		background: var(--bad-soft);
		padding: var(--s3) var(--s4);
		margin-bottom: var(--s4);
		font-size: 0.86rem;
		line-height: 1.55;
	}

	.strip {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--s2);
		margin-bottom: var(--s5);
	}

	@media (min-width: 40rem) {
		.strip { grid-template-columns: repeat(4, 1fr); }
	}
	.stat {
		border: 1px solid var(--rule);
		border-radius: var(--r-md);
		background: var(--paper-raised);
		padding: var(--s3) var(--s2);
		text-align: center;
	}
	.stat.hot { border-color: var(--rose); background: var(--rose-soft); }
	.stat.hot b { color: var(--rose); }
	.stat b {
		font-family: var(--mono);
		font-size: 1.35rem;
		display: block;
		font-variant-numeric: tabular-nums;
	}
	.stat span {
		font-size: 0.72rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--ink);
	}

	.review { padding: var(--s5); }

	.bar {
		height: 3px;
		background: var(--rule);
		border-radius: 2px;
		overflow: hidden;
		margin-bottom: var(--s4);
	}
	.bar i { display: block; height: 100%; background: var(--accent); transition: width var(--med) var(--ease); }

	.tag {
		text-align: center;
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.13em;
		text-transform: uppercase;
		color: var(--accent);
		margin: 0;
	}
	.tag.isnew { color: var(--blue); }

	.glyph-row {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--s2);
		margin: var(--s3) 0 var(--s2);
	}

	.glyph {
		font-family: var(--hangul);
		font-size: clamp(3.2rem, 10vw + 1.5rem, 6.5rem);
		font-weight: 500;
		line-height: 1.05;
		text-align: center;
	}

	@media (max-height: 52rem) {
		.glyph { font-size: clamp(2.6rem, 6vw + 1rem, 4rem); }
	}

	.ask { text-align: center; font-size: 0.84rem; color: var(--ink-soft); margin: 0 0 var(--s4); }

	form {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: var(--s1);
	}

	.block-answer {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: var(--s1);
	}

	.block-answer .btn {
		min-height: 44px;
	}

	.answer-controls {
		display: flex;
		align-items: stretch;
		gap: var(--s2);
	}

	.answer-controls .in {
		flex: 1 1 auto;
		min-width: 0;
		width: auto;
	}

	.answer-controls .btn {
		flex: 0 0 auto;
		align-self: stretch;
		height: auto;
	}

	@media (max-width: 36rem) {
		.answer-controls { flex-wrap: wrap; }
		.answer-controls .in,
		.answer-controls .btn { flex: 1 1 100%; }
		.answer-controls .btn { justify-content: center; }
	}

	.answer-label {
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--ink-faint);
	}

	.empty-hint {
		margin: 0;
		font-size: 0.82rem;
		color: var(--ink);
	}

	.in {
		width: 100%;
		border: 1px solid var(--rule-strong);
		border-radius: var(--r-md);
		background: var(--paper-sunk);
		color: var(--ink);
		font-family: var(--mono);
		font-size: 1.15rem;
		padding: 0.7rem 0.9rem;
	}
	.in::placeholder {
		overflow: hidden;
		text-overflow: ellipsis;
		color: var(--ink-faint);
	}
	.in:focus-visible {
		outline: 2px solid var(--paper);
		outline-offset: 2px;
		box-shadow: var(--focus-ring);
	}
	.in:hover:not(:disabled) {
		border-color: var(--accent);
	}
	.in:user-invalid,
	.in[aria-invalid='true'] {
		border-color: var(--bad);
	}
	.in:hover:not(:disabled):user-invalid,
	.in:hover:not(:disabled)[aria-invalid='true'] {
		border-color: var(--bad);
	}
	.answer-controls .in.right { border-color: var(--good); background: var(--good-soft); color: var(--good); }
	.answer-controls .in.wrong { border-color: var(--bad); background: var(--bad-soft); color: var(--bad); }

	@media (forced-colors: active) {
		.stat {
			background: Canvas;
			color: CanvasText;
			border-color: ButtonBorder;
		}
		.stat.hot { border-color: Highlight; background: Canvas; }
		.bar { background: ButtonBorder; }
		.bar i { background: Highlight; }
		.in {
			background: Canvas;
			color: CanvasText;
			border-color: ButtonBorder;
		}
		.in.right { border-color: Highlight; background: Canvas; color: CanvasText; }
		.in.wrong { border-color: ButtonText; background: Canvas; color: CanvasText; }
		.ans em { color: CanvasText; }
	}

	.fb {
		margin-top: var(--s4);
		padding: var(--s3) var(--s4);
		border-radius: var(--r-md);
		border-inline-start: 3px solid var(--rule-strong);
		background: var(--paper-sunk);
		font-size: 0.87rem;
		line-height: 1.6;
	}
	.fb[data-tone='right'] { border-inline-start-color: var(--good); background: var(--good-soft); }
	.fb[data-tone='wrong'] { border-inline-start-color: var(--bad); background: var(--bad-soft); }

	.v {
		display: block;
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		margin-bottom: var(--s1);
	}
	.fb[data-tone='right'] .v { color: var(--good); }
	.fb[data-tone='wrong'] .v { color: var(--bad); }

	.ans { display: block; font-family: var(--mono); font-size: 1.05rem; margin-bottom: var(--s1); }
	.ans em { font-size: 0.78rem; color: var(--ink-soft); font-style: normal; }
	.note { display: block; color: var(--ink-soft); }
	.sched {
		display: block;
		margin-top: var(--s2);
		font-family: var(--mono);
		font-size: 0.7rem;
		color: var(--ink-faint);
	}

	.kb {
		font-size: 0.7rem;
		color: var(--ink-faint);
		align-self: center;
		margin-inline-start: auto;
	}

	@media (pointer: coarse) {
		.kb { display: none; }
	}

	.empty { padding: var(--s7) var(--s5); text-align: center; }
	.empty .big { font-family: var(--hangul); font-size: 3.2rem; display: block; margin-bottom: var(--s3); }
	.empty h2 { margin-bottom: var(--s2); }
	.empty p { color: var(--ink-soft); font-size: 0.92rem; max-width: 28rem; margin: 0 auto var(--s4); }

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
	.loading .field-ph {
		width: 100%;
		max-width: 22rem;
		height: 2.8rem;
		border-radius: var(--r-md);
	}
	.loading .muted { margin: var(--s2) 0 0; }
</style>
